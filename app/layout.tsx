import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { ThemeRegistry } from "@/components/ThemeRegistry";

import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Otwarte Dane Transportowe (ODT)",
    template: "%s • Otwarte Dane Transportowe",
  },
  description:
    "Otwarte Dane Transportowe (ODT) – katalog i status pozyskiwania oficjalnych danych transportu publicznego w Polsce. GTFS, GTFS-RT, NeTEx, SIRI. Dane z otwartego API.",
  applicationName: "Otwarte Dane Transportowe",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Otwarte Dane Transportowe",
    locale: "pl_PL",
    title: "Otwarte Dane Transportowe (ODT)",
    description:
      "Otwarte Dane Transportowe (ODT) – katalog i status pozyskiwania oficjalnych danych transportu publicznego w Polsce.",
  },
  twitter: {
    card: "summary",
    title: "Otwarte Dane Transportowe (ODT)",
    description:
      "Otwarte Dane Transportowe (ODT) – katalog i status pozyskiwania oficjalnych danych transportu publicznego w Polsce.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${roboto.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
