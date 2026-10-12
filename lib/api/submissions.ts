import type {
  CombinedSubmissionsBundle,
  FeedSubmissionListItem,
  RealtimeSubmissionListItem,
} from "@/lib/api/types";
import { normalizeList } from "@/lib/api/types";

export const submissionsPaths = {
  combined: "/api/data_manager/submissions/",
  feedList: "/api/data_manager/feed-submissions/",
  feedDetail: (id: number) => `/api/data_manager/feed-submissions/${id}/`,
  feedDownloadStatic: (id: number, endpointPk: number) =>
    `/api/data_manager/feed-submissions/${id}/download/static/${endpointPk}/`,
  realtimeList: "/api/data_manager/realtime-submissions/",
  realtimeDetail: (id: number) => `/api/data_manager/realtime-submissions/${id}/`,
  eligibleStatic: (orgId: number, suffix: string) =>
    `/api/data_manager/realtime-submissions/eligible-static-submissions/${orgId}/${suffix}/`,
  realtimeDownload: (staticId: number, epPk: number) =>
    `/api/data_manager/feed-submissions/${staticId}/download/realtime/${epPk}/`,
} as const;

export function parseCombinedSubmissions(data: CombinedSubmissionsBundle | null | undefined) {
  return {
    static: data?.static ?? data?.static_submissions ?? [],
    realtime: data?.realtime ?? data?.realtime_submissions ?? [],
  };
}

export function parseFeedSubmissionList(
  data: FeedSubmissionListItem[] | { results?: FeedSubmissionListItem[] },
) {
  return normalizeList(data);
}

export function parseRealtimeSubmissionList(
  data: RealtimeSubmissionListItem[] | { results?: RealtimeSubmissionListItem[] },
) {
  return normalizeList(data);
}

export function buildListQuery(
  params: Record<string, string | number | boolean | undefined | null>,
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
