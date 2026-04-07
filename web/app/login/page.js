"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoginBrandedLayout from "@/components/auth/LoginBrandedLayout";
import { clearError, loginUser } from "@/features/authSlice";
import { postLoginPath } from "@/lib/roles";

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      window.location.assign(postLoginPath(u));
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
    <LoginBrandedLayout>
      <Typography
        variant="overline"
        sx={{
          letterSpacing: "0.2em",
          fontWeight: 800,
          color: "primary.main",
          display: "block",
        }}
      >
        STAFF & ADMIN
      </Typography>
      <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, mb: 0.5 }}>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Hi There 👋, Welcome back to your workspace.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      ) : null}

      <Box component="form" onSubmit={onSubmit} className="flex flex-col" sx={{ gap: 2 }}>
        <TextField
          label="College code"
          value={collegeCode}
          onChange={(e) => setCollegeCode(e.target.value)}
          required
          fullWidth
          autoComplete="organization"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountBalanceIcon sx={{ color: "text.secondary", fontSize: 22 }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon sx={{ color: "text.secondary", fontSize: 22 }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon sx={{ color: "text.secondary", fontSize: 22 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -0.5 }}>
          <Typography
            component="button"
            type="button"
            variant="body2"
            onClick={(e) => e.preventDefault()}
            sx={{
              border: "none",
              background: "none",
              p: 0,
              cursor: "not-allowed",
              fontWeight: 600,
              color: "primary.main",
              font: "inherit",
            }}
          >
            Forgot password?
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={status === "loading"}
          endIcon={<ArrowForwardIcon />}
          sx={{ mt: 0.5, py: 1.25, fontWeight: 700 }}
        >
          {status === "loading" ? "Signing in…" : "Sign in"}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
        New staff?{" "}
        <Link component={NextLink} href="/register/staff" fontWeight={700} color="primary">
          Create your profile
        </Link>
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block", lineHeight: 1.5 }}>
        Pending staff cannot sign in until an admin approves. Contact your institution administrator
        for access.
      </Typography>
    </LoginBrandedLayout>
  );
}
