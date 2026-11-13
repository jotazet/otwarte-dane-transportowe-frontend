"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import type { Dictionary } from "@/i18n/getDictionary";
import { redactUrls } from "@/lib/redactUrls";
import { MONOSPACE_FONT } from "@/lib/ui/codeSx";

/**
 * Untranslated backend text (an exception message, the GTFS validator's English text) behind a
 * toggle. Render it for Admins only; everyone else sees just the translated summary.
 */
export function TechnicalDetails({
  text,
  dict,
}: {
  text: string;
  dict: Pick<Dictionary, "technicalDetailsShow" | "technicalDetailsHide">;
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return (
    <Box>
      <Button
        size="small"
        variant="text"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        sx={{ px: 0.5, minWidth: 0, textTransform: "none" }}
      >
        {open ? dict.technicalDetailsHide : dict.technicalDetailsShow}
      </Button>
      <Box
        id={id}
        hidden={!open}
        sx={{
          typography: "body2",
          color: "text.secondary",
          fontFamily: MONOSPACE_FONT,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {redactUrls(text)}
      </Box>
    </Box>
  );
}
