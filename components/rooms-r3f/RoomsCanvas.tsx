"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

import { SpringCamera } from "@/components/rooms-r3f/camera/SpringCamera";
import { CastleDoor } from "@/components/rooms-r3f/CastleDoor";
import {
  CORRIDOR_LENGTH,
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
  TOTAL_SEGMENT,
} from "@/components/rooms-r3f/constants";
import { Corridor } from "@/components/rooms-r3f/Corridor";
import DustParticles from "@/components/rooms-r3f/effects/DustParticles";
import { Effects } from "@/components/rooms-r3f/effects/Effects";
import { NavigationControls } from "@/components/rooms-r3f/navigation/NavigationControls";
import {
  Room,
  type FeatureMode,
  type RoomTheme,
} from "@/components/rooms-r3f/Room";
import { useRoomsStore } from "@/components/rooms-r3f/store";
import { EventConfig } from "@/types/event";
import { Environment, useCursor } from "@react-three/drei";
import { useState } from "react";

// Dynamically import Canvas with SSR disabled to avoid WebGL context errors
// during server-side rendering and in restricted preview environments.
const R3FCanvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

interface Section {
  key: string;
  label: string;
}

interface SceneContentTheme {
  bg: string;
  bgMid: string;
  curtain: string;
  curtainDark: string;
  gold: string;
  goldLight: string;
  text: string;
}

interface RoomsCanvasProps {
  sections: Section[];
  theme: SceneContentTheme;
  dateRevealed: boolean;
  onDateRevealed: () => void;
  featureMode?: FeatureMode;
  isEditorPreview?: boolean;
  // Panel content nodes for each section's room — rendered as HTML overlays outside Canvas
  panelContents?: Array<{ key: string; node: React.ReactNode }>;
  config?: EventConfig;
}

interface SceneContentProps extends RoomsCanvasProps {
  activeRoomIndex: number;
  targetRoom: number;
  isMoving: boolean;
  activeSectionKey?: string;
  vibe?: {
    fogColor: string;
    lightColor: string;
    fogNear: number;
    fogFar: number;
    accentHex: string;
  };
}

interface InteractiveRoomProps {
  index: number;
  activeRoomIndex: number;
  isMoving: boolean;
  dateRevealed: boolean;
  sections: Section[];
  theme: SceneContentTheme;
  roomTheme: RoomTheme;
  sectionKey: string;
  corridorTheme: { floor: string; wall: string; accent: string };
  featureMode: FeatureMode;
  config?: EventConfig;
  onDateRevealed: () => void;
  onNudgeRight: () => void;
}

// Hoverable floor + clickable nudge zone for each room
function InteractiveRoom({
  index,
  activeRoomIndex,
  isMoving,
  dateRevealed,
  sections,
  theme,
  roomTheme,
  sectionKey,
  corridorTheme,
  featureMode,
  config,
  onDateRevealed,
  onNudgeRight,
}: InteractiveRoomProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !isMoving && index === activeRoomIndex);

  const roomZ = -index * TOTAL_SEGMENT;
  const isActive = index === activeRoomIndex;
  const hardMax = dateRevealed
    ? sections.length - 1
    : Math.min(1, sections.length - 1);
  const canNudge = isActive && !isMoving && index < hardMax;

  return (
    <group>
      {/* Hoverable floor plane for this room */}
      <mesh
        position={[0, -ROOM_HEIGHT / 2 + 0.01, roomZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (canNudge) onNudgeRight();
        }}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Invisible clickable zone at the far end of the room to nudge forward */}
      {isActive && !isMoving && (
        <mesh
          position={[0, 0, roomZ - ROOM_LENGTH * 0.35]}
          onClick={(e) => {
            e.stopPropagation();
            if (canNudge) onNudgeRight();
          }}
        >
          <boxGeometry args={[ROOM_WIDTH * 0.6, ROOM_HEIGHT * 0.5, 0.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* The room */}
      <Room
        position={[0, 0, roomZ]}
        theme={roomTheme}
        featureMode={featureMode}
        sectionKey={sectionKey}
        config={config}
        onDateRevealed={onDateRevealed}
      />

      {/* Entry door */}
      <CastleDoor
        position={[0, 0, roomZ + ROOM_LENGTH / 2]}
        rotation={[0, Math.PI, 0]}
        theme={theme}
        isOpen={index === 0 ? dateRevealed : false}
        isLocked={index === 0 ? !dateRevealed : false}
        onEnter={index === 0 ? onDateRevealed : undefined}
      />

      {/* Corridor to next room */}
      <Corridor
        position={[0, 0, roomZ + ROOM_LENGTH / 2 + CORRIDOR_LENGTH / 2]}
        theme={corridorTheme}
        featureMode={featureMode}
      />
    </group>
  );
}

// Error boundary that recovers from WebGL failures
class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: () => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(
      "[RoomsCanvas] Error caught by boundary:",
      error.message,
      error.stack,
    );
    // Notify parent so it can remount us with a new key to clear the error state
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#050505",
              color: "#D4AF3780",
              fontFamily: "var(--font-label)",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              gap: 12,
            }}
          >
            <div
              style={{ fontSize: 24, filter: "drop-shadow(0 0 8px #D4AF3740)" }}
            >
              ✦
            </div>
            <div>3D Rooms unavailable</div>
            <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: "0.1em" }}>
              Check console for details
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function SceneContent({
  sections,
  theme,
  dateRevealed,
  onDateRevealed,
  featureMode = "castle",
  activeRoomIndex,
  targetRoom,
  isMoving,
  isEditorPreview,
  activeSectionKey,
  config,
  vibe,
}: SceneContentProps) {
  // Derive room/corridor colors from the theme passed in
  const roomTheme: RoomTheme = {
    floor: theme.bgMid || theme.bg,
    floorAlt: theme.bg,
    wall: theme.curtain || theme.bgMid || theme.bg,
    wallDark: theme.curtainDark || theme.bg,
    accent: theme.gold,
    ceiling: theme.bgMid || theme.bg,
    curtain: theme.curtain || theme.bgMid || theme.bg,
    curtainDark: theme.curtainDark || theme.bg,
  };

  const corridorTheme = {
    floor: theme.bgMid || theme.bg,
    wall: theme.curtainDark || theme.bg,
    accent: theme.gold,
  };

  return (
    <>
      {/* Spring camera */}
      <SpringCamera
        activeRoomIndex={activeRoomIndex}
        targetRoom={targetRoom}
        isMoving={isMoving}
      />

      {/* Lighting — color shifts per room to match section atmosphere */}
      <ambientLight intensity={0.15} />
      <fog
        attach="fog"
        args={[
          vibe?.fogColor ?? theme.bg,
          vibe?.fogNear ?? 5,
          vibe?.fogFar ?? 35,
        ]}
      />

      {/* Background color */}
      <color attach="background" args={[vibe?.fogColor ?? theme.bg]} />

      {/* Per-room point lights */}
      {sections.map((_, i) => (
        <pointLight
          key={i}
          position={[0, 3, -i * TOTAL_SEGMENT]}
          intensity={i === activeRoomIndex ? 2 : 0.5}
          color={
            i === activeRoomIndex
              ? (vibe?.lightColor ?? theme.gold)
              : theme.gold
          }
          distance={12}
          decay={2}
        />
      ))}

      {/* Dust particles */}
      <DustParticles isEditorPreview={isEditorPreview} />

      {/* Postprocessing effects */}
      <Effects />

      {/* Environment preset — adds ambient reflections & lighting atmosphere, keyed to feature theme */}
      <Environment
        preset={
          featureMode === "beach"
            ? "sunset"
            : featureMode === "garden"
              ? "park"
              : featureMode === "farm"
                ? "dawn"
                : featureMode === "arcade"
                  ? "night"
                  : "city"
        }
        background={false}
        blur={0.5}
      />

      {/* Rooms and corridors */}
      {sections.map((section, index) => {
        // Only render the active room and its immediate neighbours.
        // Rooms further away are hidden by fog anyway, and culling them
        // prevents geometry bleed-through and saves draw calls.
        if (Math.abs(index - activeRoomIndex) > 1) return null;

        return (
          <InteractiveRoom
            key={section.key}
            index={index}
            sectionKey={section.key}
            sections={sections}
            theme={theme}
            roomTheme={roomTheme}
            corridorTheme={corridorTheme}
            featureMode={featureMode}
            activeRoomIndex={activeRoomIndex}
            isMoving={isMoving}
            dateRevealed={dateRevealed}
            onDateRevealed={onDateRevealed}
            onNudgeRight={() => useRoomsStore.getState().navigate(index + 1)}
            config={config}
          />
        );
      })}
    </>
  );
}

// Section key → atmospheric config for the active room
const SECTION_VIBE: Record<
  string,
  {
    fogColor: string;
    lightColor: string;
    fogNear: number;
    fogFar: number;
    accentHex: string;
  }
> = {
  hero: {
    fogColor: "#0a0508",
    lightColor: "#ffe8b0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#d4af37",
  },
  scratch: {
    fogColor: "#0a0510",
    lightColor: "#e8d0ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#b08aff",
  },
  countdown: {
    fogColor: "#080a10",
    lightColor: "#c0e8ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#60c0ff",
  },
  timeline: {
    fogColor: "#0a0805",
    lightColor: "#e8f0c0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#c0e080",
  },
  gallery: {
    fogColor: "#0a0508",
    lightColor: "#ffd0e8",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ff80c0",
  },
  venue: {
    fogColor: "#050a08",
    lightColor: "#c0ffe8",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#40e0a0",
  },
  dresscode: {
    fogColor: "#0a0508",
    lightColor: "#ffc0e0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ff60b0",
  },
  accommodation: {
    fogColor: "#050808",
    lightColor: "#c0f0e8",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#40c0b0",
  },
  eventParty: {
    fogColor: "#0a0805",
    lightColor: "#ffe080",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ffd040",
  },
  faq: {
    fogColor: "#080810",
    lightColor: "#d0e8ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#6090ff",
  },
  livestream: {
    fogColor: "#080810",
    lightColor: "#e0c0ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#a060ff",
  },
  travel: {
    fogColor: "#050a08",
    lightColor: "#c0ffc0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#40ff80",
  },
  menu: {
    fogColor: "#100a05",
    lightColor: "#ffe0a0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ffb040",
  },
  rsvp: {
    fogColor: "#050510",
    lightColor: "#e0d0ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#9080ff",
  },
  registry: {
    fogColor: "#0a0510",
    lightColor: "#ffd0e0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ff80a0",
  },
  guestbook: {
    fogColor: "#080510",
    lightColor: "#f0e0ff",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#c080ff",
  },
  finale: {
    fogColor: "#0a0505",
    lightColor: "#ffe0d0",
    fogNear: 10,
    fogFar: 16,
    accentHex: "#ff8060",
  },
};
function getVibe(key: string) {
  return SECTION_VIBE[key] ?? SECTION_VIBE.hero;
}

// Section keys that have a full 3D room implementation in SectionProps.
// These sections render entirely inside the Canvas — no HTML panel overlay.
const SECTIONS_WITH_3D_ROOM = new Set(["hero", "scratch"]);

export function RoomsCanvas({
  sections,
  theme,
  dateRevealed,
  onDateRevealed,
  featureMode = "castle",
  isEditorPreview = false,
  panelContents,
  config,
}: RoomsCanvasProps) {
  const activeRoom = useRoomsStore((s) => s.activeRoom);
  const targetRoom = useRoomsStore((s) => s.targetRoom);
  const isMoving = useRoomsStore((s) => s.isMoving);

  const [boundaryKey, setBoundaryKey] = useState(0);

  const activeSection = sections[activeRoom];
  const vibe = activeSection ? getVibe(activeSection.key) : SECTION_VIBE.hero;
  const activePanel = panelContents?.find((p) => p.key === activeSection?.key);

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[RoomsCanvas] render", {
      activeRoom,
      targetRoom,
      isMoving,
      sectionsCount: sections.length,
      activeSectionKey: activeSection?.key,
      hasPanel: !!activePanel,
      panelNode: activePanel?.node,
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Canvas is wrapped in an error boundary so WebGL failures don't crash the app */}
      <WebGLErrorBoundary
        key={boundaryKey}
        onError={() => {
          // After a short delay, remount the boundary with a clean slate.
          // By then Effects.tsx's deferred mount will avoid the crash.
          setTimeout(() => setBoundaryKey((k) => k + 1), 100);
        }}
        fallback={
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: theme.bg,
              color: theme.gold,
              fontFamily: "var(--font-label)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            WebGL not available in this environment — try undocking
          </div>
        }
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {/* Opaque background behind canvas — fallback if WebGL is unavailable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#050505",
              zIndex: -1,
            }}
          />
          <R3FCanvas
            style={{ display: "block", width: "100%", height: "100%" }}
            camera={{ fov: 70, near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false,
            }}
            shadows={!isEditorPreview}
            frameloop="always"
            onCreated={({ gl }) => {
              gl.setClearColor(0x050505, 1);
              gl.domElement.addEventListener("webglcontextlost", (e) => {
                console.warn("[RoomsCanvas] WebGL context lost");
                e.preventDefault();
              });
              gl.domElement.addEventListener("webglcontextrestored", () => {
                console.warn("[RoomsCanvas] WebGL context restored");
                const r = gl as unknown as {
                  scene: object;
                  camera: object;
                  render: (s: object, c: object) => void;
                };
                r.render && r.render(r.scene, r.camera);
              });
            }}
          >
            <SceneContent
              sections={sections}
              theme={theme}
              dateRevealed={dateRevealed}
              onDateRevealed={onDateRevealed}
              featureMode={featureMode}
              isEditorPreview={isEditorPreview}
              activeRoomIndex={activeRoom}
              targetRoom={targetRoom}
              isMoving={isMoving}
              activeSectionKey={activeSection?.key}
              vibe={vibe}
              config={config}
            />
          </R3FCanvas>
        </div>
      </WebGLErrorBoundary>

      {/* Room info panel — HTML overlay that changes per room, rendered outside Canvas */}
      {activePanel && !SECTIONS_WITH_3D_ROOM.has(activeSection?.key ?? "") && (
        <div
          style={{
            position: "absolute",
            top: "clamp(12px, 3vh, 32px)",
            bottom: "clamp(100px, 18vh, 160px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "clamp(300px, 85vw, 860px)",
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              position: "relative",
              width: "100%",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {activePanel.node}
          </div>
        </div>
      )}

      {/* Navigation controls render outside Canvas — always visible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <NavigationControls
          sections={sections}
          activeRoomIndex={activeRoom}
          onNavigate={(index) => useRoomsStore.getState().navigate(index)}
          theme={theme}
          maxAllowedIndex={sections.length - 1}
          dateRevealed={dateRevealed}
        />
      </div>
    </div>
  );
}
