"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { ThemeKey, WeddingTheme } from "@/types/theme";
import { themes, defaultThemeKey } from "@/themes";

interface ThemeContextValue {
  themeKey: ThemeKey;
  theme: WeddingTheme;
  setThemeKey: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(defaultThemeKey);

  const setThemeKey = (key: ThemeKey) => {
    setThemeKeyState(key);
    document.documentElement.setAttribute("data-theme", key === "royal" ? "" : key);
  };

  useEffect(() => {
    // Ensure initial data-theme is set
    if (themeKey !== "royal") {
      document.documentElement.setAttribute("data-theme", themeKey);
    }
  }, [themeKey]);

  return (
    <ThemeContext.Provider
      value={{ themeKey, theme: themes[themeKey], setThemeKey }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
