"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { Dictionary } from "@/i18n/getDictionary";
import type { ProxyFeedListItem } from "@/lib/api/feedOps";
import type { FetchStatus } from "@/lib/api/types";

type StatColor = "text.primary" | "success.main" | "warning.main" | "error.main";

function StatCard({
  value,
  label,
  color,
  onClick,
}: {
  value: number;
  label: string;
  color: StatColor;
  onClick?: () => void;
}) {
  const content = (
    <CardContent>
      <Typography variant="h3" sx={{ fontWeight: 600, color }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </CardContent>
  );
  return (
    <Card
      sx={{
        height: "100%",
        "&:hover": onClick ? { borderColor: "primary.main" } : undefined,
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: "100%", alignItems: "stretch" }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

export function FeedOpsOverview({
  dict,
  rows,
  loading,
  onSelectStatus,
  onSelectErrors,
}: {
  dict: Dictionary;
  rows: ProxyFeedListItem[];
  loading: boolean;
  onSelectStatus: (status: FetchStatus | "") => void;
  onSelectErrors: () => void;
}) {
  const stats = React.useMemo(() => {
    const byStatus: Record<FetchStatus, number> = {
      active: 0,
      delayed: 0,
      auto_paused: 0,
      manual_paused: 0,
    };
    let withErrors = 0;
    let totalErrors7d = 0;
    for (const row of rows) {
      const status = row.fetch_status;
      if (status && status in byStatus) byStatus[status] += 1;
      const errors = row.fetch_error_count_7d ?? 0;
      if (errors > 0) withErrors += 1;
      totalErrors7d += errors;
    }
    return { byStatus, withErrors, totalErrors7d };
  }, [rows]);

  if (loading) return <LoadingBlock label={dict.loading} />;

  const cards: { value: number; label: string; color: StatColor; onClick?: () => void }[] = [
    {
      value: rows.length,
      label: dict.feedOpsStatTotal,
      color: "text.primary",
      onClick: () => onSelectStatus(""),
    },
    {
      value: stats.byStatus.active,
      label: dict.feedOpsStatActive,
      color: "success.main",
      onClick: () => onSelectStatus("active"),
    },
    {
      value: stats.byStatus.delayed,
      label: dict.feedOpsStatDelayed,
      color: "warning.main",
      onClick: () => onSelectStatus("delayed"),
    },
    {
      value: stats.byStatus.auto_paused,
      label: dict.feedOpsStatAutoPaused,
      color: "error.main",
      onClick: () => onSelectStatus("auto_paused"),
    },
    {
      value: stats.byStatus.manual_paused,
      label: dict.feedOpsStatManualPaused,
      color: "text.primary",
      onClick: () => onSelectStatus("manual_paused"),
    },
    {
      value: stats.withErrors,
      label: dict.feedOpsStatWithErrors,
      color: "error.main",
      onClick: onSelectErrors,
    },
    {
      value: stats.totalErrors7d,
      label: dict.feedOpsStatErrors7d,
      color: "error.main",
      onClick: onSelectErrors,
    },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {dict.feedOpsSubtitle}
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={card.label}>
            <StatCard
              value={card.value}
              label={card.label}
              color={card.color}
              onClick={card.onClick}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
