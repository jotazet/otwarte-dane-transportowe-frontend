@AGENTS.md

# ODT frontend

Website of **Otwarte Dane Transportowe (ODT)**, a Polish portal for open public transport data: a public catalogue of static and realtime feeds (GTFS, NeTEx, GTFS-RT, SIRI, GBFS), panels for submitting and reviewing feeds, a transparency record of requests for data (cases) and a blog. UI in Polish, English, German and Bulgarian.

- **Users:**
  - **developers and enthusiasts** who look for feeds and links to them;
  - **organizers and operators** (gminy, transport authorities, carriers) who submit and maintain their feeds;
  - **the ODT team**, who verify submissions, run proxied feeds and track cases.
- **Backend:** [OtwarteDaneTransportowe-backend](https://github.com/jotazet/OtwarteDaneTransportowe-backend) (Django REST API), usually checked out next to this repository at `../OtwarteDaneTransportowe-backend`. **Shared documentation lives there**: API reference and changelog (`docs/api/`), glossary and feed workflow (`docs/domain/`), system ADRs and the git workflow. Read it before changing anything that talks to the API or names a domain concept.

## How to work here

- **Be a skeptical partner, not an order-taker.** Check every request against the users above. If an idea is wrong, over-engineered, or a simpler or better option exists, say so before implementing. Be brief and state the trade-off.
- **Ask instead of guessing.** Ask the user about product decisions, wording and unclear scope, as multiple-choice questions when the options are clear.
- **No invented facts.** Never make up format fields, regulations or Polish legal terms; check the backend's `docs/domain/` and official specs first.
- **Keep it simple and surgical.** Follow the `karpathy-guidelines` skill: write the minimum code that solves the problem, add no speculative abstractions, and make every changed line traceable to the request.

## Hard rules

1. **Language.** Code identifiers, comments, commit messages, PRs and `docs/` are in **English**. Some older comments are in Polish; translate them when you change that code, not in bulk.
2. **User-facing text.** Never hardcode it. Every string lives in `i18n/lang/pl.ts` and in its translations `en.ts`, `de.ts` and `bg.ts`, **all four in the same change**. Unless the user supplied the exact wording, write or review every string with the **`professional-copy`** skill.
3. **UI.** Use the **`ui-ux-pro-max`** skill for anything that changes how the site looks, feels or behaves, and the official **`material-ui-*`** skills for how to implement it in MUI. See the conventions below and `docs/design-system/`.
4. **Domain.** Name things after the backend's `docs/domain/glossary.md`. Never display raw backend error text; translate error codes ([backend ADR 0006](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0006-api-error-codes.md)).
5. **Docs are part of the change.** Update `docs/` on the same branch. A new UI decision gets an ADR in `docs/architecture/decisions/` (copy `0000-template.md`). A system-level decision or a domain fact goes to the backend's `docs/`.
6. **Git.** Follow the workflow below. It is enforced by `.claude/hooks/protect-main.sh`.

## Git workflow

- **Never commit to or push to `main`.** Every change goes through its own branch and a pull request.
- Branch names follow `<type>/<short-kebab-summary>`. Types are `feature`, `fix`, `perf`, `refactor`, `docs`, `chore` and `test`. Example: `fix/catalog-empty-state`.
- Commit messages use Conventional Commits: `type(scope): imperative summary`, at most 72 characters, with a body that explains *why* when it isn't obvious.
- **No AI attribution:** no `Co-Authored-By` trailers and no "Generated with" lines in commits or PRs.
- Commit freely on your branch. Push and open a PR only when the user asks.
- A change that also needs the backend gets a linked PR there; the backend deploys first.
- Full details: the backend's `docs/development/git-workflow.md`.

## Structure

```
app/                     routes only; app/[locale]/(site)/ holds every page, layouts stay thin
components/              shared components (named exports); layout/ = page scaffolding, feedOps/, submissions/
lib/api/                 API client (http.ts), one module per area, loadOr404 / loadOrError
lib/auth/                AuthContext (JWT), roles, permissions
lib/nav/, lib/seo/       route helpers (paths(locale)), metadata
lib/ui/                  shared sx helpers and table utilities
lib/icons/               generated slim react-icons/md module
i18n/                    locales and typed dictionaries (lang/pl.ts is the source)
theme.ts                 the MUI theme: design tokens, color schemes, component overrides
proxy.ts                 locale redirect, login gate and x-odt-locale header (Next 16 proxy)
docs/                    design system and UI decisions
```

Create directories only when there is code for them.

## Components and data

- **Server Components by default.** Pages and layouts are server components; add `"use client"` only where interactivity needs it, as low in the tree as possible. MUI components are client components that still render on the server.
- **Public data** is fetched in server components through `lib/api/*`: detail pages wrap the call in `loadOr404()`, list pages in `loadOrError()` and show `PageLoadErrorAlert` on failure.
- **Data of the signed-in user** is fetched in client components through `useAuth().apiJson / apiForm / apiBlob`, which refresh the token. Never call `fetch` directly from a component.
- Routes come from `paths(locale)` in `lib/nav/routes.ts`; pages resolve the locale with `resolvePageLocale(params)`.
- Role checks use `lib/auth/permissions.ts` / `usePermissions`; the backend enforces them again.
- Props are explicit and typed. No `any`. No non-null assertions (`!`) without a comment that explains why.

## Styling (MUI)

- **MUI 9 with Emotion** ([ADR 0001](docs/architecture/decisions/0001-mui-with-css-variable-theme.md)). No Tailwind, no CSS Modules, no other UI kit.
- **Tokens come from `theme.ts`.** In `sx`, use palette paths (`"text.secondary"`, `"divider"`) and spacing units (`p: 2`), never raw hex colors, px spacing or ad-hoc font sizes. A missing token is added to `theme.ts` deliberately.
- **Pick the narrowest scope**: one instance → `sx`; the same styles in several places → a helper in `lib/ui/*Sx.ts` (as `tableHeadRowSx`); every instance of a component → `components` in `theme.ts`. `styled()` only for a reusable wrapper that none of these can express.
- **Dark mode** comes from `colorSchemes` with CSS variables: branch with `theme.applyStyles("dark", …)` and in theme callbacks read colors as `theme.vars?.palette.divider ?? theme.palette.divider`, as `theme.ts` does. Never test `palette.mode` for styling.
- Import components one level deep (`import Button from "@mui/material/Button"`).
- **Icons:** `react-icons/md` resolves to the slim `lib/icons/react-icons-md.js`. A new `Md*` icon must be copied into that file from `node_modules/react-icons/md/index.mjs`, or the page fails at runtime. Decorative icons get `aria-hidden`.
- The theme disables transitions; don't add animations without a reason.
- **Official MUI skills** in `.claude/skills/material-ui-{styling,theming,nextjs}/` are copied verbatim from [mui/material-ui `skills/`](https://github.com/mui/material-ui/tree/00f2d81a83c283f6f26136d789242bb27beb2da7/skills) at `00f2d81` (MUI v9). Re-copy them when upgrading MUI's major version. Where they leave a choice, the rules above win. The App Router entry point here is `@mui/material-nextjs/v16-appRouter`.

## i18n and formatting

- Dictionaries are typed: `Dictionary = typeof dictPl`, and `en`, `de` and `bg` must have exactly the same keys, so a missing key is a type error ([ADR 0002](docs/architecture/decisions/0002-typed-dictionaries-in-four-languages.md)).
- Keys are English camelCase, prefixed by area, and describe meaning, not wording: `feedOpsPauseDialogTitle`, not `wstrzymajTytul`. Labels for backend enum values live in nested maps keyed by the value (`caseStatusLabels`).
- Components receive the dictionary as a prop, narrowed to what they use (`Pick<Dictionary, …>`), together with `locale`.
- Placeholders use `{name}` replaced in code. Never build sentences or counts by concatenating strings; phrase counts so they need no plural form ("Liczba feedów: 5").
- Rich text in dictionaries goes through `renderRichText` (`lib/richText.tsx`), never `dangerouslySetInnerHTML`.
- Format dates through `lib/format.ts`, never by hand or with bare `toLocaleString()`. Date-times are shown in `Europe/Warsaw`, the same on the server and in the browser.
- Show a failed request with `formatApiError(err, dict)`, never `err.message`: it maps the HTTP status to a translated message.

## Accessibility

ODT serves public bodies, so treat WCAG 2.1 AA as a hard requirement:

- Every interaction works with the keyboard alone, with visible focus.
- Every field has a label; every `IconButton` has an `aria-label` (with a matching `Tooltip`).
- Color is never the only signal (statuses get text or an icon).
- `html lang` follows the locale.

## Commands

```sh
npm run dev                                                        # http://localhost:3000 (API from NEXT_PUBLIC_API_BASE_URL)
npm run lint && npm run typecheck && npm run format:check && npm run build
npm run format                                                     # apply Prettier
```

## Definition of done

- Every check above passes.
- New user-facing text is in all four dictionaries and has passed `professional-copy`.
- UI changes follow the design system, work in light and dark mode, on phones for public pages, and with keyboard only.
- `docs/` is updated (and the backend's docs, if the change touches the API or the domain).
- Before opening a PR, run `/simplify`, then `/code-review`. Fix what is real and mention what you skipped.
