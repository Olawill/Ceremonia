"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";

import { getHost1Name, getHost2Name } from "@/lib/eventHelpers";
import { EventConfig, getVocabulary } from "@/types/event";

import { AccommodationRoom } from "@/components/rooms-r3f/rooms/sections/AccommodationRoom";
import { CountdownRoom } from "@/components/rooms-r3f/rooms/sections/CountdownRoom";
import { DressCodeRoom } from "@/components/rooms-r3f/rooms/sections/DressCodeRoom";
import { EventPartyRoom } from "@/components/rooms-r3f/rooms/sections/EventPartyRoom";
import { FAQRoom } from "@/components/rooms-r3f/rooms/sections/FAQRoom";
import { GalleryPhotoRoom } from "@/components/rooms-r3f/rooms/sections/GalleryPhotoRoom";
import { HeroRoom } from "@/components/rooms-r3f/rooms/sections/HeroRoom";
import {
  FinaleRoom,
  GuestbookRoom,
  LivestreamRoom,
  MenuRoom,
  RegistryRoom,
  RSVPRoom,
  TravelRoom,
} from "@/components/rooms-r3f/rooms/sections/Remainingrooms";
import { ScratchRoom } from "@/components/rooms-r3f/rooms/sections/ScratchRoom";
import { TimelineRoom } from "@/components/rooms-r3f/rooms/sections/TimelineRoom";
import { VenueRoom } from "@/components/rooms-r3f/rooms/sections/VenueRoom";

interface SectionPropsProps {
  sectionKey: string;
  featureMode: FeatureMode;
  theme: RoomTheme;
  config?: EventConfig;
  onDateRevealed?: () => void;
}

// ── Shared material helpers ────────────────────────────────────────────────

function deskColor(featureMode: FeatureMode): string {
  switch (featureMode) {
    case "castle":
      return "#3a2510"; // dark mahogany
    case "farm":
      return "#8b6340"; // rough pine
    case "arcade":
      return "#0a0a1e"; // black gloss
    case "garden":
      return "#5a7a40"; // mossy wood
    case "beach":
      return "#c4a35a"; // driftwood
  }
}

function accentMetal(featureMode: FeatureMode): string {
  switch (featureMode) {
    case "castle":
      return "#d4af37"; // gold
    case "farm":
      return "#c4a35a"; // brass
    case "arcade":
      return "#00ffff"; // cyan neon
    case "garden":
      return "#f4a460"; // copper
    case "beach":
      return "#ff6b6b"; // coral
  }
}

// ── Reusable desk shape ────────────────────────────────────────────────────

function Desk({
  featureMode,
  position = [0, 0, 0],
}: {
  featureMode: FeatureMode;
  position?: [number, number, number];
}) {
  const col = deskColor(featureMode);
  const acc = accentMetal(featureMode);
  return (
    <group position={position}>
      {/* Surface */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.2, 0.08, 1.1]} />
        <meshStandardMaterial
          color={col}
          roughness={featureMode === "arcade" ? 0.1 : 0.4}
          metalness={featureMode === "arcade" ? 0.6 : 0.05}
        />
      </mesh>
      {/* Legs */}
      {(
        [
          [-0.95, -0.45],
          [-0.95, 0.45],
          [0.95, -0.45],
          [0.95, 0.45],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color={col} roughness={0.6} />
        </mesh>
      ))}
      {/* Accent strip along front edge */}
      <mesh position={[0, 0.45, 0.56]}>
        <boxGeometry args={[2.2, 0.04, 0.02]} />
        <meshStandardMaterial color={acc} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Emissive lamp ──────────────────────────────────────────────────────────

function Lamp({
  featureMode,
  position = [0, 0, 0],
}: {
  featureMode: FeatureMode;
  position?: [number, number, number];
}) {
  const lampCol =
    featureMode === "garden"
      ? "#4a8a30"
      : featureMode === "arcade"
        ? "#ff00ff"
        : featureMode === "beach"
          ? "#ff8844"
          : "#2a5a2a";
  const glowCol =
    featureMode === "arcade"
      ? "#ff00ff"
      : featureMode === "beach"
        ? "#ffaa55"
        : "#aadd55";
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.22, 0.28, 8]} />
        <meshStandardMaterial color={lampCol} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial
          color={glowCol}
          emissive={glowCol}
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
        <meshStandardMaterial
          color={accentMetal(featureMode)}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// ── Bookshelf ──────────────────────────────────────────────────────────────

function Bookshelf({
  featureMode,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  featureMode: FeatureMode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const shelfCol = deskColor(featureMode);
  const acc = accentMetal(featureMode);

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

  const SHELF_W = 2.4;
  const SHELF_H = ROOM_HEIGHT * 0.7;
  const SHELF_D = 0.3;
  const NUM_ROWS = 3;
  const rowBottomY = [-SHELF_H * 0.38, -SHELF_H * 0.04, SHELF_H * 0.3];
  const rowTopY = [-SHELF_H * 0.04, SHELF_H * 0.3, SHELF_H * 0.62];

  const bookData = useRef(
    Array.from({ length: NUM_ROWS }, (_, row) => {
      const rowH = rowTopY[row] - rowBottomY[row] - 0.04;
      const books: {
        w: number;
        h: number;
        lean: number;
        colorIdx: number;
        gap: boolean;
      }[] = [];
      let usedW = 0;
      const maxW = SHELF_W - 0.18;
      let i = 0;
      while (usedW < maxW - 0.1 && i < 20) {
        const w = 0.13 + ((i * 7 + row * 3) % 7) * 0.018;
        const h = rowH * (0.65 + ((i * 5 + row * 11) % 10) * 0.035);
        const lean =
          (i * 3 + row * 7) % 5 === 0 ? (i % 2 === 0 ? 1 : -1) * 0.08 : 0;
        const gap = (i * row + i) % 11 === 0 && i > 0;
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
      {/* Back panel */}
      <mesh position={[0, 0, -SHELF_D / 2 + 0.02]}>
        <boxGeometry args={[SHELF_W, SHELF_H, 0.04]} />
        <meshStandardMaterial color={shelfCol} roughness={0.75} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-SHELF_W / 2 + 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      <mesh position={[SHELF_W / 2 - 0.04, 0, 0]}>
        <boxGeometry args={[0.06, SHELF_H, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* Top and bottom */}
      <mesh position={[0, SHELF_H / 2 - 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      <mesh position={[0, -SHELF_H / 2 + 0.03, 0]}>
        <boxGeometry args={[SHELF_W, 0.06, SHELF_D]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>

      {/* Shelf planks */}
      {rowBottomY.map((y, i) => (
        <mesh key={`plank-${i}`} position={[0, y, 0]}>
          <boxGeometry args={[SHELF_W - 0.08, 0.04, SHELF_D - 0.04]} />
          <meshStandardMaterial color={shelfCol} roughness={0.65} />
        </mesh>
      ))}

      {/* Books */}
      {bookData.current.map((shelfBooks, row) => {
        const plankY = rowBottomY[row] + 0.02;
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
              <mesh>
                <boxGeometry args={[book.w, book.h, SHELF_D * 0.7]} />
                <meshStandardMaterial
                  color={bookCols[book.colorIdx]}
                  roughness={0.85}
                />
              </mesh>
              <mesh position={[0, 0, SHELF_D * 0.36]}>
                <boxGeometry args={[book.w - 0.01, book.h - 0.02, 0.008]} />
                <meshStandardMaterial
                  color={bookCols[book.colorIdx]}
                  roughness={0.5}
                  emissive={bookCols[book.colorIdx]}
                  emissiveIntensity={0.08}
                />
              </mesh>
              <mesh position={[0, book.h / 2 - 0.006, 0]}>
                <boxGeometry args={[book.w - 0.01, 0.01, SHELF_D * 0.65]} />
                <meshStandardMaterial color="#f0ead8" roughness={0.9} />
              </mesh>
            </group>
          );
        });
      })}

      {/* Bookends */}
      {([-1, 1] as const).map((side, i) => (
        <mesh
          key={`bookend-${i}`}
          position={[side * (SHELF_W / 2 - 0.16), rowBottomY[0] + 0.09, 0.02]}
        >
          <boxGeometry args={[0.04, 0.18, SHELF_D * 0.6]} />
          <meshStandardMaterial color={acc} roughness={0.25} metalness={0.8} />
        </mesh>
      ))}

      {/* Crown rail */}
      <mesh position={[0, SHELF_H / 2 + 0.04, 0.02]}>
        <boxGeometry args={[SHELF_W + 0.04, 0.06, 0.06]} />
        <meshStandardMaterial color={acc} roughness={0.2} metalness={0.85} />
      </mesh>
    </group>
  );
}

// ── Grandfather clock face ─────────────────────────────────────────────────

function ClockFace({
  featureMode,
  label,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  featureMode: FeatureMode;
  label: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const handRef = useRef<THREE.Mesh>(null);
  const faceCol =
    featureMode === "arcade"
      ? "#0a0a1e"
      : featureMode === "beach"
        ? "#f5e6c8"
        : "#f0ead8";

  useFrame(({ clock }) => {
    if (handRef.current) {
      handRef.current.rotation.z = -clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Clock housing */}
      <mesh>
        <boxGeometry args={[1.2, 2.2, 0.25]} />
        <meshStandardMaterial color={deskColor(featureMode)} roughness={0.5} />
      </mesh>
      {/* Clock face */}
      <mesh position={[0, 0.4, 0.14]}>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial color={faceCol} roughness={0.3} />
      </mesh>
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i / 12) * Math.PI * 2) * 0.36,
            0.4 + Math.cos((i / 12) * Math.PI * 2) * 0.36,
            0.15,
          ]}
        >
          <boxGeometry args={[0.03, 0.08, 0.02]} />
          <meshStandardMaterial
            color={accentMetal(featureMode)}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}
      {/* Animated hand */}
      <mesh ref={handRef} position={[0, 0.4, 0.16]}>
        <boxGeometry args={[0.03, 0.3, 0.02]} />
        <meshStandardMaterial
          color={accentMetal(featureMode)}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      {/* Label */}
      <mesh position={[0, -0.55, 0.14]}>
        <planeGeometry args={[0.9, 0.18]} />
        <meshStandardMaterial
          color={accentMetal(featureMode)}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

// ── Section prop sets ──────────────────────────────────────────────────────

function HeroProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const acc = accentMetal(featureMode);
  // Welcoming banner on back wall
  return (
    <group>
      <mesh position={[0, 0.5, -ROOM_LENGTH + 0.1]}>
        <planeGeometry args={[ROOM_WIDTH * 0.7, ROOM_HEIGHT * 0.55]} />
        <meshStandardMaterial
          color={theme.curtain}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Banner rod */}
      <mesh
        position={[0, ROOM_HEIGHT * 0.35, -ROOM_LENGTH + 0.08]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.04, 0.04, ROOM_WIDTH * 0.75, 8]} />
        <meshStandardMaterial color={acc} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

function VaultProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  return (
    <group>
      {/* Central writing desk */}
      <Desk
        featureMode={featureMode}
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH * 0.65]}
      />
      {/* Banker's lamp */}
      <Lamp
        featureMode={featureMode}
        position={[-0.6, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH * 0.65 - 0.1]}
      />
      {/* Bookshelves on side walls */}
      <Bookshelf
        featureMode={featureMode}
        position={[
          -ROOM_WIDTH / 2 + 0.2,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Bookshelf
        featureMode={featureMode}
        position={[
          ROOM_WIDTH / 2 - 0.2,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* Scratch card surface — gold frame on desk */}
      <mesh position={[0.3, -ROOM_HEIGHT / 2 + 0.85, -ROOM_LENGTH / 2 - 0.05]}>
        <boxGeometry args={[0.8, 0.04, 0.6]} />
        <meshStandardMaterial
          color={accentMetal(featureMode)}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function CountdownProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  return (
    <group>
      {/* Four grandfather clocks — one on each wall face */}
      {/* Back wall — DAYS (largest) */}
      <ClockFace
        featureMode={featureMode}
        label="DAYS"
        position={[0, 0, -ROOM_LENGTH + 0.15]}
      />
      {/* Left wall — MINUTES */}
      <ClockFace
        featureMode={featureMode}
        label="MINUTES"
        position={[-ROOM_WIDTH / 2 + 0.15, 0, -ROOM_LENGTH * 0.65]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Right wall — HOURS */}
      <ClockFace
        featureMode={featureMode}
        label="HOURS"
        position={[ROOM_WIDTH / 2 - 0.15, 0, -ROOM_LENGTH * 0.65]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* Floor compass rose */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH / 2]}
      >
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color={accentMetal(featureMode)}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

function LibraryProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  return (
    <group>
      {/* Central reading table */}
      <Desk
        featureMode={featureMode}
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH * 0.65]}
      />
      {/* Large binder on table */}
      <mesh position={[0, -ROOM_HEIGHT / 2 + 0.9, -ROOM_LENGTH / 2 - 0.1]}>
        <boxGeometry args={[0.6, 0.08, 0.45]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>
      <Lamp
        featureMode={featureMode}
        position={[0.7, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH * 0.6]}
      />
      {/* Wall shelves — both sides */}
      {/* Side wall shelves — bottom sits on floor */}
      <Bookshelf
        featureMode={featureMode}
        position={[
          -ROOM_WIDTH / 2 + 0.2,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Bookshelf
        featureMode={featureMode}
        position={[
          ROOM_WIDTH / 2 - 0.2,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH * 0.65,
        ]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* Back wall shelf — slightly offset so it clears the wall face */}
      <Bookshelf
        featureMode={featureMode}
        position={[
          0,
          -ROOM_HEIGHT / 2 + (ROOM_HEIGHT * 0.7) / 2,
          -ROOM_LENGTH + 0.18,
        ]}
        rotation={[0, 0, 0]}
      />
      {/* Armchairs */}
      {([-1.8, 1.8] as number[]).map((x, i) => (
        <group key={i} position={[x, -ROOM_HEIGHT / 2, -ROOM_LENGTH * 0.5]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.8]} />
            <meshStandardMaterial
              color={deskColor(featureMode)}
              roughness={0.6}
            />
          </mesh>
          <mesh position={[0, 0.6, -0.36]}>
            <boxGeometry args={[0.8, 0.5, 0.1]} />
            <meshStandardMaterial
              color={deskColor(featureMode)}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MapRoomProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.2;
  });
  return (
    <group>
      {/* Central table */}
      <Desk
        featureMode={featureMode}
        position={[0, -ROOM_HEIGHT / 2, -ROOM_LENGTH * 0.65]}
      />
      {/* Spinning globe */}
      <group position={[2.5, -ROOM_HEIGHT / 2 + 1.2, -ROOM_LENGTH * 0.65]}>
        <mesh ref={globeRef}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshStandardMaterial
            color="#2a4a6a"
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
        {/* Stand */}
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.05, 0.18, 0.2, 8]} />
          <meshStandardMaterial
            color={accentMetal(featureMode)}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </group>
      {/* Back wall map — large parchment plane */}
      <mesh position={[0, 0.3, -ROOM_LENGTH + 0.08]}>
        <planeGeometry args={[ROOM_WIDTH * 0.75, ROOM_HEIGHT * 0.55]} />
        <meshStandardMaterial color="#d4b483" roughness={0.85} />
      </mesh>
      {/* Map pin */}
      <mesh position={[0.5, 0.5, -ROOM_LENGTH + 0.1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#cc2222"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function BanquetProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const acc = accentMetal(featureMode);
  return (
    <group>
      {/* Long dining table */}
      <mesh position={[0, -ROOM_HEIGHT / 2 + 0.42, -ROOM_LENGTH * 0.62]}>
        <boxGeometry args={[ROOM_WIDTH * 0.7, 0.08, 2.0]} />
        <meshStandardMaterial color={deskColor(featureMode)} roughness={0.3} />
      </mesh>
      {/* Table legs */}
      {(
        [
          [-2.8, -0.8],
          [-2.8, 0.8],
          [2.8, -0.8],
          [2.8, 0.8],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh
          key={i}
          position={[x, -ROOM_HEIGHT / 2 + 0.2, -ROOM_LENGTH / 2 + z]}
        >
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial
            color={deskColor(featureMode)}
            roughness={0.5}
          />
        </mesh>
      ))}
      {/* Candelabras (emissive) */}
      {([-1.5, 0, 1.5] as number[]).map((x, i) => (
        <group
          key={i}
          position={[x, -ROOM_HEIGHT / 2 + 0.55, -ROOM_LENGTH * 0.62]}
        >
          <mesh>
            <cylinderGeometry args={[0.04, 0.06, 0.35, 8]} />
            <meshStandardMaterial color={acc} roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color="#ffeeaa"
              emissive="#ffeeaa"
              emissiveIntensity={2.0}
            />
          </mesh>
        </group>
      ))}
      {/* Menu scrolls on back wall */}
      {([-2.5, 0, 2.5] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.5, -ROOM_LENGTH + 0.08]}>
          <planeGeometry args={[1.6, 2.2]} />
          <meshStandardMaterial color="#d4b483" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function DefaultProps({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  // Generic props for sections without a specific layout — desk + lamp
  return (
    <group>
      <Desk
        featureMode={featureMode}
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH * 0.65]}
      />
      <Lamp
        featureMode={featureMode}
        position={[-0.6, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH * 0.65 - 0.1]}
      />
    </group>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function SectionProps({
  sectionKey,
  featureMode,
  theme,
  config,
  onDateRevealed,
}: SectionPropsProps) {
  switch (sectionKey) {
    case "hero":
      return (
        <HeroRoom
          featureMode={featureMode}
          theme={theme}
          bride={config ? getHost1Name(config) : undefined}
          groom={config ? getHost2Name(config) : undefined}
          tagLine={config?.tagLine}
          topLabel={
            config ? getVocabulary(config.eventType).topLabel : undefined
          }
          eventType={config?.eventType}
          heroPhotoUrl={config?.heroPhotoUrl}
        />
      );
    case "scratch":
      return (
        <ScratchRoom
          featureMode={featureMode}
          theme={theme}
          date={config?.date}
          onRevealed={onDateRevealed ?? (() => {})}
          revealTitle={
            config ? getVocabulary(config.eventType).revealTitle : undefined
          }
          revealHint={
            config ? getVocabulary(config.eventType).revealHint : undefined
          }
          eventType={config?.eventType}
        />
      );
    case "countdown":
      return (
        <CountdownRoom
          featureMode={featureMode}
          theme={theme}
          date={config?.date}
          location={config?.venueDetails?.find((d) => d.label === "Location")}
          eventLabel={
            config ? getVocabulary(config.eventType).eventLabel : undefined
          }
        />
      );
    case "timeline":
      return (
        <TimelineRoom
          featureMode={featureMode}
          theme={theme}
          events={config?.timeline}
          sectionLabel={
            config ? getVocabulary(config.eventType).timelineLabel : undefined
          }
        />
      );
    case "venue":
      return (
        <VenueRoom
          featureMode={featureMode}
          theme={theme}
          details={config?.venueDetails}
          sectionLabel={
            config ? getVocabulary(config.eventType).venueLabel : undefined
          }
        />
      );
    case "gallery":
      return (
        <GalleryPhotoRoom
          featureMode={featureMode}
          theme={theme}
          photos={config?.galleryPhotos}
          sectionLabel={
            config ? getVocabulary(config.eventType).galleryLabel : undefined
          }
        />
      );
    case "dresscode":
      return config?.dressCode ? (
        <DressCodeRoom
          featureMode={featureMode}
          theme={theme}
          dressCode={config.dressCode}
        />
      ) : (
        <DefaultProps featureMode={featureMode} theme={theme} />
      );
    case "accommodation":
      return (
        <AccommodationRoom
          featureMode={featureMode}
          theme={theme}
          accommodation={config?.accommodation}
          sectionLabel={
            config
              ? getVocabulary(config.eventType).accommodationCardLabel
              : undefined
          }
        />
      );

    case "eventParty":
      return (
        <EventPartyRoom
          featureMode={featureMode}
          theme={theme}
          members={config?.eventParty}
          bride={config?.bride}
          groom={config?.groom}
        />
      );

    case "faq":
      return (
        <FAQRoom
          featureMode={featureMode}
          theme={theme}
          items={config?.faq}
          sectionLabel={
            config ? getVocabulary(config.eventType).faqLabel : undefined
          }
        />
      );

    case "rsvp":
      return (
        <RSVPRoom
          featureMode={featureMode}
          theme={theme}
          rsvpDeadline={config?.rsvpDeadline}
          eventLabel={
            config ? getVocabulary(config.eventType).eventLabel : undefined
          }
        />
      );

    case "guestbook":
      return <GuestbookRoom featureMode={featureMode} theme={theme} />;

    case "travel":
      return (
        <TravelRoom
          featureMode={featureMode}
          theme={theme}
          items={config?.travelItems}
          city={config?.venueDetails?.find((d) => d.label === "Location")?.sub}
        />
      );

    case "menu":
      return (
        <MenuRoom
          featureMode={featureMode}
          theme={theme}
          courses={config?.menuCourses}
          bride={config?.bride}
          groom={config?.groom}
          date={config?.date}
        />
      );

    case "livestream":
      return (
        <LivestreamRoom
          featureMode={featureMode}
          theme={theme}
          url={config?.livestreamUrl}
          title={config?.livestreamTitle}
          date={config?.date}
          livestreamTime={config?.livestreamTime}
        />
      );

    case "registry":
      return (
        <RegistryRoom featureMode={featureMode} theme={theme} itemCount={0} />
      );

    case "finale":
      return (
        <FinaleRoom
          featureMode={featureMode}
          theme={theme}
          bride={config?.bride}
          groom={config?.groom}
          date={config?.date}
        />
      );
  }
}
