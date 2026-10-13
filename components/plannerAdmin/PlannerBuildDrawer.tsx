"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { MdHistory } from "react-icons/md";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { restorableBuildId } from "@/components/plannerAdmin/PlannerBuildsTab";
import { DrawerSection, OtpLog, PlannerDrawer } from "@/components/plannerAdmin/PlannerDrawer";
import {
  BuildStatusChip,
  codeMessage,
  DefinitionRows,
  FeedStateChip,
  fill,
  plannerErrorMessage,
  RentalStateChip,
  StateChip,
} from "@/components/plannerAdmin/shared";
import { plannerAdminPaths, type GraphBuildDetail } from "@/lib/api/plannerAdmin";
import { formatDateTime, formatTime } from "@/lib/format";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

export function PlannerBuildDrawer({
  ctx,
  buildId,
  onClose,
}: {
  ctx: PlannerAdminContext;
  buildId: number | null;
  onClose: () => void;
}) {
  const { apiJson, dict, locale } = ctx;
  const [build, setBuild] = React.useState<GraphBuildDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (buildId === null) return;
    void (async () => {
      setBuild(null);
      setError(null);
      try {
        setBuild(await apiJson<GraphBuildDetail>("GET", plannerAdminPaths.build(buildId)));
      } catch (e) {
        setError(plannerErrorMessage(e, dict));
      }
    })();
  }, [apiJson, buildId, dict, ctx.core.loadedAt]);

  const restorable = build !== null && build.id === restorableBuildId(ctx.core.builds);

  const restore = async () => {
    if (!build) return;
    const ok = await ctx.confirm(fill(dict.plannerAdminBuildRestoreConfirm, { id: build.id }), {
      confirmLabel: dict.plannerAdminBuildRestoreButton,
      danger: false,
    });
    if (!ok) return;
    try {
      await apiJson("POST", plannerAdminPaths.activateBuild(build.id), {});
      ctx.notify(fill(dict.plannerAdminBuildRestoreRequested, { id: build.id }));
      onClose();
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    }
    await ctx.reload();
  };

  const subtitle = build
    ? [
        dict.plannerAdminBuildTriggerLabels[build.trigger],
        build.requested_by,
        formatDateTime(build.started_at ?? build.created_at, locale),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <PlannerDrawer
      open={buildId !== null}
      onClose={onClose}
      title={buildId === null ? "" : fill(dict.plannerAdminBuildTitle, { id: buildId })}
      subtitle={subtitle}
      closeLabel={dict.close}
    >
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!build && !error ? <LoadingBlock /> : null}
      {build ? (
        <>
          <DrawerSection>
            <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
              <BuildStatusChip status={build.status} dict={dict} />
              {build.is_active ? (
                <StateChip tone="neutral" label={dict.plannerAdminServed} />
              ) : null}
            </Stack>
            {build.error_code ? (
              <Alert severity="error">
                {codeMessage(build.error_code, dict)}{" "}
                <Box component="code" sx={{ fontFamily: MONOSPACE_FONT, fontSize: "0.75rem" }}>
                  {build.error_code}
                </Box>
              </Alert>
            ) : null}
            <OtpLog text={build.log_excerpt} label={dict.plannerAdminOtpLog} />
            {build.status === "queued" ? (
              <Typography variant="body2" color="text.secondary">
                {dict.plannerAdminBuildQueuedHint}
              </Typography>
            ) : (
              <DefinitionRows
                rows={[
                  {
                    label: dict.plannerAdminBuildDowntime,
                    value: build.otp_stopped_at
                      ? `${formatTime(build.otp_stopped_at, locale)}–${build.finished_at ? formatTime(build.finished_at, locale) : "…"}`
                      : "-",
                  },
                  {
                    label: dict.plannerAdminBuildIndex,
                    value: build.indexed_at
                      ? fill(dict.plannerAdminBuildIndexedAt, {
                          date: formatDateTime(build.indexed_at, locale),
                        })
                      : dict.plannerAdminBuildNotIndexed,
                  },
                  {
                    label: dict.plannerAdminBuildOtpImage,
                    value: (
                      <Box
                        component="code"
                        sx={{ fontFamily: MONOSPACE_FONT, fontSize: "0.75rem" }}
                      >
                        {build.otp_image.split("/").pop()}
                      </Box>
                    ),
                  },
                ]}
              />
            )}
          </DrawerSection>

          {build.feed_results.length || build.rental_results.length ? (
            <DrawerSection title={dict.plannerAdminBuildFeedsTitle}>
              <TableContainer
                tabIndex={0}
                sx={{ maxHeight: 300, border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                <Table size="small">
                  <TableBody>
                    {build.feed_results.map((r) => (
                      <TableRow key={`f-${r.feed_id}`}>
                        <TableCell>
                          <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
                            {r.feed_id}
                          </Box>
                          {r.error_code ? (
                            <Typography variant="caption" color="text.secondary" component="div">
                              {codeMessage(r.error_code, dict)}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="right">
                          <FeedStateChip state={r.outcome} dict={dict} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {build.rental_results.map((r) => (
                      <TableRow key={`r-${r.network}`}>
                        <TableCell>
                          <Box component="code" sx={{ fontFamily: MONOSPACE_FONT }}>
                            {r.network}
                          </Box>
                          {r.error_code ? (
                            <Typography variant="caption" color="text.secondary" component="div">
                              {codeMessage(r.error_code, dict)}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="right">
                          <RentalStateChip state={r.outcome} dict={dict} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DrawerSection>
          ) : null}

          {restorable ? (
            <DrawerSection>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<MdHistory aria-hidden />}
                  disabled={Boolean(ctx.core.status.running_build)}
                  onClick={() => void restore()}
                >
                  {dict.plannerAdminBuildRestore}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {dict.plannerAdminBuildRestoreHint}
              </Typography>
            </DrawerSection>
          ) : build.status === "succeeded" && !build.is_active ? (
            <Typography variant="body2" color="text.secondary">
              {dict.plannerAdminBuildNotRestorable}
            </Typography>
          ) : null}
        </>
      ) : null}
    </PlannerDrawer>
  );
}
