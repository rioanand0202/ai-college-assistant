"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { createAppTheme } from "@/lib/theme";
import StoreProvider from "./StoreProvider";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeContext";
import { SnackbarProvider } from "./SnackbarContext";

function MuiThemeBridge({ children }) {
  const { mode } = useThemeMode();
  const theme = createAppTheme(mode);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function AppProviders({ children }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <StoreProvider>
        <ThemeModeProvider>
          <MuiThemeBridge>
            <SnackbarProvider>{children}</SnackbarProvider>
          </MuiThemeBridge>
        </ThemeModeProvider>
      </StoreProvider>
    </AppRouterCacheProvider>
  );
}
