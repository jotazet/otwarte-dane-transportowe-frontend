export const AUTH_TYPES = ["", "api_key", "bearer_token", "basic_auth"] as const;

export type AuthType = (typeof AUTH_TYPES)[number];

export function authTypeOptions(dict: { authTypeNone?: string }) {
  return AUTH_TYPES.map((t) => ({
    value: t,
    label: t === "" ? (dict.authTypeNone ?? "—") : t,
  }));
}
