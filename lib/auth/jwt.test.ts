import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tokenWith } from "@/lib/__fixtures__/token";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";

describe("decodeJwt", () => {
  it("decodes a base64url payload, including UTF-8 text", () => {
    const payload = { username: "jan", first_name: "Łukasz Żółć", note: "?>~~" };
    const token = tokenWith(payload);
    // This payload needs "-", which plain base64 writes as "+".
    expect(token.split(".")[1]).toContain("-");
    expect(decodeJwt(token)).toEqual(payload);
  });

  it("returns null for a malformed token", () => {
    expect(decodeJwt("")).toBeNull();
    expect(decodeJwt("only-one-part")).toBeNull();
    expect(decodeJwt("a.%%%.c")).toBeNull();
    expect(decodeJwt(`a.${Buffer.from("not json").toString("base64url")}.c`)).toBeNull();
  });
});

describe("isJwtExpired", () => {
  const now = Date.UTC(2026, 10, 13, 12, 0, 0);
  const nowS = now / 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => vi.useRealTimers());

  it("is false for a token valid beyond the skew", () => {
    expect(isJwtExpired(tokenWith({ exp: nowS + 31 }))).toBe(false);
  });

  it("is true within the default 30 s skew and after expiry", () => {
    expect(isJwtExpired(tokenWith({ exp: nowS + 30 }))).toBe(true);
    expect(isJwtExpired(tokenWith({ exp: nowS - 1 }))).toBe(true);
  });

  it("honours a custom skew", () => {
    expect(isJwtExpired(tokenWith({ exp: nowS + 10 }), 0)).toBe(false);
    expect(isJwtExpired(tokenWith({ exp: nowS + 100 }), 120)).toBe(true);
  });

  it("treats a missing or non-numeric exp, or garbage, as expired", () => {
    expect(isJwtExpired(tokenWith({}))).toBe(true);
    expect(isJwtExpired(tokenWith({ exp: String(nowS + 3600) }))).toBe(true);
    expect(isJwtExpired("garbage")).toBe(true);
  });
});
