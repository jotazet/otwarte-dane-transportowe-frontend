import type { Dictionary } from "@/i18n/dictionary";
import { ApiError } from "@/lib/api/http";

type ApiErrorDict = Pick<
  Dictionary,
  | "apiErrorConnection"
  | "apiErrorInvalidData"
  | "apiErrorLoginRequired"
  | "apiErrorForbidden"
  | "apiErrorNotFound"
  | "apiErrorRateLimited"
  | "apiErrorGeneric"
> &
  // Optional so a panel with its own codes (the planner admin) need not ship them all.
  Partial<Pick<Dictionary, "apiErrorCodes">>;

/**
 * A translated message for a failed request. Never the backend's own text (backend ADR 0006):
 * the error's `code` is looked up in `codeLabels`, then in `apiErrorCodes`; an unknown code
 * falls back to the HTTP status.
 */
export function formatApiError(
  err: unknown,
  dict: ApiErrorDict,
  codeLabels?: Record<string, string>,
): string {
  if (!(err instanceof ApiError)) return dict.apiErrorGeneric;
  if (err.code) {
    const known: Record<string, string> = dict.apiErrorCodes ?? {};
    const label = codeLabels?.[err.code] ?? known[err.code];
    if (label) return label;
  }
  switch (err.status) {
    case 0:
      return dict.apiErrorConnection;
    case 400:
      return dict.apiErrorInvalidData;
    case 401:
      return dict.apiErrorLoginRequired;
    case 403:
      return dict.apiErrorForbidden;
    case 404:
      return dict.apiErrorNotFound;
    case 429:
      return dict.apiErrorRateLimited;
    default:
      return dict.apiErrorGeneric;
  }
}
