import { describe, expect, it } from "vitest";

import { tokenWith } from "@/lib/__fixtures__/token";
import {
  canAdminEditSourceOnPublishedStages,
  canBlogEditPost,
  canDeleteFeedSubmission,
  canEditFeedSourceFields,
  canEditFullSource,
  canHelperReviewOnly,
  canProviderEditLimitedMeta,
  canViewSubmissionInContext,
  claimsFromAccessToken,
  hasAdminAccess,
  hasBlogManageAccess,
  hasDataProviderAccess,
  hasHelperAccess,
  type FeedSourceEditContext,
} from "@/lib/auth/permissions";

/** Claims as the backend issues them: `roles` holds the user's Django group names. */
function claims(payload: Record<string, unknown>) {
  return claimsFromAccessToken(tokenWith({ exp: 9999999999, ...payload }));
}

describe("claimsFromAccessToken", () => {
  it("reads the backend's claims", () => {
    const c = claims({
      username: "anna",
      user_id: "42", // simplejwt sends the id as a string
      roles: ["DataProvider"],
      first_name: "Anna",
      last_name: "Nowak",
    });
    expect(c).toMatchObject({
      username: "anna",
      userId: 42,
      firstName: "Anna",
      lastName: "Nowak",
      groups: ["DataProvider"],
      isDjangoAdmin: false,
      isStaff: false,
    });
    expect([...c.roles]).toEqual(["DataProvider"]);
  });

  it("normalizes role spelling and ignores unknown groups", () => {
    const c = claims({ roles: [" helper ", "data_provider", "Redaktor", "Moderator"] });
    expect([...c.roles].sort()).toEqual(["DataProvider", "Editor", "Helper"]);
  });

  it("accepts groups as objects and a single role string", () => {
    expect([...claims({ groups: [{ name: "Blogger" }] }).roles]).toEqual(["Blogger"]);
    expect([...claims({ role: "Editor" }).roles]).toEqual(["Editor"]);
  });

  it("marks the Admin group as Django admin, but not is_staff alone", () => {
    expect(claims({ roles: ["Admin"] }).isDjangoAdmin).toBe(true);
    const staff = claims({ is_staff: true, roles: [] });
    expect(staff.isStaff).toBe(true);
    expect(staff.isDjangoAdmin).toBe(false);
  });

  it("prefers the username typed at login and rejects non-numeric ids", () => {
    const c = claimsFromAccessToken(tokenWith({ username: "token-name", user_id: "abc" }), "typed");
    expect(c.username).toBe("typed");
    expect(c.userId).toBeNull();
  });

  it("gives no roles for an unreadable token", () => {
    const c = claimsFromAccessToken("garbage");
    expect(c.roles.size).toBe(0);
    expect(c.isDjangoAdmin).toBe(false);
    expect(c.userId).toBeNull();
  });
});

describe("role checks", () => {
  const helper = claims({ roles: ["Helper"] });
  const provider = claims({ roles: ["DataProvider"] });
  const admin = claims({ roles: ["Admin"] });

  it("grant each role only its own access", () => {
    expect(hasHelperAccess(helper)).toBe(true);
    expect(hasAdminAccess(helper)).toBe(false);
    expect(hasDataProviderAccess(helper)).toBe(false);
    expect(hasHelperAccess(provider)).toBe(false);
    expect(hasBlogManageAccess(claims({ roles: ["Blogger"] }))).toBe(true);
  });

  it("let the Admin group do everything", () => {
    expect(hasAdminAccess(admin)).toBe(true);
    expect(hasHelperAccess(admin)).toBe(true);
    expect(hasDataProviderAccess(admin)).toBe(true);
    expect(hasBlogManageAccess(admin)).toBe(true);
  });

  it("give nothing to a staff user without the Admin group", () => {
    const staff = claims({ is_staff: true, is_superuser: true });
    expect(hasAdminAccess(staff)).toBe(false);
    expect(canDeleteFeedSubmission(staff)).toBe(false);
  });

  it("let only Admin delete submissions", () => {
    expect(canDeleteFeedSubmission(admin)).toBe(true);
    expect(canDeleteFeedSubmission(helper)).toBe(false);
    expect(canDeleteFeedSubmission(provider)).toBe(false);
  });

  it("let a Blogger edit only their own post, an Editor any post", () => {
    const blogger = claims({ roles: ["Blogger"], user_id: 7 });
    expect(canBlogEditPost(blogger, 7)).toBe(true);
    expect(canBlogEditPost(blogger, 8)).toBe(false);
    expect(canBlogEditPost(blogger, null)).toBe(false);
    expect(canBlogEditPost(claims({ roles: ["Editor"], user_id: 1 }), 8)).toBe(true);
  });

  it("show a submission to its provider, the queue to Helpers", () => {
    const own = claims({ roles: ["DataProvider"], user_id: 5 });
    expect(canViewSubmissionInContext(own, { listContext: "my", submittedBy: 5 })).toBe(true);
    expect(canViewSubmissionInContext(own, { listContext: "my", submittedBy: 6 })).toBe(false);
    expect(canViewSubmissionInContext(own, { listContext: "queue" })).toBe(false);
    expect(canViewSubmissionInContext(helper, { listContext: "queue" })).toBe(true);
  });
});

describe("feed source edit context", () => {
  const base: FeedSourceEditContext = {
    isDjangoAdmin: false,
    isStaff: false,
    isHelper: false,
    isOwner: true,
    currentStage: 1,
    isRejected: false,
  };
  const at = (overrides: Partial<FeedSourceEditContext>) => ({ ...base, ...overrides });

  it("lets the owner edit everything at stage 1 or after a rejection", () => {
    expect(canEditFullSource(at({ currentStage: 1 }))).toBe(true);
    expect(canEditFullSource(at({ currentStage: 3, isRejected: true }))).toBe(true);
    expect(canEditFullSource(at({ currentStage: 2 }))).toBe(false);
  });

  it("limits the owner to metadata at stages 2-4", () => {
    for (const stage of [2, 3, 4]) {
      const ctx = at({ currentStage: stage });
      expect(canProviderEditLimitedMeta(ctx)).toBe(true);
      expect(canEditFeedSourceFields(ctx)).toBe(false);
    }
    expect(canProviderEditLimitedMeta(at({ currentStage: 1 }))).toBe(false);
    expect(canProviderEditLimitedMeta(at({ currentStage: 3, isRejected: true }))).toBe(false);
  });

  it("keeps a Helper to review only, even on their own submission", () => {
    const ctx = at({ isHelper: true, currentStage: 1 });
    expect(canHelperReviewOnly(ctx)).toBe(true);
    expect(canEditFullSource(ctx)).toBe(false);
    expect(canProviderEditLimitedMeta(at({ isHelper: true, currentStage: 2 }))).toBe(false);
    expect(canHelperReviewOnly(at({ isHelper: true, isDjangoAdmin: true }))).toBe(false);
  });

  it("lets Admin edit the source at stages 2-4, but not staff without Admin", () => {
    const admin = at({ isOwner: false, isDjangoAdmin: true, currentStage: 3 });
    expect(canAdminEditSourceOnPublishedStages(admin)).toBe(true);
    expect(canEditFeedSourceFields(admin)).toBe(true);
    const staff = at({ isOwner: false, isStaff: true, currentStage: 3 });
    expect(canEditFeedSourceFields(staff)).toBe(false);
  });

  it("gives a stranger nothing", () => {
    const ctx = at({ isOwner: false });
    expect(canEditFeedSourceFields(ctx)).toBe(false);
    expect(canProviderEditLimitedMeta(at({ isOwner: false, currentStage: 2 }))).toBe(false);
  });
});
