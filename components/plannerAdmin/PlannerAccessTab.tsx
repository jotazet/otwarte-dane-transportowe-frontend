"use client";

import * as React from "react";
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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MdAdd, MdBlock } from "react-icons/md";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { PlannerApiKeyDialog } from "@/components/plannerAdmin/PlannerApiKeyDialog";
import { PlannerBanDialog } from "@/components/plannerAdmin/PlannerBanDialog";
import {
  CardHeading,
  isPositiveInt,
  liftBan,
  LoadState,
  plannerErrorMessage,
  scrollTableSx,
  StateChip,
  StatusPanel,
  twoColumnGridSx,
} from "@/components/plannerAdmin/shared";
import { useApiLoad } from "@/lib/ui/useApiLoad";
import {
  LIMIT_GROUPS,
  LIMIT_SCOPES,
  plannerAdminPaths,
  type ApiKey,
  type IpBan,
  type LimitField,
  type PlannerSettings,
} from "@/lib/api/plannerAdmin";
import { fetchAllPages } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { tableHeadRowSx } from "@/lib/ui/tableSx";
import { fill } from "@/lib/i18n/fill";

export function PlannerAccessTab({ ctx }: { ctx: PlannerAdminContext }) {
  return (
    <Box sx={twoColumnGridSx}>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <ApiKeysCard ctx={ctx} />
        <BansCard ctx={ctx} />
      </Stack>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <PublicApiCard ctx={ctx} />
        <LimitsCard ctx={ctx} />
      </Stack>
    </Box>
  );
}

function ApiKeysCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { apiJson, dict, locale } = ctx;
  const [creating, setCreating] = React.useState(false);
  const keys = useApiLoad(
    React.useCallback(
      () => fetchAllPages<ApiKey>((p) => apiJson("GET", p), plannerAdminPaths.apiKeys),
      [apiJson],
    ),
  );

  const revoke = async (key: ApiKey) => {
    const ok = await ctx.confirm(fill(dict.plannerAdminKeyRevokeConfirm, { name: key.name }), {
      confirmLabel: dict.plannerAdminKeyRevokeButton,
    });
    if (!ok) return;
    try {
      await apiJson("PATCH", plannerAdminPaths.apiKey(key.id), { is_active: false });
      ctx.notify(fill(dict.plannerAdminKeyRevokedToast, { name: key.name }));
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    }
    keys.reload();
  };

  const customLimits = (key: ApiKey) =>
    LIMIT_GROUPS.flatMap((g) => {
      const value = key[`${g}_per_minute`];
      return value === null
        ? []
        : [`${dict.plannerAdminLimitGroupLabels[g]}: ${formatNumber(value, locale)}`];
    }).join(", ");

  return (
    <Card component="section" aria-labelledby="planner-keys-title" sx={{ minWidth: 0 }}>
      <CardHeading
        id="planner-keys-title"
        title={dict.plannerAdminKeysTitle}
        hint={dict.plannerAdminKeysHint}
        action={
          <Button
            variant="contained"
            startIcon={<MdAdd aria-hidden />}
            onClick={() => setCreating(true)}
          >
            {dict.plannerAdminNewKey}
          </Button>
        }
      />
      <LoadState loaded={keys} dict={dict} sx={{ mx: { xs: 2.5, sm: 3 }, mb: 2 }} />
      {keys.data?.length === 0 ? (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminKeysEmpty}
          </Typography>
        </CardContent>
      ) : null}
      {keys.data?.length ? (
        <TableContainer
          role="region"
          aria-labelledby="planner-keys-title"
          tabIndex={0}
          sx={scrollTableSx}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.plannerAdminColName}</TableCell>
                <TableCell>{dict.plannerAdminColPrefix}</TableCell>
                <TableCell>{dict.plannerAdminColLastUsed}</TableCell>
                <TableCell>{dict.plannerAdminColState}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.data.map((key) => {
                const limits = customLimits(key);
                return (
                  <TableRow
                    key={key.id}
                    sx={key.is_active ? undefined : { "& td": { color: "text.secondary" } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "inherit" }}>
                        {key.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        {[
                          key.contact_email,
                          limits ? fill(dict.plannerAdminKeyCustomLimits, { limits }) : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>{key.prefix}…</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {key.last_used_at
                        ? formatDateTime(key.last_used_at, locale)
                        : dict.plannerAdminKeyNeverUsed}
                    </TableCell>
                    <TableCell>
                      <StateChip
                        tone={key.is_active ? "ok" : "neutral"}
                        label={
                          key.is_active ? dict.plannerAdminKeyActive : dict.plannerAdminKeyRevoked
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {key.is_active ? (
                        <Button size="small" color="error" onClick={() => void revoke(key)}>
                          {dict.plannerAdminKeyRevoke}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <PlannerApiKeyDialog
        ctx={ctx}
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={keys.reload}
      />
    </Card>
  );
}

function BansCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { apiJson, dict, locale } = ctx;
  const [banFor, setBanFor] = React.useState<string | null>(null);
  const bans = useApiLoad(
    React.useCallback(
      () => fetchAllPages<IpBan>((p) => apiJson("GET", p), plannerAdminPaths.ipBans),
      [apiJson],
    ),
  );

  const unban = async (ban: IpBan) => {
    await liftBan(ctx, ban);
    bans.reload();
  };

  return (
    <Card component="section" aria-labelledby="planner-bans-title" sx={{ minWidth: 0 }}>
      <CardHeading
        id="planner-bans-title"
        title={dict.plannerAdminBansTitle}
        action={
          <Button
            variant="outlined"
            color="error"
            startIcon={<MdBlock aria-hidden />}
            onClick={() => setBanFor("")}
          >
            {dict.plannerAdminIpBanAddress}
          </Button>
        }
      />
      <LoadState loaded={bans} dict={dict} sx={{ mx: { xs: 2.5, sm: 3 }, mb: 2 }} />
      {bans.data?.length === 0 ? (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminBansEmpty}
          </Typography>
        </CardContent>
      ) : null}
      {bans.data?.length ? (
        <TableContainer
          role="region"
          aria-labelledby="planner-bans-title"
          tabIndex={0}
          sx={scrollTableSx}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.plannerAdminColBanNetwork}</TableCell>
                <TableCell>{dict.plannerAdminColReason}</TableCell>
                <TableCell>{dict.plannerAdminColExpires}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {bans.data.map((ban) => (
                <TableRow key={ban.id}>
                  <TableCell sx={{ fontFamily: MONOSPACE_FONT }}>{ban.network}</TableCell>
                  <TableCell>
                    {ban.reason || "-"}
                    {ban.created_by ? (
                      <Typography variant="caption" color="text.secondary" component="div">
                        {fill(dict.plannerAdminBanAddedBy, { user: ban.created_by })}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {ban.expires_at
                      ? formatDateTime(ban.expires_at, locale)
                      : dict.plannerAdminBanNoExpiry}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => void unban(ban)}>
                      {dict.plannerAdminUnban}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <PlannerBanDialog
        ctx={ctx}
        network={banFor}
        onClose={() => setBanFor(null)}
        onBanned={bans.reload}
      />
    </Card>
  );
}

function PublicApiCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { dict } = ctx;
  const enabled = ctx.core.settings.public_api_enabled;

  const toggle = async (next: boolean) => {
    if (!next) {
      const ok = await ctx.confirm(dict.plannerAdminPublicApiOffConfirm, {
        confirmLabel: dict.plannerAdminPublicApiOffButton,
      });
      if (!ok) return;
    }
    try {
      const settings = await ctx.apiJson<PlannerSettings>("PATCH", plannerAdminPaths.settings, {
        public_api_enabled: next,
      });
      ctx.updateCore((c) => ({ ...c, settings }));
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    }
  };

  return (
    <Card component="section" aria-labelledby="planner-public-api-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
        >
          <Typography variant="h6" component="h2" id="planner-public-api-title">
            {dict.plannerAdminPublicApiTitle}
          </Typography>
          <Switch
            checked={enabled}
            onChange={(_, v) => void toggle(v)}
            slotProps={{ input: { "aria-label": dict.plannerAdminPublicApiSwitch } }}
          />
        </Stack>
        <Box sx={{ mt: 1.5 }}>
          <StatusPanel
            color={enabled ? "success.main" : "text.disabled"}
            title={enabled ? dict.plannerAdminPublicApiStateOn : dict.plannerAdminPublicApiStateOff}
            body={enabled ? dict.plannerAdminPublicApiOnBody : dict.plannerAdminPublicApiOffBody}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

type LimitDraft = Record<LimitField, string>;

function limitDraft(settings: PlannerSettings): LimitDraft {
  const draft = {} as LimitDraft;
  for (const scope of LIMIT_SCOPES) {
    for (const group of LIMIT_GROUPS) {
      const field: LimitField = `${scope}_${group}_per_minute`;
      draft[field] = String(settings[field]);
    }
  }
  return draft;
}

function LimitsCard({ ctx }: { ctx: PlannerAdminContext }) {
  const { dict } = ctx;
  const [draft, setDraft] = React.useState<LimitDraft>(() => limitDraft(ctx.core.settings));
  const [saving, setSaving] = React.useState(false);
  const saved = limitDraft(ctx.core.settings);
  const fields = Object.keys(draft) as LimitField[];
  const dirty = fields.some((f) => draft[f] !== saved[f]);
  const invalid = fields.some((f) => !isPositiveInt(draft[f]));

  const submit = async () => {
    setSaving(true);
    try {
      const settings = await ctx.apiJson<PlannerSettings>(
        "PATCH",
        plannerAdminPaths.settings,
        Object.fromEntries(fields.map((f) => [f, Number(draft[f])])),
      );
      ctx.updateCore((c) => ({ ...c, settings }));
      ctx.notify(dict.plannerAdminLimitsSaved);
    } catch (e) {
      ctx.notify(plannerErrorMessage(e, dict), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card component="section" aria-labelledby="planner-limits-title">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h6" component="h2" id="planner-limits-title" sx={{ mb: 1.5 }}>
          {dict.plannerAdminLimitsTitle}
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table
            size="small"
            sx={{ "& td, & th": { px: 0.75 }, "& td:first-of-type, & th:first-of-type": { pl: 0 } }}
          >
            <TableHead>
              <TableRow>
                <TableCell />
                {LIMIT_GROUPS.map((g) => (
                  <TableCell
                    key={g}
                    align="right"
                    sx={{ fontWeight: 500, color: "text.secondary" }}
                  >
                    {dict.plannerAdminLimitGroupLabels[g]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {LIMIT_SCOPES.map((scope) => (
                <TableRow key={scope}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {dict.plannerAdminLimitScopeLabels[scope]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dict.plannerAdminLimitScopeHints[scope]}
                    </Typography>
                  </TableCell>
                  {LIMIT_GROUPS.map((group) => {
                    const field: LimitField = `${scope}_${group}_per_minute`;
                    return (
                      <TableCell key={group} align="right">
                        <TextField
                          size="small"
                          value={draft[field]}
                          onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                          error={!isPositiveInt(draft[field])}
                          sx={{ width: 76 }}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              style: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
                              "aria-label": `${dict.plannerAdminLimitScopeLabels[scope]}, ${dict.plannerAdminLimitGroupLabels[group]}`,
                            },
                          }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {invalid ? (
          <Typography variant="caption" color="error" component="p" sx={{ mt: 1 }}>
            {dict.plannerAdminLimitsInvalid}
          </Typography>
        ) : null}
        <Stack direction="row" sx={{ mt: 2, gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            disabled={!dirty || invalid || saving}
            onClick={() => void submit()}
          >
            {dict.plannerAdminLimitsSave}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {dict.plannerAdminLimitsHint}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
