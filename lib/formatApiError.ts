import type { Dictionary } from "@/i18n/dictionary";
import { ApiError } from "@/lib/api/http";

export function formatApiError(
  err: unknown,
  dict: Pick<Dictionary, "apiErrorConnection" | "apiErrorLoginRequired">,
): string {
  if (err instanceof ApiError) {
    if (err.code === "client.connection_failed") return dict.apiErrorConnection;
    if (err.code === "client.login_required") return dict.apiErrorLoginRequired;
  }
  return err instanceof Error ? err.message : String(err);
}
