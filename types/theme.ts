export type ThemeKey = "royal" | "midnight" | "forest";

export interface WeddingTheme {
  key: ThemeKey;
  name: string;
  /** CSS custom property values – applied as data-theme attribute */
  curtain: string;
  curtainDark: string;
  curtainSheen: string;
  gold: string;
  goldLight: string;
  bg: string;
  bgMid: string;
  text: string;
  particle: string;
}
