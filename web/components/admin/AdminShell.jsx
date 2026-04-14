"use client";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/features/authSlice";

export default function AdminShell({ children }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  return (
    <Box className="min-h-screen flex flex-col bg-[var(--app-bg)]">
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: (t) =>
            t.palette.mode === "light"
              ? "rgba(242, 232, 223, 0.95)"
              : "rgba(18,18,18,0.95)",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar className="gap-3 flex-wrap">
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            Admin
          </Typography>
          <Button component={Link} href="/admin/staff-requests" color="inherit" size="small">
            Staff requests
          </Button>
          <Button component={Link} href="/admin/events" color="inherit" size="small">
            Events
          </Button>
          <Button component={Link} href="/staff/dashboard" color="inherit" size="small">
            Staff dashboard
          </Button>
          <Box className="flex items-center gap-2">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {(user?.name || "A").slice(0, 1).toUpperCase()}
            </Avatar>
            <Typography variant="body2" className="hidden sm:block">
              {user?.email}
            </Typography>
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(logout());
                window.location.href = "/login";
              }}
            >
              Log out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" className="flex-1 p-3 sm:p-4 max-w-4xl mx-auto w-full">
        {children}
      </Box>
    </Box>
  );
}
