"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { useRoomsStore } from "@/components/rooms-r3f/store";

import type { FaqItem } from "@/types/event";

interface FAQRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  items?: FaqItem[];
  sectionLabel?: string;
}

// ── Bookshelf ─────────────────────────────────────────────────────────────────
function LibraryShelf({
  position,
  rotation,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
}) {
  const SHELF_W = 2.6;
  const SHELF_H = ROOM_HEIGHT * 0.75;
  const bookColors = [
    "#8b1a1a",
    "#1a3a6b",
    "#1a5a1a",
    "#7a5a1a",
    "#4a1a6b",
    "#8b4a1a",
    "#1a4a4a",
    "#6b1a4a",
    "#2a5a2a",
    "#5a1a1a",
  ];

  const books = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      w: 0.1 + ((i * 7) % 5) * 0.022,
      h: SHELF_H * 0.22 + ((i * 11) % 6) * 0.025,
      color: bookColors[i % bookColors.length],
      lean: i % 7 === 0 ? (i % 2 === 0 ? 0.1 : -0.1) : 0,
    })),
  );

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Back panel */}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[SHELF_W, SHELF_H, 0.04]} />
        <meshStandardMaterial color="#2a1408" roughness={0.75} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-SHELF_W / 2 + 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, 0.32]} />
        <meshStandardMaterial color="#2a1408" roughness={0.7} />
      </mesh>
      <mesh position={[SHELF_W / 2 - 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, 0.32]} />
        <meshStandardMaterial color="#2a1408" roughness={0.7} />
      </mesh>
      {/* Shelves */}
      {[-0.38, -0.08, 0.22].map((y, si) => (
        <mesh key={si} position={[0, SHELF_H * y, 0]}>
          <boxGeometry args={[SHELF_W - 0.08, 0.04, 0.3]} />
          <meshStandardMaterial color="#2a1408" roughness={0.65} />
        </mesh>
      ))}
      {/* Top and bottom */}
      <mesh position={[0, SHELF_H / 2 - 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, 0.32]} />
        <meshStandardMaterial color="#2a1408" roughness={0.65} />
      </mesh>
      <mesh position={[0, -SHELF_H / 2 + 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, 0.32]} />
        <meshStandardMaterial color="#2a1408" roughness={0.65} />
      </mesh>
      {/* Books */}
      {books.current.map((book, i) => {
        const shelf = Math.floor(i / 9);
        const shelfY = [-0.38, -0.08, 0.22][shelf] ?? -0.38;
        const xOffset = -SHELF_W / 2 + 0.1 + (i % 9) * 0.26;
        return (
          <mesh
            key={i}
            position={[xOffset, SHELF_H * shelfY + book.h / 2 + 0.04, 0.02]}
            rotation={[0, 0, book.lean]}
          >
            <boxGeometry args={[book.w, book.h, 0.22]} />
            <meshStandardMaterial color={book.color} roughness={0.85} />
          </mesh>
        );
      })}
      {/* Crown rail */}
      <mesh position={[0, SHELF_H / 2 + 0.04, 0.02]}>
        <boxGeometry args={[SHELF_W + 0.04, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
    </group>
  );
}

// ── FAQ leather binder ────────────────────────────────────────────────────────
function FAQBinder({
  position,
  accent,
  items,
  onClick,
}: {
  position: [number, number, number];
  accent: string;
  items: FaqItem[];
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coverRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#8b1a04"; // deep red leather
    ctx.fillRect(0, 0, 512, 640);

    // Leather texture lines
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 640; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Gold outer border
    ctx.strokeStyle = accent + "cc";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 484, 612);
    ctx.strokeStyle = accent + "55";
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, 460, 588);

    // "FAQ" — large embossed title
    ctx.fillStyle = accent;
    ctx.font = "bold 140px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.fillText("FAQ", 256, 220);
    ctx.shadowBlur = 0;

    // Gold rule
    ctx.strokeStyle = accent + "90";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 310);
    ctx.lineTo(432, 310);
    ctx.stroke();

    // "FREQUENTLY ASKED QUESTIONS" subtitle
    ctx.fillStyle = accent + "cc";
    ctx.font = "bold 28px serif";
    ctx.fillText("FREQUENTLY ASKED", 256, 370);
    ctx.fillText("QUESTIONS", 256, 410);

    // Second rule
    ctx.strokeStyle = accent + "50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 450);
    ctx.lineTo(432, 450);
    ctx.stroke();

    // Count
    ctx.fillStyle = accent + "99";
    ctx.font = "italic 30px serif";
    ctx.fillText(`${items.length} questions inside`, 256, 510);

    // Tap hint
    ctx.fillStyle = accent + "70";
    ctx.font = "italic 22px serif";
    ctx.fillText("Tap to open", 256, 580);

    const tex = new THREE.CanvasTexture(canvas);

    if (coverRef.current) {
      const m = coverRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [accent, items]);

  return (
    <group position={position}>
      {/* Book stand */}
      <mesh position={[0, -0.02, 0.1]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.65, 0.04, 0.35]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Binder — upright, angled toward camera */}
      <mesh position={[0, 0.55, 0.05]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.72, 1.02, 0.07]} />
        <meshStandardMaterial color="#1a0804" roughness={0.5} />
      </mesh>
      {/* Gold spine */}
      <mesh position={[-0.35, 0.55, 0.08]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.05, 1.02, 0.05]} />
        <meshStandardMaterial color={accent} roughness={0.18} metalness={0.9} />
      </mesh>
      {/* Cover texture plane */}
      <mesh
        ref={coverRef}
        position={[0, 0.55, 0.095]}
        rotation={[-0.18, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[0.54, 0.78]} />
        <meshBasicMaterial />
      </mesh>
      {/* Dedicated light on the binder */}
      <pointLight
        position={[0, 1.2, 0.5]}
        color="#fff8e0"
        intensity={2.0}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}

// ── Reading table ─────────────────────────────────────────────────────────────
function ReadingTable({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[2.2, 0.07, 1.1]} />
        <meshStandardMaterial color="#2a1408" roughness={0.35} />
      </mesh>
      {(
        [
          [-0.95, -0.45],
          [-0.95, 0.45],
          [0.95, -0.45],
          [0.95, 0.45],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <boxGeometry args={[0.08, 0.64, 0.08]} />
          <meshStandardMaterial color="#2a1408" roughness={0.6} />
        </mesh>
      ))}
      {/* Accent strip */}
      <mesh position={[0, 0.46, 0.56]}>
        <boxGeometry args={[2.2, 0.04, 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Green reading lamp ────────────────────────────────────────────────────────
function ReadingLamp({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    lightRef.current.intensity =
      2.4 + Math.sin(clock.getElapsedTime() * 2.8) * 0.1;
  });
  return (
    <group position={position}>
      {/* Base — heavy weighted disc */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.08, 12]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Lower stem */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.022, 0.028, 0.32, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Stem knuckle */}
      <mesh position={[0, 0.39, 0]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Upper stem — angled slightly */}
      <mesh position={[0.04, 0.56, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.018, 0.022, 0.32, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Shade — classic banker's lamp truncated cone */}
      <mesh position={[0.06, 0.75, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.12, 0.26, 14]} />
        <meshStandardMaterial
          color="#1a6a1a"
          roughness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Shade rim — gold band */}
      <mesh position={[0.06, 0.63, 0]}>
        <torusGeometry args={[0.222, 0.012, 6, 20]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Bulb glow inside shade */}
      <mesh position={[0.06, 0.72, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#ffffaa"
          emissive="#ffffaa"
          emissiveIntensity={3.0}
        />
      </mesh>
      {/* Light source */}
      <pointLight
        ref={lightRef}
        position={[0.06, 0.65, 0]}
        color="#ffdd88"
        intensity={2.4}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}

// ── Fireplace ─────────────────────────────────────────────────────────────────
function Fireplace({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);
  const flame3Ref = useRef<THREE.Mesh>(null);
  const ember1Ref = useRef<THREE.Mesh>(null);
  const ember2Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Main tall flame — slow sway
    if (flame1Ref.current) {
      flame1Ref.current.scale.y = 0.88 + Math.sin(t * 4.2) * 0.18;
      flame1Ref.current.scale.x = 0.92 + Math.sin(t * 5.8) * 0.1;
      flame1Ref.current.position.x = Math.sin(t * 2.1) * 0.028;
    }
    // Mid flame — offset phase
    if (flame2Ref.current) {
      flame2Ref.current.scale.y = 0.85 + Math.sin(t * 6.1 + 1.2) * 0.22;
      flame2Ref.current.scale.x = 0.9 + Math.sin(t * 7.4 + 0.8) * 0.12;
      flame2Ref.current.position.x = Math.sin(t * 3.3 + 1.0) * 0.022;
    }
    // Small inner flame — fast flicker
    if (flame3Ref.current) {
      flame3Ref.current.scale.y = 0.8 + Math.sin(t * 9.5 + 2.1) * 0.28;
      flame3Ref.current.scale.x = 0.88 + Math.sin(t * 11.2) * 0.14;
    }
    // Embers — subtle pulse
    if (ember1Ref.current) {
      (
        ember1Ref.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = 1.8 + Math.sin(t * 3.5) * 0.6;
    }
    if (ember2Ref.current) {
      (
        ember2Ref.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = 1.4 + Math.sin(t * 4.8 + 1.5) * 0.7;
    }
    // Flickering light
    if (lightRef.current) {
      lightRef.current.intensity =
        3.2 + Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.1) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* ── Stone mantle shelf ── */}
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[1.72, 0.1, 0.42]} />
        <meshStandardMaterial
          color="#9a9080"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* Mantle front edge chamfer */}
      <mesh position={[0, 0.57, 0.24]}>
        <boxGeometry args={[1.72, 0.06, 0.04]} />
        <meshStandardMaterial color="#888070" roughness={0.9} />
      </mesh>

      {/* ── Outer stone pilasters (left & right columns) ── */}
      {([-0.72, 0.72] as number[]).map((x, i) => (
        <group key={i} position={[x, 0.28, 0]}>
          {/* Column body */}
          <mesh>
            <boxGeometry args={[0.22, 0.62, 0.3]} />
            <meshStandardMaterial color="#8a8078" roughness={0.88} />
          </mesh>
          {/* Column cap */}
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.26, 0.06, 0.34]} />
            <meshStandardMaterial color="#9a9080" roughness={0.85} />
          </mesh>
          {/* Column base */}
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.26, 0.06, 0.34]} />
            <meshStandardMaterial color="#9a9080" roughness={0.85} />
          </mesh>
          {/* Gold accent inlay strip */}
          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[0.04, 0.48, 0.01]} />
            <meshStandardMaterial
              color={accent}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* ── Firebox surround — stone arch face ── */}
      {/* Top bar */}
      <mesh position={[0, 0.55, 0.14]}>
        <boxGeometry args={[1.02, 0.1, 0.18]} />
        <meshStandardMaterial color="#7a7068" roughness={0.9} />
      </mesh>
      {/* Left jamb */}
      <mesh position={[-0.46, 0.28, 0.14]}>
        <boxGeometry args={[0.1, 0.52, 0.18]} />
        <meshStandardMaterial color="#7a7068" roughness={0.9} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[0.46, 0.28, 0.14]}>
        <boxGeometry args={[0.1, 0.52, 0.18]} />
        <meshStandardMaterial color="#7a7068" roughness={0.9} />
      </mesh>

      {/* ── Firebox interior — dark recess ── */}
      <mesh position={[0, 0.28, 0.06]}>
        <boxGeometry args={[0.86, 0.5, 0.22]} />
        <meshStandardMaterial color="#1a0e06" roughness={1} />
      </mesh>
      {/* Back wall of firebox — slightly lighter soot */}
      <mesh position={[0, 0.28, -0.06]}>
        <boxGeometry args={[0.86, 0.5, 0.02]} />
        <meshStandardMaterial color="#2a1a0e" roughness={1} />
      </mesh>

      {/* ── Hearth floor — stone slab ── */}
      <mesh position={[0, 0.03, 0.22]}>
        <boxGeometry args={[1.1, 0.06, 0.38]} />
        <meshStandardMaterial color="#9a9080" roughness={0.85} />
      </mesh>
      {/* Hearth inner stone — soot-stained */}
      <mesh position={[0, 0.04, 0.05]}>
        <boxGeometry args={[0.84, 0.04, 0.18]} />
        <meshStandardMaterial color="#3a2a1a" roughness={1} />
      </mesh>

      {/* ── Logs ── */}
      {/* Main log — horizontal */}
      <mesh position={[0, 0.08, 0.02]} rotation={[0, 0.18, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.048, 0.62, 8]} />
        <meshStandardMaterial color="#3a2010" roughness={0.9} />
      </mesh>
      {/* Second log — slightly crossed */}
      <mesh position={[0.06, 0.1, 0.0]} rotation={[0.15, -0.25, Math.PI / 2]}>
        <cylinderGeometry args={[0.036, 0.042, 0.58, 8]} />
        <meshStandardMaterial color="#2e1a0c" roughness={0.92} />
      </mesh>
      {/* Short log ends visible */}
      <mesh position={[-0.28, 0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.042, 0.048, 0.06, 8]} />
        <meshStandardMaterial color="#1a0e06" roughness={1} />
      </mesh>
      <mesh position={[0.3, 0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 0.06, 8]} />
        <meshStandardMaterial color="#1a0e06" roughness={1} />
      </mesh>

      {/* ── Embers / glowing coals on logs ── */}
      <mesh ref={ember1Ref} position={[-0.08, 0.13, 0.02]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial
          color="#ff3300"
          emissive="#ff2200"
          emissiveIntensity={1.8}
          roughness={1}
        />
      </mesh>
      <mesh ref={ember2Ref} position={[0.1, 0.13, -0.02]}>
        <sphereGeometry args={[0.042, 6, 6]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={1.4}
          roughness={1}
        />
      </mesh>
      {/* Scattered small embers */}
      {(
        [
          [-0.18, 0.11, 0.01],
          [0.22, 0.12, 0.0],
          [0.0, 0.12, -0.04],
        ] as [number, number, number][]
      ).map(([ex, ey, ez], i) => (
        <mesh key={i} position={[ex, ey, ez]}>
          <sphereGeometry args={[0.022, 5, 5]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff6600"
            emissiveIntensity={1.2}
            roughness={1}
          />
        </mesh>
      ))}

      {/* ── Flames — three layered cones with independent animation ── */}
      {/* Outer tall flame — orange */}
      <mesh ref={flame1Ref} position={[0, 0.28, 0.0]}>
        <coneGeometry args={[0.18, 0.42, 7]} />
        <meshStandardMaterial
          color="#ff5500"
          emissive="#ff3300"
          emissiveIntensity={2.8}
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </mesh>
      {/* Mid flame — brighter yellow-orange */}
      <mesh ref={flame2Ref} position={[0, 0.24, 0.01]}>
        <coneGeometry args={[0.12, 0.34, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={3.2}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      {/* Inner core flame — bright yellow-white */}
      <mesh ref={flame3Ref} position={[0, 0.2, 0.01]}>
        <coneGeometry args={[0.065, 0.26, 5]} />
        <meshStandardMaterial
          color="#ffcc00"
          emissive="#ffdd44"
          emissiveIntensity={4.0}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* ── Flickering fire light ── */}
      <pointLight
        ref={lightRef}
        position={[0, 0.22, 0.18]}
        color="#ff7722"
        intensity={3.2}
        distance={6}
        decay={2}
      />
      {/* Secondary fill light — warm amber */}
      <pointLight
        position={[0, 0.1, 0.3]}
        color="#ffaa44"
        intensity={1.2}
        distance={3}
        decay={2}
      />
    </group>
  );
}

// ── Leather armchair ──────────────────────────────────────────────────────────
function Armchair({
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
      {/* Seat */}
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.72, 0.14, 0.72]} />
        <meshStandardMaterial color="#3a1a08" roughness={0.55} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.74, -0.32]}>
        <boxGeometry args={[0.72, 0.65, 0.12]} />
        <meshStandardMaterial color="#3a1a08" roughness={0.55} />
      </mesh>
      {/* Arms */}
      {([-0.38, 0.38] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.52, -0.02]}>
          <boxGeometry args={[0.1, 0.08, 0.65]} />
          <meshStandardMaterial color="#3a1a08" roughness={0.55} />
        </mesh>
      ))}
      {/* Legs */}
      {(
        [
          [-0.3, -0.28],
          [0.3, -0.28],
          [-0.3, 0.28],
          [0.3, 0.28],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <boxGeometry args={[0.06, 0.24, 0.06]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function FAQBookSpine({
  position,
  rotation,
  item,
  index,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  item: FaqItem;
  index: number;
  accent: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const spineColors = [
    "#8b1a1a",
    "#1a3a6b",
    "#1a5a1a",
    "#7a5a1a",
    "#4a1a6b",
    "#8b4a1a",
    "#1a4a4a",
    "#6b1a4a",
  ];
  const spineColor = spineColors[index % spineColors.length];

  useEffect(() => {
    const canvas = document.createElement("canvas");
    // Spine is tall and narrow — rotated text
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Spine background
    ctx.fillStyle = spineColor;
    ctx.fillRect(0, 0, 128, 512);

    // Gold top/bottom bands
    ctx.fillStyle = accent + "cc";
    ctx.fillRect(0, 0, 128, 14);
    ctx.fillRect(0, 498, 128, 14);

    // Gold side stripes
    ctx.fillRect(0, 0, 8, 512);
    ctx.fillRect(120, 0, 8, 512);

    // Rotate canvas to write spine text vertically (bottom to top)
    ctx.save();
    ctx.translate(64, 256);
    ctx.rotate(-Math.PI / 2);

    // "Question X" label
    ctx.fillStyle = accent;
    ctx.font = "bold 36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(`Q ${String(index + 1).padStart(2, "0")}`, 0, -18);
    ctx.shadowBlur = 0;

    // Short question preview
    ctx.fillStyle = "#f5f0e8cc";
    ctx.font = "18px serif";
    const shortQ =
      item.question.slice(0, 22) + (item.question.length > 22 ? "…" : "");
    ctx.fillText(shortQ, 0, 18);

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [item, accent, index, spineColor]);

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Book body */}
      <mesh
        position={[0, 0, 0]}
        scale={hovered ? [1.0, 1.08, 1.0] : [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          useRoomsStore.getState().setOpenFaqIndex(index);
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
        <boxGeometry args={[0.14, 0.32, 0.22]} />
        <meshStandardMaterial color={spineColor} roughness={0.7} />
      </mesh>
      {/* Spine texture plane — front face of book */}
      <mesh ref={meshRef} position={[0, 0, 0.112]}>
        <planeGeometry args={[0.14, 0.32]} />
        <meshBasicMaterial />
      </mesh>
      {/* Gold top strip */}
      <mesh position={[0, 0.162, 0]}>
        <boxGeometry args={[0.14, 0.01, 0.22]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {hovered && (
        <pointLight
          position={[0, 0.2, 0.3]}
          color={accent}
          intensity={1.5}
          distance={1.2}
          decay={2}
        />
      )}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FAQRoom({ theme, items = [] }: FAQRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;
  const shelfY = floorY + (ROOM_HEIGHT * 0.75) / 2;

  return (
    <group>
      {/* ── Bookshelves on both side walls ── */}
      <LibraryShelf
        position={[-ROOM_WIDTH / 2 + 0.18, shelfY, -ROOM_LENGTH * 0.58]}
        rotation={[0, Math.PI / 2, 0]}
        accent={accent}
      />
      <LibraryShelf
        position={[ROOM_WIDTH / 2 - 0.18, shelfY, -ROOM_LENGTH * 0.58]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={accent}
      />
      {/* ── Back wall shelves — flanking the door ── */}
      <LibraryShelf
        position={[-ROOM_WIDTH / 2 + 1.55, shelfY, -ROOM_LENGTH + 0.2]}
        rotation={[0, 0, 0]}
        accent={accent}
      />
      <LibraryShelf
        position={[ROOM_WIDTH / 2 - 1.55, shelfY, -ROOM_LENGTH + 0.2]}
        rotation={[0, 0, 0]}
        accent={accent}
      />

      {/* ── Central reading table ── */}
      <ReadingTable
        position={[0, floorY, -ROOM_LENGTH * 0.58]}
        accent={accent}
      />

      {/* ── FAQ binder on table ── */}
      <FAQBinder
        position={[0.2, floorY + 0.49, -ROOM_LENGTH * 0.58]}
        accent={accent}
        items={items}
        onClick={() => useRoomsStore.getState().setOpenFaqIndex(0)}
      />

      {/* ── FAQ books on right wall shelf bottom row ── */}
      {items.slice(0, 8).map((item, i) => (
        <FAQBookSpine
          key={item.id}
          position={[
            ROOM_WIDTH / 2 - 0.46, // pulled off the wall surface
            shelfY + ROOM_HEIGHT * 0.75 * 0.22 + 0.18, // bottom shelf level
            -ROOM_LENGTH * 0.58 + 0.55 - i * 0.16, // spaced along shelf depth
          ]}
          rotation={[0, -Math.PI / 2, 0]} // facing outward from right wall
          item={item}
          index={i}
          accent={accent}
        />
      ))}

      {/* ── Reading lamp ── */}
      <ReadingLamp
        position={[-0.65, floorY + 0.49, -ROOM_LENGTH * 0.55]}
        accent={accent}
      />

      {/* ── Fireplace — left wall ── */}
      <Fireplace
        position={[-ROOM_WIDTH / 2 + 0.6, floorY + 0.28, -ROOM_LENGTH * 0.75]}
        accent={accent}
      />

      {/* Left side of table — facing right (toward table) */}
      <Armchair
        position={[-1.55, floorY, -ROOM_LENGTH * 0.58]}
        rotation={[0, Math.PI / 2, 0]}
        accent={accent}
      />
      {/* Right side of table — facing left */}
      <Armchair
        position={[1.55, floorY, -ROOM_LENGTH * 0.58]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={accent}
      />
      {/* Near side (camera side) — facing away from camera, into the table */}
      <Armchair
        position={[0, floorY, -ROOM_LENGTH * 0.44]}
        rotation={[0, Math.PI, 0]}
        accent={accent}
      />
      {/* Far side of table — facing toward camera */}
      <Armchair
        position={[0, floorY, -ROOM_LENGTH * 0.72]}
        rotation={[0, 0, 0]}
        accent={accent}
      />
      {/* ── Globe in corner ── */}
      <group
        position={[ROOM_WIDTH / 2 - 0.7, floorY + 0.8, -ROOM_LENGTH * 0.82]}
      >
        <mesh>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial
            color="#2a4a6a"
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>
        <mesh position={[0, -0.48, 0]}>
          <cylinderGeometry args={[0.04, 0.16, 0.18, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.25}
            metalness={0.88}
          />
        </mesh>
      </group>

      {/* ── Ceiling light — warm overhead ── */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.5]}
        color="#fff5e0"
        intensity={2.5}
        distance={9}
        decay={1.5}
      />

      {/* ── Ceiling beams ── */}
      {(
        [
          -ROOM_LENGTH * 0.3,
          -ROOM_LENGTH * 0.58,
          -ROOM_LENGTH * 0.82,
        ] as number[]
      ).map((z, i) => (
        <mesh key={i} position={[0, ROOM_HEIGHT / 2 - 0.06, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.1, 0.16]} />
          <meshStandardMaterial color="#2a1408" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
