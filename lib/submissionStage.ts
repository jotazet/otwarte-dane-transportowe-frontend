import type { Dictionary } from "@/i18n/getDictionary";

type StageLabelDict = Pick<
  Dictionary,
  "staticSubmissionStageLabels" | "realtimeSubmissionStageLabels" | "rejected"
>;

/**
 * Translated stage label of a submission. Mirrors the backend's English-only
 * `current_stage_label` (docs/api/models.md, "Static/Realtime feed stages").
 */
export function submissionStageLabel(
  kind: "static" | "realtime",
  stage: number,
  isRejected: boolean,
  dict: StageLabelDict,
): string {
  if (isRejected) return dict.rejected;
  const labels: Record<number, string> =
    kind === "static" ? dict.staticSubmissionStageLabels : dict.realtimeSubmissionStageLabels;
  return labels[stage] ?? String(stage);
}
