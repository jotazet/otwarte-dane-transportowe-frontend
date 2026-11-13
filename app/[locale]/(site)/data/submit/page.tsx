import { redirect } from "next/navigation";

import { Locale, locales } from "@/i18n/locales";
import { parseOrganizationQueryParam } from "@/lib/nav/query";

export default async function LegacySubmitRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organization?: string | string[] }>;
}) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;
  if (!locales.includes(rawLocale as Locale)) return null;
  const organization = parseOrganizationQueryParam(sp.organization);
  const q = organization ? `?organization=${organization}` : "";
  redirect(`/${rawLocale}/data/my-submissions${q}`);
}
