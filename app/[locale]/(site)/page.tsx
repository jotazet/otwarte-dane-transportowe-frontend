import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePageView } from "@/components/HomePageView";
import { WebSiteJsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
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
    title: dict.metaHomeTitle,
    description: dict.metaHomeDescription,
    path: "",
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <WebSiteJsonLd locale={locale} dict={dict} />
      <HomePageView locale={locale} dict={dict} />
    </>
  );
}
