# 0008. Send a nonce-based Content-Security-Policy, report-only first

- **Status:** Accepted
- **Date:** 2026-11-13
- **Updated:** 2026-11-13: the policy is enforced (see [Enforcement](#enforcement)).

## Context

The site had no Content-Security-Policy ([issue #20](https://github.com/jotazet/otwarte-dane-transportowe-frontend/issues/20)). Any script that ever runs on the origin, through a dependency or a rendering bug, can read the session tokens in `localStorage` and call the API as an organiser or an ODT admin. Blog Markdown may also embed images from any host, which sends the reader's IP address and user agent to a third party chosen by the author.

A CSP for a Next.js App Router site can allow its inline scripts in three ways (Next's CSP guide, `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`): a per-request nonce, hashes through the experimental Subresource Integrity (SRI) support, or `'unsafe-inline'`. A nonce needs dynamic rendering, so it would normally cost static generation and ISR.

It costs nothing here: the root layout reads `headers()` for the locale and `app/[locale]/(site)/layout.tsx` sets `force-dynamic`, so every page is already server-rendered on demand. `npm run build` lists every page route as `ƒ` (dynamic) before and after this change; only `/opengraph-image` and `/robots.txt` are static, and they render no HTML.

## Decision

`proxy.ts` generates a nonce for every page request and sends this policy as `Content-Security-Policy-Report-Only`, on the response and on the request (Next reads the nonce from the request header, the report-only one included, and puts it on its own scripts):

| Directive | Value | Why |
| --- | --- | --- |
| `default-src` | `'self'` | Everything not listed below. Fonts come from `next/font`, served by the site. |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` in development) | Next's scripts, and MUI's `InitColorSchemeScript`, which gets the nonce from the root layout. JSON-LD (`type="application/ld+json"`) is a data block, not a script, and needs none. |
| `style-src` | `'self' 'nonce-…'` (`'unsafe-inline'` in development) | Emotion's `<style>` elements; `ThemeRegistry` passes the nonce to `AppRouterCacheProvider`. The dev server injects styles without a nonce. `ThemeProvider` no longer gets `disableTransitionOnChange`: its temporary `<style>` has no nonce option, and the theme has no transitions to disable. |
| `style-src-attr` | `'unsafe-inline'` | React renders `style` props as attributes, which a nonce cannot cover. CSS in an attribute cannot run script. |
| `connect-src` | `'self'` + the API origin | The browser calls the API at `NEXT_PUBLIC_API_BASE_URL`. |
| `img-src` | `'self' data:` + the API origin | Blog images under `/internal-media/` are served through the site's own rewrite; absolute media URLs point at the API. |
| `frame-src` | `'none'` | The site embeds nothing. |
| `frame-ancestors` | `'self'` | Same as `X-Frame-Options: SAMEORIGIN`. |
| `base-uri`, `form-action` | `'self'` | |
| `object-src` | `'none'` | |

The policy was first sent report-only, so browsers logged violations and blocked nothing, and is now enforced (see [Enforcement](#enforcement)). There is no `report-to` endpoint yet.

## Consequences

- Blog images from other hosts (`![](https://example.org/x.png)` in Markdown) are blocked; images in posts have to come from the API's media.
- Anything the reverse proxy or CDN injects into the HTML (for example Cloudflare's analytics beacon, Email Address Obfuscation or Rocket Loader) is blocked, so those features stay off.
- The nonce is serialised into the page for Emotion on the client, as MUI documents. It protects against injected markup, not against a script that already runs.
- Paths the proxy skips (files with an extension, `/_next`, `/api`, `/internal-media`) get no policy; they are not HTML pages.
- Follow-ups in issue #20: collect violations (a `report-to` endpoint, likely on the backend); move the refresh token into an `HttpOnly` cookie set by the API.

## Enforcement

`proxy.ts` now sends the same policy as `Content-Security-Policy`, on the response and on the request. Next reads the nonce from the request's `Content-Security-Policy` header first and falls back to the report-only one (`get-script-nonce-from-header.js`), so its scripts keep the nonce.

What was settled before enforcing:

- **External blog images:** none of the published posts in production embeds an image from another host; the existing ones come from `/internal-media/`.
- **Scripts without a nonce:** in production the only one was Cloudflare's Email Address Obfuscation (`/cdn-cgi/scripts/…/email-decode.min.js`, on `/pl/developers`). The policy is not loosened for it. **Prerequisite of deploying this change:** turn Email Address Obfuscation off for the site's domain in Cloudflare (Scrape Shield). Otherwise the browser blocks the script and the e-mail addresses it would decode stay hidden.
- **Production build check:** `npm run build` and `next start` with `NEXT_PUBLIC_API_BASE_URL=https://api.odt.org.pl`, then in a browser: the home page, the catalogue, a feed detail, the blog and two posts, cases, the data provider list, developers, info and login, by full page loads and by client-side navigation. No CSP violation was logged. Emotion's `<style>` elements and MUI's color scheme script carry the nonce; switching to dark mode and reloading keeps the dark scheme, and blog images from `/internal-media/` load. A test inline `<style>` added without a nonce was blocked, so the policy is in force.

**Rollback:** if the policy breaks a page in production, change both header names in `proxy.ts` back to `Content-Security-Policy-Report-Only` and redeploy. Browsers then only log the violations.

## Alternatives considered

- **Experimental SRI (hash-based)** — keeps pages static, which this site does not need, and covers only build-time script files: the inline scripts Next streams with each dynamic page and Emotion's styles would still need `'unsafe-inline'`.
- **Static header in `next.config.ts` with `'unsafe-inline'` for scripts** — no rendering cost, but an injected inline script would run, which is the attack the policy exists for.
- **`'unsafe-inline'` for all styles** — simpler, but the nonce for `<style>` elements costs one prop, and `style-src-attr` already allows the attributes React needs.
- **Allow images from any host** — keeps external blog images working, but leaves the readers' privacy issue from #20 open.
