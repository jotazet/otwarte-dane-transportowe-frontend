import { apiBaseUrl } from "@/lib/config";

/**
 * A failed request. `status` is 0 when the server could not be reached; `code` is the
 * backend's error code when the body has the `{code, details}` shape (backend ADR 0006).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

/** The `code` of a failed response's `{code, details}` body, if it has one. */
export async function readErrorCode(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "code" in body && typeof body.code === "string") {
      return body.code;
    }
  } catch {
    // Not JSON: no code.
  }
  return undefined;
}

/** Domyślny limit czasu żądania (ms). Zapobiega wiszącemu UI przy awarii backendu. */
export const DEFAULT_TIMEOUT_MS = 20_000;
/** Dłuższy limit dla przesyłania plików (multipart). */
export const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * `fetch` with a timeout. Turns network errors and timeouts into an `ApiError` with
 * status 0 instead of the raw browser exception.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, "Connection failed");
  }
}

/** Bezpieczne parsowanie JSON dla odpowiedzi sukcesu (spójny błąd zamiast surowego SyntaxError). */
async function parseJsonOk<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
}

export async function getJson<T>(path: string, opts?: { revalidate?: number }): Promise<T> {
  const useIsr =
    typeof opts?.revalidate === "number" && Number.isFinite(opts.revalidate) && opts.revalidate > 0;

  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
    ...(useIsr ? { next: { revalidate: opts!.revalidate } } : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  return parseJsonOk<T>(res);
}

export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as TResponse;
  return parseJsonOk<TResponse>(res);
}

export async function putJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as TResponse;
  return parseJsonOk<TResponse>(res);
}

export async function patchJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as TResponse;
  return parseJsonOk<TResponse>(res);
}

export async function deleteVoid(path: string): Promise<void> {
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
}
