---
name: professional-copy
description: Write, filter and review user-facing UI text for ODT (Polish first, then English, German and Bulgarian) so it reads as a reliable public data portal. Use whenever adding or changing any text a user will read - labels, buttons, headings, help text, validation and error messages, empty states, confirmations, page metadata, blog UI - unless the user supplied the exact wording. Also use when reviewing existing copy.
---

# Professional copy (ODT UI)

ODT is used by public bodies and carriers that publish their data, by the ODT team that reviews it, and by developers who build on it. Copy must read like a reliable public data service, not like a consumer app. Every string you did not receive verbatim from the user passes through this filter before it lands in `i18n/lang/pl.ts` and its translations.

If the user supplied exact wording, use it verbatim. You may still point out a typo, a glossary conflict or a better alternative, but don't change it silently.

## Audience and tone

| Audience | What they need | Implication |
| --- | --- | --- |
| Officer at a gmina or transport authority (data is one duty among many) | Clarity, confidence, no jargon | Plain Polish; explain what GTFS, NeTEx or a realtime feed means for them |
| Operator or ODT reviewer (expert) | Precision, density, speed | Correct format terms; no hand-holding in review and feed-ops panels |
| Developer or enthusiast (feed consumer) | Exact links, formats, licences | Standard names, exact field and endpoint names where they help |

- **Tone everywhere in the application** (forms, tables, panels, errors, dialogs): **formal-neutral, precise, calm, concise**.
- **Home page and blog** may be warmer and more inviting (a full sentence instead of a label, a "we" voice for ODT), but the rules below still apply: no exclamation marks, no emojis, no marketing adjectives.

## Rules

1. **Correct Polish** with full diacritics. Prefer Polish terms to anglicisms, except established ones the glossary keeps ("feed", "endpoint"). Standard names stay as they are: GTFS, GTFS-RT, NeTEx, SIRI, GBFS.
2. **One concept, one term.** Use the Polish term from the backend's `docs/domain/glossary.md` (`../OtwarteDaneTransportowe-backend/docs/domain/glossary.md`). If a concept is missing, propose a term and add it to the glossary in a backend change. Never alternate synonyms ("zgłoszenie" vs "wniosek" for the same thing).
3. **Address the user with the imperative** ("Wybierz", "Podaj", "Zapisz"). Use impersonal constructions for states ("Nie dodano jeszcze żadnych zgłoszeń"). Avoid "Ty/Twój" and familiar forms in new copy; never "Pan/Pani". In e-mails, use "Państwo".
4. **Buttons are verb + object** and name the result: "Opublikuj feed", "Dodaj endpoint". Never "OK", "Wyślij", "Kliknij tutaj", "Dalej" when a specific verb exists.
5. **Sentence case.** Only the first word and proper names are capitalized.
6. **No exclamation marks, emojis, humor, marketing adjectives** ("łatwo", "szybko", "super", "i nie tylko!") or anthropomorphism ("Ups", "Hmm").
7. **Errors say what happened, why if known, and what to do next.** Never blame the user. Never show stack traces, HTTP status codes or raw field names (`download_time_1`) to non-experts; never show backend text — map the error code to a message. Field names may appear in expert panels only next to a plain explanation.
8. **Destructive actions name the consequence and the scope**, state irreversibility explicitly, and repeat the action on the confirm button: "Usuń zgłoszenie", not "Tak".
9. **Empty states explain what belongs here** and offer the next step.
10. **Formats:**
    - 24-hour clock ("07:45"); say "UTC" whenever a time is UTC (download times).
    - Dates as "12.10.2026", or "12 października 2026" in prose.
    - Decimal comma and a space as the thousands separator.
    - Format through `lib/format.ts`, never by hand.
    - Polish dash with spaces is "–", not "-".
11. **No plural concatenation.** The dictionaries have no plural support, so phrase counts to avoid inflected forms ("Liczba feedów: 5", "Błędy pobierania: 3"). Never build "5 feed" + "ów" in code.
12. **Be brief.** Labels are 1–3 words. Help text is at most two short sentences.
13. **Legal and regulatory statements** (KPD, MMTIS, obligations, deadlines) must come from the backend's `docs/domain/poland.md` with a source. Never invent them in copy.

## Translations (en, de, bg)

- Every key is added to `pl.ts`, `en.ts`, `de.ts` and `bg.ts` in the same change; the types reject a missing key.
- Polish is the source. Translations carry the same meaning and the same rules (sentence case where the language uses it, no exclamation marks, verb + object buttons), written naturally in the target language rather than word for word.
- Formal register: German "Sie", Bulgarian "Вие".
- Keep standard names, codes and product names untranslated. If you are unsure of a German or Bulgarian term, say so and ask the user instead of guessing.

## Process

1. Identify the context (page, component, user state) and the audience.
2. Draft the Polish text.
3. Check every rule above. Rewrite until each one passes.
4. Add the key under a descriptive, area-prefixed camelCase name (`feedOpsPauseDialogTitle`) to all four dictionaries.
5. For a new term, update the glossary in the backend repository.

## Before / after

| Avoid | Use |
| --- | --- |
| Katalog organizacji wraz z dostarczanymi przez nie danymi GTFS, GTFS-RT, GBFS i nie tylko! | Katalog organizacji i ich danych: GTFS, NeTEx, GTFS-RT, SIRI i GBFS. |
| Nie masz jeszcze zgłoszeń - dodaj pierwszy poniżej. | Nie dodano jeszcze żadnych zgłoszeń. Dodaj feed w formularzu poniżej. |
| Brak danych do wyświetlenia. | Ta organizacja nie udostępnia jeszcze żadnych feedów. |
| Wybrane zgłoszenie statyczne nie jest zaakceptowane/opublikowane. | Wybrane zgłoszenie statyczne nie zostało jeszcze opublikowane. Feed realtime można powiązać tylko z opublikowanym feedem statycznym. |
| Request failed with status code 400 | Nie udało się zapisać zgłoszenia. Popraw zaznaczone pola i spróbuj ponownie. |
| Usunąć to zgłoszenie? *(Tak / Nie)* | Usunąć zgłoszenie „ZTP Kraków GTFS”? Zostanie usunięta także jego historia. Tej operacji nie można cofnąć. *(Usuń zgłoszenie / Anuluj)* |
| Super! Feed opublikowany 🎉 | Feed został opublikowany i jest widoczny w katalogu. |
| Kliknij tutaj, aby pobrać | Pobierz plik GTFS |
