# SEO and AI visibility

What search engines and AI tools get from the public pages, and the rules for new ones.

## Metadata

- Every public page exports `generateMetadata` built with `buildPageMetadata` (`lib/seo/metadata.ts`): title, description, canonical URL, language versions with `x-default` (Polish), Open Graph and a large Twitter card. Detail pages describe the organization itself (name, formats, latest case status, region), never the site in general.
- The site layout (`app/[locale]/(site)/layout.tsx`) sets the title template and defaults in the page's language; the root layout only has the Polish fallback.
- Blog posts are written in Polish only. Every locale's copy points its canonical URL at `/pl/blog/{id}` and declares no language versions, and the sitemap lists each post once.
- A path without a locale redirects permanently (308) to Polish.
- A page fetches its data once for both `generateMetadata` and the page, through `React.cache`.

## Structured data

`components/seo/JsonLd.tsx` renders the objects built in `lib/seo/structuredData.ts`:

| Page | schema.org type |
| --- | --- |
| Home | `WebSite`, `Organization` |
| `/data` | `DataCatalog` |
| `/data/feeds/{id}` | one `Dataset` per feed, with a `DataDownload` per file or realtime endpoint |
| `/blog/{id}` | `BlogPosting` |
| Pages with a breadcrumb trail of two or more steps | `BreadcrumbList` (from `AppPage`) |

Structured data describes only what the page shows: a licence or a date goes in only when the API returns it. Check changes with the [Rich Results Test](https://search.google.com/test/rich-results).

## Content in the server HTML

AI crawlers usually do not run JavaScript, so the text that matters must be in the server HTML. The home page renders the visitor's hero on the server; it shows a placeholder only when the sign-in cookie is set. Each page has one `h1` (the page header); section titles are `h2`, and Markdown headings in a post start at `h2`.

## Link preview and llms.txt

- `app/opengraph-image.tsx` draws one brand image for every page. `proxy.ts` lets `/opengraph-image` through without a locale.
- `app/llms.txt/route.ts` serves [`/llms.txt`](https://llmstxt.org/): a short Markdown summary of the site and the API with links.

## Outside the code

- Cloudflare's "Block AI bots" setting answers 403 to AI training crawlers (GPTBot, ClaudeBot, CCBot and others) while robots.txt allows everything; AI search and user agents (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot) get through.
- Google Search Console and Bing Webmaster Tools are verified by a DNS record in Cloudflare; submit `/sitemap.xml` there.
