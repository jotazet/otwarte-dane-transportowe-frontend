import { notFound } from "next/navigation";
import { MdInfoOutline } from "react-icons/md";

import { InfoCards } from "@/components/InfoCards";
import { PageHeader } from "@/components/PageHeader";
import { PageSection } from "@/components/PageSection";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, locales } from "@/i18n/locales";

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const dict = await getDictionary(rawLocale as Locale);

  return (
    <PageSection maxWidth="lg">
      <PageHeader
        title={dict.infoTitle}
        subtitle={dict.infoSubtitle}
        icon={<MdInfoOutline size={28} aria-hidden />}
      />
      <InfoCards dict={dict} />
    </PageSection>
  );
}
