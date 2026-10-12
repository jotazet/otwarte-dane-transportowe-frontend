# 0002. Translate the UI with typed dictionaries in four languages

- **Status:** Accepted (recorded retroactively)
- **Date:** 2026-10-12

## Context

ODT serves Polish users first, but feed consumers and partners abroad use it too. The site is available in Polish, English, German and Bulgarian, under locale-prefixed routes (`/pl`, `/en`, `/de`, `/bg`). Translations must never go missing silently when someone adds a string.

## Decision

- One dictionary module per locale in `i18n/lang/`. **Polish (`pl.ts`) is the source**: `Dictionary = typeof dictPl`, and `en.ts`, `de.ts` and `bg.ts` are declared as `Dictionary`, so a missing or extra key is a type error.
- Dictionaries are loaded on the server with `getDictionary(locale)` and passed to components as props, narrowed to the keys they use.
- Keys are English camelCase prefixed by area; labels for backend enum values are nested maps keyed by the value.
- No i18n library: interpolation is `{name}` replaced in code, and there is no plural support, so copy is phrased to avoid inflected counts.
- `proxy.ts` redirects paths without a locale to `/pl` and passes the locale to the root layout for `<html lang>`.

## Consequences

- Every new string is written in four languages in the same change (the `professional-copy` skill describes how).
- Prop drilling of dictionaries keeps server and client components simple, at the cost of wide props on large components.
- Polish plural forms (1 feed, 2 feedy, 5 feedów) cannot be expressed; adding ICU messages (for example `next-intl`) would be a new ADR.
- Text that bypasses the dictionaries (hardcoded strings, raw backend errors) is a bug.

## Alternatives considered

- **next-intl with ICU messages** — plurals and formatters, but a migration of every string and component for a need the copy can avoid today.
