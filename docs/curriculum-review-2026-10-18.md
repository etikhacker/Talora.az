# Curriculum clarity review — 18 October 2026

Reviewed the live 80 tasks across eight internship tracks (10 tasks each), including their Azerbaijani and English instructions.

All tasks now include a concrete, task-specific example and an observable completion check. Removed the old platform repository exclusion from both languages. Clarified the document Q&A starter, the HTML-to-React transition, design-system component counts, and the difference between design accessibility annotations and implemented keyboard/screen-reader checks. Renamed the five early “Final” integration exercises so Task 10 remains the final handoff.

The live update verified all 80 expected content hashes, with zero old repository references in the reviewed instructions/descriptions. Only title, description and instructions were updated. Task identities, order, approval state, deadlines and student submissions were not changed.

The landing page now includes a dismissible development notice in Azerbaijani and English, with a link to the contact page. Verified at desktop and 390px mobile widths in light/dark themes, including dismissal and contact navigation. Production build and the six existing task-content/rendering checks passed.

## Reproducing a reviewed content update

1. Export the current tasks from Supabase SQL Editor as CSV, with `id`, `internship_id`, `track` (the internship title), `task_number`, `title`, `description`, `instructions` and `status` columns.
2. Review the current wording and adjust `scripts/curriculum-clarifications.mjs` for that snapshot.
3. Run `node scripts/prepare-curriculum-review.mjs <snapshot.csv> <private-artifact-directory>`.
4. Review the generated `review.json` and `apply.sql`. Keep the snapshot and generated `rollback.sql` as recovery artifacts.
5. Execute the reviewed content transaction in the verified Talora database. It locks the target rows and refuses to overwrite changed source content. The final verification must show `verified_task_count = 80` and `old_repository_references = 0`.

This is an administrative content update; it creates no schema objects and adds no schema migration. Do not edit or reapply historical curriculum migrations to change current task content.

## Sources checked for revised instructions

- [Vite starter and React TypeScript template](https://vite.dev/guide/)
- [WCAG 2.2 contrast requirements](https://www.w3.org/TR/WCAG22/#contrast-minimum)
