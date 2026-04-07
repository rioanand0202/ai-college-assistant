"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeModeContext = createContext({
  mode: "light",
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState("light");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("theme-mode")
        : null;
    const initial = saved === "dark" || saved === "light" ? saved : "light";
    setModeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setMode = useCallback((next) => {
    const m = next === "dark" ? "dark" : "light";
    setModeState(m);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme-mode", m);
      document.documentElement.classList.toggle("dark", m === "dark");
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
