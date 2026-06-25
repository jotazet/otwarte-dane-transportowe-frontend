This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Otwarte Dane Transportowe (web)

This app mirrors the Flutter UI/routes, but targets the web with Next.js App Router.

### Routes

All user-facing routes are locale-prefixed:

- `/pl`, `/en` and `/de` (root `/` redirects to `/pl`)
- `/[locale]/blog`, `/[locale]/blog/[id]`
- `/[locale]/cases`, `/[locale]/cases/organizations/[id]`
- `/[locale]/data`, `/[locale]/data/feeds/[id]`
- `/[locale]/info`

### Backend API

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`)

## Wdrożenie produkcyjne (Docker Compose)

Front uruchamiamy jedną komendą przez Docker Compose. Konfiguracja (adres API,
adres frontu, port) jest trzymana w pliku `.env`.

> Uwaga: zmienne `NEXT_PUBLIC_*` w Next.js są wstawiane do bundla podczas **builda**,
> a nie przy starcie kontenera. Dlatego są przekazywane jako build args, a po każdej
> ich zmianie konieczny jest **rebuild** (`--build`), nie sam restart.

### 1. Konfiguracja

```bash
cp .env.example .env
```

Uzupełnij `.env`:

- `NEXT_PUBLIC_API_BASE_URL` - publiczny adres API, np. `https://v2.api.odt.org.pl`
- `NEXT_PUBLIC_SITE_URL` - publiczny adres frontu, np. `https://v2.odt.org.pl`
- `FRONTEND_PORT` - port hosta (domyślnie `3000`)
- `FRONTEND_BIND` - `127.0.0.1` gdy reverse-proxy jest na tym samym hoście (zalecane),
  albo `0.0.0.0` do testów z LAN

### 2. Build i start

```bash
docker compose up -d --build
```

### 3. Weryfikacja

```bash
# adres API powinien byc obecny w zbudowanym bundlu:
docker exec odt-frontend sh -c "grep -rao 'v2.api.odt.org.pl' .next/ | head"
# i NIE powinno byc domyslnego localhost:8000:
docker exec odt-frontend sh -c "grep -rao 'http://localhost:8000' .next/ | head"
# strona docelowa zwraca 200:
curl -i http://localhost:3000/pl
```

### 4. Reverse-proxy + TLS

Przed kontenerem postaw reverse-proxy (nginx/Caddy) kierujący domenę frontu na
`127.0.0.1:${FRONTEND_PORT}` i przekazujący nagłówek `X-Forwarded-Proto: https`.

### 5. Aktualizacje

```bash
git pull
docker compose up -d --build
```

### CORS (backend)

Front woła API z przeglądarki, więc w konfiguracji backendu `OtwarteDaneTransportowe`
dodaj origin frontu do `CORS_ALLOWED_ORIGINS` oraz `CSRF_TRUSTED_ORIGINS` - inaczej
przeglądarka zablokuje zapytania mimo poprawnego endpointu.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
