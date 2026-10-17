import type { ApiJson } from "@/lib/api/http";
import { fetchAllPages, type PaginatedResponse } from "@/lib/api/types";

/** Journey planner admin API (backend `docs/api/planner-admin.md`). Every route needs the Admin group. */
const BASE = "/api/planner/admin";

export const plannerAdminPaths = {
  status: `${BASE}/status/`,
  feeds: `${BASE}/feeds/`,
  feed: (id: number) => `${BASE}/feeds/${id}/`,
  feedCandidates: `${BASE}/feed-candidates/`,
  rentalSources: `${BASE}/rental-sources/`,
  rentalSource: (id: number) => `${BASE}/rental-sources/${id}/`,
  rentalCandidates: `${BASE}/rental-candidates/`,
  builds: `${BASE}/builds/`,
  build: (id: number) => `${BASE}/builds/${id}/`,
  activateBuild: (id: number) => `${BASE}/builds/${id}/activate/`,
  schedule: `${BASE}/schedule/`,
  osm: `${BASE}/osm/`,
  settings: `${BASE}/settings/`,
  apiKeys: `${BASE}/api-keys/`,
  apiKey: (id: number) => `${BASE}/api-keys/${id}/`,
  ipBans: `${BASE}/ip-bans/`,
  ipBan: (id: number) => `${BASE}/ip-bans/${id}/`,
  requests: `${BASE}/requests/`,
  statsSummary: `${BASE}/stats/summary/`,
  statsTimeseries: `${BASE}/stats/timeseries/`,
  statsEndpoints: `${BASE}/stats/endpoints/`,
  statsTopClients: `${BASE}/stats/top-clients/`,
  statsUserAgents: `${BASE}/stats/user-agents/`,
} as const;

export type PlannerOrganization = { id: number; name: string; region: string };

export type FeedOutcome = "fresh" | "stale" | "excluded";
export type RentalOutcome = "included" | "skipped";
export type FailurePolicy = "keep_last_good" | "exclude";
export type RealtimeUpdater = "stop-time-updater" | "vehicle-positions" | "real-time-alerts";

export type RealtimeSkipped = { feed_id: string; endpoint_type: string; error_code: string };

/** One feed's entry in a build (`feed_results`, `active_result`). */
export type FeedResult = {
  planner_feed?: number;
  feed_id: string;
  submission?: number;
  outcome: FeedOutcome;
  sha256?: string;
  version_at: string | null;
  error_code: string;
  log_excerpt: string;
  realtime_skipped: RealtimeSkipped[];
  realtime_polled?: RealtimeUpdater[];
};

export type RentalResult = {
  rental_source: number;
  network: string;
  submission: number;
  outcome: RentalOutcome;
  error_code: string;
};

export type PlannerFeed = {
  id: number;
  submission: number;
  submission_name: string;
  organization: PlannerOrganization;
  feed_id: string;
  is_enabled: boolean;
  include_realtime: boolean;
  /** A submission of the same organization whose GTFS-RT is polled instead, or null for its own. */
  realtime_from: number | null;
  failure_policy: FailurePolicy;
  last_good_at: string | null;
  active_result: FeedResult | null;
  created_at: string;
  updated_at: string;
};

export type PlannerRentalSource = {
  id: number;
  submission: number;
  submission_name: string;
  organization: PlannerOrganization;
  network: string;
  is_enabled: boolean;
  active_result: RentalResult | null;
  created_at: string;
  updated_at: string;
};

export type FeedCandidate = {
  id: number;
  name: string;
  organization: PlannerOrganization;
  planner_feed: number | null;
};

export type RentalCandidate = {
  id: number;
  name: string;
  organization: PlannerOrganization;
  rental_source: number | null;
};

export type BuildStatus = "queued" | "running" | "succeeded" | "failed";
export type BuildTrigger = "schedule" | "manual" | "rollback";

export type GraphBuild = {
  id: number;
  status: BuildStatus;
  trigger: BuildTrigger;
  requested_by: string | null;
  rollback_of: number | null;
  otp_image: string;
  created_at: string;
  started_at: string | null;
  otp_stopped_at: string | null;
  finished_at: string | null;
  is_active: boolean;
  indexed_at: string | null;
  error_code: string;
};

export type GraphBuildDetail = GraphBuild & {
  feed_results: FeedResult[];
  rental_results: RentalResult[];
  log_excerpt: string;
};

export type PlannerAdminStatus = {
  active_build: GraphBuild | null;
  running_build: GraphBuild | null;
  maintenance: boolean;
  otp_healthy: boolean;
};

export type BuildSchedule = { enabled: boolean; weekdays: number[]; time_utc: string };

export type OsmDownloadStatus = "queued" | "running" | "succeeded" | "failed";

export type OsmDownload = {
  id: number;
  url: string;
  status: OsmDownloadStatus;
  error_code: string;
  size_bytes: number | null;
  data_timestamp: string | null;
  requested_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export const LIMIT_GROUPS = ["plan", "realtime", "lookup"] as const;
export type LimitGroup = (typeof LIMIT_GROUPS)[number];
export const LIMIT_SCOPES = ["anonymous", "key", "global"] as const;
export type LimitScope = (typeof LIMIT_SCOPES)[number];
export type LimitField = `${LimitScope}_${LimitGroup}_per_minute`;

export type PlannerSettings = { public_api_enabled: boolean; updated_at: string } & Record<
  LimitField,
  number
>;

export type ApiKey = {
  id: number;
  name: string;
  contact_email: string;
  note: string;
  prefix: string;
  is_active: boolean;
  plan_per_minute: number | null;
  realtime_per_minute: number | null;
  lookup_per_minute: number | null;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
};

/** `POST api-keys/` answers with the plain key once. */
export type CreatedApiKey = ApiKey & { key: string };

export type IpBan = {
  id: number;
  network: string;
  reason: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
};

/** `ip-bans/` lists expired bans too; the backend no longer applies them. */
export function isBanActive(ban: IpBan, now = Date.now()): boolean {
  return ban.expires_at === null || Date.parse(ban.expires_at) > now;
}

export type RequestLogEntry = {
  id: number;
  created_at: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  client_ip: string;
  api_key: number | null;
  api_key_name: string | null;
  user_agent: string;
};

export type StatusClassCounts = {
  ok: number;
  client_errors: number;
  rate_limited: number;
  server_errors: number;
};

export type StatsSummary = StatusClassCounts & {
  since: string;
  until: string;
  requests: number;
  unique_ips: number;
  unique_api_keys: number;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  max_latency_ms: number | null;
};

export type StatsInterval = "hour" | "day";
export type StatsSplit = "status" | "endpoint" | "none";

export type StatsTimeseries = {
  since: string;
  until: string;
  interval: StatsInterval;
  split: StatsSplit;
  buckets: string[];
  series: { name: string; requests: number[] }[];
};

export type EndpointStats = StatusClassCounts & {
  endpoint: string;
  requests: number;
  share: number;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  max_latency_ms: number | null;
};

export type IpClientStats = StatusClassCounts & {
  client_ip: string;
  requests: number;
  share: number;
  endpoints: number;
  api_keys: number;
  user_agent: string;
  first_seen: string;
  last_seen: string;
  banned: boolean;
};

export type KeyClientStats = StatusClassCounts & {
  api_key: { id: number; name: string; prefix: string };
  requests: number;
  share: number;
  endpoints: number;
  ips: number;
  user_agent: string;
  first_seen: string;
  last_seen: string;
};

export type UserAgentStats = { user_agent: string; requests: number; ips: number };

/** Ranges of the traffic tab; the raw request log keeps 30 days. */
export const TRAFFIC_RANGES = ["24h", "7d", "30d"] as const;
export type TrafficRange = (typeof TRAFFIC_RANGES)[number];

const RANGE_HOURS: Record<TrafficRange, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/** Statistics filters for a range ending now: hourly points for a day, daily ones beyond. */
export function rangeQuery(
  range: TrafficRange,
  extra: Record<string, string | number | undefined> = {},
): string {
  const q = new URLSearchParams();
  q.set("since", new Date(Date.now() - RANGE_HOURS[range] * 3_600_000).toISOString());
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") q.set(k, String(v));
  return `?${q.toString()}`;
}

export function rangeInterval(range: TrafficRange): StatsInterval {
  return range === "24h" ? "hour" : "day";
}

/** Error codes the request log can be filtered by (`status` matches one code exactly). */
export const ERROR_STATUS_GROUPS = {
  client: [400, 401, 403, 404],
  rateLimited: [429],
  server: [500, 502, 503, 504],
} as const;
export type ErrorStatusGroup = keyof typeof ERROR_STATUS_GROUPS | "all";

const RECENT_ERRORS_PER_CODE = 50;

/** The newest failed requests of a group, merged across the codes the log is filtered by. */
export async function fetchRecentErrors(
  apiJson: ApiJson,
  group: ErrorStatusGroup,
  range: TrafficRange,
): Promise<RequestLogEntry[]> {
  const codes =
    group === "all" ? Object.values(ERROR_STATUS_GROUPS).flat() : ERROR_STATUS_GROUPS[group];
  const pages = await Promise.all(
    codes.map((status) =>
      apiJson<PaginatedResponse<RequestLogEntry>>(
        "GET",
        plannerAdminPaths.requests +
          rangeQuery(range, { status, page_size: RECENT_ERRORS_PER_CODE }),
      ),
    ),
  );
  return pages
    .flatMap((p) => p.results)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, RECENT_ERRORS_PER_CODE * 2);
}

/** Endpoint URL names without the shared prefix: `planner-v1-plan` → `plan`. */
export function endpointLabel(name: string): string {
  return name.replace(/^planner-v1-/, "");
}

export async function fetchFeedCandidates(apiJson: ApiJson): Promise<FeedCandidate[]> {
  return await fetchAllPages<FeedCandidate>(
    (p) => apiJson("GET", p),
    plannerAdminPaths.feedCandidates,
  );
}

export async function fetchRentalCandidates(apiJson: ApiJson): Promise<RentalCandidate[]> {
  return await fetchAllPages<RentalCandidate>(
    (p) => apiJson("GET", p),
    plannerAdminPaths.rentalCandidates,
  );
}

/** `feed_id` and `network`: lowercase letters, digits and hyphens, 2–32 characters. */
export const PLANNER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

/** A `feed_id` suggestion from a feed name: "Warszawa, tramwaje" → "warszawa-tramwaje". */
export function suggestPlannerId(name: string, taken: ReadonlySet<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28) || "feed";
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  return base;
}

/** The next scheduled build after `now`, or null when the schedule is off. */
export function nextScheduledBuild(schedule: BuildSchedule, now = new Date()): Date | null {
  if (!schedule.enabled || !schedule.weekdays.length) return null;
  const [hh, mm] = schedule.time_utc.split(":").map(Number);
  for (let day = 0; day <= 7; day++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, hh, mm),
    );
    const isoWeekday = ((d.getUTCDay() + 6) % 7) + 1;
    if (d > now && schedule.weekdays.includes(isoWeekday)) return d;
  }
  return null;
}
