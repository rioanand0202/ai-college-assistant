"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "@/services/api";
import { useAppSnackbar } from "@/components/providers/SnackbarContext";

export default function StaffAiPage() {
  const { show } = useAppSnackbar();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>
        AI assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        General-purpose answers for staff workflows. This is not RAG—no college documents are
        searched.
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
    </Box>
  );
}
