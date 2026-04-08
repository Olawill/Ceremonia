"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import type { VenueEvent } from "@/types/event";

interface VenueRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  details?: VenueEvent[];
  sectionLabel?: string;
}

// ── Parchment map on back wall ───────────────────────────────────────────────

function ParchmentMap({
  position,
  accent,
  venueName,
}: {
  position: [number, number, number];
  accent: string;
  venueName?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const W = 1024;
    const H = 768;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Parchment base
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    bg.addColorStop(0, "#e8d5a0");
    bg.addColorStop(1, "#c4a55a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Aged edges
    ctx.fillStyle = "#a08030aa";
    ctx.fillRect(0, 0, 40, H);
    ctx.fillRect(W - 40, 0, 40, H);
    ctx.fillRect(0, 0, W, 30);
    ctx.fillRect(0, H - 30, W, 30);

    // Grid lines
    ctx.strokeStyle = "#a08030aa";
    ctx.lineWidth = 1;
    for (let x = 60; x < W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 60; y < H; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Stylised terrain blobs
    const terrainPoints = [
      { x: 200, y: 200, r: 120 },
      { x: 600, y: 150, r: 80 },
      { x: 800, y: 400, r: 100 },
      { x: 300, y: 500, r: 90 },
      { x: 700, y: 580, r: 110 },
    ];
    terrainPoints.forEach(({ x, y, r }) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "#8a9a6030");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Compass rose
    const cx = W - 120;
    const cy = H - 120;
    const cr = 60;
    ctx.strokeStyle = accent + "cc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    [
      { l: "N", a: -Math.PI / 2 },
      { l: "S", a: Math.PI / 2 },
      { l: "E", a: 0 },
      { l: "W", a: Math.PI },
    ].forEach(({ l, a }) => {
      ctx.fillStyle = accent;
      ctx.font = "bold 20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        l,
        cx + Math.cos(a) * (cr - 14),
        cy + Math.sin(a) * (cr - 14),
      );
      ctx.strokeStyle = accent + "80";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (cr - 20), cy + Math.sin(a) * (cr - 20));
      ctx.stroke();
    });

    // Venue pin
    const pinX = W / 2 + 80;
    const pinY = H / 2 - 40;
    ctx.fillStyle = "#cc2222";
    ctx.beginPath();
    ctx.arc(pinX, pinY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", pinX, pinY);

    // Venue name flag
    if (venueName) {
      ctx.fillStyle = "#cc2222";
      ctx.fillRect(pinX + 4, pinY - 40, 180, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(venueName.slice(0, 22), pinX + 12, pinY - 25);
    }

    // Title
    ctx.fillStyle = "#5a3a10";
    ctx.font = "bold italic 32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("VENUE MAP", W / 2, 18);

    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [accent, venueName]);

  return (
    <group position={position}>
      {/* Wooden frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry
          args={[ROOM_WIDTH * 0.78 + 0.22, ROOM_HEIGHT * 0.58 + 0.22, 0.06]}
        />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Map surface */}
      <mesh ref={meshRef}>
        <planeGeometry args={[ROOM_WIDTH * 0.78, ROOM_HEIGHT * 0.58]} />
        <meshStandardMaterial color="#c4a55a" roughness={0.8} />
      </mesh>
      {/* Pin tacks at corners */}
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
          position={[sx * (ROOM_WIDTH * 0.38), sy * (ROOM_HEIGHT * 0.27), 0.04]}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#cc4444"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Spinning globe ────────────────────────────────────────────────────────────

function Globe({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.25;
  });
  return (
    <group position={position}>
      {/* Globe sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial
          color="#2a4a6a"
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      {/* Latitude band highlight */}
      <mesh ref={globeRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.018, 8, 32]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Brass stand arm */}
      <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI * 0.08]}>
        <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.25}
          metalness={0.88}
        />
      </mesh>
      {/* Base disc */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.06, 16]} />
        <meshStandardMaterial color={accent} roughness={0.22} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ── Hanging navigation lantern ─────────────────────────────────────────────

function HangingLantern({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    lightRef.current.intensity =
      1.4 +
      Math.sin(clock.getElapsedTime() * 5.3) * 0.25 +
      Math.sin(clock.getElapsedTime() * 11.7) * 0.12;
  });
  return (
    <group position={position}>
      {/* Chain */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.44, 6]} />
        <meshStandardMaterial color="#5a4a30" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Lantern body */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.1, 0.28, 6]} />
        <meshStandardMaterial color="#3a2e1a" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Glass panels — emissive */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.105, 0, Math.sin(angle) * 0.105]}
            rotation={[0, angle, 0]}
          >
            <planeGeometry args={[0.1, 0.22]} />
            <meshStandardMaterial
              color="#ffcc44"
              emissive="#ffcc44"
              emissiveIntensity={1.2}
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      {/* Cap */}
      <mesh position={[0, 0.16, 0]}>
        <coneGeometry args={[0.14, 0.1, 6]} />
        <meshStandardMaterial color="#3a2e1a" roughness={0.6} metalness={0.5} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        color="#ffaa33"
        intensity={1.4}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}

// ── Central table with diorama model ─────────────────────────────────────────

function CentralTable({
  position,
  accent,
  venueName,
}: {
  position: [number, number, number];
  accent: string;
  venueName?: string;
}) {
  const plaqueRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!venueName) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#c8a840";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#1a0e04";
    ctx.font = "bold 36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(venueName.toUpperCase(), 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    if (plaqueRef.current) {
      const m = plaqueRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [venueName]);

  return (
    <group position={position}>
      {/* Table surface */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[2.8, 0.08, 1.4]} />
        <meshStandardMaterial color="#3a2510" roughness={0.4} />
      </mesh>
      {/* Table legs */}
      {(
        [
          [-1.25, -0.56],
          [1.25, -0.56],
          [-1.25, 0.56],
          [1.25, 0.56],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <boxGeometry args={[0.1, 0.64, 0.1]} />
          <meshStandardMaterial color="#3a2510" roughness={0.6} />
        </mesh>
      ))}
      {/* Venue building diorama block */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.9, 0.4, 0.55]} />
        <meshStandardMaterial color="#d4c9b0" roughness={0.8} />
      </mesh>
      {/* Diorama roof */}
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.7, 0.3, 4]} />
        <meshStandardMaterial color="#8a6040" roughness={0.7} />
      </mesh>
      {/* Plaque */}
      <mesh position={[0, 0.54, 0.72]}>
        <boxGeometry args={[0.9, 0.14, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.18} metalness={0.9} />
      </mesh>
      <mesh ref={plaqueRef} position={[0, 0.54, 0.75]}>
        <planeGeometry args={[0.88, 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.3} />
      </mesh>
      {/* Decorative compass ruler on table */}
      <mesh position={[-0.8, 0.48, -0.2]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.015, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Wax seal */}
      <mesh position={[0.75, 0.48, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ── Canvas-based scrolling notice board ──────────────────────────────────────

function NoticeBoardMesh({
  details,
  accent,
  position,
}: {
  details: VenueEvent[];
  accent: string;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const scrollYRef = useRef(0);

  const BOARD_W = 1.55;
  const BOARD_H = 2.6;
  const TEX_W = 512;
  const TEX_H = Math.round(TEX_W * (BOARD_H / BOARD_W)); // ~861 — matches board aspect
  const CARD_H = Math.floor(TEX_H / 3.2); // ~2.5 cards visible at once
  const TOTAL_H = details.length * CARD_H;

  // Draw all cards at current scrollY offset
  const draw = useCallback(
    (canvas: HTMLCanvasElement, scrollY: number) => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, TEX_W, TEX_H);

      // Cork board background
      const bg = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
      bg.addColorStop(0, "#9b6f4a");
      bg.addColorStop(1, "#7a5535");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, TEX_W, TEX_H);

      // Cork texture grain
      ctx.fillStyle = "#00000008";
      for (let i = 0; i < 120; i++) {
        const x = (i * 137.5) % TEX_W;
        const y = (i * 97.3) % TEX_H;
        ctx.fillRect(x, y, 2 + (i % 4), 1);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, TEX_W, TEX_H);
      ctx.clip();

      // Draw each card at its scrolled position
      details.forEach((detail, i) => {
        // Wrap card position using modulo so cards re-enter from bottom as they exit top
        let cardTop = (((i * CARD_H - scrollY) % TOTAL_H) + TOTAL_H) % TOTAL_H;
        // Also draw a second pass offset by TOTAL_H to fill the board seamlessly
        // when the wrap-around card is partially visible at bottom
        const passes = [cardTop, cardTop + TOTAL_H];

        passes.forEach((top) => {
          if (top > TEX_H || top + CARD_H < 0) return;

          const PAD = 18;
          const cardW = TEX_W - PAD * 2;
          const tilt = [-2, 2, -1, 3, -2][i % 5];

          ctx.save();
          ctx.translate(TEX_W / 2, top + CARD_H / 2);
          ctx.rotate((tilt * Math.PI) / 180);

          // Card shadow
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(-cardW / 2 + 5, -CARD_H / 2 + 5, cardW, CARD_H - 28);

          // Card body
          ctx.fillStyle = "#f5f0e0";
          ctx.fillRect(-cardW / 2, -CARD_H / 2, cardW, CARD_H - 28);

          // Red left margin
          ctx.strokeStyle = "#cc555545";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-cardW / 2 + 52, -CARD_H / 2);
          ctx.lineTo(-cardW / 2 + 52, CARD_H / 2 - 28);
          ctx.stroke();

          // Lined paper
          ctx.strokeStyle = "#c8bfa012";
          ctx.lineWidth = 1;
          for (let ly = -CARD_H / 2 + 36; ly < CARD_H / 2 - 28; ly += 26) {
            ctx.beginPath();
            ctx.moveTo(-cardW / 2, ly);
            ctx.lineTo(cardW / 2, ly);
            ctx.stroke();
          }

          // Label
          ctx.fillStyle = accent + "cc";
          ctx.font = `bold ${Math.round(CARD_H * 0.18)}px serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(
            detail.label.toUpperCase(),
            -cardW / 2 + 60,
            -CARD_H / 2 + 14,
          );

          // Underline
          ctx.strokeStyle = accent + "70";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(
            -cardW / 2 + 60,
            -CARD_H / 2 + 14 + Math.round(CARD_H * 0.2),
          );
          ctx.lineTo(
            cardW / 2 - 8,
            -CARD_H / 2 + 14 + Math.round(CARD_H * 0.2),
          );
          ctx.stroke();

          // Value
          ctx.fillStyle = "#1a0e04";
          ctx.font = `bold ${Math.round(CARD_H * 0.16)}px serif`;
          ctx.fillText(
            detail.value,
            -cardW / 2 + 60,
            -CARD_H / 2 + 14 + Math.round(CARD_H * 0.23),
          );

          // Sub
          if (detail.sub) {
            ctx.fillStyle = "#5a4030";
            ctx.font = `italic ${Math.round(CARD_H * 0.16)}px serif`;
            ctx.fillText(
              detail.sub,
              -cardW / 2 + 60,
              -CARD_H / 2 + 14 + Math.round(CARD_H * 0.46),
            );
          }

          // Card border
          ctx.strokeStyle = accent + "30";
          ctx.lineWidth = 2;
          ctx.strokeRect(-cardW / 2, -CARD_H / 2, cardW, CARD_H - 28);

          // Thumb tack
          ctx.fillStyle = "#cc4444";
          ctx.beginPath();
          ctx.arc(0, -CARD_H / 2 + 10, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ff8888";
          ctx.beginPath();
          ctx.arc(-3, -CARD_H / 2 + 7, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      });

      ctx.restore();
    },
    [details, accent, CARD_H, TEX_H, TEX_W],
  );

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    texRef.current = tex;
    draw(canvas, 0);
    tex.needsUpdate = true;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!canvasRef.current || !texRef.current) return;
    if (details.length <= 2) return;
    scrollYRef.current += delta * 55; // px/sec scroll speed
    if (scrollYRef.current >= TOTAL_H) scrollYRef.current = 0;
    draw(canvasRef.current, scrollYRef.current);
    texRef.current.needsUpdate = true;
  });

  return (
    <group position={position}>
      {/* Cork board canvas — sits at front */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
        <meshStandardMaterial roughness={0.88} />
      </mesh>

      {/* Frame — four border strips around the canvas, sitting slightly in front */}
      {/* Top border */}
      <mesh position={[0, BOARD_H / 2 + 0.07, 0.02]}>
        <boxGeometry args={[BOARD_W + 0.28, 0.14, 0.06]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Bottom border */}
      <mesh position={[0, -BOARD_H / 2 - 0.07, 0.02]}>
        <boxGeometry args={[BOARD_W + 0.28, 0.14, 0.06]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Left border */}
      <mesh position={[-BOARD_W / 2 - 0.07, 0, 0.02]}>
        <boxGeometry args={[0.14, BOARD_H + 0.28, 0.06]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Right border */}
      <mesh position={[BOARD_W / 2 + 0.07, 0, 0.02]}>
        <boxGeometry args={[0.14, BOARD_H + 0.28, 0.06]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>

      {/* Top inner lip — sits in front of canvas top edge, clips cards scrolling out */}
      <mesh position={[0, BOARD_H / 2 - 0.04, 0.025]}>
        <boxGeometry args={[BOARD_W, 0.08, 0.055]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Bottom inner lip — sits in front of canvas bottom edge */}
      <mesh position={[0, -BOARD_H / 2 + 0.04, 0.025]}>
        <boxGeometry args={[BOARD_W, 0.08, 0.055]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function VenueRoom({ theme, details = [] }: VenueRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  const venueName =
    details.find((d) => d.label === "Location")?.value ??
    details.find((d) => d.label === "Venue")?.value;

  return (
    <group>
      {/* ── Back wall parchment map ── */}
      <ParchmentMap
        position={[0, 0.3, -ROOM_LENGTH + 0.08]}
        accent={accent}
        venueName={venueName}
      />

      {/* ── Left wall: scrolling notice board of all venue cards ── */}
      {/* <ScrollingNoticeBoard
        details={details}
        accent={accent}
        position={[-ROOM_WIDTH / 2 + 1.4, 1.2, -ROOM_LENGTH * 0.52]}
      /> */}

      <NoticeBoardMesh
        details={details}
        accent={accent}
        position={[-ROOM_WIDTH / 2 + 1.4, 0.2, -ROOM_LENGTH * 0.52]}
      />

      {/* ── Spinning globe — right corner ── */}
      <Globe
        // position={[ROOM_WIDTH / 2 - 0.9, floorY + 1.4, -ROOM_LENGTH * 0.78]}
        position={[ROOM_WIDTH / 2 - 1.1, floorY + 1.4, -ROOM_LENGTH * 0.55]}
        accent={accent}
      />

      {/* ── Central table with diorama ── */}
      <CentralTable
        position={[0, floorY, -ROOM_LENGTH * 0.72]}
        accent={accent}
        venueName={venueName}
      />

      {/* ── Hanging lanterns from ceiling beams ── */}
      {(
        [
          [-ROOM_WIDTH * 0.3, -ROOM_LENGTH * 0.38],
          [ROOM_WIDTH * 0.3, -ROOM_LENGTH * 0.38],
          [-ROOM_WIDTH * 0.3, -ROOM_LENGTH * 0.65],
          [ROOM_WIDTH * 0.3, -ROOM_LENGTH * 0.65],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <HangingLantern key={i} position={[x, ROOM_HEIGHT / 2 - 0.22, z]} />
      ))}

      {/* ── Exposed ceiling timber beams ── */}
      {(
        [
          -ROOM_LENGTH * 0.3,
          -ROOM_LENGTH * 0.55,
          -ROOM_LENGTH * 0.78,
        ] as number[]
      ).map((z, i) => (
        <mesh key={i} position={[0, ROOM_HEIGHT / 2 - 0.06, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.12, 0.18]} />
          <meshStandardMaterial color="#3a2510" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
