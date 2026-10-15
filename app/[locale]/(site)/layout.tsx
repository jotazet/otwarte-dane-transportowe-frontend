import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MuiAppShell } from "@/components/MuiAppShell";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { buildSiteFallbackMetadata } from "@/lib/seo/metadata";

/** Każde odświeżenie - świeże dane z API (getJson domyślnie `cache: "no-store"`). */
export const dynamic = "force-dynamic";

/** Title template and defaults in the page's language (the root layout only knows Polish). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) return {};
  const locale = rawLocale as Locale;
  return buildSiteFallbackMetadata(await getDictionary(locale), locale);
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <MuiAppShell locale={locale} dict={dict}>
      {children}
    </MuiAppShell>
  );
}
