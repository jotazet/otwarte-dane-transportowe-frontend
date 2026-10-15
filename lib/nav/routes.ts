/** Path helpers for locale-aware navigation. */
export function paths(locale: string) {
  const base = `/${locale}`;
  return {
    home: base,
    login: (returnUrl?: string) =>
      returnUrl ? `${base}/login?returnUrl=${encodeURIComponent(returnUrl)}` : `${base}/login`,
    blog: `${base}/blog`,
    blogNew: `${base}/blog/new`,
    blogPost: (id: number) => `${base}/blog/${id}`,
    blogEdit: (id: number) => `${base}/blog/${id}/edit`,
    cases: `${base}/cases`,
    casesOrgNew: `${base}/cases/organizations/new`,
    casesOrg: (id: number) => `${base}/cases/organizations/${id}`,
    casesOrgEdit: (id: number) => `${base}/cases/organizations/${id}/edit`,
    casesProviders: `${base}/cases/data-providers`,
    casesProviderNew: `${base}/cases/data-providers/new`,
    data: `${base}/data`,
    dataFeed: (orgId: number) => `${base}/data/feeds/${orgId}`,
    mySubmissions: `${base}/data/my-submissions`,
    mySubmissionsNew: (orgId?: number) =>
      orgId != null
        ? `${base}/data/my-submissions/new?organization=${orgId}`
        : `${base}/data/my-submissions/new`,
    mySubmissionFeed: (id: number) => `${base}/data/my-submissions/feed/${id}`,
    mySubmissionRealtime: (id: number) => `${base}/data/my-submissions/realtime/${id}`,
    queue: `${base}/data/queue`,
    queueFeed: (id: number) => `${base}/data/queue/feed/${id}`,
    queueRealtime: (id: number) => `${base}/data/queue/realtime/${id}`,
    feedOps: `${base}/data/feed-ops`,
    plannerAdmin: `${base}/data/planner`,
    info: `${base}/info`,
    developers: `${base}/developers`,
    users: `${base}/users`,
    usersNew: `${base}/users/new`,
    user: (id: number) => `${base}/users/${id}`,
    account: `${base}/account`,
  };
}

export type SubmissionListContext = "my" | "queue";

export function submissionDetailPath(
  locale: string,
  ctx: SubmissionListContext,
  kind: "feed" | "realtime",
  id: number,
) {
  const p = paths(locale);
  if (ctx === "queue") return kind === "feed" ? p.queueFeed(id) : p.queueRealtime(id);
  return kind === "feed" ? p.mySubmissionFeed(id) : p.mySubmissionRealtime(id);
}

export function submissionListPath(locale: string, ctx: SubmissionListContext) {
  return ctx === "queue" ? paths(locale).queue : paths(locale).mySubmissions;
}

/** Nav active matching - avoid highlighting catalog when on my-submissions or queue. */
export function navActiveHref(
  pathname: string,
  locale: string,
  candidates: string[],
): string | null {
  const hits = candidates.filter((href) => {
    if (href === `/${locale}/data`) {
      if (
        pathname.startsWith(`/${locale}/data/my-submissions`) ||
        pathname.startsWith(`/${locale}/data/queue`) ||
        pathname.startsWith(`/${locale}/data/feed-ops`)
      ) {
        return false;
      }
    }
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
  hits.sort((a, b) => b.length - a.length);
  return hits[0] ?? null;
}
