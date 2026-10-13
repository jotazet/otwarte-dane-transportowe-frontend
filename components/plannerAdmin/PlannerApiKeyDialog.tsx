"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MdCheck, MdContentCopy } from "react-icons/md";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { ApiError } from "@/lib/api/http";
import {
  LIMIT_GROUPS,
  plannerAdminPaths,
  type CreatedApiKey,
  type LimitGroup,
} from "@/lib/api/plannerAdmin";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

type Draft = { name: string; email: string; note: string; limits: Record<LimitGroup, string> };

const EMPTY: Draft = {
  name: "",
  email: "",
  note: "",
  limits: { plan: "", realtime: "", lookup: "" },
};

/** Creates a key and shows the plain key once; the backend keeps only its hash. */
export function PlannerApiKeyDialog({
  ctx,
  open,
  onClose,
  onCreated,
}: {
  ctx: PlannerAdminContext;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { dict } = ctx;
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [created, setCreated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const nameMissing = !draft.name.trim();
  const badLimit = LIMIT_GROUPS.some(
    (g) => draft.limits[g].trim() && !/^[1-9]\d*$/.test(draft.limits[g].trim()),
  );

  const reset = () => {
    setDraft(EMPTY);
    setCreated(null);
    setCopied(false);
    setTouched(false);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameMissing || badLimit) return;
    setSending(true);
    setError(null);
    try {
      const key = await ctx.apiJson<CreatedApiKey>("POST", plannerAdminPaths.apiKeys, {
        name: draft.name.trim(),
        contact_email: draft.email.trim(),
        note: draft.note.trim(),
        ...Object.fromEntries(
          LIMIT_GROUPS.map((g) => [
            `${g}_per_minute`,
            draft.limits[g].trim() ? Number(draft.limits[g]) : null,
          ]),
        ),
      });
      setCreated(key.key);
      onCreated();
    } catch (err) {
      // A 400 is a field error (e-mail or limits), sent without a code.
      setError(
        err instanceof ApiError && err.status === 400
          ? dict.plannerAdminKeyCreateFailed
          : plannerErrorMessage(err, dict),
      );
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
    } catch {
      // Clipboard refused: the key stays visible and selectable.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={created ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ transition: { onEnter: reset } }}
    >
      {created ? (
        <>
          <DialogTitle>{dict.plannerAdminKeyCreatedTitle}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="warning">{dict.plannerAdminKeyCreatedWarning}</Alert>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  pl: 1.5,
                  pr: 0.5,
                  py: 0.5,
                }}
              >
                <Box
                  component="code"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: MONOSPACE_FONT,
                    overflowWrap: "anywhere",
                    userSelect: "all",
                  }}
                >
                  {created}
                </Box>
                <Tooltip title={copied ? dict.plannerAdminCopied : dict.plannerAdminCopyKey}>
                  <IconButton onClick={() => void copy()} aria-label={dict.plannerAdminCopyKey}>
                    {copied ? <MdCheck aria-hidden /> : <MdContentCopy aria-hidden />}
                  </IconButton>
                </Tooltip>
              </Stack>
              {copied ? (
                <Typography variant="body2" color="success.main" role="status">
                  {dict.plannerAdminCopied}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={onClose}>
              {dict.plannerAdminDone}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)} noValidate>
          <DialogTitle>{dict.plannerAdminKeyDialogTitle}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                autoFocus
                required
                label={dict.plannerAdminKeyName}
                placeholder={dict.plannerAdminKeyNamePlaceholder}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                error={touched && nameMissing}
                helperText={touched && nameMissing ? dict.plannerAdminKeyNameRequired : undefined}
              />
              <TextField
                type="email"
                label={dict.plannerAdminKeyEmail}
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                helperText={dict.plannerAdminKeyEmailHint}
              />
              <TextField
                multiline
                minRows={2}
                label={dict.plannerAdminKeyNote}
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              />
              <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
                <Typography component="legend" variant="body2" sx={{ fontWeight: 500 }}>
                  {dict.plannerAdminKeyLimits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dict.plannerAdminKeyLimitsHint}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  {LIMIT_GROUPS.map((g) => {
                    const value = draft.limits[g].trim();
                    return (
                      <TextField
                        key={g}
                        size="small"
                        label={dict.plannerAdminLimitGroupLabels[g]}
                        value={draft.limits[g]}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, limits: { ...d.limits, [g]: e.target.value } }))
                        }
                        error={Boolean(value) && !/^[1-9]\d*$/.test(value)}
                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                      />
                    );
                  })}
                </Stack>
                {badLimit ? (
                  <Typography variant="caption" color="error" component="p" sx={{ mt: 0.5 }}>
                    {dict.plannerAdminLimitsInvalid}
                  </Typography>
                ) : null}
              </Box>
              {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{dict.cancel}</Button>
            <Button type="submit" variant="contained" disabled={sending}>
              {dict.plannerAdminKeyCreate}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
