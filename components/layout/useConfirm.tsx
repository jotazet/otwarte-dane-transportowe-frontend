"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type ConfirmOptions = { title?: string; confirmLabel?: string; danger?: boolean };

/**
 * Promise-owy dialog potwierdzenia oparty na MUI — zamiennik natywnego `window.confirm()`.
 * Użycie:
 *   const { confirm, confirmDialog } = useConfirm({ confirm: dict.yes, cancel: dict.cancel });
 *   if (!(await confirm(dict.confirmDeleteX, { confirmLabel: dict.delete }))) return;
 *   ...
 *   return (<>{...}{confirmDialog}</>);
 */
export function useConfirm(labels: { confirm: string; cancel: string }) {
  const [state, setState] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  }>({ open: false, message: "", confirmLabel: labels.confirm, danger: true });

  const titleId = React.useId();
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback(
    (message: string, opts?: ConfirmOptions) => {
      setState({
        open: true,
        title: opts?.title,
        message,
        confirmLabel: opts?.confirmLabel ?? labels.confirm,
        danger: opts?.danger ?? true,
      });
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [labels.confirm],
  );

  const settle = React.useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const confirmDialog = (
    <Dialog
      open={state.open}
      onClose={() => settle(false)}
      maxWidth="xs"
      fullWidth
      aria-labelledby={state.title ? titleId : undefined}
    >
      {state.title ? <DialogTitle id={titleId}>{state.title}</DialogTitle> : null}
      <DialogContent>
        <DialogContentText>{state.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => settle(false)}>{labels.cancel}</Button>
        <Button
          color={state.danger ? "error" : "primary"}
          variant="contained"
          onClick={() => settle(true)}
          autoFocus
        >
          {state.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, confirmDialog };
}
