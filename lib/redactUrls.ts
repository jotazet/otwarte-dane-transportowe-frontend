// An absolute URL, or a path with a query (urllib3 reports "with url: /feed?token=...").
const URL_IN_TEXT = /[a-z][a-z0-9+.-]*:\/\/[^\s'"<>]+|\/[^\s'"<>?]*\?\S*/gi;
const RELATIVE_BASE = "http://relative.invalid";

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url, RELATIVE_BASE);
    return parsed.origin === RELATIVE_BASE ? parsed.pathname : `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "";
  }
}

/**
 * `text` with every URL cut to scheme, host and path, as the backend's `redact_urls` does:
 * providers put credentials in the userinfo and the query. The backend redacts fetch errors
 * only since 2026-11-12, so older records may still carry them.
 */
export function redactUrls(text: string): string {
  return text.replace(URL_IN_TEXT, redactUrl);
}
