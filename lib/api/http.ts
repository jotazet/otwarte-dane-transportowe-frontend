import { apiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Domyślny limit czasu żądania (ms). Zapobiega wiszącemu UI przy awarii backendu. */
export const DEFAULT_TIMEOUT_MS = 20_000;
/** Dłuższy limit dla przesyłania plików (multipart). */
export const UPLOAD_TIMEOUT_MS = 60_000;

/** Neutralny komunikat błędu połączenia/timeoutu (bez wycieku szczegółów backendu). */
export const CONNECTION_ERROR_MESSAGE = "Błąd połączenia z serwerem. Spróbuj ponownie.";

/**
 * `fetch` z limitem czasu. Zamienia błędy sieci/timeoutu na `ApiError(0, …)`
 * z neutralnym komunikatem zamiast surowego wyjątku przeglądarki.
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
    throw new ApiError(0, CONNECTION_ERROR_MESSAGE);
  }
}

/**
 * Spłaszcza wartość błędu DRF do listy linii. Zagnieżdżone błędy pól dostają
 * kropkowaną ścieżkę (np. `static_entry.file: Uploaded GTFS file is not a ZIP archive.`).
 */
function flattenErrorValue(prefix: string, value: unknown, out: string[]): void {
  if (value == null) return;
  if (Array.isArray(value)) {
    const strings = value.filter((x): x is string => typeof x === "string");
    if (strings.length) out.push(prefix ? `${prefix}: ${strings.join(", ")}` : strings.join(", "));
    for (const x of value) {
      if (x != null && typeof x === "object") flattenErrorValue(prefix, x, out);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flattenErrorValue(prefix ? `${prefix}.${k}` : k, v, out);
    }
    return;
  }
  out.push(prefix ? `${prefix}: ${String(value)}` : String(value));
}

/** Czytelny komunikat z treści odpowiedzi JSON (DRF: `detail`, błędy pól, tablice top-level). */
export async function formatApiErrorResponse(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  const generic = `HTTP ${res.status}`;
  if (!raw) return generic;
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    // Body nie jest JSON-em (np. strona błędu HTML / stack trace) — nie ujawniamy go użytkownikowi.
    return generic;
  }
  if (typeof j === "string") return j;
  if (j != null && !Array.isArray(j) && typeof j === "object") {
    const detail = (j as Record<string, unknown>).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("; ");
    }
  }
  const lines: string[] = [];
  flattenErrorValue("", j, lines);
  return lines.length ? lines.join("\n") : generic;
}

/** Bezpieczne parsowanie JSON dla odpowiedzi sukcesu (spójny błąd zamiast surowego SyntaxError). */
async function parseJsonOk<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
}

export async function getJson<T>(
  path: string,
  opts?: { revalidate?: number },
): Promise<T> {
  const useIsr =
    typeof opts?.revalidate === "number" && Number.isFinite(opts.revalidate) && opts.revalidate > 0;

  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
    ...(useIsr
      ? { next: { revalidate: opts!.revalidate } }
      : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  return parseJsonOk<T>(res);
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const res = await fetchWithTimeout(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await formatApiErrorResponse(res);
    throw new ApiError(res.status, msg);
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
    const msg = await formatApiErrorResponse(res);
    throw new ApiError(res.status, msg);
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
    const msg = await formatApiErrorResponse(res);
    throw new ApiError(res.status, msg);
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
    const msg = await formatApiErrorResponse(res);
    throw new ApiError(res.status, msg);
  }
}
