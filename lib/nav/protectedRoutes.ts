/**
 * Paths after the locale prefix (e.g. `/pl` → `/data/my-submissions`).
 * Middleware uses this for login redirects; role checks stay client-side.
 */
export function isLoginRequiredPath(rest: string): boolean {
  const path = rest.split("?")[0];
  if (path === "/account") return true;
  if (path === "/blog/new") return true;
  if (/^\/blog\/\d+\/edit$/.test(path)) return true;
  if (path === "/data/my-submissions" || path.startsWith("/data/my-submissions/")) return true;
  if (path === "/data/queue" || path.startsWith("/data/queue/")) return true;
  if (path === "/data/feed-ops" || path.startsWith("/data/feed-ops/")) return true;
  if (path === "/data/planner") return true;
  if (path === "/users" || path.startsWith("/users/")) return true;
  if (path === "/cases/organizations/new") return true;
  if (/^\/cases\/organizations\/\d+\/edit$/.test(path)) return true;
  if (/^\/cases\/organizations\/\d+\/statuses\//.test(path)) return true;
  if (path === "/cases/data-providers" || path.startsWith("/cases/data-providers/")) return true;
  return false;
}
