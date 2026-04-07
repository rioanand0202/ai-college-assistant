"use client";

import Image from "next/image";
import { Box, Typography, useTheme } from "@mui/material";

export default function AuthSplitLayout({ eyebrow, title, subtitle, children }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  return (
    <Box className="min-h-screen flex flex-col lg:flex-row">
      <Box
        className="relative lg:w-[46%] xl:w-[48%] min-h-[220px] lg:min-h-screen overflow-hidden"
        sx={{
          bgcolor: isLight ? "secondary.main" : "background.paper",
        }}
      >
        <Image
          src="/hero-art.png"
          alt=""
          fill
          priority
          className="object-cover opacity-95"
          sizes="(max-width: 1024px) 100vw, 48vw"
        />
        <Box
          className="absolute inset-0"
          sx={{
            background: isLight
              ? "linear-gradient(135deg, rgba(242,232,223,0.15) 0%, rgba(200,76,49,0.18) 100%)"
              : "linear-gradient(135deg, rgba(18,18,18,0.2) 0%, rgba(200,76,49,0.25) 100%)",
          }}
        />
        <Box className="relative z-[1] p-8 lg:p-12 flex flex-col justify-end min-h-[220px] lg:min-h-screen">
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
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
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
