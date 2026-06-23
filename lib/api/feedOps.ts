import type { FetchHealthFields, PaginatedResponse } from "@/lib/api/types";

export const feedOpsPaths = {
  proxyFeeds: "/api/data_manager/proxy-feeds/",
  fetchErrors: "/api/data_manager/fetch-errors/",
  staticPauseFetch: (id: number) => `/api/data_manager/static-feed-entries/${id}/pause-fetch/`,
  staticResumeFetch: (id: number) => `/api/data_manager/static-feed-entries/${id}/resume-fetch/`,
  realtimePauseFetch: (id: number) => `/api/data_manager/realtime-endpoints/${id}/pause-fetch/`,
  realtimeResumeFetch: (id: number) => `/api/data_manager/realtime-endpoints/${id}/resume-fetch/`,
} as const;

export type FetchErrorSource = "static" | "realtime";

export type ProxyFeedListItem = FetchHealthFields & {
  source: FetchErrorSource;
  /** Static entry or realtime endpoint id — target for pause/resume. */
  id: number;
  submission_id: number;
  organization: string;
  region?: string | null;
  feed_name: string;
  data_type?: string | null;
  protocol?: string | null;
  endpoint_type?: string | null;
};

export type FeedFetchError = {
  id: number;
  source?: FetchErrorSource | string | null;
  error_type?: string | null;
  endpoint_type?: string | null;
  message?: string | null;
  created_at?: string | null;
  status_code?: number | null;
  url?: string | null;
  feed_submission?: number | null;
  realtime_submission?: number | null;
  organization?: string | null;
  region?: string | null;
  feed_name?: string | null;
};

export const PROXY_FEEDS_PAGE_SIZE = 25;
export const FETCH_ERROR_DAY_OPTIONS = [7, 14, 30, 90, 365] as const;
export const FETCH_ERRORS_PAGE_SIZE = 25;

export function buildProxyFeedsQuery(params: { page?: number; pageSize?: number }): string {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  q.set("page_size", String(params.pageSize ?? PROXY_FEEDS_PAGE_SIZE));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type FetchErrorFilters = {
  days: number;
  page: number;
  pageSize?: number;
  errorType?: string;
  source?: FetchErrorSource | "";
  endpointType?: string;
};

export function buildFetchErrorsQuery(filters: FetchErrorFilters): string {
  const q = new URLSearchParams();
  q.set("days", String(filters.days));
  q.set("page", String(filters.page));
  q.set("page_size", String(filters.pageSize ?? FETCH_ERRORS_PAGE_SIZE));
  if (filters.errorType) q.set("error_type", filters.errorType);
  if (filters.source) q.set("source", filters.source);
  if (filters.endpointType) q.set("endpoint_type", filters.endpointType);
  return `?${q.toString()}`;
}

/** `#<id> name` or `#<id>` when name is absent. */
export function formatSubmissionFeedLabel(id: number, name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? `#${id} ${trimmed}` : `#${id}`;
}

export function proxyFeedTypeLabel(
  item: Pick<ProxyFeedListItem, "source" | "data_type" | "protocol" | "endpoint_type">,
): string {
  if (item.source === "static") return item.data_type?.trim() ?? "";
  return [item.protocol, item.endpoint_type].filter(Boolean).join(" · ");
}

export function pauseFetchPath(source: FetchErrorSource, id: number, action: "pause" | "resume"): string {
  if (source === "static") {
    return action === "pause" ? feedOpsPaths.staticPauseFetch(id) : feedOpsPaths.staticResumeFetch(id);
  }
  return action === "pause" ? feedOpsPaths.realtimePauseFetch(id) : feedOpsPaths.realtimeResumeFetch(id);
}

type ApiJson = <T>(method: string, path: string, body?: unknown) => Promise<T>;

/** Loads all pages (for overview stats). */
export async function fetchAllProxyFeeds(apiJson: ApiJson): Promise<ProxyFeedListItem[]> {
  const all: ProxyFeedListItem[] = [];
  let page = 1;
  for (;;) {
    const data = await apiJson<PaginatedResponse<ProxyFeedListItem>>(
      "GET",
      `${feedOpsPaths.proxyFeeds}${buildProxyFeedsQuery({ page, pageSize: 100 })}`,
    );
    all.push(...(data.results ?? []));
    if (!data.next) break;
    page += 1;
  }
  return all;
}
