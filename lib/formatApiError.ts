export function formatApiError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
