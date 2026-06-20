import { redirect } from "next/navigation";

import { Locale, locales } from "@/i18n/locales";

export default async function LegacySubmitRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organization?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;
  if (!locales.includes(rawLocale as Locale)) return null;
  const q = sp.organization ? `?organization=${sp.organization}` : "";
  redirect(`/${rawLocale}/data/my-submissions${q}`);
}
