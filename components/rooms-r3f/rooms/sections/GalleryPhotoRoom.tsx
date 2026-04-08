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

interface GalleryPhotoRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  photos?: string[];
  caption?: string;
  sectionLabel?: string;
}

// ── A single framed photo ────────────────────────────────────────────────────

function FramedPhoto({
  src,
  position,
  rotation,
  frameW,
  frameH,
  accent,
  caption,
  isHero = false,
}: {
  src: string;
  position: [number, number, number];
  rotation: [number, number, number];
  frameW: number;
  frameH: number;
  accent: string;
  caption?: string;
  isHero?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const labelMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;

      // White mat board
      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, 512, 512);

      // Photo inset
      const mat = 40;
      ctx.drawImage(img, mat, mat, 512 - mat * 2, 512 - mat * 2);

      const tex = new THREE.CanvasTexture(canvas);
      if (meshRef.current) {
        const mat3 = meshRef.current.material as THREE.MeshStandardMaterial;
        mat3.map = tex;
        mat3.needsUpdate = true;
      }
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!caption) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#1a1008";
    ctx.font = "bold 28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(caption, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    if (labelMeshRef.current) {
      const m = labelMeshRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [caption]);

  const goldColor = accent;
  const frameDepth = isHero ? 0.09 : 0.06;

  return (
    <group position={position} rotation={rotation}>
      {/* Gold moulding frame */}
      <mesh position={[0, 0, -frameDepth / 2 - 0.01]}>
        <boxGeometry args={[frameW + 0.22, frameH + 0.22, frameDepth]} />
        <meshStandardMaterial
          color={goldColor}
          roughness={0.18}
          metalness={0.92}
        />
      </mesh>
      {/* White mat inset */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[frameW + 0.06, frameH + 0.06, 0.03]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
      </mesh>
      {/* Photo surface */}
      <mesh ref={meshRef} position={[0, 0, 0.018]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial color="#888" roughness={0.5} />
      </mesh>
      {/* Gallery spotlight cone above */}
      <mesh position={[0, frameH / 2 + 0.35, -0.1]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.04, 0.22, 8]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      <pointLight
        position={[0, frameH / 2 + 0.28, 0.18]}
        color="#fff8e0"
        intensity={isHero ? 3.0 : 1.6}
        distance={isHero ? 3.5 : 2.2}
        decay={2}
      />
      {/* Museum label card below */}
      {caption && (
        <>
          <mesh position={[0, -(frameH / 2 + 0.18), -0.005]}>
            <boxGeometry args={[frameW * 0.55, 0.22, 0.02]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
          </mesh>
          <mesh ref={labelMeshRef} position={[0, -(frameH / 2 + 0.18), 0.012]}>
            <planeGeometry args={[frameW * 0.53, 0.2]} />
            <meshStandardMaterial roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── Central gallery bench ───────────────────────────────────────────────────

function GalleryBench({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[2.4, 0.06, 0.42]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.5} />
      </mesh>
      {/* Legs */}
      {(
        [
          [-1.0, -0.18],
          [1.0, -0.18],
          [-1.0, 0.18],
          [1.0, 0.18],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <boxGeometry args={[0.06, 0.28, 0.06]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
      ))}
      {/* Cross brace */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.1, 0.04, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
    </group>
  );
}

// ── Fallback placeholder frame (no photo) ───────────────────────────────────

function PlaceholderFrame({
  position,
  rotation,
  frameW,
  frameH,
  accent,
  index,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  frameW: number;
  frameH: number;
  accent: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f0ead8";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accent + "60";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 224, 224);
    ctx.fillStyle = accent + "80";
    ctx.font = "bold 80px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [accent, index]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[frameW + 0.22, frameH + 0.22, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.18} metalness={0.9} />
      </mesh>
      <mesh ref={meshRef} position={[0, 0, 0.01]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial color="#ccc" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ScrollingStrip

function ScrollingStrip({
  photos,
  caption,
  accent,
}: {
  photos: string[];
  caption?: string;
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const FRAME_SPACING = 1.55; // gap between frame centres
  const FRAME_W = 1.1;
  const FRAME_H = 1.1;
  const totalWidth = photos.length * FRAME_SPACING;

  // Initialise position so first photo is visible on entry
  // Centre the visible window roughly in front of the camera
  const INITIAL_OFFSET = -(totalWidth / 2 - FRAME_SPACING / 2);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x -= delta * 0.55;
    // Reset after scrolling exactly one full set — second copy seamlessly takes over
    if (groupRef.current.position.x < INITIAL_OFFSET - totalWidth) {
      groupRef.current.position.x = INITIAL_OFFSET;
    }
  });

  // Duplicate the strip so the loop is seamless
  const allPhotos = [...photos, ...photos];

  return (
    <group ref={groupRef} position={[INITIAL_OFFSET, 0, 0]}>
      {allPhotos.map((src, i) => (
        <FramedPhoto
          key={i}
          src={src}
          position={[
            // i * FRAME_SPACING - (photos.length * FRAME_SPACING) / 2,
            i * FRAME_SPACING, // start from 0, no centering offset
            0.3,
            -ROOM_LENGTH * 0.52,
          ]}
          rotation={[0, 0, 0]}
          frameW={FRAME_W}
          frameH={FRAME_H}
          accent={accent}
          caption={caption}
        />
      ))}
    </group>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function GalleryPhotoRoom({
  theme,
  photos = [],
  caption,
}: GalleryPhotoRoomProps) {
  const accent = theme.accent;

  // const wallZ = -ROOM_LENGTH + 0.12;
  const floorY = -ROOM_HEIGHT / 2;

  return (
    <group>
      {/* ── Scrolling film strip of all photos ── */}
      <ScrollingStrip photos={photos} caption={caption} accent={accent} />

      {/* ── Hero photo — always the first photo, static on back wall ── */}
      {photos[0] ? (
        <FramedPhoto
          src={photos[0]}
          position={[0, 0.45, -ROOM_LENGTH + 0.12]}
          rotation={[0, 0, 0]}
          frameW={2.2}
          frameH={2.0}
          accent={accent}
          caption={caption}
          isHero
        />
      ) : (
        <PlaceholderFrame
          position={[0, 0.45, -ROOM_LENGTH + 0.12]}
          rotation={[0, 0, 0]}
          frameW={2.2}
          frameH={2.0}
          accent={accent}
          index={0}
        />
      )}
      {/* ── Gallery rail along ceiling ── */}
      <mesh
        position={[0, ROOM_HEIGHT / 2 - 0.08, -ROOM_LENGTH * 0.5]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.025, 0.025, ROOM_WIDTH - 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ── Central bench ── */}
      <GalleryBench
        position={[0, floorY, -ROOM_LENGTH * 0.55]}
        accent={accent}
      />

      {/* ── Ambient ceiling track light strip ── */}
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH * 0.5]}
        color="#fff8e8"
        intensity={2.5}
        distance={8}
        decay={1.5}
      />
    </group>
  );
}
