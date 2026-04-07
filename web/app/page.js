"use client";

import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useThemeMode } from "@/components/providers/ThemeModeContext";
import PublicChat from "@/components/public/PublicChat";
import { getPublicToken, getPublicUser } from "@/lib/publicAuth";

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

const HISTORY_TOOLTIP_TEXT =
  "Login to save your chat history across devices. This tab keeps a temporary transcript until you close it.";

function PublicDecorBackground({ isLight }) {
  const sparkles = [
    { t: "12%", l: "18%", d: 0 },
    { t: "22%", l: "72%", d: 1.2 },
    { t: "38%", l: "45%", d: 0.6 },
    { t: "55%", l: "12%", d: 1.8 },
    { t: "68%", l: "88%", d: 0.3 },
    { t: "78%", l: "52%", d: 2.1 },
  ];

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        bgcolor: "background.default",
        background: isLight
          ? "linear-gradient(165deg, #fdf8f3 0%, #f5ebe0 38%, #f0e4d8 72%, #f2e8df 100%)"
          : "linear-gradient(165deg, #1a1816 0%, #141210 50%, #121212 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "8%",
          right: "10%",
          width: { xs: 200, md: 320 },
          height: { xs: 200, md: 320 },
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(circle, rgba(200,76,49,0.16) 0%, transparent 72%)"
            : "radial-gradient(circle, rgba(200,76,49,0.1) 0%, transparent 72%)",
          filter: "blur(4px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          width: { xs: 240, md: 380 },
          height: { xs: 240, md: 380 },
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(circle, rgba(229,213,197,0.5) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(80,60,50,0.22) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          right: "25%",
          width: { xs: 160, md: 240 },
          height: { xs: 160, md: 240 },
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 65%)"
            : "radial-gradient(circle, rgba(90,70,60,0.15) 0%, transparent 65%)",
          opacity: 0.7,
        }}
      />

      {sparkles.map((s, i) => (
        <Box
          key={i}
          className="public-sparkle-dot"
          sx={{
            position: "absolute",
            top: s.t,
            left: s.l,
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: isLight
              ? "rgba(200,76,49,0.35)"
              : "rgba(255,200,180,0.25)",
            animationDelay: `${s.d}s`,
          }}
        />
      ))}

      <Box
        component="svg"
        viewBox="0 0 400 200"
        sx={{
          position: "absolute",
          top: { xs: "10%", md: "8%" },
          left: "-6%",
          width: { xs: 260, md: 420 },
          height: "auto",
          opacity: isLight ? 0.3 : 0.18,
        }}
      >
        <path
          d="M 20 120 Q 120 40 280 100 T 400 60"
          fill="none"
          stroke={isLight ? "#C84C31" : "#c96b55"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </Box>
      <Box
        component="svg"
        viewBox="0 0 300 180"
        sx={{
          position: "absolute",
          bottom: "14%",
          right: "-4%",
          width: { xs: 200, md: 320 },
          height: "auto",
          opacity: isLight ? 0.22 : 0.14,
        }}
      >
        <path
          d="M 0 80 Q 100 140 200 60 T 300 100"
          fill="none"
          stroke={isLight ? "#C84C31" : "#a85a48"}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </Box>
    </Box>
  );
}

export default function PublicHomePage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { mode, toggleMode } = useThemeMode();
  const [hasPublicAuth, setHasPublicAuth] = useState(false);
  const [name, setName] = useState(null);

  useEffect(() => {
    queueMicrotask(() => {
      setHasPublicAuth(Boolean(getPublicToken()));
      setName(getPublicUser()?.name || null);
    });
  }, []);

  const startGoogle = () => {
    window.location.href = `${apiBase()}/auth/google`;
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <PublicDecorBackground isLight={isLight} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box
          component="header"
          sx={{
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 20,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor:
              theme.palette.mode === "light"
                ? "rgba(242, 232, 223, 0.92)"
                : "rgba(18, 18, 18, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "text.primary",
            boxShadow: isLight
              ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 24px rgba(26, 26, 26, 0.04)"
              : "0 1px 0 rgba(255,255,255,0.04) inset",
          }}
        >
          <Toolbar
            sx={{
              maxWidth: 1440,
              mx: "auto",
              width: "100%",
              px: { xs: 2, sm: 3 },
              gap: 1,
              rowGap: 1.5,
              flexWrap: "wrap",
              minHeight: { xs: 60, sm: 68 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flexGrow: 1,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isLight
                    ? "rgba(200,76,49,0.12)"
                    : "rgba(200,76,49,0.22)",
                  border: 1,
                  borderColor: isLight
                    ? "rgba(200,76,49,0.2)"
                    : "rgba(200,76,49,0.3)",
                }}
              >
                <Image
                  src="/aiIcon.png"
                  alt=""
                  width={13}
                  height={13}
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  color: "text.primary",
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                }}
              >
                AI College Assistant
              </Typography>
            </Box>

            {hasPublicAuth ? (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: "none", md: "block" }, mr: 0.5 }}
                  noWrap
                >
                  {name || "Signed in"}
                </Typography>
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="contained"
                  size="medium"
                  sx={{
                    borderRadius: "999px",
                    px: 2.5,
                    boxShadow: "0 8px 24px rgba(200, 76, 49, 0.28)",
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderRadius: "999px",
                    px: 2,
                    borderColor: "primary.main",
                    color: "primary.main",
                  }}
                >
                  College sign-in
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={startGoogle}
                  sx={{
                    borderRadius: "999px",
                    px: 2.5,
                    borderColor: "primary.main",
                    color: "primary.main",
                    fontWeight: 700,
                    borderWidth: 1.5,
                    "&:hover": { borderWidth: 1.5 },
                  }}
                >
                  Continue with Google
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  size="medium"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  College sign-in
                </Button>
              </>
            )}
            <IconButton
              color="inherit"
              onClick={toggleMode}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              sx={{
                border: 1,
                borderColor: isLight ? "rgba(26,26,26,0.08)" : "rgba(255,255,255,0.12)",
                borderRadius: "12px",
                transition: "transform 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isLight ? "rgba(200,76,49,0.08)" : "rgba(255,255,255,0.06)",
                  transform: "scale(1.05)",
                },
              }}
            >
              {mode === "dark" ? (
                <LightModeRoundedIcon fontSize="small" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              color="inherit"
              sx={{
                border: 1,
                borderColor: isLight ? "rgba(26,26,26,0.08)" : "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isLight ? "rgba(200,76,49,0.06)" : "rgba(255,255,255,0.06)",
                },
              }}
              aria-label="More"
            >
              <MoreHorizIcon />
            </IconButton>
          </Toolbar>
        </Box>

        {/* Top hero: Course Assistant — outside chat card */}
        <Box
          sx={{
            flexShrink: 0,
            textAlign: "center",
            pt: { xs: 2.5, md: 3.5 },
            pb: { xs: 1.5, md: 2 },
            px: { xs: 2, sm: "5vw" },
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              fontWeight={900}
              sx={{
                fontSize: { xs: "2rem", sm: "2.5rem", md: "2.85rem" },
                letterSpacing: "-0.035em",
                color: "text.primary",
                lineHeight: 1.15,
              }}
            >
              Course Assistant
            </Typography>
            {!hasPublicAuth && (
              <Tooltip
                title={HISTORY_TOOLTIP_TEXT}
                placement="bottom"
                enterTouchDelay={0}
                slotProps={{
                  tooltip: {
                    className: "public-tooltip-pop",
                    sx: {
                      maxWidth: 340,
                      px: 2,
                      py: 1.5,
                      bgcolor: isLight
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(34,34,34,0.94)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: 1,
                      borderColor: isLight
                        ? "rgba(229, 213, 197, 0.95)"
                        : "rgba(255,255,255,0.12)",
                      boxShadow: isLight
                        ? "0 12px 40px rgba(26,26,26,0.1)"
                        : "0 16px 48px rgba(0,0,0,0.45)",
                      color: "text.primary",
                      fontSize: "0.8125rem",
                      lineHeight: 1.55,
                      fontWeight: 500,
                    },
                  },
                }}
              >
                <IconButton
                  size="small"
                  aria-label="About chat history"
                  sx={{
                    color: "primary.main",
                    border: 1,
                    borderColor: isLight
                      ? "rgba(200,76,49,0.35)"
                      : "rgba(200,76,49,0.45)",
                    bgcolor: isLight
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(255,255,255,0.06)",
                    transition:
                      "transform 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      bgcolor: isLight
                        ? "rgba(200,76,49,0.1)"
                        : "rgba(200,76,49,0.2)",
                      transform: "scale(1.06)",
                    },
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 1.5,
              maxWidth: 560,
              mx: "auto",
              lineHeight: 1.65,
              fontSize: { xs: "0.95rem", sm: "1.02rem" },
            }}
          >
            Ask questions grounded in uploaded materials.{" "}
            {/*No account required —*/} <br /> sign in with Google to keep your
            history.
          </Typography>
        </Box>

        {/* Chat fills remaining viewport — wide, spacious */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            px: { xs: "4vw", sm: "5vw", md: "5vw" },
            pb: { xs: 2, md: 2.5 },
          }}
        >
          <PublicChat />
        </Box>
      </Box>
    </Box>
  );
}
