"use client";

import { defaultThemeKey, themes } from "@/themes";
import type { ThemeKey, WeddingTheme } from "@/types/theme";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface ThemeContextValue {
  themeKey: ThemeKey;
  theme: WeddingTheme;
  setThemeKey: (key: ThemeKey) => void;
  setCustomTheme: (theme: WeddingTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialThemeKey,
}: {
  children: ReactNode;
  initialThemeKey?: ThemeKey;
}) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(
    initialThemeKey ?? defaultThemeKey,
  );

  const [customTheme, setCustomThemeState] = useState<WeddingTheme | null>(
    null,
  );

  const theme = customTheme ?? themes[themeKey];

  const setThemeKey = (key: ThemeKey) => {
    setThemeKeyState(key);
    setCustomThemeState(null); // switching built-in theme clears custom
    document.documentElement.setAttribute(
      "data-theme",
      key === "royal" ? "" : key,
    );
  };

  const setCustomTheme = (t: WeddingTheme) => {
    setCustomThemeState(t);
  };

  // Only apply CSS vars for built-in theme switches — skip when custom is active
  useEffect(() => {
    if (customTheme) return;
    const root = document.documentElement;
    const t = themes[themeKey];
    if (themeKey !== "royal") {
      document.documentElement.setAttribute("data-theme", themeKey);
    }
    root.style.setProperty("--curtain", t.curtain);
    root.style.setProperty("--curtain-dark", t.curtainDark);
    root.style.setProperty("--curtain-sheen", t.curtainSheen);
    root.style.setProperty("--gold", t.gold);
    root.style.setProperty("--gold-light", t.goldLight);
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--bg-mid", t.bgMid);
    root.style.setProperty("--text", t.text);
  }, [themeKey, customTheme]);

  return (
    <ThemeContext.Provider
      value={{ themeKey, theme, setThemeKey, setCustomTheme }}
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
