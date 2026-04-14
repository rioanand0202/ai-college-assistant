"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSelector } from "react-redux";
import { api } from "@/services/api";

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminEventsPage() {
  const user = useSelector((s) => s.auth.user);
  const college = String(user?.collegeCode || "").toUpperCase();

  const publicEventsUrl = useMemo(() => {
    if (typeof window === "undefined") return "/events";
    const base = window.location.origin;
    return `${base}/events${college ? `?collegeCode=${encodeURIComponent(college)}` : ""}`;
  }, [college]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("event");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSingleDay, setIsSingleDay] = useState(true);
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const minStart = todayYmd();

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await api.get("/admin/events");
      setList(data?.data?.items || []);
    } catch (e) {
      setMessage({ type: "error", text: e.response?.data?.message || e.message || "Load failed" });
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (isSingleDay && eventDate) {
      setEventEndDate(eventDate);
    }
  }, [isSingleDay, eventDate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    const start = eventDate;
    const end = isSingleDay ? eventDate : eventEndDate;
    if (!start) {
      setMessage({ type: "error", text: "Choose a start date." });
      return;
    }
    if (!isSingleDay && (!end || end < start)) {
      setMessage({ type: "error", text: "End date must be on or after the start date." });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/events", {
        title: title.trim(),
        description: description.trim(),
        kind,
        linkUrl: kind === "announcement" ? linkUrl.trim() : "",
        isSingleDay,
        eventDate: start,
        eventEndDate: isSingleDay ? undefined : end,
      });
      setMessage({ type: "success", text: "Saved." });
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setKind("event");
      setIsSingleDay(true);
      setEventDate("");
      setEventEndDate("");
      loadList();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Save failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>
        Events & announcements
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Students see these on the public events page.
      </Typography>
      <Button component={Link} href="/events" size="small" variant="text" sx={{ mb: 2, fontWeight: 700 }}>
        Open public events page →
      </Button>

      {message.text ? (
        <Alert severity={message.type === "success" ? "success" : "error"} sx={{ mb: 2 }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2.5, mb: 4, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
          Add new
        </Typography>
        <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            placeholder="e.g. Hall ticket published — students can download from the link below."
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
            </Select>
          </FormControl>
          {kind === "announcement" ? (
            <TextField
              label="Link (optional)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              fullWidth
              placeholder="https://… or paste your college portal URL"
              helperText="Optional. Shown as “Open link” for students."
            />
          ) : null}
          <FormControlLabel
            control={
              <Checkbox
                checked={isSingleDay}
                onChange={(e) => setIsSingleDay(e.target.checked)}
              />
            }
            label="Single-day (one date only)"
          />
          <TextField
            label={isSingleDay ? "Date" : "From date"}
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minStart }}
            required
            fullWidth
          />
          {!isSingleDay ? (
            <TextField
              label="To date"
              type="date"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: eventDate || minStart }}
              required
              fullWidth
            />
          ) : null}
          <Button type="submit" variant="contained" disabled={submitting} sx={{ alignSelf: "flex-start", mt: 1 }}>
            {submitting ? "Saving…" : "Publish"}
          </Button>
        </Box>
      </Paper>

      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
        All entries (this college)
      </Typography>
      {listLoading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {list.map((row) => (
            <Paper key={row._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                <Typography fontWeight={700}>{row.title}</Typography>
                <Chip size="small" label={row.kind} />
                <Chip size="small" color={row.isActive ? "success" : "default"} label={row.isActive ? "Active" : "Ended"} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                  {row.eventDate && new Date(row.eventDate).toISOString().slice(0, 10)}
                  {!row.isSingleDay && row.eventEndDate
                    ? ` → ${new Date(row.eventEndDate).toISOString().slice(0, 10)}`
                    : null}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
