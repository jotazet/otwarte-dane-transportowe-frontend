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
- `FRONTEND_BIND` – host address of the port (default `127.0.0.1`, for a reverse proxy on the same host). The container trusts `X-Forwarded-For`, so use `0.0.0.0` only for testing from the LAN.
- `API_HOSTNAME` – the host of `NEXT_PUBLIC_API_BASE_URL`, e.g. `api.odt.org.pl`, when the API's reverse proxy runs on this machine: server-side rendering then reaches it directly, not through the CDN (see [section 4](#4-reverse-proxy--tls)). Leave unset otherwise.

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
# with API_HOSTNAME: the API host resolves to this machine and answers (prints its address, then OK):
API_HOSTNAME=$(grep '^API_HOSTNAME=' .env | cut -d= -f2-)
docker exec odt-frontend sh -c "grep ' $API_HOSTNAME\$' /etc/hosts; wget -q -O /dev/null 'https://$API_HOSTNAME/api/blog/posts/?page_size=1' && echo OK"
```

Don't check for the absence of `http://localhost:8000`: it is always in the bundle as the fallback after `||` in `lib/config.ts` and `next.config.ts`, even when the API URL was inlined correctly.

## 4. Reverse proxy + TLS

Put a reverse proxy (nginx/Caddy) in front of the container that routes the site's domain to `127.0.0.1:${FRONTEND_PORT}` and forwards the `X-Forwarded-Proto: https` header and the visitor's IP in `X-Forwarded-For` (the rightmost entry is used). With Caddy:

```caddy
example.org {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-For {client_ip}
    }
}
```

Server-side rendering forwards that IP to the API, so the backend rate-limits each visitor separately. With `API_HOSTNAME` these calls reach the API's reverse proxy on this machine instead of the CDN, which would replace the IP; that proxy must accept `X-Forwarded-For` from the Docker networks. Its configuration and the deployment order are in [section 13 of the backend's `docs/deployment.md`](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/deployment.md#client-ip-cdn-and-the-frontend); background in [ADR 0011](https://github.com/jotazet/OtwarteDaneTransportowe-backend/blob/main/docs/architecture/decisions/0011-client-ip-behind-cloudflare-and-ssr.md).

## 5. Updates

```bash
git pull
docker compose up -d --build
```

## CORS (backend)

The site calls the API from the browser, so add the site's origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in the backend configuration. Otherwise the browser blocks the requests even though the endpoint is correct. See the backend's `docs/deployment.md`.
