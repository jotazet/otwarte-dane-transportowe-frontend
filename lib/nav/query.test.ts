import { describe, expect, it } from "vitest";

import { parseOrganizationQueryParam } from "@/lib/nav/query";

describe("parseOrganizationQueryParam", () => {
  it("reads an organization id", () => {
    expect(parseOrganizationQueryParam("12")).toBe(12);
    expect(parseOrganizationQueryParam(["7", "8"])).toBe(7);
  });

  it("ignores a missing, empty or non-numeric value", () => {
    expect(parseOrganizationQueryParam(undefined)).toBeUndefined();
    expect(parseOrganizationQueryParam("")).toBeUndefined();
    expect(parseOrganizationQueryParam([])).toBeUndefined();
    expect(parseOrganizationQueryParam("abc")).toBeUndefined();
  });

  // `Number()` turns " " into 0 and accepts "1.5", "-3" and "0x10", none of which is an
  // organization id: the list then filters by a value the backend rejects or never matches.
  it.fails.each([" ", "1.5", "-3", "0x10"])("ignores %j, which is not an id", (value) => {
    expect(parseOrganizationQueryParam(value)).toBeUndefined();
  });
});
