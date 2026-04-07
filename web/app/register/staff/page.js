"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useThemeMode } from "@/components/providers/ThemeModeContext";
import { clearError, registerStaff } from "@/features/authSlice";
import { fetchDropdowns } from "@/features/dropdownSlice";

export default function StaffRegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, error } = useSelector((s) => s.auth);
  const { degrees, departments, status: metaStatus } = useSelector((s) => s.dropdown);
  const { mode, toggleMode } = useThemeMode();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [collegeCode, setCollegeCode] = useState(
    () => (process.env.NEXT_PUBLIC_COLLEGE_CODE || "").trim(),
  );
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchDropdowns());
  }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(
      registerStaff({
        name,
        email,
        password,
        collegeCode,
        degree,
        department,
      }),
    );
    if (registerStaff.fulfilled.match(res)) {
      router.replace("/waiting-approval");
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="Staff onboarding"
      title="Create your staff profile"
      subtitle="We will notify admins. You can sign in only after your profile is approved."
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          position: "relative",
        }}
      >
        <IconButton
          onClick={toggleMode}
          aria-label="toggle theme"
          size="small"
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
        </IconButton>

        <Typography variant="h5" fontWeight={900} gutterBottom>
          Register
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          College code is sent as the x-college-code header. You will be redirected to a waiting page
          after sign-up.
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={onSubmit} className="flex flex-col gap-2">
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            helperText="At least 8 characters."
          />

          <TextField
            label="College code"
            value={collegeCode}
            onChange={(e) => setCollegeCode(e.target.value)}
            required
            fullWidth
            autoComplete="organization"
            helperText="Must exist on the server (see SEED_COLLEGES)."
          />

          <FormControl fullWidth disabled={metaStatus === "loading"}>
            <InputLabel id="deg-label">Degree (optional)</InputLabel>
            <Select
              labelId="deg-label"
              label="Degree (optional)"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
            >
              <MenuItem value="">
                <em>Default</em>
              </MenuItem>
              {degrees.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={metaStatus === "loading"}>
            <InputLabel id="dep-label">Department (optional)</InputLabel>
            <Select
              labelId="dep-label"
              label="Department (optional)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value="">
                <em>Default</em>
              </MenuItem>
              {departments.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={status === "loading" || metaStatus === "loading"}
            sx={{ mt: 1 }}
          >
            {status === "loading" ? "Submitting…" : "Submit profile"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Already approved?{" "}
          <Link href="/login" className="text-[#C84C31] font-semibold">
            Sign in
          </Link>
        </Typography>
      </Paper>
    </AuthSplitLayout>
  );
}
