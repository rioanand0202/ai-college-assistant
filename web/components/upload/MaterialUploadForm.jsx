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
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { useDispatch, useSelector } from "react-redux";
import { fetchDropdowns } from "@/features/dropdownSlice";
import { clearUploadState, uploadMaterial } from "@/features/materialSlice";
import { useAppSnackbar } from "@/components/providers/SnackbarContext";

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function MaterialUploadForm() {
  const dispatch = useDispatch();
  const { show } = useAppSnackbar();
  const { degrees, departments, years, semesters, status: metaStatus } =
    useSelector((s) => s.dropdown);
  const { uploadStatus, uploadError } = useSelector((s) => s.material);

  const [mode, setMode] = useState("file");
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    dispatch(fetchDropdowns());
  }, [dispatch]);

  useEffect(() => {
    if (uploadStatus === "succeeded") {
      show("Material uploaded successfully", "success");
      dispatch(clearUploadState());
      setSubject("");
      setUrl("");
      setFile(null);
    }
    if (uploadStatus === "failed" && uploadError) {
      show(uploadError, "error");
      dispatch(clearUploadState());
    }
  }, [uploadStatus, uploadError, show, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!degree || !department || !year || !semester || !subject.trim()) {
      show("Please fill all required fields", "warning");
      return;
    }
    if (mode === "file") {
      if (!file) {
        show("Please choose a PDF file", "warning");
        return;
      }
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        show("Only PDF files are allowed", "warning");
        return;
      }
    } else {
      if (!url.trim() || !isValidHttpUrl(url.trim())) {
        show("Enter a valid http(s) URL", "warning");
        return;
      }
    }

    const fd = new FormData();
    fd.append("degree", degree);
    fd.append("department", department);
    fd.append("year", year);
    fd.append("semester", semester);
    fd.append("subject", subject.trim());
    if (mode === "file") fd.append("file", file);
    else fd.append("url", url.trim());

    dispatch(uploadMaterial(fd));
  };

  const disabled = uploadStatus === "loading" || metaStatus === "loading";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Upload learning material
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide course context, then upload a PDF or share a link.
      </Typography>

      <Box component="form" onSubmit={onSubmit} className="flex flex-col gap-3">
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormControl fullWidth required disabled={disabled}>
            <InputLabel id="deg-label">Degree</InputLabel>
            <Select
              labelId="deg-label"
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

          <FormControl fullWidth required disabled={disabled}>
            <InputLabel id="dep-label">Department</InputLabel>
            <Select
              labelId="dep-label"
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

          <FormControl fullWidth required disabled={disabled}>
            <InputLabel id="yr-label">Year</InputLabel>
            <Select
              labelId="yr-label"
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required disabled={disabled}>
            <InputLabel id="sem-label">Semester</InputLabel>
            <Select
              labelId="sem-label"
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
          disabled={disabled}
        />

        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Upload type
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_e, v) => v && setMode(v)}
            fullWidth
            color="primary"
          >
            <ToggleButton value="file">
              <CloudUploadRoundedIcon sx={{ mr: 1 }} fontSize="small" />
              PDF
            </ToggleButton>
            <ToggleButton value="url">
              <LinkRoundedIcon sx={{ mr: 1 }} fontSize="small" />
              URL
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mode === "file" ? (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            sx={{
              border: "2px dashed",
              borderColor: dragOver ? "primary.main" : "divider",
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              bgcolor: (t) =>
                t.palette.mode === "light" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag & drop a PDF here, or choose a file.
            </Typography>
            <Button variant="outlined" component="label" disabled={disabled}>
              Choose PDF
              <input
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>
            {file ? (
              <Typography variant="body2" sx={{ mt: 2 }} fontWeight={700}>
                Selected: {file.name}
              </Typography>
            ) : null}
          </Box>
        ) : (
          <TextField
            label="Material URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            disabled={disabled}
            placeholder="https://example.com/syllabus.pdf"
          />
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={disabled}
          sx={{ mt: 1 }}
        >
          {uploadStatus === "loading" ? "Uploading…" : "Submit"}
        </Button>
      </Box>
    </Paper>
  );
}
