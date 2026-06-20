/** Dozwolony zakres interwału odświeżania źródła (sekundy). */
export const SOURCE_UPDATE_INTERVAL_MIN = 5;
export const SOURCE_UPDATE_INTERVAL_MAX = 120;
export const SOURCE_UPDATE_INTERVAL_DEFAULT = 60;

/** Wartość `0` z API = brak okresowej aktualizacji (tylko istniejące rekordy). */
export function isNoSourceUpdate(interval: string | number): boolean {
  const n = Number(interval);
  return Number.isFinite(n) && n === 0;
}

export function parseSourceUpdateInterval(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < SOURCE_UPDATE_INTERVAL_MIN || n > SOURCE_UPDATE_INTERVAL_MAX) return null;
  return n;
}
