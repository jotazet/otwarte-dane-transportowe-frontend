"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { FormActions } from "@/components/layout/FormActions";

export function CrudFormActions({
  saveLabel,
  cancelHref,
  cancelLabel,
  pending,
  saveDisabled,
  deleteLabel,
  onDelete,
  hint,
}: {
  saveLabel: string;
  cancelHref: string;
  cancelLabel: string;
  pending: boolean;
  saveDisabled?: boolean;
  deleteLabel?: string;
  onDelete?: () => void;
  hint?: string;
}) {
  return (
    <>
      <FormActions>
        <Button type="submit" variant="contained" disabled={pending || saveDisabled}>
          {saveLabel}
        </Button>
        <Button component={NextLink} href={cancelHref} prefetch={false} disabled={pending}>
          {cancelLabel}
        </Button>
        {onDelete && deleteLabel ? (
          <Button
            color="error"
            variant="outlined"
            type="button"
            onClick={onDelete}
            disabled={pending}
          >
            {deleteLabel}
          </Button>
        ) : null}
      </FormActions>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </>
  );
}
