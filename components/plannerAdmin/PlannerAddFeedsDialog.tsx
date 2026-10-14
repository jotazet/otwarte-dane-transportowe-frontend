"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MdSearch } from "react-icons/md";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { LoadState, plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { ApiError } from "@/lib/api/http";
import {
  fetchFeedCandidates,
  fetchRentalCandidates,
  PLANNER_ID_PATTERN,
  plannerAdminPaths,
  suggestPlannerId,
  type PlannerOrganization,
} from "@/lib/api/plannerAdmin";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { fill } from "@/lib/i18n/fill";
import { useApiLoad } from "@/lib/ui/useApiLoad";

type Candidate = { id: number; name: string; organization: PlannerOrganization; included: boolean };
type Selection = Record<number, { plannerId: string; realtime: boolean }>;

export function PlannerAddFeedsDialog({
  ctx,
  kind,
  onClose,
}: {
  ctx: PlannerAdminContext;
  kind: "gtfs" | "gbfs" | null;
  onClose: () => void;
}) {
  const { apiJson, dict } = ctx;
  const gtfs = kind === "gtfs";
  const [query, setQuery] = React.useState("");
  const [hideIncluded, setHideIncluded] = React.useState(false);
  const [selected, setSelected] = React.useState<Selection>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const loaded = useApiLoad(
    React.useCallback(async (): Promise<Candidate[] | null> => {
      if (kind === "gtfs") {
        const list = await fetchFeedCandidates(apiJson);
        return list.map((c) => ({ ...c, included: c.planner_feed !== null }));
      }
      if (kind === "gbfs") {
        const list = await fetchRentalCandidates(apiJson);
        return list.map((c) => ({ ...c, included: c.rental_source !== null }));
      }
      return null;
    }, [apiJson, kind]),
  );
  const candidates = loaded.data;

  const reset = () => {
    setSelected({});
    setQuery("");
    setSubmitError(null);
  };

  const existing = React.useMemo(
    () =>
      new Set(gtfs ? ctx.core.feeds.map((f) => f.feed_id) : ctx.core.rentals.map((r) => r.network)),
    [ctx.core.feeds, ctx.core.rentals, gtfs],
  );

  const idError = (id: number): string | null => {
    const value = selected[id]?.plannerId ?? "";
    if (!PLANNER_ID_PATTERN.test(value)) return dict.plannerAdminPlannerIdInvalid;
    const takenBySelection = Object.entries(selected).some(
      ([other, s]) => Number(other) !== id && s.plannerId === value,
    );
    return existing.has(value) || takenBySelection ? dict.plannerAdminPlannerIdTaken : null;
  };

  const toggle = (c: Candidate, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[c.id];
        return next;
      }
      const taken = new Set([...existing, ...Object.values(prev).map((s) => s.plannerId)]);
      next[c.id] = { plannerId: suggestPlannerId(c.name, taken), realtime: true };
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const visible = (candidates ?? []).filter(
    (c) =>
      !(hideIncluded && c.included) &&
      (!q || `${c.name} ${c.organization.name} ${c.organization.region}`.toLowerCase().includes(q)),
  );
  const groups: { org: PlannerOrganization; items: Candidate[] }[] = [];
  for (const c of visible) {
    const last = groups[groups.length - 1];
    if (last?.org.id === c.organization.id) last.items.push(c);
    else groups.push({ org: c.organization, items: [c] });
  }

  const selectedIds = Object.keys(selected).map(Number);
  const invalid = selectedIds.some((id) => idError(id) !== null);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    let added = 0;
    for (const id of selectedIds) {
      const s = selected[id];
      const name = candidates?.find((c) => c.id === id)?.name ?? String(id);
      try {
        if (gtfs) {
          await apiJson("POST", plannerAdminPaths.feeds, {
            submission: id,
            feed_id: s.plannerId,
            include_realtime: s.realtime,
          });
        } else {
          await apiJson("POST", plannerAdminPaths.rentalSources, {
            submission: id,
            network: s.plannerId,
          });
        }
        added += 1;
        setSelected((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (e) {
        // A 400 here is a field error (taken or invalid ID), which the backend sends without a code.
        setSubmitError(
          e instanceof ApiError && e.status === 400
            ? fill(dict.plannerAdminAddFailed, { name })
            : plannerErrorMessage(e, dict),
        );
        break;
      }
    }
    setSubmitting(false);
    if (added) {
      ctx.notify(fill(dict.plannerAdminAdded, { count: added }));
      await ctx.reload();
    }
    if (added === selectedIds.length) onClose();
  };

  return (
    <Dialog
      open={kind !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      slotProps={{ transition: { onEnter: reset } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {gtfs ? dict.plannerAdminAddGtfsTitle : dict.plannerAdminAddGbfsTitle}
        <Typography variant="body2" color="text.secondary">
          {gtfs ? dict.plannerAdminAddGtfsHint : dict.plannerAdminAddGbfsHint}
        </Typography>
      </DialogTitle>
      <Stack
        direction="row"
        sx={{ px: 3, pb: 1.5, gap: 2, alignItems: "center", flexWrap: "wrap" }}
      >
        <TextField
          size="small"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.plannerAdminAddSearch}
          sx={{ flex: "1 1 240px" }}
          slotProps={{
            htmlInput: { "aria-label": dict.plannerAdminAddSearch },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControlLabel
          control={<Checkbox checked={hideIncluded} onChange={(_, v) => setHideIncluded(v)} />}
          label={dict.plannerAdminAddHideIncluded}
        />
      </Stack>
      <DialogContent dividers sx={{ minHeight: 240, pt: 0 }}>
        <LoadState loaded={loaded} dict={dict} sx={{ mt: 2 }} />
        {candidates && groups.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            {dict.plannerAdminAddEmpty}
          </Typography>
        ) : null}
        {groups.map((g) => (
          <Box key={g.org.id} component="section" aria-label={g.org.name}>
            <Stack
              direction="row"
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                bgcolor: "background.paper",
                gap: 1,
                alignItems: "baseline",
                pt: 1.5,
                pb: 0.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" component="h3">
                {g.org.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {g.org.region}
              </Typography>
            </Stack>
            {g.items.map((c) => {
              const s = selected[c.id];
              const error = s ? idError(c.id) : null;
              return (
                <Box key={c.id} sx={{ py: 0.25 }}>
                  <FormControlLabel
                    sx={{ width: "100%", mr: 0, "& .MuiFormControlLabel-label": { flex: 1 } }}
                    disabled={c.included}
                    control={
                      <Checkbox
                        checked={c.included || Boolean(s)}
                        onChange={(_, v) => toggle(c, v)}
                      />
                    }
                    label={
                      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                        <span>{c.name}</span>
                        {c.included ? (
                          <Typography variant="caption" color="text.secondary">
                            {dict.plannerAdminAddAlreadyIncluded}
                          </Typography>
                        ) : null}
                      </Stack>
                    }
                  />
                  {s ? (
                    <Stack
                      direction="row"
                      sx={{
                        ml: 4,
                        mb: 1,
                        p: 1.5,
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <TextField
                        size="small"
                        label={
                          gtfs ? dict.plannerAdminPlannerIdLabel : dict.plannerAdminNetworkLabel
                        }
                        value={s.plannerId}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [c.id]: { ...s, plannerId: e.target.value },
                          }))
                        }
                        error={Boolean(error)}
                        helperText={error ?? dict.plannerAdminPlannerIdHint}
                        sx={{ flex: "1 1 220px" }}
                        slotProps={{ htmlInput: { style: { fontFamily: MONOSPACE_FONT } } }}
                      />
                      {gtfs ? (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={s.realtime}
                              onChange={(_, v) =>
                                setSelected((prev) => ({ ...prev, [c.id]: { ...s, realtime: v } }))
                              }
                            />
                          }
                          label={dict.plannerAdminAddRealtime}
                        />
                      ) : null}
                    </Stack>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        ))}
        {submitError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {selectedIds.length
            ? fill(dict.plannerAdminAddSelected, { count: selectedIds.length })
            : dict.plannerAdminAddNoneSelected}
        </Typography>
        <Button onClick={onClose}>{dict.cancel}</Button>
        <Button
          variant="contained"
          disabled={!selectedIds.length || invalid || submitting}
          onClick={() => void submit()}
        >
          {dict.plannerAdminAddSubmit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
