"use client";

import dynamic from "next/dynamic";
import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";

import { SpringCamera } from "@/components/rooms-r3f/camera/SpringCamera";
import { CastleDoor } from "@/components/rooms-r3f/CastleDoor";
import {
  CORRIDOR_LENGTH,
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
  TOTAL_SEGMENT,
} from "@/components/rooms-r3f/constants";
import DustParticles from "@/components/rooms-r3f/effects/DustParticles";
import { Effects } from "@/components/rooms-r3f/effects/Effects";
import { NavigationControls } from "@/components/rooms-r3f/navigation/NavigationControls";
import {
  Room,
  type FeatureMode,
  type RoomTheme,
} from "@/components/rooms-r3f/Room";
import { useRoomsStore } from "@/components/rooms-r3f/store";
import { preloadAllRoomTextures } from "@/lib/roomTextures";
import { EventConfig } from "@/types/event";
import { Environment, useCursor } from "@react-three/drei";
import { useState } from "react";
import { Corridor } from "./Corridor";
import { WorldEnvironment } from "./world/WorldEnvironment";

// Dynamically import Canvas with SSR disabled to avoid WebGL context errors
// during server-side rendering and in restricted preview environments.
const R3FCanvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

// Warm texture cache immediately when this module loads — before any Canvas mounts.
// This means useTexture() inside room shells resolves synchronously, preventing
// mid-render Suspense waterfalls that cause accessories to pop in after the room.
preloadAllRoomTextures();

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
  onReady?: () => void;
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
  targetRoom: number;
  onDateRevealed: () => void;
  onNudgeRight: () => void;
}

// Hoverable floor + clickable nudge zone for each room
function InteractiveRoom({
  index,
  activeRoomIndex,
  isMoving,
  targetRoom,
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

  const isInside = isActive && !isMoving;

  return (
    <group>
      {/* Clickable floor — only active when inside the room */}
      {isInside && !isMoving && (
        <mesh
          position={[0, -ROOM_HEIGHT / 2 + 0.01, roomZ - ROOM_LENGTH * 0.3]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (canNudge) onNudgeRight();
          }}
        >
          <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH * 0.6]} />
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

      {/* Exit door — at the BACK of the room, what the camera looks toward */}
      {index < sections.length - 1 && (
        <CastleDoor
          position={[0, 0, roomZ - ROOM_LENGTH + 0.15]}
          rotation={[0, 0, 0]}
          theme={theme}
          isOpen={activeRoomIndex > index}
          isLocked={!dateRevealed && index >= 1}
          onEnter={() => {
            if (canNudge) onNudgeRight();
          }}
        />
      )}

      {/* Corridor — only rendered while camera is travelling through it.
    Show when moving and this room is either the departure or arrival point. */}
      {index < sections.length - 1 &&
        isMoving &&
        (index === activeRoomIndex || index === targetRoom - 1) && (
          <Corridor
            position={[0, 0, roomZ - ROOM_LENGTH / 2 - CORRIDOR_LENGTH / 2]}
            theme={corridorTheme}
            featureMode={featureMode}
            isLocked={false}
          />
        )}
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

// Add near the top of the file, after imports:
function WebGLLoadingOverlay({
  ready,
  gold,
}: {
  ready: boolean;
  gold: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        transition: "opacity 0.6s ease",
        opacity: ready ? 0 : 1,
        pointerEvents: ready ? "none" : "auto",
      }}
    >
      {/* Spinning ring */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: `2px solid ${gold}20`,
          borderTopColor: gold,
          animation: "rooms-spin 1s linear infinite",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-label, sans-serif)",
          fontSize: 10,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: `${gold}70`,
        }}
      >
        Preparing rooms
      </p>
      <style>{`
        @keyframes rooms-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
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
  onReady,
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

  const peekTarget = useRoomsStore((s) => s.peekTarget);

  // Signal ready on first mount — by this point Suspense has resolved all
  // useTexture promises, so the full scene including accessories is loaded.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onReadyRef.current?.();
  }, []); // empty deps — fires once after first render

  return (
    <>
      {/* Spring camera */}
      <SpringCamera
        activeRoomIndex={activeRoomIndex}
        targetRoom={targetRoom}
        isMoving={isMoving}
        peekTarget={peekTarget}
      />

      {/* Lighting — color shifts per room to match section atmosphere */}
      <ambientLight intensity={0.15} />
      <fog
        attach="fog"
        args={[
          vibe?.fogColor ?? theme.bg,
          vibe?.fogNear ?? 8,
          vibe?.fogFar ?? 15,
        ]}
      />

      {/* Background color */}
      <color attach="background" args={[vibe?.fogColor ?? theme.bg]} />

      {/* Per-room point lights */}
      {sections.map((_, i) => {
        if (i !== activeRoomIndex) return null;
        return (
          <pointLight
            key={i}
            position={[0, 3, -i * TOTAL_SEGMENT]}
            intensity={i === activeRoomIndex ? 2 : 0.5}
            color={vibe?.lightColor ?? theme.gold}
            distance={12}
            decay={2}
          />
        );
      })}

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

      {/* World environment — fills the void with a themed world */}
      <WorldEnvironment
        featureMode={featureMode}
        sectionCount={sections.length}
        accentColor={theme.gold}
      />

      {/* Rooms and corridors */}
      {sections.map((section, index) => {
        // Only render the active room and the target room (during travel).
        // Tight fog hides everything beyond the current room's back wall.
        if (index !== activeRoomIndex && index !== targetRoom) return null;

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
            targetRoom={targetRoom}
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
    fogNear: 8,
    fogFar: 15,
    accentHex: "#d4af37",
  },
  scratch: {
    fogColor: "#0a0510",
    lightColor: "#e8d0ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#b08aff",
  },
  countdown: {
    fogColor: "#080a10",
    lightColor: "#c0e8ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#60c0ff",
  },
  timeline: {
    fogColor: "#0a0805",
    lightColor: "#e8f0c0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#c0e080",
  },
  gallery: {
    fogColor: "#0a0508",
    lightColor: "#ffd0e8",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ff80c0",
  },
  venue: {
    fogColor: "#050a08",
    lightColor: "#c0ffe8",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#40e0a0",
  },
  dresscode: {
    fogColor: "#0a0508",
    lightColor: "#ffc0e0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ff60b0",
  },
  accommodation: {
    fogColor: "#050808",
    lightColor: "#c0f0e8",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#40c0b0",
  },
  eventParty: {
    fogColor: "#0a0805",
    lightColor: "#ffe080",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ffd040",
  },
  faq: {
    fogColor: "#080810",
    lightColor: "#d0e8ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#6090ff",
  },
  livestream: {
    fogColor: "#080810",
    lightColor: "#e0c0ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#a060ff",
  },
  travel: {
    fogColor: "#050a08",
    lightColor: "#c0ffc0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#40ff80",
  },
  menu: {
    fogColor: "#100a05",
    lightColor: "#ffe0a0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ffb040",
  },
  rsvp: {
    fogColor: "#050510",
    lightColor: "#e0d0ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#9080ff",
  },
  registry: {
    fogColor: "#0a0510",
    lightColor: "#ffd0e0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ff80a0",
  },
  guestbook: {
    fogColor: "#080510",
    lightColor: "#f0e0ff",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#c080ff",
  },
  finale: {
    fogColor: "#0a0505",
    lightColor: "#ffe0d0",
    fogNear: 8,
    fogFar: 15,
    accentHex: "#ff8060",
  },
};
function getVibe(key: string) {
  return SECTION_VIBE[key] ?? SECTION_VIBE.hero;
}

function PanContainer({ children }: { children: React.ReactNode }) {
  const setPeek = useRoomsStore((s) => s.setPeek);
  const isMoving = useRoomsStore((s) => s.isMoving);
  const dragStartX = useRef<number | null>(null);
  const dragStartPeek = useRef(0);
  const currentPeek = useRef(0);

  const MAX_PEEK = 4.5; // world units — max horizontal look offset

  const dragThreshold = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Only capture pointer for the scratch card canvas specifically —
    // not the WebGL canvas or polaroid click targets
    const target = e.target as HTMLElement;
    if (target.closest("[data-scratch]")) {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      dragStartX.current = null;
      return;
    }

    dragStartX.current = e.clientX;
    dragStartPeek.current = currentPeek.current;
    dragThreshold.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    if (isMoving) return;
    const dx = e.clientX - dragStartX.current;
    // 400px drag = MAX_PEEK world units
    const peek = Math.max(
      -MAX_PEEK,
      Math.min(MAX_PEEK, dragStartPeek.current - (dx / 400) * MAX_PEEK),
    );
    currentPeek.current = peek;
    setPeek(peek);
  };

  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    // Spring back to centre
    currentPeek.current = 0;
    setPeek(0);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  );
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
  const [canvasReady, setCanvasReady] = useState(false);

  const canvasFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset store state on every mount so stale phase/movement from a previous
  // session never causes an initial flash or broken navigation state.
  useEffect(() => {
    useRoomsStore.getState().reset();
  }, []);

  useEffect(() => {
    return () => {
      if (canvasFallbackRef.current) clearTimeout(canvasFallbackRef.current);
    };
  }, []);

  const activeSection = sections[activeRoom];
  const vibe = activeSection ? getVibe(activeSection.key) : SECTION_VIBE.hero;
  const activePanel = panelContents?.find((p) => p.key === activeSection?.key);
  const accent = theme.gold;

  const openCard = useRoomsStore((s) => s.openCard);
  const openHotelIndex = useRoomsStore((s) => s.openHotelIndex);
  const setOpenHotelIndex = useRoomsStore((s) => s.setOpenHotelIndex);
  const openPartyMember = useRoomsStore((s) => s.openPartyMember);
  const setOpenPartyMember = useRoomsStore((s) => s.setOpenPartyMember);

  const hotelOptions = config?.accommodation?.options ?? [];
  const activeHotel =
    openHotelIndex !== null ? (hotelOptions[openHotelIndex] ?? null) : null;

  const openFaqIndex = useRoomsStore((s) => s.openFaqIndex);
  const setOpenFaqIndex = useRoomsStore((s) => s.setOpenFaqIndex);
  const faqItems = config?.faq ?? [];
  const activeFaq =
    openFaqIndex !== null ? (faqItems[openFaqIndex] ?? null) : null;
  const openTravelFrame = useRoomsStore((s) => s.openTravelFrame);
  const setOpenTravelFrame = useRoomsStore((s) => s.setOpenTravelFrame);
  const openMenuScroll = useRoomsStore((s) => s.openMenuScroll);
  const setOpenMenuScroll = useRoomsStore((s) => s.setOpenMenuScroll);

  useEffect(() => {
    if (activeSection?.key !== "accommodation") {
      useRoomsStore.getState().setOpenHotelIndex(null);
    }

    if (activeSection?.key !== "eventParty") {
      useRoomsStore.getState().setOpenPartyMember(null);
    }

    if (activeSection?.key !== "faq") {
      useRoomsStore.getState().setOpenFaqIndex(null);
    }

    if (activeSection?.key !== "travel") {
      useRoomsStore.getState().setOpenTravelFrame(null);
    }

    if (activeSection?.key !== "menu") {
      useRoomsStore.getState().setOpenMenuScroll(null);
    }
  }, [activeSection?.key]);

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
    <PanContainer>
      {/* Canvas is wrapped in an error boundary so WebGL failures don't crash the app */}
      <WebGLErrorBoundary
        key={boundaryKey}
        onError={() => {
          // After a short delay, remount the boundary with a clean slate.
          // By then Effects.tsx's deferred mount will avoid the crash.
          setCanvasReady(false);
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
              // Hard fallback — if Effects never signals ready (e.g. context attributes
              // unavailable in undocked popup), clear the loading overlay after 4s.
              canvasFallbackRef.current = setTimeout(
                () => setCanvasReady(true),
                4000,
              );

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
            <Suspense fallback={null}>
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
                onReady={() => {
                  if (canvasFallbackRef.current)
                    clearTimeout(canvasFallbackRef.current);
                  setCanvasReady(true);
                }}
              />
            </Suspense>
          </R3FCanvas>
        </div>
      </WebGLErrorBoundary>

      {/* Loading overlay — shown until WebGL canvas is ready, sits above boundary */}
      <WebGLLoadingOverlay ready={canvasReady} gold={theme.gold} />

      {/* Room info panel — HTML overlay that changes per room, rendered outside Canvas */}
      {/* {activePanel && !SECTIONS_WITH_3D_ROOM.has(activeSection?.key ?? "") && (
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
      )} */}

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
          dateRevealed={dateRevealed}
        />
      </div>

      {openCard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            useRoomsStore.getState().setOpenCard(null);
            useRoomsStore.getState().setZoomOffset(0);
            useRoomsStore.getState().setPeek(0);
          }}
        >
          <div
            style={{
              background: "#F5EFE4",
              borderRadius: 8,
              padding: "34px 38px",
              maxWidth: 390,
              width: "88vw",
              textAlign: "center",
              boxShadow: `0 28px 90px rgba(0,0,0,0.98), 0 0 0 3px ${accent}90, 0 0 60px rgba(0,0,0,0.8)`,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                useRoomsStore.getState().setOpenCard(null);
                useRoomsStore.getState().setZoomOffset(0);
                useRoomsStore.getState().setPeek(0);
              }}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#666",
              }}
            >
              ×
            </button>
            <div
              style={{
                background: "#14100a",
                borderRadius: 4,
                padding: "18px 14px 14px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  color: accent,
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                }}
              >
                {openCard.year}
              </p>
              <div style={{ fontSize: 50, lineHeight: 1 }}>{openCard.icon}</div>
            </div>
            <h2
              style={{
                fontFamily: "serif",
                fontSize: 24,
                fontWeight: 700,
                color: "#180e04",
                margin: "0 0 8px",
              }}
            >
              {openCard.title}
            </h2>
            <div
              style={{
                width: 68,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                margin: "0 auto 16px",
              }}
            />
            <p
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: 15,
                color: "#3a2818",
                lineHeight: 1.78,
                margin: 0,
              }}
            >
              {openCard.desc}
            </p>

            {openCard.desc.startsWith("http") && (
              <a
                href={openCard.desc}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  marginTop: 16,
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1.5px solid ${accent}`,
                  color: accent,
                  fontFamily: "serif",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                ▶ Join Stream →
              </a>
            )}
          </div>
        </div>
      )}

      {activeHotel && openHotelIndex !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpenHotelIndex(null)}
        >
          <div
            style={{
              background: "#F5EFE4",
              borderRadius: 12,
              padding: "32px 36px",
              maxWidth: 420,
              width: "90vw",
              boxShadow: `0 24px 80px rgba(0,0,0,0.9), 0 0 0 2px ${accent}60`,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setOpenHotelIndex(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#666",
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Counter */}
            <p
              style={{
                fontFamily: "var(--font-label, sans-serif)",
                fontSize: 10,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: accent + "80",
                margin: "0 0 12px",
                textAlign: "center",
              }}
            >
              {openHotelIndex + 1} of {hotelOptions.length}
            </p>

            {/* Header band */}
            <div
              style={{
                background: accent,
                borderRadius: 8,
                padding: "14px 18px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#f5f0e8",
                  margin: 0,
                }}
              >
                🏨 {activeHotel.name}
              </p>
              {activeHotel.stars && (
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#f5f0e8cc",
                    fontSize: 18,
                  }}
                >
                  {"★".repeat(activeHotel.stars)}
                </p>
              )}
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeHotel.pricePerNight && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1a0e04",
                    margin: 0,
                  }}
                >
                  💰 {activeHotel.pricePerNight}
                </p>
              )}
              {activeHotel.distanceFromVenue && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontSize: 15,
                    color: "#3a2510",
                    margin: 0,
                  }}
                >
                  📍 {activeHotel.distanceFromVenue}
                </p>
              )}
              {activeHotel.address && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontSize: 14,
                    color: "#5a4030",
                    margin: 0,
                  }}
                >
                  🏠 {activeHotel.address}
                </p>
              )}
              {activeHotel.description && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontStyle: "italic",
                    fontSize: 14,
                    color: "#3a2510",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {activeHotel.description}
                </p>
              )}
              {activeHotel.bookingDeadline && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontSize: 14,
                    color: "#8b1a1a",
                    margin: 0,
                  }}
                >
                  📅 Book by {activeHotel.bookingDeadline}
                </p>
              )}
              {activeHotel.blockCode && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    color: "#1a0e04",
                    margin: 0,
                    background: accent + "18",
                    padding: "4px 10px",
                    borderRadius: 4,
                  }}
                >
                  Code: {activeHotel.blockCode}
                </p>
              )}
              {activeHotel.phone && (
                <p
                  style={{
                    fontFamily: "serif",
                    fontSize: 14,
                    color: "#1a0e04",
                    margin: 0,
                  }}
                >
                  📞 {activeHotel.phone}
                </p>
              )}
            </div>

            {/* Book button */}
            {activeHotel.bookingUrl && (
              <a
                href={activeHotel.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  marginTop: 20,
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: 8,
                  border: `1.5px solid ${accent}`,
                  color: accent,
                  fontFamily: "serif",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                Reserve Now →
              </a>
            )}

            {/* Prev / Next — navigates ALL options, not just the 4 shown on desk */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[
                {
                  l: "← Prev",
                  enabled: openHotelIndex > 0,
                  fn: () => setOpenHotelIndex(openHotelIndex - 1),
                },
                {
                  l: "Next →",
                  enabled: openHotelIndex < hotelOptions.length - 1,
                  fn: () => setOpenHotelIndex(openHotelIndex + 1),
                },
              ].map(({ l, enabled, fn }) => (
                <button
                  key={l}
                  onClick={enabled ? fn : undefined}
                  style={{
                    flex: 1,
                    background: enabled ? accent : "transparent",
                    border: `1.5px solid ${enabled ? accent : "#ccc"}`,
                    borderRadius: 8,
                    color: enabled ? "#fff" : "#ccc",
                    cursor: enabled ? "pointer" : "default",
                    padding: "9px 0",
                    fontFamily: "serif",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Dot indicators for all hotels */}
            {hotelOptions.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 14,
                }}
              >
                {hotelOptions.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setOpenHotelIndex(i)}
                    style={{
                      width: i === openHotelIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === openHotelIndex ? accent : accent + "40",
                      border: `1px solid ${accent}50`,
                      cursor: "pointer",
                      transition: "width 0.3s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {openPartyMember && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpenPartyMember(null)}
        >
          <div
            style={{
              position: "relative",
              width: 320,
              maxWidth: "88vw",
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Outer gold frame border ── */}
            <div
              style={{
                position: "relative",
                background: `linear-gradient(145deg, ${accent}, ${accent}88, ${accent})`,
                padding: 14,
                borderRadius: 4,
                boxShadow: `0 0 0 2px ${accent}40, 0 24px 80px rgba(0,0,0,0.95), 0 0 60px ${accent}20`,
              }}
            >
              {/* Inner mat board */}
              <div
                style={{
                  background: "#f0ead8",
                  padding: 6,
                  borderRadius: 2,
                }}
              >
                {/* Portrait canvas area */}
                <div
                  style={{
                    background: `radial-gradient(ellipse at 50% 38%, #2e2018 0%, #0a0704 100%)`,
                    padding: "28px 24px 24px",
                    position: "relative",
                    minHeight: 420,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Painterly texture overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 5px)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Side label */}
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.5em",
                      textTransform: "uppercase",
                      color: `${accent}99`,
                      margin: "0 0 18px",
                      position: "relative",
                    }}
                  >
                    {openPartyMember.side === "bride"
                      ? "Bride's Side"
                      : openPartyMember.side === "groom"
                        ? "Groom's Side"
                        : "Wedding Party"}
                  </p>

                  {/* Portrait circle */}
                  <div
                    style={{
                      width: 148,
                      height: 148,
                      borderRadius: "50%",
                      border: `5px solid ${accent}aa`,
                      outline: `2px solid ${accent}33`,
                      outlineOffset: 10,
                      overflow: "hidden",
                      background: `radial-gradient(circle, ${accent}1a, rgba(0,0,0,0.5))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 30px ${accent}30, inset 0 0 20px rgba(0,0,0,0.4)`,
                      marginBottom: 22,
                      position: "relative",
                    }}
                  >
                    {openPartyMember.photoUrl ? (
                      <img
                        src={openPartyMember.photoUrl}
                        alt={openPartyMember.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "serif",
                          fontSize: 58,
                          fontWeight: 700,
                          color: accent,
                          textShadow: `0 0 24px ${accent}`,
                        }}
                      >
                        {openPartyMember.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h2
                    style={{
                      fontFamily: "serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#f8f2e8",
                      margin: "0 0 10px",
                      textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    {openPartyMember.name}
                  </h2>

                  {/* Gold rule */}
                  <div
                    style={{
                      width: 80,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                      margin: "0 auto 12px",
                    }}
                  />

                  {/* Role */}
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: `${accent}dd`,
                      margin: "0 0 10px",
                      position: "relative",
                    }}
                  >
                    {openPartyMember.role === "custom"
                      ? (openPartyMember.customRole ?? "")
                      : openPartyMember.role
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>

                  {/* Relation */}
                  {openPartyMember.relation && (
                    <p
                      style={{
                        fontFamily: "serif",
                        fontStyle: "italic",
                        fontSize: 15,
                        color: "#f5f0e870",
                        margin: 0,
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      {openPartyMember.relation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Gold nameplate below frame ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                margin: "0 auto",
                width: "60%",
                padding: "8px 16px",
                textAlign: "center",
                borderRadius: "0 0 4px 4px",
                boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
              }}
            >
              <p
                style={{
                  fontFamily: "serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f5f0e8",
                  margin: 0,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {openPartyMember.name.split(" ")[0]}
              </p>
            </div>

            {/* ── Gold corner ornaments ── */}
            {[
              { top: 0, left: 0, borderRight: "none", borderBottom: "none" },
              { top: 0, right: 0, borderLeft: "none", borderBottom: "none" },
              { bottom: 30, left: 0, borderRight: "none", borderTop: "none" },
              { bottom: 30, right: 0, borderLeft: "none", borderTop: "none" },
            ].map((style, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 18,
                  height: 18,
                  border: `2px solid ${accent}`,
                  ...style,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Close button */}
            <button
              onClick={() => setOpenPartyMember(null)}
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: accent,
                border: "none",
                color: "#1a0e04",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px rgba(0,0,0,0.6)`,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {activeFaq && openFaqIndex !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpenFaqIndex(null)}
        >
          <div
            style={{
              background: "#F5EFE4",
              borderRadius: 8,
              padding: "32px 36px",
              maxWidth: 420,
              width: "90vw",
              boxShadow: `0 28px 90px rgba(0,0,0,0.95), 0 0 0 2px ${accent}60`,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenFaqIndex(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#666",
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Counter */}
            <p
              style={{
                fontFamily: "var(--font-label, sans-serif)",
                fontSize: 10,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: `${accent}80`,
                margin: "0 0 16px",
                textAlign: "center",
              }}
            >
              Question {openFaqIndex + 1} of {faqItems.length}
            </p>

            {/* Question */}
            <div
              style={{
                background: "#14100a",
                borderRadius: 4,
                padding: "18px 16px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  color: `${accent}`,
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                }}
              >
                ❓ Question
              </p>
              <h2
                style={{
                  fontFamily: "serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#f5f0e8",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {activeFaq.question}
              </h2>
            </div>

            {/* Divider */}
            <div
              style={{
                width: 68,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                margin: "0 auto 20px",
              }}
            />

            {/* Answer */}
            <p
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: 15,
                color: "#3a2818",
                lineHeight: 1.78,
                margin: 0,
              }}
            >
              {activeFaq.answer}
            </p>

            {/* Prev / Next */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {[
                {
                  l: "← Prev",
                  enabled: openFaqIndex > 0,
                  fn: () => setOpenFaqIndex(openFaqIndex - 1),
                },
                {
                  l: "Next →",
                  enabled: openFaqIndex < faqItems.length - 1,
                  fn: () => setOpenFaqIndex(openFaqIndex + 1),
                },
              ].map(({ l, enabled, fn }) => (
                <button
                  key={l}
                  onClick={enabled ? fn : undefined}
                  style={{
                    flex: 1,
                    background: enabled ? accent : "transparent",
                    border: `1.5px solid ${enabled ? accent : "#ccc"}`,
                    borderRadius: 8,
                    color: enabled ? "#fff" : "#ccc",
                    cursor: enabled ? "pointer" : "default",
                    padding: "9px 0",
                    fontFamily: "serif",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Dot indicators */}
            {faqItems.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                {faqItems.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setOpenFaqIndex(i)}
                    style={{
                      width: i === openFaqIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === openFaqIndex ? accent : `${accent}40`,
                      border: `1px solid ${accent}50`,
                      cursor: "pointer",
                      transition: "width 0.3s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {openTravelFrame &&
        (() => {
          const { items: travelItems, index: travelIndex } = openTravelFrame;
          const openTravelItem = travelItems[travelIndex];
          if (!openTravelItem) return null;
          const bgColors = [
            "#1a2a5a",
            "#1a5a2a",
            "#5a1a2a",
            "#2a4a5a",
            "#5a3a1a",
          ];
          const icons: Record<string, string> = {
            hotel: "🏨",
            airport: "✈️",
            tip: "⭐",
          };
          const typeIndex = ["hotel", "airport", "tip"].indexOf(
            openTravelItem.type,
          );
          const bg = bgColors[typeIndex >= 0 ? typeIndex : 0];
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setOpenTravelFrame(null)}
            >
              <div
                style={{
                  position: "relative",
                  width: 320,
                  maxWidth: "88vw",
                  cursor: "default",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Counter */}
                {travelItems.length > 1 && (
                  <p
                    style={{
                      fontFamily: "var(--font-label, sans-serif)",
                      fontSize: 10,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: `${accent}80`,
                      margin: "0 0 8px",
                      textAlign: "center",
                    }}
                  >
                    {travelIndex + 1} of {travelItems.length}
                  </p>
                )}

                {/* Outer gold frame */}
                <div
                  style={{
                    background: `linear-gradient(145deg, ${accent}, ${accent}88, ${accent})`,
                    padding: 12,
                    borderRadius: 4,
                    boxShadow: `0 0 0 2px ${accent}40, 0 24px 80px rgba(0,0,0,0.95)`,
                  }}
                >
                  {/* Mat board */}
                  <div
                    style={{
                      background: "#f0ead8",
                      padding: 5,
                      borderRadius: 2,
                    }}
                  >
                    {/* Poster area */}
                    <div
                      style={{
                        background: `linear-gradient(160deg, ${bg} 0%, ${bg}cc 60%, #060608 100%)`,
                        padding: "24px 20px 20px",
                        position: "relative",
                        minHeight: 360,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Inner borders */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 10,
                          border: "2px solid rgba(245,240,232,0.4)",
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 16,
                          border: `1px solid ${accent}60`,
                          pointerEvents: "none",
                        }}
                      />

                      {/* Type banner */}
                      <div
                        style={{
                          background: "rgba(0,0,0,0.55)",
                          padding: "6px 20px",
                          borderRadius: 2,
                          marginBottom: 16,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.4em",
                            color: "#f5f0e8",
                            margin: 0,
                            textTransform: "uppercase",
                          }}
                        >
                          {openTravelItem.type}
                        </p>
                      </div>

                      {/* Icon */}
                      <div
                        style={{
                          fontSize: 52,
                          lineHeight: 1,
                          marginBottom: 14,
                          filter: "drop-shadow(0 0 12px rgba(0,0,0,0.8))",
                        }}
                      >
                        {icons[openTravelItem.type] ?? "✦"}
                      </div>

                      {/* Gold divider */}
                      <div
                        style={{
                          width: "80%",
                          height: 1,
                          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                          marginBottom: 12,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%,-50%) rotate(45deg)",
                            width: 10,
                            height: 10,
                            background: accent,
                          }}
                        />
                      </div>

                      {/* Name */}
                      <h2
                        style={{
                          fontFamily: "serif",
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#ffffff",
                          margin: "0 0 10px",
                          textAlign: "center",
                          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                        }}
                      >
                        {openTravelItem.name}
                      </h2>

                      {/* Description */}
                      <p
                        style={{
                          fontFamily: "serif",
                          fontStyle: "italic",
                          fontSize: 14,
                          color: "rgba(245,240,232,0.82)",
                          lineHeight: 1.7,
                          margin: "0 0 14px",
                          textAlign: "center",
                        }}
                      >
                        {openTravelItem.description}
                      </p>

                      {/* Link */}
                      {openTravelItem.link && (
                        <a
                          href={openTravelItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "7px 16px",
                            border: `1.5px solid ${accent}`,
                            borderRadius: 4,
                            color: accent,
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            background: `${accent}18`,
                          }}
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nameplate */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    margin: "0 auto",
                    width: "55%",
                    padding: "6px 14px",
                    textAlign: "center",
                    borderRadius: "0 0 4px 4px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#f5f0e8",
                      margin: 0,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    {openTravelItem.type}
                  </p>
                </div>

                {/* Prev / Next */}
                {travelItems.length > 1 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    {[
                      {
                        l: "← Prev",
                        enabled: travelIndex > 0,
                        fn: () =>
                          setOpenTravelFrame({
                            items: travelItems,
                            index: travelIndex - 1,
                          }),
                      },
                      {
                        l: "Next →",
                        enabled: travelIndex < travelItems.length - 1,
                        fn: () =>
                          setOpenTravelFrame({
                            items: travelItems,
                            index: travelIndex + 1,
                          }),
                      },
                    ].map(({ l, enabled, fn }) => (
                      <button
                        key={l}
                        onClick={enabled ? fn : undefined}
                        style={{
                          flex: 1,
                          background: enabled ? accent : "transparent",
                          border: `1.5px solid ${enabled ? accent : "#88880050"}`,
                          borderRadius: 6,
                          color: enabled ? "#1a0e04" : "#88888050",
                          cursor: enabled ? "pointer" : "default",
                          padding: "8px 0",
                          fontFamily: "serif",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dots */}
                {travelItems.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {travelItems.map((_, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          setOpenTravelFrame({ items: travelItems, index: i })
                        }
                        style={{
                          width: i === travelIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          background:
                            i === travelIndex ? accent : `${accent}40`,
                          border: `1px solid ${accent}50`,
                          cursor: "pointer",
                          transition: "width 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Corner ornaments */}
                {(
                  [
                    { top: 0, left: 0 },
                    { top: 0, right: 0 },
                    { bottom: 66, left: 0 },
                    { bottom: 66, right: 0 },
                  ] as React.CSSProperties[]
                ).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: 16,
                      height: 16,
                      borderTop: i < 2 ? `2px solid ${accent}` : undefined,
                      borderBottom: i >= 2 ? `2px solid ${accent}` : undefined,
                      borderLeft:
                        i % 2 === 0 ? `2px solid ${accent}` : undefined,
                      borderRight:
                        i % 2 === 1 ? `2px solid ${accent}` : undefined,
                      pointerEvents: "none",
                      ...s,
                    }}
                  />
                ))}

                {/* Close button */}
                <button
                  onClick={() => setOpenTravelFrame(null)}
                  style={{
                    position: "absolute",
                    top: -12,
                    right: -12,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: accent,
                    border: "none",
                    color: "#1a0e04",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })()}

      {openMenuScroll &&
        (() => {
          const { courses: scrollCourses, index } = openMenuScroll;
          const group = scrollCourses[index];
          if (!group) return null;
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setOpenMenuScroll(null)}
            >
              <div
                style={{
                  position: "relative",
                  width: 340,
                  maxWidth: "90vw",
                  cursor: "default",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Counter */}
                {scrollCourses.length > 1 && (
                  <p
                    style={{
                      fontFamily: "var(--font-label, sans-serif)",
                      fontSize: 10,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: `${accent}80`,
                      margin: "0 0 8px",
                      textAlign: "center",
                    }}
                  >
                    {index + 1} of {scrollCourses.length}
                  </p>
                )}

                {/* Scroll frame — top rod */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: -4,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "92%",
                      height: 16,
                      background: `linear-gradient(90deg, #5a3a18, #8b6030, #5a3a18)`,
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 6px",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                  </div>
                </div>

                {/* Scroll body — parchment */}
                <div
                  style={{
                    background:
                      "linear-gradient(160deg, #f5ecd0 0%, #ede0bc 50%, #e8d8a8 100%)",
                    padding: "28px 24px 24px",
                    position: "relative",
                    borderLeft: "2px solid rgba(100,70,30,0.2)",
                    borderRight: "2px solid rgba(100,70,30,0.2)",
                    boxShadow: "inset 0 0 30px rgba(100,70,30,0.08)",
                  }}
                >
                  {/* Top band */}
                  <div
                    style={{
                      background: `${accent}18`,
                      borderBottom: `1.5px solid ${accent}55`,
                      padding: "6px 0 10px",
                      marginBottom: 16,
                      textAlign: "center",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#2a1408",
                        margin: 0,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {group.course}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: `linear-gradient(90deg, transparent, ${accent}60)`,
                        }}
                      />
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          background: accent,
                          transform: "rotate(45deg)",
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: `linear-gradient(90deg, ${accent}60, transparent)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    {(group.items ?? []).map((item, ii) => (
                      <div
                        key={ii}
                        style={{
                          borderBottom: `1px solid ${accent}18`,
                          padding: "10px 0",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "serif",
                            fontSize: 12,
                            color: accent,
                            fontWeight: 700,
                            minWidth: 20,
                            paddingTop: 2,
                          }}
                        >
                          ·
                        </span>
                        <p
                          style={{
                            fontFamily: "serif",
                            fontStyle: "italic",
                            fontSize: 15,
                            color: "#1a0e04",
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom rod */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: -4,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "92%",
                      height: 16,
                      background: `linear-gradient(90deg, #5a3a18, #8b6030, #5a3a18)`,
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 6px",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                  </div>
                </div>

                {/* Prev / Next */}
                {scrollCourses.length > 1 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    {[
                      {
                        l: "← Prev",
                        enabled: index > 0,
                        fn: () =>
                          setOpenMenuScroll({
                            courses: scrollCourses,
                            index: index - 1,
                          }),
                      },
                      {
                        l: "Next →",
                        enabled: index < scrollCourses.length - 1,
                        fn: () =>
                          setOpenMenuScroll({
                            courses: scrollCourses,
                            index: index + 1,
                          }),
                      },
                    ].map(({ l, enabled, fn }) => (
                      <button
                        key={l}
                        onClick={enabled ? fn : undefined}
                        style={{
                          flex: 1,
                          background: enabled ? accent : "transparent",
                          border: `1.5px solid ${enabled ? accent : "#88880050"}`,
                          borderRadius: 6,
                          color: enabled ? "#1a0e04" : "#88888050",
                          cursor: enabled ? "pointer" : "default",
                          padding: "8px 0",
                          fontFamily: "serif",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dots */}
                {scrollCourses.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {scrollCourses.map((_, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          setOpenMenuScroll({
                            courses: scrollCourses,
                            index: i,
                          })
                        }
                        style={{
                          width: i === index ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: i === index ? accent : `${accent}40`,
                          cursor: "pointer",
                          transition: "width 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setOpenMenuScroll(null)}
                  style={{
                    position: "absolute",
                    top: -12,
                    right: -12,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: accent,
                    border: "none",
                    color: "#1a0e04",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })()}
    </PanContainer>
  );
}
