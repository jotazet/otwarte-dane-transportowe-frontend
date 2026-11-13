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

  it.each([" ", "1.5", "-3", "0x10"])("ignores %j, which is not an id", (value) => {
    expect(parseOrganizationQueryParam(value)).toBeUndefined();
  });
});
