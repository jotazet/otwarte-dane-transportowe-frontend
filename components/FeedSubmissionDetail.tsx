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
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { PasswordTextField } from "@/components/PasswordTextField";
import { SourceModeToggle, type SourceMode } from "@/components/layout/SourceModeToggle";
import { InlineSelect } from "@/components/InlineSelect";
import { FormActions } from "@/components/layout/FormActions";
import { FormSection } from "@/components/layout/FormSection";
import { HistoryTimeline } from "@/components/layout/HistoryTimeline";
import { StageBanner } from "@/components/layout/StageBanner";
import { useConfirm } from "@/components/layout/useConfirm";
import { HelperReviewPanel } from "@/components/submissions/HelperReviewPanel";
import {
  LinkedRealtimeSubmissions,
  type LinkedRealtimeSubmission,
} from "@/components/submissions/LinkedRealtimeSubmissions";
import {
  StaticFeedStatusPanel,
  type StaticValidationStatus,
} from "@/components/submissions/StaticFeedStatusPanel";
import { SubmissionDetailAuthGate } from "@/components/submissions/SubmissionDetailAuthGate";
import type { Dictionary } from "@/i18n/getDictionary";
import { FeedFetchHealthPanel } from "@/components/feedOps/FeedFetchHealthPanel";
import { submissionsPaths } from "@/lib/api/submissions";
import type { FetchHealthFields, SubmissionHistoryEvent } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  canViewSubmissionInContext,
  hasAdminAccess,
  hasHelperAccess,
} from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/usePermissions";
import { authTypeOptions } from "@/lib/data/authTypes";
import {
  hideOriginalOnAuthChange,
  isHideOriginalLockedByAuth,
  resolveHideOriginal,
} from "@/lib/data/hideOriginalAuth";
import { downloadBlob } from "@/lib/download";
import { fill } from "@/lib/i18n/fill";
import { formatApiError } from "@/lib/formatApiError";
import { gtfsRejectionReasons } from "@/lib/gtfsRejection";
import { submissionListPath, type SubmissionListContext } from "@/lib/nav/routes";
import { submissionStageLabel } from "@/lib/submissionStage";

type StaticEntry = FetchHealthFields & {
  id: number;
  url?: string;
  file?: string | null;
  license?: string;
  download_time_1?: string | null;
  download_time_2?: string | null;
  is_original?: boolean;
  hide_original?: boolean;
  auth_type?: string;
  validation_status?: StaticValidationStatus;
  /** For `error`, a `gtfs_validation.*` code (backend docs/api/feeds.md). */
  validation_message?: string;
};

type FeedDetail = {
  id: number;
  transport_organization: number;
  data_type: string;
  name?: string;
  note?: string;
  current_stage: number;
  is_rejected: boolean;
  rejection_cause?: string | null;
  static_entry?: StaticEntry | null;
  realtime_submissions?: LinkedRealtimeSubmission[];
  submitted_by?: number;
  submitted_by_username?: string | null;
  history?: SubmissionHistoryEvent[];
};

export function FeedSubmissionDetail({
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
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const perms = usePermissions();
  const router = useRouter();
  const [row, setRow] = React.useState<FeedDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState(0);

  const [subName, setSubName] = React.useState("");
  const [subNote, setSubNote] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [license, setLicense] = React.useState("");
  const [dt1, setDt1] = React.useState("02:00:00");
  const [dt2Enabled, setDt2Enabled] = React.useState(false);
  const [dt2, setDt2] = React.useState("");
  const [isOrig, setIsOrig] = React.useState(true);
  const [hideOrig, setHideOrig] = React.useState(false);
  const [authType, setAuthType] = React.useState("");
  const [authValue, setAuthValue] = React.useState("");
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("url");
  const [newFile, setNewFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [stage, setStage] = React.useState("");
  const [rejectCause, setRejectCause] = React.useState("");

  const listHref = submissionListPath(locale, listContext);

  const applyDetail = React.useCallback((d: FeedDetail) => {
    setRow(d);
    setSubName(d.name ?? "");
    setSubNote(d.note ?? "");
    const se = d.static_entry;
    setUrl(se?.url ?? "");
    setLicense(se?.license ?? "");
    setDt1(se?.download_time_1 ?? "02:00:00");
    const d2 = se?.download_time_2?.trim();
    setDt2Enabled(!!d2);
    setDt2(d2 ?? "14:00:00");
    setIsOrig(se?.is_original !== false);
    setHideOrig(!!se?.hide_original);
    setAuthType(se?.auth_type ?? "");
    setAuthValue("");
    setSourceMode(se?.file && !se?.url ? "file" : "url");
    setNewFile(null);
    setStage(String(d.current_stage));
    setRejectCause("");
  }, []);

  const authStatus = auth.status;
  const apiJson = auth.apiJson;

  // Reload po akcjach mutujących (komponent zamontowany — bez anulowania).
  const load = React.useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setError(null);
    try {
      const d = await apiJson<FeedDetail>("GET", submissionsPaths.feedDetail(submissionId));
      applyDetail(d);
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }, [apiJson, authStatus, submissionId, applyDetail, dict]);

  // Ładowanie początkowe / przy zmianie parametrów — z flagą `cancelled`.
  React.useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const d = await apiJson<FeedDetail>("GET", submissionsPaths.feedDetail(submissionId));
        if (!cancelled) applyDetail(d);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, dict));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiJson, authStatus, submissionId, applyDetail, dict]);

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
  const isHelper = hasHelperAccess(user);
  const isDjangoAdmin = user.isDjangoAdmin;
  const isAdmin = hasAdminAccess(user);
  // An automatic rejection (no actor) stores the GTFS validator's text, not a code.
  const latestEvent = row.history?.[0];
  const rejectionReasons = row.is_rejected
    ? gtfsRejectionReasons(
        row.rejection_cause,
        latestEvent?.event_type === "rejected" && !latestEvent.actor,
        dict,
      )
    : undefined;
  const isFileEntry = !!row.static_entry?.file && !row.static_entry?.url;

  const sourceCtx = {
    isOwner,
    currentStage: row.current_stage,
    isRejected: row.is_rejected,
    isHelper,
  };
  const sourcePerms = perms.feedSource(sourceCtx);

  const canEditMeta =
    sourcePerms.canEditFullSource ||
    sourcePerms.canEditLimitedMeta ||
    sourcePerms.canAdminSourceOnStage2Plus;

  const showHelperPanel = isHelper || isDjangoAdmin;
  const showAdminSourceTab =
    isDjangoAdmin && row.current_stage >= 2 && row.current_stage <= 4 && !row.is_rejected;

  // Only GTFS has automatic validation; for other types the status stays "pending".
  const validationStatus =
    row.data_type === "gtfs" ? (row.static_entry?.validation_status ?? null) : null;
  // Reviewers get the full FeedFetchHealthPanel above; the owner a read-only view.
  const ownerFetchHealth =
    isOwner && !showHelperPanel && row.current_stage >= 4 && row.static_entry?.fetch_status != null
      ? row.static_entry
      : null;

  const authTypeSelectOptions = authTypeOptions(dict);
  // Only an owner or Admin at stage 1 (incl. after a rejection) may switch between URL and file.
  const urlMode = sourcePerms.canEditFullSource ? sourceMode === "url" : !isFileEntry;
  const currentFileName = row.static_entry?.file?.split("/").pop() ?? "";

  function changeSourceMode(mode: SourceMode) {
    setSourceMode(mode);
    setError(null);
    // A file source cannot be proxied or carry credentials; going back to a URL
    // restores the saved settings.
    const se = row?.static_entry;
    setAuthType(mode === "file" ? "" : (se?.auth_type ?? ""));
    setAuthValue("");
    setHideOrig(mode === "file" ? false : !!se?.hide_original);
  }

  async function saveSubmissionMeta() {
    if (!row || !canEditMeta) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { note: subNote.trim() };
      if (sourcePerms.canEditFullSource || (isDjangoAdmin && tab === 1)) {
        body.name = subName.trim();
      }
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), body);
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function saveStatic() {
    if (!row) return;
    setError(null);
    if (sourcePerms.canEditFullSource) {
      if (urlMode && !url.trim()) {
        setError(dict.fieldRequired);
        return;
      }
      if (!urlMode && !isFileEntry && !newFile) {
        setError(dict.staticSourceFileRequired);
        return;
      }
    }
    setSaving(true);
    try {
      if (sourcePerms.canEditFullSource && !urlMode && newFile) {
        // A new file goes as multipart. The URL-only fields are cleared in the same
        // request, so the backend never sees a URL and a file at once.
        const form = new FormData();
        form.set("static_entry.file", newFile);
        form.set("static_entry.url", "");
        form.set("static_entry.download_time_1", "");
        form.set("static_entry.download_time_2", "");
        form.set("static_entry.hide_original", "false");
        form.set("static_entry.auth_type", "");
        form.set("static_entry.is_original", isOrig ? "true" : "false");
        form.set("static_entry.license", license.trim());
        await auth.apiForm("PATCH", submissionsPaths.feedDetail(row.id), form);
        await load();
        return;
      }
      const static_entry: Record<string, unknown> = {};
      if (
        sourcePerms.canEditLimitedMeta ||
        sourcePerms.canEditFullSource ||
        sourcePerms.canAdminSourceOnStage2Plus
      ) {
        static_entry.license = license.trim();
        // Download times apply to URL sources only; the backend refuses them for a file.
        if (urlMode && (sourcePerms.canEditLimitedMeta || sourcePerms.canEditFullSource)) {
          static_entry.download_time_1 = dt1.trim() || "02:00:00";
          static_entry.download_time_2 = dt2Enabled && dt2.trim() ? dt2.trim() : null;
        }
      }
      if (sourcePerms.canEditFullSource || sourcePerms.canAdminSourceOnStage2Plus) {
        const u = url.trim();
        if (u) static_entry.url = u;
        // Switching a file entry to a URL clears the file in the same request.
        if (u && isFileEntry && urlMode) static_entry.file = null;
        static_entry.is_original = isOrig;
        static_entry.hide_original = resolveHideOriginal(authType, hideOrig);
        if (authType) {
          static_entry.auth_type = authType;
          if (authValue.trim()) static_entry.auth_value = authValue.trim();
        } else {
          static_entry.auth_type = "";
        }
      }
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), { static_entry });
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    } finally {
      setSaving(false);
    }
  }

  async function applyStage() {
    if (!row || !showHelperPanel) return;
    setError(null);
    try {
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), { stage: Number(stage) });
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function rejectSubmission() {
    if (!row || !showHelperPanel) return;
    const rc = rejectCause.trim();
    if (!rc) return;
    setError(null);
    try {
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), { rejection_cause: rc });
      await load();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function remove() {
    if (!row || !sourcePerms.canDelete) return;
    if (!(await confirm(dict.confirmDeleteSubmission, { confirmLabel: dict.delete }))) return;
    try {
      await auth.apiJson("DELETE", submissionsPaths.feedDetail(row.id));
      router.replace(listHref);
      router.refresh();
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  async function downloadStatic() {
    if (!row?.static_entry?.id) return;
    try {
      const blob = await auth.apiBlob(
        submissionsPaths.feedDownloadStatic(row.id, row.static_entry.id),
      );
      downloadBlob(blob, `submission-${row.id}-static.zip`);
    } catch (e) {
      setError(formatApiError(e, dict));
    }
  }

  const sourceFieldsDisabled =
    !sourcePerms.canEditSource && !sourcePerms.canAdminSourceOnStage2Plus;
  const limitedOnly =
    sourcePerms.canEditLimitedMeta &&
    !sourcePerms.canEditFullSource &&
    !sourcePerms.canAdminSourceOnStage2Plus;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <StageBanner
        stage={row.current_stage}
        stageLabel={submissionStageLabel("static", row.current_stage, row.is_rejected, dict)}
        isRejected={row.is_rejected}
        rejectionCause={row.rejection_cause}
        rejectionReasons={rejectionReasons}
        rawCause={isAdmin ? row.rejection_cause : undefined}
        rejectedLabel={dict.rejected}
        fixHint={row.is_rejected ? dict.fixAndResubmit : undefined}
        dict={dict}
      />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            #{row.id} - {row.data_type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dict.organizations}: {row.transport_organization} • {dict.author}:{" "}
            {row.submitted_by_username ?? "-"}
          </Typography>
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

      {showHelperPanel &&
      row.current_stage >= 4 &&
      row.static_entry?.id != null &&
      (row.static_entry.hide_original || row.static_entry.fetch_status != null) ? (
        <FeedFetchHealthPanel
          locale={locale}
          dict={dict}
          kind="static"
          entryId={row.static_entry.id}
          title={dict.fetchHealthSection}
          health={row.static_entry}
          onChanged={() => void load()}
        />
      ) : null}

      {validationStatus || ownerFetchHealth ? (
        <StaticFeedStatusPanel
          locale={locale}
          dict={dict}
          submissionId={row.id}
          validationStatus={validationStatus}
          validationMessage={row.static_entry?.validation_message}
          fetchHealth={ownerFetchHealth}
        />
      ) : null}

      {canEditMeta ? (
        <FormSection title={dict.submissionNameAndNoteSection}>
          <Stack spacing={2}>
            <TextField
              label={dict.name}
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              fullWidth
              disabled={limitedOnly}
            />
            <TextField
              label={dict.note}
              value={subNote}
              onChange={(e) => setSubNote(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <FormActions>
              <Button variant="outlined" onClick={() => void saveSubmissionMeta()}>
                {dict.save}
              </Button>
            </FormActions>
          </Stack>
        </FormSection>
      ) : null}

      {(isOwner || isDjangoAdmin) && !sourcePerms.canHelperReviewOnly ? (
        <FormSection title={dict.staticEntrySection}>
          {showAdminSourceTab ? (
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label={dict.providerEditTab ?? dict.save} />
              <Tab label={dict.adminSourceEditTab} />
            </Tabs>
          ) : null}

          {(tab === 0 || !showAdminSourceTab) && (
            <Stack spacing={2}>
              {sourcePerms.canEditFullSource ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {dict.staticSourceResubmitHint}
                  </Typography>
                  <SourceModeToggle
                    label={dict.staticSource}
                    value={sourceMode}
                    onChange={changeSourceMode}
                    urlLabel={dict.staticSourceUrl}
                    fileLabel={dict.staticSourceFile}
                    disabled={saving}
                  />
                </>
              ) : null}
              {urlMode ? (
                <TextField
                  label={dict.feedUrl}
                  fullWidth
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={sourceFieldsDisabled || limitedOnly}
                  helperText={dict.feedUrlHint}
                />
              ) : (
                <Stack spacing={1}>
                  {isFileEntry && currentFileName ? (
                    <Typography variant="body2">
                      {fill(dict.staticCurrentFile, { name: currentFileName })}
                    </Typography>
                  ) : null}
                  {sourcePerms.canEditFullSource ? (
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      sx={{ alignItems: { sm: "center" } }}
                    >
                      <Button variant="outlined" component="label" disabled={saving}>
                        {isFileEntry ? dict.staticChooseNewFile : dict.chooseFile}
                        <input
                          type="file"
                          hidden
                          accept=".zip,application/zip"
                          onChange={(e) => setNewFile(e.currentTarget.files?.[0] ?? null)}
                        />
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        {newFile ? newFile.name : dict.noFileSelected}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              )}
              {/* Download times apply to URL sources only; the backend refuses them for a file. */}
              {urlMode ? (
                <>
                  <TextField
                    label={dict.downloadTime1Utc}
                    value={dt1}
                    onChange={(e) => setDt1(e.target.value)}
                    disabled={
                      sourceFieldsDisabled ||
                      !(sourcePerms.canEditLimitedMeta || sourcePerms.canEditFullSource)
                    }
                  />
                  {dt2Enabled ? (
                    <>
                      <TextField
                        label={dict.downloadTime2UtcOptional}
                        value={dt2}
                        onChange={(e) => setDt2(e.target.value)}
                        disabled={
                          sourceFieldsDisabled ||
                          !(sourcePerms.canEditLimitedMeta || sourcePerms.canEditFullSource)
                        }
                      />
                      <Button
                        type="button"
                        variant="text"
                        onClick={() => {
                          setDt2Enabled(false);
                          setDt2("");
                        }}
                        disabled={sourceFieldsDisabled || limitedOnly}
                        sx={{ alignSelf: "flex-start", textTransform: "none" }}
                      >
                        {dict.removeSecondDownloadTime}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => setDt2Enabled(true)}
                      disabled={sourceFieldsDisabled || limitedOnly}
                      sx={{ alignSelf: "flex-start", textTransform: "none" }}
                    >
                      {dict.addSecondDownloadTime}
                    </Button>
                  )}
                </>
              ) : null}
              <TextField
                label={dict.license}
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                fullWidth
                disabled={sourceFieldsDisabled && !limitedOnly}
              />
              {urlMode ? (
                <InlineSelect
                  fullWidth
                  label={dict.authType}
                  value={authType}
                  onChange={(v) => {
                    setAuthType(v);
                    setHideOrig(hideOriginalOnAuthChange(v));
                  }}
                  options={authTypeSelectOptions}
                  disabled={sourceFieldsDisabled || limitedOnly}
                />
              ) : null}
              {urlMode && authType ? (
                <PasswordTextField
                  label={dict.authValue}
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  helperText={dict.authValueEditHint}
                  autoComplete="new-password"
                  fullWidth
                  disabled={sourceFieldsDisabled || limitedOnly}
                  showPasswordLabel={dict.showPassword}
                  hidePasswordLabel={dict.hidePassword}
                />
              ) : null}
              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOrig}
                      onChange={(e) => setIsOrig(e.target.checked)}
                      disabled={sourceFieldsDisabled || limitedOnly}
                    />
                  }
                  label={dict.original}
                />
                {urlMode ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={resolveHideOriginal(authType, hideOrig)}
                        onChange={(e) => setHideOrig(e.target.checked)}
                        disabled={
                          sourceFieldsDisabled ||
                          limitedOnly ||
                          isHideOriginalLockedByAuth(authType)
                        }
                      />
                    }
                    label={dict.hideOriginal}
                  />
                ) : null}
              </Stack>
              {(sourcePerms.canEditSource ||
                sourcePerms.canEditLimitedMeta ||
                sourcePerms.canAdminSourceOnStage2Plus) && (
                <FormActions>
                  <Button variant="contained" disabled={saving} onClick={() => void saveStatic()}>
                    {dict.save}
                  </Button>
                  {row.static_entry?.id ? (
                    <Button variant="outlined" onClick={() => void downloadStatic()}>
                      {dict.downloadStatic}
                    </Button>
                  ) : null}
                </FormActions>
              )}
            </Stack>
          )}

          {showAdminSourceTab && tab === 1 && (
            <Stack spacing={2}>
              <Alert severity="info">{dict.adminSourceEditHint ?? dict.reviewSubmission}</Alert>
              <TextField
                label={dict.feedUrl}
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <InlineSelect
                fullWidth
                label={dict.authType}
                value={authType}
                onChange={(v) => {
                  setAuthType(v);
                  setHideOrig(hideOriginalOnAuthChange(v));
                }}
                options={authTypeSelectOptions}
              />
              {authType ? (
                <PasswordTextField
                  label={dict.authValue}
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  helperText={dict.authValueNewOnly}
                  fullWidth
                  showPasswordLabel={dict.showPassword}
                  hidePasswordLabel={dict.hidePassword}
                />
              ) : null}
              <FormActions>
                <Button variant="contained" onClick={() => void saveStatic()}>
                  {dict.save}
                </Button>
              </FormActions>
            </Stack>
          )}
        </FormSection>
      ) : null}

      {row.realtime_submissions?.length ? (
        <LinkedRealtimeSubmissions
          locale={locale}
          dict={dict}
          listContext={listContext}
          items={row.realtime_submissions}
        />
      ) : null}

      {row.history?.length ? (
        <FormSection title={dict.historyTitle}>
          <HistoryTimeline
            events={row.history}
            locale={locale}
            automaticCauseReasons={(cause) => gtfsRejectionReasons(cause, true, dict) ?? []}
            showRawCause={isAdmin}
            dict={dict}
          />
        </FormSection>
      ) : null}
      {confirmDialog}
    </Stack>
  );
}
