import { getJson } from "@/lib/api/http";
import { fetchAllPages, type PaginatedResponse } from "@/lib/api/types";

/** Public planner data is shared by every visitor; the backend is asked at most once a minute. */
const PLANNER_REVALIDATE_S = 60;
/** `vehicles/coverage/` counts at most this many operators per request. */
const COVERAGE_MAX_AGENCIES = 20;

/**
 * Requests per minute without a key: the backend's `PlannerSettings` defaults. The public API
 * does not publish the limits, so a change in the admin panel must be repeated here.
 */
export const PLANNER_ANONYMOUS_LIMITS = { plan: 20, realtime: 120, lookup: 150 } as const;

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

type PlannerAgency = { id: string };

type AgencyCoverage = {
  trips_under_way: number;
  trips_with_position: number;
};

/** Trips under way across every operator in the planner, and how many report a vehicle position. */
export type PlannerCoverage = { tripsUnderWay: number; tripsWithPosition: number };

export async function fetchPlannerStatus(): Promise<PlannerStatus> {
  return await getJson<PlannerStatus>("/api/planner/v1/status/", {
    revalidate: PLANNER_REVALIDATE_S,
  });
}

/**
 * Sums `vehicles/coverage/` over every operator in the planner, including those that publish no
 * vehicle positions, so the share is of all trips under way. Null when nothing runs (at night).
 */
export async function fetchPlannerCoverage(): Promise<PlannerCoverage | null> {
  const get = <T>(path: string) => getJson<T>(path, { revalidate: PLANNER_REVALIDATE_S });
  const agencies = (await fetchAllPages<PlannerAgency>(get, "/api/planner/v1/agencies/"))
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
    tripsUnderWay += row.trips_under_way;
    tripsWithPosition += row.trips_with_position;
  }
  return tripsUnderWay > 0 ? { tripsUnderWay, tripsWithPosition } : null;
}
