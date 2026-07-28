import { notFound } from "next/navigation";

import { ApiError } from "@/lib/api/http";

/**
 * Uruchamia fetch strony serwerowej i zamienia 404/410 z API na `notFound()`
 * (renderuje `not-found.tsx` zamiast domyślnej strony 500).
 * Pozostałe błędy (5xx, sieć) propaguje do `error.tsx`.
 */
export async function loadOr404<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) {
      notFound();
    }
    throw e;
  }
}
