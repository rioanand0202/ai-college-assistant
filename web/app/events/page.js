"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { api } from "@/services/api";

function formatRange(item) {
  const a = item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 10) : "";
  const b = item.eventEndDate ? new Date(item.eventEndDate).toISOString().slice(0, 10) : "";
  if (a === b) return a;
  return `${a} → ${b}`;
}

export default function PublicEventsPage() {
  const envCollege = useMemo(
    () => (process.env.NEXT_PUBLIC_COLLEGE_CODE || "").trim().toUpperCase(),
    [],
  );
  const [collegeInput, setCollegeInput] = useState(envCollege);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(envCollege));
  const [error, setError] = useState("");

  const fetchList = useCallback(async (ccRaw) => {
    const cc = String(ccRaw || "").trim().toUpperCase();
    if (!cc) {
      setError("College code is required.");
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/public/events", { params: { collegeCode: cc } });
      setItems(data?.data?.items || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Could not load events.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (envCollege) {
      setCollegeInput(envCollege);
      fetchList(envCollege);
    } else {
      setLoading(false);
    }
  }, [envCollege, fetchList]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Button component={Link} href="/" variant="text" sx={{ mb: 2, fontWeight: 700 }}>
          ← Back to assistant
        </Button>
        <Typography variant="h4" fontWeight={900} gutterBottom>
          Events & announcements
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upcoming notices from your college. Past items are hidden automatically.
        </Typography>

        {!envCollege ? (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter the college code your institution uses (same as staff sign-in).
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="College code"
                value={collegeInput}
                onChange={(e) => setCollegeInput(e.target.value.toUpperCase())}
                sx={{ minWidth: 200 }}
              />
              <Button variant="contained" onClick={() => fetchList(collegeInput)} disabled={loading}>
                Show
              </Button>
            </Box>
          </Paper>
        ) : (
          <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => fetchList(envCollege)} disabled={loading}>
            Refresh
          </Button>
        )}

        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary">No upcoming events or announcements.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((row) => (
              <Paper key={row._id} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {row.kind === "announcement" ? (
                    <CampaignRoundedIcon color="primary" fontSize="small" />
                  ) : (
                    <EventAvailableRoundedIcon color="primary" fontSize="small" />
                  )}
                  <Chip size="small" label={row.kind === "announcement" ? "Announcement" : "Event"} />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                    {formatRange(row)}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={800}>
                  {row.title}
                </Typography>
                {row.description ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                    {row.description}
                  </Typography>
                ) : null}
                {row.kind === "announcement" && row.linkUrl ? (
                  <MuiLink href={row.linkUrl} target="_blank" rel="noopener noreferrer" sx={{ mt: 1.5, display: "inline-block", fontWeight: 700 }}>
                    Open link →
                  </MuiLink>
                ) : null}
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
