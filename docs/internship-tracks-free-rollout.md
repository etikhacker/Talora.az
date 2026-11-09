# Free-plan internship track rollout

## Scope

This PR is independent from the draft Courses PR #36.

It works with the production schema as-is: existing `public.internships.category TEXT`.
It creates no database tables and needs no Supabase branch or paid cloud resource.

## Changes

- Shared category taxonomy grouped by Technology, AI/Prompt Engineering, Business, Communication, Design/Creativity, and Education/Learning.
- Reusable admin category selector on both create and edit pages; unknown legacy/custom category values are preserved.
- Public internship catalogue now shows five career track groups with counts based only on actually published programmes.
- Groups with no published programmes say **Coming soon**, are not filterable, and cannot be mistaken for open internships.
- The original category chip filter still shows exact categories only when published internships exist.

## Validation

- GitHub Actions static regression for taxonomy, legacy compatibility, existing table-only writes and public availability behavior.
- Existing task and security regression workflows are unchanged.
- Vercel Preview build and Next.js compile/type-check must succeed before merge.

## Release criteria

- [ ] New track selector renders in admin create/edit and retains custom legacy values
- [ ] Public track counts reflect only active/published programmes
- [ ] No frontend claims of nonexistent internships
- [ ] Existing internships, applications, tasks and certificate flows unaffected
- [ ] Preview build and GitHub CI pass
- [ ] Explicit production merge/deploy decision

## Data behavior

No fake internships are seeded. A new track displays **Coming soon** until an admin publishes a real internship with that category.

Courses remain in draft PR #36 with feature flag off. This PR can ship separately and without a Courses schema migration.
