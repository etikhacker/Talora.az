# Detailed internship curricula v2 — Free tool guides

Date: 2026-11-09

## Goal

Rework the ten newly launched Talora internship programmes to be beginner-friendly.
100 published tasks have **both AZ and EN** explanations with:

- Clear assignment goal and a topic-specific practical example
- Named free platforms with official website URLs and first-use instructions
- Eight numbered execution steps in each language
- Concrete deliverables, file/link guidance, attribution and privacy notes
- Transparent 100-point scoring rubric and a pre-submission checklist

## Coverage

Business Analysis, Project Management, Human Resources, Digital Marketing,
Content Writing, Social Media Management, Graphic Design, Video Editing,
Instructional Design and Prompt Engineering.

## Free tools used

| Tool | Student use | Notes |
| --- | --- | --- |
| Google Docs, Sheets, Slides, Forms | Reports, tables, slides, surveys | Free personal use; sign-in may be required |
| diagrams.net | BPMN, workflows, data diagrams | Free/open-source |
| Trello Free | Sprint/task board | Free plan has board and collaborator limits |
| Canva Free | Social graphics and templates | Choose Free assets, avoid Pro features |
| Figma Starter | UI, brand kits, typography | Free plan has project/team limits |
| Inkscape | SVG logos and vector artwork | Free/open-source |
| Kdenlive, Audacity | Video and sound editing | Free/open-source; local device required |
| Google Trends | Public search-interest trends | Trends index is not search volume |
| Google AI Studio free tier / ChatGPT Free | Manual LLM prompt evaluations | Free usage limits vary; **no paid billing or API keys** required |
| Python, Visual Studio Code, GitHub Free | JSON validation, code and portfolios | Free tiers/open-source; no keys committed |

Free limits and features can change. Students may use alternative no-cost tools with the
same deliverable. Never require a paid feature, ad purchase, cloud subscription, API
key or actual personal user data to complete a curriculum task.

## Deployment approach

The existing Talora task view renders localized Markdown sections from database text
fields using `[[AZ]]` / `[[EN]]` markers. **No app code deployment is needed.**

The content-only SQL transactions under `scripts/career-guides-v2/`:

1. Verify the exact original task title, number, description and instructions, rejecting unexpected manual edits.
2. Update **only** `public.internship_tasks.description` and `instructions` for the ten named programmes.
3. Verify that ten required/published tasks in the specific programme match the new content.
4. Commit or roll back that programme atomically. The old content is retained in each SQL script under `old_description` and `old_instructions` for audit and possible guarded rollback.

The files are intentionally one programme per transaction to reduce risk and keep
production updates manageable. The original seed script remains as the baseline.

## Verification

- GitHub Actions: `Detailed free curricula content regression` static and PostgreSQL 17 jobs passed.
- Production verification after all ten transactions:
  - **10 programmes, 100 new tasks with detailed AZ/EN guides**
  - Minimum instruction length above 5,800 characters (both languages combined)
  - Every guide has step-by-step instructions, free tools, deliverables and 100-point rubric
  - All 100 tasks remain required and published
  - **18** total published internships and **180** total tasks
  - Existing application, enrollment and certificate data were not updated by these SQL scripts
- No paid Supabase services, branches, external APIs or Vercel deployments were created.

## Caveats

- Tools' external web pages are written as text in task content. The current task
  Markdown renderer does not automatically hyperlink URLs, so students can copy
  the links or navigate to the named official websites.
- Existing student submissions are preserved; instructors should assess previously
  submitted work according to the terms in effect at submission time and
  inform enrolled students that the instructions were expanded.
- This PR is content/audit only. Avoid merging solely to trigger a Vercel
  deployment while the Free plan's daily deployment quota is exhausted.
