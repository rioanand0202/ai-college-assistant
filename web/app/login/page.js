"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
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
import { clearError, loginUser } from "@/features/authSlice";
import { postLoginPath } from "@/lib/roles";

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, error } = useSelector((s) => s.auth);
  const { mode, toggleMode } = useThemeMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [collegeCode, setCollegeCode] = useState(
    () => (process.env.NEXT_PUBLIC_COLLEGE_CODE || "").trim(),
  );

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password, collegeCode }));
    if (loginUser.fulfilled.match(res)) {
      const u = res.payload?.user;
      const path = postLoginPath(u);
      /** Full navigation avoids rare cases where App Router client transition does not run after auth. */
      window.location.assign(path);
      return;
    }
    if (loginUser.rejected.match(res)) {
      const msg = String(res.payload || "").toLowerCase();
      if (msg.includes("waiting for admin approval")) {
        router.replace("/waiting-approval");
      }
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="Staff & admin"
      title="Sign in to continue"
      subtitle="Use your college code, email, and password. Pending staff cannot sign in until an admin approves."
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
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          College code is checked with your email on the server (not via extra headers after login).
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={onSubmit} className="flex flex-col gap-2">
          <TextField
            label="College code"
            value={collegeCode}
            onChange={(e) => setCollegeCode(e.target.value)}
            required
            fullWidth
            autoComplete="organization"
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
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={status === "loading"}
            sx={{ mt: 1 }}
          >
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          New staff?{" "}
          <Link href="/register/staff" className="text-[#C84C31] font-semibold">
            Create your profile
          </Link>
        </Typography>
      </Paper>
    </AuthSplitLayout>
  );
}
