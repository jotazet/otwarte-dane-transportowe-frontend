# Design system

**Source of truth: [`theme.ts`](../../theme.ts).** It holds every design token (palette for light and dark, typography, shape) and the app-wide component overrides. Components read tokens through MUI (`sx` palette paths and spacing units, `theme.applyStyles`), never as raw values. A generated design document does not exist yet; this page records the rules that `theme.ts` encodes.

## Tokens today

| Token | Value |
| --- | --- |
| Color schemes | light and dark, as CSS variables, switched with `data-color-mode` on `<html>` (`ColorModeToggle`, stored under `odt-color-mode`) |
| Primary | `#1967D2` (light), `#8AB4F8` (dark) |
| Status | success, warning, error, info per scheme, see [ADR 0003](../architecture/decisions/0003-scheme-specific-palette-colors-for-wcag-aa.md) |
| Secondary | `#174EA6` (light), `#8AB4F8` (dark) |
| Text | `#202124` / `#5F6368` (light), `#E8EAED` / `#9AA0A6` (dark) |
| Font | Roboto via `next/font` (`--font-roboto`) as a variable font, so every weight from 100 to 900 is available; headings weight 500 |
| Radius | 12 by default; cards 16; buttons 24 |
| Motion | none: `transitions` in the theme sets every duration to 0 and every CSS transition MUI generates to `none`, and the Skeleton animation is off; don't set timeouts per component; the one exception is the status dot of `StatusPanel`, which sends out three rings (4.5 s) when it appears or changes, and none under `prefers-reduced-motion` (WCAG 2.2.2: motion that starts by itself stops within 5 s) |
| Chart series | `palette.chart.series1`–`series4`: blue, amber, violet, red, in this fixed order; light `#2A78D6` `#EDA100` `#4A3AA7` `#E34948`, dark `#3987E5` `#C98500` `#9085E9` `#E66767`. Checked for colour-blind separation of neighbours in both schemes; amber is under 3:1 on white, so charts that use it also have a legend and a table view |

`app/globals.css` repeats the page background per color scheme so the first paint matches the theme; keep the two in sync.

## Rules

- **Calm, readable, dense where it helps.** Catalogue and review tables favour information density; public pages must also work on phones.
- **Cards** have a divider border and no shadow; **buttons** keep sentence case (`textTransform: none`); **chip** labels sit 1 px lower (`paddingTop: 2`), so Roboto looks centred in Chromium and Firefox.
- **Status** (stage, fetch status, case status) is shown with text or an icon, never color alone.
- A **service state** (planner, public API) uses `components/StatusPanel.tsx`: a colour dot centred on the title line, the title, and a one-line explanation.
- Contrast meets **WCAG 2.1 AA** in both color schemes. Check every new color pair in light and dark: every palette `main` reaches 4.5:1 as text on the scheme's backgrounds and `contrastText` reaches 4.5:1 on `main` and `dark`.
- Long lists of organizations get a search box above the table (`TableSearchField`): it matches names and regions without diacritics (`lib/search.ts`) and announces the row count to screen readers.
- Shared table styling comes from `lib/ui/tableSx.ts`; select menus use `SELECT_MENU_MAX_HEIGHT` from `lib/ui/selectMenu.ts`.
- Code, URLs and raw API responses use `codeBlockSx` (monospace on the muted panel) and `MONOSPACE_FONT` from `lib/ui/codeSx.ts`.

## Using `ui-ux-pro-max`

The `ui-ux-pro-max` plugin (enabled in `.claude/settings.json`) proposes styles, palettes and UX patterns. Its examples often use Tailwind or other stacks:

- Pass `--stack nextjs` (or `react`) for stack guidance; never `html-tailwind` or `shadcn`.
- Translate the **values** it suggests into `theme.ts` tokens and the **patterns** into MUI components with `sx`, following the official `material-ui-*` skills. Never copy its classes.
- A global change to tokens is a design decision: record it in an ADR in [`../architecture/decisions/`](../architecture/decisions/) and update this page.
