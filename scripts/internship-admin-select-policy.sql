-- Add an admin-only SELECT policy without weakening the public catalogue.
-- Existing SELECT policy permits published rows only for anon/authenticated.
-- Without this additive policy, admin can't list or edit unpublished drafts.
-- The predicate is the same existing private.is_admin() already used by
-- internship INSERT/UPDATE/DELETE policies.
CREATE POLICY internships_admin_select ON public.internships
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
