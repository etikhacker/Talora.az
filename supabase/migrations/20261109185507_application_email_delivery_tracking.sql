-- Application decision email receipts: one row per decision/version.
-- This records provider acceptance, not confirmed inbox delivery.
-- Historical emails sent before this migration are deliberately NOT backfilled.
CREATE TABLE IF NOT EXISTS public.application_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  decision_status text NOT NULL CHECK (decision_status IN ('accepted', 'rejected')),
  decision_version timestamptz NOT NULL,
  state text NOT NULL CHECK (state IN ('sending', 'sent', 'failed', 'uncertain', 'skipped')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 0),
  attempt_token uuid NOT NULL DEFAULT gen_random_uuid(),
  last_trigger text NOT NULL DEFAULT 'automatic' CHECK (last_trigger IN ('automatic', 'manual')),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT application_email_deliveries_unique_decision UNIQUE (application_id, decision_version)
);

CREATE INDEX IF NOT EXISTS application_email_deliveries_application_latest_idx
ON public.application_email_deliveries (application_id, decision_version DESC);

-- No browser access or public policies; all operations must go through
-- the authenticated sole-admin API using the server-only service-role key.
ALTER TABLE public.application_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_email_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.application_email_deliveries TO service_role;
