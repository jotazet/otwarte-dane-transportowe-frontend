"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { GeneratedPasswordDialog } from "@/components/GeneratedPasswordDialog";
import { FormActions } from "@/components/layout/FormActions";
import type { Dictionary } from "@/i18n/getDictionary";
import { formatApiError } from "@/lib/formatApiError";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ALL_ASSIGNABLE_ROLES,
  USERS_BASE,
  userDetailPath,
  type CreateUserBody,
  type UpdateUserBody,
  type UserDetail,
  type UserWithGeneratedPassword,
} from "@/lib/api/users";
import type { AppRole } from "@/lib/auth/roles";
import { formatRole } from "@/lib/auth/roleLabels";
import { isValidEmail } from "@/lib/validation";
import { paths } from "@/lib/nav/routes";

export function UserForm({
  locale,
  dict,
  userId,
  initial,
  onSaved,
  cancelHref,
}: {
  locale: string;
  dict: Dictionary;
  userId?: number;
  initial?: UserDetail;
  onSaved?: () => void;
  /** Where Cancel navigates; defaults to user detail when editing, users list when creating. */
  cancelHref?: string;
}) {
  const { apiJson } = useAuth();
  const router = useRouter();
  const p = paths(locale);
  const isEdit = userId != null;

  const [username, setUsername] = React.useState(initial?.username ?? "");
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [firstName, setFirstName] = React.useState(initial?.first_name ?? "");
  const [lastName, setLastName] = React.useState(initial?.last_name ?? "");
  const [isActive, setIsActive] = React.useState(initial?.is_active ?? true);
  const [roles, setRoles] = React.useState<Set<AppRole>>(() => {
    const set = new Set<AppRole>();
    for (const r of initial?.roles ?? []) {
      if (ALL_ASSIGNABLE_ROLES.includes(r as AppRole)) set.add(r as AppRole);
    }
    return set;
  });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [createdUserId, setCreatedUserId] = React.useState<number | null>(null);

  function toggleRole(role: AppRole) {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function resetToInitial() {
    if (!initial) return;
    setEmail(initial.email ?? "");
    setFirstName(initial.first_name ?? "");
    setLastName(initial.last_name ?? "");
    setIsActive(initial.is_active ?? true);
    setRoles(() => {
      const set = new Set<AppRole>();
      for (const r of initial.roles ?? []) {
        if (ALL_ASSIGNABLE_ROLES.includes(r as AppRole)) set.add(r as AppRole);
      }
      return set;
    });
    setError(null);
  }

  function handleCancel() {
    if (cancelHref) {
      router.push(cancelHref);
      return;
    }
    if (isEdit && initial) {
      resetToInitial();
      return;
    }
    router.push(p.users);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email.trim())) {
      setError(dict.invalidEmail);
      return;
    }
    setPending(true);
    try {
      const rolesList = [...roles];
      if (isEdit) {
        const body: UpdateUserBody = {
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          is_active: isActive,
          roles: rolesList,
        };
        await apiJson("PATCH", userDetailPath(userId!), body);
        onSaved?.();
        setPending(false);
      } else {
        const body: CreateUserBody = {
          username: username.trim(),
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          roles: rolesList,
        };
        const created = await apiJson<UserWithGeneratedPassword>("POST", USERS_BASE, body);
        if (created.generated_password) {
          // Nie nawigujemy od razu — dialog z hasłem musi pozostać do zamknięcia,
          // inaczej jednorazowe hasło przepada wraz z przeładowaniem trasy.
          setCreatedUserId(created.id);
          setGeneratedPassword(created.generated_password);
          setPasswordDialogOpen(true);
          setPending(false);
        } else {
          router.replace(p.user(created.id));
          router.refresh();
        }
      }
    } catch (err) {
      setError(formatApiError(err, dict));
      setPending(false);
    }
  }

  function closePasswordDialog() {
    setPasswordDialogOpen(false);
    setGeneratedPassword(null);
    if (!isEdit && createdUserId != null) {
      router.replace(p.user(createdUserId));
      router.refresh();
    }
  }

  return (
    <AccessGate
      roles={["Admin"]}
      mode="empty"
      locale={locale}
      dict={{
        requiresLogin: dict.requiresLogin,
        login: dict.login,
        forbidden: dict.forbidden,
        home: dict.home,
      }}
    >
      <>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Box component="form" onSubmit={save} noValidate>
          <Stack spacing={2}>
            <TextField
              label={dict.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={pending || isEdit}
            />
            <TextField
              label={dict.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
            />
            <TextField
              label={dict.firstName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={pending}
            />
            <TextField
              label={dict.lastName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={pending}
            />
            {isEdit ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={pending}
                  />
                }
                label={dict.isActive}
              />
            ) : null}
            <FormGroup>
              {ALL_ASSIGNABLE_ROLES.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={roles.has(role)}
                      onChange={() => toggleRole(role)}
                      disabled={pending}
                    />
                  }
                  label={formatRole(role, dict)}
                />
              ))}
            </FormGroup>
            <FormActions>
              <Button
                type="submit"
                variant="contained"
                disabled={pending || (!isEdit && !username.trim())}
              >
                {dict.save}
              </Button>
              <Button type="button" variant="outlined" onClick={handleCancel} disabled={pending}>
                {dict.cancel}
              </Button>
            </FormActions>
          </Stack>
        </Box>
        <GeneratedPasswordDialog
          open={passwordDialogOpen}
          password={generatedPassword}
          onClose={closePasswordDialog}
          dict={dict}
        />
      </>
    </AccessGate>
  );
}
