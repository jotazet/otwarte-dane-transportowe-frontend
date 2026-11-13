import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiJson } from "@/lib/api/http";
import { fetchDailyHistory, type DailyStats } from "@/lib/api/plannerAdmin";

const day = (date: string, requests: number, avg: number): DailyStats => ({
  date,
  requests,
  ok: requests - 1,
  client_errors: 1,
  rate_limited: 0,
  server_errors: 0,
  avg_latency_ms: avg,
  max_latency_ms: avg * 10,
});

describe("fetchDailyHistory", () => {
  afterEach(() => vi.useRealTimers());

  it("asks for the last 90 UTC days, fills missing days with zeros and weighs the average", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T23:30:00Z"));
    const paths: string[] = [];
    const apiJson = (async (_method: string, path: string) => {
      paths.push(path);
      return {
        count: 2,
        next: null,
        previous: null,
        results: [day("2026-08-16", 10, 100), day("2026-11-13", 30, 20)],
      };
    }) as ApiJson;

    const { series, totals } = await fetchDailyHistory(apiJson, "planner-v1-plan");

    const query = new URL(paths[0], "http://x").searchParams;
    expect(query.get("date_from")).toBe("2026-08-16");
    expect(query.get("date_to")).toBe("2026-11-13");
    expect(query.get("endpoint")).toBe("planner-v1-plan");
    expect(series.buckets).toHaveLength(90);
    expect(series.buckets[0]).toBe("2026-08-16T00:00:00Z");
    const ok = series.series.find((s) => s.name === "ok")?.requests ?? [];
    expect(ok[0]).toBe(9);
    expect(ok[1]).toBe(0);
    expect(ok[89]).toBe(29);
    expect(totals).toEqual({
      requests: 40,
      ok: 38,
      client_errors: 2,
      rate_limited: 0,
      server_errors: 0,
      avg_latency_ms: 40,
    });
  });
});
