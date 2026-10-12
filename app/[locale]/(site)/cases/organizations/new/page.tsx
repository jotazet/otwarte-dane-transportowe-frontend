import { notFound } from "next/navigation";
import { MdApartment } from "react-icons/md";

import { OrganizationForm } from "@/components/OrganizationForm";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { casesAddOrganization } from "@/lib/nav/breadcrumbTrails";

export default async function OrganizationNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={casesAddOrganization(locale, dict)}
    >
      <PageHeader
        title={dict.addOrganization}
        subtitle={dict.casesSubtitle}
        icon={<MdApartment size={28} aria-hidden />}
      />
      <OrganizationForm locale={locale} dict={dict} />
    </AppPage>
  );
}
