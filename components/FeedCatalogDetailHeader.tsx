"use client";

import Button from "@mui/material/Button";
import NextLink from "next/link";
import { MdDataset } from "react-icons/md";

import { OrganizationMeta } from "@/components/OrganizationMeta";
import { PageHeader } from "@/components/PageHeader";
import type { FeedCatalogOrganizationDetail } from "@/lib/api/dataCatalog";
import type { Dictionary } from "@/i18n/getDictionary";
import { paths } from "@/lib/nav/routes";
import { text } from "@/lib/format";

export function FeedCatalogDetailHeader({
  organization,
  dict,
  locale,
}: {
  organization: FeedCatalogOrganizationDetail;
  dict: Dictionary;
  locale: string;
}) {
  const p = paths(locale);
  const orgLabel = text(organization.transport_organization);

  return (
    <PageHeader
      title={orgLabel}
      meta={<OrganizationMeta organization={organization} dict={dict} />}
      icon={<MdDataset size={28} aria-hidden />}
      actions={
        <Button
          component={NextLink}
          href={p.casesOrg(organization.id)}
          variant="outlined"
          size="small"
          prefetch={false}
        >
          {dict.viewCasesCatalog ?? dict.cases}
        </Button>
      }
    />
  );
}
