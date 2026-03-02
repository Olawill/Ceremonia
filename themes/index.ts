import { env } from "@/env";
import type { ThemeKey, WeddingTheme } from "@/types/theme";

export const themes: Record<ThemeKey, WeddingTheme> = {
  royal: {
    key: "royal",
    name: "Royal Crimson",
    curtain: "#6A0D17",
    curtainDark: "#3D0610",
    curtainSheen: "#9B1525",
    gold: "#D4AF37",
    goldLight: "#F0D060",
    bg: "#0A0A0A",
    bgMid: "#120808",
    text: "#F5F0E8",
    particle: "rgba(212,175,55,0.4)",
  },
  midnight: {
    key: "midnight",
    name: "Midnight Navy",
    curtain: "#0D1B4A",
    curtainDark: "#060D25",
    curtainSheen: "#1A2E72",
    gold: "#C9A84C",
    goldLight: "#E8CC70",
    bg: "#050510",
    bgMid: "#08081A",
    text: "#E8F0FF",
    particle: "rgba(201,168,76,0.35)",
  },
  forest: {
    key: "forest",
    name: "Enchanted Forest",
    curtain: "#1A3D2E",
    curtainDark: "#0D1F17",
    curtainSheen: "#2D6B4E",
    gold: "#D4AF37",
    goldLight: "#F0D060",
    bg: "#080F0B",
    bgMid: "#0F1A12",
    text: "#F0F8F0",
    particle: "rgba(212,175,55,0.35)",
  },
};

export const defaultThemeKey: ThemeKey =
  (env.NEXT_PUBLIC_WEDDING_THEME as ThemeKey | undefined) ?? "royal";

export const activeTheme: WeddingTheme = themes[defaultThemeKey];
