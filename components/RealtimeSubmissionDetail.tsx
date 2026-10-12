"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { PasswordTextField } from "@/components/PasswordTextField";
import { InlineSelect } from "@/components/InlineSelect";
import { FormSection } from "@/components/layout/FormSection";
import { HistoryTimeline, type HistoryTimelineEvent } from "@/components/layout/HistoryTimeline";
import { StageBanner } from "@/components/layout/StageBanner";
import { useConfirm } from "@/components/layout/useConfirm";
import { HelperReviewPanel } from "@/components/submissions/HelperReviewPanel";
import { SubmissionDetailAuthGate } from "@/components/submissions/SubmissionDetailAuthGate";
import { FeedFetchHealthPanel } from "@/components/feedOps/FeedFetchHealthPanel";
import { submissionsPaths } from "@/lib/api/submissions";
import type { FetchHealthFields, RejectionReason } from "@/lib/api/types";
import { downloadBlob } from "@/lib/download";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasHelperAccess, canViewSubmissionInContext } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/usePermissions";
import { authTypeOptions } from "@/lib/data/authTypes";
import { submissionListPath, type SubmissionListContext } from "@/lib/nav/routes";
import {
  hideOriginalOnAuthChange,
  isHideOriginalLockedByAuth,
  resolveHideOriginal,
} from "@/lib/data/hideOriginalAuth";
import {
  isNoSourceUpdate,
  parseSourceUpdateInterval,
  SOURCE_UPDATE_INTERVAL_MAX,
  SOURCE_UPDATE_INTERVAL_MIN,
} from "@/lib/data/intervalChoices";
import { formatApiError } from "@/lib/formatApiError";
import { text } from "@/lib/format";
import { formatRejectionReasons } from "@/lib/rejectionReasons";
import { submissionStageLabel } from "@/lib/submissionStage";

type RtEndpoint = FetchHealthFields & {
  id?: number;
  endpoint_type?: string | null;
  url?: string | null;
  interval?: number | null;
  is_original?: boolean | null;
  hide_original?: boolean | null;
  auth_type?: string;
};

type RtDetail = {
  id: number;
  transport_organization: number;
  static_submission?: number | null;
  protocol: string;
  name?: string;
  note?: string;
  license?: string;
  current_stage: number;
  is_rejected: boolean;
  rejection_cause?: string | null;
  rejection_reasons?: RejectionReason[] | null;
  endpoints?: RtEndpoint[];
  submitted_by?: number;
  submitted_by_username?: string | null;
  history?: HistoryTimelineEvent[];
};

type EndpointDraft = {
  id?: number;
  endpoint_type: string;
  url: string;
  interval: string;
  is_original: boolean;
  hide_original: boolean;
  auth_type: string;
  auth_value: string;
};

export function RealtimeSubmissionDetail({
  locale,
  dict,
  submissionId,
  listContext = "my",
}: {
  locale: string;
  dict: Dictionary;
  submissionId: number;
  listContext?: SubmissionListContext;
}) {
  const auth = useAuth();
  const perms = usePermissions();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const [row, setRow] = React.useState<RtDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [stage, setStage] = React.useState("");
  const [rejectCause, setRejectCause] = React.useState("");
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [license, setLicense] = React.useState("");
  const [endpointsDraft, setEndpointsDraft] = React.useState<EndpointDraft[]>([]);

  const applyDetail = React.useCallback((d: RtDetail) => {
    setRow(d);
    setStage(String(d.current_stage));
    setRejectCause("");
    setName(d.name ?? "");
    setNote(d.note ?? "");
    setLicense(d.license ?? "");
    setEndpointsDraft(
      (d.endpoints ?? []).map((ep) => ({
        id: typeof ep.id === "number" ? ep.id : undefined,
        endpoint_type: String(ep.endpoint_type ?? ""),
        url: String(ep.url ?? ""),
        interval: typeof ep.interval === "number" ? String(ep.interval) : "60",
        is_original: ep.is_original !== false,
        hide_original: !!ep.hide_original,
        auth_type: ep.auth_type ?? "",
        auth_value: "",
      })),
    );
  }, []);

  const authStatus = auth.status;
  const apiJson = auth.apiJson;

  // Reload po akcjach mutujących (komponent zamontowany — bez anulowania).
  const load = React.useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setError(null);
    try {
      const d = await apiJson<RtDetail>("GET", submissionsPaths.realtimeDetail(submissionId));
      applyDetail(d);
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }, [apiJson, authStatus, submissionId, applyDetail, dict]);

  // Ładowanie początkowe / przy zmianie parametrów — z flagą `cancelled`
  // chroniącą przed setState po unmount i nadpisaniem nowszej odpowiedzi starszą.
  React.useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const d = await apiJson<RtDetail>("GET", submissionsPaths.realtimeDetail(submissionId));
        if (!cancelled) applyDetail(d);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, dict));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiJson, authStatus, submissionId, applyDetail, dict]);

  const listHref = submissionListPath(locale, listContext);

  const authTypeSelectOptions = authTypeOptions(dict);

  async function saveMeta() {
    if (!row || auth.status !== "authenticated" || !perms.user) return;
    const user = perms.user;
    const isOwner =
      user.userId != null && row.submitted_by != null && user.userId === row.submitted_by;
    const sourcePerms = perms.feedSource({
      isOwner,
      currentStage: row.current_stage,
      isRejected: row.is_rejected,
      isHelper: hasHelperAccess(user),
    });
    if (sourcePerms.canHelperReviewOnly) return;
    setError(null);
    if (endpointsDraft.some((ep) => parseSourceUpdateInterval(ep.interval) === null)) {
      setError(dict.sourceUpdateIntervalRange);
      return;
    }
    try {
      const body: Record<string, unknown> = {
        note: note.trim(),
        license: license.trim(),
      };
      if (sourcePerms.canEditFullSource || sourcePerms.canAdminSourceOnStage2Plus) {
        body.name = name.trim();
        body.endpoints = endpointsDraft.map((e) => {
          const o: Record<string, unknown> = {
            endpoint_type: e.endpoint_type,
            url: e.url.trim(),
            interval: parseSourceUpdateInterval(e.interval) ?? 0,
            is_original: e.is_original,
            hide_original: resolveHideOriginal(e.auth_type, e.hide_original),
          };
          if (typeof e.id === "number") o.id = e.id;
          if (e.auth_type) {
            o.auth_type = e.auth_type;
            if (e.auth_value.trim()) o.auth_value = e.auth_value.trim();
          } else o.auth_type = "";
          return o;
        });
      } else if (sourcePerms.canEditLimitedMeta) {
        body.endpoints = endpointsDraft.map((e) => ({
          endpoint_type: e.endpoint_type,
          interval: Math.max(0, Number(e.interval) || 0),
          ...(typeof e.id === "number" ? { id: e.id } : {}),
        }));
      } else return;

      await auth.apiJson("PATCH", submissionsPaths.realtimeDetail(row.id), body);
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function applyStage() {
    if (!row) return;
    setError(null);
    try {
      await auth.apiJson("PATCH", submissionsPaths.realtimeDetail(row.id), {
        stage: Number(stage),
      });
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function rejectSubmission() {
    if (!row) return;
    const rc = rejectCause.trim();
    if (!rc) return;
    setError(null);
    try {
      await auth.apiJson("PATCH", submissionsPaths.realtimeDetail(row.id), { rejection_cause: rc });
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function remove() {
    if (!row) return;
    if (!(await confirm(dict.confirmDeleteSubmission, { confirmLabel: dict.delete }))) return;
    try {
      await auth.apiJson("DELETE", submissionsPaths.realtimeDetail(row.id));
      router.replace(listHref);
      router.refresh();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function downloadRt(epPk: number) {
    if (!row?.static_submission) {
      setError(dict.downloadRealtimeHint);
      return;
    }
    try {
      const blob = await auth.apiBlob(
        submissionsPaths.realtimeDownload(row.static_submission, epPk),
      );
      downloadBlob(blob, `submission-${row.id}-rt-${epPk}.zip`);
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  if (auth.status !== "authenticated" || !row) {
    return (
      <SubmissionDetailAuthGate locale={locale} dict={dict} error={error} hasData={!!row}>
        <></>
      </SubmissionDetailAuthGate>
    );
  }

  const user = perms.user!;
  const forbidden = !canViewSubmissionInContext(user, {
    listContext,
    submittedBy: row.submitted_by,
  });

  if (forbidden) {
    return (
      <SubmissionDetailAuthGate locale={locale} dict={dict} error={error} hasData forbidden>
        <></>
      </SubmissionDetailAuthGate>
    );
  }

  const isOwner =
    user.userId != null && row.submitted_by != null && user.userId === row.submitted_by;
  const sourcePerms = perms.feedSource({
    isOwner,
    currentStage: row.current_stage,
    isRejected: row.is_rejected,
    isHelper: hasHelperAccess(user),
  });
  const showHelperPanel = hasHelperAccess(user) || user.isDjangoAdmin;
  const canSaveProvider =
    !sourcePerms.canHelperReviewOnly &&
    (sourcePerms.canEditFullSource ||
      sourcePerms.canEditLimitedMeta ||
      sourcePerms.canAdminSourceOnStage2Plus);
  const fieldsLocked =
    sourcePerms.canEditLimitedMeta &&
    !sourcePerms.canEditFullSource &&
    !sourcePerms.canAdminSourceOnStage2Plus;
  const rejectionReasons = formatRejectionReasons(row.rejection_reasons ?? [], dict);
  const stageLabel = submissionStageLabel("realtime", row.current_stage, row.is_rejected, dict);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <StageBanner
        stage={row.current_stage}
        stageLabel={stageLabel}
        isRejected={row.is_rejected}
        rejectionCause={row.rejection_cause}
        rejectionReasons={rejectionReasons}
        rejectedLabel={dict.rejected}
        fixHint={row.is_rejected ? dict.fixAndResubmit : undefined}
        dict={dict}
      />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            RT #{row.id} - {row.protocol}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dict.organizations}: {row.transport_organization} • {dict.staticSubmissionId}:{" "}
            {row.static_submission ?? "-"} • {dict.author}: {row.submitted_by_username ?? "-"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {stageLabel}
          </Typography>
          {row.is_rejected ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {dict.rejected}:{" "}
              {rejectionReasons.length ? rejectionReasons.join(" ") : text(row.rejection_cause)}
            </Typography>
          ) : null}
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button component={NextLink} href={listHref} prefetch={false}>
              {dict.backToList}
            </Button>
            {sourcePerms.canDelete ? (
              <Button color="error" variant="outlined" onClick={() => void remove()}>
                {dict.delete}
              </Button>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      {showHelperPanel ? (
        <HelperReviewPanel
          key={`${row.id}-${row.current_stage}-${row.is_rejected}`}
          dict={dict}
          stage={stage}
          onStageChange={setStage}
          rejectCause={rejectCause}
          onRejectCauseChange={setRejectCause}
          onApplyStage={() => void applyStage()}
          onReject={() => void rejectSubmission()}
        />
      ) : null}

      {showHelperPanel && row.current_stage >= 4
        ? (row.endpoints ?? [])
            .filter(
              (ep) => typeof ep.id === "number" && (ep.hide_original || ep.fetch_status != null),
            )
            .map((ep) => (
              <FeedFetchHealthPanel
                key={`health-${ep.id}`}
                locale={locale}
                dict={dict}
                kind="realtime"
                entryId={ep.id as number}
                title={`${dict.fetchHealthSection}${ep.endpoint_type ? ` · ${ep.endpoint_type}` : ""}`}
                health={ep}
                onChanged={() => void load()}
              />
            ))
        : null}

      {!sourcePerms.canHelperReviewOnly && (isOwner || user.isDjangoAdmin) ? (
        <FormSection title={dict.endpoints}>
          <Stack spacing={2}>
            <TextField
              label={dict.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={fieldsLocked}
            />
            <TextField
              label={dict.note}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={2}
            />
            <TextField
              label={dict.license}
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            />
            {endpointsDraft.map((ep, idx) => (
              <Stack
                key={ep.id ?? idx}
                spacing={1}
                sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
              >
                <TextField
                  label={dict.feedTypes}
                  value={ep.endpoint_type}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndpointsDraft((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, endpoint_type: v } : x)),
                    );
                  }}
                  disabled={fieldsLocked}
                />
                <TextField
                  label={dict.feedUrl}
                  value={ep.url}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndpointsDraft((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, url: v } : x)),
                    );
                  }}
                  disabled={fieldsLocked}
                />
                <TextField
                  label={dict.sourceUpdateInterval}
                  type="number"
                  value={ep.interval}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndpointsDraft((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? {
                              ...x,
                              interval: v,
                              hide_original: isNoSourceUpdate(v) ? false : x.hide_original,
                            }
                          : x,
                      ),
                    );
                  }}
                  disabled={fieldsLocked}
                  required
                  slotProps={{
                    htmlInput: {
                      min: SOURCE_UPDATE_INTERVAL_MIN,
                      max: SOURCE_UPDATE_INTERVAL_MAX,
                      step: 1,
                      inputMode: "numeric",
                    },
                  }}
                />
                <InlineSelect
                  fullWidth
                  label={dict.authType}
                  value={ep.auth_type}
                  onChange={(v) => {
                    setEndpointsDraft((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, auth_type: v, hide_original: hideOriginalOnAuthChange(v) }
                          : x,
                      ),
                    );
                  }}
                  options={authTypeSelectOptions}
                  disabled={fieldsLocked}
                />
                {ep.auth_type ? (
                  <PasswordTextField
                    label={dict.authValue}
                    value={ep.auth_value}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEndpointsDraft((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, auth_value: v } : x)),
                      );
                    }}
                    helperText={dict.authValueNewOnly + " - " + dict.authValueHint}
                    autoComplete="new-password"
                    disabled={fieldsLocked}
                    showPasswordLabel={dict.showPassword}
                    hidePasswordLabel={dict.hidePassword}
                  />
                ) : null}
                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={ep.is_original}
                        onChange={(e) =>
                          setEndpointsDraft((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, is_original: e.target.checked } : x,
                            ),
                          )
                        }
                        disabled={fieldsLocked}
                      />
                    }
                    label={dict.original}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={resolveHideOriginal(ep.auth_type, ep.hide_original)}
                        onChange={(e) =>
                          setEndpointsDraft((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, hide_original: e.target.checked } : x,
                            ),
                          )
                        }
                        disabled={
                          fieldsLocked ||
                          isHideOriginalLockedByAuth(ep.auth_type) ||
                          isNoSourceUpdate(ep.interval)
                        }
                      />
                    }
                    label={dict.hideOriginal}
                  />
                </Stack>
                {row.static_submission ? (
                  <Typography variant="caption" color="text.secondary">
                    {dict.downloadRealtimeHint}
                  </Typography>
                ) : null}
              </Stack>
            ))}
            {canSaveProvider && (
              <Button variant="contained" onClick={() => void saveMeta()}>
                {dict.save}
              </Button>
            )}
          </Stack>
          {row.static_submission && row.endpoints?.some((ep) => typeof ep.id === "number") ? (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {(row.endpoints ?? []).map((ep) =>
                typeof ep.id === "number" ? (
                  <Stack
                    key={ep.id}
                    direction="row"
                    spacing={2}
                    sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {text(ep.endpoint_type)}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => void downloadRt(ep.id!)}>
                      {dict.downloadRealtime}
                    </Button>
                  </Stack>
                ) : null,
              )}
            </Stack>
          ) : null}
        </FormSection>
      ) : null}

      {row.history?.length ? (
        <FormSection title={dict.historyTitle}>
          <HistoryTimeline
            events={row.history}
            title=""
            emptyLabel={dict.emptyListBody}
            locale={locale}
            dict={dict}
          />
        </FormSection>
      ) : null}
      {confirmDialog}
    </Stack>
  );
}
