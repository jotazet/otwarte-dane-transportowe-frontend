import type { Dictionary } from "@/i18n/getDictionary";
import { formatNumber } from "@/lib/format";
import { fill } from "@/lib/i18n/fill";

type GtfsRejectionDict = Pick<Dictionary, "gtfsValidationNotice" | "gtfsValidationRejectedGeneric">;

// The validator's notice codes with their counts, as the backend joins them: "code: 2, code: 1".
const NOTICE_COUNTS = /^[a-z0-9_]+: \d+(, [a-z0-9_]+: \d+)*$/;

/** One line for a notice of the MobilityData GTFS validator and its number of occurrences. */
export function gtfsNoticeLine(
  code: string,
  count: number,
  dict: Pick<Dictionary, "gtfsValidationNotice">,
  locale: string,
): string {
  return fill(dict.gtfsValidationNotice, { code, count: formatNumber(count, locale) });
}

/**
 * Translated reasons for an automatic GTFS rejection recorded before `rejection_reasons`
 * (backend changelog 2026-11-13, no data migration): such a rejection has no actor and keeps the
 * validator's notice codes or English text in `rejection_cause`. Notice codes are listed, any
 * other text gets a generic message. Returns `undefined` for a reviewer's rejection, whose own
 * words are shown as they are.
 */
export function gtfsRejectionReasons(
  cause: string | null | undefined,
  automatic: boolean,
  dict: GtfsRejectionDict,
  locale: string,
): string[] | undefined {
  if (!cause || !automatic) return undefined;
  const trimmed = cause.trim();
  if (!NOTICE_COUNTS.test(trimmed)) return [dict.gtfsValidationRejectedGeneric];
  return trimmed.split(", ").map((part) => {
    const [code, count] = part.split(": ");
    return gtfsNoticeLine(code, Number(count), dict, locale);
  });
}
