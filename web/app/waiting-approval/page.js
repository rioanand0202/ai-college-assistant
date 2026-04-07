"use client";

import { Paper, Typography, Button } from "@mui/material";
import Link from "next/link";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";

export default function WaitingApprovalPage() {
  return (
    <AuthSplitLayout
      eyebrow="Staff onboarding"
      title="Waiting for approval"
      subtitle="An administrator must approve your account before you can sign in."
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Registration was successful. You can log in once an admin approves your profile for your
          college.
        </Typography>
        <Button component={Link} href="/login" variant="contained" fullWidth>
          Back to login
        </Button>
      </Paper>
    </AuthSplitLayout>
  );
}
