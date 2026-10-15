/** Structured data for search engines and AI tools; `data` comes from `lib/seo/structuredData`. */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
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
 * Escapes the characters that could close or break the `<script>` (XSS through JSON-LD):
 * `<`, `>`, `&` and the line separators U+2028 and U+2029.
 */
export function safeJsonLd(data: unknown): string {
  const pattern = new RegExp(
    `[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`,
    "g",
  );
  return JSON.stringify(data).replace(pattern, (c) => JSONLD_ESCAPE[c] ?? c);
}
