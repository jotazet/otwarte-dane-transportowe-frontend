/**
 * Parses a URL segment or query value into a positive integer id.
 * Accepts digits only: rejects fractions, zero, negative values, exponent
 * notation, surrounding whitespace and empty strings, all of which `Number()`
 * would let through.
 */
export function parseNumericId(raw: string | null | undefined): number | null {
  if (raw == null || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
