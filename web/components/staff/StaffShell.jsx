"use client";

import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useThemeMode } from "@/components/providers/ThemeModeContext";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import { logout } from "@/features/authSlice";
import { isAdminRole } from "@/lib/roles";

const drawerWidth = 268;

const staffNav = [
  { label: "Dashboard", href: "/staff/dashboard", icon: DashboardRoundedIcon },
  { label: "Upload Material", href: "/uploadFile", icon: CloudUploadRoundedIcon },
  { label: "My Materials", href: "/staff/materials", icon: LibraryBooksRoundedIcon },
  { label: "AI Assistant", href: "/staff/ai", icon: SmartToyRoundedIcon },
];

export default function StaffShell({ children }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const user = useSelector((s) => s.auth.user);
  const { mode, toggleMode } = useThemeMode();

  const nav = isAdminRole(user?.role)
    ? [
        {
          label: "Staff requests",
          href: "/admin/staff-requests",
          icon: ManageAccountsRoundedIcon,
        },
        ...staffNav,
      ]
    : staffNav;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor:
          theme.palette.mode === "light" ? "secondary.main" : "background.paper",
        borderRight:
          theme.palette.mode === "light"
            ? "1px solid rgba(26,26,26,0.06)"
            : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.2em",
            fontWeight: 800,
            color: "primary.main",
          }}
        >
          Staff Hub
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={Boolean(active)}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "inherit" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        <ListItemButton
          onClick={() => {
            dispatch(logout());
            window.location.href = "/login";
          }}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box className="min-h-screen flex bg-[var(--app-bg)]">
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor:
            theme.palette.mode === "light"
              ? "rgba(242, 232, 223, 0.92)"
              : "rgba(18,18,18,0.92)",
          backdropFilter: "blur(10px)",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar className="gap-2">
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: "none" } }}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {pathname?.startsWith("/admin")
              ? "Admin"
              : pathname?.startsWith("/uploadFile")
                ? "Upload Material"
                : pathname?.startsWith("/staff/materials")
                  ? "My Materials"
                  : pathname?.startsWith("/staff/ai")
                    ? "AI Assistant"
                    : "Dashboard"}
          </Typography>
          <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme">
            {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          </IconButton>
          <Box className="flex items-center gap-2 pl-1">
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
              {(user?.name || "S").slice(0, 1).toUpperCase()}
            </Avatar>
            <Box className="hidden sm:block leading-tight text-left">
              <Typography variant="body2" fontWeight={700}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Box className="max-w-6xl mx-auto w-full">{children}</Box>
      </Box>
    </Box>
  );
}
