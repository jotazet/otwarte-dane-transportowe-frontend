export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** Page numbers to render: 1, …, neighbors of current, …, last. */
export function buildPageRange(
  current: number,
  total: number,
  siblingCount = 1,
  boundaryCount = 1,
): Array<number | "ellipsis"> {
  if (total <= 1) return total === 1 ? [1] : [];
  // Przytnij `current` do [1, total], aby strona poza zakresem nie gubiła środka zakresu.
  current = Math.min(Math.max(current, 1), total);

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const startPages = range(1, Math.min(boundaryCount, total));
  const endPages = range(Math.max(total - boundaryCount + 1, boundaryCount + 1), total);

  const siblingsStart = Math.max(current - siblingCount, boundaryCount + 1);
  const siblingsEnd = Math.min(current + siblingCount, total - boundaryCount);

  const items: Array<number | "ellipsis"> = [...startPages];

  if (siblingsStart > boundaryCount + 1) {
    items.push("ellipsis");
  }

  if (siblingsStart <= siblingsEnd) {
    items.push(...range(siblingsStart, siblingsEnd));
  }

  if (siblingsEnd < total - boundaryCount) {
    items.push("ellipsis");
  }

  for (const page of endPages) {
    if (!items.includes(page)) items.push(page);
  }

  return items;
}
