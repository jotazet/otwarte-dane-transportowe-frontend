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
import { plannerErrorMessage } from "@/components/plannerAdmin/shared";
import { ApiError } from "@/lib/api/http";
import { isBanActive, plannerAdminPaths, type IpBan } from "@/lib/api/plannerAdmin";
import { formatDateTime } from "@/lib/format";
import { isIpNetwork } from "@/lib/ipNetwork";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";
import { fill } from "@/lib/i18n/fill";

const EXPIRY_HOURS = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30, never: null } as const;
type Expiry = keyof typeof EXPIRY_HOURS | "keep";

/**
 * Adds an IP ban, with `network` prefilled (an address, or the /64 of an IPv6 client), or edits
 * `ban`. An expired ban opens with a new expiry, so saving renews it.
 */
export function PlannerBanDialog({
  ctx,
  network,
  ban = null,
  onClose,
  onBanned,
}: {
  ctx: PlannerAdminContext;
  network: string | null;
  ban?: IpBan | null;
  onClose: () => void;
  onBanned: () => void;
}) {
  const { dict, locale } = ctx;
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [expiry, setExpiry] = React.useState<Expiry>("7d");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const invalid = !isIpNetwork(value);

  const reset = () => {
    setValue(ban?.network ?? network ?? "");
    setReason(ban?.reason ?? "");
    setExpiry(ban && isBanActive(ban) ? "keep" : "7d");
    setTouched(false);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSending(true);
    setError(null);
    const body: Record<string, string | null> = { network: value.trim(), reason: reason.trim() };
    if (expiry !== "keep") {
      const hours = EXPIRY_HOURS[expiry];
      body.expires_at =
        hours === null ? null : new Date(Date.now() + hours * 3_600_000).toISOString();
    }
    try {
      if (ban) {
        await ctx.apiJson("PATCH", plannerAdminPaths.ipBan(ban.id), body);
        ctx.notify(fill(dict.plannerAdminBanSaved, { network: value.trim() }));
      } else {
        await ctx.apiJson("POST", plannerAdminPaths.ipBans, body);
        ctx.notify(fill(dict.plannerAdminBanAdded, { network: value.trim() }));
      }
      onBanned();
      onClose();
    } catch (err) {
      // A 400 is the network field (invalid or already banned), sent without a code.
      setError(
        err instanceof ApiError && err.status === 400
          ? ban
            ? dict.plannerAdminBanSaveFailed
            : dict.plannerAdminBanFailed
          : plannerErrorMessage(err, dict),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={network !== null || ban !== null}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onEnter: reset } }}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <DialogTitle>{ban ? dict.plannerAdminBanEditTitle : dict.plannerAdminBanTitle}</DialogTitle>
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
              {ban && isBanActive(ban) ? (
                <MenuItem value="keep">
                  {fill(dict.plannerAdminBanExpiryKeep, {
                    date: ban.expires_at
                      ? formatDateTime(ban.expires_at, locale)
                      : dict.plannerAdminBanNoExpiry,
                  })}
                </MenuItem>
              ) : null}
              {(Object.keys(EXPIRY_HOURS) as (keyof typeof EXPIRY_HOURS)[]).map((k) => (
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
            {ban ? dict.plannerAdminBanSave : dict.plannerAdminIpBanAddress}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
