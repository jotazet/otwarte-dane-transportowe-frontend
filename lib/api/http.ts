import { apiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
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
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, `POST ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as TResponse;
  return (await res.json()) as TResponse;
}

