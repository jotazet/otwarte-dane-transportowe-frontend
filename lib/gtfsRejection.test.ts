import { describe, expect, it } from "vitest";

import { dictPl } from "@/i18n/lang/pl";
import { gtfsRejectionReasons } from "@/lib/gtfsRejection";

// Rejections recorded before `rejection_reasons` keep their text in `rejection_cause`.
describe("gtfsRejectionReasons (older rejections)", () => {
  it("lists the validator's notice codes stored as text", () => {
    expect(
      gtfsRejectionReasons("missing_required_file: 2, invalid_url: 1234", true, dictPl, "pl"),
    ).toEqual([
      "Walidator GTFS: missing_required_file, liczba wystąpień: 2",
      "Walidator GTFS: invalid_url, liczba wystąpień: 1234",
    ]);
  });

  it("replaces other automatic text with a generic message", () => {
    expect(
      gtfsRejectionReasons("Could not download the feed: HTTP 404", true, dictPl, "pl"),
    ).toEqual([dictPl.gtfsValidationRejectedGeneric]);
  });

  it("leaves a reviewer's text and an empty cause alone", () => {
    expect(gtfsRejectionReasons("Brakuje pliku calendar.txt", false, dictPl, "pl")).toBeUndefined();
    expect(gtfsRejectionReasons(null, true, dictPl, "pl")).toBeUndefined();
  });
});
