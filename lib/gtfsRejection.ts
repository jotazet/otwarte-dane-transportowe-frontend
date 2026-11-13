import type { Dictionary } from "@/i18n/getDictionary";
import { fill } from "@/lib/i18n/fill";

type GtfsRejectionDict = Pick<Dictionary, "gtfsValidationNotice" | "gtfsValidationRejectedGeneric">;

// The validator's notice codes with their counts, as the backend joins them: "code: 2, code: 1".
const NOTICE_COUNTS = /^[a-z0-9_]+: \d+(, [a-z0-9_]+: \d+)*$/;

/**
 * Translated reasons for an automatic GTFS rejection (a history entry without an actor). The
 * backend still stores the validator's notice codes or English text in `rejection_cause`
 * (backend ADR 0006, not migrated yet): notice codes are listed, any other text gets a generic
 * message. Returns `undefined` for a reviewer's rejection, whose own words are shown as they are.
 */
export function gtfsRejectionReasons(
  cause: string | null | undefined,
  automatic: boolean,
  dict: GtfsRejectionDict,
): string[] | undefined {
  if (!cause || !automatic) return undefined;
  const trimmed = cause.trim();
  if (!NOTICE_COUNTS.test(trimmed)) return [dict.gtfsValidationRejectedGeneric];
  return trimmed.split(", ").map((part) => {
    const [code, count] = part.split(": ");
    return fill(dict.gtfsValidationNotice, { code, count });
  });
}
