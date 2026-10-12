"use client";

import * as React from "react";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { MdAdd, MdDelete } from "react-icons/md";

import { AccessGate } from "@/components/AccessGate";
import { InlineSelect } from "@/components/InlineSelect";
import { SourceModeToggle } from "@/components/layout/SourceModeToggle";
import { PasswordTextField } from "@/components/PasswordTextField";
import { getJson } from "@/lib/api/http";
import type { TransportOrganizationListItem } from "@/lib/api/cases";
import type { Dictionary } from "@/i18n/getDictionary";
import { submissionDetailPath } from "@/lib/nav/routes";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  hideOriginalOnAuthChange,
  isHideOriginalLockedByAuth,
  resolveHideOriginal,
} from "@/lib/data/hideOriginalAuth";
import {
  isNoSourceUpdate,
  parseSourceUpdateInterval,
  SOURCE_UPDATE_INTERVAL_DEFAULT,
  SOURCE_UPDATE_INTERVAL_MAX,
  SOURCE_UPDATE_INTERVAL_MIN,
} from "@/lib/data/intervalChoices";
import { text } from "@/lib/format";

import { fetchAllPages } from "@/lib/api/types";

type EligibleStaticRow = {
  id: number;
  transport_organization: number;
  data_type: string;
  name?: string;
  allowed_realtime_protocols?: string[];
};

type RtEndpointDraft = {
  uid: string;
  endpoint_type: string;
  url: string;
  interval: string;
  is_original: boolean;
  hide_original: boolean;
  auth_type: string;
  auth_value: string;
};

let endpointUidSeq = 0;
/** Stabilny klucz React dla usuwalnych wierszy endpointów (nie używać indeksu tablicy). */
function nextEndpointUid(): string {
  endpointUidSeq += 1;
  return `ep-${endpointUidSeq}`;
}

const DATA_TYPES = ["gtfs", "netex", "other"] as const;
const PROTOCOLS = ["gtfs_rt", "siri", "gbfs"] as const;
import { authTypeOptions } from "@/lib/data/authTypes";
type DataTypeChoice = (typeof DATA_TYPES)[number];
type ProtocolChoice = (typeof PROTOCOLS)[number];
type OrgSelect = number | "";
const ENDPOINT_TYPES_GTFS_RT = ["trip_update", "vehicle_position", "service_alert"] as const;
const ENDPOINT_TYPES_SIRI = ["sx", "sm", "vm", "et", "gm"] as const;
const ENDPOINT_TYPES_GBFS = [
  "gbfs",
  "gbfs_versions",
  "system_information",
  "vehicle_types",
  "station_information",
  "station_status",
  "free_bike_status",
  "system_hours",
  "system_alerts",
] as const;

function emptyEndpoint(protocol: ProtocolChoice): RtEndpointDraft {
  const options =
    protocol === "gtfs_rt"
      ? ENDPOINT_TYPES_GTFS_RT
      : protocol === "siri"
        ? ENDPOINT_TYPES_SIRI
        : ENDPOINT_TYPES_GBFS;
  return {
    uid: nextEndpointUid(),
    endpoint_type: String(options[0]),
    url: "",
    interval: String(SOURCE_UPDATE_INTERVAL_DEFAULT),
    is_original: true,
    hide_original: false,
    auth_type: "",
    auth_value: "",
  };
}

export function DataSubmitForm({
  locale,
  dict,
  initialOrganizationId,
  redirectContext = "my",
}: {
  locale: string;
  dict: Dictionary;
  initialOrganizationId?: number;
  redirectContext?: "my" | "queue";
}) {
  const auth = useAuth();
  const { apiJson, apiForm } = auth;
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  const [orgs, setOrgs] = React.useState<TransportOrganizationListItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPages<TransportOrganizationListItem>(
          (path) => getJson(path),
          "/api/cases/transport-organizations/",
        );
        if (!cancelled) setOrgs(list);
      } catch {
        if (!cancelled) setOrgs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [staticOrgId, setStaticOrgId] = React.useState<OrgSelect>("");
  const [dataType, setDataType] = React.useState<DataTypeChoice>("gtfs");
  const [staticName, setStaticName] = React.useState("");
  const [staticNote, setStaticNote] = React.useState("");
  const [staticSource, setStaticSource] = React.useState<"url" | "file">("url");
  const [staticUrl, setStaticUrl] = React.useState("");
  const [staticFile, setStaticFile] = React.useState<File | null>(null);
  const [staticOriginal, setStaticOriginal] = React.useState(true);
  const [staticHide, setStaticHide] = React.useState(false);
  const [staticLicense, setStaticLicense] = React.useState("");
  const [staticTime1, setStaticTime1] = React.useState("02:00:00");
  const [staticTime2Enabled, setStaticTime2Enabled] = React.useState(false);
  const [staticTime2, setStaticTime2] = React.useState("14:00:00");
  const [staticAuthType, setStaticAuthType] = React.useState<string>("");
  const [staticAuthValue, setStaticAuthValue] = React.useState("");

  const [rtOrgId, setRtOrgId] = React.useState<OrgSelect>(
    typeof initialOrganizationId === "number" && Number.isFinite(initialOrganizationId)
      ? initialOrganizationId
      : "",
  );
  const [rtStaticSubId, setRtStaticSubId] = React.useState<number | "">("");
  const [eligibleStatics, setEligibleStatics] = React.useState<EligibleStaticRow[]>([]);
  const [eligibleLoading, setEligibleLoading] = React.useState(false);
  const [eligibleError, setEligibleError] = React.useState<string | null>(null);
  const [protocol, setProtocol] = React.useState<ProtocolChoice>("gtfs_rt");
  const [rtName, setRtName] = React.useState("");
  const [rtNote, setRtNote] = React.useState("");
  const [rtLicense, setRtLicense] = React.useState("");
  const [rtEndpoints, setRtEndpoints] = React.useState<RtEndpointDraft[]>([
    emptyEndpoint("gtfs_rt"),
  ]);

  React.useEffect(() => {
    if (staticSource !== "file") return;
    void (async () => {
      setStaticHide(false);
      setStaticTime2Enabled(false);
      setStaticAuthType("");
      setStaticAuthValue("");
    })();
  }, [staticSource]);

  React.useEffect(() => {
    const options =
      protocol === "gtfs_rt"
        ? ENDPOINT_TYPES_GTFS_RT
        : protocol === "siri"
          ? ENDPOINT_TYPES_SIRI
          : ENDPOINT_TYPES_GBFS;
    const defaultEndpointType = String(options[0]);
    const isValidEndpointType = (value: string) => options.includes(value as never);

    void (async () => {
      if (protocol === "gbfs") {
        setRtEndpoints([emptyEndpoint("gbfs")]);
        setRtStaticSubId("");
      } else {
        setRtEndpoints((prev) =>
          prev.length
            ? prev.map((e) => ({
                ...e,
                endpoint_type: isValidEndpointType(e.endpoint_type)
                  ? e.endpoint_type
                  : defaultEndpointType,
              }))
            : [emptyEndpoint(protocol)],
        );
      }
    })();
  }, [protocol]);

  React.useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;

    void (async () => {
      if (protocol === "gbfs" || rtOrgId === "") {
        setEligibleStatics([]);
        setEligibleError(null);
        setEligibleLoading(false);
        setRtStaticSubId("");
        return;
      }

      const suffix = protocol === "gtfs_rt" ? "gtfs" : "netex";
      setEligibleLoading(true);
      setEligibleError(null);
      setRtStaticSubId("");
      try {
        const path = `/api/data_manager/realtime-submissions/eligible-static-submissions/${rtOrgId}/${suffix}/`;
        const list = await fetchAllPages<EligibleStaticRow>((p) => apiJson("GET", p), path);
        if (!cancelled) {
          setEligibleStatics(list);
          if (list.length === 1) setRtStaticSubId(list[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setEligibleStatics([]);
          setEligibleError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setEligibleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiJson, auth.status, auth.user?.roles, protocol, rtOrgId]);

  const orgNameById = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const o of orgs) {
      const label = `${text(o.transport_organization)} - ${text(o.region)}`;
      m.set(o.id, label);
    }
    return m;
  }, [orgs]);

  const endpointTypeOptions =
    protocol === "gtfs_rt"
      ? ENDPOINT_TYPES_GTFS_RT
      : protocol === "siri"
        ? ENDPOINT_TYPES_SIRI
        : ENDPOINT_TYPES_GBFS;

  const authTypeSelectOptions = authTypeOptions(dict);

  function appendStaticAuthToForm(form: FormData) {
    if (staticAuthType) {
      form.set("static_entry.auth_type", staticAuthType);
      if (staticAuthValue.trim()) form.set("static_entry.auth_value", staticAuthValue.trim());
    }
  }

  function staticAuthPayload(): Record<string, unknown> {
    if (!staticAuthType) return { auth_type: "" };
    const o: Record<string, unknown> = { auth_type: staticAuthType };
    if (staticAuthValue.trim()) o.auth_value = staticAuthValue.trim();
    return o;
  }

  function endpointPayload(ep: RtEndpointDraft): Record<string, unknown> {
    const o: Record<string, unknown> = {
      endpoint_type: ep.endpoint_type,
      url: ep.url.trim(),
      interval: parseSourceUpdateInterval(ep.interval) ?? SOURCE_UPDATE_INTERVAL_DEFAULT,
      is_original: ep.is_original,
      hide_original: resolveHideOriginal(ep.auth_type, ep.hide_original),
    };
    if (ep.auth_type) {
      o.auth_type = ep.auth_type;
      if (ep.auth_value.trim()) o.auth_value = ep.auth_value.trim();
    } else {
      o.auth_type = "";
    }
    return o;
  }

  async function submitStatic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (staticOrgId === "") {
      setError(dict.fieldRequired);
      return;
    }
    setPending(true);
    try {
      if (staticSource === "file" && !staticFile) {
        setError(dict.fieldRequired);
        setPending(false);
        return;
      }
      if (staticSource === "file" && !staticName.trim()) {
        setError(dict.nameRequiredForUpload);
        setPending(false);
        return;
      }
      if (staticSource === "url" && !staticUrl.trim()) {
        setError(dict.fieldRequired);
        setPending(false);
        return;
      }

      const dt1 = staticTime1.trim() || "02:00:00";
      const dt2 = staticTime2Enabled ? staticTime2.trim() : "";

      let created: { id: number };
      if (staticSource === "url") {
        const static_entry: Record<string, unknown> = {
          url: staticUrl.trim(),
          is_original: staticOriginal,
          hide_original: resolveHideOriginal(staticAuthType, staticHide),
          license: staticLicense.trim() || "",
          download_time_1: dt1,
          ...(dt2 ? { download_time_2: dt2 } : {}),
          ...staticAuthPayload(),
        };
        const body: Record<string, unknown> = {
          transport_organization: staticOrgId,
          data_type: dataType,
          name: staticName.trim() || "",
          note: staticNote.trim() || "",
          static_entry,
        };
        created = await apiJson<{ id: number }>(
          "POST",
          "/api/data_manager/feed-submissions/",
          body,
        );
      } else {
        const form = new FormData();
        form.set("transport_organization", String(staticOrgId));
        form.set("data_type", dataType);
        form.set("name", staticName.trim());
        if (staticNote.trim()) form.set("note", staticNote.trim());
        form.set("static_entry.is_original", staticOriginal ? "true" : "false");
        form.set("static_entry.hide_original", "false");
        if (staticLicense.trim()) form.set("static_entry.license", staticLicense.trim());
        form.set("static_entry.file", staticFile!);

        created = await apiForm<{ id: number }>(
          "POST",
          "/api/data_manager/feed-submissions/",
          form,
        );
      }
      router.push(submissionDetailPath(locale, redirectContext, "feed", created.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  async function submitRealtime(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rtOrgId === "") {
      setError(dict.fieldRequired);
      return;
    }
    if ((protocol === "gtfs_rt" || protocol === "siri") && rtStaticSubId === "") {
      setError(dict.fieldRequired);
      return;
    }
    if (rtEndpoints.some((ep) => parseSourceUpdateInterval(ep.interval) === null)) {
      setError(dict.sourceUpdateIntervalRange);
      return;
    }
    setPending(true);
    try {
      const staticId = protocol === "gbfs" || rtStaticSubId === "" ? null : rtStaticSubId;

      const body: Record<string, unknown> = {
        transport_organization: rtOrgId,
        protocol,
        name: rtName.trim() || "",
        note: rtNote.trim() || "",
        license: rtLicense.trim() || "",
        endpoints: rtEndpoints.map((ep) => endpointPayload(ep)),
      };
      if (protocol !== "gbfs" && staticId !== null && Number.isFinite(staticId)) {
        body.static_submission = staticId;
      }
      const created = await apiJson<{ id: number }>(
        "POST",
        "/api/data_manager/realtime-submissions/",
        body,
      );
      router.push(submissionDetailPath(locale, redirectContext, "realtime", created.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  if (auth.status === "loading") {
    return <LoadingBlock label={dict.loading} />;
  }

  return (
    <AccessGate
      roles={["DataProvider"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label={dict.tabStaticSubmission} />
            <Tab label={dict.tabRealtimeSubmission} />
          </Tabs>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {tab === 0 ? (
            <Box component="form" onSubmit={submitStatic}>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {dict.staticSubmissionHint}
                </Typography>
                <InlineSelect
                  fullWidth
                  required
                  disabled={pending}
                  label={dict.organizations}
                  value={staticOrgId === "" ? "" : String(staticOrgId)}
                  onChange={(v) => {
                    setStaticOrgId(v === "" ? "" : Number(v));
                  }}
                  options={[
                    { value: "", label: "" },
                    ...orgs.map((o) => ({
                      value: String(o.id),
                      label: `${text(o.transport_organization)} - ${text(o.region)}`,
                    })),
                  ]}
                />
                <InlineSelect
                  fullWidth
                  disabled={pending}
                  label={dict.dataType}
                  value={dataType}
                  onChange={(v) => setDataType(v as DataTypeChoice)}
                  options={DATA_TYPES.map((t) => ({ value: t, label: t }))}
                />
                <TextField
                  label={dict.name}
                  value={staticName}
                  onChange={(e) => setStaticName(e.target.value)}
                  disabled={pending}
                  required={staticSource === "file"}
                />
                <TextField
                  label={dict.note}
                  value={staticNote}
                  onChange={(e) => setStaticNote(e.target.value)}
                  disabled={pending}
                  multiline
                  minRows={2}
                />

                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">{dict.staticSource}</Typography>
                  <SourceModeToggle
                    value={staticSource}
                    onChange={(v) => {
                      setStaticSource(v);
                      setError(null);
                    }}
                    urlLabel={dict.staticSourceUrl}
                    fileLabel={dict.staticSourceFile}
                    disabled={pending}
                  />
                </Stack>

                {staticSource === "url" ? (
                  <TextField
                    label={dict.feedUrl}
                    value={staticUrl}
                    onChange={(e) => setStaticUrl(e.target.value)}
                    disabled={pending}
                    helperText={dict.feedUrlHint}
                    required
                  />
                ) : (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ alignItems: { sm: "center" } }}
                  >
                    <Button variant="outlined" component="label" disabled={pending}>
                      {dict.chooseFile}
                      <input
                        type="file"
                        hidden
                        accept=".zip,application/zip"
                        onChange={(e) => {
                          const f = e.currentTarget.files?.[0] ?? null;
                          setStaticFile(f);
                        }}
                      />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {staticFile ? staticFile.name : dict.noFileSelected}
                    </Typography>
                  </Stack>
                )}

                {staticSource === "url" ? (
                  <>
                    <InlineSelect
                      fullWidth
                      disabled={pending}
                      label={dict.authType}
                      value={staticAuthType}
                      onChange={(v) => {
                        setStaticAuthType(v);
                        setStaticHide(hideOriginalOnAuthChange(v));
                      }}
                      options={authTypeSelectOptions}
                    />
                    {staticAuthType ? (
                      <PasswordTextField
                        label={dict.authValue}
                        value={staticAuthValue}
                        onChange={(e) => setStaticAuthValue(e.target.value)}
                        disabled={pending}
                        helperText={dict.authValueHint}
                        autoComplete="new-password"
                        showPasswordLabel={dict.showPassword}
                        hidePasswordLabel={dict.hidePassword}
                      />
                    ) : null}
                  </>
                ) : null}

                {staticSource === "url" ? (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label={dict.downloadTime1Utc}
                        value={staticTime1}
                        onChange={(e) => setStaticTime1(e.target.value)}
                        disabled={pending}
                        required
                      />
                      {staticTime2Enabled ? (
                        <TextField
                          label={dict.downloadTime2UtcOptional}
                          value={staticTime2}
                          onChange={(e) => setStaticTime2(e.target.value)}
                          disabled={pending}
                        />
                      ) : (
                        <Button
                          type="button"
                          variant="text"
                          disabled={pending}
                          onClick={() => setStaticTime2Enabled(true)}
                          sx={{ alignSelf: { sm: "center" }, textTransform: "none" }}
                        >
                          {dict.addSecondDownloadTime}
                        </Button>
                      )}
                      <TextField
                        label={dict.license}
                        value={staticLicense}
                        onChange={(e) => setStaticLicense(e.target.value)}
                        disabled={pending}
                        fullWidth
                      />
                    </Stack>
                    {staticTime2Enabled ? (
                      <Button
                        type="button"
                        variant="text"
                        disabled={pending}
                        onClick={() => setStaticTime2Enabled(false)}
                        sx={{ textTransform: "none", alignSelf: "flex-start" }}
                      >
                        {dict.removeSecondDownloadTime}
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <TextField
                    label={dict.license}
                    value={staticLicense}
                    onChange={(e) => setStaticLicense(e.target.value)}
                    disabled={pending}
                    fullWidth
                  />
                )}
                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={staticOriginal}
                        onChange={(e) => setStaticOriginal(e.target.checked)}
                        disabled={pending}
                      />
                    }
                    label={dict.original}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={resolveHideOriginal(staticAuthType, staticHide)}
                        onChange={(e) => setStaticHide(e.target.checked)}
                        disabled={
                          pending ||
                          isHideOriginalLockedByAuth(staticAuthType) ||
                          staticSource === "file"
                        }
                      />
                    }
                    label={dict.hideOriginal}
                  />
                </Stack>
                <Button type="submit" variant="contained" disabled={pending}>
                  {dict.submit}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={submitRealtime}>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {dict.realtimeSubmissionHint}
                </Typography>
                <InlineSelect
                  fullWidth
                  required
                  disabled={pending}
                  label={dict.organizations}
                  value={rtOrgId === "" ? "" : String(rtOrgId)}
                  onChange={(v) => {
                    setRtOrgId(v === "" ? "" : Number(v));
                  }}
                  options={[
                    { value: "", label: "" },
                    ...orgs.map((o) => ({
                      value: String(o.id),
                      label: `${text(o.transport_organization)} - ${text(o.region)}`,
                    })),
                  ]}
                />
                <InlineSelect
                  fullWidth
                  disabled={pending}
                  label={dict.protocol}
                  value={protocol}
                  onChange={(v) => setProtocol(v as ProtocolChoice)}
                  options={PROTOCOLS.map((p) => ({ value: p, label: p }))}
                />
                {protocol !== "gbfs" ? (
                  <Stack spacing={0.5}>
                    {eligibleLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {dict.loadingEligibleStatic}
                      </Typography>
                    ) : null}
                    {eligibleError ? <Alert severity="warning">{eligibleError}</Alert> : null}
                    <InlineSelect
                      fullWidth
                      disabled={pending || eligibleLoading || !eligibleStatics.length}
                      required={protocol === "gtfs_rt" || protocol === "siri"}
                      label={dict.staticSubmission}
                      value={rtStaticSubId === "" ? "" : String(rtStaticSubId)}
                      onChange={(v) => {
                        setRtStaticSubId(v === "" ? "" : Number(v));
                      }}
                      options={[
                        { value: "", label: "" },
                        ...eligibleStatics.map((s) => ({
                          value: String(s.id),
                          label: `#${s.id} - ${s.name ? text(s.name) : dict.unnamed} - ${s.data_type} (${(s.allowed_realtime_protocols ?? []).join(", ")})`,
                        })),
                      ]}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {dict.staticSubmissionSelectHint}
                    </Typography>
                  </Stack>
                ) : null}
                <TextField
                  label={dict.name}
                  value={rtName}
                  onChange={(e) => setRtName(e.target.value)}
                  disabled={pending}
                />
                <TextField
                  label={dict.note}
                  value={rtNote}
                  onChange={(e) => setRtNote(e.target.value)}
                  disabled={pending}
                  multiline
                  minRows={2}
                />
                <TextField
                  label={dict.license}
                  value={rtLicense}
                  onChange={(e) => setRtLicense(e.target.value)}
                  disabled={pending}
                />

                <Typography variant="subtitle2">{dict.endpoints}</Typography>
                {rtEndpoints.map((ep, idx) => (
                  <Stack
                    key={ep.uid}
                    spacing={1}
                    sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      sx={{ alignItems: { md: "center" } }}
                    >
                      <InlineSelect
                        label={dict.feedTypes}
                        value={ep.endpoint_type}
                        onChange={(v) => {
                          setRtEndpoints((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, endpoint_type: v } : r)),
                          );
                        }}
                        disabled={pending}
                        sx={{ minWidth: 220 }}
                        options={endpointTypeOptions.map((t) => ({ value: t, label: t }))}
                      />
                      <TextField
                        label={dict.feedUrl}
                        value={ep.url}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRtEndpoints((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, url: v } : r)),
                          );
                        }}
                        disabled={pending}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label={dict.sourceUpdateInterval}
                        type="number"
                        value={ep.interval}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRtEndpoints((rows) =>
                            rows.map((r, i) =>
                              i === idx
                                ? {
                                    ...r,
                                    interval: v,
                                    hide_original: isNoSourceUpdate(v) ? false : r.hide_original,
                                  }
                                : r,
                            ),
                          );
                        }}
                        disabled={pending}
                        required
                        slotProps={{
                          htmlInput: {
                            min: SOURCE_UPDATE_INTERVAL_MIN,
                            max: SOURCE_UPDATE_INTERVAL_MAX,
                            step: 1,
                            inputMode: "numeric",
                          },
                        }}
                        sx={{ minWidth: 160 }}
                      />
                      <IconButton
                        aria-label={dict.delete}
                        color="error"
                        disabled={pending || rtEndpoints.length <= 1}
                        onClick={() => setRtEndpoints((rows) => rows.filter((_, i) => i !== idx))}
                      >
                        <MdDelete />
                      </IconButton>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <InlineSelect
                        label={dict.authType}
                        value={ep.auth_type}
                        onChange={(v) => {
                          setRtEndpoints((rows) =>
                            rows.map((r, i) =>
                              i === idx
                                ? { ...r, auth_type: v, hide_original: hideOriginalOnAuthChange(v) }
                                : r,
                            ),
                          );
                        }}
                        disabled={pending}
                        sx={{ minWidth: 200 }}
                        options={authTypeSelectOptions}
                      />
                      {ep.auth_type ? (
                        <PasswordTextField
                          label={dict.authValue}
                          value={ep.auth_value}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRtEndpoints((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, auth_value: v } : r)),
                            );
                          }}
                          disabled={pending}
                          helperText={dict.authValueHint}
                          sx={{ flex: 1 }}
                          autoComplete="new-password"
                          showPasswordLabel={dict.showPassword}
                          hidePasswordLabel={dict.hidePassword}
                        />
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={ep.is_original}
                            onChange={(e) =>
                              setRtEndpoints((rows) =>
                                rows.map((r, i) =>
                                  i === idx ? { ...r, is_original: e.target.checked } : r,
                                ),
                              )
                            }
                            disabled={pending}
                          />
                        }
                        label={dict.original}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={resolveHideOriginal(ep.auth_type, ep.hide_original)}
                            onChange={(e) =>
                              setRtEndpoints((rows) =>
                                rows.map((r, i) =>
                                  i === idx ? { ...r, hide_original: e.target.checked } : r,
                                ),
                              )
                            }
                            disabled={
                              pending ||
                              isHideOriginalLockedByAuth(ep.auth_type) ||
                              isNoSourceUpdate(ep.interval)
                            }
                          />
                        }
                        label={dict.hideOriginal}
                      />
                    </Stack>
                  </Stack>
                ))}
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<MdAdd />}
                  disabled={pending}
                  onClick={() =>
                    setRtEndpoints((rows) => [
                      ...rows,
                      { ...emptyEndpoint(protocol), endpoint_type: String(endpointTypeOptions[0]) },
                    ])
                  }
                >
                  {dict.addEndpoint}
                </Button>

                <Button type="submit" variant="contained" disabled={pending}>
                  {dict.submit}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </AccessGate>
  );
}
