/** The usual range of a source refresh interval in seconds; the backend sets only the minimum. */
export const SOURCE_UPDATE_INTERVAL_MIN = 5;
export const SOURCE_UPDATE_INTERVAL_MAX = 120;
export const SOURCE_UPDATE_INTERVAL_DEFAULT = 60;

/** `0` from the API = no periodic update (existing records only). */
export function isNoSourceUpdate(interval: string | number): boolean {
  const n = Number(interval);
  return Number.isFinite(n) && n === 0;
}

/**
 * Parses an interval in the usual range. `stored` is the value already saved on the
 * endpoint: it stays valid outside the usual range, so such a submission can be saved.
 */
export function parseSourceUpdateInterval(value: string, stored?: number): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  // The stored value stays valid, also 0 (no periodic update) on older records.
  if (n === stored) return n;
  if (n < SOURCE_UPDATE_INTERVAL_MIN || n > SOURCE_UPDATE_INTERVAL_MAX) return null;
  return n;
}

/** The `max` of an interval input: the usual maximum, or the stored value when it is larger. */
export function sourceUpdateIntervalMax(stored?: number): number {
  return Math.max(SOURCE_UPDATE_INTERVAL_MAX, stored ?? 0);
}
