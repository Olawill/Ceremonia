"use client";

import { useMemo } from "react";

import { useTheme } from "@/lib/ThemeContext";
import { type EventConfig } from "@/types/event";

import { type FeatureMode } from "@/components/rooms-r3f/Room";
import { RoomsCanvas } from "@/components/rooms-r3f/RoomsCanvas";

interface Section {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface RoomsEngineR3FProps {
  config: EventConfig;
  sections: Section[];
  dateRevealed: boolean;
  onDateRevealed: () => void;
  isEditorPreview?: boolean;
}

// Derive feature mode from event type
function getFeatureMode(eventType: string): FeatureMode {
  switch (eventType) {
    case "wedding":
    case "engagement":
    case "anniversary":
      return "castle";
    case "birthday":
      return "arcade";
    case "baby_shower":
    case "bridal_shower":
      return "garden";
    case "graduation":
      return "arcade";
    case "housewarming":
      return "farm";
    case "christening":
      return "garden";
    case "corporate":
      return "arcade";
    default:
      return "castle";
  }
}

export function RoomsEngineR3F({
  config,
  sections,
  dateRevealed,
  onDateRevealed,
  isEditorPreview = false,
}: RoomsEngineR3FProps) {
  const { theme } = useTheme();

  const featureMode = useMemo(
    () => getFeatureMode(config.eventType),
    [config.eventType],
  );

  // Map theme to the format expected by RoomsCanvas
  const sceneTheme = useMemo(
    () => ({
      bg: theme.bg,
      bgMid: theme.bgMid,
      curtain: theme.curtain,
      curtainDark: theme.curtainDark,
      gold: theme.gold,
      goldLight: theme.goldLight,
      text: theme.text,
    }),
    [theme],
  );

  // Create simplified section data for the 3D scene
  const sceneSections = useMemo(
    () =>
      sections.map((s) => ({
        key: s.key,
        label: s.label,
      })),
    [sections],
  );

  return (
    <RoomsCanvas
      sections={sceneSections}
      theme={sceneTheme}
      dateRevealed={dateRevealed}
      onDateRevealed={onDateRevealed}
      featureMode={featureMode}
      isEditorPreview={isEditorPreview}
      panelContents={sections.map((s) => ({ key: s.key, node: s.node }))}
    />
  );
}
