"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { setPublicSession, userFromPublicToken } from "@/lib/publicAuth";

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.startsWith("#token=")) {
      queueMicrotask(() => setError("Missing token. Try signing in again."));
      return;
    }
    const token = decodeURIComponent(hash.slice(7).trim());
    if (!token) {
      queueMicrotask(() => setError("Invalid token."));
      return;
    }
    const user = userFromPublicToken(token);
    setPublicSession(token, user);
    window.history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => router.replace("/dashboard"));
  }, [router]);

  if (error) {
    return (
      <Box minHeight="50vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} px={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="50vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Completing Google sign-in…
      </Typography>
    </Box>
  );
}
