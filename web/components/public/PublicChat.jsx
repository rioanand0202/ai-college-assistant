"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Link from "next/link";
import { publicApi } from "@/services/publicApi";
import {
  getPublicToken,
  loadGuestMessages,
  saveGuestMessages,
} from "@/lib/publicAuth";

const SUGGESTIONS = [
  "Important questions in OS 2nd year 1st sem",
  "Explain deadlock in operating systems",
  "Important questions in DBMS",
  "What is normalization in databases?",
];

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        maxWidth: "min(720px, 100%)",
        ml: isUser ? "auto" : 0,
        mr: isUser ? 0 : "auto",
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? "primary.main" : "secondary.main",
          width: 36,
          height: 36,
        }}
      >
        {isUser ? <PersonRoundedIcon fontSize="small" /> : <SmartToyRoundedIcon fontSize="small" />}
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.25,
          borderRadius: 3,
          bgcolor: isUser ? "primary.main" : "action.hover",
          color: isUser ? "primary.contrastText" : "text.primary",
          border: 1,
          borderColor: isUser ? "transparent" : "divider",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <Typography variant="body2" component="div">
          {content}
        </Typography>
      </Paper>
    </Box>
  );
}

export default function PublicChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const loggedIn = Boolean(getPublicToken());

  useEffect(() => {
    if (loggedIn) {
      setMessages([]);
      return;
    }
    setMessages(loadGuestMessages());
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      saveGuestMessages(messages);
    }
  }, [messages, loggedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text) => {
      const q = String(text || "").trim();
      if (!q || loading) return;
      setMessages((m) => [...m, { role: "user", content: q }]);
      setInput("");
      setLoading(true);
      try {
        const { data } = await publicApi.post("/public/ask", { question: q });
        const answer = data?.data?.answer || "No response.";
        setMessages((m) => [...m, { role: "assistant", content: answer }]);
      } catch (e) {
        const msg =
          e.response?.data?.message || e.message || "Something went wrong. Try again.";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: "calc(100vh - 200px)", md: "min(640px, calc(100vh - 220px))" },
        maxWidth: 900,
        mx: "auto",
        width: "100%",
      }}
    >
      {!loggedIn && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
          Login to save your chat history across devices. This tab keeps a temporary transcript until you
          close it.
        </Typography>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 2,
          px: { xs: 0.5, sm: 1 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.length === 0 && !loading && (
          <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Ask anything from your course materials
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mention subject, year, or semester for tighter search — e.g. &quot;important questions in OS 2nd
              year 1st sem&quot;.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onClick={() => send(s)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          </Box>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
          mt: "auto",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Message the college assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { px: 1 } }}
        />
        <IconButton
          color="primary"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          aria-label="Send"
        >
          <SendRoundedIcon />
        </IconButton>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
        Staff workspace:{" "}
        <Button component={Link} href="/login" size="small" sx={{ textTransform: "none", p: 0, minWidth: 0 }}>
          College sign-in
        </Button>
      </Typography>
    </Box>
  );
}
