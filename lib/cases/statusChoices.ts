import type { Dictionary } from "@/i18n/getDictionary";

/** Wartości `StatusEnum` z API (`/api/schema/`). */
export const CASE_STATUS_VALUES = [
  "none",
  "requested",
  "denial",
  "court_referral",
  "ministry_complaint",
  "not_available",
  "received",
  "no_contract",
  "reminder",
  "phone_call",
  "other",
] as const;

export type CaseStatusValue = (typeof CASE_STATUS_VALUES)[number];

export function caseStatusLabel(value: string, labels: Dictionary["caseStatusLabels"]): string {
  if (CASE_STATUS_VALUES.includes(value as CaseStatusValue)) {
    return labels[value as CaseStatusValue];
  }
  return value;
}
