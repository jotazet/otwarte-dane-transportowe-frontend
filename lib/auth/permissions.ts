import { decodeJwt, type JwtPayload } from "@/lib/auth/jwt";
import { normalizeRoles, type AppRole, type RoleSet } from "@/lib/auth/roles";

export type AuthUserClaims = {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  userId: number | null;
  roles: RoleSet;
  groups: string[];
  isDjangoAdmin: boolean;
  isStaff: boolean;
};

function groupNames(payload: JwtPayload | null): string[] {
  const raw = (payload as Record<string, unknown> | null)?.roles ??
    (payload as Record<string, unknown> | null)?.groups ??
    (payload as Record<string, unknown> | null)?.role;
  const names: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string") names.push(v);
    else if (v && typeof v === "object" && "name" in v && typeof (v as { name: string }).name === "string") {
      names.push((v as { name: string }).name);
    }
  };
  push(raw);
  if (Array.isArray(raw)) for (const v of raw) push(v);
  return names;
}

export function claimsFromAccessToken(access: string, loginUsername?: string | null): AuthUserClaims {
  const payload = decodeJwt(access);

  const username =
    loginUsername ??
    (typeof payload?.username === "string"
      ? payload.username
      : typeof (payload as Record<string, unknown>)?.user === "string"
        ? ((payload as Record<string, unknown>).user as string)
        : typeof (payload as Record<string, unknown>)?.preferred_username === "string"
          ? ((payload as Record<string, unknown>).preferred_username as string)
          : null);

  const groups = groupNames(payload);
  const roles = normalizeRoles(groups);
  const roleSetMutable = new Set<AppRole>(roles);

  const isStaff =
    (payload as Record<string, unknown>)?.is_staff === true ||
    (payload as Record<string, unknown>)?.is_superuser === true;

  const isDjangoAdmin =
    groups.some((g) => g.trim().toLowerCase() === "admin") || roleSetMutable.has("Admin");

  const uid = (payload as Record<string, unknown>)?.user_id;

  const roleSet = roleSetMutable as RoleSet;

  const firstName =
    typeof (payload as Record<string, unknown>)?.first_name === "string"
      ? ((payload as Record<string, unknown>).first_name as string)
      : null;
  const lastName =
    typeof (payload as Record<string, unknown>)?.last_name === "string"
      ? ((payload as Record<string, unknown>).last_name as string)
      : null;

  const userId =
    typeof uid === "number" ? uid : typeof uid === "string" && /^\d+$/.test(uid) ? Number(uid) : null;

  return {
    username,
    firstName,
    lastName,
    userId,
    roles: roleSet,
    groups,
    isDjangoAdmin,
    isStaff,
  };
}

export function hasRoleAccess(user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">, wanted: AppRole[]) {
  if (!wanted.length) return false;
  if (user.isDjangoAdmin) return true;
  return wanted.some((r) => user.roles.has(r));
}

export function hasHelperAccess(user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">) {
  return hasRoleAccess(user, ["Helper"]);
}

export function hasAdminAccess(user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">) {
  return hasRoleAccess(user, ["Admin"]);
}

export function hasDataProviderAccess(user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">) {
  return hasRoleAccess(user, ["DataProvider"]);
}

export function hasBlogManageAccess(user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">) {
  return hasRoleAccess(user, ["Blogger", "Editor"]);
}

export type FeedSourceEditContext = {
  isDjangoAdmin: boolean;
  isStaff: boolean;
  isHelper: boolean;
  isOwner: boolean;
  currentStage: number;
  isRejected: boolean;
};

/** DP full edit at stage 1 or when rejected. */
export function canProviderEditFullSource(ctx: FeedSourceEditContext) {
  return ctx.isOwner && (ctx.currentStage <= 1 || ctx.isRejected);
}

/** DP limited edit at stages 2–4 (note, license, download times / interval only). */
export function canProviderEditLimitedMeta(ctx: FeedSourceEditContext) {
  return ctx.isOwner && ctx.currentStage >= 2 && ctx.currentStage <= 4 && !ctx.isRejected;
}

/** Django Admin group may edit URL/file/auth on stages 2–4. Staff without Admin cannot. */
export function canAdminEditSourceOnPublishedStages(ctx: FeedSourceEditContext) {
  return ctx.isDjangoAdmin && ctx.currentStage >= 2 && ctx.currentStage <= 4;
}

export function canEditFeedSourceFields(ctx: FeedSourceEditContext) {
  if (ctx.isHelper && !ctx.isDjangoAdmin) return false;
  if (canProviderEditFullSource(ctx)) return true;
  if (canAdminEditSourceOnPublishedStages(ctx)) return true;
  return false;
}

export function canHelperReviewOnly(ctx: Pick<FeedSourceEditContext, "isHelper" | "isDjangoAdmin">) {
  return ctx.isHelper && !ctx.isDjangoAdmin;
}

export function canBlogEditPost(
  user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin" | "userId">,
  authorId: number | null | undefined,
) {
  if (hasRoleAccess(user, ["Editor"])) return true;
  if (hasRoleAccess(user, ["Blogger"]) && user.userId != null && authorId != null && user.userId === authorId) {
    return true;
  }
  return false;
}

export function canViewSubmissionInContext(
  user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin" | "userId">,
  ctx: { listContext: "my" | "queue"; submittedBy?: number | null },
) {
  if (user.isDjangoAdmin) return true;
  if (ctx.listContext === "queue") return hasHelperAccess(user);
  if (!hasDataProviderAccess(user)) return false;
  return user.userId != null && ctx.submittedBy != null && user.userId === ctx.submittedBy;
}

export function canDeleteFeedSubmission(
  user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">,
  ctx: { isOwner: boolean; currentStage: number; isRejected: boolean },
) {
  if (user.isDjangoAdmin) return true;
  return ctx.isOwner && ctx.currentStage <= 1 && !ctx.isRejected;
}
