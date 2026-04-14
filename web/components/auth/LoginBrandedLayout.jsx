"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Box,
  Chip,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import LampThemeSwitcher from "@/components/theme/LampThemeSwitcher";

export default function LoginBrandedLayout({ children }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      className="min-h-screen flex flex-col"
      sx={{
        bgcolor: "background.default",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2 },
        position: "relative",
        transition: "background-color 0.45s ease",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 1120,
          width: "100%",
          mx: "auto",
          borderRadius: { xs: 3, md: 4 },
          overflow: "visible",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          border: 1,
          borderColor: "divider",
          position: "relative",
          transition:
            "background-color 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease",
        }}
      >
        <LampThemeSwitcher />

        <Box
          sx={{
            flex: { lg: "1 1 52%" },
            minWidth: 0,
            background: isLight
              ? "linear-gradient(165deg, #fdf8f3 0%, #f5ebe0 45%, #f0e4d8 100%)"
              : "linear-gradient(165deg, #252220 0%, #1e1c1a 50%, #181615 100%)",
            p: { xs: 2.5, sm: 3, md: 4 },
            pt: { xs: 5, sm: 4 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 2,
            transition: "background 0.55s ease",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                height: 32,
                px: 1.25,
                borderRadius: 999,
                bgcolor: isLight ? "rgba(200,76,49,0.12)" : "rgba(200,76,49,0.2)",
              }}
            >
              <Image
                src="/aiIcon.png"
                alt=""
                width={12}
                height={12}
                style={{ objectFit: "contain" }}
              />
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "primary.main",
                  lineHeight: 1,
                }}
              >
                AI-Powered Education
              </Typography>
            </Box>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontWeight: 800,
                lineHeight: 1.15,
                color: "text.primary",
                fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2.125rem" },
              }}
            >
              Turn Notes into{" "}
              <Box component="span" sx={{ color: "primary.main" }}>
                Smart Learning
              </Box>{" "}
              with AI
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                color: "text.secondary",
                maxWidth: 420,
                lineHeight: 1.6,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              }}
            >
              Upload study materials and let our AI engine help your students learn faster, deeper,
              and better.
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              width: "100%",
              minHeight: { xs: 220, sm: 260, md: 300 },
              maxHeight: { xs: 280, md: 360 },
              mx: "auto",
              flex: { xs: "0 0 auto", lg: 1 },
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <Tooltip
              title="Open the public AI search — try the assistant without college login"
              placement="top"
              arrow
            >
              <Paper
                component={Link}
                href="/"
                prefetch
                elevation={3}
                sx={{
                  position: "absolute",
                  left: { xs: "2%", sm: "8%" },
                  top: { xs: "12%", sm: "18%" },
                  zIndex: 1,
                  p: 1.25,
                  pr: 1.5,
                  borderRadius: 2,
                  maxWidth: smDown ? 150 : 168,
                  bgcolor: "background.paper",
                  display: { xs: "none", sm: "flex" },
                  flexDirection: "column",
                  gap: 0.5,
                  alignItems: "flex-start",
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 8,
                    bgcolor: isLight ? "rgba(255,255,255,0.98)" : "rgba(48,48,48,0.98)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 2,
                  },
                }}
                aria-label="Open public AI search assistant"
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PictureAsPdfIcon sx={{ color: "error.main", fontSize: 28 }} />
                  <Typography variant="caption" fontWeight={700} noWrap>
                    Neural-Network.pdf
                  </Typography>
                </Box>
                <Chip
                  label="Try public AI →"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.65rem" }}
                />
              </Paper>
            </Tooltip>

            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                right: { xs: "2%", sm: "6%" },
                top: { xs: "8%", sm: "12%" },
                zIndex: 1,
                p: 1.25,
                borderRadius: 2,
                maxWidth: smDown ? 200 : 220,
                bgcolor: "background.paper",
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <SmartToyIcon sx={{ color: "primary.main", fontSize: 26, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                Quantum entanglement occurs when particles interact...
              </Typography>
            </Paper>

            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 200, sm: 240, md: 280 },
                maxWidth: 380,
                mx: "auto",
              }}
            >
              <Image
                src="/bookBG-img.png"
                alt=""
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 900px) 85vw, 380px"
                priority
              />
            </Box>

            <Chip
              label="● Generating Insights"
              size="small"
              sx={{
                position: "absolute",
                bottom: { xs: 4, sm: 8 },
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: isLight ? "rgba(255,255,255,0.92)" : "rgba(40,40,40,0.9)",
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flex: { lg: "1 1 48%" },
            minWidth: 0,
            bgcolor: "background.paper",
            p: { xs: 2.5, sm: 3, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>{children}</Box>
        </Box>
      </Paper>
    </Box>
  );
}
