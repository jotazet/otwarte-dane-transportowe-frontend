"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export function ColorModeToggle({
  darkModeLabel,
  lightModeLabel,
  size = "large",
}: {
  darkModeLabel: string;
  lightModeLabel: string;
  size?: "small" | "medium" | "large";
}) {
  const { mode, setMode } = useColorScheme();
  const resolvedMode = mode === "system" ? "light" : mode;
  const isDark = resolvedMode === "dark";
  const label = isDark ? lightModeLabel : darkModeLabel;
  const iconSize = size === "small" ? 22 : 24;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setMode(isDark ? "light" : "dark")}
        color="inherit"
        size={size}
        sx={{
          flexShrink: 0,
          color: "text.primary",
          borderRadius: 2,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {isDark ? (
          <MdLightMode size={iconSize} aria-hidden />
        ) : (
          <MdDarkMode size={iconSize} aria-hidden />
        )}
      </IconButton>
    </Tooltip>
  );
}
