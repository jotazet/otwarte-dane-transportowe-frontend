import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { locales, type Locale } from "@/i18n/locales";
import { apiBaseUrl } from "@/lib/config";
import { isLoginRequiredPath } from "@/lib/nav/protectedRoutes";

const PUBLIC_FILE = /\.(.*)$/;

/**
 * Content-Security-Policy of a page (ADR 0008). Sent as Report-Only until the reported
 * violations have been checked. Next reads the nonce from it and puts it on its own scripts.
 */
function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const api = new URL(apiBaseUrl()).origin;
  return [
    "default-src 'self'",
    // React uses eval in development only, for error overlays and server stack traces.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Emotion's <style> elements carry the nonce; the dev server injects styles without it.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // React renders `style` props as attributes, which a nonce cannot cover.
    "style-src-attr 'unsafe-inline'",
    `connect-src 'self' ${api}`,
    `img-src 'self' data: ${api}`,
    "font-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/internal-media") ||
    pathname.startsWith("/opengraph-image") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const localeInPath = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (localeInPath) {
    const rest = pathname.slice(`/${localeInPath}`.length) || "/";
    if (isLoginRequiredPath(rest) && req.cookies.get("odt.auth")?.value !== "1") {
      const url = req.nextUrl.clone();
      url.pathname = `/${localeInPath}/login`;
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (!localeInPath) {
    const url = req.nextUrl.clone();
    url.pathname = `/pl${pathname === "/" ? "" : pathname}`;
    url.search = search;
    // Permanent: a path without a locale always lands on Polish, so search engines can
    // move its signals to the target.
    return NextResponse.redirect(url, 308);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-odt-locale", localeInPath as Locale);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy-Report-Only", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy-Report-Only", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
