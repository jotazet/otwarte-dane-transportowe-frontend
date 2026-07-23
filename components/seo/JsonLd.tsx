import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo/metadata";

export function WebSiteJsonLd({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: dict.appName,
    description: dict.metaSiteDescription,
    url: siteUrl("", locale),
    inLanguage: locale,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

const JSONLD_ESCAPE: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [String.fromCharCode(0x2028)]: "\\u2028",
  [String.fromCharCode(0x2029)]: "\\u2029",
};

/**
 * Escapuje znaki, które mogłyby zamknąć/rozbić kontekst `<script>` (XSS przez JSON-LD):
 * `<`, `>`, `&` oraz separatory linii U+2028/U+2029.
 */
function safeJsonLd(data: unknown): string {
  const pattern = new RegExp(
    `[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`,
    "g",
  );
  return JSON.stringify(data).replace(pattern, (c) => JSONLD_ESCAPE[c] ?? c);
}
