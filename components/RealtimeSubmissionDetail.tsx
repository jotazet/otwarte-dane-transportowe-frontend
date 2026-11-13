"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { InlineSelect } from "@/components/InlineSelect";
import { FormSection } from "@/components/layout/FormSection";
import { HistoryTimeline, type HistoryTimelineEvent } from "@/components/layout/HistoryTimeline";
import { StageBanner } from "@/components/layout/StageBanner";
import { useConfirm } from "@/components/layout/useConfirm";
import { HelperReviewPanel } from "@/components/submissions/HelperReviewPanel";
import { RealtimeEndpointsEditor } from "@/components/submissions/RealtimeEndpointsEditor";
import {
  RealtimeStaticSubmissionSelect,
  useEligibleStatics,
} from "@/components/submissions/RealtimeStaticSubmissionSelect";
import { SubmissionDetailAuthGate } from "@/components/submissions/SubmissionDetailAuthGate";
import { FeedFetchHealthPanel } from "@/components/feedOps/FeedFetchHealthPanel";
import { submissionsPaths } from "@/lib/api/submissions";
import type { FetchHealthFields, RejectionReason } from "@/lib/api/types";
import { downloadBlob } from "@/lib/download";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasHelperAccess, canViewSubmissionInContext } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/usePermissions";
import { submissionListPath, type SubmissionListContext } from "@/lib/nav/routes";
import { SOURCE_UPDATE_INTERVAL_DEFAULT } from "@/lib/data/intervalChoices";
import {
  endpointPayload,
  endpointsForProtocol,
  isRealtimeProtocol,
  nextEndpointUid,
  parseEndpointInterval,
  REALTIME_PROTOCOLS,
  requiresStaticSubmission,
  type RealtimeProtocol,
  type RtEndpointDraft,
} from "@/lib/data/realtimeEndpoints";
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

function endpointDrafts(d: RtDetail): RtEndpointDraft[] {
  return (d.endpoints ?? []).map((ep) => ({
    uid: nextEndpointUid(),
    endpoint_type: ep.endpoint_type ?? "",
    url: ep.url ?? "",
    interval: String(ep.interval ?? SOURCE_UPDATE_INTERVAL_DEFAULT),
    storedInterval: ep.interval ?? undefined,
    is_original: ep.is_original !== false,
    hide_original: !!ep.hide_original,
    auth_type: ep.auth_type ?? "",
    auth_value: "",
  }));
}

/** Compares endpoints as the API would receive them. */
function sameEndpoints(a: RtEndpointDraft[], b: RtEndpointDraft[]): boolean {
  return JSON.stringify(a.map(endpointPayload)) === JSON.stringify(b.map(endpointPayload));
}

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
  const [protocol, setProtocol] = React.useState<RealtimeProtocol>("gtfs_rt");
  const [staticSubId, setStaticSubId] = React.useState<number | "">("");
  const [endpointsDraft, setEndpointsDraft] = React.useState<RtEndpointDraft[]>([]);
  // The endpoints as loaded, to send `endpoints` only when one changed: the backend
  // recreates them on every write, which loses their fetch history.
  const [savedEndpoints, setSavedEndpoints] = React.useState<RtEndpointDraft[]>([]);

  const applyDetail = React.useCallback((d: RtDetail) => {
    setRow(d);
    setStage(String(d.current_stage));
    setRejectCause("");
    setName(d.name ?? "");
    setNote(d.note ?? "");
    setLicense(d.license ?? "");
    setProtocol(isRealtimeProtocol(d.protocol) ? d.protocol : "gtfs_rt");
    setStaticSubId(d.static_submission ?? "");
    const drafts = endpointDrafts(d);
    setEndpointsDraft(drafts);
    setSavedEndpoints(drafts);
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

  const user = perms.user;
  const isOwner =
    user?.userId != null && row?.submitted_by != null && user.userId === row.submitted_by;
  const sourcePerms =
    row && user
      ? perms.feedSource({
          isOwner,
          currentStage: row.current_stage,
          isRejected: row.is_rejected,
          isHelper: hasHelperAccess(user),
        })
      : null;
  // Stage 1 and after a rejection: the backend accepts a new protocol, static
  // submission and set of endpoints.
  const canEditStructure = sourcePerms?.canEditFullSource ?? false;
  const eligible = useEligibleStatics(
    canEditStructure && row ? row.transport_organization : null,
    protocol,
    dict,
  );

  function changeProtocol(value: string) {
    if (!row || !isRealtimeProtocol(value)) return;
    setProtocol(value);
    setStaticSubId(value === row.protocol ? (row.static_submission ?? "") : "");
    setEndpointsDraft((rows) => endpointsForProtocol(rows, value));
  }

  async function saveMeta() {
    if (!row || !sourcePerms || sourcePerms.canHelperReviewOnly) return;
    setError(null);
    if (endpointsDraft.some((ep) => parseEndpointInterval(ep) === null)) {
      setError(dict.sourceUpdateIntervalRange);
      return;
    }
    if (canEditStructure && requiresStaticSubmission(protocol) && staticSubId === "") {
      setError(dict.fieldRequired);
      return;
    }
    const endpointsChanged = !sameEndpoints(endpointsDraft, savedEndpoints);
    try {
      const body: Record<string, unknown> = {
        note: note.trim(),
        license: license.trim(),
      };
      if (sourcePerms.canEditFullSource || sourcePerms.canAdminSourceOnStage2Plus) {
        body.name = name.trim();
        if (canEditStructure) {
          if (protocol !== row.protocol) body.protocol = protocol;
          const staticId = staticSubId === "" ? null : staticSubId;
          if (staticId !== (row.static_submission ?? null)) body.static_submission = staticId;
        }
        if (endpointsChanged) body.endpoints = endpointsDraft.map(endpointPayload);
      } else if (sourcePerms.canEditLimitedMeta) {
        // Only intervals can change here; the backend fills in the other fields.
        if (endpointsChanged) {
          body.endpoints = endpointsDraft.map((e) => ({
            endpoint_type: e.endpoint_type,
            interval: parseEndpointInterval(e),
          }));
        }
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

  if (auth.status !== "authenticated" || !row || !user || !sourcePerms) {
    return (
      <SubmissionDetailAuthGate locale={locale} dict={dict} error={error} hasData={!!row}>
        <></>
      </SubmissionDetailAuthGate>
    );
  }

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
            {dict.realtimeSubmissionCardTitle
              .replace("{id}", String(row.id))
              .replace("{protocol}", row.protocol)}
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
            {canEditStructure ? (
              <>
                <InlineSelect
                  fullWidth
                  label={dict.protocol}
                  value={protocol}
                  onChange={changeProtocol}
                  options={REALTIME_PROTOCOLS.map((p) => ({ value: p, label: p }))}
                />
                {requiresStaticSubmission(protocol) ? (
                  <RealtimeStaticSubmissionSelect
                    dict={dict}
                    {...eligible}
                    value={staticSubId}
                    onChange={setStaticSubId}
                    currentId={protocol === row.protocol ? (row.static_submission ?? null) : null}
                  />
                ) : null}
              </>
            ) : null}
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
            <RealtimeEndpointsEditor
              dict={dict}
              protocol={protocol}
              endpoints={endpointsDraft}
              onChange={setEndpointsDraft}
              authValueHint={dict.authValueEditHint}
              canAddRemove={canEditStructure}
              sourceLocked={fieldsLocked}
            />
            {canSaveProvider && (
              <Button variant="contained" onClick={() => void saveMeta()}>
                {dict.save}
              </Button>
            )}
          </Stack>
          {row.static_submission && row.endpoints?.some((ep) => typeof ep.id === "number") ? (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {dict.downloadRealtimeHint}
              </Typography>
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
          <HistoryTimeline events={row.history} locale={locale} dict={dict} />
        </FormSection>
      ) : null}
      {confirmDialog}
    </Stack>
  );
}
