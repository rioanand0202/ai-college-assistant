"use client";

import { Box, Typography, useTheme } from "@mui/material";

/** Split layout for register / waiting: solid panel (no hero image). */
export default function AuthSplitLayout({ eyebrow, title, subtitle, children }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  return (
    <Box className="min-h-screen flex flex-col lg:flex-row">
      <Box
        className="relative lg:w-[46%] xl:w-[48%] min-h-[200px] lg:min-h-screen"
        sx={{
          bgcolor: isLight ? "secondary.main" : "background.paper",
          borderBottom: { xs: 1, lg: 0 },
          borderColor: "divider",
        }}
      >
        <Box className="p-8 lg:p-12 flex flex-col justify-center min-h-[200px] lg:min-h-screen">
          <Typography
            variant="overline"
            sx={{ letterSpacing: "0.25em", fontWeight: 800, color: "primary.main" }}
          >
            {eyebrow}
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              mt: 1,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "text.primary",
              fontSize: { xs: "1.65rem", sm: "2.1rem", md: "2.65rem" },
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" sx={{ mt: 2, maxWidth: 520, color: "text.secondary" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box
        className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8"
        sx={{ bgcolor: "background.default" }}
      >
        <Box className="w-full max-w-md">{children}</Box>
      </Box>
    </Box>
  );
}
