import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdInfoOutline } from "react-icons/md";
import Typography from "@mui/material/Typography";

import { InfoCards } from "@/components/InfoCards";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { infoRoot } from "@/lib/nav/breadcrumbTrails";
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
    title: dict.metaInfoTitle,
    description: dict.metaInfoDescription,
    path: "/info",
  });
}

export default async function InfoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbs={infoRoot(locale, dict)}
      maxWidth="lg"
    >
      <PageHeader
        title={dict.infoTitle}
        subtitle={dict.infoSubtitle}
        icon={<MdInfoOutline size={28} aria-hidden />}
      />
      <InfoCards dict={dict} />
    </AppPage>
  );
}
