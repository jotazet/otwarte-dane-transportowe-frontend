"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import {
  canAdminEditSourceOnPublishedStages,
  canBlogEditPost,
  canDeleteFeedSubmission,
  canEditFeedSourceFields,
  canHelperReviewOnly,
  canProviderEditFullSource,
  canProviderEditLimitedMeta,
  hasBlogManageAccess,
  hasDataProviderAccess,
  hasHelperAccess,
  hasRoleAccess,
  type AuthUserClaims,
  type FeedSourceEditContext,
} from "@/lib/auth/permissions";

export function usePermissions() {
  const auth = useAuth();
  const user: AuthUserClaims | null =
    auth.status === "authenticated"
      ? {
          username: auth.user.username,
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
          userId: auth.user.userId,
          roles: auth.user.roles,
          groups: auth.user.groups,
          isDjangoAdmin: auth.user.isDjangoAdmin,
          isStaff: auth.user.isStaff,
        }
      : null;

  return {
    auth,
    user,
    isAuthenticated: auth.status === "authenticated",
    hasRole: (wanted: Parameters<typeof hasRoleAccess>[1]) =>
      user ? hasRoleAccess(user, wanted) : false,
    hasHelperAccess: () => (user ? hasHelperAccess(user) : false),
    hasDataProviderAccess: () => (user ? hasDataProviderAccess(user) : false),
    hasBlogManageAccess: () => (user ? hasBlogManageAccess(user) : false),
    canBlogEditPost: (authorId: number | null | undefined) =>
      user ? canBlogEditPost(user, authorId) : false,
    feedSource: (
      ctx: Omit<FeedSourceEditContext, "isDjangoAdmin" | "isStaff" | "isHelper"> & {
        isHelper?: boolean;
      },
    ) => {
      const full: FeedSourceEditContext = {
        ...ctx,
        isDjangoAdmin: user?.isDjangoAdmin ?? false,
        isStaff: user?.isStaff ?? false,
        isHelper: ctx.isHelper ?? (user ? hasHelperAccess(user) : false),
      };
      return {
        canEditSource: canEditFeedSourceFields(full),
        canEditLimitedMeta: canProviderEditLimitedMeta(full),
        canEditFullSource: canProviderEditFullSource(full),
        canAdminSourceOnStage2Plus: canAdminEditSourceOnPublishedStages(full),
        canHelperReviewOnly: canHelperReviewOnly(full),
        canDelete: user ? canDeleteFeedSubmission(user) : false,
      };
    },
  };
}
