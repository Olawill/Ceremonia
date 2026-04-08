"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { useRoomsStore } from "@/components/rooms-r3f/store";

interface TimelineEvent {
  year: string;
  icon: string;
  title: string;
  desc: string;
}

interface GalleryRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  events?: TimelineEvent[];
  sectionLabel?: string;
}

const DEMO_EVENTS: TimelineEvent[] = [
  {
    year: "2019",
    icon: "✦",
    title: "How We Met",
    desc: "A chance encounter at a gallery opening changed everything. Two strangers, one conversation, infinite futures.",
  },
  {
    year: "2022",
    icon: "◆",
    title: "First Trip",
    desc: "Three weeks in Japan — cherry blossoms, temples at dawn, and the moment we knew this was forever.",
  },
  {
    year: "2023",
    icon: "♡",
    title: "Moving In",
    desc: "Two apartments became one home. A shared bookshelf, a shared bed, a shared life beginning.",
  },
  {
    year: "2024",
    icon: "❧",
    title: "The Proposal",
    desc: "Under the stars in Santorini, on bended knee with trembling hands and an overflowing heart.",
  },
  {
    year: "2026",
    icon: "✶",
    title: "Forever Begins",
    desc: "Join us as we begin the greatest adventure of our lives, surrounded by everyone we love.",
  },
];

const CARD_W = 0.88;
const CARD_H = 1.15;

// ── Build a canvas texture synchronously — no async, no useEffect ─────────────
function buildTexture(
  event: TimelineEvent,
  accent: string,
  isActive: boolean,
): THREE.CanvasTexture {
  const W = 512,
    H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Cream background
  ctx.fillStyle = "#F5EFE4";
  ctx.fillRect(0, 0, W, H);

  // Photo area
  const pm = 28,
    ph = 340;
  ctx.fillStyle = "#14100a";
  ctx.fillRect(pm, pm, W - pm * 2, ph);

  // Red glow
  const rg = ctx.createRadialGradient(
    W / 2,
    pm + ph * 0.5,
    10,
    W / 2,
    pm + ph * 0.5,
    ph * 0.65,
  );
  rg.addColorStop(0, "rgba(80,12,5,0.55)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(pm, pm, W - pm * 2, ph);

  // Year
  ctx.fillStyle = accent;
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(event.year, pm + 14, pm + 10);

  // Icon
  ctx.font = "90px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 32;
  ctx.fillStyle = accent;
  ctx.fillText(event.icon, W / 2, pm + ph * 0.52);
  ctx.shadowBlur = 0;

  // Title
  const cy = pm + ph + 18;
  ctx.font = "bold 46px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#180e04";
  ctx.fillText(event.title, W / 2, cy);

  // Divider
  ctx.strokeStyle = accent + "70";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.22, cy + 58);
  ctx.lineTo(W * 0.78, cy + 58);
  ctx.stroke();

  // Description word-wrap
  ctx.font = "italic 24px serif";
  ctx.fillStyle = "#3a2818";
  const maxW = W - pm * 2;
  let line = "";
  let ly = cy + 68;
  for (const word of event.desc.split(" ")) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, W / 2, ly);
      line = word;
      ly += 30;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, W / 2, ly);

  // Active border
  if (isActive) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
  }

  return new THREE.CanvasTexture(canvas);
}

// ── Spread N items evenly across room width ───────────────────────────────────
function spreadX(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [0];
  const usable = ROOM_WIDTH - 2.8;
  return Array.from(
    { length: count },
    (_, i) => -usable / 2 + (usable / (count - 1)) * i,
  );
}

// ── Single polaroid card ──────────────────────────────────────────────────────
function PolaroidCard({
  event,
  x,
  lineY,
  lineZ,
  baseRot,
  isActive,
  accent,
  onClick,
}: {
  event: TimelineEvent;
  x: number;
  lineY: number;
  lineZ: number;
  baseRot: number;
  isActive: boolean;
  accent: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const swayPhase = useRef(Math.random() * Math.PI * 2);

  const [hovered, setHovered] = useState(false);

  // Build texture synchronously with useMemo — recreates only when isActive changes
  const texture = useMemo(
    () => buildTexture(event, accent, isActive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.year, event.title, accent, isActive],
  );

  const cardY = lineY - CARD_H / 2 - 0.25;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.z =
      baseRot + Math.sin(t * 0.55 + swayPhase.current) * 0.035;
    meshRef.current.position.y =
      cardY + Math.sin(t * 0.38 + swayPhase.current) * 0.007;
  });

  return (
    <group position={[x, 0, lineZ]}>
      {/* Bulldog clip */}
      <mesh position={[0, lineY - 0.01, 0.01]}>
        <boxGeometry args={[0.09, 0.05, 0.032]} />
        <meshStandardMaterial color="#aaa" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Card — texture applied directly via map prop, no useEffect needed */}
      <mesh
        ref={meshRef}
        position={[0, cardY, 0]}
        rotation={[0, 0, baseRot]}
        scale={hovered ? [1.06, 1.06, 1] : [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={texture} roughness={0.75} />
      </mesh>

      {/* Card back */}
      <mesh
        position={[0, cardY, -0.004]}
        rotation={[0, Math.PI, baseRot]}
        scale={hovered ? [1.06, 1.06, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial color="#EDE5D5" roughness={0.9} />
      </mesh>

      {isActive && (
        <pointLight
          position={[0, cardY, 0.4]}
          color={accent}
          intensity={1.2}
          distance={2}
          decay={2}
        />
      )}
    </group>
  );
}

// ── Washing line wire ─────────────────────────────────────────────────────────
function WashingLine({ y, z }: { y: number; z: number }) {
  return (
    <group>
      <mesh position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, ROOM_WIDTH - 0.55, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-ROOM_WIDTH / 2 + 0.3, y, z]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[ROOM_WIDTH / 2 - 0.3, y, z]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Lightbox back wall — no text ──────────────────────────────────────────────
function LightboxWall({ accent }: { accent: string }) {
  const wallZ = -ROOM_LENGTH + 0.1;
  return (
    <group position={[0, 0.1, wallZ]}>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry
          args={[ROOM_WIDTH * 0.74 + 0.14, ROOM_HEIGHT * 0.58 + 0.14, 0.07]}
        />
        <meshStandardMaterial
          color="#1e1610"
          roughness={0.65}
          metalness={0.35}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[ROOM_WIDTH * 0.74, ROOM_HEIGHT * 0.58]} />
        <meshStandardMaterial
          color="#d5e8f0"
          emissive="#b5d8ea"
          emissiveIntensity={0.65}
          roughness={0.95}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0.2]}
        color="#c5dff0"
        intensity={3.0}
        distance={9}
        decay={2}
      />
    </group>
  );
}

// ── Edison ceiling ────────────────────────────────────────────────────────────
function CeilingRig() {
  const ceilY = ROOM_HEIGHT / 2 - 0.06;
  const pipes = [-ROOM_LENGTH * 0.26, -ROOM_LENGTH * 0.54];
  const bxs = [-2.6, -0.85, 0.9, 2.6];
  return (
    <group>
      {pipes.map((pz, pi) => (
        <group key={pi}>
          <mesh position={[0, ceilY, pz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, ROOM_WIDTH - 0.55, 8]} />
            <meshStandardMaterial
              color="#2a2a2a"
              metalness={0.9}
              roughness={0.38}
            />
          </mesh>
          {bxs.map((bx, bi) => (
            <group key={bi} position={[bx, ceilY - 0.29, pz]}>
              <mesh position={[0, 0.145, 0]}>
                <cylinderGeometry args={[0.007, 0.007, 0.29, 4]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.07, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial
                  color="#ffe090"
                  emissive="#ffcc33"
                  emissiveIntensity={1.9}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight
                position={[0, -0.07, 0]}
                color="#ffcc44"
                intensity={0.7}
                distance={4}
                decay={2}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Red safelight sconce ──────────────────────────────────────────────────────
function SafeLight({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.intensity =
      1.0 + Math.sin(clock.getElapsedTime() * 3.9 + position[0]) * 0.08;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial color="#120808" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0.05]}>
        <sphereGeometry args={[0.058, 10, 10]} />
        <meshStandardMaterial
          color="#bb1800"
          emissive="#cc2000"
          emissiveIntensity={1.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        ref={ref}
        position={[0, 0.1, 0.07]}
        color="#cc2200"
        intensity={1.0}
        distance={3}
        decay={2}
      />
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function TimelineRoom({
  featureMode,
  theme,
  events,
  sectionLabel: _sectionLabel,
}: GalleryRoomProps) {
  const displayEvents = (events?.length ? events : DEMO_EVENTS).slice(0, 8);
  const accent = theme.accent;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  const floorY = -ROOM_HEIGHT / 2;

  const LINE_Y = ROOM_HEIGHT / 2 - 0.62;
  const LINE_Z_FRONT = -ROOM_LENGTH * 0.52;
  const LINE_Z_BACK = -ROOM_LENGTH * 0.72;

  const half = Math.ceil(displayEvents.length / 2);
  const frontEvents = displayEvents.slice(0, half);
  const backEvents = displayEvents.slice(half);

  const frontXs = spreadX(frontEvents.length);
  const backXs = spreadX(backEvents.length);

  const baseRots = [-0.065, 0.052, -0.042, 0.068, -0.035, 0.058, -0.048, 0.04];

  const handleCardClick = useCallback(
    (idx: number, cardX: number, lineZ: number) => {
      // Zoom toward the card
      setZoomedIndex(idx);
      const store = useRoomsStore.getState();
      const depthFraction = Math.abs(lineZ) / ROOM_LENGTH;
      const zoomAmt = 1.2 + depthFraction * 2.2;
      store.setZoomOffset(zoomAmt);
      const peekAmt = Math.max(-3, Math.min(3, cardX * 0.55));
      store.setPeek(peekAmt);

      store.setOpenCard(displayEvents[idx]); // signal outside Canvas
    },
    [displayEvents],
  );

  // Reset zoom when leaving room
  useEffect(() => {
    return () => {
      useRoomsStore.getState().setZoomOffset(0);
      useRoomsStore.getState().setPeek(0);
    };
  }, []);

  useEffect(() => {
    if (document.getElementById("gallery-room-styles")) return;
    const style = document.createElement("style");
    style.id = "gallery-room-styles";
    style.textContent = `@keyframes gfadeIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }`;
    document.head.appendChild(style);
    return () => {
      document.getElementById("gallery-room-styles")?.remove();
    };
  }, []);

  return (
    <group>
      <LightboxWall accent={accent} />
      <CeilingRig />

      <SafeLight position={[-ROOM_WIDTH / 2 + 0.1, 0.8, -ROOM_LENGTH * 0.22]} />
      <SafeLight position={[ROOM_WIDTH / 2 - 0.1, 0.8, -ROOM_LENGTH * 0.22]} />
      <SafeLight position={[-ROOM_WIDTH / 2 + 0.1, 0.8, -ROOM_LENGTH * 0.65]} />
      <SafeLight position={[ROOM_WIDTH / 2 - 0.1, 0.8, -ROOM_LENGTH * 0.65]} />

      <WashingLine y={LINE_Y} z={LINE_Z_FRONT} />
      {backEvents.length > 0 && <WashingLine y={LINE_Y} z={LINE_Z_BACK} />}

      {frontEvents.map((event, i) => (
        <PolaroidCard
          key={`f${i}`}
          event={event}
          x={frontXs[i]}
          lineY={LINE_Y}
          lineZ={LINE_Z_FRONT}
          baseRot={baseRots[i % baseRots.length]}
          isActive={activeIndex === i || zoomedIndex === i}
          accent={accent}
          onClick={() => handleCardClick(i, frontXs[i], LINE_Z_FRONT)}
        />
      ))}

      {backEvents.map((event, i) => {
        const gIdx = half + i;
        return (
          <PolaroidCard
            key={`b${i}`}
            event={event}
            x={backXs[i]}
            lineY={LINE_Y}
            lineZ={LINE_Z_BACK}
            baseRot={baseRots[(i + 4) % baseRots.length]}
            isActive={activeIndex === gIdx || zoomedIndex === gIdx}
            accent={accent}
            onClick={() => handleCardClick(gIdx, backXs[i], LINE_Z_BACK)}
          />
        );
      })}

      {/* Dark wood floor */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            (i - 4) * (ROOM_WIDTH / 9),
            floorY + 0.002,
            -ROOM_LENGTH / 2,
          ]}
        >
          <planeGeometry args={[ROOM_WIDTH / 9 - 0.018, ROOM_LENGTH]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#161008" : "#1e1408"}
            roughness={0.5}
            metalness={0.06}
          />
        </mesh>
      ))}

      {([-2.5, 0, 2.5] as number[]).map((x, i) => (
        <pointLight
          key={i}
          position={[x, ROOM_HEIGHT / 2 - 0.15, -ROOM_LENGTH * 0.45]}
          color="#ffcc55"
          intensity={2.0}
          distance={6}
          decay={2}
        />
      ))}

      {([-2.5, 0, 2.5] as number[]).map((x, i) => (
        <group key={i} position={[x, floorY + 0.042, -ROOM_LENGTH * 0.84]}>
          <mesh>
            <boxGeometry args={[0.56, 0.058, 0.4]} />
            <meshStandardMaterial
              color="#181210"
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.5, 0.01, 0.35]} />
            <meshStandardMaterial
              color={i === 1 ? "#6b2800" : "#12121e"}
              roughness={0.06}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
        </group>
      ))}

      {[
        { x: 1.5, z: -ROOM_LENGTH * 0.77, r: 0.3 },
        { x: -1.7, z: -ROOM_LENGTH * 0.8, r: -0.18 },
      ].map((s, i) => (
        <mesh
          key={i}
          position={[s.x, floorY + 0.009, s.z]}
          rotation={[-Math.PI / 2, 0, s.r]}
        >
          <planeGeometry args={[0.4, 0.28]} />
          <meshStandardMaterial color="#E2D9C8" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}
