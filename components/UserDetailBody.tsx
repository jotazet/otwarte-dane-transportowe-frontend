"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { AccessGate } from "@/components/AccessGate";
import { GeneratedPasswordDialog } from "@/components/GeneratedPasswordDialog";
import { DetailField } from "@/components/layout/DetailField";
import { useConfirm } from "@/components/layout/useConfirm";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { UserForm } from "@/components/UserForm";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  userDetailPath,
  userResetPasswordPath,
  type UserDetail,
  type UserWithGeneratedPassword,
} from "@/lib/api/users";
import { formatRole } from "@/lib/auth/roleLabels";
import { paths } from "@/lib/nav/routes";
import { formatApiError } from "@/lib/formatApiError";
import { text } from "@/lib/format";

function DetailChips({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {children}
      </Stack>
    </Stack>
  );
}

export function UserDetailBody({
  locale,
  dict,
  userId,
}: {
  locale: string;
  dict: Dictionary;
  userId: number;
}) {
  const auth = useAuth();
  const router = useRouter();
  const p = paths(locale);
  const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auth.apiJson<UserDetail>("GET", userDetailPath(userId));
      setUser(data);
    } catch (err) {
      setError(formatApiError(err, dict));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [auth, userId]);

  React.useEffect(() => {
    if (auth.status !== "authenticated") return;
    void (async () => {
      await load();
    })();
  }, [auth.status, load]);

  const isSelf = auth.status === "authenticated" && auth.user.userId === userId;

  async function resetPassword() {
    if (!(await confirm(dict.confirmResetPassword, { danger: false }))) return;
    setPending(true);
    setError(null);
    try {
      const res = await auth.apiJson<UserWithGeneratedPassword>(
        "POST",
        userResetPasswordPath(userId),
        {},
      );
      if (res.generated_password) {
        setGeneratedPassword(res.generated_password);
        setPasswordDialogOpen(true);
      }
    } catch (err) {
      setError(formatApiError(err, dict));
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!(await confirm(dict.confirmDeleteUser, { confirmLabel: dict.delete }))) return;
    setPending(true);
    setError(null);
    try {
      await auth.apiJson("DELETE", userDetailPath(userId));
      router.replace(p.users);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err, dict));
      setPending(false);
    }
  }

  if (loading) {
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
        <LoadingBlock />
      </AccessGate>
    );
  }

  if (!user) {
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
        {error ? <Alert severity="error">{error}</Alert> : null}
        {confirmDialog}
      </AccessGate>
    );
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
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label={dict.username} value={text(user.username)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label={dict.email} value={text(user.email)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label={dict.firstName} value={text(user.first_name)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label={dict.lastName} value={text(user.last_name)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailChips label={dict.accountStatus}>
                  <Chip
                    size="small"
                    color={user.is_active ? "success" : "error"}
                    label={user.is_active ? dict.userActive : dict.userInactive}
                  />
                </DetailChips>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailChips label={dict.userRoles}>
                  {user.roles.length ? (
                    user.roles.map((r) => <Chip key={r} size="small" label={formatRole(r, dict)} />)
                  ) : (
                    <Chip size="small" label="-" />
                  )}
                </DetailChips>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => void resetPassword()} disabled={pending}>
            {dict.resetPassword}
          </Button>
          {!isSelf ? (
            <Button
              color="error"
              variant="outlined"
              onClick={() => void remove()}
              disabled={pending}
            >
              {dict.delete}
            </Button>
          ) : null}
        </Stack>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {dict.edit}
            </Typography>
            <UserForm
              locale={locale}
              dict={dict}
              userId={userId}
              initial={user}
              cancelHref={p.users}
              onSaved={() => void load()}
            />
          </CardContent>
        </Card>

        <GeneratedPasswordDialog
          open={passwordDialogOpen}
          password={generatedPassword}
          onClose={() => {
            setPasswordDialogOpen(false);
            setGeneratedPassword(null);
          }}
          dict={dict}
        />
        {confirmDialog}
      </Stack>
    </AccessGate>
  );
}
