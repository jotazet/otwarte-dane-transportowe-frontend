import { createTheme } from "@mui/material/styles";

/** Google-style blue aligned with Flutter `AppTheme` (`#1A73E8`). */
export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1A73E8",
    },
    secondary: {
      main: "#174EA6",
    },
    background: {
      default: "#F8FAFD",
      paper: "#FFFFFF",
    },
    divider: "#DADCE0",
    text: {
      primary: "#202124",
      secondary: "#5F6368",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
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
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#202124",
          boxShadow: "none",
          borderBottom: "1px solid #DADCE0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #DADCE0",
          boxShadow: "none",
        },
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
  },
});
