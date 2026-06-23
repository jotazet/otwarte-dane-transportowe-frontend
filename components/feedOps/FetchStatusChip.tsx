import Chip from "@mui/material/Chip";

import type { Dictionary } from "@/i18n/getDictionary";
import type { FetchStatus } from "@/lib/api/types";

const COLOR_BY_STATUS: Record<FetchStatus, "success" | "warning" | "error" | "default"> = {
  active: "success",
  delayed: "warning",
  auto_paused: "error",
  manual_paused: "default",
};

export function fetchStatusLabel(status: FetchStatus | null | undefined, dict: Dictionary): string {
  if (!status) return "-";
  return dict.fetchStatusLabels[status] ?? status;
}

export function FetchStatusChip({
  status,
  dict,
}: {
  status: FetchStatus | null | undefined;
  dict: Dictionary;
}) {
  if (!status) return <span>-</span>;
  const color = COLOR_BY_STATUS[status] ?? "default";
  return (
    <Chip
      size="small"
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      label={fetchStatusLabel(status, dict)}
    />
  );
}
