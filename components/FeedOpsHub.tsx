"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { FeedOpsOverview } from "@/components/feedOps/FeedOpsOverview";
import { FetchErrorsTable } from "@/components/feedOps/FetchErrorsTable";
import { ProxyFeedsTable } from "@/components/feedOps/ProxyFeedsTable";
import type { Dictionary } from "@/i18n/getDictionary";
import { fetchAllProxyFeeds, type ProxyFeedListItem } from "@/lib/api/feedOps";
import type { FetchStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatApiError } from "@/lib/formatApiError";

export type FeedOpsTab = "overview" | "feeds" | "errors";

const VALID_TABS: FeedOpsTab[] = ["overview", "feeds", "errors"];

function parseTab(value: string | null | undefined): FeedOpsTab {
  return VALID_TABS.includes(value as FeedOpsTab) ? (value as FeedOpsTab) : "overview";
}

export function FeedOpsHub({
  locale,
  dict,
  initialTab = "overview",
}: {
  locale: string;
  dict: Dictionary;
  initialTab?: FeedOpsTab;
}) {
  const auth = useAuth();
  const { apiJson, status: authStatus } = auth;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = React.useState<FeedOpsTab>(initialTab);
  const [statusFilter, setStatusFilter] = React.useState<FetchStatus | "">("");
  const [overviewRows, setOverviewRows] = React.useState<ProxyFeedListItem[]>([]);
  const [overviewLoading, setOverviewLoading] = React.useState(true);
  const [overviewError, setOverviewError] = React.useState<string | null>(null);
  const [feedsReloadKey, setFeedsReloadKey] = React.useState(0);

  React.useEffect(() => {
    void (async () => {
      setTab(parseTab(searchParams.get("tab") ?? initialTab));
    })();
  }, [initialTab, searchParams]);

  const changeTab = React.useCallback(
    (next: FeedOpsTab) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") {
        params.delete("tab");
        params.delete("status");
      } else {
        params.set("tab", next);
      }
      const q = params.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadOverview = React.useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      setOverviewRows(await fetchAllProxyFeeds(apiJson));
    } catch (e) {
      setOverviewError(formatApiError(e, dict));
      setOverviewRows([]);
    } finally {
      setOverviewLoading(false);
    }
  }, [apiJson, authStatus, dict]);

  React.useEffect(() => {
    if (tab !== "overview") return;
    void (async () => {
      await loadOverview();
    })();
  }, [tab, loadOverview]);

  const reloadFeeds = React.useCallback(() => {
    setFeedsReloadKey((k) => k + 1);
    if (tab === "overview") void loadOverview();
  }, [loadOverview, tab]);

  return (
    <AccessGate
      roles={["Helper", "Admin"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
      <Stack spacing={3}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tab}
            onChange={(_, value: FeedOpsTab) => changeTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="overview" label={dict.feedOpsTabOverview} />
            <Tab value="feeds" label={dict.feedOpsTabFeeds} />
            <Tab value="errors" label={dict.feedOpsTabErrors} />
          </Tabs>
        </Box>

        {tab === "overview" ? (
          <FeedOpsOverview
            dict={dict}
            rows={overviewRows}
            loading={overviewLoading}
            onSelectStatus={(status) => {
              setStatusFilter(status);
              changeTab("feeds");
            }}
            onSelectErrors={() => changeTab("errors")}
          />
        ) : null}

        {tab === "feeds" ? (
          <ProxyFeedsTable
            locale={locale}
            dict={dict}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            reloadKey={feedsReloadKey}
            onReload={reloadFeeds}
          />
        ) : null}

        {tab === "errors" ? <FetchErrorsTable locale={locale} dict={dict} /> : null}

        {tab === "overview" && overviewError ? (
          <Alert severity="error">{overviewError}</Alert>
        ) : null}
      </Stack>
    </AccessGate>
  );
}
