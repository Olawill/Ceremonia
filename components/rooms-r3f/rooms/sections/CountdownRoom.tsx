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

function drawHand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, length * 0.15);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.restore();
}

// ── Draw clock face onto a CanvasTexture ──────────────────────────────────────
function drawClockFace(
  ctx: CanvasRenderingContext2D,
  value: number,
  accent: string,
  size: number,
  type: "hours" | "minutes" | "seconds",
) {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  bg.addColorStop(0, "#1e1608");
  bg.addColorStop(1, "#0a0805");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(cx, cy, r - size * 0.015, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accent + "40";
  ctx.lineWidth = size * 0.01;
  ctx.beginPath();
  ctx.arc(cx, cy, r - size * 0.07, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const outer = r - size * 0.075;
    const inner = r - size * 0.135;
    ctx.strokeStyle = accent + "CC";
    ctx.lineWidth = size * 0.018;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.lineTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.stroke();
  }

  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const outer = r - size * 0.075;
    const inner = r - size * 0.105;
    ctx.strokeStyle = accent + "50";
    ctx.lineWidth = size * 0.008;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.lineTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.stroke();
  }

  const cardinals = [
    { num: "XII", pos: 0 },
    { num: "III", pos: 3 },
    { num: "VI", pos: 6 },
    { num: "IX", pos: 9 },
  ];
  ctx.fillStyle = accent + "DD";
  ctx.font = "bold " + size * 0.09 + "px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  cardinals.forEach(({ num, pos }) => {
    const angle = (pos / 12) * Math.PI * 2 - Math.PI / 2;
    const tr = r - size * 0.21;
    ctx.fillText(num, cx + Math.cos(angle) * tr, cy + Math.sin(angle) * tr);
  });

  const handR = r - size * 0.14;
  const now = new Date();

  if (type === "hours") {
    // const h12 = value % 12;
    // const hourAngle =
    //   ((h12 + now.getMinutes() / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    // drawHand(ctx, cx, cy, hourAngle, handR * 0.55, size * 0.032, accent);
    // const minAngle = (now.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
    // drawHand(ctx, cx, cy, minAngle, handR * 0.78, size * 0.02, accent + "BB");

    // Countdown hours hand — points at value on 12-hour face, no real-clock mixing
    const h12 = value % 12;
    const hourAngle = (h12 / 12) * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, hourAngle, handR * 0.55, size * 0.032, accent);
  } else if (type === "minutes") {
    // const minAngle = (value / 60) * Math.PI * 2 - Math.PI / 2;
    // drawHand(ctx, cx, cy, minAngle, handR * 0.78, size * 0.024, accent);
    // const secAngle = (now.getSeconds() / 60) * Math.PI * 2 - Math.PI / 2;
    // drawHand(ctx, cx, cy, secAngle, handR * 0.85, size * 0.011, "#ff4444");

    // Countdown minutes — value is 0-59, hand sweeps proportionally
    const minAngle = (value / 60) * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, minAngle, handR * 0.78, size * 0.024, accent);
  } else {
    // const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    // const secAngle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
    // drawHand(ctx, cx, cy, secAngle, handR * 0.86, size * 0.013, "#ff4444");
    // drawHand(ctx, cx, cy, secAngle, handR * 0.22, size * 0.026, accent);

    // Seconds — use real elapsed time for smooth sweep
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const secAngle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, secAngle, handR * 0.86, size * 0.013, "#ff4444");
    drawHand(ctx, cx, cy, secAngle, handR * 0.22, size * 0.026, accent);
  }

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.032, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0805";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.016, 0, Math.PI * 2);
  ctx.fill();

  // ctx.fillStyle = accent + "BB";
  // ctx.font = "bold " + size * 0.09 + "px sans-serif";
  // ctx.textAlign = "center";
  // ctx.textBaseline = "middle";
  // ctx.fillText(label.toUpperCase(), cx, cy + r * 0.64);
}

// ── Draw calendar face (for DAYS) ─────────────────────────────────────────────
function drawCalendarFace(
  ctx: CanvasRenderingContext2D,
  days: number,
  accent: string,
  size: number,
  label: string = "Days",
) {
  ctx.clearRect(0, 0, size, size);
  const W = size;
  const H = size;
  const R = 16;

  ctx.fillStyle = "#0e0b06";
  roundRect(ctx, 0, 0, W, H, R);
  ctx.fill();

  ctx.fillStyle = "#7a1a1a";
  roundRect(ctx, 0, 0, W, H * 0.3, R);
  ctx.fill();
  ctx.fillRect(0, H * 0.2, W, H * 0.1);

  [-0.25, 0.25].forEach((o) => {
    ctx.fillStyle = "#0e0b06";
    ctx.beginPath();
    ctx.arc(W / 2 + o * W, 4, H * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  ctx.fillStyle = "#F5F0E8";
  ctx.font = "bold " + H * 0.11 + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${label.toUpperCase()} TO GO`, W / 2, H * 0.15);

  ctx.strokeStyle = accent + "25";
  ctx.lineWidth = 1;
  [0.45, 0.72].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * y);
    ctx.lineTo(W * 0.92, H * y);
    ctx.stroke();
  });

  ctx.fillStyle = accent;
  ctx.font = "bold " + H * 0.46 + "px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = H * 0.06;
  ctx.fillText(String(days), W / 2, H * 0.57);
  ctx.shadowBlur = 0;

  ctx.fillStyle = accent + "CC";
  ctx.font = "bold " + H * 0.1 + "px sans-serif";
  ctx.fillText(label.toUpperCase(), W / 2, H * 0.88);

  ctx.strokeStyle = accent + "70";
  ctx.lineWidth = 3;
  roundRect(ctx, 2, 2, W - 4, H - 4, R);
  ctx.stroke();
}

function drawCountdownFace(
  ctx: CanvasRenderingContext2D,
  value: number,
  label: string,
  accent: string,
  size: number,
) {
  ctx.clearRect(0, 0, size, size);
  const W = size;
  const H = size;

  // Dark background
  ctx.fillStyle = "#0a0805";
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#1e1608");
  bg.addColorStop(1, "#0a0805");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold outer border
  ctx.strokeStyle = accent;
  ctx.lineWidth = size * 0.025;
  ctx.strokeRect(size * 0.03, size * 0.03, size * 0.94, size * 0.94);

  // Inner border
  ctx.strokeStyle = accent + "40";
  ctx.lineWidth = size * 0.01;
  ctx.strokeRect(size * 0.07, size * 0.07, size * 0.86, size * 0.86);

  // Horizontal divider line through centre (flip-clock look)
  ctx.strokeStyle = accent + "30";
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.5);
  ctx.lineTo(size * 0.9, size * 0.5);
  ctx.stroke();

  // Large number
  ctx.fillStyle = accent;
  ctx.font = `bold ${size * 0.42}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.05;
  ctx.fillText(String(value).padStart(2, "0"), W / 2, H * 0.45);
  ctx.shadowBlur = 0;

  // Label at bottom
  ctx.fillStyle = accent + "CC";
  ctx.font = `bold ${size * 0.1}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), W / 2, H * 0.8);

  // Corner ornaments
  const cornersSize = size * 0.06;
  [
    [0.08, 0.08],
    [0.92, 0.08],
    [0.08, 0.92],
    [0.92, 0.92],
  ].forEach(([cx, cy]) => {
    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.arc(cx * W, cy * H, cornersSize, 0, Math.PI * 2);
    ctx.stroke();
  });
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
function LiveClockMesh({
  position,
  rotation,
  getValue,
  label,
  frameW,
  frameH,
  accent,
  frameColor,
  clockType,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  getValue: () => number;
  label: string;
  frameW: number;
  frameH: number;
  accent: string;
  frameColor: string;
  clockType: "days" | "hours" | "minutes" | "seconds";
}) {
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lastDrawnRef = useRef<number>(-999);

  const labelTexRef = useRef<THREE.CanvasTexture | null>(null);
  const labelMeshRef = useRef<THREE.Mesh>(null);
  const valueTexRef = useRef<THREE.CanvasTexture | null>(null);
  const valueMeshRef = useRef<THREE.Mesh>(null);

  const redraw = (canvas: HTMLCanvasElement, tex: THREE.CanvasTexture) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const val = getValue();
    if (clockType === "days") {
      drawCalendarFace(ctx, val, accent, 512, label);
    } else if (clockType === "hours" || clockType === "minutes") {
      drawCountdownFace(ctx, val, label, accent, 512);
    } else {
      drawClockFace(ctx, val, accent, 512, clockType);
    }
    tex.needsUpdate = true;
  };

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
    redraw(canvas, tex);
    return () => tex.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (clockType === "days") return;

    const canvas = canvasRef.current;
    const tex = texRef.current;
    if (!canvas || !tex) return;
    if (
      meshRef.current &&
      !(meshRef.current.material as THREE.MeshStandardMaterial).map
    ) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
      redraw(canvas, tex);
    }

    // Apply label texture when mesh mounts
    if (
      labelMeshRef.current &&
      labelTexRef.current &&
      !(labelMeshRef.current.material as THREE.MeshBasicMaterial).map
    ) {
      (labelMeshRef.current.material as THREE.MeshBasicMaterial).map =
        labelTexRef.current;
      (labelMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate =
        true;
    }
    // Apply value texture when mesh mounts
    if (
      valueMeshRef.current &&
      valueTexRef.current &&
      !(valueMeshRef.current.material as THREE.MeshBasicMaterial).map
    ) {
      (valueMeshRef.current.material as THREE.MeshBasicMaterial).map =
        valueTexRef.current;
      (valueMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate =
        true;
    }

    if (clockType === "seconds") {
      redraw(canvas, tex);
    } else {
      const val = getValue();
      if (val !== lastDrawnRef.current) {
        lastDrawnRef.current = val;
        redraw(canvas, tex);
      }
    }
  });

  useEffect(() => {
    if (clockType === "days") return;

    // ── Label plate (bottom) ──
    const lc = document.createElement("canvas");
    lc.width = 512;
    lc.height = 128;
    const lctx = lc.getContext("2d")!;
    // lctx.fillStyle = frameColor;
    lctx.fillStyle = "#F5F0E8";
    lctx.fillRect(0, 0, 512, 128);
    // lctx.fillStyle = accent + "EE";
    lctx.fillStyle = "#1a0e04";
    lctx.font = "bold 72px sans-serif";
    lctx.textAlign = "center";
    lctx.textBaseline = "middle";
    lctx.fillText(label.toUpperCase(), 256, 64);
    const ltex = new THREE.CanvasTexture(lc);
    labelTexRef.current = ltex;
    if (labelMeshRef.current) {
      (labelMeshRef.current.material as THREE.MeshStandardMaterial).map = ltex;
      (
        labelMeshRef.current.material as THREE.MeshStandardMaterial
      ).needsUpdate = true;
    }

    // ── Value plate (top) — redrawn each second ──
    const vc = document.createElement("canvas");
    vc.width = 512;
    vc.height = 128;
    const vctx = vc.getContext("2d")!;
    const drawValue = () => {
      vctx.fillStyle = "#F5F0E8";
      vctx.fillRect(0, 0, 512, 128);
      vctx.fillStyle = "#1a0e04";
      vctx.font = "bold 88px serif";
      vctx.textAlign = "center";
      vctx.textBaseline = "middle";
      // vctx.shadowColor = "#ffffff";
      // vctx.shadowBlur = 8;
      vctx.fillText(String(getValue()), 256, 64);
      // vctx.shadowBlur = 0;
      if (valueTexRef.current) valueTexRef.current.needsUpdate = true;
    };
    const vtex = new THREE.CanvasTexture(vc);
    valueTexRef.current = vtex;
    if (valueMeshRef.current) {
      (valueMeshRef.current.material as THREE.MeshStandardMaterial).map = vtex;
      (
        valueMeshRef.current.material as THREE.MeshStandardMaterial
      ).needsUpdate = true;
    }
    drawValue();

    // Update value plate every second
    const id = setInterval(drawValue, 1000);

    return () => {
      clearInterval(id);
      ltex.dispose();
      vtex.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.046]}>
        <boxGeometry args={[frameW + 0.22, frameH + 0.22, 0.09]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.28}
          metalness={0.88}
        />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[frameW + 0.08, frameH + 0.08, 0.06]} />
        <meshStandardMaterial color="#1a1008" roughness={0.8} />
      </mesh>
      <mesh ref={meshRef} position={[0, 0, 0.022]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial roughness={0.55} metalness={0.0} />
      </mesh>
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
          position={[
            sx * (frameW / 2 + 0.065),
            sy * (frameH / 2 + 0.065),
            -0.01,
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.14}
            metalness={0.96}
          />
        </mesh>
      ))}

      {clockType === "seconds" && (
        <>
          {/* Label plate — bottom of frame */}
          <mesh position={[0, -(frameH / 2 + 0.14), -0.01]}>
            <boxGeometry args={[frameW + 0.1, 0.3, 0.05]} />
            <meshStandardMaterial
              color={frameColor}
              roughness={0.3}
              metalness={0.85}
            />
          </mesh>
          <mesh ref={labelMeshRef} position={[0, -(frameH / 2 + 0.165), 0.028]}>
            <planeGeometry args={[frameW + 0.05, 0.26]} />
            <meshStandardMaterial roughness={0.5} />
          </mesh>

          {/* Value plate — top of frame */}
          <mesh position={[0, frameH / 2 + 0.14, -0.01]}>
            <boxGeometry args={[frameW + 0.1, 0.3, 0.05]} />
            <meshStandardMaterial
              color={frameColor}
              roughness={0.3}
              metalness={0.85}
            />
          </mesh>
          <mesh ref={valueMeshRef} position={[0, frameH / 2 + 0.165, 0.028]}>
            <planeGeometry args={[frameW + 0.05, 0.26]} />
            <meshStandardMaterial roughness={0.5} />
          </mesh>
        </>
      )}
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
      Math.sin(clock.getElapsedTime() * Math.PI) * 0.2;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.14, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      <group ref={pivotRef}>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.84, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[0, -0.88, 0]}>
          <cylinderGeometry args={[0.1, 0.085, 0.065, 16]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.1}
            metalness={0.96}
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
      <mesh>
        <planeGeometry args={[0.7, 1.4]} />
        <meshStandardMaterial color="#050510" roughness={1} />
      </mesh>
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
      {[
        [-0.15, 0.4],
        [0.2, 0.1],
        [-0.1, -0.12],
        [0.09, 0.55],
        [-0.24, 0.22],
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
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.35, 0.46, 16, 1, 0, Math.PI]} />
        <meshStandardMaterial
          color="#3a2e22"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-0.35, -0.35, 0.01]}>
        <boxGeometry args={[0.1, 0.7, 0.08]} />
        <meshStandardMaterial color="#3a2e22" roughness={0.9} />
      </mesh>
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
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const cx = 256,
      cy = 256,
      r = 240;

    ctx.fillStyle = "#0a0805";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = accent + "80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.stroke();

    const fullText = date + "  ✦  " + location + "  ✦  ";
    const chars = fullText.repeat(2).split("");
    const textR = r - 22;
    ctx.fillStyle = accent + "AA";
    ctx.font = "bold 15px sans-serif";
    chars.forEach((ch, i) => {
      const angle = (i / chars.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * textR, cy + Math.sin(angle) * textR);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    [
      { l: "N", a: -Math.PI / 2 },
      { l: "E", a: 0 },
      { l: "S", a: Math.PI / 2 },
      { l: "W", a: Math.PI },
    ].forEach(({ l, a }) => {
      ctx.fillStyle = accent;
      ctx.font = "bold 22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(l, cx + Math.cos(a) * (r - 55), cy + Math.sin(a) * (r - 55));
    });

    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.fillStyle = accent + "28";
      ctx.beginPath();
      ctx.moveTo(0, -178);
      ctx.lineTo(18, -30);
      ctx.lineTo(0, 0);
      ctx.lineTo(-18, -30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      ctx.fillStyle = accent + "55";
      ctx.beginPath();
      ctx.moveTo(0, -118);
      ctx.lineTo(13, -20);
      ctx.lineTo(0, 0);
      ctx.lineTo(-13, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
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
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color="#3a3530" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0.06]}>
        <cylinderGeometry args={[0.06, 0.04, 0.1, 8]} />
        <meshStandardMaterial color="#3a3530" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.3, 0.06]}>
        <coneGeometry args={[0.055, 0.15, 8]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.9} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0.09]}
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
  const frameColor = new THREE.Color(accent).multiplyScalar(0.55).getStyle();
  const wallZ = -ROOM_LENGTH + 0.14;
  const floorY = -ROOM_HEIGHT / 2;
  const midZ = -ROOM_LENGTH * 0.55;

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
      <LiveClockMesh
        position={[-2.1, 0.3, wallZ]}
        rotation={[0, 0, 0]}
        getValue={() => timeRef.current.days}
        label="Days"
        frameW={2.1}
        frameH={2.1}
        accent={accent}
        frameColor={frameColor}
        clockType="days"
      />

      <LiveClockMesh
        position={[2.1, 0.2, wallZ]}
        rotation={[0, 0, 0]}
        getValue={() => timeRef.current.seconds}
        label="Seconds"
        frameW={1.3}
        frameH={1.3}
        accent={accent}
        frameColor={frameColor}
        clockType="seconds"
      />
      <Pendulum position={[2.1, -0.65, wallZ + 0.06]} accent={accent} />

      <LiveClockMesh
        position={[ROOM_WIDTH / 2 - 0.12, 0.3, midZ - 0.6]}
        rotation={[0, -Math.PI / 2, 0]}
        getValue={() => timeRef.current.minutes}
        label="Minutes"
        frameW={1.6}
        frameH={1.6}
        accent={accent}
        frameColor={frameColor}
        clockType="minutes"
      />

      <LiveClockMesh
        position={[-ROOM_WIDTH / 2 + 0.12, 0.3, midZ - 0.6]}
        rotation={[0, Math.PI / 2, 0]}
        getValue={() => timeRef.current.hours}
        label="Hours"
        frameW={1.6}
        frameH={1.6}
        accent={accent}
        frameColor={frameColor}
        clockType="hours"
      />

      <LancetWindow
        position={[-ROOM_WIDTH / 2 + 0.06, 0.8, -ROOM_LENGTH * 0.3]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[ROOM_WIDTH / 2 - 0.06, 0.8, -ROOM_LENGTH * 0.3]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[-ROOM_WIDTH / 2 + 0.06, 0.8, -ROOM_LENGTH * 0.72]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <LancetWindow
        position={[ROOM_WIDTH / 2 - 0.06, 0.8, -ROOM_LENGTH * 0.72]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      <CompassRose accent={accent} date={dateStr} location={locationStr} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY + 0.008, -ROOM_LENGTH * 0.5]}
      >
        <ringGeometry args={[1.6, 1.66, 64]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>

      <WallSconce position={[-ROOM_WIDTH / 2 + 0.1, 0.6, -ROOM_LENGTH * 0.2]} />
      <WallSconce position={[ROOM_WIDTH / 2 - 0.1, 0.6, -ROOM_LENGTH * 0.2]} />
      <WallSconce
        position={[-ROOM_WIDTH / 2 + 0.1, 0.6, -ROOM_LENGTH * 0.82]}
      />
      <WallSconce position={[ROOM_WIDTH / 2 - 0.1, 0.6, -ROOM_LENGTH * 0.82]} />

      <mesh position={[0, ROOM_HEIGHT / 2 - 0.05, -ROOM_LENGTH * 0.5]}>
        <cylinderGeometry args={[0.42, 0.42, 0.065, 16]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.22}
          metalness={0.9}
        />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.58,
              ROOM_HEIGHT / 2 - 0.05,
              -ROOM_LENGTH * 0.5 + Math.sin(a) * 0.58,
            ]}
          >
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.14}
              metalness={0.96}
            />
          </mesh>
        );
      })}

      {(
        [
          [-ROOM_WIDTH / 2 + 0.28, -ROOM_LENGTH * 0.28],
          [ROOM_WIDTH / 2 - 0.28, -ROOM_LENGTH * 0.28],
          [-ROOM_WIDTH / 2 + 0.28, -ROOM_LENGTH * 0.78],
          [ROOM_WIDTH / 2 - 0.28, -ROOM_LENGTH * 0.78],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.15, ROOM_HEIGHT, 10]} />
            <meshStandardMaterial color="#2a1e14" roughness={0.85} />
          </mesh>
          <mesh position={[0, ROOM_HEIGHT / 2 - 0.1, 0]}>
            <cylinderGeometry args={[0.22, 0.14, 0.22, 10]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.8} />
          </mesh>
          <mesh position={[0, -ROOM_HEIGHT / 2 + 0.09, 0]}>
            <cylinderGeometry args={[0.22, 0.24, 0.18, 10]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
