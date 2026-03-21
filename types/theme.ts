export type ThemeKey =
  | "royal"
  | "midnight"
  | "forest"
  | "blush"
  | "slate"
  | "desert"
  | "celestial"
  | "noir"
  | "ivory"
  | "sakura"
  | "obsidian"
  | "terracotta"
  | "sage"
  | "custom";

export interface EventTheme {
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
  panelCount?: number;
  bladeCount?: number;
}
