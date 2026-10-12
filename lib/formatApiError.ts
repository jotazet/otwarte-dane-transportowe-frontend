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
>;

/** A translated message for a failed request. Never the backend's own text (backend ADR 0006). */
export function formatApiError(err: unknown, dict: ApiErrorDict): string {
  if (!(err instanceof ApiError)) return dict.apiErrorGeneric;
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
