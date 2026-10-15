import { notFound } from "next/navigation";
import { MdBusiness } from "react-icons/md";

import { DataProviderForm } from "@/components/DataProviderForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { fetchDataProvider } from "@/lib/api/cases";
import { loadOr404 } from "@/lib/api/loadOr404";
import { parseNumericId } from "@/lib/nav/ids";
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
  const providerId = parseNumericId(id);
  if (providerId == null) notFound();

  const prov = await loadOr404(fetchDataProvider(providerId));
  const label = prov.name?.trim() || `#${providerId}`;

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={casesProviderDetail(locale, dict, providerId, label)}
    >
      <PageHeader
        title={dict.dataProviderEditTitle.replace("{name}", label)}
        subtitle={dict.providersDesc}
        icon={<MdBusiness size={28} aria-hidden />}
      />
      <DataProviderForm locale={locale} dict={dict} providerId={providerId} initial={prov} />
    </AppPage>
  );
}
