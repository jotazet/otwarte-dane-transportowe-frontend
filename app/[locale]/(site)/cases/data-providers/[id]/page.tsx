import { notFound } from "next/navigation";
import { MdBusiness } from "react-icons/md";

import { DataProviderForm } from "@/components/DataProviderForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchDataProvider } from "@/lib/api/cases";
import { casesProviderDetail } from "@/lib/nav/breadcrumbTrails";

export default async function DataProviderEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const providerId = Number(id);
  if (!Number.isFinite(providerId)) notFound();

  const prov = await fetchDataProvider(providerId);
  const label = prov.name?.trim() || `#${providerId}`;

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesProviderDetail(locale, dict, providerId, label)}>
      <PageHeader
        title={`${dict.edit}: ${label}`}
        subtitle={dict.providersDesc}
        icon={<MdBusiness size={28} aria-hidden />}
      />
      <DataProviderForm locale={locale} dict={dict} providerId={providerId} initial={prov} />
    </AppPage>
  );
}
