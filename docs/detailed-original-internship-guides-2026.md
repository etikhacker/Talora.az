# Existing internship programmes — expanded beginner guides

Date: 2026-11-09

## Motivation

Expand the **original eight Talora internships** (80 tasks) with clear AZ/EN
beginner instructions and no-cost tools, using the same teaching standard as
the ten newer careers. The original task descriptions already contained useful
specific requirements; those requirements must not be lost.

## Programmes

| Programme | Tasks | Free tools (examples) |
| --- | ---: | --- |
| Applied AI Engineering | 10 | Google AI Studio free tier / ChatGPT Free, Python, VS Code, GitHub Free |
| Automation Engineering | 10 | Python, FastAPI, diagrams.net, curl, Google Sheets |
| Backend Engineering | 10 | Python, FastAPI, local PostgreSQL, pytest, VS Code, GitHub Free |
| Cybersecurity | 10 | OWASP ZAP passive-only, localhost demos, Python, curl, VS Code |
| Data Analytics | 10 | Python, pandas, SQLite, Matplotlib, Google Sheets |
| Frontend Engineering | 10 | Node.js, Vite, React, Vitest, Chrome DevTools, GitHub Free |
| Mobile Development | 10 | Expo Go / local Expo CLI, Node.js, VS Code |
| UI/UX Design | 10 | Penpot, Figma Starter, diagrams.net, WebAIM Contrast Checker |

All tools are used with local or fictional exercises and no paid-only features.
Free tier quotas can change. For API and cloud workflows, locally mocked data
and services are acceptable. Cybersecurity practice is permitted only on
localhost or a clearly authorized lab. Real user credentials, private data and
production systems are out of scope.

## Assignment format

Each of the 80 task briefs now contains, in **both AZ and EN**:

- Beginner-friendly explanation and a specific example tied to that task.
- Official free tool links and how to start with them.
- Eight clear implementation stages, including three custom technical steps.
- Worked example, expected output and normal/invalid test guidance.
- Deliverables, source files, README and a short explanation.
- A **learning-oriented** 100-point self-check rubric and final checklist.
- **Unchanged original official requirements**, retained in full, verbatim.

Existing grades and assessment history do not change. The new suggested
100-point rubric is for learning guidance only and must not be applied
retroactively to previously graded submissions.

## Data integrity and deployment

The eight SQL files `scripts/legacy-guides-v2/update-<slug>.sql` include exact
original and updated content. Each is a separate guarded transaction that:

1. Compares title, task number and *exact original* description/instructions.
2. Requires ten published/required tasks for precisely one programme.
3. Updates **only** `public.internship_tasks.description` and `instructions`.
4. Verifies ten exact resulting rows before COMMIT; any mismatch rolls back.

No task IDs, schedules, requirements, status, student submissions, scores,
applications, enrollments, RLS, payments or certificates are changed. The
original content is retained in the SQL JSON payload for audit or a future
guarded rollback. Do not rerun a transaction after applying it: by design the
original-version check will reject a second run.

The currently deployed student task page dynamically reads Supabase text and
renders existing AZ/EN markers. Updating the database content does **not**
require a new Vercel deployment or a paid Supabase branch.

## Verification

- Static Node.js test validates 80 task IDs/orders, locale markers, official
  requirements preserved, tool URLs and exactly eight new AZ/EN stages each.
- PostgreSQL 17 GitHub CI simulates all eight guarded transactions against the
  exact original task content; it verifies an unrelated task and a dummy
  previously-approved submission remain unchanged.
- After production update, verify 80 expanded published/required tasks and
  unchanged global internship, task and submission counts.

## Operational notes

URLs in the task text may render as plain text because the existing
safe-Markdown display supports headings, lists, inline code, emphasis, and
code blocks, but does not automatically create clickable links. Students can
copy the official URLs.

Retain this change as a Draft PR while confirming the live content. Merging
the content-only PR is not a prerequisite for the database update and could
unnecessarily trigger a Vercel deployment if the Free quota is exhausted.
