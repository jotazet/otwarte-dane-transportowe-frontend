"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useSearchParams } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { useConfirm } from "@/components/layout/useConfirm";
import { PlannerAccessTab } from "@/components/plannerAdmin/PlannerAccessTab";
import type { PlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { PlannerBuildDrawer } from "@/components/plannerAdmin/PlannerBuildDrawer";
import { PlannerBuildsTab } from "@/components/plannerAdmin/PlannerBuildsTab";
import { PlannerFeedDrawer } from "@/components/plannerAdmin/PlannerFeedDrawer";
import { PlannerFeedsTab } from "@/components/plannerAdmin/PlannerFeedsTab";
import { PlannerIpDrawer } from "@/components/plannerAdmin/PlannerIpDrawer";
import { PlannerOverviewTab } from "@/components/plannerAdmin/PlannerOverviewTab";
import { PlannerTrafficTab } from "@/components/plannerAdmin/PlannerTrafficTab";
import { plannerErrorMessage } from "@/components/plannerAdmin/shared";
import type { ApiJson } from "@/lib/api/http";
import {
  plannerAdminPaths,
  type BuildSchedule,
  type GraphBuild,
  type OsmDownload,
  type PlannerAdminStatus,
  type PlannerFeed,
  type PlannerRentalSource,
  type PlannerSettings,
} from "@/lib/api/plannerAdmin";
import { fetchAllPages, type PaginatedResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { fill } from "@/lib/i18n/fill";

export const PLANNER_ADMIN_TABS = ["overview", "feeds", "builds", "traffic", "access"] as const;
export type PlannerAdminTab = (typeof PLANNER_ADMIN_TABS)[number];

/** What most tabs need; the traffic and access tabs load their own data. */
export type PlannerCore = {
  status: PlannerAdminStatus;
  feeds: PlannerFeed[];
  rentals: PlannerRentalSource[];
  builds: GraphBuild[];
  schedule: BuildSchedule;
  osm: OsmDownload[];
  settings: PlannerSettings;
  loadedAt: string;
};

export type DrawerTarget =
  | { type: "feed"; id: number }
  | { type: "rental"; id: number }
  | { type: "build"; id: number }
  | { type: "ip"; ip: string };

/** Shared by every tab and drawer of the panel. */
export type PlannerAdminContext = {
  core: PlannerCore;
  reload: () => Promise<void>;
  /** Puts a saved change into the panel's data without reloading it. */
  updateCore: (update: (core: PlannerCore) => PlannerCore) => void;
  apiJson: ApiJson;
  dict: PlannerAdminDict;
  locale: string;
  notify: (message: string, severity?: "success" | "error") => void;
  confirm: (
    message: string,
    opts?: { confirmLabel?: string; danger?: boolean },
  ) => Promise<boolean>;
  openDrawer: (target: DrawerTarget) => void;
  openTab: (tab: PlannerAdminTab) => void;
  requestBuild: () => Promise<void>;
};

const BUILDS_PAGE_SIZE = 20;
const OSM_PAGE_SIZE = 20;
/** While a build or an OSM download runs, the panel refreshes itself this often. */
const BUSY_REFRESH_MS = 20_000;

/** What changes while a build or an OSM download runs; the rest of the core stays as it is. */
async function loadJobs(apiJson: ApiJson) {
  const get = <T,>(path: string) => apiJson<T>("GET", path);
  const [status, builds, osm] = await Promise.all([
    get<PlannerAdminStatus>(plannerAdminPaths.status),
    get<PaginatedResponse<GraphBuild>>(`${plannerAdminPaths.builds}?page_size=${BUILDS_PAGE_SIZE}`),
    get<PaginatedResponse<OsmDownload>>(`${plannerAdminPaths.osm}?page_size=${OSM_PAGE_SIZE}`),
  ]);
  return { status, builds: builds.results, osm: osm.results, loadedAt: new Date().toISOString() };
}

async function loadCore(apiJson: ApiJson): Promise<PlannerCore> {
  const get = <T,>(path: string) => apiJson<T>("GET", path);
  const [status, feeds, rentals, builds, schedule, osm, settings] = await Promise.all([
    get<PlannerAdminStatus>(plannerAdminPaths.status),
    fetchAllPages<PlannerFeed>(get, plannerAdminPaths.feeds),
    fetchAllPages<PlannerRentalSource>(get, plannerAdminPaths.rentalSources),
    get<PaginatedResponse<GraphBuild>>(`${plannerAdminPaths.builds}?page_size=${BUILDS_PAGE_SIZE}`),
    get<BuildSchedule>(plannerAdminPaths.schedule),
    get<PaginatedResponse<OsmDownload>>(`${plannerAdminPaths.osm}?page_size=${OSM_PAGE_SIZE}`),
    get<PlannerSettings>(plannerAdminPaths.settings),
  ]);
  return {
    status,
    feeds,
    rentals,
    builds: builds.results,
    schedule,
    osm: osm.results,
    settings,
    loadedAt: new Date().toISOString(),
  };
}

function parseTab(value: string | null): PlannerAdminTab {
  return PLANNER_ADMIN_TABS.includes(value as PlannerAdminTab)
    ? (value as PlannerAdminTab)
    : "overview";
}

export function PlannerAdminHub({ locale, dict }: { locale: string; dict: PlannerAdminDict }) {
  return (
    <AccessGate
      roles={["Admin"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
      <PlannerAdminPanel locale={locale} dict={dict} />
    </AccessGate>
  );
}

function PlannerAdminPanel({ locale, dict }: { locale: string; dict: PlannerAdminDict }) {
  const { apiJson } = useAuth();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [core, setCore] = React.useState<PlannerCore | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [drawer, setDrawer] = React.useState<DrawerTarget | null>(null);
  const [toast, setToast] = React.useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const { confirm, confirmDialog } = useConfirm({
    confirm: dict.plannerAdminDone,
    cancel: dict.cancel,
  });

  const reload = React.useCallback(async () => {
    try {
      setCore(await loadCore(apiJson));
      setLoadError(null);
    } catch (e) {
      setLoadError(plannerErrorMessage(e, dict));
    }
  }, [apiJson, dict]);

  React.useEffect(() => {
    void (async () => {
      await reload();
    })();
  }, [reload]);

  const busy = Boolean(
    core?.status.running_build ||
    core?.osm.some((d) => d.status === "queued" || d.status === "running"),
  );
  React.useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void (async () => {
        try {
          const jobs = await loadJobs(apiJson);
          setCore((c) => (c ? { ...c, ...jobs } : c));
        } catch {
          // The next tick tries again; the panel keeps the last data.
        }
      })();
    }, BUSY_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [apiJson, busy]);

  // A finished build changes every feed's and rental source's result, which polling does not load.
  const buildRunning = Boolean(core?.status.running_build);
  const wasBuildRunning = React.useRef(buildRunning);
  React.useEffect(() => {
    const finished = wasBuildRunning.current && !buildRunning;
    wasBuildRunning.current = buildRunning;
    if (!finished) return;
    void (async () => {
      await reload();
    })();
  }, [buildRunning, reload]);

  const updateCore = React.useCallback(
    (update: (core: PlannerCore) => PlannerCore) => setCore((c) => (c ? update(c) : c)),
    [],
  );

  // The native History API keeps useSearchParams in sync without a server round trip.
  const openTab = React.useCallback(
    (next: PlannerAdminTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") params.delete("tab");
      else params.set("tab", next);
      const q = params.toString();
      window.history.pushState(null, "", q ? `?${q}` : window.location.pathname);
    },
    [searchParams],
  );

  const notify = React.useCallback(
    (message: string, severity: "success" | "error" = "success") => setToast({ message, severity }),
    [],
  );

  const requestBuild = React.useCallback(async () => {
    const ok = await confirm(dict.plannerAdminBuildConfirm, {
      confirmLabel: dict.plannerAdminBuildConfirmButton,
      danger: false,
    });
    if (!ok) return;
    try {
      const build = await apiJson<GraphBuild>("POST", plannerAdminPaths.builds, {});
      notify(fill(dict.plannerAdminBuildRequested, { id: build.id }));
      await reload();
    } catch (e) {
      notify(plannerErrorMessage(e, dict), "error");
    }
  }, [apiJson, confirm, dict, notify, reload]);

  if (!core) {
    return loadError ? (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void reload()}>
            {dict.plannerAdminRetry}
          </Button>
        }
      >
        {dict.plannerAdminLoadFailed} {loadError}
      </Alert>
    ) : (
      <LoadingBlock label={dict.loading} />
    );
  }

  const ctx: PlannerAdminContext = {
    core,
    reload,
    updateCore,
    apiJson,
    dict,
    locale,
    notify,
    confirm,
    openDrawer: setDrawer,
    openTab,
    requestBuild,
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, value: PlannerAdminTab) => openTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label={dict.plannerAdminTabsLabel}
        >
          {PLANNER_ADMIN_TABS.map((t) => (
            <Tab key={t} value={t} label={dict.plannerAdminTabLabels[t]} />
          ))}
        </Tabs>
      </Box>

      {loadError ? <Alert severity="error">{loadError}</Alert> : null}

      {tab === "overview" ? <PlannerOverviewTab ctx={ctx} /> : null}
      {tab === "feeds" ? <PlannerFeedsTab ctx={ctx} /> : null}
      {tab === "builds" ? <PlannerBuildsTab ctx={ctx} /> : null}
      {tab === "traffic" ? <PlannerTrafficTab ctx={ctx} /> : null}
      {tab === "access" ? <PlannerAccessTab ctx={ctx} /> : null}

      <PlannerFeedDrawer
        ctx={ctx}
        target={drawer?.type === "feed" || drawer?.type === "rental" ? drawer : null}
        onClose={() => setDrawer(null)}
      />
      <PlannerBuildDrawer
        ctx={ctx}
        buildId={drawer?.type === "build" ? drawer.id : null}
        onClose={() => setDrawer(null)}
      />
      <PlannerIpDrawer
        ctx={ctx}
        ip={drawer?.type === "ip" ? drawer.ip : null}
        onClose={() => setDrawer(null)}
      />

      {confirmDialog}
      <Snackbar
        open={toast !== null}
        autoHideDuration={toast?.severity === "error" ? 8000 : 4000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setToast(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}
