import type { ReactNode } from "react";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import type { Dictionary } from "@/i18n/getDictionary";
import { text } from "@/lib/format";

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" component="span" sx={{ lineHeight: 1.6 }}>
      <Typography
        component="span"
        variant="body2"
        sx={{ fontWeight: 600, color: "text.secondary" }}
      >
        {label}:{" "}
      </Typography>
      {children}
    </Typography>
  );
}

type OrganizationContactFields = {
  region?: string | null;
  contact_email?: string;
  phone_number?: string;
  website?: string;
};

export function OrganizationMeta({
  organization,
  dict,
}: {
  organization: OrganizationContactFields;
  dict: Dictionary;
}) {
  const region = text(organization.region);
  const email = text(organization.contact_email);
  const phone = text(organization.phone_number);
  const website = text(organization.website);

  return (
    <>
      {region !== "-" ? <MetaItem label={dict.region}>{region}</MetaItem> : null}
      {email !== "-" ? (
        <MetaItem label={dict.contact}>
          <Link href={`mailto:${email}`} underline="hover">
            {email}
          </Link>
        </MetaItem>
      ) : null}
      {phone !== "-" ? (
        <MetaItem label={dict.phone}>
          <Link href={`tel:${phone}`} underline="hover">
            {phone}
          </Link>
        </MetaItem>
      ) : null}
      {website !== "-" ? (
        <MetaItem label={dict.website}>
          <Link href={website} target="_blank" rel="noopener noreferrer" underline="hover">
            {website}
          </Link>
        </MetaItem>
      ) : null}
    </>
  );
}
