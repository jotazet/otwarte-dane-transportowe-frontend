"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

/** Inline'owy komunikat o nieudanym pobraniu danych strony, z przyciskiem ponowienia. */
export function PageLoadErrorAlert({ body, retryLabel }: { body: string; retryLabel: string }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
          {retryLabel}
        </Button>
      }
    >
      {body}
    </Alert>
  );
}
