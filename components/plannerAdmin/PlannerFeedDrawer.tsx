"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { DrawerSection, OtpLog, PlannerDrawer } from "@/components/plannerAdmin/PlannerDrawer";
import {
  codeMessage,
  DefinitionRows,
  FeedStateChip,
  feedState,
  fill,
  plannerErrorMessage,
  RentalStateChip,
  rentalState,
} from "@/components/plannerAdmin/shared";
import {
  fetchFeedCandidates,
  plannerAdminPaths,
  type FailurePolicy,
  type FeedCandidate,
  type PlannerFeed,
  type PlannerRentalSource,
} from "@/lib/api/plannerAdmin";
import { formatDateTime } from "@/lib/format";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

type Target = { type: "feed" | "rental"; id: number };

export function PlannerFeedDrawer({
  ctx,
  target,
  onClose,
}: {
  ctx: PlannerAdminContext;
  target: Target | null;
  onClose: () => void;
}) {
  const feed = target?.type === "feed" ? ctx.core.feeds.find((f) => f.id === target.id) : undefined;
  const source =
    target?.type === "rental" ? ctx.core.rentals.find((r) => r.id === target.id) : undefined;
  const item = feed ?? source;

  return (
    <PlannerDrawer
      open={Boolean(item)}
      onClose={onClose}
      title={item?.organization.name ?? ""}
      subtitle={item ? `${item.submission_name} · ${item.organization.region}` : undefined}
      closeLabel={ctx.dict.close}
    >
      {feed ? <FeedDetails ctx={ctx} feed={feed} onRemoved={onClose} /> : null}
      {source ? <RentalDetails ctx={ctx} source={source} onRemoved={onClose} /> : null}
    </PlannerDrawer>
  );
}

async function save(ctx: PlannerAdminContext, path: string, body: Record<string, unknown>) {
  try {
    await ctx.apiJson("PATCH", path, body);
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
  await ctx.reload();
}

async function remove(
  ctx: PlannerAdminContext,
  path: string,
  question: string,
  name: string,
  onRemoved: () => void,
) {
  const ok = await ctx.confirm(question, { confirmLabel: ctx.dict.plannerAdminRemoveFromPlanner });
  if (!ok) return;
  try {
    await ctx.apiJson("DELETE", path);
    ctx.notify(fill(ctx.dict.plannerAdminRemoved, { name }));
    onRemoved();
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
  await ctx.reload();
}

function FeedDetails({
  ctx,
  feed,
  onRemoved,
}: {
  ctx: PlannerAdminContext;
  feed: PlannerFeed;
  onRemoved: () => void;
}) {
  const { dict, locale } = ctx;
  const result = feed.active_result;
  const state = feedState(feed);
  const [candidates, setCandidates] = React.useState<FeedCandidate[]>([]);
  const updaters: Record<string, string> = dict.plannerAdminRealtimeUpdaterLabels;
  const endpoints: Record<string, string> = dict.plannerAdminRealtimeEndpointLabels;

  React.useEffect(() => {
    void (async () => {
      try {
        setCandidates(await fetchFeedCandidates(ctx.apiJson));
      } catch {
        // Without candidates the submission field offers only the current one.
      }
    })();
  }, [ctx.apiJson]);

  const sameOrganization = candidates.filter((c) => c.organization.id === feed.organization.id);
  const submissions = sameOrganization.some((c) => c.id === feed.submission)
    ? sameOrganization
    : [{ id: feed.submission, name: feed.submission_name }, ...sameOrganization];
  const path = plannerAdminPaths.feed(feed.id);

  let realtimeText: string | null = null;
  if (feed.include_realtime) {
    if (state === "stale") realtimeText = dict.plannerAdminRealtimePaused;
    else if (result?.realtime_polled?.length) {
      realtimeText = fill(dict.plannerAdminRealtimePolled, {
        list: result.realtime_polled.map((u) => updaters[u] ?? u).join(", "),
      });
    } else realtimeText = dict.plannerAdminRealtimeNextBuild;
  }

  return (
    <>
      <DrawerSection title={dict.plannerAdminInServedGraph}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <FeedStateChip state={state} dict={dict} />
          {result?.version_at ? (
            <Typography variant="body2" color="text.secondary">
              {fill(dict.plannerAdminNewestFile, {
                date: formatDateTime(result.version_at, locale),
              })}
            </Typography>
          ) : null}
        </Box>
        {result?.error_code ? (
          <Alert severity={state === "excluded" ? "error" : "warning"}>
            {codeMessage(result.error_code, dict)}{" "}
            <Box component="code" sx={{ fontFamily: MONOSPACE_FONT, fontSize: "0.75rem" }}>
              {result.error_code}
            </Box>
          </Alert>
        ) : null}
        <OtpLog text={result?.log_excerpt ?? ""} label={dict.plannerAdminOtpLog} />
        <DefinitionRows
          rows={[
            {
              label: dict.plannerAdminColPlannerId,
              value: (
                <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
                  {feed.feed_id}
                </Box>
              ),
            },
            {
              label: dict.plannerAdminLastGood,
              value: feed.last_good_at
                ? formatDateTime(feed.last_good_at, locale)
                : dict.plannerAdminNone,
            },
          ]}
        />
      </DrawerSection>

      <DrawerSection title={dict.plannerAdminRealtimeTitle}>
        <FormControlLabel
          labelPlacement="start"
          sx={{ mx: 0, justifyContent: "space-between" }}
          control={
            <Switch
              checked={feed.include_realtime}
              onChange={(_, v) => void save(ctx, path, { include_realtime: v })}
            />
          }
          label={dict.plannerAdminRealtimeToggle}
        />
        {realtimeText ? (
          <Typography variant="body2" color="text.secondary">
            {realtimeText}
          </Typography>
        ) : null}
        {feed.include_realtime && result?.realtime_skipped.length ? (
          <Alert severity="warning">
            {result.realtime_skipped.map((s) => (
              <div key={`${s.endpoint_type}-${s.error_code}`}>
                {fill(dict.plannerAdminRealtimeSkippedItem, {
                  endpoint: endpoints[s.endpoint_type] ?? s.endpoint_type,
                  reason: codeMessage(s.error_code, dict),
                })}
              </div>
            ))}
          </Alert>
        ) : null}
      </DrawerSection>

      <DrawerSection title={dict.plannerAdminSettingsTitle}>
        <TextField
          select
          size="small"
          label={dict.plannerAdminFailurePolicy}
          value={feed.failure_policy}
          onChange={(e) =>
            void save(ctx, path, { failure_policy: e.target.value as FailurePolicy })
          }
        >
          {(["keep_last_good", "exclude"] as const).map((p) => (
            <MenuItem key={p} value={p}>
              {dict.plannerAdminFailurePolicyLabels[p]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={dict.plannerAdminSubmission}
          value={feed.submission}
          helperText={dict.plannerAdminSubmissionHint}
          onChange={(e) => void save(ctx, path, { submission: Number(e.target.value) })}
        >
          {submissions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          labelPlacement="start"
          sx={{ mx: 0, justifyContent: "space-between" }}
          control={
            <Switch
              checked={feed.is_enabled}
              onChange={(_, v) => void save(ctx, path, { is_enabled: v })}
            />
          }
          label={dict.plannerAdminIncludeInBuild}
        />
      </DrawerSection>

      <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() =>
            void remove(
              ctx,
              path,
              fill(dict.plannerAdminRemoveFeedConfirm, {
                name: feed.organization.name,
                id: feed.feed_id,
              }),
              feed.organization.name,
              onRemoved,
            )
          }
        >
          {dict.plannerAdminRemoveFromPlanner}
        </Button>
      </Box>
    </>
  );
}

function RentalDetails({
  ctx,
  source,
  onRemoved,
}: {
  ctx: PlannerAdminContext;
  source: PlannerRentalSource;
  onRemoved: () => void;
}) {
  const { dict } = ctx;
  const result = source.active_result;
  const path = plannerAdminPaths.rentalSource(source.id);
  return (
    <>
      <DrawerSection title={dict.plannerAdminInServedGraph}>
        <Box>
          <RentalStateChip state={rentalState(source)} dict={dict} />
        </Box>
        {result?.error_code ? (
          <Alert severity="error">
            {codeMessage(result.error_code, dict)}{" "}
            <Box component="code" sx={{ fontFamily: MONOSPACE_FONT, fontSize: "0.75rem" }}>
              {result.error_code}
            </Box>
          </Alert>
        ) : null}
        <DefinitionRows
          rows={[
            {
              label: dict.plannerAdminColNetwork,
              value: (
                <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
                  {source.network}
                </Box>
              ),
            },
          ]}
        />
      </DrawerSection>
      <DrawerSection>
        <FormControlLabel
          labelPlacement="start"
          sx={{ mx: 0, justifyContent: "space-between" }}
          control={
            <Switch
              checked={source.is_enabled}
              onChange={(_, v) => void save(ctx, path, { is_enabled: v })}
            />
          }
          label={dict.plannerAdminIncludeInBuild}
        />
      </DrawerSection>
      <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() =>
            void remove(
              ctx,
              path,
              fill(dict.plannerAdminRemoveRentalConfirm, { name: source.submission_name }),
              source.submission_name,
              onRemoved,
            )
          }
        >
          {dict.plannerAdminRemoveFromPlanner}
        </Button>
      </Box>
    </>
  );
}
