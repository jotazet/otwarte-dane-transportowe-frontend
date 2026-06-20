"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import type { Dictionary } from "@/i18n/getDictionary";

export function GeneratedPasswordDialog({
  open,
  password,
  onClose,
  dict,
}: {
  open: boolean;
  password: string | null;
  onClose: () => void;
  dict: Dictionary;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dict.generatedPasswordTitle}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {dict.generatedPasswordHint}
        </Alert>
        <TextField
          fullWidth
          label={dict.password}
          value={password ?? ""}
          slotProps={{ input: { readOnly: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => void copy()} disabled={!password}>
          {copied ? dict.copiedPassword : dict.copyPassword}
        </Button>
        <Button variant="contained" onClick={onClose}>
          {dict.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
