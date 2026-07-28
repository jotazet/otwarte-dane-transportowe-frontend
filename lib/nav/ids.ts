/**
 * Parsuje segment URL na dodatnie ID całkowite.
 * Odrzuca ułamki, zero, wartości ujemne, notację wykładniczą i puste stringi
 * (`Number.isFinite` przepuszcza `1.5`, `0`, `-3`, `1e3`, `"  "`).
 */
export function parseNumericId(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n > 0 ? n : null;
}
