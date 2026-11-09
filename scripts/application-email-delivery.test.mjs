import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  claimDecisionDelivery,
  completeDecisionDelivery,
  publicDeliverySummary,
  classifyDeliveryFailure,
} from '../lib/email/application-delivery.ts';

const application = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'accepted',
  reviewed_at: '2026-11-09T18:00:00.000Z',
  updated_at: '2026-11-09T18:00:00.000Z',
  created_at: '2026-11-09T17:00:00.000Z',
};

// In-memory PostgREST shape; deliberately no network or student messages.
function fakeDb() {
  let rows = [];
  return {
    setAttemptsAge(ms) {
      rows = rows.map(x => ({ ...x, last_attempt_at: new Date(Date.now() - ms).toISOString() }));
    },
    get rows() { return rows; },
    from(table) {
      assert.equal(table, 'application_email_deliveries');
      let operation = 'read';
      let payload = null;
      let filters = [];
      const builder = {
        select() { return builder; },
        eq(key, value) { filters.push([key, value]); return builder; },
        insert(value) { operation = 'insert'; payload = value; return builder; },
        update(value) { operation = 'update'; payload = value; return builder; },
        maybeSingle() {
          const original = rows.find(row => filters.every(([key, value]) => row[key] === value)) || null;
          if (operation === 'update') {
            if (!original) return Promise.resolve({ data: null, error: null });
            const updated = { ...original, ...payload };
            rows = rows.map(x => x.id === original.id ? updated : x);
            return Promise.resolve({ data: updated, error: null });
          }
          return Promise.resolve({ data: original, error: null });
        },
        single() {
          if (operation !== 'insert') throw new Error('Unexpected single()');
          if (rows.some(x => x.application_id === payload.application_id && x.decision_version === payload.decision_version)) {
            return Promise.resolve({ data: null, error: { code: '23505' } });
          }
          const row = {
            id: crypto.randomUUID(), attempts: 1, attempt_token: crypto.randomUUID(),
            last_attempt_at: new Date().toISOString(), sent_at: null, last_error_code: null,
            ...payload,
          };
          rows.push(row);
          return Promise.resolve({ data: row, error: null });
        },
      };
      return builder;
    },
  };
}

test('automatic delivery is at-most-once per application decision even on re-entry', async () => {
  const db = fakeDb();
  const first = await claimDecisionDelivery(db, application, false, false);
  assert.equal(first.allowed, true);
  await completeDecisionDelivery(db, first.receipt, 'sent');
  const second = await claimDecisionDelivery(db, application, false, false);
  assert.equal(second.allowed, false);
  assert.equal(second.reason, 'already_processed');
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].attempts, 1);
});

test('manual resend requires explicit confirmation and never bypasses 60-second cooldown', async () => {
  const db = fakeDb();
  assert.equal((await claimDecisionDelivery(db, application, true, false)).reason, 'confirmation_required');
  const first = await claimDecisionDelivery(db, application, true, true);
  assert.equal(first.allowed, true);
  await completeDecisionDelivery(db, first.receipt, 'sent');
  assert.equal((await claimDecisionDelivery(db, application, true, true)).reason, 'cooldown');
  db.setAttemptsAge(61_000);
  assert.equal((await claimDecisionDelivery(db, application, true, false)).reason, 'confirmation_required');
  const second = await claimDecisionDelivery(db, application, true, true);
  assert.equal(second.allowed, true);
  assert.equal(second.receipt.attempts, 2);
});

test('active sending is blocked; stale claims require explicit retry confirmation', async () => {
  const db = fakeDb();
  const first = await claimDecisionDelivery(db, application, false, false);
  assert.equal(first.allowed, true);
  assert.equal((await claimDecisionDelivery(db, application, true, true)).reason, 'sending');
  db.setAttemptsAge(301_000);
  assert.equal((await claimDecisionDelivery(db, application, true, false)).reason, 'confirmation_required');
  const retry = await claimDecisionDelivery(db, application, true, true);
  assert.equal(retry.allowed, true);
  assert.notEqual(retry.receipt.attempt_token, first.receipt.attempt_token);
  assert.equal(db.rows[0].attempts, 2);
});

test('timeout/5xx are uncertain and successful API acceptance is not inbox delivery', () => {
  assert.deepEqual(classifyDeliveryFailure(new Error('GMAIL_API_SEND_UNCERTAIN_TIMEOUT')), {
    state: 'uncertain', code: 'GMAIL_API_SEND_UNCERTAIN_TIMEOUT',
  });
  assert.equal(classifyDeliveryFailure(new Error('GMAIL_API_SEND_HTTP_503')).state, 'uncertain');
  assert.equal(classifyDeliveryFailure(new Error('GMAIL_API_TOKEN_HTTP_400')).state, 'failed');
  assert.equal(classifyDeliveryFailure(new Error('sensitive data')).code, 'EMAIL_TRANSPORT_FAILURE');
  assert.equal(publicDeliverySummary(null), null);
  assert.equal(publicDeliverySummary({
    state: 'sending', last_attempt_at: new Date(Date.now() - 400_000).toISOString(),
    attempts: 1, sent_at: null, last_error_code: null,
  }).state, 'uncertain');
});
