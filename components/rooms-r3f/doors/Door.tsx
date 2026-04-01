"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DoorProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  theme: {
    curtain: string;
    curtainDark: string;
    gold: string;
    goldLight: string;
    bg: string;
    bgMid: string;
    text: string;
  };
  isOpen?: boolean;
  isLocked?: boolean;
}

// ── Gold material helper ──────────────────────────────────────────────────────
function useGoldMaterial(color: string, emissive?: string, emissiveIntensity = 0) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.9,
        roughness: 0.15,
        emissive: emissive ?? color,
        emissiveIntensity,
      }),
    [color, emissive, emissiveIntensity]
  );
}

// ── Door ring (torus) ─────────────────────────────────────────────────────────
function DoorRing({
  position,
  theme,
}: {
  position: [number, number, number];
  theme: DoorProps["theme"];
}) {
  const mat = useGoldMaterial(theme.gold, theme.goldLight, 0.4);
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={mat} castShadow>
      <torusGeometry args={[0.13, 0.028, 16, 32]} />
    </mesh>
  );
}

// ── Gold stud ──────────────────────────────────────────────────────────────────
function GoldStud({
  position,
  theme,
}: {
  position: [number, number, number];
  theme: DoorProps["theme"];
}) {
  const mat = useGoldMaterial(theme.gold, theme.goldLight, 0.3);
  return (
    <mesh position={position} material={mat} castShadow>
      <sphereGeometry args={[0.03, 8, 8]} />
    </mesh>
  );
}

// ── Iron band ──────────────────────────────────────────────────────────────────
function IronBand({
  y,
  width = 1.1,
  depth = 0.04,
  theme,
}: {
  y: number;
  width?: number;
  depth?: number;
  theme: DoorProps["theme"];
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a3530",
        metalness: 0.8,
        roughness: 0.4,
      }),
    []
  );
  return (
    <mesh
      position={[0, y, 0.07]}
      material={mat}
      castShadow
    >
      <boxGeometry args={[width, 0.06, depth]} />
    </mesh>
  );
}

// ── Chains & padlock ──────────────────────────────────────────────────────────
function Chains({
  theme,
}: {
  theme: DoorProps["theme"];
}) {
  const chainMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a4a4a",
        metalness: 0.9,
        roughness: 0.3,
      }),
    []
  );
  const padlockMat = useGoldMaterial(theme.gold, theme.goldLight, 0.5);

  // Two crossed chains
  return (
    <group>
      {/* Horizontal chain */}
      <mesh position={[0, 0.05, 0.14]} rotation={[0, 0, 0]} material={chainMat} castShadow>
        <boxGeometry args={[1.1, 0.04, 0.04]} />
      </mesh>
      {/* Vertical chain */}
      <mesh position={[0, 0.05, 0.14]} rotation={[0, 0, Math.PI / 2]} material={chainMat} castShadow>
        <boxGeometry args={[1.1, 0.04, 0.04]} />
      </mesh>
      {/* Padlock body */}
      <mesh position={[0, 0.05, 0.18]} material={padlockMat} castShadow>
        <boxGeometry args={[0.1, 0.12, 0.06]} />
      </mesh>
      {/* Padlock shackle */}
      <mesh position={[0, 0.14, 0.18]} material={padlockMat} castShadow>
        <torusGeometry args={[0.04, 0.012, 8, 16, Math.PI]} />
      </mesh>
    </group>
  );
}

// ── Main Door component ───────────────────────────────────────────────────────
export default function Door({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  theme,
  isOpen = false,
  isLocked = false,
}: DoorProps) {
  // Door panel refs for swing animation
  const doorRef = useRef<THREE.Group>(null);
  const hazeRef = useRef<THREE.Mesh>(null);
  const targetRotation = isOpen ? -Math.PI / 2 : 0;

  // Gold materials
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.gold,
        metalness: 0.85,
        roughness: 0.2,
        emissive: theme.goldLight,
        emissiveIntensity: 0.1,
      }),
    [theme]
  );

  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a2e1a",
        metalness: 0.1,
        roughness: 0.8,
      }),
    []
  );

  const hazeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: theme.gold,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
      }),
    [theme.gold]
  );

  // Door swing animation
  useFrame((_, delta) => {
    if (!doorRef.current) return;

    const lerpFactor = 1 - Math.exp(-8 * delta);
    doorRef.current.rotation.y = THREE.MathUtils.lerp(
      doorRef.current.rotation.y,
      targetRotation,
      lerpFactor
    );

    // Haze glow animation (behind the door)
    if (hazeRef.current) {
      const hazeMat = hazeRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isOpen ? 0.35 : (isLocked ? 0.0 : 0.08);
      hazeMat.opacity = THREE.MathUtils.lerp(hazeMat.opacity, targetOpacity, lerpFactor);
    }
  });

  const studPositions: [number, number, number][] = [
    [-0.42, 0.55, 0.08],
    [0.42, 0.55, 0.08],
    [-0.42, -0.55, 0.08],
    [0.42, -0.55, 0.08],
    [-0.42, 0.0, 0.08],
    [0.42, 0.0, 0.08],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Gothic arch frame */}
      {/* Left pillar */}
      <mesh position={[-0.65, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.4, 0.12]} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[0.65, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.4, 0.12]} />
      </mesh>
      {/* Top arch */}
      <mesh position={[0, 1.2, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.15, 0.12]} />
      </mesh>
      {/* Arch curve fill - left diagonal */}
      <mesh position={[-0.5, 1.05, 0]} rotation={[0, 0, 0.5]} material={frameMat} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.1]} />
      </mesh>
      {/* Arch curve fill - right diagonal */}
      <mesh position={[0.5, 1.05, 0]} rotation={[0, 0, -0.5]} material={frameMat} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.1]} />
      </mesh>

      {/* Glowing haze behind door */}
      <mesh ref={hazeRef} position={[0, 0, -0.05]} material={hazeMat}>
        <planeGeometry args={[1.2, 2.2]} />
      </mesh>

      {/* Wooden door panel (animated swing) */}
      <group ref={doorRef}>
        {/* Main door panel */}
        <mesh position={[0, 0, 0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[1.1, 2.2, 0.08]} />
        </mesh>

        {/* Iron bands */}
        <IronBand y={0.7} theme={theme} />
        <IronBand y={0.0} theme={theme} />
        <IronBand y={-0.7} theme={theme} />

        {/* Door ring */}
        <DoorRing position={[0.38, -0.1, 0.08]} theme={theme} />

        {/* Gold studs */}
        {studPositions.map((pos, i) => (
          <GoldStud key={i} position={pos} theme={theme} />
        ))}
      </group>

      {/* Chains and padlock when locked */}
      {isLocked && <Chains theme={theme} />}
    </group>
  );
}
