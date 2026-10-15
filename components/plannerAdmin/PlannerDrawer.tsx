"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MdClose } from "react-icons/md";

import { codeBlockSx } from "@/lib/ui/codeSx";

/** The panel's side sheet: a title, a close button and sections below. */
export function PlannerDrawer({
  open,
  onClose,
  title,
  subtitle,
  closeLabel,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  closeLabel: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-labelledby": "planner-drawer-title",
          sx: { width: { xs: "100%", sm: wide ? 600 : 460 } },
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "flex-start", px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            component="h2"
            id="planner-drawer-title"
            sx={{ overflowWrap: "anywhere" }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Tooltip title={closeLabel}>
          <IconButton onClick={onClose} aria-label={closeLabel} edge="end">
            <MdClose aria-hidden />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack spacing={3} sx={{ px: 3, py: 2.5 }}>
        {children}
      </Stack>
    </Drawer>
  );
}

/** A titled group inside a drawer. */
export function DrawerSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Stack component="section" spacing={1.25}>
      {title ? (
        <Typography
          variant="overline"
          component="h3"
          color="text.secondary"
          sx={{ lineHeight: 1.6, letterSpacing: "0.06em" }}
        >
          {title}
        </Typography>
      ) : null}
      {children}
    </Stack>
  );
}

/** OTP's own log output, shown verbatim: the backend does not translate it. */
export function OtpLog({ text, label }: { text: string; label: string }) {
  if (!text) return null;
  return (
    <>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box
        component="pre"
        tabIndex={0}
        sx={(theme) => ({
          ...codeBlockSx(theme),
          m: 0,
          p: 1.5,
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          maxHeight: 180,
          overflow: "auto",
        })}
      >
        {text}
      </Box>
    </>
  );
}
