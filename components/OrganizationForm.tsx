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
import { submissionsPaths } from "@/lib/api/submissions";
import {
  fetchAllPages,
  type FeedSubmissionListItem,
  type RealtimeSubmissionListItem,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/usePermissions";
import { formatApiError } from "@/lib/formatApiError";
import { formatNumber } from "@/lib/format";
import { CASES_MAX_LENGTH } from "@/lib/cases/maxLength";
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
    website?: string;
    contact_email?: string;
    phone_number?: string;
    is_public?: boolean | null;
  };
}) {
  const { apiJson } = useAuth();
  const canDelete = usePermissions().canDeleteTransportOrganization();
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
        website: website.trim(),
        contact_email: contactEmail.trim(),
        phone_number: phone.trim(),
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
      setError(formatApiError(err, dict));
      setPending(false);
    }
  }

  /** Submissions deleted together with the organization, or null when they cannot be listed. */
  async function countSubmissions(id: number) {
    try {
      const get = <T,>(path: string) => apiJson<T>("GET", path);
      const q = `?transport_organization=${id}`;
      const [staticRows, realtimeRows] = await Promise.all([
        fetchAllPages<FeedSubmissionListItem>(get, `${submissionsPaths.feedList}${q}`),
        fetchAllPages<RealtimeSubmissionListItem>(get, `${submissionsPaths.realtimeList}${q}`),
      ]);
      const rows = [...staticRows, ...realtimeRows];
      return {
        submissions: rows.length,
        published: rows.filter((r) => r.current_stage === 4).length,
      };
    } catch {
      return null;
    }
  }

  async function remove() {
    if (orgId == null) return;
    setPending(true);
    const counts = await countSubmissions(orgId);
    setPending(false);
    const message = [
      dict.organizationDeleteConsequence,
      counts
        ? dict.organizationDeleteCounts
            .replace("{submissions}", formatNumber(counts.submissions, locale))
            .replace("{published}", formatNumber(counts.published, locale))
        : null,
      dict.organizationDeleteIrreversible,
    ]
      .filter(Boolean)
      .join(" ");
    const title = dict.organizationDeleteTitle.replace(
      "{name}",
      initial?.transport_organization?.trim() || name.trim(),
    );
    if (!(await confirm(message, { title, confirmLabel: dict.organizationDeleteConfirm }))) return;
    setPending(true);
    try {
      await apiJson("DELETE", casesPaths.organization(orgId));
      router.replace(p.cases);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err, dict));
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
            slotProps={{ htmlInput: { maxLength: CASES_MAX_LENGTH.organizationName } }}
            disabled={pending}
          />
          <TextField
            label={dict.region}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: CASES_MAX_LENGTH.region } }}
            disabled={pending}
          />
          <TextField
            label={dict.website}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            slotProps={{ htmlInput: { maxLength: CASES_MAX_LENGTH.website } }}
            disabled={pending}
          />
          <TextField
            label={dict.contact}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            slotProps={{ htmlInput: { maxLength: CASES_MAX_LENGTH.email } }}
            disabled={pending}
          />
          <TextField
            label={dict.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            slotProps={{ htmlInput: { maxLength: CASES_MAX_LENGTH.phone } }}
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
            deleteLabel={orgId != null && canDelete ? dict.delete : undefined}
            onDelete={orgId != null && canDelete ? () => void remove() : undefined}
            hint={orgId != null ? dict.caseHint : undefined}
          />
        </Stack>
      </CrudFormCard>
      {confirmDialog}
    </AccessGate>
  );
}
