"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import type { Dictionary } from "@/i18n/getDictionary";

export function PauseFetchDialog({
  open,
  feedName,
  busy,
  dict,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  feedName: string;
  busy: boolean;
  dict: Dictionary;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    void (async () => {
      setReason("");
    })();
  }, [open]);

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{dict.fetchPauseDialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {feedName} — {dict.fetchPauseDialogHint}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label={dict.fetchPauseReasonLabel}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {dict.cancel}
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => onConfirm(reason.trim())}
          disabled={busy}
        >
          {dict.fetchPause}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
