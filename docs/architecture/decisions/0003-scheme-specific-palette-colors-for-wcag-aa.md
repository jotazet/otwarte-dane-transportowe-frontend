# 0003. Pick palette colors per color scheme to meet WCAG AA

- **Status:** Proposed
- **Date:** 2026-10-12

## Context

ODT serves public bodies, so WCAG 2.1 AA is a hard requirement. The theme used one primary color, `#1A73E8`, in both schemes and MUI's default status colors. Measured with the WCAG relative-luminance formula:

- primary text reached only 4.31:1 on the light page background (`#F8FAFD`), 3.70:1 on dark paper (`#1E1E1E`) and 4.16:1 on the dark page background (`#121212`);
- white text on the light warning color (`#ED6C02`, filled status chips) reached 3.11:1, on light info (`#0288D1`) 3.86:1, and on dark error (`#F44336`) 3.68:1.

## Decision

`theme.ts` defines `primary`, `success`, `warning`, `error` and `info` separately for each color scheme, with an explicit `contrastText`:

| Color | Light | Dark |
| --- | --- | --- |
| primary | `#1967D2` | `#8AB4F8` |
| success | `#2E7D32` | `#66BB6A` |
| warning | `#B35000` | `#FFA726` |
| error | `#D32F2F` | `#F28B82` |
| info | `#0071B2` | `#29B6F6` |
| contrastText | `#FFFFFF` | `#202124` |

Every `main` reaches at least 4.5:1 as text on `background.default`, `background.paper` and the table header and zebra-row backgrounds of its scheme, and `contrastText` reaches at least 4.5:1 on `main` and on `dark` (the hover color of contained buttons). In the dark scheme `tonalOffset.dark` is `0.1`, so the derived `dark` shades stay light enough for dark text.

## Consequences

- Text, links, outlined chips and filled status chips in both schemes meet 1.4.3; icons and focus outlines in these colors exceed the 3:1 of 1.4.11.
- In dark mode, contained buttons and filled chips show dark text on a light fill, as in Google's dark theme.
- A new palette color, or a change to a background, needs the same check in both schemes.

## Alternatives considered

- **Keep one primary for both schemes** — no color reaches 4.5:1 as text on both `#F8FAFD` and `#1E1E1E` (it would need a relative luminance at most 0.173 and at least 0.233).
- **White text on every fill in dark mode** — the dark-mode fills would have to be dark, so the same colors would fail as text on the dark backgrounds.
