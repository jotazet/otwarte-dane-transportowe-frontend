"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { COLOR_MODE_STORAGE_KEY } from "@/lib/theme/colorMode";
import { appTheme } from "@/theme";

export function ThemeRegistry({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /** Content-Security-Policy nonce for Emotion's <style> elements. */
  nonce?: string;
}) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", nonce }}>
      <ThemeProvider
        theme={appTheme}
        defaultMode="light"
        // No `disableTransitionOnChange`: the theme has no transitions, and the <style> it
        // inserts carries no nonce, so it would break the Content-Security-Policy (ADR 0008).
        modeStorageKey={COLOR_MODE_STORAGE_KEY}
      >
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
