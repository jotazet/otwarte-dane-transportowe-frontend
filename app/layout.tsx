import type { Metadata } from "next";
import { headers } from "next/headers";
import { Roboto } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import { ThemeRegistry } from "@/components/ThemeRegistry";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";
import { buildSiteFallbackMetadata } from "@/lib/seo/metadata";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/theme/colorMode";

import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-roboto",
});

/** Locale of the request, set by proxy.ts from the URL. */
async function requestLocale(): Promise<Locale> {
  const rawLocale = (await headers()).get("x-odt-locale") ?? "pl";
  return locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : "pl";
}

// In the root layout so that its title template also applies to the home page.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    ...buildSiteFallbackMetadata(await getDictionary(locale), locale),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await requestLocale();

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
