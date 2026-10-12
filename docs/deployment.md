# Production deployment (Docker Compose)

The frontend runs with a single Docker Compose command. Configuration (API URL, site URL, port) lives in `.env`.

> **Note:** Next.js inlines `NEXT_PUBLIC_*` variables into the bundle at **build** time, not when the container starts. That is why they are passed as build args, and every change to them needs a **rebuild** (`--build`), not just a restart.

## 1. Configuration

```bash
cp .env.example .env
```

Fill in `.env`:

- `NEXT_PUBLIC_API_BASE_URL` – public API URL, e.g. `https://v2.api.odt.org.pl`
- `NEXT_PUBLIC_SITE_URL` – public site URL, e.g. `https://v2.odt.org.pl`
- `FRONTEND_PORT` – host port (default `3000`)
- `FRONTEND_BIND` – `127.0.0.1` when the reverse proxy runs on the same host (recommended), or `0.0.0.0` for testing from the LAN

## 2. Build and start

```bash
docker compose up -d --build
```

## 3. Verification

```bash
# the API host from .env must be in the built bundle (it is absent when the build did not get it):
API_HOST=$(grep '^NEXT_PUBLIC_API_BASE_URL=' .env | cut -d= -f2- | sed 's#^https\?://##')
docker exec odt-frontend sh -c "grep -rlo '$API_HOST' .next/ | wc -l"   # more than 0
# the landing page returns 200 (use your FRONTEND_PORT):
curl -i http://localhost:3000/pl
```

Don't check for the absence of `http://localhost:8000`: it is always in the bundle as the fallback after `||` in `lib/config.ts` and `next.config.ts`, even when the API URL was inlined correctly.

## 4. Reverse proxy + TLS

Put a reverse proxy (nginx/Caddy) in front of the container that routes the site's domain to `127.0.0.1:${FRONTEND_PORT}` and forwards the `X-Forwarded-Proto: https` header.

## 5. Updates

```bash
git pull
docker compose up -d --build
```

## CORS (backend)

The site calls the API from the browser, so add the site's origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in the backend configuration. Otherwise the browser blocks the requests even though the endpoint is correct. See the backend's `docs/deployment.md`.
