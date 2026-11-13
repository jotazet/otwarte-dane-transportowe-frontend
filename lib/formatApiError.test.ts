import { describe, expect, it } from "vitest";

import { dictPl } from "@/i18n/lang/pl";
import { ApiError, apiErrorFrom } from "@/lib/api/http";
import { formatApiError } from "@/lib/formatApiError";

const RAW = "Backend prose that must never reach the screen";

describe("formatApiError", () => {
  it.each([
    [0, dictPl.apiErrorConnection],
    [400, dictPl.apiErrorInvalidData],
    [401, dictPl.apiErrorLoginRequired],
    [403, dictPl.apiErrorForbidden],
    [404, dictPl.apiErrorNotFound],
    [429, dictPl.apiErrorRateLimited],
    [500, dictPl.apiErrorGeneric],
    [503, dictPl.apiErrorGeneric],
  ])("translates HTTP %i without the backend's text", (status, expected) => {
    expect(formatApiError(new ApiError(status, RAW), dictPl)).toBe(expected);
  });

  it("translates a known error code instead of the status", () => {
    const err = new ApiError(400, RAW, "feeds.field_locked");
    expect(formatApiError(err, dictPl)).toBe(dictPl.apiErrorCodes["feeds.field_locked"]);
  });

  it("prefers a panel's own code labels", () => {
    const err = new ApiError(409, RAW, "planner.build_in_progress");
    expect(formatApiError(err, dictPl, dictPl.plannerAdminErrorCodes)).toBe(
      dictPl.plannerAdminErrorCodes["planner.build_in_progress"],
    );
  });

  it("falls back to the status for an unknown code, and never shows the code", () => {
    const err = new ApiError(403, RAW, "feeds.some_future_code");
    expect(formatApiError(err, dictPl)).toBe(dictPl.apiErrorForbidden);
  });

  it("shows the generic message for anything that is not an ApiError", () => {
    expect(formatApiError(new Error(RAW), dictPl)).toBe(dictPl.apiErrorGeneric);
    expect(formatApiError(RAW, dictPl)).toBe(dictPl.apiErrorGeneric);
  });
});

describe("apiErrorFrom", () => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  it("reads the code of a {code, details} body", async () => {
    const err = await apiErrorFrom(json(409, { code: "feeds.stage_changed", details: {} }));
    expect(err).toMatchObject({ status: 409, code: "feeds.stage_changed" });
  });

  it("finds a code among nested field errors", async () => {
    const err = await apiErrorFrom(json(400, { static_entry: { url: ["feeds.url_blocked"] } }));
    expect(err.code).toBe("feeds.url_blocked");
  });

  it("takes no code from DRF prose or a non-JSON body", async () => {
    expect((await apiErrorFrom(json(400, { name: ["This field is required."] }))).code).toBe(
      undefined,
    );
    expect((await apiErrorFrom(json(403, { detail: RAW }))).code).toBe(undefined);
    expect(
      (await apiErrorFrom(new Response("<html>Bad gateway</html>", { status: 502 }))).code,
    ).toBe(undefined);
  });
});
