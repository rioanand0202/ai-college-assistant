"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/services/api";
import { useAppSnackbar } from "@/components/providers/SnackbarContext";
import { fetchDropdowns } from "@/features/dropdownSlice";

function UserChatBubble({ content }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          maxWidth: "min(92%, 640px)",
          borderRadius: "18px 18px 6px 18px",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          boxShadow: "0 6px 20px rgba(200, 76, 49, 0.25)",
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {content}
        </Typography>
      </Paper>
    </Box>
  );
}

function AssistantChatBubble({ content, isLight, meta, msgIndex, copiedIndex, setCopiedIndex }) {
  const copied = copiedIndex === msgIndex;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(msgIndex);
      window.setTimeout(() => setCopiedIndex((v) => (v === msgIndex ? null : v)), 2200);
    } catch {
      /* ignore */
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          px: 2,
          py: 1.5,
          maxWidth: "min(92%, 720px)",
          borderRadius: "18px 18px 18px 6px",
          bgcolor: (t) =>
            t.palette.mode === "light"
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.05)",
          borderColor: isLight ? "divider" : "rgba(255,255,255,0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
            minHeight: 32,
          }}
        >
          <IconButton
            size="small"
            onClick={handleCopy}
            aria-label="Copy response"
            sx={{
              color: "text.secondary",
              "&:hover": { bgcolor: isLight ? "rgba(200,76,49,0.08)" : "rgba(255,255,255,0.08)" },
            }}
          >
            {copied ? (
              <CheckRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
            ) : (
              <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
          {copied ? (
            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
              Copied
            </Typography>
          ) : null}
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
          {content}
        </Typography>
        {meta ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: "block" }}>
            Sources: {meta.sourcesUsed}
            {meta.examMode ? " · Exam-style" : ""}
          </Typography>
        ) : null}
      </Paper>
    </Box>
  );
}

function ChatThread({
  messages,
  loading,
  copiedIndex,
  setCopiedIndex,
  emptyHint,
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const bottomRef = useRef(null);
  const assistantIdxRef = useRef(-1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  assistantIdxRef.current = -1;

  return (
    <Box
      sx={{
        maxHeight: { xs: 420, md: 520 },
        overflowY: "auto",
        pr: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {messages.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          {emptyHint}
        </Typography>
      ) : null}
      {messages.map((m, i) => {
        if (m.role === "user") {
          return <UserChatBubble key={m.id || `u-${i}`} content={m.content} />;
        }
        assistantIdxRef.current += 1;
        const ai = assistantIdxRef.current;
        return (
          <AssistantChatBubble
            key={m.id || `a-${i}`}
            content={m.content}
            isLight={isLight}
            meta={m.meta}
            msgIndex={ai}
            copiedIndex={copiedIndex}
            setCopiedIndex={setCopiedIndex}
          />
        );
      })}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : null}
      <div ref={bottomRef} />
    </Box>
  );
}

export default function StaffAiPage() {
  const dispatch = useDispatch();
  const { show } = useAppSnackbar();
  const { degrees, departments, years, semesters, status: metaStatus } =
    useSelector((s) => s.dropdown);

  const [tab, setTab] = useState(0);
  const [question, setQuestion] = useState("");
  const [generalMessages, setGeneralMessages] = useState([]);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalCopied, setGeneralCopied] = useState(null);

  const [ragQ, setRagQ] = useState("");
  const [ragMessages, setRagMessages] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragCopied, setRagCopied] = useState(null);

  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    dispatch(fetchDropdowns());
  }, [dispatch]);

  const nextId = useCallback(() => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, []);

  const onAsk = async () => {
    const q = question.trim();
    if (!q) {
      show("Type a question first", "warning");
      return;
    }
    const uid = nextId();
    setGeneralMessages((m) => [...m, { id: uid, role: "user", content: q }]);
    setQuestion("");
    setGeneralLoading(true);
    try {
      const { data } = await api.post("/ai/general", { message: q });
      const reply = data?.data?.reply || "";
      setGeneralMessages((m) => [...m, { id: nextId(), role: "assistant", content: reply }]);
    } catch (err) {
      const errText = err.response?.data?.message || err.message || "Request failed.";
      setGeneralMessages((m) => [...m, { id: nextId(), role: "assistant", content: errText }]);
      show(errText, "error");
    } finally {
      setGeneralLoading(false);
    }
  };

  const onRagAsk = async () => {
    const q = ragQ.trim();
    if (!q) {
      show("Enter a question", "warning");
      return;
    }
    if (!degree || !department || !year || !semester || !subject.trim()) {
      show("Fill degree, department, year, semester, and subject to match uploaded materials", "warning");
      return;
    }
    const uid = nextId();
    setRagMessages((m) => [...m, { id: uid, role: "user", content: q }]);
    setRagQ("");
    setRagLoading(true);
    try {
      const { data } = await api.post("/rag/query", {
        question: q,
        subject: subject.trim(),
        department,
        semester,
        degree,
        year,
      });
      const answer = data?.data?.answer || "";
      const meta = {
        sourcesUsed: data?.data?.sourcesUsed,
        examMode: data?.data?.examMode,
      };
      setRagMessages((m) => [...m, { id: nextId(), role: "assistant", content: answer, meta }]);
    } catch (err) {
      const errText = err.response?.data?.message || err.message || "RAG request failed.";
      setRagMessages((m) => [...m, { id: nextId(), role: "assistant", content: errText }]);
      show(errText, "error");
    } finally {
      setRagLoading(false);
    }
  };

  const metaBusy = metaStatus === "loading";

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>
        AI assistant
      </Typography>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="General" />
        <Tab label="Course materials (RAG)" />
      </Tabs>

      {tab === 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            General-purpose answers for staff workflows. College PDFs are not searched here.
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minHeight: 360,
            }}
          >
            <ChatThread
              messages={generalMessages}
              loading={generalLoading}
              copiedIndex={generalCopied}
              setCopiedIndex={setGeneralCopied}
              emptyHint="Ask below — each reply stays in this thread."
            />
            <TextField
              label="Your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              disabled={generalLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAsk();
                }
              }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Button variant="contained" onClick={onAsk} disabled={generalLoading}>
                {generalLoading ? "Thinking…" : "Send"}
              </Button>
              {generalMessages.length > 0 ? (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setGeneralMessages([]);
                    setGeneralCopied(null);
                  }}
                >
                  Clear thread
                </Button>
              ) : null}
            </Box>
          </Paper>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Retrieval uses <strong>semantic search</strong> over embedded PDF chunks (plus your scope:
            degree, department, year, semester, subject). If strict filters match too little text, the
            service widens to college-wide chunks so answers stay grounded.
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <FormControl fullWidth required disabled={ragLoading || metaBusy}>
                <InputLabel>Degree</InputLabel>
                <Select
                  label="Degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                >
                  {degrees.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required disabled={ragLoading || metaBusy}>
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required disabled={ragLoading || metaBusy}>
                <InputLabel>Year</InputLabel>
                <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                  {years.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required disabled={ragLoading || metaBusy}>
                <InputLabel>Semester</InputLabel>
                <Select
                  label="Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {semesters.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              fullWidth
              disabled={ragLoading || metaBusy}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              Conversation
            </Typography>
            <ChatThread
              messages={ragMessages}
              loading={ragLoading}
              copiedIndex={ragCopied}
              setCopiedIndex={setRagCopied}
              emptyHint="Set scope above, then ask — messages stack here."
            />
            <TextField
              label="Question"
              value={ragQ}
              onChange={(e) => setRagQ(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              disabled={ragLoading}
              sx={{ mt: 2 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onRagAsk();
                }
              }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mt: 2 }}>
              <Button
                variant="contained"
                onClick={onRagAsk}
                disabled={ragLoading || metaBusy}
              >
                {ragLoading ? "Retrieving…" : "Send"}
              </Button>
              {ragMessages.length > 0 ? (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setRagMessages([]);
                    setRagCopied(null);
                  }}
                >
                  Clear thread
                </Button>
              ) : null}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
