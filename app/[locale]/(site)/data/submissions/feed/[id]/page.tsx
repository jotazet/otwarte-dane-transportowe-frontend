import { redirect } from "next/navigation";

import { Locale, locales } from "@/i18n/locales";

export default async function LegacyFeedSubmissionRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!locales.includes(rawLocale as Locale)) return null;
  redirect(`/${rawLocale}/data/my-submissions/feed/${id}`);
}
