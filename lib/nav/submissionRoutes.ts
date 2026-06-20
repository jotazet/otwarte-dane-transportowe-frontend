import type { SubmissionListContext } from "@/lib/nav/routes";

export type SubmissionRouteContext = "my-submissions" | "queue";
export type SubmissionRouteKind = "feed" | "realtime";

export function parseSubmissionRouteParams(
  context: string,
  kind: string,
  id: string,
): { listContext: SubmissionListContext; kind: SubmissionRouteKind; submissionId: number } | null {
  if (context !== "my-submissions" && context !== "queue") return null;
  if (kind !== "feed" && kind !== "realtime") return null;
  const submissionId = Number(id);
  if (!Number.isFinite(submissionId)) return null;
  return {
    listContext: context === "queue" ? "queue" : "my",
    kind,
    submissionId,
  };
}
