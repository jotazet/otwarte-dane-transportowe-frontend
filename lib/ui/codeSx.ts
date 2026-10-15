import type { Theme } from "@mui/material/styles";

import { mutedPanelSx } from "@/lib/ui/tableSx";

/** Font stack for code, URLs and identifiers. */
export const MONOSPACE_FONT = 'ui-monospace, "Roboto Mono", Menlo, Consolas, monospace';

/** Monospace text on the muted panel: code samples, URLs and raw API responses. */
export function codeBlockSx(theme: Theme) {
  return {
    ...mutedPanelSx(theme),
    typography: "body2",
    fontFamily: MONOSPACE_FONT,
    borderRadius: 1,
  };
}
