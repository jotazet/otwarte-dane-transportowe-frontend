"use client";

import { usePathname } from "next/navigation";

import { StatusScreen } from "@/components/layout/StatusScreen";
import { dictionaryFor } from "@/i18n/getDictionary";
import { locales, type Locale } from "@/i18n/locales";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() || "/pl";
  const seg = pathname.split("/")[1];
  const locale = (locales.includes(seg as Locale) ? seg : "pl") as Locale;
  const dict = dictionaryFor(locale);

  return (
    <StatusScreen
      title={dict.pageErrorTitle}
      body={dict.pageErrorBody}
      homeHref={`/${locale}`}
      homeLabel={dict.backHome}
      onRetry={reset}
      retryLabel={dict.tryAgain}
    />
  );
}
