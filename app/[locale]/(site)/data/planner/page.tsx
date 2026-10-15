import type { Metadata } from "next";
import { Suspense } from "react";
import { MdRoute } from "react-icons/md";

import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { PlannerAdminHub } from "@/components/plannerAdmin/PlannerAdminHub";
import { pickPlannerAdminDict } from "@/components/plannerAdmin/plannerAdminDict";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { dataPlannerAdmin } from "@/lib/nav/breadcrumbTrails";
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
    title: dict.metaPlannerAdminTitle,
    description: dict.metaPlannerAdminDescription,
    path: "/data/planner",
  });
}

export default async function PlannerAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={dataPlannerAdmin(locale, dict)}
    >
      <PageHeader
        title={dict.plannerAdminTitle}
        subtitle={dict.plannerAdminSubtitle}
        icon={<MdRoute size={28} aria-hidden />}
      />
      {/* The hub reads ?tab= with useSearchParams. */}
      <Suspense fallback={null}>
        <PlannerAdminHub locale={locale} dict={pickPlannerAdminDict(dict)} />
      </Suspense>
    </AppPage>
  );
}
