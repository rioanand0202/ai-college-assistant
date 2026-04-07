"use client";

import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publicApi } from "@/services/publicApi";
import { clearPublicSession, getPublicToken, getPublicUser } from "@/lib/publicAuth";

export default function PublicDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getPublicToken();
    if (!token) {
      queueMicrotask(() => router.replace("/"));
      return;
    }
    queueMicrotask(() => setUser(getPublicUser()));
    publicApi
      .get("/chat/history")
      .then(({ data }) => {
        queueMicrotask(() => setItems(data?.data?.items || []));
      })
      .catch(() => {
        queueMicrotask(() => setItems([]));
      })
      .finally(() => queueMicrotask(() => setLoading(false)));
  }, [router]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1 }}>
            Saved chats
          </Typography>
          <Button component={Link} href="/" variant="outlined" size="small">
            Assistant
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              clearPublicSession();
              router.replace("/");
            }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Signed in as <strong>{user.name || user.email}</strong>
          </Typography>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography color="text.secondary">
              No saved messages yet. Ask a question on the home page — history is stored when you are signed in
              with Google.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...items].reverse().map((row) => (
              <Paper key={row._id || `${row.createdAt}-${row.question?.slice(0, 12)}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.5 }}>
                  Q: {row.question}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {row.answer}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
