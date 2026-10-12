import { MdManageAccounts } from "react-icons/md";

import { CreateActionButton } from "@/components/CreateActionButton";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { UsersHub } from "@/components/UsersHub";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { usersRoot } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict } = await resolvePageLocale(params);

  return (
    <AppPage locale={locale} backLabel={dict.back} breadcrumbs={usersRoot(locale, dict)}>
      <PageHeader
        title={dict.users}
        subtitle={dict.usersDesc}
        icon={<MdManageAccounts size={28} aria-hidden />}
        actions={
          <CreateActionButton
            roles={["Admin"]}
            href={paths(locale).usersNew}
            label={dict.addUser}
          />
        }
      />
      <UsersHub locale={locale} dict={dict} />
    </AppPage>
  );
}
