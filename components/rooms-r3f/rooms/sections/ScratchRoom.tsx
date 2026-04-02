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
  const bookCols =
    featureMode === "arcade"
      ? ["#00ffff", "#ff00ff", "#ffff00", "#ff4444", "#44ff44"]
      : featureMode === "garden"
        ? ["#4a6741", "#8b6340", "#c4a35a", "#6b8b5a", "#3d5636"]
        : featureMode === "beach"
          ? ["#87ceeb", "#ff6b6b", "#c4a35a", "#6bb8d9", "#ff8844"]
          : ["#8b1a1a", "#1a3a8b", "#1a6b1a", "#8b6b1a", "#4a1a6b"];

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Back panel */}
      <mesh>
        <boxGeometry args={[2.8, ROOM_HEIGHT * 0.72, 0.28]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* 3 rows of books */}
      {[0, 1, 2].map((row) =>
        Array.from({ length: 8 }).map((_, b) => (
          <mesh
            key={`${row}-${b}`}
            position={[
              -1.15 + b * 0.31,
              -ROOM_HEIGHT * 0.22 + row * 0.42,
              0.12,
            ]}
          >
            <boxGeometry args={[0.24, 0.36, 0.18]} />
            <meshStandardMaterial
              color={bookCols[b % bookCols.length]}
              roughness={0.8}
            />
          </mesh>
        )),
      )}
      {/* Gold accent rail at top */}
      <mesh position={[0, ROOM_HEIGHT * 0.36 + 0.04, 0.1]}>
        <boxGeometry args={[2.8, 0.05, 0.05]} />
        <meshStandardMaterial
          color={accentColor(featureMode)}
          roughness={0.2}
          metalness={0.85}
        />
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
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  const onRevealedRef = useRef(onRevealed);
  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    onRevealedRef.current();
    fireConfetti({
      count: 130,
      fixed: true,
      colors: [theme.accent, "#F0D060", "#ffffff", theme.curtain],
      origin: { x: "50%", y: "45%" },
    });
  }, [theme]);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = (canvas.width = 320);
    const H = (canvas.height = 110);
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
    ctx.font = "bold 13px serif";
    ctx.textAlign = "center";
    ctx.fillText("✦  SCRATCH TO REVEAL  ✦", W / 2, H / 2 + 5);

    let drawing = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * (W / rect.width),
        y: (src.clientY - rect.top) * (H / rect.height),
      };
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getPos(e);
      ctx.globalCompositeOperation = "destination-out";
      const radial = ctx.createRadialGradient(x, y, 0, x, y, 22);
      radial.addColorStop(0, "rgba(0,0,0,1)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
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
      if (pct > 92) handleReveal();
    };

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
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
        {/* <p
          style={{
            fontFamily: "var(--font-label, sans-serif)",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.55em",
            textTransform: "uppercase",
            color: `${theme.accent}CC`,
            margin: "0 0 8px",
          }}
        >
          A Special Surprise
        </p>
        <h2
          style={{
            fontFamily: "serif",
            fontSize: 24,
            fontWeight: 600,
            color: "#F5F0E8",
            letterSpacing: "0.08em",
            margin: 0,
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {revealTitle ?? "Reveal Our Date"}
        </h2> */}
        {!revealed && (
          <p
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: 15,
              color: `${theme.accent}99`,
              margin: "3px 0 0",
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
          width: 300,
          height: 110,
          borderRadius: 10,
          overflow: "hidden",
          border: `1.5px solid ${theme.accent}60`,
          boxShadow: `0 6px 28px rgba(0,0,0,0.6), 0 0 16px ${theme.accent}25`,
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
              fontSize: 22,
              letterSpacing: "0.05em",
              color: theme.accent,
              margin: 0,
              textShadow: `0 0 18px ${theme.accent}80`,
            }}
          >
            {formattedDate(date, true)}
          </p>
          <p
            style={{
              fontFamily: "var(--font-label, sans-serif)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: `${theme.accent}CC`,
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
            fontSize: 13,
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
  const deskZ = -ROOM_LENGTH * 0.58; // ~middle of room depth
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
        distanceFactor={3.2}
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
      <Bookshelf
        position={[-ROOM_WIDTH / 2 + 0.16, 0, -ROOM_LENGTH * 0.48]}
        rotation={[0, Math.PI / 2, 0]}
        featureMode={featureMode}
        theme={theme}
      />
      <Bookshelf
        position={[ROOM_WIDTH / 2 - 0.16, 0, -ROOM_LENGTH * 0.48]}
        rotation={[0, -Math.PI / 2, 0]}
        featureMode={featureMode}
        theme={theme}
      />

      {/* ── Back wall engraved heading ────────────────────────────── */}
      <Html
        position={[0, ROOM_HEIGHT * 0.28, -ROOM_LENGTH + 0.1]}
        center
        transform
        distanceFactor={9}
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
              fontSize: "20px",
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
              margin: "6px auto 20px",
            }}
          />

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-label, sans-serif)",
                fontSize: "8px",
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
                fontSize: "12px",
                fontWeight: 600,
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
