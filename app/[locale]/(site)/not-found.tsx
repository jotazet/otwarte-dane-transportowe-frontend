import { headers } from "next/headers";

import { StatusScreen } from "@/components/layout/StatusScreen";
import { getDictionary } from "@/i18n/getDictionary";
import { locales, type Locale } from "@/i18n/locales";

export default async function NotFound() {
  const headersList = await headers();
  const raw = headersList.get("x-odt-locale") ?? "pl";
  const locale = (locales.includes(raw as Locale) ? raw : "pl") as Locale;
  const dict = await getDictionary(locale);

  return (
    <StatusScreen
      title={dict.pageNotFoundTitle}
      body={dict.pageNotFoundBody}
      homeHref={`/${locale}`}
      homeLabel={dict.backHome}
    />
  );
}
