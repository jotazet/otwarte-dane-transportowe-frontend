# ODT frontend documentation

All documentation is in English, and every change updates the relevant pages on the same branch. A wrong document is worse than none.

This repository documents only the website itself. Everything shared with the backend lives in [the backend repository's `docs/`](https://github.com/jotazet/OtwarteDaneTransportowe-backend/tree/main/docs) (locally `../OtwarteDaneTransportowe-backend/docs/`): API reference and changelog, glossary, feed workflow, Polish and EU context, system ADRs and the git workflow.

| Area | Contents |
| --- | --- |
| [design-system/](design-system/README.md) | tokens, theme rules and how to use `ui-ux-pro-max` with MUI |
| [architecture/decisions/](architecture/decisions/) | UI decisions (ADRs) |
| [deployment.md](deployment.md) | production with Docker Compose |
| [seo.md](seo.md) | metadata, structured data, llms.txt and what crawlers see |

## What goes where

- **A UI decision that is hard to reverse** → a new ADR here (copy [0000-template.md](architecture/decisions/0000-template.md)).
- **A system decision, an API change or a domain fact** → the backend's `docs/`.
- **A new token or visual rule** → `theme.ts` and [design-system/](design-system/README.md).
