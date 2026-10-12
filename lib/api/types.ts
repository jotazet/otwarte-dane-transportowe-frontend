/** DRF paginated list or plain array. */
export type ApiListResponse<T> =
  T[] | { results?: T[]; count?: number; next?: string | null; previous?: string | null };

export function normalizeList<T>(data: ApiListResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

type GetJsonFn = <T>(path: string) => Promise<T>;

/** Twardy limit stron chroni przed zapętleniem przy błędnym `next`. */
const FETCH_ALL_MAX_PAGES = 100;

/**
 * Pobiera wszystkie strony paginowanej listy DRF. Numer strony liczony lokalnie
 * (nie nawigujemy po URL z `next` — unika rozjazdu originów za reverse-proxy);
 * `next` służy wyłącznie jako warunek stopu.
 */
export async function fetchAllPages<T>(
  get: GetJsonFn,
  basePath: string,
  pageSize = 200,
): Promise<T[]> {
  const all: T[] = [];
  const sep = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= FETCH_ALL_MAX_PAGES; page++) {
    const data = await get<ApiListResponse<T>>(
      `${basePath}${sep}page=${page}&page_size=${pageSize}`,
    );
    if (Array.isArray(data)) return data;
    all.push(...(data.results ?? []));
    if (!data.next) break;
  }
  return all;
}

/** DRF `PageNumberPagination` response shape. */
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type FetchStatus = "active" | "delayed" | "auto_paused" | "manual_paused";

/** Proxy-fetch health fields exposed on static entries and realtime endpoints. */
export type FetchHealthFields = {
  fetch_status?: FetchStatus | null;
  fetch_failure_count?: number | null;
  next_fetch_after?: string | null;
  fetch_paused_at?: string | null;
  fetch_pause_reason?: string | null;
  last_fetch_success_at?: string | null;
  last_fetch_error_at?: string | null;
  last_fetch_error_message?: string | null;
  fetch_error_count_7d?: number | null;
};

export type SubmissionHistoryEvent = {
  event_type?: string;
  stage_before?: number | null;
  stage_after?: number | null;
  actor?: string | null;
  cause?: string | null;
  created_at?: string;
};

export type SubmissionStageFields = {
  id: number;
  transport_organization: number | string;
  name?: string | null;
  note?: string | null;
  current_stage: number;
  current_stage_label: string;
  is_rejected: boolean;
  has_rejection_cause?: boolean;
  rejection_cause?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  submitted_by_username?: string | null;
  history?: SubmissionHistoryEvent[];
};

export type FeedSubmissionListItem = SubmissionStageFields & {
  data_type: string;
};

export type RealtimeSubmissionListItem = SubmissionStageFields & {
  protocol: string;
};

export type CombinedSubmissionsBundle = {
  static?: FeedSubmissionListItem[];
  realtime?: RealtimeSubmissionListItem[];
  static_submissions?: FeedSubmissionListItem[];
  realtime_submissions?: RealtimeSubmissionListItem[];
};
