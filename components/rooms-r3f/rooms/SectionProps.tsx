"use client";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { getHost1Name, getHost2Name } from "@/lib/eventHelpers";
import { EventConfig, getVocabulary } from "@/types/event";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { HeroRoom } from "./sections/HeroRoom";
import { ScratchRoom } from "./sections/ScratchRoom";

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
  const bookColors =
    featureMode === "arcade"
      ? ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff4444"]
      : featureMode === "garden"
        ? ["#4a6741", "#8b6340", "#6b8b5a", "#c4a35a", "#3d5636"]
        : featureMode === "beach"
          ? ["#87ceeb", "#ff6b6b", "#c4a35a", "#6bb8d9", "#ff8844"]
          : ["#8b3a3a", "#3a5a8b", "#3a8b3a", "#8b6b3a", "#5a3a8b"];

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[2.4, ROOM_HEIGHT * 0.7, 0.3]} />
        <meshStandardMaterial color={shelfCol} roughness={0.7} />
      </mesh>
      {/* Book spines — 3 shelves × 8 books */}
      {[0, 1, 2].map((shelf) =>
        Array.from({ length: 8 }).map((_, b) => (
          <mesh
            key={`${shelf}-${b}`}
            position={[
              -1.0 + b * 0.28,
              -ROOM_HEIGHT * 0.25 + shelf * 0.38,
              0.1,
            ]}
          >
            <boxGeometry args={[0.22, 0.34, 0.16]} />
            <meshStandardMaterial
              color={bookColors[b % bookColors.length]}
              roughness={0.8}
            />
          </mesh>
        )),
      )}
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
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH / 2]}
      />
      {/* Banker's lamp */}
      <Lamp
        featureMode={featureMode}
        position={[-0.6, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH / 2 - 0.1]}
      />
      {/* Bookshelves on side walls */}
      <Bookshelf
        featureMode={featureMode}
        position={[-ROOM_WIDTH / 2 + 0.2, 0, -ROOM_LENGTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Bookshelf
        featureMode={featureMode}
        position={[ROOM_WIDTH / 2 - 0.2, 0, -ROOM_LENGTH / 2]}
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
        position={[-ROOM_WIDTH / 2 + 0.15, 0, -ROOM_LENGTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Right wall — HOURS */}
      <ClockFace
        featureMode={featureMode}
        label="HOURS"
        position={[ROOM_WIDTH / 2 - 0.15, 0, -ROOM_LENGTH / 2]}
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
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH / 2]}
      />
      {/* Large binder on table */}
      <mesh position={[0, -ROOM_HEIGHT / 2 + 0.9, -ROOM_LENGTH / 2 - 0.1]}>
        <boxGeometry args={[0.6, 0.08, 0.45]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>
      <Lamp
        featureMode={featureMode}
        position={[0.7, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH / 2 + 0.3]}
      />
      {/* Wall shelves — both sides */}
      <Bookshelf
        featureMode={featureMode}
        position={[-ROOM_WIDTH / 2 + 0.2, 0, -ROOM_LENGTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Bookshelf
        featureMode={featureMode}
        position={[ROOM_WIDTH / 2 - 0.2, 0, -ROOM_LENGTH / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* Back wall shelves */}
      <Bookshelf
        featureMode={featureMode}
        position={[0, 0, -ROOM_LENGTH + 0.2]}
        rotation={[0, 0, 0]}
      />
      {/* Armchairs */}
      {([-1.8, 1.8] as number[]).map((x, i) => (
        <group key={i} position={[x, -ROOM_HEIGHT / 2, -ROOM_LENGTH / 2 + 1.5]}>
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
        position={[0, -ROOM_HEIGHT / 2, -ROOM_LENGTH / 2]}
      />
      {/* Spinning globe */}
      <group position={[2.5, -ROOM_HEIGHT / 2 + 1.2, -ROOM_LENGTH / 2]}>
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
      <mesh position={[0, -ROOM_HEIGHT / 2 + 0.42, -ROOM_LENGTH / 2]}>
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
          position={[x, -ROOM_HEIGHT / 2 + 0.55, -ROOM_LENGTH / 2]}
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
        position={[0, -ROOM_HEIGHT / 2 + 0.0, -ROOM_LENGTH / 2]}
      />
      <Lamp
        featureMode={featureMode}
        position={[-0.6, -ROOM_HEIGHT / 2 + 1.1, -ROOM_LENGTH / 2 - 0.1]}
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
      return <CountdownProps featureMode={featureMode} theme={theme} />;
    case "faq":
      return <LibraryProps featureMode={featureMode} theme={theme} />;
    case "venue":
      return <MapRoomProps featureMode={featureMode} theme={theme} />;
    case "menu":
      return <BanquetProps featureMode={featureMode} theme={theme} />;
    default:
      return <DefaultProps featureMode={featureMode} theme={theme} />;
  }
}
