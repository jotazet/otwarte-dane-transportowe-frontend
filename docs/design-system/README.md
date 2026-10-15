# Design system

**Source of truth: [`theme.ts`](../../theme.ts).** It holds every design token (palette for light and dark, typography, shape) and the app-wide component overrides. Components read tokens through MUI (`sx` palette paths and spacing units, `theme.applyStyles`), never as raw values. A generated design document does not exist yet; this page records the rules that `theme.ts` encodes.

## Tokens today

| Token | Value |
| --- | --- |
| Color schemes | light and dark, as CSS variables, switched with `data-color-mode` on `<html>` (`ColorModeToggle`, stored under `odt-color-mode`) |
| Primary | `#1A73E8` |
| Secondary | `#174EA6` (light), `#8AB4F8` (dark) |
| Text | `#202124` / `#5F6368` (light), `#E8EAED` / `#9AA0A6` (dark) |
| Font | Roboto via `next/font` (`--font-roboto`), headings weight 500 |
| Radius | 12 by default; cards 16; buttons 24 |
| Motion | transitions disabled in the theme (`timeout: 0`) |

`app/globals.css` repeats the page background per color scheme so the first paint matches the theme; keep the two in sync.

## Rules

- **Calm, readable, dense where it helps.** Catalogue and review tables favour information density; public pages must also work on phones.
- **Cards** have a divider border and no shadow; **buttons** keep sentence case (`textTransform: none`).
- **Status** (stage, fetch status, case status) is shown with text or an icon, never color alone.
- Contrast meets **WCAG 2.1 AA** in both color schemes. Check every new color pair in light and dark.
- Long lists of organizations get a search box above the table (`TableSearchField`): it matches names and regions without diacritics (`lib/search.ts`) and announces the row count to screen readers.
- Shared table styling comes from `lib/ui/tableSx.ts`; select menus use `SELECT_MENU_MAX_HEIGHT` from `lib/ui/selectMenu.ts`.

## Using `ui-ux-pro-max`

The `ui-ux-pro-max` plugin (enabled in `.claude/settings.json`) proposes styles, palettes and UX patterns. Its examples often use Tailwind or other stacks:

- Pass `--stack nextjs` (or `react`) for stack guidance; never `html-tailwind` or `shadcn`.
- Translate the **values** it suggests into `theme.ts` tokens and the **patterns** into MUI components with `sx`, following the official `material-ui-*` skills. Never copy its classes.
- A global change to tokens is a design decision: record it in an ADR in [`../architecture/decisions/`](../architecture/decisions/) and update this page.
