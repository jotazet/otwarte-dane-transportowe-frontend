/** Lower case without diacritics, so "lodz" finds "Łódź". */
function fold(value: string) {
  return value.toLocaleLowerCase("pl").replace(/ł/g, "l").normalize("NFD").replace(/\p{M}/gu, "");
}

/** True when the query is empty or any of the fields contains it. */
export function matchesSearch(query: string, fields: (string | null | undefined)[]) {
  const q = fold(query.trim());
  return !q || fields.some((field) => field != null && fold(field).includes(q));
}
