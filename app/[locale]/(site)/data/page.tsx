import { notFound } from "next/navigation";
import { MdDataset } from "react-icons/md";

import { DataCatalogTable } from "@/app/[locale]/(site)/data/DataCatalogTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchFeedCatalog } from "@/lib/api/dataCatalog";

export default async function DataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const organizations = await fetchFeedCatalog();

  return (
    <PageSection>
      <PageHeader
        title={dict.dataTitle}
        subtitle={dict.dataSubtitle}
        icon={<MdDataset size={28} aria-hidden />}
      />
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
        }}
      />
    </PageSection>
  );
}
