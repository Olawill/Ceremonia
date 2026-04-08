"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { fireConfetti } from "@/lib/confetti";
import { formattedDate } from "@/lib/helper";
import type { EventType } from "@/types/event";
import { useRoomsStore } from "../../store";

interface ScratchRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  date?: string;
  onRevealed: () => void;
  revealTitle?: string;
  revealHint?: string;
  eventType?: EventType;
}

// ── Desk colour per featureMode ───────────────────────────────────────────────
function deskColor(featureMode: FeatureMode) {
  switch (featureMode) {
    case "farm":
      return "#7a5a30";
    case "arcade":
      return "#0a0a1e";
    case "garden":
      return "#4a5a28";
    case "beach":
      return "#c4a35a";
    default:
      return "#2e1a0e"; // castle — dark mahogany
  }
}

function accentColor(featureMode: FeatureMode) {
  switch (featureMode) {
    case "arcade":
      return "#00ffff";
    case "beach":
      return "#ff6b6b";
    case "garden":
      return "#f4a460";
    case "farm":
      return "#c4a35a";
    default:
      return "#d4af37";
  }
}

// ── Bookshelf prop ────────────────────────────────────────────────────────────
function Bookshelf({
  position,
  rotation,
  featureMode,
  theme,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const shelfCol = deskColor(featureMode);
  const acc = accentColor(featureMode);

  const bookCols =
    featureMode === "arcade"
      ? [
          "#00cccc",
          "#cc00cc",
          "#cccc00",
          "#cc2222",
          "#22cc22",
          "#2222cc",
          "#cc6600",
        ]
      : featureMode === "garden"
        ? [
            "#4a6741",
            "#8b6340",
            "#c4a35a",
            "#6b8b5a",
            "#3d5636",
            "#7a8b40",
            "#5a3d28",
          ]
        : featureMode === "beach"
          ? [
              "#5a9ab5",
              "#cc5555",
              "#b89040",
              "#4a8aaa",
              "#cc7733",
              "#6688aa",
              "#aa6644",
            ]
          : [
              "#8b1a1a",
              "#1a3a6b",
              "#1a5a1a",
              "#7a5a1a",
              "#4a1a6b",
              "#8b4a1a",
              "#1a4a4a",
            ];

  const SHELF_W = 2.6;
  const SHELF_H = ROOM_HEIGHT * 0.72;
  const SHELF_D = 0.28;
  const NUM_ROWS = 3;
  // Row bottom Y positions relative to group centre
  const rowBottomY = [-SHELF_H * 0.38, -SHELF_H * 0.04, SHELF_H * 0.3];
  const rowTopY = [-SHELF_H * 0.04, SHELF_H * 0.3, SHELF_H * 0.62];

  // Deterministic per-book data so it doesn't re-randomise on re-render
  const bookData = useRef(
    Array.from({ length: NUM_ROWS }, (_, row) => {
      const rowH = rowTopY[row] - rowBottomY[row] - 0.04; // available height
      const books: {
        w: number;
        h: number;
        lean: number;
        colorIdx: number;
        gap: boolean;
      }[] = [];
      let usedW = 0;
      const maxW = SHELF_W - 0.18; // leave margins for side panels
      let i = 0;
      while (usedW < maxW - 0.1 && i < 20) {
        const w = 0.13 + ((i * 7 + row * 3) % 7) * 0.018; // 0.13–0.24
        const h = rowH * (0.65 + ((i * 5 + row * 11) % 10) * 0.035); // 65–100% of row
        const lean =
          (i * 3 + row * 7) % 5 === 0 ? (i % 2 === 0 ? 1 : -1) * 0.08 : 0;
        const gap = (i * row + i) % 11 === 0 && i > 0; // occasional small gap
        books.push({
          w,
          h,
          lean,
          colorIdx: (i + row * 3) % bookCols.length,
          gap,
        });
        usedW += w + (gap ? 0.08 : 0.005);
        i++;
      }
      return books;
    }),
  );

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* ── Case frame ── */}
      {/* Back panel */}
      <mesh position={[0, 0, -SHELF_D / 2 + 0.02]}>
        <boxGeometry args={[SHELF_W, SHELF_H, 0.04]} />
        <meshStandardMaterial color={shelfCol} roughness={0.75} />
      </mesh>
      {/* Left side panel */}
      <mesh position={[-SHELF_W / 2 + 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[SHELF_W / 2 - 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* Top panel */}
      <mesh position={[0, SHELF_H / 2 - 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* Bottom panel */}
      <mesh position={[0, -SHELF_H / 2 + 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>

      {/* ── Shelf planks ── */}
      {rowBottomY.map((y, i) => (
        <mesh key={`plank-${i}`} position={[0, y, 0]}>
          <boxGeometry args={[SHELF_W - 0.08, 0.04, SHELF_D - 0.04]} />
          <meshStandardMaterial color={shelfCol} roughness={0.65} />
        </mesh>
      ))}

      {/* ── Books per shelf ── */}
      {bookData.current.map((shelfBooks, row) => {
        const plankY = rowBottomY[row] + 0.02; // top of shelf plank
        const rowH = rowTopY[row] - rowBottomY[row] - 0.04;
        let xCursor = -SHELF_W / 2 + 0.1;

        return shelfBooks.map((book, b) => {
          const bookX = xCursor + book.w / 2 + (book.gap ? 0.06 : 0);
          xCursor += book.w + (book.gap ? 0.08 : 0.005);
          const bookY = plankY + book.h / 2;

          return (
            <group
              key={`${row}-${b}`}
              position={[bookX, bookY, 0.02]}
              rotation={[0, 0, book.lean]}
            >
              {/* Book body */}
              <mesh>
                <boxGeometry args={[book.w, book.h, SHELF_D * 0.7]} />
                <meshStandardMaterial
                  color={bookCols[book.colorIdx]}
                  roughness={0.85}
                />
              </mesh>
              {/* Spine highlight — slightly lighter strip */}
              <mesh position={[0, 0, SHELF_D * 0.36]}>
                <boxGeometry args={[book.w - 0.01, book.h - 0.02, 0.008]} />
                <meshStandardMaterial
                  color={bookCols[book.colorIdx]}
                  roughness={0.5}
                  emissive={bookCols[book.colorIdx]}
                  emissiveIntensity={0.08}
                />
              </mesh>
              {/* Page edges — cream top */}
              <mesh position={[0, book.h / 2 - 0.006, 0]}>
                <boxGeometry args={[book.w - 0.01, 0.01, SHELF_D * 0.65]} />
                <meshStandardMaterial color="#f0ead8" roughness={0.9} />
              </mesh>
            </group>
          );
        });
      })}

      {/* ── Bookends on bottom shelf ── */}
      {([-1, 1] as const).map((side, i) => (
        <mesh
          key={`bookend-${i}`}
          position={[side * (SHELF_W / 2 - 0.16), rowBottomY[0] + 0.09, 0.02]}
        >
          <boxGeometry args={[0.04, 0.18, SHELF_D * 0.6]} />
          <meshStandardMaterial color={acc} roughness={0.25} metalness={0.8} />
        </mesh>
      ))}

      {/* ── Decorative crown rail at top ── */}
      <mesh position={[0, SHELF_H / 2 + 0.04, 0.02]}>
        <boxGeometry args={[SHELF_W + 0.04, 0.06, 0.06]} />
        <meshStandardMaterial color={acc} roughness={0.2} metalness={0.85} />
      </mesh>
    </group>
  );
}

// ── Banker's lamp ─────────────────────────────────────────────────────────────
function BankersLamp({
  position,
  featureMode,
}: {
  position: [number, number, number];
  featureMode: FeatureMode;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const shadeCol =
    featureMode === "arcade"
      ? "#220022"
      : featureMode === "garden"
        ? "#1a3a0a"
        : featureMode === "beach"
          ? "#3a2a0a"
          : "#1a3a1a"; // classic green shade

  const glowCol =
    featureMode === "arcade"
      ? "#ff00ff"
      : featureMode === "garden"
        ? "#aadd55"
        : featureMode === "beach"
          ? "#ffaa44"
          : "#aad855";

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.8 + Math.sin(clock.getElapsedTime() * 2.8) * 0.15;
  });

  return (
    <group position={position}>
      {/* Shade */}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.28, 0.3, 10]} />
        <meshStandardMaterial
          color={shadeCol}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Shade interior glow */}
      <mesh ref={glowRef} position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={glowCol}
          emissive={glowCol}
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Stem */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.55, 8]} />
        <meshStandardMaterial
          color={accentColor(featureMode)}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.06, 10]} />
        <meshStandardMaterial
          color={accentColor(featureMode)}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

// ── Desk props (quill, inkpot, wax seal) ─────────────────────────────────────
function DeskProps({
  position,
  featureMode,
}: {
  position: [number, number, number];
  featureMode: FeatureMode;
}) {
  const acc = accentColor(featureMode);
  return (
    <group position={position}>
      {/* Inkpot */}
      <mesh position={[0.55, 0.07, 0.18]}>
        <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.13, 0.18]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} />
      </mesh>
      {/* Quill */}
      <mesh position={[0.45, 0.14, 0.22]} rotation={[0.2, 0, -0.35]}>
        <cylinderGeometry args={[0.006, 0.003, 0.28, 6]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.9} />
      </mesh>
      {/* Wax seal stamp */}
      <mesh position={[-0.55, 0.07, 0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 10]} />
        <meshStandardMaterial color={acc} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Scattered coins */}
      {[
        [0.3, 0.03, -0.12] as [number, number, number],
        [0.38, 0.03, -0.06] as [number, number, number],
        [-0.35, 0.03, 0.1] as [number, number, number],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, i * 0.4]}>
          <cylinderGeometry args={[0.04, 0.04, 0.008, 12]} />
          <meshStandardMaterial color={acc} roughness={0.2} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── The scratch card interaction (embedded in Html on desk) ──────────────────
function ScratchCard({
  date,
  onRevealed,
  revealTitle,
  revealHint,
  eventType,
  theme,
}: {
  date: string;
  onRevealed: () => void;
  revealTitle?: string;
  revealHint?: string;
  eventType?: EventType;
  theme: RoomTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSampleRef = useRef(0);
  const [revealed, setRevealed] = useState(
    () => useRoomsStore.getState().dateRevealed,
  );
  const [progress, setProgress] = useState(0);

  const hasZoomedRef = useRef(false);
  const onRevealedRef = useRef(onRevealed);
  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    useRoomsStore.getState().setDateRevealed(true);
    onRevealedRef.current();
    fireConfetti({
      count: 130,
      fixed: true,
      colors: [theme.accent, "#F0D060", "#ffffff", theme.curtain],
      origin: { x: "50%", y: "45%" },
    });
    // Reset zoom when revealed — camera will navigate away anyway
    useRoomsStore.getState().setZoomOffset(0);

    // Auto-navigate to next room after a short celebration delay
    setTimeout(() => {
      const store = useRoomsStore.getState();
      store.navigate(store.activeRoom + 1);
    }, 2200);
  }, [theme]);

  useEffect(() => {
    return () => {
      // Always restore zoom when card unmounts
      useRoomsStore.getState().setZoomOffset(0);
    };
  }, []);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = (canvas.width = 480);
    const H = (canvas.height = 160);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    // Gold foil
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#B8960C");
    grad.addColorStop(0.4, "#D4AF37");
    grad.addColorStop(0.7, "#F0D060");
    grad.addColorStop(1, "#B8960C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Texture noise
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }

    // "SCRATCH TO REVEAL" hint
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.font = "bold 18px serif";
    ctx.textAlign = "center";
    ctx.fillText("✦  SCRATCH TO REVEAL  ✦", W / 2, H / 2 + 5);

    let drawing = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      // rect.width/height can be 0 if canvas isn't laid out yet — fall back to W/H
      const scaleX = rect.width > 0 ? W / rect.width : 1;
      const scaleY = rect.height > 0 ? H / rect.height : 1;
      return {
        x: (src.clientX - rect.left) * scaleX,
        y: (src.clientY - rect.top) * scaleY,
      };
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getPos(e);
      // Guard against NaN/Infinity from zero-size or unmounted canvas
      if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) return;

      ctx.globalCompositeOperation = "destination-out";
      const radial = ctx.createRadialGradient(x, y, 0, x, y, 45);
      radial.addColorStop(0, "rgba(0,0,0,1)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      const now = performance.now();
      if (now - lastSampleRef.current < 150) return;
      lastSampleRef.current = now;

      const data = ctx.getImageData(0, 0, W, H).data;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) transparent++;
      }
      const pct = (transparent / (W * H)) * 100;
      setProgress(Math.min(pct, 100));
      if (pct > 60) handleReveal();
    };

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
      if (!hasZoomedRef.current) {
        hasZoomedRef.current = true;
        useRoomsStore.getState().setZoomOffset(2.0); // move forward 3.8 units toward desk
      }
      scratch(e);
    });
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", () => {
      drawing = false;
    });
    canvas.addEventListener("mouseleave", () => {
      drawing = false;
    });
    canvas.addEventListener(
      "touchstart",
      (e) => {
        drawing = true;
        if (!hasZoomedRef.current) {
          hasZoomedRef.current = true;
          useRoomsStore.getState().setZoomOffset(2.0);
        }
        scratch(e);
      },
      { passive: false },
    );
    canvas.addEventListener("touchmove", scratch, { passive: false });
    canvas.addEventListener("touchend", () => {
      drawing = false;
    });

    return () => {
      // cleanup handled by canvas removal
    };
  }, [revealed, handleReveal]);

  const doneMsg: Partial<Record<string, string>> = {
    wedding: "We can't wait to celebrate with you ♡",
    birthday: "We can't wait to party with you ♡",
    baby_shower: "We can't wait to share this moment ♡",
    anniversary: "We can't wait to celebrate with you ♡",
  };

  return (
    <div
      style={{
        width: 340,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
        // Important: allow pointer events to pass through to the canvas
        pointerEvents: "auto",
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center" }}>
        {!revealed && (
          <p
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: 16,
              fontWeight: 600,
              color: theme.accent,
              margin: "6px 0 0",
              textShadow: `0 0 12px ${theme.accent}60`,
            }}
          >
            {revealHint ?? "Scratch the golden foil below"}
          </p>
        )}
      </div>

      {/* Scratch card */}
      <div
        style={{
          position: "relative",
          width: 340,
          height: 150,
          borderRadius: 10,
          overflow: "hidden",
          border: `1.5px solid ${theme.accent}60`,
          boxShadow: `0 6px 28px rgba(0,0,0,0.6), 0 0 40px ${theme.accent}50`,
          cursor: revealed ? "default" : "crosshair",
        }}
      >
        {/* Revealed date underneath */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            background: `linear-gradient(135deg, ${theme.curtain}80, #0a0505CC)`,
          }}
        >
          <p
            style={{
              fontFamily: "serif",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: theme.accent,
              margin: 0,
              textShadow: `0 0 30px ${theme.accent}, 0 0 60px ${theme.accent}60`,
            }}
          >
            {formattedDate(date, true)}
          </p>
          <p
            style={{
              fontFamily: "var(--font-label, sans-serif)",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.5em",
              color: theme.accent,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            SAVE THE DATE
          </p>
        </div>

        {/* Foil canvas — sits on top, scratched away */}
        {!revealed && (
          <canvas
            ref={canvasRef}
            data-scratch="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              borderRadius: 10,
              touchAction: "none",
            }}
          />
        )}
      </div>

      {/* Progress bar */}
      {!revealed && progress > 5 && (
        <div
          style={{
            width: 320,
            height: 2,
            borderRadius: 1,
            background: `${theme.accent}18`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${theme.accent}, #F0D060)`,
              transition: "width 100ms linear",
              borderRadius: 1,
            }}
          />
        </div>
      )}

      {/* Post-reveal message */}
      {revealed && (
        <p
          style={{
            fontFamily: "serif",
            fontStyle: "italic",
            fontSize: 16,
            fontWeight: 600,
            color: theme.accent,
            textAlign: "center",
            margin: 0,
            textShadow: `0 0 12px ${theme.accent}60`,
          }}
        >
          {doneMsg[eventType ?? ""] ?? "We can't wait to see you there ♡"}
        </p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ScratchRoom({
  featureMode,
  theme,
  date = "2026-07-12",
  onRevealed,
  revealTitle,
  revealHint,
  eventType,
}: ScratchRoomProps) {
  // Desk sits at room centre depth, slightly forward
  const deskY = -ROOM_HEIGHT / 2.5; // floor level
  const deskZ = -ROOM_LENGTH * 0.68; // ~middle of room depth
  const deskTopY = deskY + 0.88; // top surface of desk

  const col = deskColor(featureMode);
  const acc = accentColor(featureMode);

  return (
    <group>
      {/* ── Writing desk ─────────────────────────────────────────── */}
      <group position={[0, deskY, deskZ]}>
        {/* Desk surface */}
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[2.6, 0.09, 1.3]} />
          <meshStandardMaterial color={col} roughness={0.4} metalness={0.05} />
        </mesh>
        {/* Gold edge strip */}
        <mesh position={[0, 0.79, 0.65]}>
          <boxGeometry args={[2.6, 0.03, 0.02]} />
          <meshStandardMaterial color={acc} roughness={0.2} metalness={0.85} />
        </mesh>
        {/* Legs */}
        {(
          [
            [-1.15, -0.55],
            [-1.15, 0.55],
            [1.15, -0.55],
            [1.15, 0.55],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.37, z]}>
            <boxGeometry args={[0.09, 0.74, 0.09]} />
            <meshStandardMaterial color={col} roughness={0.55} />
          </mesh>
        ))}
        {/* Side stretchers */}
        {([-1.15, 1.15] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.14, 0]}>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial color={col} roughness={0.6} />
          </mesh>
        ))}
        {/* Green felt surface on desk */}
        <mesh position={[0, 0.79, -0.05]}>
          <boxGeometry args={[2.0, 0.01, 1.0]} />
          <meshStandardMaterial
            color={featureMode === "arcade" ? "#0a001a" : "#1a3a1a"}
            roughness={0.95}
          />
        </mesh>
      </group>

      {/* ── Banker's lamp — left of card ─────────────────────────── */}
      <BankersLamp
        position={[-0.88, deskTopY + 0.44, deskZ - 0.12]}
        featureMode={featureMode}
      />

      {/* ── Desk props (quill, inkpot, coins) ────────────────────── */}
      <DeskProps position={[0, deskTopY, deskZ]} featureMode={featureMode} />

      {/* ── Scratch card embedded on desk surface via Html ──────────
           Position: desk surface level, centred, facing up toward camera  */}
      <Html
        position={[0.1, deskTopY + 0.06, deskZ - 0.05]}
        rotation={[-Math.PI / 2.4, 0, 0]}
        transform
        distanceFactor={2.8}
        occlude={false}
        style={{ pointerEvents: "auto" }}
      >
        <ScratchCard
          date={date}
          onRevealed={onRevealed}
          revealTitle={revealTitle}
          revealHint={revealHint}
          eventType={eventType}
          theme={theme}
        />
      </Html>

      {/* ── Bookshelves on side walls ─────────────────────────────── */}
      {/* Y = floor + half shelf height so bottom sits on floor */}
      <Bookshelf
        position={[
          -ROOM_WIDTH / 2 + 0.18,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, Math.PI / 2, 0]}
        featureMode={featureMode}
        theme={theme}
      />
      <Bookshelf
        position={[
          ROOM_WIDTH / 2 - 0.18,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, -Math.PI / 2, 0]}
        featureMode={featureMode}
        theme={theme}
      />
      {/* ── Back wall engraved heading ────────────────────────────── */}
      <Html
        position={[0, ROOM_HEIGHT * 0.28, -ROOM_LENGTH + 0.1]}
        center
        transform
        distanceFactor={6}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            textAlign: "center",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: "serif",
              fontSize: "32px",
              fontWeight: 500,
              color: acc,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textShadow: `0 0 20px ${acc}60`,
            }}
          >
            The Vault
          </div>
          <div
            style={{
              width: "120px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${acc}70, transparent)`,
              margin: "10px auto 14px",
            }}
          />

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-label, sans-serif)",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "0.55em",
                textTransform: "uppercase",
                color: `${theme.accent}CC`,
                margin: "6px 0 2px",
              }}
            >
              A Special Surprise
            </p>
            <h2
              style={{
                fontFamily: "serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#F5F0E8",
                letterSpacing: "0.08em",
                margin: 0,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {revealTitle ?? "Reveal Our Date"}
            </h2>
          </div>
        </div>
      </Html>

      {/* ── Ceiling chandelier ───────────────────────────────────── */}
      <VaultCeiling featureMode={featureMode} acc={acc} />
    </group>
  );
}

// ── Ceiling light for vault ───────────────────────────────────────────────────
function VaultCeiling({
  featureMode,
  acc,
}: {
  featureMode: FeatureMode;
  acc: string;
}) {
  const flickerRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flickerRef.current || featureMode === "arcade") return;
    const mat = flickerRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity =
      1.7 +
      Math.sin(clock.getElapsedTime() * 3.2) * 0.2 +
      Math.sin(clock.getElapsedTime() * 6.8) * 0.08;
  });

  if (featureMode === "arcade") {
    return (
      <group position={[0, ROOM_HEIGHT / 2 - 0.08, -ROOM_LENGTH * 0.48]}>
        <mesh>
          <boxGeometry args={[3.0, 0.05, 0.05]} />
          <meshStandardMaterial
            color={acc}
            emissive={acc}
            emissiveIntensity={2.5}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, ROOM_HEIGHT / 2 - 0.25, -ROOM_LENGTH * 0.48]}>
      <mesh>
        <cylinderGeometry args={[0.016, 0.016, 0.4, 6]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.22, 0.14, 0.25, 10]} />
        <meshStandardMaterial
          color={deskColor(featureMode)}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      <mesh ref={flickerRef} position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ffeeaa"
          emissive="#ffeeaa"
          emissiveIntensity={1.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 0.28, -0.26, Math.sin(a) * 0.28]}
          >
            <mesh>
              <cylinderGeometry args={[0.018, 0.024, 0.13, 6]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.085, 0]}>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshStandardMaterial
                color="#ffeeaa"
                emissive="#ffeeaa"
                emissiveIntensity={1.9}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
