"use client";

import { usePathname } from "next/navigation";

import { StatusScreen } from "@/components/layout/StatusScreen";
import { dictDe } from "@/i18n/lang/de";
import { dictEn } from "@/i18n/lang/en";
import { dictPl } from "@/i18n/lang/pl";
import { locales, type Locale } from "@/i18n/locales";

function dictFor(locale: Locale) {
  if (locale === "en") return dictEn;
  if (locale === "de") return dictDe;
  return dictPl;
}

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() || "/pl";
  const seg = pathname.split("/")[1];
  const locale = (locales.includes(seg as Locale) ? seg : "pl") as Locale;
  const dict = dictFor(locale);

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
