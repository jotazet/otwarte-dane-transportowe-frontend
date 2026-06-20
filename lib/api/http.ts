import { apiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Czytelny komunikat z treści odpowiedzi JSON (DRF: `detail`, błędy pól). */
export async function formatApiErrorResponse(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  if (!raw) return `HTTP ${res.status}`;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("; ");
    }
    const lines: string[] = [];
    for (const [k, v] of Object.entries(j)) {
      if (v == null) continue;
      if (Array.isArray(v)) lines.push(`${k}: ${v.map(String).join(", ")}`);
      else if (typeof v === "object") lines.push(`${k}: ${JSON.stringify(v)}`);
      else lines.push(`${k}: ${String(v)}`);
    }
    return lines.length ? lines.join("\n") : raw;
  } catch {
    return raw;
  }
}

export async function getJson<T>(
  path: string,
  opts?: { revalidate?: number },
): Promise<T> {
  const useIsr =
    typeof opts?.revalidate === "number" && Number.isFinite(opts.revalidate) && opts.revalidate > 0;

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
    ...(useIsr
      ? { next: { revalidate: opts!.revalidate } }
      : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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
  return (await res.json()) as TResponse;
}

export async function putJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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
  return (await res.json()) as TResponse;
}export async function patchJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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
  return (await res.json()) as TResponse;
}export async function deleteVoid(path: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const msg = await formatApiErrorResponse(res);
    throw new ApiError(res.status, msg);
  }
}