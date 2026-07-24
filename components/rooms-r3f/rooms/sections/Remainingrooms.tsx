"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { detectStream, PLATFORM_META } from "@/components/sections/Livestream";
import { Course, TravelItem } from "@/types/event";
import { useRoomsStore } from "../../store";

// ── Shared "tap to interact" floating prompt ─────────────────────────────────
// Used by rooms whose interaction reuses an existing HTML panel (RSVP form,
// guestbook, registry) rather than a bespoke 3D widget.
function InteractPrompt({
  position,
  label,
  accent,
  visible,
}: {
  position: [number, number, number];
  label: string;
  accent: string;
  visible: boolean;
}) {
  return (
    <Html
      position={position}
      center
      transform
      distanceFactor={3.2}
      occlude={false}
      style={{
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-label, sans-serif)",
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: accent,
          background: "rgba(0,0,0,0.7)",
          padding: "4px 10px",
          borderRadius: 6,
          border: `1px solid ${accent}80`,
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function InteractiveProp({
  position,
  panelKey,
  hintLabel,
  accent,
  children,
}: {
  position: [number, number, number];
  panelKey: string;
  hintLabel: string;
  accent: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      scale={hovered ? 1.05 : 1}
      onClick={(e) => {
        e.stopPropagation();
        useRoomsStore.getState().setOpenPanelKey(panelKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        setHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        setHovered(false);
      }}
    >
      {children}
      <InteractPrompt
        position={[0, 0.45, 0]}
        label={hintLabel}
        accent={accent}
        visible={hovered}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RSVP ROOM — Registry Office
// ═══════════════════════════════════════════════════════════════════════════

interface RSVPRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  rsvpDeadline?: string;
  eventLabel?: string;
}

function RSVPRegister({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#8b1a1a";
    ctx.fillRect(0, 0, 512, 640);
    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 492, 620);
    ctx.fillStyle = accent;
    ctx.font = "bold 36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.fillText("RSVP", 256, 200);
    ctx.fillText("REGISTER", 256, 260);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.lineTo(452, 180);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60, 300);
    ctx.lineTo(452, 300);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, [accent]);

  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.68, 0.06, 0.5]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[0, 0.07, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.66, 0.48]} />
        <meshStandardMaterial roughness={0.5} />
      </mesh>
      <mesh position={[-0.33, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.5]} />
        <meshStandardMaterial color={accent} roughness={0.18} metalness={0.9} />
      </mesh>
    </group>
  );
}

function RubberStamp({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.065, 0.08, 8]} />
        <meshStandardMaterial color="#3a2510" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.025, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
    </group>
  );
}

function DeadlineNotice({
  position,
  rotation,
  accent,
  deadline,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
  deadline?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f5f0e0";
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "#1a0804";
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 492, 300);
    ctx.fillStyle = "#1a0804";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("RESPONSES REQUIRED BY", 256, 40);
    ctx.fillStyle = "#8b1a1a";
    ctx.font = "bold 42px serif";
    ctx.fillText(deadline ?? "DATE TBC", 256, 140);
    ctx.fillStyle = "#1a0804";
    ctx.font = "16px monospace";
    ctx.fillText("KINDLY REPLY AT YOUR EARLIEST CONVENIENCE", 256, 240);
    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, [deadline, accent]);

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[1.8, 0.8, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh ref={meshRef}>
        <planeGeometry args={[1.72, 0.72]} />
        <meshStandardMaterial roughness={0.6} />
      </mesh>
    </group>
  );
}

export function RSVPRoom({ theme, rsvpDeadline }: RSVPRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  return (
    <group>
      {/* Clerk's high desk */}
      <group position={[0, floorY, -ROOM_LENGTH * 0.52]}>
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[2.4, 0.07, 0.95]} />
          <meshStandardMaterial color="#2a1408" roughness={0.35} />
        </mesh>
        {(
          [
            [-1.05, -0.38],
            [1.05, -0.38],
            [-1.05, 0.38],
            [1.05, 0.38],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.27, z]}>
            <boxGeometry args={[0.08, 0.54, 0.08]} />
            <meshStandardMaterial color="#2a1408" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0.48]}>
          <boxGeometry args={[2.4, 0.04, 0.02]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </group>

      {/* RSVP register on desk — click to open the RSVP form */}
      <InteractiveProp
        position={[0.2, floorY + 0.75, -ROOM_LENGTH * 0.55]}
        panelKey="rsvp"
        hintLabel="Tap to RSVP"
        accent={accent}
      >
        <RSVPRegister position={[0, 0, 0]} accent={accent} />
      </InteractiveProp>

      {/* Rubber stamps */}
      <RubberStamp
        position={[-0.65, floorY + 0.72, -ROOM_LENGTH * 0.5]}
        accent={accent}
      />
      <RubberStamp
        position={[-0.45, floorY + 0.72, -ROOM_LENGTH * 0.5]}
        accent={accent}
      />
      <RubberStamp
        position={[-0.25, floorY + 0.72, -ROOM_LENGTH * 0.5]}
        accent={accent}
      />

      {/* Deadline notice on right wall */}
      <DeadlineNotice
        position={[ROOM_WIDTH / 2 - 0.06, 0.3, -ROOM_LENGTH * 0.55]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={accent}
        deadline={rsvpDeadline}
      />

      {/* Cork board back wall — pinned cards */}
      <mesh position={[0, 0.4, -ROOM_LENGTH + 0.08]}>
        <boxGeometry args={[ROOM_WIDTH * 0.75, 1.8, 0.05]} />
        <meshStandardMaterial color="#8b6040" roughness={0.92} />
      </mesh>
      {/* Pinned RSVP cards */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            -ROOM_WIDTH * 0.32 + (i % 4) * (ROOM_WIDTH * 0.22),
            0.15 + Math.floor(i / 4) * 0.52,
            -ROOM_LENGTH + 0.12,
          ]}
          rotation={[0, 0, ((i % 3) - 1) * 0.06]}
        >
          <boxGeometry args={[0.28, 0.18, 0.01]} />
          <meshStandardMaterial color="#f5f0e0" roughness={0.85} />
        </mesh>
      ))}

      {/* Green desk lamp */}
      <group position={[0.85, floorY + 0.95, -ROOM_LENGTH * 0.48]}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 6]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.18, 0.22, 8]} />
          <meshStandardMaterial color="#1a6a1a" roughness={0.7} />
        </mesh>
        <pointLight
          position={[0, 0.1, 0]}
          color="#aaee44"
          intensity={1.8}
          distance={3.5}
          decay={2}
        />
      </group>

      {/* Filing cabinets on left wall */}
      {(
        [
          -ROOM_LENGTH * 0.38,
          -ROOM_LENGTH * 0.62,
          -ROOM_LENGTH * 0.82,
        ] as number[]
      ).map((z, i) => (
        <group key={i} position={[-ROOM_WIDTH / 2 + 0.2, floorY + 0.6, z]}>
          <mesh>
            <boxGeometry args={[0.38, 1.2, 0.5]} />
            <meshStandardMaterial
              color="#4a4a4a"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 0.2, 0.26]}>
            <boxGeometry args={[0.32, 0.12, 0.02]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          <mesh position={[0, -0.2, 0.26]}>
            <boxGeometry args={[0.32, 0.12, 0.02]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </group>
      ))}

      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.5]}
        color="#fff5e0"
        intensity={2.5}
        distance={9}
        decay={1.5}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUESTBOOK ROOM — The Signing Room
// ═══════════════════════════════════════════════════════════════════════════

interface GuestbookRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
}

function OpenBook({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    // Left page — lined
    const lc = document.createElement("canvas");
    lc.width = 512;
    lc.height = 512;
    const lctx = lc.getContext("2d")!;
    lctx.fillStyle = "#faf5e8";
    lctx.fillRect(0, 0, 512, 512);
    lctx.strokeStyle = "#c8bfa020";
    lctx.lineWidth = 1;
    for (let y = 60; y < 512; y += 32) {
      lctx.beginPath();
      lctx.moveTo(24, y);
      lctx.lineTo(488, y);
      lctx.stroke();
    }
    lctx.fillStyle = "#5a3a10";
    lctx.font = "italic 22px serif";
    lctx.textAlign = "left";
    lctx.textBaseline = "top";
    lctx.fillText("Messages from our guests...", 32, 24);
    // Simulated handwritten lines
    const names = ["Sarah & Tom", "The Johnsons", "Maria", "David"];
    names.forEach((n, i) => {
      lctx.fillStyle = i % 2 === 0 ? "#1a0e6a" : "#1a3a1a";
      lctx.font = `italic ${18 + i}px serif`;
      lctx.fillText(n, 32 + i * 8, 80 + i * 90);
      lctx.fillStyle = "#3a2a1a";
      lctx.font = "16px serif";
      lctx.fillText("With all our love and best wishes...", 32, 108 + i * 90);
    });
    const ltex = new THREE.CanvasTexture(lc);
    if (leftRef.current) {
      (leftRef.current.material as THREE.MeshStandardMaterial).map = ltex;
      (leftRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    // Right page — blank with decorative border
    const rc = document.createElement("canvas");
    rc.width = 512;
    rc.height = 512;
    const rctx = rc.getContext("2d")!;
    rctx.fillStyle = "#faf5e8";
    rctx.fillRect(0, 0, 512, 512);
    rctx.strokeStyle = "#c8bfa020";
    rctx.lineWidth = 1;
    for (let y = 60; y < 512; y += 32) {
      rctx.beginPath();
      rctx.moveTo(24, y);
      rctx.lineTo(488, y);
      rctx.stroke();
    }
    rctx.strokeStyle = accent + "30";
    rctx.lineWidth = 2;
    rctx.strokeRect(16, 16, 480, 480);
    rctx.fillStyle = accent + "60";
    rctx.font = "italic 20px serif";
    rctx.textAlign = "center";
    rctx.fillText("Sign your name here...", 256, 32);
    const rtex = new THREE.CanvasTexture(rc);
    if (rightRef.current) {
      (rightRef.current.material as THREE.MeshStandardMaterial).map = rtex;
      (rightRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => {
      ltex.dispose();
      rtex.dispose();
    };
  }, [accent]);

  return (
    <group position={position}>
      {/* Spine */}
      <mesh>
        <boxGeometry args={[0.05, 0.04, 0.68]} />
        <meshStandardMaterial color="#1a0804" roughness={0.5} />
      </mesh>
      {/* Left page */}
      <mesh
        ref={leftRef}
        position={[-0.38, 0.022, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.7, 0.65]} />
        <meshStandardMaterial roughness={0.85} />
      </mesh>
      {/* Right page */}
      <mesh
        ref={rightRef}
        position={[0.38, 0.022, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.7, 0.65]} />
        <meshStandardMaterial roughness={0.85} />
      </mesh>
      {/* Page body L */}
      <mesh position={[-0.38, 0.015, 0]}>
        <boxGeometry args={[0.72, 0.03, 0.67]} />
        <meshStandardMaterial color="#faf5e8" roughness={0.9} />
      </mesh>
      {/* Page body R */}
      <mesh position={[0.38, 0.015, 0]}>
        <boxGeometry args={[0.72, 0.03, 0.67]} />
        <meshStandardMaterial color="#faf5e8" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function GuestbookRoom({ theme }: GuestbookRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  return (
    <group>
      {/* Round velvet table */}
      <group position={[0, floorY, -ROOM_LENGTH * 0.52]}>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.06, 24]} />
          <meshStandardMaterial color="#2a1a2a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.52, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.22}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 0.05, 16]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.22}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* Open guestbook on table — click to sign */}
      <InteractiveProp
        position={[0, floorY + 0.58, -ROOM_LENGTH * 0.52]}
        panelKey="guestbook"
        hintLabel="Tap to Sign"
        accent={accent}
      >
        <OpenBook position={[0, 0, 0]} accent={accent} />
      </InteractiveProp>

      {/* Candle in brass holder */}
      <group position={[0.7, floorY + 0.58, -ROOM_LENGTH * 0.48]}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.1, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.18}
            metalness={0.92}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
          <meshStandardMaterial color="#f5f0e0" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.022, 0.1, 6]} />
          <meshStandardMaterial
            color="#ffeeaa"
            emissive="#ffeeaa"
            emissiveIntensity={2.5}
          />
        </mesh>
        <pointLight
          position={[0, 0.25, 0]}
          color="#ffaa33"
          intensity={1.5}
          distance={3.5}
          decay={2}
        />
      </group>

      {/* Small vase with flowers */}
      <group position={[-0.65, floorY + 0.58, -ROOM_LENGTH * 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.2, 8]} />
          <meshStandardMaterial
            color="#1a4a6a"
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.04,
              0.18 + i * 0.02,
              Math.sin((i / 5) * Math.PI * 2) * 0.04,
            ]}
          >
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#ff6688" : "#ffaacc"}
              roughness={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* "Please Sign" easel sign */}
      <group
        position={[0, floorY + 0.85, -ROOM_LENGTH * 0.32]}
        rotation={[0.12, 0, 0]}
      >
        <mesh>
          <boxGeometry args={[0.65, 0.4, 0.02]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[0.7, 0.44, 0.02]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.18}
            metalness={0.88}
          />
        </mesh>
        {/* Easel legs */}
        <mesh position={[-0.15, -0.35, -0.05]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.02, 0.45, 0.02]} />
          <meshStandardMaterial color="#3a2510" roughness={0.6} />
        </mesh>
        <mesh position={[0.15, -0.35, -0.05]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.02, 0.45, 0.02]} />
          <meshStandardMaterial color="#3a2510" roughness={0.6} />
        </mesh>
      </group>

      {/* Botanical illustrations on walls */}
      {([-0.8, 0.8] as number[]).map((x, i) => (
        <group
          key={i}
          position={[x, 0.5, -ROOM_LENGTH * 0.72]}
          rotation={[0, 0, 0]}
        >
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.55, 0.7, 0.04]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.18}
              metalness={0.88}
            />
          </mesh>
          <mesh>
            <planeGeometry args={[0.48, 0.62]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Tall windows on back wall — ivory panels */}
      {([-1.8, 1.8] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.5, -ROOM_LENGTH + 0.06]}>
          <boxGeometry args={[0.65, 1.6, 0.04]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
        </mesh>
      ))}

      {/* Soft overhead light */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.5]}
        color="#fff8f0"
        intensity={2.2}
        distance={8}
        decay={1.5}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAVEL ROOM — Vintage Travel Agency
// ═══════════════════════════════════════════════════════════════════════════

interface TravelRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  items?: TravelItem[];
  city?: string;
}

function CyclingTravelFrame({
  position,
  rotation,
  items,
  accent,
  frameIndex,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  items: TravelItem[];
  accent: string;
  frameIndex: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const activeRef = useRef(0);
  const timerRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const CYCLE_INTERVAL = 4.0;

  const bgColors = ["#1a2a5a", "#1a5a2a", "#5a1a2a", "#2a4a5a", "#5a3a1a"];

  const drawItem = (item: TravelItem, idx: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 560;
    canvas.height = 780;
    const ctx = canvas.getContext("2d")!;
    const bg = bgColors[frameIndex % bgColors.length];

    // Rich gradient background
    const grad = ctx.createLinearGradient(0, 0, 560, 780);
    grad.addColorStop(0, bg);
    grad.addColorStop(0.6, bg + "cc");
    grad.addColorStop(1, "#060608");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 560, 780);

    // Art deco outer border
    ctx.strokeStyle = "#f5f0e8";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, 532, 752);
    ctx.strokeStyle = accent + "cc";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 512, 732);

    // Top banner band
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(14, 14, 532, 82);
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.type.toUpperCase(), 280, 55);

    // Large icon
    const icons: Record<string, string> = {
      hotel: "🏨",
      airport: "✈️",
      tip: "⭐",
    };
    ctx.font = "120px serif";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[item.type] ?? "✦", 280, 260);

    // Art deco divider + diamond
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 375);
    ctx.lineTo(500, 375);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.save();
    ctx.translate(280, 375);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 10;
    ctx.fillText(item.name.slice(0, 22), 280, 400);
    ctx.shadowBlur = 0;

    // Description word-wrap
    ctx.fillStyle = "rgba(245,240,232,0.82)";
    ctx.font = "italic 26px serif";
    const words = item.description.split(" ");
    let line = "";
    let y = 462;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 490 && line) {
        ctx.fillText(line.trim(), 280, y);
        line = word + " ";
        y += 36;
        if (y > 650) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), 280, y);

    // Pagination dots
    if (items.length > 1) {
      const dotSpacing = 20;
      const startX = 280 - ((items.length - 1) * dotSpacing) / 2;
      items.forEach((_, di) => {
        ctx.beginPath();
        ctx.arc(startX + di * dotSpacing, 690, 6, 0, Math.PI * 2);
        ctx.fillStyle = di === idx ? accent : accent + "40";
        ctx.fill();
      });
    }

    // Bottom band
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(14, 706, 532, 60);
    if (item.link) {
      ctx.fillStyle = accent;
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAP FOR DETAILS →", 280, 736);
    }

    const tex = new THREE.CanvasTexture(canvas);
    if (texRef.current) texRef.current.dispose();
    texRef.current = tex;
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
  };

  // Initial draw
  useEffect(() => {
    if (items.length === 0) return;
    drawItem(items[0], 0);
    return () => {
      texRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, accent]);

  // Auto-cycle
  useFrame((_, delta) => {
    if (items.length <= 1) return;
    timerRef.current += delta;
    if (timerRef.current >= CYCLE_INTERVAL) {
      timerRef.current = 0;
      activeRef.current = (activeRef.current + 1) % items.length;
      drawItem(items[activeRef.current], activeRef.current);
    }
  });

  if (items.length === 0) return null;

  return (
    <group
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      scale={hovered ? [1.04, 1.04, 1] : [1, 1, 1]}
    >
      {/* Gold frame */}
      <mesh position={[0, 0, -0.028]}>
        <boxGeometry args={[1.36, 1.86, 0.045]} />
        <meshStandardMaterial color={accent} roughness={0.85} metalness={0.2} />
      </mesh>
      {/* Mat */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.24, 1.74, 0.02]} />
        <meshStandardMaterial color="#f0ead8" roughness={1.0} metalness={0} />
      </mesh>
      {/* Poster */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          useRoomsStore.getState().setOpenTravelFrame({
            items,
            index: activeRef.current,
          });
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <planeGeometry args={[1.18, 1.66]} />
        <meshBasicMaterial />
      </mesh>
      {hovered && (
        <pointLight
          position={[0, 0, 0.4]}
          color={accent}
          intensity={0.6}
          distance={1.5}
          decay={2}
        />
      )}
      {/* Spotlight above */}
      <pointLight
        position={[0, 1.2, 0.4]}
        color="#fff8e0"
        intensity={1.2}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}

function SuitcaseStack({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const floorY = -ROOM_HEIGHT / 2;
  const cases = [
    { w: 0.75, h: 0.52, d: 0.36, color: "#5a3a20", y: 0 },
    { w: 0.62, h: 0.42, d: 0.3, color: "#2e1c0a", y: 0.52 },
    { w: 0.46, h: 0.3, d: 0.22, color: "#7a5030", y: 0.94 },
  ];
  return (
    <group position={position}>
      {cases.map(({ w, h, d, color, y }, i) => (
        <group key={i} position={[0, floorY + y + h / 2, 0]}>
          {/* Main body */}
          <mesh>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Corner reinforcements */}
          {(
            [
              [-1, -1],
              [-1, 1],
              [1, -1],
              [1, 1],
            ] as [number, number][]
          ).map(([sx, sz], ci) => (
            <mesh key={ci} position={[sx * w * 0.45, 0, sz * d * 0.45]}>
              <boxGeometry args={[0.04, h * 0.9, 0.04]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.85}
              />
            </mesh>
          ))}
          {/* Lid seam line */}
          <mesh position={[0, 0.02, d / 2 + 0.002]}>
            <boxGeometry args={[w * 0.96, 0.008, 0.004]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Clasp locks */}
          {([-0.18, 0, 0.18] as number[]).map((x, ci) => (
            <mesh key={ci} position={[x, 0.02, d / 2 + 0.012]}>
              <boxGeometry args={[0.06, 0.035, 0.015]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.15}
                metalness={0.95}
              />
            </mesh>
          ))}
          {/* Handle */}
          <mesh position={[0, h / 2 + 0.035, 0]}>
            <torusGeometry args={[0.08, 0.012, 6, 12, Math.PI]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.88}
            />
          </mesh>
          {/* Wheels at bottom */}
          {i === 0 &&
            (
              [
                [-0.28, -0.15],
                [0.28, -0.15],
                [-0.28, 0.15],
                [0.28, 0.15],
              ] as [number, number][]
            ).map(([wx, wz], wi) => (
              <mesh
                key={wi}
                position={[wx, -h / 2 - 0.02, wz]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.038, 0.038, 0.03, 8]} />
                <meshStandardMaterial
                  color="#1a1a1a"
                  roughness={0.4}
                  metalness={0.5}
                />
              </mesh>
            ))}
          {/* Luggage tag */}
          {i === 0 && (
            <mesh position={[w * 0.42, h * 0.3, d / 2 + 0.01]}>
              <boxGeometry args={[0.1, 0.07, 0.004]} />
              <meshStandardMaterial color="#f5f0e0" roughness={0.85} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function WorldMap({ accent, city }: { accent: string; city?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;

    // Aged parchment background
    const bg = ctx.createLinearGradient(0, 0, 1024, 640);
    bg.addColorStop(0, "#e8d8a8");
    bg.addColorStop(0.5, "#d4c490");
    bg.addColorStop(1, "#c8b878");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 640);

    // Paper texture — subtle noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 640;
      const v = Math.floor(Math.random() * 20 - 10);
      ctx.fillStyle = `rgba(${120 + v},${100 + v},${60 + v},0.06)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Latitude/longitude grid — aged look
    ctx.strokeStyle = "#9a8850aa";
    ctx.lineWidth = 0.8;
    for (let x = 0; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 0; y < 640; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Continent shapes — more detailed
    ctx.fillStyle = "#8a9a5088";
    // North America
    ctx.beginPath();
    ctx.moveTo(140, 120);
    ctx.lineTo(320, 100);
    ctx.lineTo(340, 180);
    ctx.lineTo(310, 280);
    ctx.lineTo(260, 330);
    ctx.lineTo(200, 380);
    ctx.lineTo(160, 340);
    ctx.lineTo(120, 250);
    ctx.lineTo(130, 180);
    ctx.closePath();
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.moveTo(260, 360);
    ctx.lineTo(320, 340);
    ctx.lineTo(350, 400);
    ctx.lineTo(340, 500);
    ctx.lineTo(290, 560);
    ctx.lineTo(240, 520);
    ctx.lineTo(230, 440);
    ctx.closePath();
    ctx.fill();
    // Europe
    ctx.beginPath();
    ctx.moveTo(430, 100);
    ctx.lineTo(530, 95);
    ctx.lineTo(560, 140);
    ctx.lineTo(540, 200);
    ctx.lineTo(490, 220);
    ctx.lineTo(440, 200);
    ctx.lineTo(420, 160);
    ctx.closePath();
    ctx.fill();
    // Africa
    ctx.beginPath();
    ctx.moveTo(440, 210);
    ctx.lineTo(560, 200);
    ctx.lineTo(590, 260);
    ctx.lineTo(580, 380);
    ctx.lineTo(540, 460);
    ctx.lineTo(480, 500);
    ctx.lineTo(440, 450);
    ctx.lineTo(420, 360);
    ctx.lineTo(430, 260);
    ctx.closePath();
    ctx.fill();
    // Asia
    ctx.beginPath();
    ctx.moveTo(540, 90);
    ctx.lineTo(780, 80);
    ctx.lineTo(820, 130);
    ctx.lineTo(840, 200);
    ctx.lineTo(800, 280);
    ctx.lineTo(720, 310);
    ctx.lineTo(640, 290);
    ctx.lineTo(580, 260);
    ctx.lineTo(550, 200);
    ctx.lineTo(540, 140);
    ctx.closePath();
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.moveTo(780, 370);
    ctx.lineTo(870, 350);
    ctx.lineTo(910, 400);
    ctx.lineTo(890, 460);
    ctx.lineTo(820, 480);
    ctx.lineTo(770, 450);
    ctx.lineTo(760, 410);
    ctx.closePath();
    ctx.fill();

    // Ocean labels
    ctx.fillStyle = "#6a7a4488";
    ctx.font = "italic 18px serif";
    ctx.textAlign = "center";
    ctx.fillText("Atlantic Ocean", 370, 320);
    ctx.fillText("Pacific Ocean", 620, 350);
    ctx.fillText("Indian Ocean", 660, 450);

    // Destination pin with glow
    const pinX = 520,
      pinY = 270;
    // Glow rings
    for (let r = 30; r > 0; r -= 8) {
      ctx.fillStyle = `rgba(204,34,34,${0.05 + (30 - r) * 0.01})`;
      ctx.beginPath();
      ctx.arc(pinX, pinY, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#cc2222";
    ctx.beginPath();
    ctx.arc(pinX, pinY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pinX, pinY, 5, 0, Math.PI * 2);
    ctx.fill();

    // City label on pin
    if (city) {
      ctx.fillStyle = "rgba(180,20,20,0.9)";
      const labelW = ctx.measureText(city).width + 24;
      ctx.beginPath();
      ctx.roundRect(pinX + 18, pinY - 14, labelW, 28, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(city, pinX + 30, pinY + 3);
    }

    // String from pin to label
    if (city) {
      ctx.strokeStyle = "#cc222266";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pinX + 14, pinY);
      ctx.lineTo(pinX + 18, pinY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Compass rose
    const cx = 900,
      cy = 520;
    ctx.save();
    ctx.translate(cx, cy);
    const dirs = [
      ["N", 0, -1],
      ["S", 0, 1],
      ["E", 1, 0],
      ["W", -1, 0],
    ];
    dirs.forEach(([label, dx, dy]) => {
      ctx.fillStyle = label === "N" ? "#cc2222" : "#3a2510";
      ctx.font = `bold ${label === "N" ? 18 : 14}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label as string, (dx as number) * 36, (dy as number) * 36);
      ctx.strokeStyle = label === "N" ? "#cc2222" : "#3a2510";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((dx as number) * 28, (dy as number) * 28);
      ctx.stroke();
    });
    ctx.restore();

    // Title banner at top
    ctx.fillStyle = "rgba(58,37,16,0.85)";
    ctx.fillRect(0, 0, 1024, 52);
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold italic 30px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GETTING THERE", 512, 26);

    // Decorative border
    ctx.strokeStyle = "#5a3a10";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 1012, 628);
    ctx.strokeStyle = accent + "60";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 1000, 616);

    return new THREE.CanvasTexture(canvas);
  }, [accent, city]);

  return (
    <group position={[0, 0.3, -ROOM_LENGTH + 0.08]}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[ROOM_WIDTH * 0.8 + 0.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      <mesh>
        <planeGeometry args={[ROOM_WIDTH * 0.8, 1.42]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}

export function TravelRoom({ theme, items = [], city }: TravelRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  // Split items evenly between left and right walls.
  // Left wall gets ceil(n/2), right wall gets floor(n/2).
  const half = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, half);
  const rightItems = items.slice(half);

  // Generate frame positions for a wall.
  // Up to 4 frames per wall: 2 depth positions × 2 height rows.
  // If ≤2 items: single row at eye level, spaced by depth.
  // If 3-4 items: 2 depth positions × 2 rows (front-top, front-bottom, back-top, back-bottom).
  const getFramePositions = (
    wallX: number,
    count: number,
  ): [number, number, number][] => {
    const depthFront = -ROOM_LENGTH * 0.58;
    const depthBack = -ROOM_LENGTH * 0.82;
    const yTop = 1.08;
    const yBottom = -0.88; // below eye level but above floor

    if (count === 1) {
      return [[wallX, 0.35, depthFront]];
    }
    if (count === 2) {
      return [
        [wallX, 0.35, depthFront],
        [wallX, 0.35, depthBack],
      ];
    }
    if (count === 3) {
      return [
        [wallX, yTop, depthFront],
        [wallX, yBottom, depthFront],
        [wallX, 0.35, depthBack],
      ];
    }
    // 4
    return [
      [wallX, yTop, depthFront],
      [wallX, yBottom, depthFront],
      [wallX, yTop, depthBack],
      [wallX, yBottom, depthBack],
    ];
  };

  // Distribute items across frames for a wall.
  // With N items and F frames: each frame gets floor(N/F) or ceil(N/F) items.
  const distributeToFrames = (
    wallItems: TravelItem[],
    frameCount: number,
  ): TravelItem[][] => {
    const frames: TravelItem[][] = Array.from({ length: frameCount }, () => []);
    wallItems.forEach((item, i) => {
      frames[i % frameCount].push(item);
    });
    return frames;
  };

  const leftWallX = -ROOM_WIDTH / 2 + 0.06;
  const rightWallX = ROOM_WIDTH / 2 - 0.06;

  // How many frames to show per wall — up to 4, but never more than item count
  const leftFrameCount = Math.min(4, Math.max(1, leftItems.length));
  const rightFrameCount = Math.min(4, Math.max(1, rightItems.length));

  const leftPositions =
    leftItems.length > 0 ? getFramePositions(leftWallX, leftFrameCount) : [];
  const rightPositions =
    rightItems.length > 0 ? getFramePositions(rightWallX, rightFrameCount) : [];

  const leftFrameItems =
    leftItems.length > 0 ? distributeToFrames(leftItems, leftFrameCount) : [];
  const rightFrameItems =
    rightItems.length > 0
      ? distributeToFrames(rightItems, rightFrameCount)
      : [];

  return (
    <group>
      {/* World map back wall */}
      <WorldMap accent={accent} city={city} />

      {/* Left wall frames */}
      {leftPositions.map((pos, i) => (
        <CyclingTravelFrame
          key={`left-${i}`}
          position={pos}
          rotation={[0, Math.PI / 2, 0]}
          items={leftFrameItems[i] ?? []}
          accent={accent}
          frameIndex={i}
        />
      ))}

      {/* Right wall frames */}
      {rightPositions.map((pos, i) => (
        <CyclingTravelFrame
          key={`right-${i}`}
          position={pos}
          rotation={[0, -Math.PI / 2, 0]}
          items={rightFrameItems[i] ?? []}
          accent={accent}
          frameIndex={i + 2}
        />
      ))}

      {/* Agent's desk */}
      <group position={[0, floorY, -ROOM_LENGTH * 0.52]}>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[2.0, 0.07, 0.9]} />
          <meshStandardMaterial color="#c4a35a" roughness={0.45} />
        </mesh>
        {(
          [
            [-0.85, -0.38],
            [0.85, -0.38],
            [-0.85, 0.38],
            [0.85, 0.38],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]}>
            <boxGeometry args={[0.07, 0.3, 0.07]} />
            <meshStandardMaterial color="#c4a35a" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Typewriter on desk */}
      <group position={[-0.4, floorY + 0.5, -ROOM_LENGTH * 0.52]}>
        <mesh>
          <boxGeometry args={[0.38, 0.1, 0.3]} />
          <meshStandardMaterial
            color="#2a2a2a"
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.08, -0.04]}>
          <boxGeometry args={[0.32, 0.04, 0.18]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.85} />
        </mesh>
      </group>

      {/* Suitcase stack */}
      <SuitcaseStack
        position={[ROOM_WIDTH / 2 - 0.7, 0, -ROOM_LENGTH * 0.82]}
        accent={accent}
      />

      {/* Ceiling fan */}
      <FanBlades
        position={[0, ROOM_HEIGHT / 2 - 0.15, -ROOM_LENGTH * 0.5]}
        accent={accent}
      />

      {/* Warm amber lights */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH * 0.5]}
        color="#ffcc88"
        intensity={2.8}
        distance={10}
        decay={1.5}
      />
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH * 0.75]}
        color="#ffcc88"
        intensity={1.8}
        distance={8}
        decay={1.5}
      />
    </group>
  );
}

function FanBlades({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 2.2;
  });
  return (
    <group position={position}>
      {/* Motor housing — cylindrical hub */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Downrod from ceiling */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.44, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Canopy cap at ceiling */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.06, 10]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.88} />
      </mesh>
      {/* Light kit below motor */}
      <mesh position={[0, -0.16, 0]}>
        <sphereGeometry args={[0.1, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#fffde8"
          emissive="#fffde8"
          emissiveIntensity={2.0}
        />
      </mesh>
      <pointLight
        position={[0, -0.22, 0]}
        color="#ffeeaa"
        intensity={1.8}
        distance={5}
        decay={2}
      />

      {/* Spinning blades */}
      <group ref={groupRef}>
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              {/* Blade arm */}
              <mesh position={[0.22, -0.05, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.18, 0.025, 0.08]} />
                <meshStandardMaterial color="#3a2510" roughness={0.5} />
              </mesh>
              {/* Blade — tapered plank */}
              <mesh position={[0.62, -0.06, 0]} rotation={[-0.08, 0, 0]}>
                <boxGeometry args={[0.7, 0.018, 0.22]} />
                <meshStandardMaterial
                  color="#c4a35a"
                  roughness={0.4}
                  metalness={0.05}
                />
              </mesh>
              {/* Blade leading edge detail */}
              <mesh position={[0.62, -0.05, -0.1]}>
                <boxGeometry args={[0.7, 0.01, 0.008]} />
                <meshStandardMaterial
                  color={accent}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU ROOM — Banquet Hall
// ═══════════════════════════════════════════════════════════════════════════

interface MenuRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  courses?: Course[];
  bride?: string;
  groom?: string;
  date?: string;
}

function MenuScroll({
  position,
  rotation,
  courses,
  accent,
  scrollIndex,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  courses: Course[];
  accent: string;
  scrollIndex: number;
}) {
  const paperRef = useRef<THREE.Mesh>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const activeRef = useRef(0);
  const timerRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const CYCLE_INTERVAL = 5.0;
  const SW = 1.05;
  const SH = 1.72;
  const CW = 512;
  const CH = 896;

  const drawCourse = (course: Course, idx: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d")!;

    // Parchment gradient
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#f5ecd0");
    bg.addColorStop(0.5, "#ede0bc");
    bg.addColorStop(1, "#e8d8a8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // Subtle paper texture
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * CW;
      const y = Math.random() * CH;
      const v = Math.floor(Math.random() * 10 - 5);
      ctx.fillStyle = `rgba(${140 + v},${110 + v},${60 + v},0.035)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Worn edge
    ctx.strokeStyle = "rgba(100,70,30,0.2)";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, CW - 8, CH - 8);

    // Top ornamental band
    ctx.fillStyle = `${accent}20`;
    ctx.fillRect(0, 0, CW, 82);
    ctx.strokeStyle = `${accent}80`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 82);
    ctx.lineTo(CW - 24, 82);
    ctx.stroke();

    // Course name
    ctx.fillStyle = "#2a1408";
    ctx.font = "bold italic 44px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 4;
    ctx.fillText(course.course.toUpperCase(), CW / 2, 41);
    ctx.shadowBlur = 0;

    // Diamond ornament
    ctx.fillStyle = accent;
    ctx.save();
    ctx.translate(CW / 2, 94);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 94);
    ctx.lineTo(CW / 2 - 18, 94);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CW / 2 + 18, 94);
    ctx.lineTo(CW - 60, 94);
    ctx.stroke();

    // Menu items — strings as written
    let y = 128;
    course.items.slice(0, 8).forEach((item, ii) => {
      // Bullet dot
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(40, y + 16, 5, 0, Math.PI * 2);
      ctx.fill();

      // Item text — wrap at 380px
      ctx.fillStyle = "#1a0e04";
      ctx.font = `${ii === 0 ? "italic bold 27px" : "italic 26px"} serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const words = item.split(" ");
      let line = "";
      let ly = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 420 && line) {
          ctx.fillText(line.trim(), 58, ly);
          line = word + " ";
          ly += 34;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line.trim(), 58, ly);

      // Separator rule
      const itemH = Math.ceil(item.length / 28) * 34 + 12;
      y += Math.max(itemH, 48);
      ctx.strokeStyle = `${accent}18`;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(30, y - 6);
      ctx.lineTo(CW - 30, y - 6);
      ctx.stroke();
    });

    // Pagination dots if cycling
    if (courses.length > 1) {
      const dotSpacing = 18;
      const startX = CW / 2 - ((courses.length - 1) * dotSpacing) / 2;
      courses.forEach((_, di) => {
        ctx.beginPath();
        ctx.arc(startX + di * dotSpacing, CH - 28, 6, 0, Math.PI * 2);
        ctx.fillStyle = di === idx ? accent : `${accent}38`;
        ctx.fill();
      });
    }

    // Bottom rule
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(24, CH - 50);
    ctx.lineTo(CW - 24, CH - 50);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    if (texRef.current) texRef.current.dispose();
    texRef.current = tex;
    if (paperRef.current) {
      const m = paperRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (courses.length === 0) return;
    drawCourse(courses[0], 0);
    return () => {
      texRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, accent]);

  useFrame((_, delta) => {
    if (courses.length <= 1) return;
    timerRef.current += delta;
    if (timerRef.current >= CYCLE_INTERVAL) {
      timerRef.current = 0;
      activeRef.current = (activeRef.current + 1) % courses.length;
      drawCourse(courses[activeRef.current], activeRef.current);
    }
  });

  if (courses.length === 0) return null;

  return (
    <group
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      scale={hovered ? [1.03, 1.03, 1] : [1, 1, 1]}
    >
      {/* Top wooden rod */}
      <mesh position={[0, SH / 2 + 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, SW + 0.28, 10]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.5} />
      </mesh>
      {/* Top endcaps */}
      {([-1, 1] as number[]).map((s, i) => (
        <mesh key={i} position={[s * (SW / 2 + 0.17), SH / 2 + 0.055, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.88}
          />
        </mesh>
      ))}
      {/* Parchment backing */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[SW + 0.02, SH + 0.02]} />
        <meshStandardMaterial color="#c8a870" roughness={1} />
      </mesh>
      {/* Paper surface */}
      <mesh
        ref={paperRef}
        onClick={(e) => {
          e.stopPropagation();
          useRoomsStore
            .getState()
            .setOpenMenuScroll({ courses, index: activeRef.current });
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <planeGeometry args={[SW, SH]} />
        <meshBasicMaterial />
      </mesh>
      {/* Bottom rod */}
      <mesh position={[0, -(SH / 2 + 0.055), 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, SW + 0.28, 10]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.5} />
      </mesh>
      {/* Bottom endcaps */}
      {([-1, 1] as number[]).map((s, i) => (
        <mesh key={i} position={[s * (SW / 2 + 0.17), -(SH / 2 + 0.055), 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.88}
          />
        </mesh>
      ))}
      {/* Hanging cord left */}
      <mesh position={[-(SW / 2 - 0.08), SH / 2 + 0.28, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.44, 4]} />
        <meshStandardMaterial color="#8a6030" roughness={0.8} />
      </mesh>
      {/* Hanging cord right */}
      <mesh position={[SW / 2 - 0.08, SH / 2 + 0.28, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.44, 4]} />
        <meshStandardMaterial color="#8a6030" roughness={0.8} />
      </mesh>
      {hovered && (
        <pointLight
          position={[0, 0, 0.4]}
          color={accent}
          intensity={0.5}
          distance={1.5}
          decay={2}
        />
      )}
    </group>
  );
}

function DiningTable({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  function PlaceSetting({ x, side }: { x: number; side: "near" | "far" }) {
    const z = side === "near" ? 0.34 : -0.34;
    const flip = side === "near" ? 1 : -1;

    // Silver material — high metalness, low roughness for mirror-like finish
    const silver = {
      color: "#c8c0b0",
      roughness: 0.08,
      metalness: 0.98,
      envMapIntensity: 1,
    };
    // Polished blade — brighter, near mirror
    const blade = { color: "#e0ddd8", roughness: 0.04, metalness: 0.99 };
    // Warm bone/resin handle (for fish knife)
    const ivory = { color: "#f0e8d0", roughness: 0.55, metalness: 0.0 };

    // Helper: a fork laid flat on the table along Z axis
    // handleLen, neckLen, tineLen all in table units
    function Fork({
      posX,
      posZ,
      handleLen,
      tineLen,
      tineCount,
      width,
    }: {
      posX: number;
      posZ: number;
      handleLen: number;
      tineLen: number;
      tineCount: number;
      width: number;
    }) {
      const totalLen = handleLen + tineLen + 0.02;
      // Fork points toward the plate (flip * -Z direction)
      // Handle centre at posZ, tines extend toward flip * -Z
      const handleCentreZ = posZ + flip * (tineLen / 2 + 0.01);
      const tineCentreZ = posZ - flip * (handleLen / 2 + 0.01);
      const tineSpacing = (width * 0.7) / (tineCount - 1);
      return (
        <group position={[posX, 0, 0]}>
          {/* Handle — rounded cylinder */}
          <mesh
            position={[0, 0.004, handleCentreZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[width * 0.28, width * 0.22, handleLen, 8]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Shoulder — where handle meets neck */}
          <mesh
            position={[0, 0.004, posZ + flip * (tineLen / 2 - 0.005)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[width * 0.18, width * 0.28, 0.022, 8]} />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Neck/stem */}
          <mesh
            position={[0, 0.004, tineCentreZ + flip * (tineLen * 0.3)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[width * 0.14, width * 0.18, tineLen * 0.42, 6]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Individual tines */}
          {Array.from({ length: tineCount }).map((_, ti) => {
            const tx = -width * 0.35 + ti * tineSpacing;
            return (
              <mesh
                key={ti}
                position={[tx, 0.005, tineCentreZ - flip * (tineLen * 0.28)]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry
                  args={[width * 0.055, width * 0.028, tineLen * 0.55, 5]}
                />
                <meshStandardMaterial {...silver} />
              </mesh>
            );
          })}
        </group>
      );
    }

    // Helper: a knife laid flat
    function Knife({
      posX,
      posZ,
      handleLen,
      bladeLen,
      bladeWidth,
      handleWidth,
      bladeStyle,
    }: {
      posX: number;
      posZ: number;
      handleLen: number;
      bladeLen: number;
      bladeWidth: number;
      handleWidth: number;
      bladeStyle: "dinner" | "fish" | "bread";
    }) {
      const handleCentreZ = posZ + flip * (bladeLen / 2 + 0.008);
      const bladeCentreZ = posZ - flip * (handleLen / 2 + 0.008);
      return (
        <group position={[posX, 0, 0]}>
          {/* Handle — rounded, slightly wider */}
          <mesh
            position={[0, 0.004, handleCentreZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[handleWidth * 0.38, handleWidth * 0.3, handleLen, 8]}
            />
            <meshStandardMaterial
              {...(bladeStyle === "fish" ? ivory : silver)}
            />
          </mesh>
          {/* Bolster — metal collar between handle and blade */}
          <mesh
            position={[0, 0.004, posZ + flip * (bladeLen / 2 - 0.002)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[handleWidth * 0.32, handleWidth * 0.32, 0.016, 8]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Blade */}
          {bladeStyle === "dinner" && (
            <mesh
              position={[0, 0.003, bladeCentreZ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[bladeWidth * 0.18, bladeWidth * 0.04, bladeLen, 6]}
              />
              <meshStandardMaterial {...blade} />
            </mesh>
          )}
          {bladeStyle === "fish" && (
            // Fish knife — wide, spatula-like blade
            <mesh
              position={[0, 0.003, bladeCentreZ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[bladeWidth * 0.5, bladeWidth * 0.15, bladeLen, 6]}
              />
              <meshStandardMaterial {...blade} />
            </mesh>
          )}
          {bladeStyle === "bread" && (
            // Bread knife — wider, serrated look via slightly rougher material
            <mesh
              position={[0, 0.003, bladeCentreZ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[bladeWidth * 0.22, bladeWidth * 0.08, bladeLen, 6]}
              />
              <meshStandardMaterial
                color="#dedad4"
                roughness={0.18}
                metalness={0.95}
              />
            </mesh>
          )}
        </group>
      );
    }

    // Helper: a spoon laid flat
    function Spoon({
      posX,
      posZ,
      handleLen,
      bowlSize,
      handleWidth,
    }: {
      posX: number;
      posZ: number;
      handleLen: number;
      bowlSize: number;
      handleWidth: number;
    }) {
      const handleCentreZ = posZ + flip * (bowlSize + 0.01);
      const bowlCentreZ = posZ - flip * (handleLen / 2);
      return (
        <group position={[posX, 0, 0]}>
          {/* Handle */}
          <mesh
            position={[0, 0.004, handleCentreZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[handleWidth * 0.28, handleWidth * 0.22, handleLen, 8]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Neck */}
          <mesh
            position={[0, 0.004, posZ + flip * (bowlSize * 0.5)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[handleWidth * 0.14, handleWidth * 0.24, bowlSize * 0.9, 6]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Bowl — ellipsoidal spoon head */}
          <mesh
            position={[0, 0.006, bowlCentreZ - flip * bowlSize * 0.2]}
            rotation={[flip * 0.18, 0, 0]}
          >
            <sphereGeometry
              args={[bowlSize, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
        </group>
      );
    }

    return (
      <group position={[x, 0, z]}>
        {/* ── Charger plate (decorative base) ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.198, 0.198, 0.005, 32]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.15}
            metalness={0.92}
          />
        </mesh>
        {/* Charger rim detail — raised ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <torusGeometry args={[0.188, 0.007, 6, 32]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.12}
            metalness={0.95}
          />
        </mesh>

        {/* ── Dinner plate ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <cylinderGeometry args={[0.168, 0.162, 0.012, 32]} />
          <meshStandardMaterial
            color="#f8f4ee"
            roughness={0.55}
            metalness={0}
          />
        </mesh>
        {/* Plate well — slight concave top (simulated with smaller flat disc) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
          <cylinderGeometry args={[0.128, 0.128, 0.003, 28]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.5} />
        </mesh>
        {/* Plate rim gold band */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
          <torusGeometry args={[0.152, 0.005, 6, 32]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.18}
            metalness={0.88}
          />
        </mesh>

        {/* ── Side / bread plate (top-left of setting) ── */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[flip * -0.3, 0.003, flip * -0.07]}
        >
          <cylinderGeometry args={[0.1, 0.098, 0.008, 24]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.55} />
        </mesh>

        {/* ── Forks — left of plate ── */}
        {/* Salad fork — outermost left */}
        <Fork
          posX={flip * -0.245}
          posZ={0}
          handleLen={0.13}
          tineLen={0.065}
          tineCount={4}
          width={0.022}
        />
        {/* Dinner fork — closer to plate */}
        <Fork
          posX={flip * -0.21}
          posZ={0}
          handleLen={0.15}
          tineLen={0.075}
          tineCount={4}
          width={0.024}
        />

        {/* ── Knives — right of plate (blade toward plate) ── */}
        {/* Dinner knife */}
        <Knife
          posX={flip * 0.21}
          posZ={0}
          handleLen={0.12}
          bladeLen={0.1}
          bladeWidth={0.022}
          handleWidth={0.022}
          bladeStyle="dinner"
        />
        {/* Fish knife */}
        <Knife
          posX={flip * 0.24}
          posZ={0}
          handleLen={0.1}
          bladeLen={0.085}
          bladeWidth={0.028}
          handleWidth={0.02}
          bladeStyle="fish"
        />
        {/* Soup spoon — outermost right */}
        <Spoon
          posX={flip * 0.272}
          posZ={0}
          handleLen={0.14}
          bowlSize={0.028}
          handleWidth={0.018}
        />

        {/* ── Bread knife on side plate ── */}
        <Knife
          posX={flip * -0.3}
          posZ={flip * 0.07}
          handleLen={0.1}
          bladeLen={0.08}
          bladeWidth={0.018}
          handleWidth={0.018}
          bladeStyle="bread"
        />

        {/* ── Above plate: dessert cutlery (horizontal, handles pointing right) ── */}
        {/* Dessert spoon — closer to plate */}
        <group position={[flip * 0.018, 0, flip * -0.215]}>
          <mesh
            rotation={[0, (flip * Math.PI) / 2, 0]}
            position={[0, 0.004, 0]}
          >
            <cylinderGeometry args={[0.011, 0.009, 0.135, 8]} />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* Spoon bowl — pointing handle-left */}
          <mesh
            position={[flip * -0.078, 0.007, 0]}
            rotation={[0.2, (flip * Math.PI) / 2, 0]}
          >
            <sphereGeometry
              args={[0.022, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]}
            />
            <meshStandardMaterial {...silver} />
          </mesh>
        </group>
        {/* Dessert fork — below dessert spoon, handle pointing left */}
        <group position={[flip * -0.018, 0, flip * -0.235]}>
          <mesh
            rotation={[0, (flip * Math.PI) / 2, 0]}
            position={[0, 0.004, 0]}
          >
            <cylinderGeometry args={[0.01, 0.008, 0.115, 8]} />
            <meshStandardMaterial {...silver} />
          </mesh>
          {/* 3 tines pointing handle-right direction */}
          {([-0.008, 0, 0.008] as number[]).map((tz, ti) => (
            <mesh
              key={ti}
              position={[flip * 0.06, 0.005, tz]}
              rotation={[0, (flip * Math.PI) / 2, 0]}
            >
              <cylinderGeometry args={[0.004, 0.002, 0.044, 5]} />
              <meshStandardMaterial {...silver} />
            </mesh>
          ))}
        </group>

        {/* ── Glasses — upper right of plate ── */}
        {/* Water goblet — tallest */}
        <group position={[flip * 0.13, 0, flip * -0.22]}>
          <mesh position={[0, 0.004, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.006, 20]} />
            <meshStandardMaterial
              color="#e8f4ff"
              roughness={0.04}
              metalness={0.05}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.007, 0.009, 0.192, 8]} />
            <meshStandardMaterial
              color="#e8f4ff"
              roughness={0.04}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh position={[0, 0.215, 0]}>
            <cylinderGeometry args={[0.05, 0.02, 0.055, 16]} />
            <meshStandardMaterial
              color="#e8f4ff"
              roughness={0.04}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh position={[0, 0.255, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.11, 16]} />
            <meshStandardMaterial
              color="#e8f4ff"
              roughness={0.04}
              transparent
              opacity={0.38}
            />
          </mesh>
        </group>
        {/* Red wine — widest bowl */}
        <group position={[flip * 0.205, 0, flip * -0.245]}>
          <mesh position={[0, 0.003, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.005, 18]} />
            <meshStandardMaterial
              color="#fff0f0"
              roughness={0.04}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.006, 0.008, 0.174, 8]} />
            <meshStandardMaterial
              color="#fff0f0"
              roughness={0.04}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.058, 0.016, 0.07, 16]} />
            <meshStandardMaterial
              color="#fff0f0"
              roughness={0.04}
              transparent
              opacity={0.45}
            />
          </mesh>
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.058, 0.054, 0.1, 16]} />
            <meshStandardMaterial
              color="#fff0f0"
              roughness={0.04}
              transparent
              opacity={0.35}
            />
          </mesh>
        </group>
        {/* White wine — narrower bowl */}
        <group position={[flip * 0.27, 0, flip * -0.215]}>
          <mesh position={[0, 0.003, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.005, 16]} />
            <meshStandardMaterial
              color="#f0fff4"
              roughness={0.04}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0, 0.082, 0]}>
            <cylinderGeometry args={[0.006, 0.007, 0.158, 8]} />
            <meshStandardMaterial
              color="#f0fff4"
              roughness={0.04}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0, 0.185, 0]}>
            <cylinderGeometry args={[0.042, 0.014, 0.055, 14]} />
            <meshStandardMaterial
              color="#f0fff4"
              roughness={0.04}
              transparent
              opacity={0.45}
            />
          </mesh>
          <mesh position={[0, 0.222, 0]}>
            <cylinderGeometry args={[0.042, 0.038, 0.09, 14]} />
            <meshStandardMaterial
              color="#f0fff4"
              roughness={0.04}
              transparent
              opacity={0.35}
            />
          </mesh>
        </group>

        {/* ── Napkin — bishop's mitre fold, left of forks ── */}
        <group position={[flip * -0.355, 0, 0]}>
          {/* Base rectangle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <planeGeometry args={[0.11, 0.1]} />
            <meshStandardMaterial
              color="#f5f0e8"
              roughness={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Left wing fold */}
          <mesh
            position={[-0.025, 0.028, 0]}
            rotation={[-Math.PI / 2, 0, -0.38]}
          >
            <planeGeometry args={[0.075, 0.06]} />
            <meshStandardMaterial
              color="#f5f0e8"
              roughness={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Right wing fold */}
          <mesh position={[0.025, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0.38]}>
            <planeGeometry args={[0.075, 0.06]} />
            <meshStandardMaterial
              color="#f5f0e8"
              roughness={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Peak */}
          <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.028, 0.038, 5]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.92} />
          </mesh>
          {/* Gold napkin ring around base */}
          <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.026, 0.007, 8, 20]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.18}
              metalness={0.92}
            />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group position={position}>
      {/* ── Table structure ── */}
      {/* Table top — dark mahogany */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[ROOM_WIDTH * 0.72, 0.055, 1.18]} />
        <meshStandardMaterial
          color="#3a1a08"
          roughness={0.22}
          metalness={0.04}
        />
      </mesh>
      {/* Edge moulding */}
      <mesh position={[0, 0.458, 0]}>
        <boxGeometry args={[ROOM_WIDTH * 0.724, 0.02, 1.2]} />
        <meshStandardMaterial color="#2a1206" roughness={0.35} />
      </mesh>
      {/* White linen runner down centre */}
      <mesh position={[0, 0.487, 0]}>
        <boxGeometry args={[ROOM_WIDTH * 0.68, 0.006, 0.38]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.9} />
      </mesh>
      {/* Linen runner accent border */}
      <mesh position={[0, 0.4875, 0]}>
        <boxGeometry args={[ROOM_WIDTH * 0.68, 0.002, 0.37]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.2}
          metalness={0.7}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Table legs — turned style, 4 corner legs */}
      {(
        [
          [-ROOM_WIDTH * 0.32, -0.5],
          [ROOM_WIDTH * 0.32, -0.5],
          [-ROOM_WIDTH * 0.32, 0.5],
          [ROOM_WIDTH * 0.32, 0.5],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]}>
          {/* Upper turned section */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.055, 0.042, 0.28, 10]} />
            <meshStandardMaterial color="#2a1206" roughness={0.45} />
          </mesh>
          {/* Turned knob */}
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.058, 10, 8]} />
            <meshStandardMaterial color="#2a1206" roughness={0.42} />
          </mesh>
          {/* Lower taper */}
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.038, 0.05, 0.2, 10]} />
            <meshStandardMaterial color="#2a1206" roughness={0.48} />
          </mesh>
          {/* Foot pad */}
          <mesh position={[0, -0.26, 0]}>
            <cylinderGeometry args={[0.055, 0.06, 0.02, 10]} />
            <meshStandardMaterial color="#1a0c04" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── Centre decoration ── */}
      {/* Floral centrepiece base */}
      <mesh position={[0, 0.49, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.06, 14]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Flower arrangement — layered spheres */}
      {(
        [
          [0, 0.14, 0, 0.09, "#e8556a"],
          [-0.07, 0.13, 0.04, 0.07, "#f06080"],
          [0.07, 0.13, -0.04, 0.07, "#d44060"],
          [0, 0.11, -0.07, 0.06, "#e86878"],
          [0, 0.11, 0.07, 0.065, "#f07888"],
          [-0.04, 0.16, 0, 0.05, "#ffffff"],
          [0.04, 0.15, 0.05, 0.045, "#fff0f0"],
        ] as [number, number, number, number, string][]
      ).map(([fx, fy, fz, fr, fc], i) => (
        <mesh key={i} position={[fx, 0.49 + fy, fz]}>
          <sphereGeometry args={[fr, 8, 8]} />
          <meshStandardMaterial color={fc} roughness={0.85} />
        </mesh>
      ))}
      {/* Green foliage */}
      {(
        [
          [-0.1, 0.06, 0.05],
          [0.1, 0.06, -0.06],
          [-0.06, 0.06, -0.1],
          [0.08, 0.06, 0.1],
        ] as [number, number, number][]
      ).map(([fx, fy, fz], i) => (
        <mesh key={i} position={[fx, 0.49 + fy, fz]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#2a5a1a" roughness={0.9} />
        </mesh>
      ))}

      {/* ── 3 candelabras along centre runner ── */}
      {([-1.8, 0, 1.8] as number[]).map((x, ci) => (
        <group key={ci} position={[x, 0.492, 0]}>
          {/* Base disc */}
          <mesh>
            <cylinderGeometry args={[0.055, 0.065, 0.04, 10]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          {/* Stem */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.014, 0.018, 0.2, 8]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          {/* Bobble */}
          <mesh position={[0, 0.23, 0]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.18}
              metalness={0.92}
            />
          </mesh>
          {/* Drip cup */}
          <mesh position={[0, 0.265, 0]}>
            <cylinderGeometry args={[0.03, 0.022, 0.03, 10]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.88}
            />
          </mesh>
          {/* Candle */}
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
            <meshStandardMaterial color="#f8f0d0" roughness={0.9} />
          </mesh>
          {/* Flame */}
          <mesh position={[0, 0.415, 0]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial
              color="#ffeeaa"
              emissive="#ffeeaa"
              emissiveIntensity={3.0}
            />
          </mesh>
          <pointLight
            position={[0, 0.5, 0]}
            color="#ffdd88"
            intensity={0.7}
            distance={2.5}
            decay={2}
          />
        </group>
      ))}

      {/* Computed seat positions — inset so cutlery stays within table bounds */}
      {(() => {
        const tableHalf = ROOM_WIDTH * 0.72 * 0.5;
        const inset = 0.48;
        const h = tableHalf - inset;
        const seatXs: number[] = [-h, -h * 0.34, h * 0.34, h];
        return (
          <>
            {seatXs.map((x, i) => (
              <group key={`near-${i}`} position={[0, 0.508, 0]}>
                <PlaceSetting x={x} side="near" />
              </group>
            ))}
            {seatXs.map((x, i) => (
              <group key={`far-${i}`} position={[0, 0.508, 0]}>
                <PlaceSetting x={x} side="far" />
              </group>
            ))}
          </>
        );
      })()}
    </group>
  );
}

function Fireplace2({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Mantle */}
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[1.6, 0.1, 0.42]} />
        <meshStandardMaterial color="#9a9080" roughness={0.85} />
      </mesh>
      {/* Stone columns */}
      {([-0.68, 0.68] as number[]).map((x, i) => (
        <group key={i} position={[x, 0.28, 0]}>
          <mesh>
            <boxGeometry args={[0.22, 0.6, 0.3]} />
            <meshStandardMaterial color="#8a8078" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.33, 0]}>
            <boxGeometry args={[0.26, 0.06, 0.34]} />
            <meshStandardMaterial color="#9a9080" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Top bar */}
      <mesh position={[0, 0.55, 0.14]}>
        <boxGeometry args={[1.0, 0.1, 0.18]} />
        <meshStandardMaterial color="#7a7068" roughness={0.9} />
      </mesh>
      {/* Firebox */}
      <mesh position={[0, 0.28, 0.08]}>
        <boxGeometry args={[0.84, 0.5, 0.22]} />
        <meshStandardMaterial color="#1a0e06" roughness={1} />
      </mesh>
      {/* Hearth slab */}
      <mesh position={[0, 0.04, 0.22]}>
        <boxGeometry args={[1.0, 0.06, 0.34]} />
        <meshStandardMaterial color="#9a9080" roughness={0.85} />
      </mesh>
      <FireFlame position={[0, 0.18, 0.1]} />
      {/* Gold accent rail */}
      <mesh position={[0, 0.88, 0.18]}>
        <boxGeometry args={[0.9, 0.08, 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.88} />
      </mesh>
    </group>
  );
}

function FireFlame({ position }: { position: [number, number, number] }) {
  const f1 = useRef<THREE.Mesh>(null);
  const f2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (f1.current) {
      f1.current.scale.y = 0.88 + Math.sin(t * 4.2) * 0.18;
      f1.current.scale.x = 0.92 + Math.sin(t * 5.8) * 0.1;
    }
    if (f2.current) {
      f2.current.scale.y = 0.8 + Math.sin(t * 7.1 + 1.2) * 0.22;
    }
  });
  return (
    <group position={position}>
      <mesh ref={f1}>
        <coneGeometry args={[0.18, 0.36, 7]} />
        <meshStandardMaterial
          color="#ff5500"
          emissive="#ff3300"
          emissiveIntensity={2.8}
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={f2} position={[0, 0.02, 0]}>
        <coneGeometry args={[0.1, 0.28, 6]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ff8800"
          emissiveIntensity={3.5}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        position={[0, 0.1, 0.1]}
        color="#ff7722"
        intensity={2.8}
        distance={4}
        decay={2}
      />
    </group>
  );
}

export function MenuRoom({ theme, courses = [] }: MenuRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  // Distribute courses across 4 scrolls (2 per wall, left then right alternating)
  const scrollCourses: Course[][] = [[], [], [], []];
  courses.forEach((c, i) => {
    scrollCourses[i % 4].push(c);
  });

  const scrollPositions: [number, number, number][] = [
    [-ROOM_WIDTH / 2 + 0.06, 0.3, -ROOM_LENGTH * 0.58],
    [-ROOM_WIDTH / 2 + 0.06, 0.3, -ROOM_LENGTH * 0.78],
    [ROOM_WIDTH / 2 - 0.06, 0.3, -ROOM_LENGTH * 0.58],
    [ROOM_WIDTH / 2 - 0.06, 0.3, -ROOM_LENGTH * 0.78],
  ];
  const scrollRotations: [number, number, number][] = [
    [0, Math.PI / 2, 0],
    [0, Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
  ];

  return (
    <group>
      {/* Scrolls — only render non-empty */}
      {scrollCourses.map((c, i) =>
        c.length === 0 ? null : (
          <MenuScroll
            key={i}
            position={scrollPositions[i]}
            rotation={scrollRotations[i]}
            courses={c}
            accent={accent}
            scrollIndex={i}
          />
        ),
      )}

      {/* Banquet dining table */}
      <DiningTable
        position={[0, floorY, -ROOM_LENGTH * 0.55]}
        accent={accent}
      />

      {/* Fireplace on LEFT wall — well away from door and scrolls */}
      <Fireplace2
        position={[-ROOM_WIDTH / 2 + 0.06, floorY + 0.28, -ROOM_LENGTH * 0.78]}
        accent={accent}
      />

      {/* Chandeliers */}
      {([-ROOM_LENGTH * 0.38, -ROOM_LENGTH * 0.62] as number[]).map((z, i) => (
        <group key={i} position={[0, ROOM_HEIGHT / 2 - 0.14, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.028, 6, 20]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.15}
              metalness={0.95}
            />
          </mesh>
          {Array.from({ length: 6 }).map((_, j) => {
            const a = (j / 6) * Math.PI * 2;
            return (
              <group
                key={j}
                position={[Math.cos(a) * 0.38, -0.06, Math.sin(a) * 0.38]}
              >
                <mesh>
                  <cylinderGeometry args={[0.008, 0.008, 0.14, 5]} />
                  <meshStandardMaterial
                    color={accent}
                    roughness={0.2}
                    metalness={0.9}
                  />
                </mesh>
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.025, 6, 6]} />
                  <meshStandardMaterial
                    color="#ffeeaa"
                    emissive="#ffeeaa"
                    emissiveIntensity={2.5}
                  />
                </mesh>
              </group>
            );
          })}
          <pointLight
            color="#ffdd88"
            intensity={2.2}
            distance={8}
            decay={1.5}
          />
        </group>
      ))}

      {/* Ceiling beams */}
      {(
        [
          -ROOM_LENGTH * 0.28,
          -ROOM_LENGTH * 0.52,
          -ROOM_LENGTH * 0.75,
        ] as number[]
      ).map((z, i) => (
        <mesh key={i} position={[0, ROOM_HEIGHT / 2 - 0.05, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.14, 0.22]} />
          <meshStandardMaterial color="#2a1408" roughness={0.85} />
        </mesh>
      ))}

      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH * 0.5]}
        color="#ffeecc"
        intensity={1.5}
        distance={9}
        decay={1.5}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVESTREAM ROOM — Screening Room
// ═══════════════════════════════════════════════════════════════════════════

interface LivestreamRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  url?: string;
  title?: string;
  date?: string;
  livestreamTime?: string;
}

function VintageTV({
  position,
  accent,
  url,
  title,
  date,
  livestreamTime,
}: {
  position: [number, number, number];
  accent: string;
  url?: string;
  title?: string;
  date?: string;
  livestreamTime?: string;
}) {
  const [hovered, setHovered] = useState(false);

  // Determine if it's time to go live
  const isLive = (() => {
    if (!date) return false;
    const base = new Date(date);
    if (livestreamTime) {
      const [h, m] = livestreamTime.split(":").map(Number);
      base.setHours(h, m, 0, 0);
    }
    // Allow access 30 minutes before scheduled time
    return Date.now() >= base.getTime() - 30 * 60 * 1000;
  })();

  const stream = url ? detectStream(url) : null;
  const meta = stream ? PLATFORM_META[stream.platform] : null;

  // Static noise texture for off state
  const screenTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext("2d")!;

    // Blue-tinted CRT noise
    for (let y = 0; y < 768; y += 3) {
      for (let x = 0; x < 1024; x += 3) {
        const v = Math.floor(Math.random() * 80 + 20);
        ctx.fillStyle = `rgb(${v},${Math.floor(v * 1.1)},${Math.min(Math.floor(v * 1.6), 255)})`;
        ctx.fillRect(x, y, 3, 3);
      }
    }
    // Semi-transparent dark blue overlay
    ctx.fillStyle = "rgba(0,5,20,0.55)";
    ctx.fillRect(0, 0, 1024, 768);

    // Scanlines
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 768; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Platform icon
    if (meta) {
      ctx.font = "96px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.icon, 512, 160);
    }

    const badgeY = meta ? 300 : 220;

    if (isLive) {
      // Red LIVE badge
      ctx.fillStyle = "#cc0000";
      ctx.beginPath();
      ctx.roundRect(512 - 180, badgeY - 40, 360, 80, 10);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 16;
      ctx.fillText("● LIVE NOW", 512, badgeY);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#88ffaa";
      ctx.font = "bold 34px monospace";
      ctx.fillText("▶  Click screen to tune in", 512, badgeY + 100);
    } else {
      // Gold PENDING badge
      ctx.fillStyle = "rgba(200,140,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(512 - 260, badgeY - 44, 520, 88, 10);
      ctx.fill();
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#ffee00";
      ctx.font = "bold 52px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 18;
      ctx.fillText("BROADCAST PENDING", 512, badgeY);
      ctx.shadowBlur = 0;

      // Countdown
      if (date) {
        const diff = new Date(date).getTime() - Date.now();
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 58px monospace";
        ctx.shadowColor = "#aaaaff";
        ctx.shadowBlur = 10;
        ctx.fillText(`${d}d  ${h}h  ${m}m`, 512, badgeY + 110);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#cccccc";
        ctx.font = "30px sans-serif";
        ctx.fillText("until broadcast", 512, badgeY + 172);
      }
    }

    // Title
    if (title) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "italic 32px serif";
      ctx.textAlign = "center";
      ctx.fillText(title.slice(0, 40), 512, 690);
    }

    // Start time
    if (livestreamTime) {
      ctx.fillStyle = "rgba(255,220,100,0.8)";
      ctx.font = "bold 26px monospace";
      ctx.fillText(`Starts: ${livestreamTime}`, 512, 734);
    }

    // Gold border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 1008, 752);

    return new THREE.CanvasTexture(canvas);
  }, [
    isLive,
    meta?.icon ?? "",
    accent,
    title ?? "",
    date ?? "",
    livestreamTime ?? "",
  ]);

  // Cabinet is now larger: 2.4 wide, 1.8 tall, 0.8 deep
  const W = 3.2,
    H = 2.4,
    D = 0.85;

  return (
    <group position={position}>
      {/* Main cabinet — large wooden box */}
      <mesh>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#3a2510" roughness={0.45} />
      </mesh>
      {/* Wooden veneer panel texture sides */}
      <mesh position={[0, 0.1, D / 2 + 0.001]}>
        <boxGeometry args={[W, H * 0.85, 0.01]} />
        <meshStandardMaterial color="#2e1c0a" roughness={0.5} />
      </mesh>

      {/* Screen bezel — inset panel */}
      <mesh position={[0, 0.12, D / 2 + 0.02]}>
        <boxGeometry args={[W * 0.88, H * 0.72, 0.04]} />
        <meshStandardMaterial
          color="#111008"
          roughness={0.3}
          emissive={hovered ? (isLive ? "#112200" : "#0a0a1a") : "#000000"}
          emissiveIntensity={hovered ? 1.5 : 0}
        />
      </mesh>

      {/* Screen surface */}
      <mesh
        position={[0, 0.12, D / 2 + 0.05]}
        onClick={(e) => {
          e.stopPropagation();
          useRoomsStore.getState().setOpenCard({
            year: isLive ? "● LIVE NOW" : "Coming Soon",
            icon: meta?.icon ?? "📺",
            title: isLive
              ? (title ?? "Watch Live")
              : `Stream starts at ${livestreamTime ?? "event time"}`,
            desc: isLive
              ? (stream?.externalUrl ?? "")
              : `The stream will be available 30 minutes before the scheduled time.${date ? ` Date: ${new Date(date).toLocaleDateString()}` : ""}`,
          });
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <planeGeometry args={[W * 0.82, H * 0.62]} />
        <meshBasicMaterial map={screenTexture} />
      </mesh>

      {/* Screen glow when hovered and live */}
      {hovered && (
        <pointLight
          position={[0, 0.12, D / 2 + 0.3]}
          color={isLive ? "#44ff88" : accent}
          intensity={isLive ? 2.0 : 1.2}
          distance={2.5}
          decay={2}
        />
      )}

      {/* Bottom control panel */}
      <mesh position={[0, -H / 2 + 0.12, D / 2 + 0.02]}>
        <boxGeometry args={[W * 0.88, 0.18, 0.03]} />
        <meshStandardMaterial color="#1a1008" roughness={0.5} />
      </mesh>
      {/* Control knobs — row of 4 */}
      {([-0.7, -0.35, 0.35, 0.7] as number[]).map((x, i) => (
        <mesh
          key={i}
          position={[x, -H / 2 + 0.12, D / 2 + 0.055]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.04, 10]} />
          <meshStandardMaterial
            color="#2a2a2a"
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}
      {/* Speaker grille — left side */}
      <mesh position={[-W / 2 + 0.18, 0.1, D / 2 + 0.01]}>
        <boxGeometry args={[0.22, H * 0.55, 0.02]} />
        <meshStandardMaterial color="#1e1408" roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[-W / 2 + 0.18, -H * 0.22 + i * 0.1, D / 2 + 0.03]}
        >
          <boxGeometry args={[0.18, 0.012, 0.01]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
      ))}
      {/* Speaker grille — right side */}
      <mesh position={[W / 2 - 0.18, 0.1, D / 2 + 0.01]}>
        <boxGeometry args={[0.22, H * 0.55, 0.02]} />
        <meshStandardMaterial color="#1e1408" roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[W / 2 - 0.18, -H * 0.22 + i * 0.1, D / 2 + 0.03]}
        >
          <boxGeometry args={[0.18, 0.012, 0.01]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
      ))}

      {/* Antenna — V-shape, larger */}
      <mesh position={[W * 0.28, H / 2 + 0.3, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[-W * 0.28, H / 2 + 0.3, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Cabinet stand / legs */}
      {(
        [
          [-W * 0.38, -D * 0.35],
          [W * 0.38, -D * 0.35],
          [-W * 0.38, D * 0.35],
          [W * 0.38, D * 0.35],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, -H / 2 - 0.12, z]}>
          <cylinderGeometry args={[0.04, 0.055, 0.24, 6]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.88}
          />
        </mesh>
      ))}

      {/* Screen ambient light */}
      <pointLight
        position={[0, 0.12, D / 2 + 0.6]}
        color={isLive ? "#44ff88" : "#4488cc"}
        intensity={2.5}
        distance={6}
        decay={1.5}
      />
    </group>
  );
}

function CinemaSeats({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const floorY = -ROOM_HEIGHT / 2;
  return (
    <group position={position}>
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={i} position={[(-1 + i) * 0.78, 0, 0]}>
          {/* Seat */}
          <mesh position={[0, floorY + 0.34, 0]}>
            <boxGeometry args={[0.62, 0.1, 0.56]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
          </mesh>
          {/* Back */}
          <mesh position={[0, floorY + 0.72, 0.24]}>
            <boxGeometry args={[0.62, 0.56, 0.1]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
          </mesh>
          {/* Armrests */}
          {([-0.34, 0.34] as number[]).map((x, j) => (
            <mesh key={j} position={[x, floorY + 0.48, -0.02]}>
              <boxGeometry args={[0.08, 0.06, 0.52]} />
              <meshStandardMaterial color="#2a1408" roughness={0.4} />
            </mesh>
          ))}
          {/* Legs */}
          {([-0.26, 0.26] as number[]).map((x, j) => (
            <mesh key={j} position={[x, floorY + 0.14, 0]}>
              <boxGeometry args={[0.06, 0.28, 0.06]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function ProjectionBeam({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-0.35, 0, 0]}>
      <coneGeometry args={[0.35, 4.5, 8]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function LivestreamRoom({
  theme,
  url,
  title,
  date,
  livestreamTime,
}: LivestreamRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  return (
    <group>
      {/* Vintage TV — centre mid-room */}
      <VintageTV
        position={[0, floorY + 1.55, -ROOM_LENGTH * 0.65]}
        accent={accent}
        url={url}
        title={title}
        date={date}
        livestreamTime={livestreamTime}
      />

      {/* Cinema seats — two rows */}
      <CinemaSeats position={[0, 0, -ROOM_LENGTH * 0.42]} accent={accent} />
      <CinemaSeats position={[0, 0, -ROOM_LENGTH * 0.55]} accent={accent} />

      {/* Projection beam from back */}
      <ProjectionBeam
        position={[0, ROOM_HEIGHT / 2 - 0.25, -ROOM_LENGTH * 0.52]}
      />

      {/* Red velvet curtains flanking back wall */}
      {([-ROOM_WIDTH / 2 + 0.1, ROOM_WIDTH / 2 - 0.1] as number[]).map(
        (x, i) => (
          <mesh key={i} position={[x, 0.3, -ROOM_LENGTH * 0.75]}>
            <planeGeometry args={[0.65, ROOM_HEIGHT * 0.75]} />
            <meshStandardMaterial
              color="#6a1a1a"
              roughness={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        ),
      )}

      {/* Platform indicator channel card */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.35, -ROOM_LENGTH * 0.58]}>
        <boxGeometry args={[0.45, 0.22, 0.04]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.18}
          metalness={0.88}
        />
      </mesh>

      {/* Overhead screen light */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.62]}
        color="#aaccff"
        intensity={1.8}
        distance={5}
        decay={2}
      />
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.35]}
        color="#fff5e0"
        intensity={1.5}
        distance={5}
        decay={2}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY ROOM — Gift Room
// ═══════════════════════════════════════════════════════════════════════════

interface RegistryRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  itemCount?: number;
}

function GiftBox({
  position,
  size,
  color,
  accent,
  ribbonColor,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  accent: string;
  ribbonColor: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      {/* Ribbon horizontal */}
      <mesh position={[0, size[1] / 2 + 0.005, 0]}>
        <boxGeometry args={[size[0] + 0.01, 0.025, size[2] * 0.12]} />
        <meshStandardMaterial
          color={ribbonColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Ribbon vertical */}
      <mesh position={[0, size[1] / 2 + 0.005, 0]}>
        <boxGeometry args={[size[0] * 0.12, 0.025, size[2] + 0.01]} />
        <meshStandardMaterial
          color={ribbonColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Bow */}
      <mesh position={[0, size[1] / 2 + 0.04, 0]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial
          color={ribbonColor}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>
    </group>
  );
}

function GiftShelf({
  position,
  rotation,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
}) {
  const giftColors = [
    "#cc4488",
    "#4488cc",
    "#44cc88",
    "#ccaa44",
    "#8844cc",
    "#cc4444",
    "#44aacc",
  ];
  const ribbonColors = [
    "#ffaacc",
    "#aaccff",
    "#aaffcc",
    "#ffddaa",
    "#ccaaff",
    "#ffaaaa",
    "#aaddff",
  ];

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Shelf */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.06, 0.38]} />
        <meshStandardMaterial color="#2a1408" roughness={0.6} />
      </mesh>
      {/* Gifts on shelf */}
      {Array.from({ length: 5 }).map((_, i) => (
        <GiftBox
          key={i}
          position={[-0.9 + i * 0.44, 0.14 + (i % 3) * 0.04, 0]}
          size={[0.28 + (i % 3) * 0.06, 0.18 + (i % 3) * 0.08, 0.24]}
          color={giftColors[i % giftColors.length]}
          accent={accent}
          ribbonColor={ribbonColors[i % ribbonColors.length]}
        />
      ))}
    </group>
  );
}

export function RegistryRoom({ theme, itemCount = 6 }: RegistryRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;
  const shelfPositions = [-0.5, 0.1, 0.7];

  return (
    <group>
      {/* Left wall shelving unit with gifts */}
      <group
        position={[-ROOM_WIDTH / 2 + 0.22, floorY + 0.5, -ROOM_LENGTH * 0.52]}
      >
        {shelfPositions.map((y, i) => (
          <GiftShelf
            key={i}
            position={[0, y, 0]}
            rotation={[0, Math.PI / 2, 0]}
            accent={accent}
          />
        ))}
        {/* Shelf unit sides */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.06, 1.5, 2.6]} />
          <meshStandardMaterial color="#2a1408" roughness={0.6} />
        </mesh>
      </group>

      {/* Right wall shelving unit */}
      <group
        position={[ROOM_WIDTH / 2 - 0.22, floorY + 0.5, -ROOM_LENGTH * 0.52]}
      >
        {shelfPositions.map((y, i) => (
          <GiftShelf
            key={i}
            position={[0, y, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            accent={accent}
          />
        ))}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.06, 1.5, 2.6]} />
          <meshStandardMaterial color="#2a1408" roughness={0.6} />
        </mesh>
      </group>

      {/* Central table with gifts — click to open the registry */}
      <InteractiveProp
        position={[0, floorY, -ROOM_LENGTH * 0.6]}
        panelKey="registry"
        hintLabel="Tap to View Registry"
        accent={accent}
      >
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.8, 0.06, 1.1]} />
          <meshStandardMaterial color="#2a1408" roughness={0.35} />
        </mesh>
        {/* Tissue paper */}
        <mesh position={[0, 0.455, 0]}>
          <boxGeometry args={[1.75, 0.01, 1.05]} />
          <meshStandardMaterial color="#e8d8e8" roughness={0.9} />
        </mesh>
        {/* Gifts on table */}
        {Array.from({ length: 4 }).map((_, i) => (
          <GiftBox
            key={i}
            position={[
              -0.55 + (i % 2) * 0.65,
              0.49,
              -0.2 + Math.floor(i / 2) * 0.48,
            ]}
            size={[0.32 + i * 0.04, 0.22 + i * 0.04, 0.28]}
            color={["#cc4488", "#4488cc", "#44cc88", "#ccaa44"][i]}
            accent={accent}
            ribbonColor={["#ffaacc", "#aaccff", "#aaffcc", "#ffddaa"][i]}
          />
        ))}
        {(
          [
            [-0.77, -0.42],
            [0.77, -0.42],
            [-0.77, 0.42],
            [0.77, 0.42],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]}>
            <boxGeometry args={[0.07, 0.3, 0.07]} />
            <meshStandardMaterial color="#2a1408" roughness={0.5} />
          </mesh>
        ))}
      </InteractiveProp>

      {/* Fairy lights strung between shelf units */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            -ROOM_WIDTH / 2 + 0.5 + (i / 17) * (ROOM_WIDTH - 1.0),
            ROOM_HEIGHT / 2 - 0.35,
            -ROOM_LENGTH * 0.45,
          ]}
        >
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial
            color="#ffeeaa"
            emissive="#ffeeaa"
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}

      {/* Gift Room arch sign */}
      <mesh position={[0, 0.8, -ROOM_LENGTH * 0.28]}>
        <boxGeometry args={[2.0, 0.22, 0.04]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.18}
          metalness={0.88}
        />
      </mesh>

      {/* Warm fairy light ambient */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.3, -ROOM_LENGTH * 0.45]}
        color="#ffeeaa"
        intensity={2.5}
        distance={8}
        decay={1.5}
      />
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.3, -ROOM_LENGTH * 0.72]}
        color="#ffeeaa"
        intensity={1.8}
        distance={6}
        decay={1.5}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FINALE ROOM — Grand Celebration Hall
// ═══════════════════════════════════════════════════════════════════════════

interface FinaleRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  bride?: string;
  groom?: string;
  date?: string;
}

function ArchedWindow({
  position,
  rotation,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh>
        <planeGeometry args={[0.72, 1.55]} />
        <meshStandardMaterial
          color="#c8e8ff"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Arch top */}
      <mesh position={[0, 0.775, 0]}>
        <circleGeometry args={[0.36, 16, 0, Math.PI]} />
        <meshStandardMaterial
          color="#c8e8ff"
          roughness={0.05}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.78, 1.6, 0.04]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.18}
          metalness={0.88}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0.3]}
        color="#c8e8ff"
        intensity={1.2}
        distance={4}
        decay={2}
      />
    </group>
  );
}

function GoldPillar({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const floorY = -ROOM_HEIGHT / 2;
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, ROOM_HEIGHT, 12]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.7} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.12, 0]}>
        <cylinderGeometry args={[0.26, 0.18, 0.24, 12]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.14}
          metalness={0.92}
        />
      </mesh>
      <mesh position={[0, -ROOM_HEIGHT / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.2, 12]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.14}
          metalness={0.92}
        />
      </mesh>
    </group>
  );
}

function CelebrationChandelier({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity =
        5.0 + Math.sin(clock.getElapsedTime() * 1.8) * 0.3;
    }
  });
  return (
    <group position={position} ref={groupRef}>
      {/* Main ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.045, 8, 32]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.12}
          metalness={0.96}
        />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.03, 8, 24]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.12}
          metalness={0.96}
        />
      </mesh>
      {/* Chain */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.1, 6]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Candles on outer ring */}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 0.8, -0.08, Math.sin(a) * 0.8]}
          >
            <mesh>
              <cylinderGeometry args={[0.022, 0.022, 0.2, 6]} />
              <meshStandardMaterial color="#f5f0e0" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <coneGeometry args={[0.02, 0.1, 6]} />
              <meshStandardMaterial
                color="#ffeeaa"
                emissive="#ffeeaa"
                emissiveIntensity={2.5}
              />
            </mesh>
          </group>
        );
      })}
      {/* Crystal drops */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = i % 2 === 0 ? 0.8 : 0.45;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * r,
              -0.22 - (i % 3) * 0.06,
              Math.sin(a) * r,
            ]}
          >
            <octahedronGeometry args={[0.04]} />
            <meshStandardMaterial
              color="#c8e8ff"
              roughness={0.05}
              metalness={0.2}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
      <pointLight
        ref={lightRef}
        color="#fff5e0"
        intensity={5.0}
        distance={14}
        decay={1.2}
      />
    </group>
  );
}

export function FinaleRoom({ theme, bride, groom, date }: FinaleRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  return (
    <group>
      {/* Grand chandelier */}
      <CelebrationChandelier
        position={[0, ROOM_HEIGHT / 2 - 0.35, -ROOM_LENGTH * 0.52]}
        accent={accent}
      />

      {/* Secondary chandelier */}
      <CelebrationChandelier
        position={[0, ROOM_HEIGHT / 2 - 0.35, -ROOM_LENGTH * 0.78]}
        accent={accent}
      />

      {/* Gold pillars — four corners */}
      {(
        [
          [-ROOM_WIDTH / 2 + 0.28, -ROOM_LENGTH * 0.28],
          [ROOM_WIDTH / 2 - 0.28, -ROOM_LENGTH * 0.28],
          [-ROOM_WIDTH / 2 + 0.28, -ROOM_LENGTH * 0.78],
          [ROOM_WIDTH / 2 - 0.28, -ROOM_LENGTH * 0.78],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <GoldPillar key={i} position={[x, 0, z]} accent={accent} />
      ))}

      {/* Arched windows — side walls */}
      <ArchedWindow
        position={[-ROOM_WIDTH / 2 + 0.05, 0.4, -ROOM_LENGTH * 0.38]}
        rotation={[0, Math.PI / 2, 0]}
        accent={accent}
      />
      <ArchedWindow
        position={[ROOM_WIDTH / 2 - 0.05, 0.4, -ROOM_LENGTH * 0.38]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={accent}
      />
      <ArchedWindow
        position={[-ROOM_WIDTH / 2 + 0.05, 0.4, -ROOM_LENGTH * 0.68]}
        rotation={[0, Math.PI / 2, 0]}
        accent={accent}
      />
      <ArchedWindow
        position={[ROOM_WIDTH / 2 - 0.05, 0.4, -ROOM_LENGTH * 0.68]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={accent}
      />

      {/* Confetti scattered on floor */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, Math.random() * Math.PI, 0]}
          position={[
            ((i % 10) - 5) * 0.7 + Math.sin(i * 1.3) * 0.3,
            floorY + 0.003,
            -ROOM_LENGTH * 0.25 - Math.floor(i / 10) * (ROOM_LENGTH * 0.16),
          ]}
        >
          <planeGeometry args={[0.08, 0.04]} />
          <meshStandardMaterial
            color={
              ["#ffcc00", "#ff4488", "#44aaff", "#44cc88", "#ff8800"][i % 5]
            }
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Marble floor inlay — herringbone centre runner */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY + 0.004, -ROOM_LENGTH * 0.52]}
      >
        <planeGeometry args={[ROOM_WIDTH * 0.55, ROOM_LENGTH * 0.75]} />
        <meshStandardMaterial
          color="#f0e8e0"
          roughness={0.08}
          metalness={0.05}
        />
      </mesh>

      {/* Decorative back wall arch */}
      <mesh position={[0, 0.5, -ROOM_LENGTH + 0.1]}>
        <boxGeometry args={[ROOM_WIDTH * 0.7, 0.1, 0.06]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.14}
          metalness={0.92}
        />
      </mesh>
      <mesh position={[0, -0.5, -ROOM_LENGTH + 0.1]}>
        <boxGeometry args={[ROOM_WIDTH * 0.7, 0.1, 0.06]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.14}
          metalness={0.92}
        />
      </mesh>

      {/* Ambient fill */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.5]}
        color="#fff8e8"
        intensity={1.5}
        distance={12}
        decay={1.2}
      />
    </group>
  );
}
