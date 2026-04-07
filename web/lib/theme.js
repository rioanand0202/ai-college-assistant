import { createTheme } from "@mui/material/styles";

const accent = "#C84C31";
const cream = "#F2E8DF";
const sand = "#E5D5C5";

export function createAppTheme(mode) {
  const isLight = mode === "light";
  return createTheme({
    palette: {
      mode,
      primary: { main: accent, contrastText: "#ffffff" },
      secondary: { main: sand },
      ...(isLight
        ? {
            background: { default: cream, paper: "#FFFFFF" },
            text: { primary: "#1A1A1A", secondary: "#4a4a4a" },
            divider: "rgba(26, 26, 26, 0.08)",
          }
        : {
            background: { default: "#121212", paper: "#1E1E1E" },
            text: { primary: "#f5f5f5", secondary: "#c4c4c4" },
            divider: "rgba(255,255,255,0.08)",
          }),
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "var(--font-inter), system-ui, sans-serif",
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            "& fieldset": {
              borderColor:
                theme.palette.mode === "light"
                  ? "rgba(229, 213, 197, 0.95)"
                  : "rgba(255,255,255,0.22)",
            },
            "&:hover fieldset": {
              borderColor: theme.palette.primary.main,
            },
          }),
        },
      },
    },
  });
}
