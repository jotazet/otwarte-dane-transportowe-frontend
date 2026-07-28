"use client";

import * as React from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { CrudFormActions } from "@/components/layout/CrudFormActions";
import { CrudFormCard } from "@/components/layout/CrudFormCard";
import { useConfirm } from "@/components/layout/useConfirm";
import type { Dictionary } from "@/i18n/getDictionary";
import { casesPaths } from "@/lib/api/cases";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatApiError } from "@/lib/formatApiError";
import { isValidEmail, isValidUrl } from "@/lib/validation";
import { paths } from "@/lib/nav/routes";

export function OrganizationForm({
  locale,
  dict,
  orgId,
  initial,
}: {
  locale: string;
  dict: Dictionary;
  orgId?: number;
  initial?: {
    region?: string | null;
    transport_organization?: string | null;
    website?: string | null;
    contact_email?: string | null;
    phone_number?: string | null;
    is_public?: boolean | null;
  };
}) {
  const { apiJson } = useAuth();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const p = paths(locale);
  const cancelHref = orgId != null ? p.casesOrg(orgId) : p.cases;
  const [region, setRegion] = React.useState(initial?.region ?? "");
  const [name, setName] = React.useState(initial?.transport_organization ?? "");
  const [website, setWebsite] = React.useState(initial?.website ?? "");
  const [contactEmail, setContactEmail] = React.useState(initial?.contact_email ?? "");
  const [phone, setPhone] = React.useState(initial?.phone_number ?? "");
  const [isPublic, setIsPublic] = React.useState(initial?.is_public !== false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (website.trim() && !isValidUrl(website.trim())) {
      setError(dict.invalidUrl);
      return;
    }
    if (contactEmail.trim() && !isValidEmail(contactEmail.trim())) {
      setError(dict.invalidEmail);
      return;
    }
    setPending(true);
    try {
      const body = {
        region: region.trim(),
        transport_organization: name.trim(),
        website: website.trim() || null,
        contact_email: contactEmail.trim() || null,
        phone_number: phone.trim() || null,
        is_public: isPublic,
      };
      let id: number;
      if (orgId == null) {
        const created = await apiJson<{ id: number }>("POST", casesPaths.organizations, body);
        id = created.id;
      } else {
        await apiJson("PATCH", casesPaths.organization(orgId), body);
        id = orgId;
      }
      router.replace(p.casesOrg(id));
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
      setPending(false);
    }
  }

  async function remove() {
    if (orgId == null) return;
    if (!(await confirm(dict.confirmDeleteOrganization, { confirmLabel: dict.delete }))) return;
    setPending(true);
    try {
      await apiJson("DELETE", casesPaths.organization(orgId));
      router.replace(p.cases);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
      setPending(false);
    }
  }

  return (
    <AccessGate
      roles={["Helper", "Admin"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
    <CrudFormCard error={error} onSubmit={save}>
      <Stack spacing={2}>
        <TextField
          label={dict.organizationName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={pending}
        />
        <TextField
          label={dict.region}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          disabled={pending}
        />
        <TextField
          label={dict.website}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={pending}
        />
        <TextField
          label={dict.contact}
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          disabled={pending}
        />
        <TextField
          label={dict.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={pending}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={pending}
            />
          }
          label={dict.publicOrganization}
        />
        <CrudFormActions
          saveLabel={dict.save}
          cancelHref={cancelHref}
          cancelLabel={dict.cancel}
          pending={pending}
          saveDisabled={!name.trim() || !region.trim()}
          deleteLabel={orgId != null ? dict.delete : undefined}
          onDelete={orgId != null ? () => void remove() : undefined}
          hint={orgId != null ? dict.caseHint : undefined}
        />
      </Stack>
    </CrudFormCard>
    {confirmDialog}
    </AccessGate>
  );
}
