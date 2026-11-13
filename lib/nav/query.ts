import { parseNumericId } from "@/lib/nav/ids";

/** The `?organization=` filter: a positive integer id, or `undefined` for anything else. */
export function parseOrganizationQueryParam(
  value: string | string[] | undefined,
): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return parseNumericId(raw) ?? undefined;
}
