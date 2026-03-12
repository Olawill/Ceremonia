"use client";

import { useEffect, useRef, useState } from "react";

import { WeddingEngine } from "@/components/WeddingEngine";

import { WeddingTheme } from "@/types/theme";
import type { WeddingConfig } from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

import { usePlan } from "@/hooks/usePlan";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";

interface Props {
  initialConfig: WeddingConfig | null;
}

// Inner component — lives inside ThemeProvider so it can call useTheme()
function PreviewInner({
  config,
  onConfigChange,
}: {
  config: WeddingConfig;
  onConfigChange: (c: WeddingConfig) => void;
}) {
  const { plan } = usePlan();
  const { setCustomTheme, setThemeKey } = useTheme();

  // Use refs so the handler never goes stale and the effect never re-runs
  const configRef = useRef(config);
  const onConfigChangeRef = useRef(onConfigChange);
  const setCustomThemeRef = useRef(setCustomTheme);
  const setThemeKeyRef = useRef(setThemeKey);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    setCustomThemeRef.current = setCustomTheme;
  }, [setCustomTheme]);

  useEffect(() => {
    setThemeKeyRef.current = setThemeKey;
  }, [setThemeKey]);

  useEffect(() => {
    // Signal to the parent editor that this page is ready to receive config
    window.parent.postMessage({ type: "PREVIEW_READY" }, "*");

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_CONFIG" && e.data.config) {
        const incoming: WeddingConfig = e.data.config;
        onConfigChangeRef.current(e.data.config);
        // Re-apply custom theme if present — PREVIEW_CONFIG fires after every
        // config change and would otherwise reset the live colour edits
        if (incoming.customTheme) {
          // Custom theme — apply it directly to ThemeContext
          setCustomThemeRef.current(incoming.customTheme);
        } else {
          // Built-in theme selected — clear custom, switch theme key
          setThemeKeyRef.current(incoming.themeKey ?? "royal");
        }
      }

      if (e.data?.type === "THEME_UPDATE" && e.data.theme) {
        setCustomThemeRef.current(e.data.theme as WeddingTheme);
        onConfigChangeRef.current({
          ...configRef.current,
          customTheme: e.data.theme,
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []); // ← empty deps, handler never re-registers

  return <WeddingEngine config={config} />;
}

export function PreviewClient({ initialConfig }: Props) {
  const [config, setConfig] = useState<WeddingConfig>(
    initialConfig ?? DEMO_WEDDING_CONFIG,
  );

  return (
    <ThemeProvider initialThemeKey={config.themeKey}>
      <PreviewInner config={config} onConfigChange={setConfig} />
    </ThemeProvider>
  );
}
