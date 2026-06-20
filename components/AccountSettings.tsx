"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { DetailField } from "@/components/layout/DetailField";
import { FormSection } from "@/components/layout/FormSection";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  USER_ME,
  USER_ME_CHANGE_EMAIL,
  USER_ME_CHANGE_PASSWORD,
  type ChangeEmailBody,
  type ChangePasswordBody,
  type MeProfile,
} from "@/lib/api/users";
import { formatRole } from "@/lib/auth/roleLabels";

export function AccountSettings({ dict }: { dict: Dictionary }) {
  const { apiJson } = useAuth();
  const [profile, setProfile] = React.useState<MeProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [emailPassword, setEmailPassword] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [emailPending, setEmailPending] = React.useState(false);
  const [emailSuccess, setEmailSuccess] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordPending, setPasswordPending] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<MeProfile>("GET", USER_ME);
      setProfile(data);
      setNewEmail(data.email ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [apiJson]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailPending(true);
    try {
      const body: ChangeEmailBody = {
        current_password: emailPassword,
        new_email: newEmail.trim(),
      };
      await apiJson("POST", USER_ME_CHANGE_EMAIL, body);
      setEmailPassword("");
      setEmailSuccess(dict.emailChanged);
      await loadProfile();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailPending(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(dict.passwordMismatch);
      return;
    }
    setPasswordPending(true);
    try {
      const body: ChangePasswordBody = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await apiJson("POST", USER_ME_CHANGE_PASSWORD, body);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(dict.passwordChanged);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : String(err));
    } finally {
      setPasswordPending(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!profile) return null;

  return (
    <Stack spacing={3}>
      <FormSection title={dict.profileSection}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label={dict.username} value={profile.username} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label={dict.email} value={profile.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label={dict.firstName} value={profile.first_name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label={dict.lastName} value={profile.last_name} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {dict.userRoles}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
              {profile.roles.map((r) => (
                <Chip key={r} size="small" label={formatRole(r, dict)} />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title={dict.changeEmail}>
        {emailSuccess ? <Alert severity="success" sx={{ mb: 2 }}>{emailSuccess}</Alert> : null}
        {emailError ? <Alert severity="error" sx={{ mb: 2 }}>{emailError}</Alert> : null}
        <Box component="form" onSubmit={submitEmail} noValidate>
          <Stack spacing={2}>
            <TextField
              type="password"
              label={dict.currentPassword}
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              disabled={emailPending}
              autoComplete="current-password"
            />
            <TextField
              type="email"
              label={dict.newEmail}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              disabled={emailPending}
              autoComplete="email"
            />
            <Button type="submit" variant="contained" disabled={emailPending}>
              {dict.save}
            </Button>
          </Stack>
        </Box>
      </FormSection>

      <FormSection title={dict.changePassword}>
        {passwordSuccess ? <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert> : null}
        {passwordError ? <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert> : null}
        <Box component="form" onSubmit={submitPassword} noValidate>
          <Stack spacing={2}>
            <TextField
              type="password"
              label={dict.currentPassword}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={passwordPending}
              autoComplete="current-password"
            />
            <TextField
              type="password"
              label={dict.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={passwordPending}
              autoComplete="new-password"
            />
            <TextField
              type="password"
              label={dict.confirmPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={passwordPending}
              autoComplete="new-password"
            />
            <Button type="submit" variant="contained" disabled={passwordPending}>
              {dict.save}
            </Button>
          </Stack>
        </Box>
      </FormSection>
    </Stack>
  );
}
