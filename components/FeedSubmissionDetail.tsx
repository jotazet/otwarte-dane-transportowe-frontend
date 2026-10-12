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
import { InlineSelect } from "@/components/InlineSelect";
import { FormActions } from "@/components/layout/FormActions";
import { FormSection } from "@/components/layout/FormSection";
import { HistoryTimeline } from "@/components/layout/HistoryTimeline";
import { StageBanner } from "@/components/layout/StageBanner";
import { useConfirm } from "@/components/layout/useConfirm";
import { HelperReviewPanel } from "@/components/submissions/HelperReviewPanel";
import { SubmissionDetailAuthGate } from "@/components/submissions/SubmissionDetailAuthGate";
import type { Dictionary } from "@/i18n/getDictionary";
import { FeedFetchHealthPanel } from "@/components/feedOps/FeedFetchHealthPanel";
import { submissionsPaths } from "@/lib/api/submissions";
import type { FetchHealthFields, SubmissionHistoryEvent } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasHelperAccess, canViewSubmissionInContext } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/usePermissions";
import { authTypeOptions } from "@/lib/data/authTypes";
import {
  hideOriginalOnAuthChange,
  isHideOriginalLockedByAuth,
  resolveHideOriginal,
} from "@/lib/data/hideOriginalAuth";
import { downloadBlob } from "@/lib/download";
import { formatApiError } from "@/lib/formatApiError";
import { submissionListPath, type SubmissionListContext } from "@/lib/nav/routes";

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
};

type FeedDetail = {
  id: number;
  transport_organization: number;
  data_type: string;
  name?: string;
  note?: string;
  current_stage: number;
  current_stage_label: string;
  is_rejected: boolean;
  rejection_cause?: string | null;
  static_entry?: StaticEntry | null;
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
      setError(formatApiError(e));
    }
  }, [apiJson, authStatus, submissionId, applyDetail]);

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
        if (!cancelled) setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiJson, authStatus, submissionId, applyDetail]);

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
  const isFileEntry = !!row.static_entry?.file && !row.static_entry?.url;

  const sourceCtx = {
    isOwner,
    currentStage: row.current_stage,
    isRejected: row.is_rejected,
    isHelper,
  };
  const sourcePerms = perms.feedSource(sourceCtx);

  const canEditMeta =
    (isOwner && (sourcePerms.canEditFullSource || sourcePerms.canEditLimitedMeta)) ||
    (isDjangoAdmin &&
      (sourcePerms.canEditFullSource ||
        sourcePerms.canAdminSourceOnStage2Plus ||
        sourcePerms.canEditLimitedMeta));

  const showHelperPanel = isHelper || isDjangoAdmin;
  const showAdminSourceTab =
    isDjangoAdmin && row.current_stage >= 2 && row.current_stage <= 4 && !row.is_rejected;

  const authTypeSelectOptions = authTypeOptions(dict);

  async function saveSubmissionMeta() {
    if (!row || !canEditMeta) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { note: subNote.trim() || "" };
      if (sourcePerms.canEditFullSource || (isDjangoAdmin && tab === 1)) {
        body.name = subName.trim() || "";
      }
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), body);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function saveStatic() {
    if (!row) return;
    setError(null);
    try {
      const static_entry: Record<string, unknown> = {};
      if (
        sourcePerms.canEditLimitedMeta ||
        sourcePerms.canEditFullSource ||
        sourcePerms.canAdminSourceOnStage2Plus
      ) {
        static_entry.license = license.trim() || "";
        // Godziny pobierania dotyczą tylko feedów z URL — backend odrzuca je dla wpisów plikowych.
        if (!isFileEntry && (sourcePerms.canEditLimitedMeta || sourcePerms.canEditFullSource)) {
          static_entry.download_time_1 = dt1.trim() || "02:00:00";
          static_entry.download_time_2 = dt2Enabled && dt2.trim() ? dt2.trim() : null;
        }
      }
      if (sourcePerms.canEditFullSource || sourcePerms.canAdminSourceOnStage2Plus) {
        const u = url.trim();
        if (u) static_entry.url = u;
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
      setError(formatApiError(e));
    }
  }

  async function applyStage() {
    if (!row || !showHelperPanel) return;
    setError(null);
    try {
      await auth.apiJson("PATCH", submissionsPaths.feedDetail(row.id), { stage: Number(stage) });
      await load();
    } catch (e) {
      setError(formatApiError(e));
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
      setError(formatApiError(e));
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
      setError(formatApiError(e));
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
      setError(formatApiError(e));
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
        stageLabel={row.current_stage_label}
        isRejected={row.is_rejected}
        rejectionCause={row.rejection_cause}
        rejectedLabel={dict.rejected}
        fixHint={row.is_rejected ? dict.fixAndResubmit : undefined}
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

      {canEditMeta ? (
        <FormSection title={`${dict.name} / ${dict.note}`}>
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
              <Tab label={dict.adminSourceEditTab ?? "Edycja administracyjna"} />
            </Tabs>
          ) : null}

          {(tab === 0 || !showAdminSourceTab) && (
            <Stack spacing={2}>
              <TextField
                label={dict.feedUrl}
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={sourceFieldsDisabled || limitedOnly}
                helperText={dict.feedUrlHint}
              />
              {/* Godziny pobierania dotyczą tylko feedów z URL — dla wpisów plikowych backend ich zabrania. */}
              {!isFileEntry ? (
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
              {authType ? (
                <PasswordTextField
                  label={dict.authValue}
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  helperText={`${dict.authValueNewOnly} - ${dict.authValueHint}`}
                  autoComplete="new-password"
                  fullWidth
                  disabled={sourceFieldsDisabled || limitedOnly}
                  showPasswordLabel={dict.showPassword}
                  hidePasswordLabel={dict.hidePassword}
                />
              ) : null}
              <Stack direction="row" spacing={2}>
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={resolveHideOriginal(authType, hideOrig)}
                      onChange={(e) => setHideOrig(e.target.checked)}
                      disabled={
                        sourceFieldsDisabled || limitedOnly || isHideOriginalLockedByAuth(authType)
                      }
                    />
                  }
                  label={dict.hideOriginal}
                />
              </Stack>
              {(sourcePerms.canEditSource ||
                sourcePerms.canEditLimitedMeta ||
                sourcePerms.canAdminSourceOnStage2Plus) && (
                <FormActions>
                  <Button variant="contained" onClick={() => void saveStatic()}>
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

      {row.history?.length ? (
        <FormSection title={dict.historyTitle ?? "Historia"}>
          <HistoryTimeline
            events={row.history}
            title=""
            emptyLabel={dict.emptyListBody}
            locale={locale}
          />
        </FormSection>
      ) : null}
      {confirmDialog}
    </Stack>
  );
}
