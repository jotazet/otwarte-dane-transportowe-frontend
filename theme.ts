import { createTheme } from "@mui/material/styles";

import { SELECT_MENU_MAX_HEIGHT } from "@/lib/ui/selectMenu";

/** Categorical chart series, in a fixed order; checked for colour-blind separation in both schemes. */
type ChartPalette = { series1: string; series2: string; series3: string; series4: string };

declare module "@mui/material/styles" {
  interface Palette {
    chart: ChartPalette;
  }
  interface PaletteOptions {
    chart?: ChartPalette;
  }
}

// Every `main` reaches 4.5:1 as text on both backgrounds of its scheme, and `contrastText`
// reaches 4.5:1 on `main` and `dark` (filled chips, contained buttons and their hover).
function paletteScheme(isLight: boolean) {
  const contrastText = isLight ? "#FFFFFF" : "#202124";
  return {
    palette: {
      // 0.2 is MUI's default. Dark text sits on dark-scheme fills, so their hover shade
      // (`dark`) must stay light.
      tonalOffset: isLight ? 0.2 : { light: 0.2, dark: 0.1 },
      primary: {
        main: isLight ? "#1967D2" : "#8AB4F8",
        contrastText,
      },
      success: {
        main: isLight ? "#2E7D32" : "#66BB6A",
        contrastText,
      },
      warning: {
        main: isLight ? "#B35000" : "#FFA726",
        contrastText,
      },
      error: {
        main: isLight ? "#D32F2F" : "#F28B82",
        contrastText,
      },
      info: {
        main: isLight ? "#0071B2" : "#29B6F6",
        contrastText,
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
      chart: {
        series1: isLight ? "#2A78D6" : "#3987E5",
        series2: isLight ? "#EDA100" : "#C98500",
        series3: isLight ? "#4A3AA7" : "#9085E9",
        series4: isLight ? "#E34948" : "#E66767",
      },
    },
  };
}

const sharedTypography = {
  fontFamily: ["var(--font-roboto)", "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"].join(","),
  h1: { fontWeight: 500 },
  h2: { fontWeight: 500 },
  h3: { fontWeight: 500 },
  h4: { fontWeight: 500 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
} as const;

const sharedComponents = {
  MuiButtonBase: {
    styleOverrides: {
      // Without the ripple MUI shows no keyboard focus at all (nav links, TableSortLabel).
      // The outline is inset so overflow containers such as the desktop nav don't clip it.
      root: ({
        ownerState,
        theme,
      }: {
        ownerState: { disableRipple?: boolean };
        theme: ReturnType<typeof createTheme>;
      }) =>
        ownerState.disableRipple
          ? {
              "&.Mui-focusVisible": {
                outline: `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`,
                outlineOffset: "-2px",
              },
            }
          : null,
    },
  },
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
  MuiSkeleton: {
    defaultProps: {
      animation: false,
    },
  },
  MuiPopover: {
    defaultProps: {
      disableScrollLock: true,
      disablePortal: true,
    },
  },
  MuiMenu: {
    defaultProps: {
      disableScrollLock: true,
      disablePortal: true,
    },
    styleOverrides: {
      paper: ({ theme }: { theme: ReturnType<typeof createTheme> }) => ({
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
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
        slotProps: {
          paper: {
            sx: { maxHeight: SELECT_MENU_MAX_HEIGHT, overflow: "auto" },
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
          sx: { maxHeight: SELECT_MENU_MAX_HEIGHT, overflow: "auto" },
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
  MuiChip: {
    styleOverrides: {
      // Roboto leaves chip text about 1 px above the middle (1.5 px in Firefox, which reads
      // the font's typo metrics); 2 px on top moves it down by 1 px.
      label: { paddingTop: 2 },
    },
  },
} as const;

// No motion: components take their timeouts from these durations (Grow, Popover and Menu
// from getAutoHeightDuration), and every CSS transition MUI generates becomes `none`.
const noMotion = {
  duration: {
    shortest: 0,
    shorter: 0,
    short: 0,
    standard: 0,
    complex: 0,
    enteringScreen: 0,
    leavingScreen: 0,
  },
  getAutoHeightDuration: () => 0,
  create: () => "none",
};

/** Google-style blues: Flutter `AppTheme`'s `#1A73E8` adjusted per scheme to meet WCAG AA. */
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
  transitions: noMotion,
  components: sharedComponents,
});
