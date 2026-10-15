import type { Dictionary } from "@/i18n/getDictionary";

const SHARED_KEYS = [
  "cancel",
  "close",
  "loading",
  "requiresLogin",
  "login",
  "forbidden",
  "home",
  "apiErrorConnection",
  "apiErrorInvalidData",
  "apiErrorLoginRequired",
  "apiErrorForbidden",
  "apiErrorNotFound",
  "apiErrorRateLimited",
  "apiErrorGeneric",
] as const satisfies readonly (keyof Dictionary)[];

type PlannerAdminKey = Extract<keyof Dictionary, `plannerAdmin${string}`>;

/** The strings the planner admin panel uses, so the client gets only these. */
export type PlannerAdminDict = Pick<Dictionary, PlannerAdminKey | (typeof SHARED_KEYS)[number]>;

export function pickPlannerAdminDict(dict: Dictionary): PlannerAdminDict {
  const shared: readonly string[] = SHARED_KEYS;
  // The keys are filtered by the same rule as PlannerAdminKey and SHARED_KEYS above.
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("plannerAdmin") || shared.includes(k)),
  ) as PlannerAdminDict;
}
