"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type { PlannerAdminContext } from "@/components/plannerAdmin/PlannerAdminHub";
import { fill, plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { ApiError } from "@/lib/api/http";
import { plannerAdminPaths } from "@/lib/api/plannerAdmin";
import { isIpNetwork } from "@/lib/ipNetwork";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

const EXPIRY_HOURS = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30, never: null } as const;
type Expiry = keyof typeof EXPIRY_HOURS;

/** Adds an IP ban; `network` is prefilled (an address, or the /64 of an IPv6 client). */
export function PlannerBanDialog({
  ctx,
  network,
  onClose,
  onBanned,
}: {
  ctx: PlannerAdminContext;
  network: string | null;
  onClose: () => void;
  onBanned: () => void;
}) {
  const { dict } = ctx;
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [expiry, setExpiry] = React.useState<Expiry>("7d");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const invalid = !isIpNetwork(value);

  const reset = () => {
    setValue(network ?? "");
    setReason("");
    setExpiry("7d");
    setTouched(false);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSending(true);
    setError(null);
    const hours = EXPIRY_HOURS[expiry];
    try {
      await ctx.apiJson("POST", plannerAdminPaths.ipBans, {
        network: value.trim(),
        reason: reason.trim(),
        expires_at: hours === null ? null : new Date(Date.now() + hours * 3_600_000).toISOString(),
      });
      ctx.notify(fill(dict.plannerAdminBanAdded, { network: value.trim() }));
      onBanned();
      onClose();
    } catch (err) {
      // A 400 is the network field (invalid or already banned), sent without a code.
      setError(
        err instanceof ApiError && err.status === 400
          ? dict.plannerAdminBanFailed
          : plannerErrorMessage(err, dict),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={network !== null}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onEnter: reset } }}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <DialogTitle>{dict.plannerAdminBanTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              required
              label={dict.plannerAdminBanNetwork}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && invalid}
              helperText={
                touched && invalid ? dict.plannerAdminBanInvalid : dict.plannerAdminBanNetworkHint
              }
              slotProps={{ htmlInput: { style: { fontFamily: MONOSPACE_FONT } } }}
            />
            <TextField
              label={dict.plannerAdminBanReason}
              placeholder={dict.plannerAdminBanReasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <TextField
              select
              label={dict.plannerAdminBanExpires}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as Expiry)}
            >
              {(Object.keys(EXPIRY_HOURS) as Expiry[]).map((k) => (
                <MenuItem key={k} value={k}>
                  {dict.plannerAdminBanExpiryLabels[k]}
                </MenuItem>
              ))}
            </TextField>
            <DialogContentText sx={{ typography: "body2" }}>
              {dict.plannerAdminBanInfo}
            </DialogContentText>
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{dict.cancel}</Button>
          <Button type="submit" variant="contained" color="error" disabled={sending}>
            {dict.plannerAdminIpBanAddress}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
