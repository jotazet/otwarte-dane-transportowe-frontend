import { notFound } from "next/navigation";
import { MdPerson } from "react-icons/md";

import { UserDetailBody } from "@/components/UserDetailBody";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { parseNumericId } from "@/lib/nav/ids";
import { userDetail } from "@/lib/nav/breadcrumbTrails";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const { id } = await params;
  const userId = parseNumericId(id);
  if (userId == null) notFound();

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbsLabel={dict.breadcrumbsLabel}
      breadcrumbs={userDetail(locale, dict, userId, `#${userId}`)}
    >
      <PageHeader
        title={dict.userDetailTitle.replace("{id}", String(userId))}
        subtitle={dict.usersDesc}
        icon={<MdPerson size={28} aria-hidden />}
      />
      <UserDetailBody locale={locale} dict={dict} userId={userId} />
    </AppPage>
  );
}
