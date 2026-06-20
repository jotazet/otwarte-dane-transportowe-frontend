"use client";

import Button from "@mui/material/Button";
import NextLink from "next/link";
import { MdApartment } from "react-icons/md";

import { OrganizationMeta } from "@/components/OrganizationMeta";
import { PageHeader } from "@/components/PageHeader";
import type { TransportOrganizationDetail } from "@/lib/api/cases";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasHelperAccess } from "@/lib/auth/permissions";
import { paths } from "@/lib/nav/routes";
import { text } from "@/lib/format";

export function OrganizationDetailHeader({
  organization,
  dict,
  locale,
}: {
  organization: TransportOrganizationDetail;
  dict: Dictionary;
  locale: string;
}) {
  const auth = useAuth();
  const p = paths(locale);
  const canManage =
    auth.status === "authenticated" &&
    hasHelperAccess({ roles: auth.user.roles, isDjangoAdmin: auth.user.isDjangoAdmin });

  const orgLabel = text(organization.transport_organization);

  return (
    <PageHeader
      title={orgLabel}
      meta={<OrganizationMeta organization={organization} dict={dict} />}
      icon={<MdApartment size={28} aria-hidden />}
      actions={
        <>
          <Button
            component={NextLink}
            href={p.dataFeed(organization.id)}
            variant="outlined"
            size="small"
            prefetch={false}
          >
            {dict.viewFeedCatalog ?? dict.data}
          </Button>
          {canManage ? (
            <Button
              component={NextLink}
              href={`/${locale}/cases/organizations/${organization.id}/edit`}
              variant="outlined"
              size="small"
              prefetch={false}
            >
              {dict.edit}
            </Button>
          ) : null}
        </>
      }
    />
  );
}
