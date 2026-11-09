import type { createAdminClient } from '@/lib/supabase/server';

type AdminClient = NonNullable<Awaited<ReturnType<typeof createAdminClient>>>;
export type DecisionStatus = 'accepted' | 'rejected';
export type EmailDeliveryState = 'sending' | 'sent' | 'failed' | 'uncertain' | 'skipped';

export interface DecisionSnapshot {
  id: string;
  status: string;
  reviewed_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface EmailDeliveryReceipt {
  id: string;
  application_id: string;
  decision_status: DecisionStatus;
  decision_version: string;
  state: EmailDeliveryState;
  attempts: number;
  attempt_token: string;
  last_trigger: 'automatic' | 'manual';
  last_attempt_at: string;
  sent_at: string | null;
  last_error_code: string | null;
  updated_at: string;
}

export function decisionVersion(app: DecisionSnapshot): string {
  return app.reviewed_at || app.updated_at || app.created_at;
}

export function publicDeliverySummary(row: EmailDeliveryReceipt | null) {
  if (!row) return null;
  const staleSending = row.state === 'sending'
    && Date.now() - new Date(row.last_attempt_at).getTime() > 5 * 60_000;
  return {
    state: staleSending ? 'uncertain' as const : row.state,
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    sentAt: row.sent_at,
    errorCode: row.last_error_code,
    requiresManualCheck: staleSending || row.state === 'uncertain',
  };
}

export async function findDecisionDelivery(admin: AdminClient, app: DecisionSnapshot) {
  const { data, error } = await admin
    .from('application_email_deliveries')
    .select('*')
    .eq('application_id', app.id)
    .eq('decision_version', decisionVersion(app))
    .maybeSingle();
  if (error) throw new Error('EMAIL_LEDGER_READ_FAILED');
  return (data || null) as EmailDeliveryReceipt | null;
}

export interface DeliveryClaim {
  allowed: boolean;
  reason?: 'already_processed' | 'sending' | 'cooldown' | 'confirmation_required' | 'concurrent_request';
  receipt: EmailDeliveryReceipt | null;
}

// The UNIQUE(application_id, decision_version) constraint is the automatic
// idempotency barrier. Manual retries use a CAS update on attempt_token,
// preventing parallel admin clicks from dispatching duplicate messages.
export async function claimDecisionDelivery(
  admin: AdminClient,
  app: DecisionSnapshot,
  manual: boolean,
  confirmed: boolean
): Promise<DeliveryClaim> {
  const existing = await findDecisionDelivery(admin, app);
  if (!existing) {
    if (manual && !confirmed) {
      return { allowed: false, reason: 'confirmation_required', receipt: null };
    }
    const { data, error } = await admin
      .from('application_email_deliveries')
      .insert({
        application_id: app.id,
        decision_version: decisionVersion(app),
        decision_status: app.status,
        state: 'sending',
        attempts: 1,
        attempt_token: crypto.randomUUID(),
        last_trigger: manual ? 'manual' : 'automatic',
      })
      .select('*')
      .single();
    if (error?.code === '23505') {
      return { allowed: false, reason: 'concurrent_request', receipt: await findDecisionDelivery(admin, app) };
    }
    if (error) throw new Error('EMAIL_LEDGER_CLAIM_FAILED');
    return { allowed: true, receipt: data as EmailDeliveryReceipt };
  }

  if (!manual) return { allowed: false, reason: 'already_processed', receipt: existing };

  const elapsed = Date.now() - new Date(existing.last_attempt_at).getTime();
  if (existing.state === 'sending' && elapsed < 5 * 60_000) {
    return { allowed: false, reason: 'sending', receipt: existing };
  }
  if (elapsed < 60_000) return { allowed: false, reason: 'cooldown', receipt: existing };
  if (!confirmed) return { allowed: false, reason: 'confirmation_required', receipt: existing };

  const { data, error } = await admin
    .from('application_email_deliveries')
    .update({
      state: 'sending',
      attempts: existing.attempts + 1,
      attempt_token: crypto.randomUUID(),
      last_trigger: 'manual',
      last_attempt_at: new Date().toISOString(),
      sent_at: null,
      last_error_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .eq('attempt_token', existing.attempt_token)
    .eq('state', existing.state)
    .select('*')
    .maybeSingle();

  if (error) throw new Error('EMAIL_LEDGER_RETRY_FAILED');
  if (!data) return { allowed: false, reason: 'concurrent_request', receipt: await findDecisionDelivery(admin, app) };
  return { allowed: true, receipt: data as EmailDeliveryReceipt };
}

export async function completeDecisionDelivery(
  admin: AdminClient,
  receipt: EmailDeliveryReceipt,
  state: EmailDeliveryState,
  errorCode: string | null = null
): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('application_email_deliveries')
    .update({
      state,
      sent_at: state === 'sent' ? now : null,
      last_error_code: errorCode,
      updated_at: now,
    })
    .eq('id', receipt.id)
    .eq('attempt_token', receipt.attempt_token)
    .eq('state', 'sending')
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('EMAIL_LEDGER_FINALIZE_FAILED');
}

export async function recordSkippedDecisionDelivery(
  admin: AdminClient,
  app: DecisionSnapshot,
  reason: string
): Promise<void> {
  const { error } = await admin
    .from('application_email_deliveries')
    .insert({
      application_id: app.id,
      decision_version: decisionVersion(app),
      decision_status: app.status,
      state: 'skipped',
      attempts: 0,
      last_error_code: reason,
      last_trigger: 'automatic',
    });
  if (error && error.code !== '23505') throw new Error('EMAIL_LEDGER_SKIP_FAILED');
}

export function classifyDeliveryFailure(error: unknown): { state: 'failed' | 'uncertain'; code: string } {
  const message = error instanceof Error ? error.message : '';
  const code = /^GMAIL_API_[A-Z0-9_]+$/.test(message) ? message : 'EMAIL_TRANSPORT_FAILURE';
  const ambiguous = /UNCERTAIN|TIMEOUT|SEND_UNCONFIRMED|SEND_HTTP_5\d\d/.test(message)
    || (message === 'Timeout');
  return { state: ambiguous ? 'uncertain' : 'failed', code };
}
