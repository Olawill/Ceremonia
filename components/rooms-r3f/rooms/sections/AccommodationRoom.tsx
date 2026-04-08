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
import type { AccommodationConfig, AccommodationOption } from "@/types/event";
import { useRoomsStore } from "../../store";

interface AccommodationRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  accommodation?: AccommodationConfig;
  sectionLabel?: string;
  onCardOpen?: (option: AccommodationOption | null, index: number) => void;
}

// ── Brass chandelier ──────────────────────────────────────────────────────────
function Chandelier({
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
      3.5 + Math.sin(clock.getElapsedTime() * 2.1) * 0.15;
  });
  return (
    <group position={position}>
      {/* Main ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 8, 24]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.15}
          metalness={0.95}
        />
      </mesh>
      {/* Chain */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 6]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Candle arms */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 0.55, -0.08, Math.sin(a) * 0.55]}
          >
            <mesh>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 6]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <coneGeometry args={[0.022, 0.1, 6]} />
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
        ref={lightRef}
        color="#fff8e0"
        intensity={3.5}
        distance={10}
        decay={1.5}
      />
    </group>
  );
}

// ── Potted palm ───────────────────────────────────────────────────────────────
function PottedPalm({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      {/* Brass urn */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.22, 0.16, 0.5, 10]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.18}
          metalness={0.92}
        />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.065, 0.08, 0.3, 7]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.052, 0.065, 0.28, 7]} />
        <meshStandardMaterial color="#4a2e12" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.038, 0.052, 0.28, 7]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.9} />
      </mesh>
      {/* Palm fronds — arching stems with leaflets */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const tiltOut = 0.45 + (i % 4) * 0.1;
        return (
          <group key={i} position={[0, 0.62, 0]} rotation={[tiltOut, a, 0]}>
            {/* Arching stem */}
            <mesh position={[0, 0.28, 0]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.007, 0.013, 0.75, 4]} />
              <meshStandardMaterial color="#3a5a1a" roughness={0.9} />
            </mesh>
            {/* Leaflets along the stem — 5 pairs */}
            {Array.from({ length: 8 }).map((_, j) => (
              <group
                key={j}
                position={[0, 0.06 + j * 0.09, 0]}
                rotation={[0.3 + j * 0.06, 0, 0]}
              >
                <mesh position={[0.06, 0, 0]} rotation={[0, 0, 0.5]}>
                  <planeGeometry args={[0.15, 0.08]} />
                  <meshStandardMaterial
                    color={j % 2 === 0 ? "#2a6a1a" : "#1a5a12"}
                    roughness={0.85}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh position={[-0.06, 0, 0]} rotation={[0, 0, -0.5]}>
                  <planeGeometry args={[0.1, 0.06]} />
                  <meshStandardMaterial
                    color={j % 2 === 0 ? "#2a7a1a" : "#1a6a12"}
                    roughness={0.85}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ── Reception desk ────────────────────────────────────────────────────────────
function ReceptionDesk({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      {/* Main desk body */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[3.2, 1.2, 0.85]} />
        <meshStandardMaterial color="#2a1408" roughness={0.4} />
      </mesh>
      {/* Marble top */}
      <mesh position={[0, 0.91, 0]}>
        <boxGeometry args={[3.2, 0.06, 0.85]} />
        <meshStandardMaterial
          color="#e8e0d8"
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>
      {/* Gold trim strip */}
      <mesh position={[0, 0.91, 0.43]}>
        <boxGeometry args={[3.2, 0.05, 0.02]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.15}
          metalness={0.95}
        />
      </mesh>
      {/* Brass bell on desk */}
      <mesh position={[0.8, 0.97, 0.1]}>
        <cylinderGeometry args={[0.08, 0.12, 0.12, 12]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.12}
          metalness={0.96}
        />
      </mesh>
      <mesh position={[0.8, 1.07, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.12}
          metalness={0.96}
        />
      </mesh>
      {/* Guest register */}
      <mesh position={[-0.3, 0.96, 0]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.35]} />
        <meshStandardMaterial color="#1a0a04" roughness={0.6} />
      </mesh>
      {/* Pen holder */}
      <mesh position={[-0.7, 0.99, 0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.14, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Intro notice frame */}
      <mesh position={[0, 0.6, 0.44]}>
        <boxGeometry args={[1.4, 0.38, 0.03]} />
        <meshStandardMaterial color={accent} roughness={0.18} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ── Hotel key on hook ─────────────────────────────────────────────────────────
function HotelKey({
  position,
  accent,
  label,
}: {
  position: [number, number, number];
  accent: string;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f5f0e0";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#1a0e04";
    ctx.font = "bold 28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.slice(0, 16), 128, 64);
    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, [label]);

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Key tag */}
      <mesh ref={meshRef} position={[0, -0.08, 0]}>
        <boxGeometry args={[0.25, 0.14, 0.01]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.85} />
      </mesh>
      {/* Key body */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Key bit */}
      <mesh position={[0.04, -0.38, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.01]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Hook */}
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[0.03, 0.008, 6, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Hook peg */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Key wall ──────────────────────────────────────────────────────────────────
function KeyWall({
  options,
  accent,
}: {
  options: Array<{ name: string }>;
  accent: string;
}) {
  const wallZ = -ROOM_LENGTH + 0.12;
  const count = Math.min(options.length, 5);
  const spacing = Math.min(1.4, (ROOM_WIDTH - 1.2) / Math.max(count, 1));
  const startX = -((count - 1) * spacing) / 2;

  return (
    <group>
      {/* Wall panel backing */}
      <mesh position={[0, 0.5, wallZ + 0.02]}>
        <boxGeometry
          args={[Math.min(count * spacing + 0.4, ROOM_WIDTH - 0.4), 1.4, 0.04]}
        />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      {/* Keys */}
      {options.slice(0, 5).map((opt, i) => (
        <HotelKey
          key={i}
          position={[startX + i * spacing, 0.6, wallZ + 0.06]}
          accent={accent}
          label={opt.name}
        />
      ))}
      {/* CONCIERGE sign above */}
      <mesh position={[0, 1.4, wallZ + 0.05]}>
        <boxGeometry args={[2.2, 0.22, 0.04]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.15}
          metalness={0.95}
        />
      </mesh>
    </group>
  );
}

// ── Grandfather clock ─────────────────────────────────────────────────────────
function GrandfatherClock({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const handRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (handRef.current)
      handRef.current.rotation.z = -clock.getElapsedTime() * 0.2;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.52, ROOM_HEIGHT * 0.85, 0.28]} />
        <meshStandardMaterial color="#2a1408" roughness={0.5} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT * 0.22, 0.15]}>
        <circleGeometry args={[0.18, 24]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.3} />
      </mesh>
      <mesh ref={handRef} position={[0, ROOM_HEIGHT * 0.22, 0.16]}>
        <boxGeometry args={[0.02, 0.14, 0.01]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT * 0.42, 0.15]}>
        <boxGeometry args={[0.42, 0.04, 0.01]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ── Hotel card on desk ────────────────────────────────────────────────────────
function HotelCard({
  position,
  option,
  accent,
  index,
  isActive,
  onClick,
}: {
  position: [number, number, number];
  option: AccommodationOption;
  accent: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 680;
    canvas.height = 1050;
    const ctx = canvas.getContext("2d")!;

    // Parchment background
    const bg = ctx.createLinearGradient(0, 0, 0, 1050);
    bg.addColorStop(0, "#f8f2e4");
    bg.addColorStop(1, "#e8dcc8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 680, 1050);

    // Outer border
    ctx.strokeStyle = accent + "90";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 664, 1034);
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 644, 1014);

    // Header band
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 680, 130);

    // Hotel name
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 52px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 6;
    ctx.fillText(option.name.slice(0, 18), 340, 65);
    ctx.shadowBlur = 0;

    // Stars
    if (option.stars) {
      ctx.font = "36px serif";
      ctx.fillText("★".repeat(option.stars), 340, 108);
    }

    // Price — large and bold
    if (option.pricePerNight) {
      ctx.fillStyle = "#1a0e04";
      ctx.font = "bold 72px serif";
      ctx.fillText(option.pricePerNight, 340, 260);
    }

    // Distance
    if (option.distanceFromVenue) {
      ctx.fillStyle = accent;
      ctx.font = "bold italic 42px serif";
      ctx.fillText(option.distanceFromVenue, 340, 355);
    }

    // Divider
    ctx.strokeStyle = accent + "60";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 400);
    ctx.lineTo(600, 400);
    ctx.stroke();

    // Description — word-wrapped, large font
    if (option.description) {
      ctx.fillStyle = "#2a1808";
      ctx.font = "italic 34px serif";
      const words = option.description.split(" ");
      let line = "";
      let y = 455;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 580 && line) {
          ctx.fillText(line.trim(), 340, y);
          line = word + " ";
          y += 46;
          if (y > 860) break;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line.trim(), 340, y);
    }

    // Second divider
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 900);
    ctx.lineTo(600, 900);
    ctx.stroke();

    // Tap hint
    ctx.fillStyle = accent + "cc";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("▼  TAP FOR FULL DETAILS  ▼", 340, 980);

    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate =
        true;
    }
    return () => tex.dispose();
  }, [option, accent]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        rotation={[0, (index - 1.5) * 0.18, 0]}
        scale={hovered || isActive ? [1.08, 1.08, 1] : [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
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
        <boxGeometry args={[0.68, 1.05, 0.008]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.85} />
      </mesh>

      {(hovered || isActive) && (
        <pointLight
          position={[position[0], position[1], position[2] + 0.3]}
          color={accent}
          intensity={1.5}
          distance={2}
          decay={2}
        />
      )}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function AccommodationRoom({
  theme,
  accommodation,
  onCardOpen,
}: AccommodationRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;
  const options = accommodation?.options ?? [];

  const openHotelIndex = useRoomsStore((s) => s.openHotelIndex);

  return (
    <group>
      {/* ── Brass chandelier ── */}
      <Chandelier
        position={[0, ROOM_HEIGHT / 2 - 0.25, -ROOM_LENGTH * 0.5]}
        accent={accent}
      />

      {/* ── Reception desk — mid room facing camera ── */}
      <ReceptionDesk
        position={[0, floorY, -ROOM_LENGTH * 0.52]}
        accent={accent}
      />

      {/* ── Hotel key wall on back wall ── */}
      <KeyWall options={options} accent={accent} />

      {/* ── Hotel cards fanned on desk ── */}
      {options.slice(0, 4).map((opt, i) => (
        <HotelCard
          key={i}
          position={[
            -0.75 + i * 0.52,
            floorY + 1.06,
            -ROOM_LENGTH * 0.52 + 0.32,
          ]}
          option={opt}
          accent={accent}
          index={i}
          isActive={openHotelIndex === i}
          onClick={() => useRoomsStore.getState().setOpenHotelIndex(i)}
        />
      ))}

      {/* ── Potted palms — left and right sides ── */}
      <PottedPalm
        position={[-ROOM_WIDTH / 2 + 0.8, floorY + 0.55, -ROOM_LENGTH * 0.35]}
        accent={accent}
      />
      <PottedPalm
        position={[ROOM_WIDTH / 2 - 0.8, floorY + 0.55, -ROOM_LENGTH * 0.35]}
        accent={accent}
      />
      <PottedPalm
        position={[-ROOM_WIDTH / 2 + 0.8, floorY + 0.55, -ROOM_LENGTH * 0.72]}
        accent={accent}
      />
      <PottedPalm
        position={[ROOM_WIDTH / 2 - 0.8, floorY + 0.55, -ROOM_LENGTH * 0.72]}
        accent={accent}
      />

      {/* ── Grandfather clock — right corner ── */}
      <GrandfatherClock
        position={[
          ROOM_WIDTH / 2 - 0.35,
          floorY + ROOM_HEIGHT * 0.42,
          -ROOM_LENGTH * 0.85,
        ]}
        accent={accent}
      />

      {/* ── Marble floor inlay ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY + 0.003, -ROOM_LENGTH * 0.5]}
      >
        <planeGeometry args={[ROOM_WIDTH * 0.7, ROOM_LENGTH * 0.6]} />
        <meshStandardMaterial
          color="#e8e0d8"
          roughness={0.08}
          metalness={0.05}
        />
      </mesh>

      {/* ── Ceiling beam / cornice ── */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.06, -ROOM_LENGTH * 0.5]}>
        <boxGeometry args={[ROOM_WIDTH, 0.1, 0.18]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.8} />
      </mesh>

      {/* ── Wall sconce lights ── */}
      {([-ROOM_WIDTH / 2 + 0.1, ROOM_WIDTH / 2 - 0.1] as number[]).map(
        (x, i) => (
          <group key={i} position={[x, 0.8, -ROOM_LENGTH * 0.45]}>
            <mesh>
              <boxGeometry args={[0.06, 0.22, 0.06]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            <pointLight
              color="#fff8e0"
              intensity={1.2}
              distance={4}
              decay={2}
            />
          </group>
        ),
      )}

      {/* ── Additional ambient fill lights ── */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.3]}
        color="#fff5e0"
        intensity={3.0}
        distance={8}
        decay={1.5}
      />
      <pointLight
        position={[-ROOM_WIDTH / 2 + 0.8, 0.5, -ROOM_LENGTH * 0.6]}
        color="#fff8e8"
        intensity={2.0}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[ROOM_WIDTH / 2 - 0.8, 0.5, -ROOM_LENGTH * 0.6]}
        color="#fff8e8"
        intensity={2.0}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0, 0, -ROOM_LENGTH * 0.75]}
        color="#fff5e0"
        intensity={1.8}
        distance={7}
        decay={1.8}
      />
    </group>
  );
}
