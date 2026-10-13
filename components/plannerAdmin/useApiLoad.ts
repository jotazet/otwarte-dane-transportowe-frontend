"use client";

import * as React from "react";

export type Loaded<T> = { data: T | null; error: unknown; loading: boolean };

/**
 * Runs `load` whenever it changes (wrap it in useCallback with its inputs) and keeps the
 * last result; a response that arrives after a newer request started is dropped.
 */
export function useApiLoad<T>(load: () => Promise<T>): Loaded<T> & { reload: () => void } {
  const [state, setState] = React.useState<Loaded<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let current = true;
    void (async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const data = await load();
        if (current) setState({ data, error: null, loading: false });
      } catch (error) {
        if (current) setState({ data: null, error, loading: false });
      }
    })();
    return () => {
      current = false;
    };
  }, [load, tick]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
