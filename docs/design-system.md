# Talora interface system

The platform uses the approved [Talora Figma design](https://www.figma.com/design/yyTTsLg25tQ8vG1OPalY3f), including its editable desktop and mobile landing layouts. The shared implementation is in `app/design-system.css`.

## Visual foundation

| Token | Dark | Light |
| --- | --- | --- |
| Page | `#0b101d` | `#f5f7fc` |
| Surface | `#121b2d` | `#ffffff` |
| Text | `#f4f7ff` | `#162139` |
| Secondary text | `#a8b6d0` | `#52627b` |
| Primary action | `#435fd1` | `#435fd1` |
| Accent text | `#a9b8ff` | `#344db5` |

Inter is self-hosted in `public/fonts`; its OFL license is included. The logo and staircase illustration in `public/design` are SVG exports from the approved Figma file. The illustration is decorative; navigation, headings, program details, forms and certificate information remain native HTML.

Use `PageHeading`, `AuthBrand`, `TaloraLogo`, the shared buttons/cards and workspace navigation when extending the site. Keep semantic success, warning and error colours for status information. The compatibility mappings in `globals.css` and the scoped admin stylesheet keep existing operational pages readable while sharing the new tokens.

## Coverage

- Landing: hero, directions, process, certificate information, live programs, FAQ and final action.
- Public pages: program catalogue and detail/application pages, about, how it works, contact, terms and privacy.
- Authentication: student sign-in, registration, administrator sign-in and password recovery surfaces.
- Workspaces: shared student/admin navigation, theme controls, headings, cards, tables, filters and forms across their sections.

The landing's live program cards use `/api/internships/public`. Operational services, database schema, payment processing, task submission and certificate logic remain in the existing service modules. No sample program or student data is imported into production.

## Preferences and accessibility

`lib/theme.ts` shares a persistent theme across public, authentication and workspace routes, with migration from the previous preference key. `LanguageProvider` uses a hydration-safe subscription and updates the document language. New visitors start in Azerbaijani; stored English preferences are respected.

Layouts adapt down to 320px. Registration uses document scrolling so its submit action remains reachable. Keyboard focus, text selection, password visibility controls and reduced-motion preferences are supported. An unrelated admin-login redirect loop discovered during review was fixed without changing authorization checks.

## Verification

Before release, run `npm run build`, `npm run test:security` and `npm run test:task-order`. Browser review covers public routes at desktop/mobile widths in both themes, program search and detail loading, theme/language persistence, mobile navigation, password visibility, registration reachability and anonymous route protection.

Workspace visual checks use the real page components in an isolated local review without an authenticated account; the temporary review route is removed before building for production. These checks do not replace signed-in end-to-end testing of application submission, email delivery, payment approval or certificate issuance.
