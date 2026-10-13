import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdCode, MdOpenInNew } from "react-icons/md";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";

import { DeveloperAccessCard } from "@/components/developers/DeveloperAccessCard";
import { DeveloperQuickStart } from "@/components/developers/DeveloperQuickStart";
import { PlannerFeedsTable } from "@/components/developers/PlannerFeedsTable";
import { PlannerStatusCard } from "@/components/developers/PlannerStatusCard";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { loadOrError } from "@/lib/api/loadOr404";
import { fetchPlannerCoverage, fetchPlannerStatus } from "@/lib/api/planner";
import { apiBaseUrl } from "@/lib/config";
import { developersRoot } from "@/lib/nav/breadcrumbTrails";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata(locale, dict, {
    title: dict.metaDevelopersTitle,
    description: dict.metaDevelopersDescription,
    path: "/developers",
  });
}

export default async function DevelopersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const baseUrl = apiBaseUrl();

  const { data: status } = await loadOrError(fetchPlannerStatus());
  // Counting trips needs the routing engine, which only answers while the planner is available.
  const { data: coverage } = status?.available
    ? await loadOrError(fetchPlannerCoverage(status))
    : { data: null };

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={developersRoot(locale, dict)}
    >
      <PageHeader
        title={dict.developersTitle}
        subtitle={dict.developersSubtitle}
        icon={<MdCode size={28} aria-hidden />}
        actions={
          <Button
            variant="outlined"
            href={`${baseUrl}/api/planner/v1/docs/`}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<MdOpenInNew aria-hidden />}
          >
            {dict.developersOpenDocs}
          </Button>
        }
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Stack spacing={2}>
            <DeveloperQuickStart
              apiBaseUrl={baseUrl}
              dict={{
                developersQuickStartTitle: dict.developersQuickStartTitle,
                developersApiBaseUrl: dict.developersApiBaseUrl,
                developersCopyApiBaseUrl: dict.developersCopyApiBaseUrl,
                developersRequest: dict.developersRequest,
                developersExampleLabels: dict.developersExampleLabels,
                developersCodeLanguage: dict.developersCodeLanguage,
                developersCopyCode: dict.developersCopyCode,
                developersCopied: dict.developersCopied,
                developersSendRequest: dict.developersSendRequest,
                developersSendRequestHint: dict.developersSendRequestHint,
                developersResponse: dict.developersResponse,
                developersResponseEmpty: dict.developersResponseEmpty,
                developersResponseLoading: dict.developersResponseLoading,
                developersResponseTime: dict.developersResponseTime,
                developersResponseFailed: dict.developersResponseFailed,
                developersCopyResponse: dict.developersCopyResponse,
              }}
            />
            <DeveloperAccessCard locale={locale} dict={dict} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <PlannerStatusCard status={status} coverage={coverage} locale={locale} dict={dict} />
        </Grid>
      </Grid>
      {status ? (
        <PlannerFeedsTable
          feeds={status.feeds}
          locale={locale}
          dict={{
            developersFeedsTitle: dict.developersFeedsTitle,
            developersFeedsOrganization: dict.developersFeedsOrganization,
            developersFeedsId: dict.developersFeedsId,
            developersFeedsVersion: dict.developersFeedsVersion,
            developersFeedsVersionAt: dict.developersFeedsVersionAt,
            developersFeedOutcomeLabels: dict.developersFeedOutcomeLabels,
            developersFeedsStaleHint: dict.developersFeedsStaleHint,
            developersFeedsEmpty: dict.developersFeedsEmpty,
          }}
        />
      ) : null}
    </AppPage>
  );
}
