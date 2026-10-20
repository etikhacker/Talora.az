# Talora

**From learning to real experience.**

Talora is a bilingual internship management platform for students and program administrators. It brings program discovery, applications, weekly assignments, feedback, progress tracking, and certificate requests into one place.

[Visit Talora](https://talora-az.vercel.app) · [Repository](https://github.com/etikhacker/Talora.az) · [Report an issue](https://github.com/etikhacker/Talora.az/issues)

> **Active development:** Features and interfaces are still being improved. Please report problems through the website's contact page or GitHub Issues. Do not include passwords, recovery links, payment receipts, or other private information in public reports.

## What the platform includes

### Public website

- A landing page with motion effects and an introduction to the platform.
- An internship catalog with search, category and difficulty filters, sorting, and program details.
- About, how-it-works, contact, terms, and privacy pages.
- Azerbaijani and English interfaces, with light and dark themes.
- Public certificate verification at `/certificate/[certificateId]`.

### Student portal

- Email/password registration, sign-in, and password recovery.
- Profile information, avatar uploads, and notification preferences.
- Internship applications and application status tracking.
- Access to enrolled programs, including a program selector for multiple active internships.
- Weekly assignments with structured instructions, code highlighting, and status filters.
- Task submissions using the formats required by the assignment: text, links, GitHub repositories, and files.
- Submission history, review feedback, and revision requests.
- Progress tracking, notifications, certificate requests, and payment receipt uploads.

### Admin panel

- An overview of platform activity.
- Internship creation, editing, publication, and lifecycle management.
- Application review and student enrollment management.
- Task authoring, scheduling, submission review, and feedback.
- Student records and completed internship management.
- Certificate pricing, payment instructions, receipt review, issuance, and revocation.
- Contact messages, notifications, and platform settings.

## How it works

1. A student finds a program and submits an application.
2. An administrator reviews the application. Acceptance creates an enrollment.
3. The student opens assignments for the enrolled program and submits their work.
4. An administrator approves the work, requests revisions, or rejects the submission with feedback.
5. Program completion and certificate eligibility are checked against the platform's requirements.
6. Where certificate payments are enabled, the student follows the payment instructions and uploads a receipt.
7. An administrator reviews the payment and issues the certificate. Issued certificates can be verified publicly.

### Payments and certificates

Certificate payments use a **manual transfer and review process**, not an integrated payment gateway. Administrators can configure a bank card number, an m10 phone number, or both, along with the certificate price and currency.

The student makes the transfer outside Talora and submits a receipt. Entering an m10 number does not automatically collect money or confirm payment. Certificate files are prepared and uploaded through the administrative workflow.

## Technology

| Layer | Implementation |
| --- | --- |
| Application | Next.js 15 App Router, React 19, TypeScript |
| Interface | Tailwind CSS 4, reusable UI components, Lucide icons, Motion |
| Forms | React Hook Form and Zod |
| Backend | Supabase PostgreSQL, Auth, Storage, and database functions |
| Access control | Database row-level security and server-side authorization checks |
| Application email | Nodemailer with Gmail SMTP |
| Hosting | Vercel, connected to GitHub |
| Regression checks | Node.js test runner and repository-specific scripts |

Application data comes from Supabase. This repository is the working application, not a static design demo.

## Local development

### Prerequisites

- Node.js 24.x to match the production runtime.
- npm, or Bun if using the committed `bun.lock`.
- A Supabase development project with the required schema, policies, and storage configuration.

### Install and run

```bash
git clone https://github.com/etikhacker/Talora.az.git
cd Talora.az
npm install
```

Create `.env.local` in the project root with your development project's values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then start the development server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use a development database when testing applications, submissions, payments, or administrative actions.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the app. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key. The configuration also supports the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `NEXT_PUBLIC_APP_URL` | Preferred site origin for password recovery and notification links. Set it to the production URL on Vercel. |
| `NEXT_PUBLIC_SITE_URL` | Alternative site-origin setting when `NEXT_PUBLIC_APP_URL` is absent. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged operations such as notification delivery and deadline processing. |
| `GMAIL_USER` | Sender account for application notification emails. |
| `GMAIL_APP_PASSWORD` | Google App Password for that sender, not the account's regular password. |
| `CRON_SECRET` | Secret used to authorize the deadline-processing endpoint. |

The Vercel integration aliases `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are mapped to their public equivalents by `next.config.ts`.

Never prefix privileged keys or SMTP credentials with `NEXT_PUBLIC_`. Do not commit `.env.local`, credentials, or generated deployment configuration. The existing `.env.example` also contains legacy AI Studio placeholders; these are not required for the core internship workflow.

## Database and authentication setup

SQL migrations are in [`supabase/migrations`](supabase/migrations). Application types are in [`types/database.ts`](types/database.ts).

The core tables cover profiles, internships, applications, enrollments, tasks, submissions, certificate settings, payments, certificates, contact messages, and platform settings.

Important setup considerations:

- Review migrations before applying them to a new project. Historical migrations include curriculum data updates and project-specific administrator setup, not just schema definitions.
- Compare an existing project's migration history before applying changes. Do not blindly replay migrations or reset a live database.
- Keep row-level security and storage policies enabled. Hiding an admin button is not an authorization boundary.
- Student references such as `task_submissions.student_id` use `profiles.id`; this is distinct from the authentication user ID stored in `profiles.user_id`.
- Assign administrator access through the controlled database setup, not public registration or editable user metadata.

### Password recovery and authentication emails

Supabase Auth sends registration and recovery emails. Its SMTP configuration is separate from the application's Gmail notification settings.

For a deployment:

1. Set the Supabase Auth Site URL to the intended site origin.
2. Add the appropriate `/reset-password` URL to the allowed redirect URLs. Configure local development URLs separately.
3. Configure production email delivery in Supabase Auth.
4. Install the repository's [`password-recovery.html`](supabase/templates/password-recovery.html) as the recovery email template when using Talora's confirmation flow.

The template links to `/auth/confirm` with a recovery token hash. That route displays a confirmation step and verifies the token after an explicit form submission, then redirects to `/reset-password`. A valid recovery session is required to save a new password; expired or invalid links must not bypass verification.

See the [Supabase password authentication documentation](https://supabase.com/docs/guides/auth/passwords) for provider configuration.

## Project structure

```text
app/
  (auth)/              Login and registration
  admin/               Administration pages
  api/                 Notification and scheduled-job endpoints
  auth/confirm/        Recovery-link confirmation
  dashboard/           Student portal
  internships/         Public program catalog and details
  certificate/         Public certificate verification
  forgot-password/     Recovery email request
  reset-password/      New password form
components/            Shared UI, layouts, branding, and task rendering
lib/                   Auth, Supabase clients, email, tasks, and domain services
types/                 Shared application and database types
public/                Logos, icons, and static assets
supabase/
  migrations/          Schema, policy, and curriculum migrations
  templates/           Authentication email templates
scripts/               Regression tests and curriculum maintenance tools
docs/                  Curriculum review notes
.github/workflows/     Automated regression checks
```

## Checks

```bash
npm run lint
npm run test:security
npm run test:task-order
node --test scripts/*.test.mjs
npm run build
```

`npm run build` includes TypeScript and ESLint checks. The GitHub Actions workflow in [`.github/workflows/task-curriculum-regression.yml`](.github/workflows/task-curriculum-regression.yml) runs the security and task-order regression scripts for pushes and pull requests targeting `main`.

These checks do not replace end-to-end testing. Before releasing functional changes, verify authentication, program access, submissions, review feedback, payments, and certificates with appropriate test accounts. Check mobile layouts and both color themes.

## Deployment

The Vercel project is `talora-az`, connected to `etikhacker/Talora.az`. Its production branch is **`main`**.

After reviewing and committing changes:

```bash
git push origin main
```

A push to `main` triggers a production build. A successful Git push alone does not mean the deployment succeeded: check Vercel's build status and commit SHA, then verify [the live site](https://talora-az.vercel.app).

Configure environment variables for the intended Vercel environment before deploying. Database migrations and Supabase Auth settings are separate operations; pushing application code does not apply them automatically.

[`vercel.json`](vercel.json) schedules `/api/cron/deadlines` daily at `06:00 UTC` (`10:00` in Azerbaijan). The endpoint requires `CRON_SECRET` and the server-side Supabase client.

## Contributing and reporting issues

Keep changes focused, preserve existing data flows, and include regression coverage where possible. For a UI issue, describe the page, browser, screen size, language, and theme. For a workflow issue, include reproducible steps and the expected result without exposing personal data.

Review SQL and authentication changes carefully before using them against production. Never replace real application data with design mock data.

## License

No license file is currently included in this repository. Contact the repository owner before redistributing or reusing the code.
