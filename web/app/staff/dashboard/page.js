"use client";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { useSelector } from "react-redux";

const cards = [
  {
    title: "Upload material",
    desc: "Share PDFs or links organized by degree, year, and semester.",
    href: "/uploadFile",
    icon: CloudUploadRoundedIcon,
    cta: "Open uploader",
  },
  {
    title: "My materials",
    desc: "Review everything you have uploaded for your classes.",
    href: "/staff/materials",
    icon: LibraryBooksRoundedIcon,
    cta: "View list",
  },
  {
    title: "AI assistant",
    desc: "Ask general knowledge questions—fast answers without RAG.",
    href: "/staff/ai",
    icon: SmartToyRoundedIcon,
    cta: "Ask AI",
  },
];

export default function StaffDashboardPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ letterSpacing: "0.2em", fontWeight: 800, color: "primary.main" }}
      >
        Discover the educator within you
      </Typography>
      <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
        Welcome back, {user?.name?.split(" ")[0] || "there"}.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
        Your workspace is tuned for calm focus: upload once, stay organized, and keep a
        lightweight AI helper nearby for everyday questions.
      </Typography>

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Box key={c.href}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent className="flex flex-col gap-2 h-full">
                  <Box className="flex items-center gap-2">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "rgba(200,76,49,0.12)",
                        color: "primary.main",
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      {c.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {c.desc}
                  </Typography>
                  <Button
                    component={Link}
                    href={c.href}
                    variant="contained"
                    sx={{ alignSelf: "flex-start", mt: 1 }}
                  >
                    {c.cta}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
