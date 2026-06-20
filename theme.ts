import { createTheme } from "@mui/material/styles";

function paletteScheme(isLight: boolean) {
  return {
    palette: {
      primary: {
        main: "#1A73E8",
      },
      secondary: {
        main: isLight ? "#174EA6" : "#8AB4F8",
      },
      background: {
        default: isLight ? "#F8FAFD" : "#121212",
        paper: isLight ? "#FFFFFF" : "#1E1E1E",
      },
      divider: isLight ? "#DADCE0" : "#3C4043",
      text: {
        primary: isLight ? "#202124" : "#E8EAED",
        secondary: isLight ? "#5F6368" : "#9AA0A6",
      },
    },
  };
}

const sharedTypography = {
  fontFamily: [
    "var(--font-roboto)",
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: { fontWeight: 500 },
  h2: { fontWeight: 500 },
  h3: { fontWeight: 500 },
  h4: { fontWeight: 500 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
} as const;

const sharedComponents = {
  MuiDialog: {
    defaultProps: {
      disableScrollLock: true,
    },
  },
  MuiDrawer: {
    defaultProps: {
      disableScrollLock: true,
    },
  },
  MuiPopover: {
    defaultProps: {
      disableScrollLock: true,
      disablePortal: true,
      transitionDuration: 0,
    },
    styleOverrides: {
      paper: {
        transition: "none",
      },
    },
  },
  MuiMenu: {
    defaultProps: {
      disableScrollLock: true,
      disablePortal: true,
      transitionDuration: 0,
    },
    styleOverrides: {
      paper: ({ theme }: { theme: ReturnType<typeof createTheme> }) => ({
        transition: "none",
        borderRadius: 12,
        border: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
        maxHeight: 320,
        ...theme.applyStyles("light", {
          boxShadow: "0 4px 12px rgba(32, 33, 36, 0.12)",
        }),
        ...theme.applyStyles("dark", {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
        }),
      }),
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 34,
        fontSize: "0.9375rem",
      },
    },
  },
  MuiSelect: {
    defaultProps: {
      MenuProps: {
        disablePortal: false,
        disableScrollLock: true,
        transitionDuration: 0,
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
        slotProps: {
          paper: {
            sx: { maxHeight: "min(280px, 40vh)", overflow: "auto" },
          },
        },
      },
    },
    styleOverrides: {
      select: {
        cursor: "pointer",
      },
    },
  },
  MuiAutocomplete: {
    defaultProps: {
      disablePortal: true,
      slotProps: {
        listbox: {
          sx: { maxHeight: "min(280px, 40vh)", overflow: "auto" },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }: { theme: ReturnType<typeof createTheme> }) => ({
        backgroundColor: theme.vars?.palette.background.paper ?? theme.palette.background.paper,
        color: theme.vars?.palette.text.primary ?? theme.palette.text.primary,
        boxShadow: "none",
        borderBottom: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }: { theme: ReturnType<typeof createTheme> }) => ({
        borderRadius: 16,
        border: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
        boxShadow: "none",
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: 24,
        fontWeight: 600,
      },
    },
  },
} as const;

/** Google-style blue aligned with Flutter `AppTheme` (`#1A73E8`). */
export const appTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: '[data-color-mode="%s"]',
  },
  colorSchemes: {
    light: paletteScheme(true),
    dark: paletteScheme(false),
  },
  shape: {
    borderRadius: 12,
  },
  typography: sharedTypography,
  components: sharedComponents,
});

(appTheme.components as any) ??= {};
(appTheme.components as any).MuiGrow = { defaultProps: { timeout: 0 } };
(appTheme.components as any).MuiFade = { defaultProps: { timeout: 0 } };
(appTheme.components as any).MuiZoom = { defaultProps: { timeout: 0 } };
(appTheme.components as any).MuiSlide = { defaultProps: { timeout: 0 } };
(appTheme.components as any).MuiCollapse = { defaultProps: { timeout: 0 } };
