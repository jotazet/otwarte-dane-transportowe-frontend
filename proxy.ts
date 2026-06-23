import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { locales, type Locale } from "@/i18n/locales";
import { isLoginRequiredPath } from "@/lib/nav/protectedRoutes";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/internal-media") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const localeInPath = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

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
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-odt-locale", localeInPath as Locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
