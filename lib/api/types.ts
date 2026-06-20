/** DRF paginated list or plain array. */
export type ApiListResponse<T> = T[] | { results?: T[]; count?: number; next?: string | null; previous?: string | null };

export function normalizeList<T>(data: ApiListResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

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
