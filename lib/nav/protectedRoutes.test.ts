import { describe, expect, it } from "vitest";

import { isLoginRequiredPath } from "@/lib/nav/protectedRoutes";

describe("isLoginRequiredPath", () => {
  it.each([
    "/account",
    "/blog/new",
    "/blog/12/edit",
    "/data/my-submissions",
    "/data/my-submissions/34",
    "/data/queue",
    "/data/queue/34",
    "/data/feed-ops",
    "/data/feed-ops/errors",
    "/data/planner",
    "/users",
    "/users/5",
    "/cases/organizations/new",
    "/cases/organizations/3/edit",
    "/cases/organizations/3/statuses/new",
    "/cases/data-providers/new",
    "/cases/data-providers/9",
  ])("requires login for %s", (path) => {
    expect(isLoginRequiredPath(path)).toBe(true);
  });

  it("ignores the query string", () => {
    expect(isLoginRequiredPath("/data/queue?organization=3")).toBe(true);
    expect(isLoginRequiredPath("/data?next=/account")).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/data",
    "/data/feeds",
    "/data/queued",
    "/data/my-submissions-archive",
    "/blog",
    "/blog/12",
    "/blog/abc/edit",
    "/blog/12/edit/more",
    "/cases",
    "/cases/organizations",
    "/cases/organizations/3",
    "/cases/organizations/abc/edit",
    "/cases/data-providers",
    "/info",
    "/accounting",
  ])("leaves %s public", (path) => {
    expect(isLoginRequiredPath(path)).toBe(false);
  });
});
