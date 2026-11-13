import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatNumber,
  formatPercent,
  formatTime,
  formatTimeOfDay,
  text,
} from "@/lib/format";

// Every date-time is shown in Europe/Warsaw, whatever the zone of the server or browser.
// In 2026 summer time starts on 29 March at 01:00 UTC and ends on 25 October at 01:00 UTC.

describe("formatTime", () => {
  it("follows the switch to summer time", () => {
    expect(formatTime("2026-03-29T00:59:00Z")).toBe("01:59");
    expect(formatTime("2026-03-29T01:00:00Z")).toBe("03:00");
  });

  it("follows the switch back to winter time", () => {
    expect(formatTime("2026-10-25T00:30:00Z")).toBe("02:30");
    expect(formatTime("2026-10-25T01:30:00Z")).toBe("02:30");
    expect(formatTime("2026-10-25T02:00:00Z")).toBe("03:00");
  });
});

describe("formatDate", () => {
  it("gives the Warsaw date, not the UTC one", () => {
    expect(formatDate("2026-01-31T23:30:00Z")).toBe("2026-02-01"); // UTC+1
    expect(formatDate("2026-06-30T22:30:00Z")).toBe("2026-07-01"); // UTC+2
    expect(formatDate("2026-06-30T21:59:00Z")).toBe("2026-06-30");
  });

  it("handles missing and unparseable values", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("")).toBe("-");
    expect(formatDate("not a date")).toBe("not a date");
  });
});

describe("formatDateTime", () => {
  it("formats in the page's language and the Warsaw zone", () => {
    expect(formatDateTime("2026-03-29T01:00:00Z", "pl")).toBe("29 mar 2026, 03:00");
    expect(formatDateTime("2026-03-29T01:00:00Z", "en")).toBe("29 Mar 2026, 03:00");
  });

  it("handles missing and unparseable values", () => {
    expect(formatDateTime(undefined)).toBe("-");
    expect(formatDateTime("  ")).toBe("-");
  });
});

describe("formatDayMonth", () => {
  it("uses the Warsaw date", () => {
    expect(formatDayMonth("2026-10-12T22:30:00Z", "pl")).toBe("13 paź");
  });
});

describe("formatTimeOfDay", () => {
  it("shortens an API time and refuses anything else", () => {
    expect(formatTimeOfDay("03:00:00")).toBe("03:00");
    expect(formatTimeOfDay("23:59")).toBe("23:59");
    expect(formatTimeOfDay("3:00")).toBeNull();
    expect(formatTimeOfDay(null)).toBeNull();
  });
});

describe("numbers", () => {
  it("use the locale's separators", () => {
    expect(formatNumber(12345, "pl")).toBe("12 345");
    expect(formatNumber(12345, "en")).toBe("12,345");
    expect(formatPercent(0.349, "pl", 1)).toBe("34,9%");
    expect(formatPercent(0.97, "pl")).toBe("97%");
  });

  it("switch from megabytes to gigabytes at 1 GB", () => {
    // ICU picks the kind of space before the unit.
    expect(formatBytes(2_100_000_000, "pl")).toMatch(/^2,1\sGB$/);
    expect(formatBytes(999_000_000, "en")).toMatch(/^999\sMB$/);
  });
});

describe("text", () => {
  it("shows a dash for empty values", () => {
    expect(text(null)).toBe("-");
    expect(text("   ")).toBe("-");
    expect(text(0)).toBe("0");
  });
});
