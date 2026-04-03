"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { createCountDownLoaction, formattedDate } from "@/lib/helper";
import { FALLBACK_LOCATION, VenueEvent } from "@/types/event";

interface CountdownRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  date?: string;
  location?: VenueEvent;
  eventLabel?: string;
}

// ── Time helpers ──────────────────────────────────────────────────────────────
function getTimeLeft(eventDate: Date) {
  const diff = eventDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ── Draw clock face onto a CanvasTexture ──────────────────────────────────────
function drawClockFace(
  ctx: CanvasRenderingContext2D,
  value: number,
  label: string,
  accent: string,
  dark: string,
  size: number,
) {
  ctx.clearRect(0, 0, size, size);

  // Background — deep stone
  const bg = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.5,
  );
  bg.addColorStop(0, "#1a1208");
  bg.addColorStop(1, "#0a0805");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring — gold
  ctx.strokeStyle = accent;
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - size * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring — darker
  ctx.strokeStyle = accent + "55";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - size * 0.07, 0, Math.PI * 2);
  ctx.stroke();

  // Roman numeral tick marks at 12 positions
  const romanNumerals = [
    "XII",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
  ];
  const tickR = size / 2 - size * 0.13;
  ctx.fillStyle = accent + "99";
  ctx.font = `bold ${size * 0.07}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const tx = size / 2 + Math.cos(angle) * tickR;
    const ty = size / 2 + Math.sin(angle) * tickR;
    ctx.fillText(romanNumerals[i], tx, ty);
  }

  // Minute tick marks
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r1 = size / 2 - size * 0.065;
    const r2 = size / 2 - size * 0.08;
    ctx.strokeStyle = accent + "44";
    ctx.lineWidth = size * 0.006;
    ctx.beginPath();
    ctx.moveTo(
      size / 2 + Math.cos(angle) * r1,
      size / 2 + Math.sin(angle) * r1,
    );
    ctx.lineTo(
      size / 2 + Math.cos(angle) * r2,
      size / 2 + Math.sin(angle) * r2,
    );
    ctx.stroke();
  }

  // Centre number — large
  ctx.fillStyle = accent;
  ctx.font = `bold ${size * 0.28}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.06;
  ctx.fillText(
    String(value).padStart(2, "0"),
    size / 2,
    size / 2 - size * 0.04,
  );
  ctx.shadowBlur = 0;

  // Label below number
  ctx.fillStyle = accent + "CC";
  ctx.font = `bold ${size * 0.1}px sans-serif`;
  ctx.letterSpacing = "0.3em";
  ctx.fillText(label.toUpperCase(), size / 2, size / 2 + size * 0.22);
  ctx.letterSpacing = "0";

  // Centre dot
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.025, 0, Math.PI * 2);
  ctx.fill();
}

// ── Draw calendar face (for DAYS) ─────────────────────────────────────────────
function drawCalendarFace(
  ctx: CanvasRenderingContext2D,
  days: number,
  accent: string,
  size: number,
) {
  ctx.clearRect(0, 0, size, size);

  const W = size;
  const H = size;
  const R = 12;

  // Background
  ctx.fillStyle = "#0e0b06";
  roundRect(ctx, 0, 0, W, H, R);
  ctx.fill();

  // Header band — deep red like a real calendar
  ctx.fillStyle = "#6b1a1a";
  roundRect(ctx, 0, 0, W, H * 0.28, R);
  ctx.fill();
  // Flatten bottom corners of header
  ctx.fillRect(0, H * 0.18, W, H * 0.1);

  // Header label
  ctx.fillStyle = "#F5F0E8";
  ctx.font = `bold ${H * 0.11}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.25em";
  ctx.fillText("DAYS TO GO", W / 2, H * 0.14);
  ctx.letterSpacing = "0";

  // Ring holes at top
  [-0.28, 0.28].forEach((offset) => {
    ctx.fillStyle = "#0e0b06";
    ctx.beginPath();
    ctx.arc(W / 2 + offset * W, -2, H * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Date number — very large
  ctx.fillStyle = accent;
  ctx.font = `bold ${H * 0.44}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = H * 0.05;
  ctx.fillText(String(days), W / 2, H * 0.6);
  ctx.shadowBlur = 0;

  // Bottom rule
  ctx.strokeStyle = accent + "40";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.1, H * 0.82);
  ctx.lineTo(W * 0.9, H * 0.82);
  ctx.stroke();

  // "DAYS" sub-label
  ctx.fillStyle = accent + "CC";
  ctx.font = `bold ${H * 0.1}px sans-serif`;
  ctx.letterSpacing = "0.4em";
  ctx.fillText("DAYS", W / 2, H * 0.91);
  ctx.letterSpacing = "0";

  // Outer border
  ctx.strokeStyle = accent + "60";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, R);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Live clock mesh ────────────────────────────────────────────────────────────
function LiveClock({
  position,
  rotation,
  getValue,
  label,
  frameW,
  frameH,
  accent,
  frameColor,
  drawFn,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  getValue: () => number;
  label: string;
  frameW: number;
  frameH: number;
  accent: string;
  frameColor: string;
  drawFn: (
    ctx: CanvasRenderingContext2D,
    value: number,
    label: string,
    accent: string,
    dark: string,
    size: number,
  ) => void;
}) {
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lastValueRef = useRef<number>(-1);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    texRef.current = tex;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, []);

  useFrame(() => {
    if (!texRef.current || !canvasRef.current) return;
    const value = getValue();
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    drawFn(ctx, value, label, accent, frameColor, 512);
    texRef.current.needsUpdate = true;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Ornate frame — outer */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[frameW + 0.18, frameH + 0.18, 0.08]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>
      {/* Frame inner bevel */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[frameW + 0.06, frameH + 0.06, 0.06]} />
        <meshStandardMaterial color="#2a1e0e" roughness={0.7} />
      </mesh>
      {/* Clock face plane */}
      <mesh ref={meshRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Frame corner rosettes */}
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as [number, number][]
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[sx * (frameW / 2 + 0.05), sy * (frameH / 2 + 0.05), -0.0]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.1, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Swinging pendulum (seconds clock only) ────────────────────────────────────
function Pendulum({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!pivotRef.current) return;
    pivotRef.current.rotation.z =
      Math.sin(clock.getElapsedTime() * Math.PI) * 0.18;
  });

  return (
    <group position={position}>
      {/* Pivot bracket */}
      <mesh>
        <boxGeometry args={[0.12, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Swinging arm */}
      <group ref={pivotRef}>
        {/* Rod */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        {/* Bob */}
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.06, 16]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Stone lancet window ───────────────────────────────────────────────────────
function LancetWindow({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      {/* Dark sky */}
      <mesh>
        <planeGeometry args={[0.7, 1.4]} />
        <meshStandardMaterial color="#050510" roughness={1} />
      </mesh>
      {/* Crescent moon */}
      <mesh position={[0.1, 0.35, 0.01]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial
          color="#ffe8b0"
          emissive="#ffe8b0"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[0.16, 0.38, 0.02]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#050510" roughness={1} />
      </mesh>
      {/* Star dots */}
      {[
        [-0.15, 0.4],
        [0.2, 0.1],
        [-0.1, -0.1],
        [0.1, 0.55],
        [-0.25, 0.2],
      ].map(([sx, sy], i) => (
        <mesh key={i} position={[sx, sy, 0.01]}>
          <circleGeometry args={[0.015, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      {/* Stone arch frame */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.35, 0.46, 16, 1, 0, Math.PI]} />
        <meshStandardMaterial
          color="#3a2e22"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Stone pillar left */}
      <mesh position={[-0.35, -0.35, 0.01]}>
        <boxGeometry args={[0.1, 0.7, 0.08]} />
        <meshStandardMaterial color="#3a2e22" roughness={0.9} />
      </mesh>
      {/* Stone pillar right */}
      <mesh position={[0.35, -0.35, 0.01]}>
        <boxGeometry args={[0.1, 0.7, 0.08]} />
        <meshStandardMaterial color="#3a2e22" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Floor compass rose ────────────────────────────────────────────────────────
function CompassRose({
  accent,
  date,
  location,
}: {
  accent: string;
  date: string;
  location: string;
}) {
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const cx = 256,
      cy = 256,
      r = 240;

    // Base circle
    ctx.fillStyle = "#0a0805";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Text around circumference
    const fullText = `${date}  ✦  ${location}  ✦  `;
    const chars = fullText.repeat(2).split("");
    const textR = r - 22;
    ctx.fillStyle = accent + "AA";
    ctx.font = "bold 16px sans-serif";
    chars.forEach((ch, i) => {
      const angle = (i / chars.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * textR, cy + Math.sin(angle) * textR);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // Compass points
    const points = [
      { label: "N", angle: -Math.PI / 2 },
      { label: "E", angle: 0 },
      { label: "S", angle: Math.PI / 2 },
      { label: "W", angle: Math.PI },
    ];
    points.forEach(({ label, angle }) => {
      const pr = r - 55;
      ctx.fillStyle = accent;
      ctx.font = "bold 22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx + Math.cos(angle) * pr, cy + Math.sin(angle) * pr);
    });

    // Eight-pointed star
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = accent + "30";
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.lineTo(18, -30);
      ctx.lineTo(0, 0);
      ctx.lineTo(-18, -30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Centre star fill
    ctx.fillStyle = accent + "60";
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -120);
      ctx.lineTo(14, -20);
      ctx.lineTo(0, 0);
      ctx.lineTo(-14, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Centre circle
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    texRef.current = tex;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, [accent, date, location]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH * 0.5]}
    >
      <circleGeometry args={[1.6, 64]} />
      <meshStandardMaterial roughness={0.4} metalness={0.2} />
    </mesh>
  );
}

// ── Wall sconce torch ─────────────────────────────────────────────────────────
function WallSconce({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    lightRef.current.intensity =
      1.8 +
      Math.sin(clock.getElapsedTime() * 7.3) * 0.3 +
      Math.sin(clock.getElapsedTime() * 13.1) * 0.15;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#3a3530" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0.05]}>
        <cylinderGeometry args={[0.06, 0.04, 0.1, 8]} />
        <meshStandardMaterial color="#3a3530" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0.05]}>
        <coneGeometry args={[0.05, 0.14, 8]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.9} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.28, 0.08]}
        color="#ff9933"
        intensity={1.8}
        distance={4}
        decay={2}
      />
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function CountdownRoom({
  featureMode,
  theme,
  date = "2026-07-12",
  location = FALLBACK_LOCATION,
  eventLabel = "Wedding",
}: CountdownRoomProps) {
  const [year, month, day] = date.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);

  const timeRef = useRef(getTimeLeft(eventDate));
  const accent = theme.accent;
  const frameColor = new THREE.Color(accent).multiplyScalar(0.6).getStyle();
  const wallZ = -ROOM_LENGTH + 0.12;
  const floorY = -ROOM_HEIGHT / 2;

  // Tick every second via setInterval so values stay fresh for canvas redraws
  useEffect(() => {
    const id = setInterval(() => {
      timeRef.current = getTimeLeft(eventDate);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locationStr = createCountDownLoaction(location);
  const dateStr = formattedDate(date);

  return (
    <group>
      {/* ── NORTH WALL: Calendar (Days) — back wall, largest ── */}
      <LiveClock
        position={[0, 0.4, wallZ]}
        rotation={[0, 0, 0]}
        getValue={() => timeRef.current.days}
        label="Days"
        frameW={2.0}
        frameH={2.0}
        accent={accent}
        frameColor={frameColor}
        drawFn={(ctx, val, lbl, acc, dk, sz) =>
          drawCalendarFace(ctx, val, acc, sz)
        }
      />

      {/* Stone tablet below days — date & location */}
      <group position={[0, floorY + 0.55, wallZ + 0.02]}>
        {/* Stone slab */}
        <mesh>
          <boxGeometry args={[2.8, 0.55, 0.08]} />
          <meshStandardMaterial color="#2a1e14" roughness={0.92} />
        </mesh>
        {/* Gold border */}
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[2.75, 0.5, 0.01]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.85}
            transparent
            opacity={0.3}
          />
        </mesh>
        {/* Engraved divider */}
        <mesh position={[0, 0.02, 0.05]}>
          <boxGeometry args={[2.4, 0.012, 0.01]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Text via Html-free approach — use a canvas plane */}
        <mesh position={[0, 0, 0.046]}>
          <planeGeometry args={[2.6, 0.44]} />
          <meshStandardMaterial color="#1a120a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── EAST WALL (right): Hours clock ── */}
      <LiveClock
        position={[ROOM_WIDTH / 2 - 0.12, 0.2, -ROOM_LENGTH * 0.58]}
        rotation={[0, -Math.PI / 2, 0]}
        getValue={() => timeRef.current.hours}
        label="Hours"
        frameW={1.5}
        frameH={1.5}
        accent={accent}
        frameColor={frameColor}
        drawFn={drawClockFace}
      />

      {/* ── WEST WALL (left): Minutes clock ── */}
      <LiveClock
        position={[-ROOM_WIDTH / 2 + 0.12, 0.2, -ROOM_LENGTH * 0.58]}
        rotation={[0, Math.PI / 2, 0]}
        getValue={() => timeRef.current.minutes}
        label="Minutes"
        frameW={1.5}
        frameH={1.5}
        accent={accent}
        frameColor={frameColor}
        drawFn={drawClockFace}
      />

      {/* ── Seconds clock — on back wall beside Days, smaller ── */}
      <LiveClock
        position={[2.6, -0.6, wallZ]}
        rotation={[0, 0, 0]}
        getValue={() => timeRef.current.seconds}
        label="Seconds"
        frameW={1.1}
        frameH={1.1}
        accent={accent}
        frameColor={frameColor}
        drawFn={drawClockFace}
      />

      {/* Seconds pendulum */}
      <Pendulum position={[2.6, -1.35, wallZ + 0.06]} accent={accent} />

      {/* ── Lancet windows — side walls ── */}
      <LancetWindow
        position={[-ROOM_WIDTH / 2 + 0.06, 0.8, -ROOM_LENGTH * 0.35]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[ROOM_WIDTH / 2 - 0.06, 0.8, -ROOM_LENGTH * 0.35]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[-ROOM_WIDTH / 2 + 0.06, 0.8, -ROOM_LENGTH * 0.7]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[ROOM_WIDTH / 2 - 0.06, 0.8, -ROOM_LENGTH * 0.7]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* ── Floor compass rose ── */}
      <CompassRose accent={accent} date={dateStr} location={locationStr} />

      {/* ── Gold inlay border on compass rose ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY + 0.008, -ROOM_LENGTH * 0.5]}
      >
        <ringGeometry args={[1.6, 1.65, 64]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ── Wall torches — atmospheric lighting ── */}
      <WallSconce
        position={[-ROOM_WIDTH / 2 + 0.1, 0.6, -ROOM_LENGTH * 0.25]}
      />
      <WallSconce position={[ROOM_WIDTH / 2 - 0.1, 0.6, -ROOM_LENGTH * 0.25]} />
      <WallSconce position={[-ROOM_WIDTH / 2 + 0.1, 0.6, -ROOM_LENGTH * 0.8]} />
      <WallSconce position={[ROOM_WIDTH / 2 - 0.1, 0.6, -ROOM_LENGTH * 0.8]} />

      {/* ── Ceiling boss — ornate centre ── */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.05, -ROOM_LENGTH * 0.5]}>
        <cylinderGeometry args={[0.4, 0.4, 0.06, 16]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.55,
              ROOM_HEIGHT / 2 - 0.05,
              -ROOM_LENGTH * 0.5 + Math.sin(a) * 0.55,
            ]}
          >
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.15}
              metalness={0.95}
            />
          </mesh>
        );
      })}

      {/* ── Clock tower pillar columns — corners ── */}
      {(
        [
          [-ROOM_WIDTH / 2 + 0.3, -ROOM_LENGTH * 0.3],
          [ROOM_WIDTH / 2 - 0.3, -ROOM_LENGTH * 0.3],
          [-ROOM_WIDTH / 2 + 0.3, -ROOM_LENGTH * 0.75],
          [ROOM_WIDTH / 2 - 0.3, -ROOM_LENGTH * 0.75],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Column shaft */}
          <mesh>
            <cylinderGeometry args={[0.12, 0.14, ROOM_HEIGHT, 10]} />
            <meshStandardMaterial color="#2a1e14" roughness={0.85} />
          </mesh>
          {/* Capital */}
          <mesh position={[0, ROOM_HEIGHT / 2 - 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.13, 0.2, 10]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.8} />
          </mesh>
          {/* Base */}
          <mesh position={[0, -ROOM_HEIGHT / 2 + 0.08, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.16, 10]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
