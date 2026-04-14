"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * Route transition loader aligned with app theme (cream / terracotta, dark mode).
 * @param {{ compact?: boolean }} props — `compact` fits inside shells (admin/staff); default is full viewport.
 */
export default function RouteThemeLoader({ compact = false }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  return (
    <Box
      aria-busy="true"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? "min(72vh, 640px)" : "100dvh",
        width: "100%",
        gap: 2,
        px: 2,
        bgcolor: "background.default",
        background: isLight
          ? "radial-gradient(ellipse 85% 55% at 50% 35%, rgba(200, 76, 49, 0.09) 0%, transparent 58%), linear-gradient(165deg, #fdf8f3 0%, #f5ebe0 45%, #f0e4d8 100%)"
          : "radial-gradient(ellipse 85% 55% at 50% 35%, rgba(200, 76, 49, 0.14) 0%, transparent 55%), linear-gradient(165deg, #1a1816 0%, #141210 50%, #121212 100%)",
      }}
    >
      <CircularProgress
        size={48}
        thickness={4}
        sx={{
          color: "primary.main",
          filter: isLight ? "none" : "drop-shadow(0 0 12px rgba(200,76,49,0.35))",
        }}
      />
      <Typography variant="body2" color="text.secondary" fontWeight={700} letterSpacing="0.04em">
        Loading…
      </Typography>
    </Box>
  );
}
