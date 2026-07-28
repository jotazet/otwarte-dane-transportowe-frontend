"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
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

export function DataProviderForm({
  locale,
  dict,
  providerId,
  initial,
}: {
  locale: string;
  dict: Dictionary;
  providerId?: number;
  initial?: {
    name?: string | null;
    website?: string | null;
    contact_email?: string | null;
  };
}) {
  const { apiJson } = useAuth();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const listHref = paths(locale).casesProviders;
  const [name, setName] = React.useState(initial?.name ?? "");
  const [website, setWebsite] = React.useState(initial?.website ?? "");
  const [email, setEmail] = React.useState(initial?.contact_email ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (website.trim() && !isValidUrl(website.trim())) {
      setError(dict.invalidUrl);
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError(dict.invalidEmail);
      return;
    }
    setPending(true);
    try {
      const body = {
        name: name.trim(),
        website: website.trim() || null,
        contact_email: email.trim() || null,
      };
      if (providerId == null) {
        await apiJson("POST", casesPaths.dataProviders, body);
      } else {
        await apiJson("PATCH", casesPaths.dataProvider(providerId), body);
      }
      router.replace(listHref);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
      setPending(false);
    }
  }

  async function remove() {
    if (providerId == null) return;
    if (!(await confirm(dict.confirmDeleteProvider, { confirmLabel: dict.delete }))) return;
    setPending(true);
    try {
      await apiJson("DELETE", casesPaths.dataProvider(providerId));
      router.replace(listHref);
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
        <TextField label={dict.providerName} value={name} onChange={(e) => setName(e.target.value)} required disabled={pending} />
        <TextField label={dict.website} value={website} onChange={(e) => setWebsite(e.target.value)} disabled={pending} />
        <TextField label={dict.contact} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} />
        <CrudFormActions
          saveLabel={dict.save}
          cancelHref={listHref}
          cancelLabel={dict.cancel}
          pending={pending}
          saveDisabled={!name.trim()}
          deleteLabel={providerId != null ? dict.delete : undefined}
          onDelete={providerId != null ? () => void remove() : undefined}
        />
      </Stack>
    </CrudFormCard>
    {confirmDialog}
    </AccessGate>
  );
}
