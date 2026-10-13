import { getJson } from "@/lib/api/http";
import { fetchAllPages, type PaginatedResponse } from "@/lib/api/types";

/** Public planner data is shared by every visitor; the backend is asked at most once a minute. */
const PLANNER_REVALIDATE_S = 60;
/** `vehicles/coverage/` counts at most this many operators per request. */
const COVERAGE_MAX_AGENCIES = 20;

export type PlannerUnavailableReason = "disabled" | "maintenance" | "no_graph";

export type PlannerStatusFeed = {
  feed_id: string;
  organization: { id: number; name: string; region: string };
  license: string;
  outcome: "fresh" | "stale";
  version_at: string | null;
};

/** `GET /api/planner/v1/status/` (backend `docs/api/planner.md`). */
export type PlannerStatus = {
  available: boolean;
  reason: PlannerUnavailableReason | null;
  graph: { built_at: string | null; otp_version: string } | null;
  feeds: PlannerStatusFeed[];
};

type PlannerAgency = { id: string; feed_id: string };

type AgencyCoverage = {
  vehicle_positions: boolean;
  trips_under_way: number;
  trips_with_position: number;
};

/** Trips under way across every operator whose vehicle positions the planner receives. */
export type PlannerCoverage = { tripsUnderWay: number; tripsWithPosition: number };

export async function fetchPlannerStatus(): Promise<PlannerStatus> {
  return await getJson<PlannerStatus>("/api/planner/v1/status/", {
    revalidate: PLANNER_REVALIDATE_S,
  });
}

/**
 * Sums `vehicles/coverage/` over the operators of fresh feeds (stale feeds get no realtime data).
 * Null when no operator reports positions or nothing runs (at night).
 */
export async function fetchPlannerCoverage(status: PlannerStatus): Promise<PlannerCoverage | null> {
  const freshFeeds = new Set(
    status.feeds.filter((f) => f.outcome === "fresh").map((f) => f.feed_id),
  );
  const get = <T>(path: string) => getJson<T>(path, { revalidate: PLANNER_REVALIDATE_S });
  const agencies = (await fetchAllPages<PlannerAgency>(get, "/api/planner/v1/agencies/"))
    .filter((a) => freshFeeds.has(a.feed_id))
    .map((a) => a.id)
    .sort();

  const chunks: string[][] = [];
  for (let i = 0; i < agencies.length; i += COVERAGE_MAX_AGENCIES) {
    chunks.push(agencies.slice(i, i + COVERAGE_MAX_AGENCIES));
  }
  const pages = await Promise.all(
    chunks.map((ids) => {
      const query = new URLSearchParams(ids.map((id) => ["agencies", id]));
      return get<PaginatedResponse<AgencyCoverage>>(`/api/planner/v1/vehicles/coverage/?${query}`);
    }),
  );

  let tripsUnderWay = 0;
  let tripsWithPosition = 0;
  for (const row of pages.flatMap((p) => p.results)) {
    if (!row.vehicle_positions) continue;
    tripsUnderWay += row.trips_under_way;
    tripsWithPosition += row.trips_with_position;
  }
  return tripsUnderWay > 0 ? { tripsUnderWay, tripsWithPosition } : null;
}
