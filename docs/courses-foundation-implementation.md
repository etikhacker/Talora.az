# Talora Courses Foundation — Phase 01/02

Status: GitHub feature branch only; production migration NOT applied.

## Audit baseline (2026-11-09)
- GitHub: etikhacker/Talora.az, main commit 3e5ea7c4b0bc2d43e383813d97c0feb610f32402.
- Vercel: talora-az production deployment dpl_7tmGSHyTvLvf16r4JvkaMJa1wK7N uses exactly that commit.
- Supabase: Talora.az project vjxvulaexkaijbuilsoh (active, 8 internships, 80 internship tasks, 11 applications).
- Existing categories: AI, Automation, Backend, Cybersecurity, Data, Frontend, Mobile Development, UI/UX Design.
- Existing RLS authorization relies on private.is_admin(), not the frontend email guard.
- Database inspection did not find public.handle_updated_at(), although older repository migrations reference it; this migration uses its own private trigger helper.
- Supabase development branches: none. Do not apply this migration directly to production.

## Implemented in migration
- Hierarchical categories with localized names and existing category backfill.
- Nullable internships.category_id; existing internships.category stays unchanged.
- Courses, course_modules, course_lessons, course_enrollments and lesson_progress.
- RLS: anonymous public catalog; registered students may enroll themselves and view lessons only for their enrolled published course; admin may manage course content.
- Constraints prevent duplicate enrollment/progress and reject cross-course lesson completion.
- Only student-owned progress INSERTs are supported; students cannot forge a completed course status.
- Course progress is learner-declared, not proof of watching videos. Completion percentage is derived from required published lessons; no paid certificates in the MVP.

## Staging rollout sequence
1. Provision an isolated Supabase staging database with parity to production schema and representative anonymized fixtures. Check any branch cost before creation.
2. Review GitHub migration history versus the Supabase migration ledger. Older files have version/name differences; reconcile before executing the new migration.
3. Apply 20261109000000_courses_foundation.sql on staging using the approved migration workflow.
4. Run scripts/courses-foundation-schema-smoke.sql and inspect all RLS policy grants.
5. Use separate anon, student A, student B and admin test sessions to test access, not a service-role client (which bypasses RLS).
6. Test duplicate enrollments, cross-course progress rejection, draft lesson denial, and published course access.
7. Run all existing internship, application, task, notification and certificate regression tests.
8. Review Supabase security/performance advisors, then connect the frontend and admin panel in a later PR.
9. Production rollout: expand schema first, verify, deploy tested application, monitor errors. No destructive rollback of courses with student progress.

## Existing findings to investigate independently
- Supabase security advisor flags get_public_certificate(text) and student_leave_internship(uuid) as callable SECURITY DEFINER RPCs. Check function bodies and intended public use before changing execute grants.
- Supabase Auth leaked-password protection is disabled.
- Supabase performance advisor flagged multiple permissive policies and unused indexes. Do not drop indexes solely because they show zero usage.

## Explicit non-goals for this migration
- No production write, deployment, payment flow change, certificate schema modification or deletion of internship data.
- No new instructor or community-admin role, and no seed courses that have not been reviewed.
- No migration to remove the legacy internships.category string.