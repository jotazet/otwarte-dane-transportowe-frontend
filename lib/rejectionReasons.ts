import type { Dictionary } from "@/i18n/getDictionary";
import type { RejectionReason } from "@/lib/api/types";

type RejectionReasonDict = Pick<
  Dictionary,
  "realtimeRejectionReasons" | "realtimeRejectionReasonUnknown"
>;

// Standard format names, never translated.
const PROTOCOL_NAMES: Record<string, string> = {
  gtfs_rt: "GTFS-RT",
  siri: "SIRI",
  gbfs: "GBFS",
};

/**
 * Translated messages for coded rejection reasons (backend ADR 0006,
 * docs/api/feeds.md "Realtime rejection reasons"). Unknown codes get a
 * generic message, never the code itself.
 */
export function formatRejectionReasons(
  reasons: RejectionReason[],
  dict: RejectionReasonDict,
): string[] {
  const messages = dict.realtimeRejectionReasons as Record<string, string>;
  return reasons.map(({ code, details = {} }) => {
    const template = messages[code] ?? dict.realtimeRejectionReasonUnknown;
    const values: Record<string, string> = {
      endpoint: details.endpoint_type ?? "",
      status: String(details.status ?? ""),
      protocol: PROTOCOL_NAMES[details.protocol ?? ""] ?? details.protocol ?? "",
    };
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  });
}
