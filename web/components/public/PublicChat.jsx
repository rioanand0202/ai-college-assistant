"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import Link from "next/link";
import { publicApi } from "@/services/publicApi";
import {
  getPublicToken,
  loadGuestMessages,
  saveGuestMessages,
} from "@/lib/publicAuth";
import { createPublicAssistantSocket } from "@/lib/publicSocket";

const SUGGEST_SID_KEY = "aca_public_suggest_sid_v1";

const FALLBACK_SUGGESTIONS = [
  "Important questions in OS 2nd year 1st sem",
  "Explain deadlock in operating systems",
  "Important questions in DBMS",
  "What is normalization in databases?",
];

function getOrCreateSuggestionSessionId() {
  if (typeof window === "undefined") return "anon";
  try {
    let id = sessionStorage.getItem(SUGGEST_SID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SUGGEST_SID_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function newClientMsgId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AssistantMessage({ content, index, isLight, copiedIndex, setCopiedIndex }) {
  const copied = copiedIndex === index;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex((v) => (v === index ? null : v)), 2200);
    } catch {
      /* ignore */
    }
  };

  return (
    <Box
      className="public-chat-msg-in"
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        width: "100%",
        pr: { xs: 0, sm: "8%" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
          maxWidth: { xs: "100%", sm: "min(820px, 92%)" },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: 0.25,
            bgcolor: isLight ? "rgba(200,76,49,0.1)" : "rgba(200,76,49,0.2)",
            color: "primary.main",
          }}
        >
          <SmartToyRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            px: 2.5,
            py: 2,
            borderRadius: "22px",
            bgcolor: isLight ? "rgba(255,255,255,0.72)" : "rgba(38,38,38,0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: 1,
            borderColor: isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
            boxShadow: isLight ? "0 4px 24px rgba(26, 26, 26, 0.05)" : "0 8px 32px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 0.75,
              minHeight: 32,
            }}
          >
            <IconButton
              size="small"
              onClick={handleCopy}
              aria-label="Copy response"
              sx={{
                color: "text.secondary",
                transition: "transform 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isLight ? "rgba(200,76,49,0.08)" : "rgba(255,255,255,0.08)",
                  transform: "scale(1.06)",
                },
              }}
            >
              {copied ? (
                <CheckRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: "success.main",
                    transition: "transform 0.25s ease",
                    transform: "scale(1.12)",
                  }}
                />
              ) : (
                <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
            {copied && (
              <Typography
                variant="caption"
                sx={{
                  color: "success.main",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  animation: "public-msg-in 0.25s ease-out both",
                }}
              >
                Copied ✓
              </Typography>
            )}
          </Box>
          <Typography
            variant="body1"
            component="div"
            sx={{
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "text.primary",
              fontSize: { xs: "0.9375rem", sm: "1rem" },
            }}
          >
            {content}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

function UserMessage({ content }) {
  return (
    <Box
      className="public-chat-msg-in"
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        width: "100%",
        pl: { xs: "12%", sm: "18%" },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          py: 1.75,
          borderRadius: "22px",
          maxWidth: "min(720px, 100%)",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          boxShadow: "0 10px 32px rgba(200, 76, 49, 0.32)",
          border: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <Typography
          variant="body1"
          component="div"
          sx={{
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: { xs: "0.9375rem", sm: "1rem" },
          }}
        >
          {content}
        </Typography>
      </Paper>
    </Box>
  );
}

export default function PublicChat({ publicAuthRevision = 0 }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [suggestLoading, setSuggestLoading] = useState(true);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const [oauthLoggedIn, setOauthLoggedIn] = useState(false);

  useEffect(() => {
    setOauthLoggedIn(Boolean(getPublicToken()));
  }, [publicAuthRevision]);

  useEffect(() => {
    let cancelled = false;
    setSuggestLoading(true);
    const sid = getOrCreateSuggestionSessionId();
    publicApi
      .get("/public/suggestions", { params: { session: sid, limit: 8 } })
      .then(({ data }) => {
        const list = data?.data?.suggestions;
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setSuggestions(list);
        }
      })
      .catch(() => {
        /* keep FALLBACK_SUGGESTIONS */
      })
      .finally(() => {
        if (!cancelled) setSuggestLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getPublicToken();
    const s = createPublicAssistantSocket({ token });
    socketRef.current = s;
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [publicAuthRevision]);

  useEffect(() => {
    if (oauthLoggedIn) {
      setMessages([]);
      return;
    }
    setMessages(loadGuestMessages());
  }, [oauthLoggedIn]);

  useEffect(() => {
    if (!oauthLoggedIn) {
      saveGuestMessages(messages);
    }
  }, [messages, oauthLoggedIn]);

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
      const clientMsgId = newClientMsgId();
      try {
        const socket = socketRef.current;
        let answerText;

        if (socket?.connected) {
          const payload = await new Promise((resolve) => {
            const ms = 125000;
            const t = window.setTimeout(
              () => resolve({ success: false, message: "Request timed out." }),
              ms,
            );
            socket.emit("public:ask", { question: q, clientMsgId }, (ack) => {
              window.clearTimeout(t);
              resolve(ack);
            });
          });
          if (payload?.success && payload?.data) {
            answerText = payload.data.answer || "No response.";
          } else {
            const { data } = await publicApi.post("/public/ask", { question: q });
            answerText =
              data?.data?.answer ||
              payload?.message ||
              "Something went wrong. Try again.";
          }
        } else {
          const { data } = await publicApi.post("/public/ask", { question: q });
          answerText = data?.data?.answer || "No response.";
        }

        setMessages((m) => [...m, { role: "assistant", content: answerText }]);
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

  let assistantIdx = -1;
  const messageNodes = messages.map((msg, i) => {
    if (msg.role === "user") {
      return <UserMessage key={i} content={msg.content} />;
    }
    assistantIdx += 1;
    return (
      <AssistantMessage
        key={i}
        content={msg.content}
        index={assistantIdx}
        isLight={isLight}
        copiedIndex={copiedIndex}
        setCopiedIndex={setCopiedIndex}
      />
    );
  });

  return (
    <Box
      sx={{
        width: "min(92vw, 1440px)",
        maxWidth: "100%",
        mx: "auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: { xs: "min(70dvh, 640px)", md: "min(calc(100dvh - 200px), 820px)" },
          borderRadius: "24px",
          bgcolor: isLight ? "rgba(255,255,255,0.42)" : "rgba(28,28,28,0.5)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: 1,
          borderColor: isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.07)",
          boxShadow: isLight ? "0 20px 60px rgba(26, 26, 26, 0.08)" : "0 24px 70px rgba(0,0,0,0.45)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Login page book — bottom-left, overlapping, subtle float + glow */}
        <Box
          aria-hidden
          className="public-book-float"
          sx={{
            position: "absolute",
            left: { xs: -16, md: -8 },
            bottom: { xs: 72, md: 88 },
            width: { xs: 140, sm: 180, md: 220 },
            height: { xs: 120, sm: 150, md: 180 },
            zIndex: 0,
            pointerEvents: "none",
            opacity: isLight ? 0.92 : 0.5,
            filter: isLight
              ? "drop-shadow(0 0 28px rgba(200,76,49,0.2))"
              : "drop-shadow(0 0 20px rgba(200,76,49,0.15))",
          }}
        >
          <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src="/bookBG-img.png"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="(max-width: 900px) 140px, 220px"
            priority={false}
          />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            py: { xs: 2.5, md: 3.5 },
            px: { xs: 2, sm: 3, md: 4 },
            position: "relative",
            zIndex: 1,
            scrollBehavior: "smooth",
          }}
        >
          {messages.length === 0 && !loading && (
            <Box sx={{ textAlign: "center", py: { xs: 2, md: 4 }, px: 2, maxWidth: 640, mx: "auto" }}>
              <Typography
                variant="h6"
                fontWeight={800}
                gutterBottom
                color="text.primary"
                sx={{ fontSize: { xs: "1.15rem", sm: "1.35rem" } }}
              >
                Ask anything from your course materials
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.65 }}>
                Mention subject, year, or semester for tighter search — e.g. &quot;important questions in OS 2nd
                year 1st sem&quot;.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, justifyContent: "center" }}>
                {(suggestLoading ? FALLBACK_SUGGESTIONS : suggestions).map((s, si) => (
                  <Chip
                    key={`${s}-${si}`}
                    label={s}
                    onClick={() => send(s)}
                    variant="outlined"
                    sx={{
                      borderRadius: "999px",
                      borderColor: "primary.main",
                      color: "text.primary",
                      bgcolor: isLight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.06)",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      py: 2.5,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        bgcolor: isLight ? "rgba(200,76,49,0.1)" : "rgba(200,76,49,0.18)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(200,76,49,0.12)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {messageNodes}
          </Box>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "flex-start", pl: 5, py: 2 }}>
              <CircularProgress size={26} thickness={5} sx={{ color: "primary.main" }} />
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        {/* Sticky input bar */}
        <Box
          sx={{
            flexShrink: 0,
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            px: { xs: 2, sm: 2.5, md: 3 },
            pb: { xs: 2, md: 2.5 },
            pt: 1,
            background: isLight
              ? "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(253,248,243,0.92) 35%, rgba(253,248,243,0.98) 100%)"
              : "linear-gradient(180deg, transparent 0%, rgba(24,22,20,0.92) 40%, rgba(18,18,18,0.98) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
              maxWidth: 900,
              mx: "auto",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                minHeight: 52,
                px: { xs: 2, sm: 2.5 },
                py: 0.75,
                borderRadius: "999px",
                bgcolor: isLight ? "rgba(255,255,255,0.82)" : "rgba(22,22,22,0.88)",
                border: 1,
                borderColor: isLight ? "rgba(229, 213, 197, 0.95)" : "rgba(255,255,255,0.1)",
                boxShadow: isLight
                  ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 20px rgba(26,26,26,0.06)"
                  : "0 4px 24px rgba(0,0,0,0.35)",
                transition: "box-shadow 0.25s ease, border-color 0.25s ease",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: isLight
                    ? "0 0 0 3px rgba(200,76,49,0.15), 0 8px 28px rgba(200,76,49,0.12)"
                    : "0 0 0 2px rgba(200,76,49,0.35)",
                },
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={6}
                placeholder="Message the course assistant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    py: 1,
                    fontSize: { xs: "1rem", sm: "1.0625rem" },
                    alignItems: "center",
                  },
                }}
              />
            </Paper>
            <IconButton
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              sx={{
                width: 52,
                height: 52,
                flexShrink: 0,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                boxShadow: "0 8px 28px rgba(200, 76, 49, 0.4)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  bgcolor: "primary.dark",
                  transform: "scale(1.05)",
                  boxShadow: "0 12px 36px rgba(200, 76, 49, 0.48)",
                },
                "&:active": {
                  transform: "scale(0.97)",
                },
                "&.Mui-disabled": {
                  bgcolor: isLight ? "rgba(200,76,49,0.3)" : "rgba(200,76,49,0.25)",
                  color: "rgba(255,255,255,0.65)",
                  boxShadow: "none",
                },
              }}
            >
              <ArrowUpwardRoundedIcon sx={{ fontSize: 26 }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.75, textAlign: "center", display: "block", opacity: 0.85 }}
      >
        Staff workspace:{" "}
        <Button
          component={Link}
          href="/login"
          size="small"
          sx={{
            textTransform: "none",
            p: 0,
            minWidth: 0,
            fontWeight: 700,
            color: "primary.main",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          College sign-in
        </Button>
      </Typography>
    </Box>
  );
}
