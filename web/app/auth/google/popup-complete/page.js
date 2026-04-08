"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { setPublicSession, userFromPublicToken } from "@/lib/publicAuth";

const MESSAGE_TYPE = "aca-public-oauth";

export default function GoogleOAuthPopupCompletePage() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.startsWith("#token=")) {
      queueMicrotask(() => setError("Missing token. Close this window and try again."));
      return;
    }
    const token = decodeURIComponent(hash.slice(7).trim());
    if (!token) {
      queueMicrotask(() => setError("Invalid token."));
      return;
    }
    const targetOrigin = window.location.origin;
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: MESSAGE_TYPE, token }, targetOrigin);
        window.history.replaceState(null, "", window.location.pathname);
        queueMicrotask(() => window.close());
        return;
      }
    } catch {
      /* fall through */
    }
    const user = userFromPublicToken(token);
    setPublicSession(token, user);
    window.history.replaceState(null, "", window.location.pathname);
    window.location.replace("/");
  }, []);

  if (error) {
    return (
      <Box
        minHeight="50vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        px={2}
      >
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      minHeight="50vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Signing you in… You can close this window.
      </Typography>
    </Box>
  );
}
