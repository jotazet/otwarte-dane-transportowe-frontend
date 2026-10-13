"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MdAdd, MdWarningAmber } from "react-icons/md";

import { PlannerAddFeedsDialog } from "@/components/plannerAdmin/PlannerAddFeedsDialog";
import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import {
  CardHeading,
  clickableRowSx,
  openOnEnter,
  FeedStateChip,
  feedState,
  fill,
  plannerErrorMessage,
  RentalStateChip,
  rentalState,
  scrollTableSx,
} from "@/components/plannerAdmin/shared";
import {
  plannerAdminPaths,
  type PlannerFeed,
  type PlannerRentalSource,
} from "@/lib/api/plannerAdmin";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

/** Whether a change has not reached the served graph yet. */
function isPending(
  item: { updated_at: string; is_enabled: boolean; active_result: unknown },
  servedSince: string | null,
): boolean {
  if (!servedSince) return item.is_enabled;
  if (!item.active_result) return item.is_enabled;
  return item.updated_at > servedSince;
}

/** Saves a change of a feed or source, then reloads the panel; a failure is reported. */
async function patchAndReload(
  ctx: PlannerAdminContext,
  path: string,
  body: Record<string, unknown>,
) {
  try {
    await ctx.apiJson("PATCH", path, body);
  } catch (e) {
    ctx.notify(plannerErrorMessage(e, ctx.dict), "error");
  }
  await ctx.reload();
}

export function PlannerFeedsTab({ ctx }: { ctx: PlannerAdminContext }) {
  const { core, dict } = ctx;
  const [adding, setAdding] = React.useState<"gtfs" | "gbfs" | null>(null);
  const patch = (path: string, body: Record<string, unknown>) => patchAndReload(ctx, path, body);
  const servedSince = core.status.active_build?.created_at ?? null;
  const pending =
    core.feeds.some((f) => isPending(f, servedSince)) ||
    core.rentals.some((r) => isPending(r, servedSince));
  const feeds = [...core.feeds].sort((a, b) =>
    a.organization.name.localeCompare(b.organization.name, ctx.locale),
  );
  const rentals = [...core.rentals].sort((a, b) =>
    a.organization.name.localeCompare(b.organization.name, ctx.locale),
  );

  return (
    <Stack spacing={2}>
      {pending ? (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={Boolean(core.status.running_build)}
              onClick={() => void ctx.requestBuild()}
            >
              {dict.plannerAdminBuildNow}
            </Button>
          }
        >
          {dict.plannerAdminPendingChanges}
        </Alert>
      ) : null}

      <Card component="section" aria-labelledby="planner-gtfs-title">
        <CardHeading
          id="planner-gtfs-title"
          title={dict.plannerAdminGtfsTitle}
          hint={dict.plannerAdminGtfsHint}
          dense
          action={
            <Button
              variant="contained"
              startIcon={<MdAdd aria-hidden />}
              onClick={() => setAdding("gtfs")}
            >
              {dict.plannerAdminAddFeed}
            </Button>
          }
        />
        {feeds.length === 0 ? (
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {dict.plannerAdminFeedsEmpty}
            </Typography>
          </CardContent>
        ) : (
          <TableContainer
            role="region"
            aria-labelledby="planner-gtfs-title"
            tabIndex={0}
            sx={scrollTableSx}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell>{dict.plannerAdminColFeed}</TableCell>
                  <TableCell>{dict.plannerAdminColPlannerId}</TableCell>
                  <TableCell>{dict.plannerAdminColInGraph}</TableCell>
                  <TableCell>{dict.plannerAdminColRealtime}</TableCell>
                  <TableCell>{dict.plannerAdminColEnabled}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feeds.map((feed) => (
                  <FeedRow
                    key={feed.id}
                    feed={feed}
                    ctx={ctx}
                    onOpen={() => ctx.openDrawer({ type: "feed", id: feed.id })}
                    onPatch={(body) => patch(plannerAdminPaths.feed(feed.id), body)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card component="section" aria-labelledby="planner-gbfs-title">
        <CardHeading
          id="planner-gbfs-title"
          title={dict.plannerAdminGbfsTitle}
          hint={dict.plannerAdminGbfsHint}
          dense
          action={
            <Button
              variant="outlined"
              startIcon={<MdAdd aria-hidden />}
              onClick={() => setAdding("gbfs")}
            >
              {dict.plannerAdminAddRental}
            </Button>
          }
        />
        {rentals.length === 0 ? (
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {dict.plannerAdminRentalsEmpty}
            </Typography>
          </CardContent>
        ) : (
          <TableContainer
            role="region"
            aria-labelledby="planner-gbfs-title"
            tabIndex={0}
            sx={scrollTableSx}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell>{dict.plannerAdminColSource}</TableCell>
                  <TableCell>{dict.plannerAdminColNetwork}</TableCell>
                  <TableCell>{dict.plannerAdminColInGraph}</TableCell>
                  <TableCell>{dict.plannerAdminColEnabled}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rentals.map((source) => (
                  <RentalRow
                    key={source.id}
                    source={source}
                    ctx={ctx}
                    onOpen={() => ctx.openDrawer({ type: "rental", id: source.id })}
                    onPatch={(body) => patch(plannerAdminPaths.rentalSource(source.id), body)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <PlannerAddFeedsDialog ctx={ctx} kind={adding} onClose={() => setAdding(null)} />
    </Stack>
  );
}

type RowProps = {
  ctx: PlannerAdminContext;
  onOpen: () => void;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
};

function FeedRow({ feed, ctx, onOpen, onPatch }: RowProps & { feed: PlannerFeed }) {
  const { dict } = ctx;
  const state = feedState(feed);
  const partial =
    feed.include_realtime &&
    (state === "stale" || Boolean(feed.active_result?.realtime_skipped.length));
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <TableRow tabIndex={0} sx={clickableRowSx} onClick={onOpen} onKeyDown={openOnEnter(onOpen)}>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {feed.organization.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {feed.submission_name}
        </Typography>
      </TableCell>
      <TableCell>
        <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
          {feed.feed_id}
        </Box>
      </TableCell>
      <TableCell>
        <FeedStateChip state={state} dict={dict} />
      </TableCell>
      <TableCell onClick={stop} onKeyDown={stop}>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Switch
            checked={feed.include_realtime}
            onChange={(_, checked) => void onPatch({ include_realtime: checked })}
            slotProps={{
              input: {
                "aria-label": fill(dict.plannerAdminRealtimeSwitch, {
                  name: feed.organization.name,
                }),
              },
            }}
          />
          {partial ? (
            <Tooltip title={dict.plannerAdminRealtimePartial}>
              <Box
                component="span"
                role="img"
                aria-label={dict.plannerAdminRealtimePartial}
                sx={{ display: "inline-flex", color: "warning.main", fontSize: 20 }}
              >
                <MdWarningAmber aria-hidden />
              </Box>
            </Tooltip>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell onClick={stop} onKeyDown={stop}>
        <Switch
          checked={feed.is_enabled}
          onChange={(_, checked) => void onPatch({ is_enabled: checked })}
          slotProps={{
            input: {
              "aria-label": fill(dict.plannerAdminEnabledSwitch, { name: feed.organization.name }),
            },
          }}
        />
      </TableCell>
    </TableRow>
  );
}

function RentalRow({ source, ctx, onOpen, onPatch }: RowProps & { source: PlannerRentalSource }) {
  const { dict } = ctx;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <TableRow tabIndex={0} sx={clickableRowSx} onClick={onOpen} onKeyDown={openOnEnter(onOpen)}>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {source.organization.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {source.submission_name}
        </Typography>
      </TableCell>
      <TableCell>
        <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
          {source.network}
        </Box>
      </TableCell>
      <TableCell>
        <RentalStateChip state={rentalState(source)} dict={dict} />
      </TableCell>
      <TableCell onClick={stop} onKeyDown={stop}>
        <Switch
          checked={source.is_enabled}
          onChange={(_, checked) => void onPatch({ is_enabled: checked })}
          slotProps={{
            input: {
              "aria-label": fill(dict.plannerAdminEnabledSwitch, { name: source.submission_name }),
            },
          }}
        />
      </TableCell>
    </TableRow>
  );
}
