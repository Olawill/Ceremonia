"use client";

import { useEffect, useState } from "react";

import { WeddingEngine } from "@/components/WeddingEngine";

import type { WeddingConfig } from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

import { ThemeProvider } from "@/lib/ThemeContext";

interface Props {
  initialConfig: WeddingConfig | null;
}

export function PreviewClient({ initialConfig }: Props) {
  const [config, setConfig] = useState<WeddingConfig>(
    initialConfig ?? DEMO_WEDDING_CONFIG,
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_CONFIG" && e.data.config) {
        setConfig(e.data.config);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <ThemeProvider initialThemeKey={config.themeKey}>
      <WeddingEngine config={config} />
    </ThemeProvider>
  );
}
