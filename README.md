# Otwarte Dane Transportowe – web

Website of ODT, the Polish portal for open public transport data: feed catalogue, feed submission and review, cases and blog. Next.js (App Router) with Material UI, in Polish, English, German and Bulgarian.

The API is the [ODT backend](https://github.com/jotazet/OtwarteDaneTransportowe-backend), which also holds the shared documentation (API reference, glossary, git workflow).

## Routes

All user-facing routes are locale-prefixed (`/pl`, `/en`, `/de`, `/bg`; `/` redirects to `/pl`), e.g.:

- `/[locale]/blog`, `/[locale]/blog/[id]`
- `/[locale]/cases`, `/[locale]/cases/organizations/[id]`
- `/[locale]/data`, `/[locale]/data/feeds/[id]`
- `/[locale]/info`

## Development

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:8000)
npm ci
npm run dev                  # http://localhost:3000
```

Checks (all must pass, CI runs them on every pull request):

```bash
npm run lint && npm run typecheck && npm run format:check && npm run build
```

## Documentation

- [docs/](docs/README.md) – design system, UI decisions, deployment
- [CLAUDE.md](CLAUDE.md) – conventions for contributors and AI agents
- [Deployment](docs/deployment.md) – production with Docker Compose
