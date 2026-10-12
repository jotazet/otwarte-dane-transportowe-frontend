import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdDataset } from "react-icons/md";

import { DataCatalogTable } from "@/app/[locale]/(site)/data/DataCatalogTable";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchFeedCatalog } from "@/lib/api/dataCatalog";
import { loadOrError } from "@/lib/api/loadOr404";
import { PageLoadErrorAlert } from "@/components/PageLoadErrorAlert";
import { dataCatalog } from "@/lib/nav/breadcrumbTrails";
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
    title: dict.metaDataTitle,
    description: dict.metaDataDescription,
    path: "/data",
  });
}

export default async function DataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const { data: organizations } = await loadOrError(fetchFeedCatalog());

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={dataCatalog(locale, dict)}>
      <PageHeader
        title={dict.dataTitle}
        subtitle={dict.dataSubtitle}
        icon={<MdDataset size={28} aria-hidden />}
      />
      {organizations === null ? (
        <PageLoadErrorAlert body={dict.pageErrorBody} retryLabel={dict.tryAgain} />
      ) : (
        <DataCatalogTable
          locale={locale}
          organizations={organizations}
          dict={{
            organizations: dict.organizations,
            region: dict.region,
            staticFeeds: dict.staticFeeds,
            realtimeFeeds: dict.realtimeFeeds,
            publicOrganization: dict.publicOrganization,
            all: dict.all,
            actions: dict.actions,
            edit: dict.edit,
          }}
        />
      )}
    </AppPage>
  );
}
