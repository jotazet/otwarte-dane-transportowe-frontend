import { describe, expect, it } from "vitest";

import { loginDestination } from "@/lib/nav/returnUrl";

const ORIGIN = "https://odt.example";

describe("loginDestination", () => {
  it("keeps a path under the current locale, with its query", () => {
    expect(loginDestination("/pl/data/queue?organization=3", "pl")).toBe(
      "/pl/data/queue?organization=3",
    );
    expect(loginDestination("/en", "en")).toBe("/en");
  });

  it("falls back to the locale's home page when there is no returnUrl", () => {
    expect(loginDestination(null, "pl")).toBe("/pl");
    expect(loginDestination("", "de")).toBe("/de");
  });

  it("refuses a path under another locale", () => {
    expect(loginDestination("/en/account", "pl")).toBe("/pl");
  });

  // `searchParams.get` has already decoded the value once; encoded variants arrive as below.
  const hostile = [
    "https://evil.example/pl",
    "http://evil.example",
    "//evil.example",
    "//evil.example/pl",
    "/\\evil.example",
    "\\\\evil.example",
    "%2F%2Fevil.example",
    "/%2F/evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    " /pl",
    "\t//evil.example",
    "pl/account",
  ];

  it.each(hostile)("refuses %j", (value) => {
    expect(loginDestination(value, "pl")).toBe("/pl");
  });

  // What passes the prefix check must still stay on this origin when the router resolves it.
  const prefixed = [
    "/pl//evil.example",
    "/pl/\\evil.example",
    "/pl\\evil.example",
    "/pl@evil.example",
    "/pl.evil.example",
    "/pl/%2F%2Fevil.example",
    "/pl/../..//evil.example",
    "/pl\t//evil.example",
  ];

  it.each(prefixed)("keeps %j on this origin", (value) => {
    expect(new URL(loginDestination(value, "pl"), ORIGIN).origin).toBe(ORIGIN);
  });
});
