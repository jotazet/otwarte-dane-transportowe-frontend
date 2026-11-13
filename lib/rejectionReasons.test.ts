import { describe, expect, it } from "vitest";

import { dictEn } from "@/i18n/lang/en";
import { dictPl } from "@/i18n/lang/pl";
import { formatRejectionReasons } from "@/lib/rejectionReasons";

describe("formatRejectionReasons", () => {
  it("lists the GTFS validator's notices after the summary of an invalid feed", () => {
    const reasons = formatRejectionReasons(
      [
        {
          code: "gtfs_validation.feed_invalid",
          details: { error_count: 1234, notices: { missing_required_file: 2, invalid_url: 1 } },
        },
      ],
      dictEn,
      "en",
    );
    expect(reasons).toEqual([
      "The GTFS validator found errors in the feed. Number of errors: 1,234.",
      "GTFS validator: missing_required_file, occurrences: 2",
      "GTFS validator: invalid_url, occurrences: 1",
    ]);
  });

  it("shows only the summary when the report has no notices", () => {
    const reasons = formatRejectionReasons(
      [{ code: "gtfs_validation.feed_invalid", details: { error_count: 3, notices: {} } }],
      dictPl,
      "pl",
    );
    expect(reasons).toEqual(["Walidator GTFS wykrył błędy w feedzie. Liczba błędów: 3."]);
  });

  it("fills the HTTP status and the size limit of download failures", () => {
    const reasons = formatRejectionReasons(
      [
        { code: "gtfs_validation.download_http_error", details: { status: 404 } },
        { code: "gtfs_validation.download_too_large", details: { limit_bytes: 500_000_000 } },
      ],
      dictEn,
      "en",
    );
    expect(reasons[0]).toContain("HTTP error 404");
    expect(reasons[1]).toBe("The feed file exceeds the size limit of 500 MB.");
  });

  it.each([
    "gtfs_validation.download_url_blocked",
    "gtfs_validation.download_timeout",
    "gtfs_validation.download_unreachable",
    "gtfs_validation.download_failed",
  ])("translates %s without details", (code) => {
    const [reason] = formatRejectionReasons([{ code, details: {} }], dictPl, "pl");
    expect(reason).toBe((dictPl.gtfsRejectionReasons as Record<string, string>)[code]);
    expect(reason).not.toMatch(/\{\w+\}/);
  });

  it("still translates realtime reasons", () => {
    const reasons = formatRejectionReasons(
      [
        {
          code: "realtime.endpoint_http_error",
          details: { endpoint_type: "vehicle_positions", status: 503 },
        },
      ],
      dictEn,
      "en",
    );
    expect(reasons).toEqual([
      'Endpoint "vehicle_positions" returned HTTP error 503. Check the URL and the authorization details.',
    ]);
  });

  it("never shows an unknown code", () => {
    for (const code of ["gtfs_validation.something_new", "toString"]) {
      expect(formatRejectionReasons([{ code }], dictPl, "pl")).toEqual([
        dictPl.rejectionReasonUnknown,
      ]);
    }
  });
});
