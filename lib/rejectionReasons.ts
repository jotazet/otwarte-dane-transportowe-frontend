import type { Dictionary } from "@/i18n/getDictionary";
import type { RejectionReason } from "@/lib/api/types";
import { formatBytes, formatNumber } from "@/lib/format";
import { fill } from "@/lib/i18n/fill";

type RejectionReasonDict = Pick<
  Dictionary,
  | "realtimeRejectionReasons"
  | "gtfsRejectionReasons"
  | "gtfsValidationNotice"
  | "realtimeRejectionReasonUnknown"
>;

// Standard format names, never translated.
const PROTOCOL_NAMES: Record<string, string> = {
  gtfs_rt: "GTFS-RT",
  siri: "SIRI",
  gbfs: "GBFS",
};

/**
 * Translated messages for coded automatic rejection reasons of realtime and static submissions
 * (backend ADR 0006, docs/api/feeds.md "Realtime rejection reasons" and "Static rejection
 * reasons"). The GTFS validator's notices of `gtfs_validation.feed_invalid` follow its message,
 * one line each. Unknown codes get a generic message, never the code itself.
 */
export function formatRejectionReasons(
  reasons: RejectionReason[],
  dict: RejectionReasonDict,
  locale = "pl",
): string[] {
  const messages: Record<string, string> = {
    ...dict.realtimeRejectionReasons,
    ...dict.gtfsRejectionReasons,
  };
  return reasons.flatMap(({ code, details = {} }) => {
    const template = Object.hasOwn(messages, code)
      ? messages[code]
      : dict.realtimeRejectionReasonUnknown;
    const message = fill(template, {
      endpoint: details.endpoint_type ?? "",
      status: String(details.status ?? ""),
      protocol: PROTOCOL_NAMES[details.protocol ?? ""] ?? details.protocol ?? "",
      errorCount: formatNumber(details.error_count ?? 0, locale),
      limit: details.limit_bytes != null ? formatBytes(details.limit_bytes, locale) : "",
    });
    const notices = Object.entries(details.notices ?? {}).map(([notice, count]) =>
      fill(dict.gtfsValidationNotice, { code: notice, count: formatNumber(count, locale) }),
    );
    return [message, ...notices];
  });
}
