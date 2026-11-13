import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

const ORIGIN = "https://odt.example";

function request(path: string, signedIn = false): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    headers: signedIn ? { cookie: "odt.auth=1" } : {},
  });
}

/** `NextResponse.next()` answers with this header; a redirect does not. */
function passedThrough(res: Response): boolean {
  return res.headers.get("x-middleware-next") === "1";
}

describe("proxy login gate", () => {
  it("sends a visitor without the session flag to the login page, keeping the path", () => {
    const res = proxy(request("/pl/data/queue/12"));
    expect(res.status).toBe(307);
    const target = new URL(res.headers.get("location") ?? "");
    expect(target.pathname).toBe("/pl/login");
    expect(target.searchParams.get("returnUrl")).toBe("/pl/data/queue/12");
  });

  it("uses the locale of the path for the login page", () => {
    const res = proxy(request("/de/account"));
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/de/login");
  });

  it("does not trust a session flag other than 1", () => {
    const req = new NextRequest(`${ORIGIN}/pl/account`, { headers: { cookie: "odt.auth=0" } });
    expect(proxy(req).status).toBe(307);
  });

  it("lets a signed-in visitor through, with the locale header", () => {
    const res = proxy(request("/pl/data/queue", true));
    expect(passedThrough(res)).toBe(true);
    expect(res.headers.get("x-middleware-request-x-odt-locale")).toBe("pl");
  });

  it("lets anyone open a public page", () => {
    for (const path of ["/pl", "/en/data", "/pl/login", "/pl/cases/organizations/3"]) {
      expect(passedThrough(proxy(request(path))), path).toBe(true);
    }
  });

  it("does not gate a path that only starts with a locale's letters", () => {
    // `/placcount` has no locale, so it is redirected to Polish, not to the login page.
    const res = proxy(request("/placcount"));
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/pl/placcount");
  });
});

describe("proxy locale redirect", () => {
  it("permanently redirects a path without a locale to Polish, keeping the query", () => {
    const res = proxy(request("/data/queue?organization=3"));
    expect(res.status).toBe(308);
    const target = new URL(res.headers.get("location") ?? "");
    expect(target.pathname).toBe("/pl/data/queue");
    expect(target.search).toBe("?organization=3");
  });

  it("redirects the root to /pl", () => {
    const res = proxy(request("/"));
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/pl");
  });

  it("leaves Next internals, API routes and files alone", () => {
    for (const path of ["/_next/static/chunk.js", "/api/health", "/favicon.ico", "/robots.txt"]) {
      expect(passedThrough(proxy(request(path))), path).toBe(true);
    }
  });
});
