"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { InlineSelect } from "@/components/InlineSelect";
import { CrudFormActions } from "@/components/layout/CrudFormActions";
import { CrudFormCard } from "@/components/layout/CrudFormCard";
import { useConfirm } from "@/components/layout/useConfirm";
import type { Dictionary } from "@/i18n/getDictionary";
import { casesPaths } from "@/lib/api/cases";
import { CASE_STATUS_VALUES, caseStatusLabel } from "@/lib/cases/statusChoices";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatApiError } from "@/lib/formatApiError";
import { paths } from "@/lib/nav/routes";

export function CaseStatusForm({
  locale,
  dict,
  organizationId,
  statusId,
  initialStatus,
  initialDescription,
}: {
  locale: string;
  dict: Dictionary;
  organizationId: number;
  statusId?: number;
  initialStatus?: string;
  initialDescription?: string | null;
}) {
  const { apiJson } = useAuth();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const cancelHref = paths(locale).casesOrg(organizationId);
  const [status, setStatus] = React.useState(initialStatus ?? "none");
  const [description, setDescription] = React.useState(initialDescription ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = {
        case: organizationId,
        status,
        description: description.trim() || null,
      };
      if (statusId == null) {
        await apiJson("POST", casesPaths.caseStatuses, body);
      } else {
        await apiJson("PATCH", casesPaths.caseStatus(statusId), {
          status,
          description: description.trim() || null,
        });
      }
      router.replace(cancelHref);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
      setPending(false);
    }
  }

  async function remove() {
    if (statusId == null) return;
    if (!(await confirm(dict.confirmDeleteStatus, { confirmLabel: dict.delete }))) return;
    setPending(true);
    try {
      await apiJson("DELETE", casesPaths.caseStatus(statusId));
      router.replace(cancelHref);
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
        <InlineSelect
          fullWidth
          disabled={pending}
          label={dict.latestStatus}
          value={status}
          onChange={setStatus}
          options={CASE_STATUS_VALUES.map((v) => ({ value: v, label: caseStatusLabel(v, dict.caseStatusLabels) }))}
        />
        <TextField
          label={dict.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
          disabled={pending}
        />
        <CrudFormActions
          saveLabel={dict.save}
          cancelHref={cancelHref}
          cancelLabel={dict.cancel}
          pending={pending}
          deleteLabel={statusId != null ? dict.delete : undefined}
          onDelete={statusId != null ? () => void remove() : undefined}
        />
      </Stack>
    </CrudFormCard>
    {confirmDialog}
    </AccessGate>
  );
}
