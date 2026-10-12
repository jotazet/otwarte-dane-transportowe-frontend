import { notFound } from "next/navigation";
import { MdBusiness } from "react-icons/md";

import { DataProviderForm } from "@/components/DataProviderForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { casesProviderNew } from "@/lib/nav/breadcrumbTrails";

export default async function DataProviderNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={casesProviderNew(locale, dict)}>
      <PageHeader
        title={dict.createProvider}
        subtitle={dict.providersDesc}
        icon={<MdBusiness size={28} aria-hidden />}
      />
      <DataProviderForm locale={locale} dict={dict} />
    </AppPage>
  );
}
