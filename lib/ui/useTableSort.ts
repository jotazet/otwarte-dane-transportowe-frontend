import { useCallback, useState } from "react";

export function useTableSort<T extends string>(defaultColumn: T) {
  const [sortColumn, setSortColumn] = useState<T>(defaultColumn);
  const [sortAscending, setSortAscending] = useState(true);

  const toggleSort = useCallback(
    (col: T) => {
      if (sortColumn === col) setSortAscending((v) => !v);
      else {
        setSortColumn(col);
        setSortAscending(true);
      }
    },
    [sortColumn],
  );

  return { sortColumn, sortAscending, toggleSort, setSortColumn, setSortAscending };
}
