import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { HomePageView } from "@/components/HomePageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationLd, websiteLd } from "@/lib/seo/structuredData";

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
  // Same cookie as the login gate in proxy.ts.
  const signedIn = (await cookies()).get("odt.auth")?.value === "1";

  return (
    <>
      <JsonLd data={websiteLd(locale, dict)} />
      <JsonLd data={organizationLd(dict)} />
      <HomePageView locale={locale} dict={dict} signedIn={signedIn} />
    </>
  );
}
