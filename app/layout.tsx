import type { Metadata } from "next";
import { headers } from "next/headers";
import { Roboto } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import { ThemeRegistry } from "@/components/ThemeRegistry";
import { dictPl } from "@/i18n/lang/pl";
import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";
import { buildSiteFallbackMetadata } from "@/lib/seo/metadata";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/theme/colorMode";

import "./globals.css";

const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  ...buildSiteFallbackMetadata(dictPl),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const rawLocale = headersList.get("x-odt-locale") ?? "pl";
  const lang = locales.includes(rawLocale as Locale) ? rawLocale : "pl";

  return (
    <html lang={lang} className={roboto.variable} suppressHydrationWarning>
      <head>
        <InitColorSchemeScript
          attribute='[data-color-mode="%s"]'
          modeStorageKey={COLOR_MODE_STORAGE_KEY}
          defaultMode="light"
        />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
