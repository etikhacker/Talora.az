-- Allow a student to acknowledge their OWN inbox notifications.
-- Existing RLS policies already scope SELECT and UPDATE to auth.uid().
-- Do not grant UPDATE on any other field (owner, event kind, content, etc).
GRANT UPDATE (read_at) ON TABLE public.student_notifications TO authenticated;
