"use client";

import { useEffect } from "react";
import {
  Box,
  Chip,
  Link as MuiLink,
  Paper,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getMyMaterials } from "@/features/materialSlice";

export default function MyMaterialsPage() {
  const dispatch = useDispatch();
  const { materials, listStatus, listError } = useSelector((s) => s.material);

  useEffect(() => {
    dispatch(getMyMaterials());
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>
        My materials
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Everything you have uploaded appears here with quick context chips.
      </Typography>

      {listStatus === "loading" ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : null}
      {listError ? (
        <Typography color="error">{listError}</Typography>
      ) : null}

      <Box className="flex flex-col gap-2">
        {materials.map((m) => {
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const origin = apiBase.replace(/\/api\/?$/i, "");
          const href =
            m.sourceUrl || (m.filePath ? `${origin}${m.filePath}` : null);
          return (
            <Paper
              key={m._id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography fontWeight={800}>{m.title || m.subject}</Typography>
              <Typography variant="body2" color="text.secondary">
                {m.subject}
              </Typography>
              <Box className="flex flex-wrap gap-1 mt-1">
                <Chip size="small" label={m.degree} />
                <Chip size="small" label={m.department} />
                <Chip size="small" label={m.year} />
                <Chip size="small" label={m.semester} />
                <Chip size="small" variant="outlined" label={m.type === "question_paper" ? "Question paper" : "Notes"} />
                {m.ragStatus === "ready" ? (
                  <Chip size="small" color="success" label={`RAG · ${m.chunkCount || 0} chunks`} />
                ) : null}
                {m.ragStatus === "failed" ? (
                  <Chip size="small" color="error" label="RAG failed" title={m.ragError || ""} />
                ) : null}
                {m.ragStatus === "skipped" ? (
                  <Chip size="small" variant="outlined" label="URL (no RAG)" />
                ) : null}
              </Box>
              {href ? (
                <MuiLink href={href} target="_blank" rel="noreferrer" sx={{ mt: 1, display: "inline-block" }}>
                  Open resource
                </MuiLink>
              ) : null}
            </Paper>
          );
        })}
      </Box>

      {!materials.length && listStatus === "succeeded" ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No uploads yet. Start with Upload Material.
        </Typography>
      ) : null}
    </Box>
  );
}
