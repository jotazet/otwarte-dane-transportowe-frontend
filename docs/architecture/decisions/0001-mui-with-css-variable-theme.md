# 0001. Build the UI with Material UI and a CSS-variable theme

- **Status:** Accepted (recorded retroactively)
- **Date:** 2026-10-12

## Context

ODT's website has many forms, tables, dialogs and panels (feed submission, review, feed operations, cases, blog editor) and a small team. It needs light and dark mode without a flash of the wrong theme on server-rendered pages, and accessible components. The UI was standardized on Material UI (commit `61bea23`).

## Decision

- **Material UI 9** with Emotion, wired into the App Router by `@mui/material-nextjs/v16-appRouter` (`components/ThemeRegistry.tsx`).
- **One theme in `theme.ts`** with `cssVariables` and `colorSchemes` for light and dark, selected by `data-color-mode` on `<html>`, plus `InitColorSchemeScript` so the first paint uses the stored scheme.
- **Styling scope, narrowest first:** `sx` with theme tokens for one instance; shared `sx` helpers in `lib/ui/` for repeated styles; `components` overrides in `theme.ts` for every instance. No raw colors or spacing in components.
- No Tailwind, no CSS Modules, no second component library.
- Agents follow the official Material UI skills (`.claude/skills/material-ui-*`), with `CLAUDE.md` rules taking precedence.

## Consequences

- Accessible, keyboard-ready primitives (dialogs, menus, tables, autocomplete) come with MUI; `IconButton`s still need labels.
- MUI components are client components: interactive parts of a page are client code even when the page is a server component.
- Bundle size and Emotion's runtime cost are accepted; component imports stay one level deep (`@mui/material/Button`) to keep the bundle lean.
- Major MUI upgrades need the official skills re-copied and the theme checked against the migration guide.

## Alternatives considered

- **CSS Modules + React Aria Components** (used in the sister project Solitable) — full control of the look, but every primitive would need to be wrapped and styled by hand, and the current UI rewritten.
- **Tailwind** — a second styling system next to MUI's theme.
