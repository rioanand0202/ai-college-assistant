"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import PublicChat from "@/components/public/PublicChat";
import { getPublicToken, getPublicUser } from "@/lib/publicAuth";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
}

export default function PublicHomePage() {
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1 }}>
            AI College Assistant
          </Typography>
          {hasPublicAuth ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                {name || "Signed in"}
              </Typography>
              <Button component={Link} href="/dashboard" variant="contained" size="small">
                Dashboard
              </Button>
              <Button component={Link} href="/login" variant="outlined" size="small">
                College sign-in
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" size="small" onClick={startGoogle}>
                Continue with Google
              </Button>
              <Button component={Link} href="/login" variant="text" size="small">
                College sign-in
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={900} gutterBottom sx={{ textAlign: "center" }}>
          Course assistant
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 2, maxWidth: 560, mx: "auto" }}>
          Ask questions grounded in uploaded materials. No account required — sign in with Google to keep your
          history.
        </Typography>
        <PublicChat />
      </Container>
    </Box>
  );
}
