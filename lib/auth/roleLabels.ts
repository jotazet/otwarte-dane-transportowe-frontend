import type { Dictionary } from "@/i18n/getDictionary";
import type { AppRole } from "@/lib/auth/roles";

const ROLE_LABEL_KEYS = {
  Admin: "roleAdmin",
  Helper: "roleHelper",
  DataProvider: "roleDataProvider",
  Blogger: "roleBlogger",
  Editor: "roleEditor",
} as const satisfies Record<AppRole, string>;

type RoleLabelDict = Partial<
  Pick<Dictionary, (typeof ROLE_LABEL_KEYS)[keyof typeof ROLE_LABEL_KEYS]>
>;

export function formatRole(role: string, dict: RoleLabelDict): string {
  const key = ROLE_LABEL_KEYS[role as AppRole];
  if (!key) return role;
  return dict[key] ?? role;
}

export function formatRoles(roles: Iterable<string>, dict: RoleLabelDict): string {
  return [...roles].map((r) => formatRole(r, dict)).join(", ");
}

export { ROLE_LABEL_KEYS };
