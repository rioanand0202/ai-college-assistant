"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/services/api";
import { useAppSnackbar } from "@/components/providers/SnackbarContext";
import { fetchDropdowns } from "@/features/dropdownSlice";

export default function StaffAiPage() {
  const dispatch = useDispatch();
  const { show } = useAppSnackbar();
  const { degrees, departments, years, semesters, status: metaStatus } =
    useSelector((s) => s.dropdown);

  const [tab, setTab] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [ragQ, setRagQ] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragMeta, setRagMeta] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    dispatch(fetchDropdowns());
  }, [dispatch]);

  const onAsk = async () => {
    const q = question.trim();
    if (!q) {
      show("Type a question first", "warning");
      return;
    }
    setLoading(true);
    setAnswer("");
    try {
      const { data } = await api.post("/ai/general", { message: q });
      setAnswer(data?.data?.reply || "");
    } catch (err) {
      show(err.message || "AI request failed", "error");
    } finally {
      setLoading(false);
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
    setRagLoading(true);
    setRagAnswer("");
    setRagMeta(null);
    try {
      const { data } = await api.post("/rag/query", {
        question: q,
        subject: subject.trim(),
        department,
        semester,
        degree,
      });
      setRagAnswer(data?.data?.answer || "");
      setRagMeta({
        sourcesUsed: data?.data?.sourcesUsed,
        examMode: data?.data?.examMode,
      });
    } catch (err) {
      show(err.message || "RAG request failed", "error");
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
            }}
          >
            <TextField
              label="Your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={loading}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={onAsk}
              disabled={loading}
            >
              {loading ? "Thinking…" : "Ask"}
            </Button>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                Response
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  minHeight: 120,
                  bgcolor: (t) =>
                    t.palette.mode === "light"
                      ? "rgba(255,255,255,0.75)"
                      : "rgba(255,255,255,0.04)",
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {answer || "Answers will show up here."}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Answers use your uploaded PDFs (Chroma + OpenAI). Use the same degree, department, year,
            semester, and subject as when you uploaded. Try phrases like &quot;important
            questions&quot; for exam-style output.
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
            <TextField
              label="Question"
              value={ragQ}
              onChange={(e) => setRagQ(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={ragLoading}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={onRagAsk}
              disabled={ragLoading || metaBusy}
            >
              {ragLoading ? "Retrieving…" : "Ask with RAG"}
            </Button>
            {ragMeta ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Sources: {ragMeta.sourcesUsed}
                {ragMeta.examMode ? " · Exam-style prompt" : ""}
              </Typography>
            ) : null}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                Answer
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  minHeight: 120,
                  bgcolor: (t) =>
                    t.palette.mode === "light"
                      ? "rgba(255,255,255,0.75)"
                      : "rgba(255,255,255,0.04)",
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {ragAnswer || "RAG answers will show up here after you upload PDFs."}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
