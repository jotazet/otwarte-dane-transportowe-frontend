"use client";

import { TechnicalDetails } from "@/components/layout/TechnicalDetails";
import type { Dictionary } from "@/i18n/getDictionary";
import type { FetchHealthFields } from "@/lib/api/types";
import { errorCodeLabel } from "@/lib/formatApiError";
import { formatDateTime, text } from "@/lib/format";
import { fill } from "@/lib/i18n/fill";

type HealthTextDict = Pick<
  Dictionary,
  "apiErrorCodes" | "fetchPauseAfterFailures" | "technicalDetailsShow" | "technicalDetailsHide"
>;

/**
 * The last fetch error: its translation when the message is a code, otherwise when it happened.
 * The message itself is backend text (backend ADR 0006), shown to Admins only.
 */
export function LastFetchError({
  health,
  locale,
  isAdmin,
  dict,
}: {
  health: FetchHealthFields;
  locale: string;
  isAdmin: boolean;
  dict: HealthTextDict;
}) {
  const message = health.last_fetch_error_message;
  const known = errorCodeLabel(message, dict);
  return (
    <>
      {known ?? formatDateTime(health.last_fetch_error_at, locale)}
      {isAdmin && message && !known ? <TechnicalDetails text={message} dict={dict} /> : null}
    </>
  );
}

/**
 * A manual pause keeps the reason a person typed. Otherwise the backend stores the last error
 * message there, so show its translation or the number of failed fetches instead.
 */
export function fetchPauseReasonText(health: FetchHealthFields, dict: HealthTextDict): string {
  const reason = health.fetch_pause_reason;
  if (health.fetch_status === "manual_paused" || !reason) return text(reason);
  return (
    errorCodeLabel(reason, dict) ??
    fill(dict.fetchPauseAfterFailures, { n: health.fetch_failure_count ?? 0 })
  );
}
