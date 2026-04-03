"use client";

import * as THREE from "three";

import {
  ROOM_ASSETS,
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import { ArcadeShell } from "@/components/rooms-r3f/rooms/ArcadeShell";
import { BakedRoom } from "@/components/rooms-r3f/rooms/BakedRoom";
import { BeachShell } from "@/components/rooms-r3f/rooms/BeachShell";
import { CastleShell } from "@/components/rooms-r3f/rooms/CastleShell";
import { Chandelier } from "@/components/rooms-r3f/rooms/Chandelier";
import { FarmShell } from "@/components/rooms-r3f/rooms/FarmShell";
import { GardenShell } from "@/components/rooms-r3f/rooms/GardenShell";
import { SectionProps } from "@/components/rooms-r3f/rooms/SectionProps";
import { TorchSconce } from "@/components/rooms-r3f/rooms/TorchSconce";

import { hexCol } from "@/lib/roomTextures";
import { EventConfig, FeatureMode } from "@/types/event";

export interface RoomTheme {
  floor: string;
  floorAlt: string;
  wall: string;
  wallDark: string;
  accent: string;
  ceiling: string;
  curtain: string;
  curtainDark: string;
}

export type { FeatureMode } from "@/types/event";

export const FEATURE_THEMES: Record<FeatureMode, RoomTheme> = {
  castle: {
    floor: "#4a3728",
    floorAlt: "#3d2d20",
    wall: "#6b5344",
    wallDark: "#4a3728",
    accent: "#d4af37",
    ceiling: "#5a4636",
    curtain: "#8b3a3a",
    curtainDark: "#5a2020",
  },
  farm: {
    floor: "#8b7355",
    floorAlt: "#6b5340",
    wall: "#a08060",
    wallDark: "#7a6548",
    accent: "#c4a35a",
    ceiling: "#9a8565",
    curtain: "#7a3a3a",
    curtainDark: "#5a2020",
  },
  arcade: {
    floor: "#1a1a2e",
    floorAlt: "#16162a",
    wall: "#2a2a4e",
    wallDark: "#1a1a38",
    accent: "#00ffff",
    ceiling: "#0f0f1e",
    curtain: "#1a1a4e",
    curtainDark: "#0f0f2e",
  },
  garden: {
    floor: "#4a6741",
    floorAlt: "#3d5636",
    wall: "#6b8b5a",
    wallDark: "#4a6340",
    accent: "#f4a460",
    ceiling: "#5a7550",
    curtain: "#4a6741",
    curtainDark: "#3d5636",
  },
  beach: {
    floor: "#c4a35a",
    floorAlt: "#a08040",
    wall: "#87ceeb",
    wallDark: "#6bb8d9",
    accent: "#ff6b6b",
    ceiling: "#b8d4e8",
    curtain: "#87ceeb",
    curtainDark: "#6bb8d9",
  },
};

function CastleDecorations({ theme }: { theme: RoomTheme }) {
  const goldColor = hexCol(theme.accent);
  const darkColor = hexCol(theme.wallDark);

  return (
    <group>
      {/* Suit of Armor - Left */}
      <group position={[-3.5, -ROOM_HEIGHT / 2, -ROOM_LENGTH / 2 + 1]}>
        {/* Body */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.6, 1.2, 0.4]} />
          <meshStandardMaterial
            color={darkColor}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        {/* Head/Helmet */}
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.35]} />
          <meshStandardMaterial
            color={darkColor}
            roughness={0.6}
            metalness={0.4}
          />
        </mesh>
        {/* Visor slit */}
        <mesh position={[0, 2.1, 0.18]}>
          <boxGeometry args={[0.25, 0.05, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.45, 1.3, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial
            color={darkColor}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0.45, 1.3, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial
            color={darkColor}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        {/* Shield */}
        <mesh position={[-0.8, 1.2, 0.1]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.5, 0.7, 0.08]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        {/* Gold trim */}
        <mesh position={[0, 1.2, 0.21]}>
          <boxGeometry args={[0.62, 0.05, 0.02]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Shield on wall - Right */}
      <group position={[3.2, 0.5, -ROOM_LENGTH / 2 + 0.15]}>
        <mesh>
          <boxGeometry args={[0.8, 1.0, 0.1]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
        {/* Shield cross */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.6, 0.08, 0.02]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.08, 0.8, 0.02]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
      </group>

      {/* Banner/Hanging tapestry */}
      <mesh
        position={[-2, 1.5, -ROOM_LENGTH / 2 + 0.2]}
        rotation={[0, 0, 0.05]}
      >
        <planeGeometry args={[0.8, 1.8]} />
        <meshStandardMaterial
          color={darkColor}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Banner rod */}
      <mesh
        position={[-2, 2.45, -ROOM_LENGTH / 2 + 0.15]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
        <meshStandardMaterial
          color={goldColor}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Candelabra on side table */}
      <group position={[2.5, 0.5, -2]}>
        {/* Table */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.5]} />
          <meshStandardMaterial color={darkColor} roughness={0.8} />
        </mesh>
        {/* Candle holder */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.15, 12]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Candle */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Flame */}
        <mesh position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#ffaa33"
            emissive="#ff6600"
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    </group>
  );
}

function FarmDecorations({ theme }: { theme: RoomTheme }) {
  const wallColor = hexCol(theme.wall);

  return (
    <group>
      {/* Hay bale */}
      <mesh
        position={[-3, -ROOM_HEIGHT / 2, -ROOM_LENGTH / 2 + 0.8]}
        rotation={[0, 0.3, 0]}
      >
        <cylinderGeometry args={[0.5, 0.5, 1.0, 12]} />
        <meshStandardMaterial color="#c4a35a" roughness={0.95} />
      </mesh>

      {/* Lantern hanging */}
      <group position={[2.5, 2, -2]}>
        {/* Chain */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
          <meshStandardMaterial
            color="#4a4a4a"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Lantern frame */}
        <mesh>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial
            color="#4a4a4a"
            metalness={0.7}
            roughness={0.3}
            wireframe
          />
        </mesh>
        {/* Light inside */}
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color="#ffaa44"
            emissive="#ff8800"
            emissiveIntensity={1.5}
          />
        </mesh>
      </group>

      {/* Wagon wheel decoration */}
      <mesh
        position={[3, 0.5, -ROOM_LENGTH / 2 + 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.6, 0.06, 8, 16]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Spokes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[3, 0.5, -ROOM_LENGTH / 2 + 0.2]}
          rotation={[Math.PI / 2, (i * Math.PI) / 3, 0]}
        >
          <boxGeometry args={[0.05, 1.2, 0.05]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Barrel */}
      <group position={[-2.5, -ROOM_HEIGHT / 2 + 0.5, -2.5]}>
        <mesh>
          <cylinderGeometry args={[0.4, 0.45, 1.0, 12]} />
          <meshStandardMaterial color={wallColor} roughness={0.85} />
        </mesh>
        {/* Metal bands */}
        {[-0.3, 0, 0.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.42, 0.03, 8, 16]} />
            <meshStandardMaterial
              color="#4a4a4a"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ArcadeDecorations({ theme }: { theme: RoomTheme }) {
  const accentColor = hexCol(theme.accent);

  return (
    <group>
      {/* Neon sign */}
      <group position={[0, 1.5, -ROOM_LENGTH / 2 + 0.3]}>
        <mesh>
          <boxGeometry args={[2.5, 1.0, 0.1]} />
          <meshStandardMaterial color="#1a1a3e" />
        </mesh>
        {/* Neon border */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[2.4, 0.08, 0.02]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={2}
          />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[2.4, 0.08, 0.02]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={2}
          />
        </mesh>
        {/* Glowing text plane */}
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[2, 0.6]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Arcade cabinet silhouette */}
      <mesh position={[-3, -ROOM_HEIGHT / 2 + 1.2, -2]}>
        <boxGeometry args={[0.8, 2.4, 0.6]} />
        <meshStandardMaterial color="#2a2a4e" roughness={0.8} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[-3, -ROOM_HEIGHT / 2 + 1.8, -1.68]}>
        <planeGeometry args={[0.6, 0.5]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
      </mesh>

      {/* Floating geometric shapes */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            2.5 + Math.sin(i * 1.5) * 0.5,
            1 + i * 0.4,
            -2 - Math.cos(i * 1.5) * 0.5,
          ]}
          rotation={[i * 0.5, i * 0.7, i * 0.3]}
        >
          <octahedronGeometry args={[0.2 + i * 0.05]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.5}
            wireframe
          />
        </mesh>
      ))}

      {/* Grid floor effect - neon lines */}
      <mesh
        position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <meshBasicMaterial color="#0a0a1e" />
      </mesh>
    </group>
  );
}

// ── Single flower component ───────────────────────────────────────────────────

function Flower({
  petalColor,
  centreColor,
  stemColor,
  petalCount = 6,
  petalSize = 0.09,
  scale = 1,
}: {
  petalColor: string;
  centreColor: string;
  stemColor: string;
  petalCount?: number;
  petalSize?: number;
  scale?: number;
}) {
  return (
    <group scale={scale}>
      {/* Stem */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.44, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.9} />
      </mesh>

      {/* Two small leaves on the stem */}
      {[0.3, -0.3].map((rotY, i) => (
        <group
          key={i}
          position={[0, -0.1 + i * 0.08, 0]}
          rotation={[0, rotY * Math.PI, 0]}
        >
          <mesh rotation={[0.4, 0, 0.5 - i * 1.0]} position={[0.06, 0, 0]}>
            <sphereGeometry args={[0.055, 6, 4]} />
            <meshStandardMaterial color={stemColor} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Petals — fanned around the centre */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (i / petalCount) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * petalSize * 1.1,
              0.05,
              Math.sin(angle) * petalSize * 1.1,
            ]}
            rotation={[-0.35, angle, 0]}
          >
            <sphereGeometry args={[petalSize, 6, 5]} />
            <meshStandardMaterial
              color={petalColor}
              roughness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Centre cone — the pistil */}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[petalSize * 0.65, 8, 8]} />
        <meshStandardMaterial
          color={centreColor}
          roughness={0.5}
          emissive={centreColor}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

// ── Ceramic vase ──────────────────────────────────────────────────────────────
function Vase({ color }: { color: string }) {
  return (
    <group>
      {/* Neck */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.12, 10]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.0, 0]}>
        <cylinderGeometry args={[0.14, 0.09, 0.28, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.06, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Gold rim band */}
      <mesh position={[0, 0.23, 0]}>
        <torusGeometry args={[0.065, 0.008, 6, 20]} />
        <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

function GardenDecorations({ theme }: { theme: RoomTheme }) {
  const floorY = -ROOM_HEIGHT / 2;

  // Three bouquet clusters along the back wall
  const bouquets: Array<{
    x: number;
    z: number;
    vaseColor: string;
    flowers: Array<{
      offset: [number, number];
      petal: string;
      centre: string;
      count: number;
      size: number;
      scale: number;
    }>;
  }> = [
    {
      x: -1.6,
      z: -ROOM_LENGTH + 0.5,
      vaseColor: "#7a9a6a",
      flowers: [
        {
          offset: [0, 0.44],
          petal: "#ff6b6b",
          centre: "#ffdd44",
          count: 7,
          size: 0.1,
          scale: 1,
        },
        {
          offset: [0.14, 0.5],
          petal: "#ff9f43",
          centre: "#fff176",
          count: 6,
          size: 0.085,
          scale: 0.9,
        },
        {
          offset: [-0.14, 0.48],
          petal: "#ff6b9d",
          centre: "#ffdd44",
          count: 6,
          size: 0.088,
          scale: 0.9,
        },
        {
          offset: [0.07, 0.6],
          petal: "#ffd93d",
          centre: "#ff6b6b",
          count: 5,
          size: 0.075,
          scale: 0.8,
        },
      ],
    },
    {
      x: 0,
      z: -ROOM_LENGTH + 0.5,
      vaseColor: "#8b7355",
      flowers: [
        {
          offset: [0, 0.46],
          petal: "#a29bfe",
          centre: "#fdcb6e",
          count: 8,
          size: 0.105,
          scale: 1.05,
        },
        {
          offset: [-0.16, 0.5],
          petal: "#fd79a8",
          centre: "#ffeaa7",
          count: 7,
          size: 0.09,
          scale: 0.95,
        },
        {
          offset: [0.16, 0.5],
          petal: "#74b9ff",
          centre: "#ffdd44",
          count: 6,
          size: 0.09,
          scale: 0.9,
        },
        {
          offset: [0, 0.62],
          petal: "#55efc4",
          centre: "#fdcb6e",
          count: 5,
          size: 0.08,
          scale: 0.85,
        },
        {
          offset: [-0.08, 0.38],
          petal: "#e17055",
          centre: "#fff176",
          count: 6,
          size: 0.07,
          scale: 0.8,
        },
      ],
    },
    {
      x: 1.6,
      z: -ROOM_LENGTH + 0.5,
      vaseColor: "#6a7a8a",
      flowers: [
        {
          offset: [0, 0.44],
          petal: "#6bcb77",
          centre: "#ffd93d",
          count: 7,
          size: 0.1,
          scale: 1,
        },
        {
          offset: [-0.13, 0.5],
          petal: "#ff6b6b",
          centre: "#fff176",
          count: 6,
          size: 0.085,
          scale: 0.9,
        },
        {
          offset: [0.13, 0.48],
          petal: "#ffeaa7",
          centre: "#e17055",
          count: 5,
          size: 0.08,
          scale: 0.85,
        },
        {
          offset: [0, 0.58],
          petal: "#fd79a8",
          centre: "#fdcb6e",
          count: 6,
          size: 0.075,
          scale: 0.8,
        },
      ],
    },
  ];

  return (
    <group>
      {bouquets.map((bouquet, bi) => (
        <group key={bi} position={[bouquet.x, floorY, bouquet.z]}>
          {/* Vase sitting on floor */}
          <Vase color={bouquet.vaseColor} />

          {/* Flowers growing out of vase */}
          {bouquet.flowers.map((f, fi) => (
            <group key={fi} position={[f.offset[0], f.offset[1], 0]}>
              <Flower
                petalColor={f.petal}
                centreColor={f.centre}
                stemColor="#4a6741"
                petalCount={f.count}
                petalSize={f.size}
                scale={f.scale}
              />
            </group>
          ))}
        </group>
      ))}

      {/* Woven basket with flowers — floor level, side of room */}
      <group position={[2.8, floorY, -2.5]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.38, 0.32, 0.5, 14]} />
          <meshStandardMaterial color="#a08060" roughness={0.95} />
        </mesh>
        {/* Basket rim */}
        <mesh position={[0, 0.52, 0]}>
          <torusGeometry args={[0.38, 0.03, 6, 20]} />
          <meshStandardMaterial color="#8a6a40" roughness={0.9} />
        </mesh>
        {/* A few loose flowers in the basket */}
        {(
          [
            [-0.1, 0.6, 0.05],
            [0.1, 0.62, -0.05],
            [0, 0.68, 0.1],
          ] as [number, number, number][]
        ).map((pos, fi) => (
          <group key={fi} position={pos}>
            <Flower
              petalColor={
                fi === 0 ? "#ff6b6b" : fi === 1 ? "#ffd93d" : "#a29bfe"
              }
              centreColor="#ffdd44"
              stemColor="#4a6741"
              petalCount={6}
              petalSize={0.07}
              scale={0.7}
            />
          </group>
        ))}
      </group>

      {/* Bird house — wall mounted, unchanged */}
      <group position={[-2.5, 1.5, -ROOM_LENGTH / 2 + 0.3]}>
        <mesh>
          <boxGeometry args={[0.4, 0.5, 0.3]} />
          <meshStandardMaterial color={hexCol(theme.wall)} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.35, 0.3, 4]} />
          <meshStandardMaterial color="#8b7355" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <circleGeometry args={[0.1, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Butterfly */}
      <mesh position={[1, 2, -1]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshStandardMaterial
          color="#ff9ff3"
          emissive="#ff6b9d"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

function BeachDecorations({ theme }: { theme: RoomTheme }) {
  return (
    <group>
      {/* Seashells */}
      {[-2, 0, 2].map((x, i) => (
        <mesh
          key={i}
          position={[
            x,
            -ROOM_HEIGHT / 2 + 0.1,
            -ROOM_LENGTH / 2 + 0.5 + i * 0.3,
          ]}
          rotation={[Math.PI / 2, 0, i * 0.5]}
        >
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshStandardMaterial
            color={i === 1 ? "#fff5ee" : "#ffe4c4"}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Starfish */}
      <mesh
        position={[2, -ROOM_HEIGHT / 2 + 0.08, -2]}
        rotation={[-Math.PI / 2, 0, 0.5]}
      >
        <torusGeometry args={[0.2, 0.04, 4, 5]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.8} />
      </mesh>

      {/* Driftwood piece */}
      <mesh
        position={[-2.5, -ROOM_HEIGHT / 2 + 0.15, -1.5]}
        rotation={[0, 0.3, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.08, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.95} />
      </mesh>

      {/* Palm frond */}
      <group position={[2.5, 1.5, -2]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[(i - 2) * 0.3, 0, 0]}>
            <planeGeometry args={[0.15, 1.2]} />
            <meshStandardMaterial
              color="#4a6741"
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Lighthouse lamp */}
      <group position={[-2, -ROOM_HEIGHT / 2 + 0.6, -ROOM_LENGTH / 2 + 0.4]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.6, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.2, 12]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff0000"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.2, 0.15, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* Beach ball */}
      <mesh position={[1.5, -ROOM_HEIGHT / 2 + 0.4, -2.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.7} />
      </mesh>
    </group>
  );
}

interface RoomProps {
  position: [number, number, number];
  theme: RoomTheme;
  featureMode: FeatureMode;
  sectionKey?: string;
  config?: EventConfig;
  onDateRevealed: () => void;
  children?: React.ReactNode;
}

export function Room({
  position,
  theme,
  featureMode,
  sectionKey,
  config,
  children,
  onDateRevealed,
}: RoomProps) {
  const asset = ROOM_ASSETS[featureMode];

  return (
    <group position={position}>
      {asset.ready ? (
        // Baked Blender model — zero runtime lighting cost
        <BakedRoom modelPath={asset.model} texturePath={asset.texture} />
      ) : (
        // Procedural fallback — used until Blender asset is ready
        <>
          {/* Theme-appropriate room shell */}
          {featureMode === "castle" && (
            <CastleShell position={[0, 0, 0]} theme={theme} />
          )}
          {featureMode === "farm" && (
            <FarmShell position={[0, 0, 0]} theme={theme} />
          )}
          {featureMode === "arcade" && (
            <ArcadeShell position={[0, 0, 0]} theme={theme} />
          )}
          {featureMode === "garden" && (
            <GardenShell position={[0, 0, 0]} theme={theme} />
          )}
          {featureMode === "beach" && (
            <BeachShell position={[0, 0, 0]} theme={theme} />
          )}

          {/* Feature-specific decorations (themed objects / furnishings) */}
          {featureMode === "castle" && <CastleDecorations theme={theme} />}
          {featureMode === "farm" && <FarmDecorations theme={theme} />}
          {featureMode === "arcade" && <ArcadeDecorations theme={theme} />}
          {featureMode === "garden" && <GardenDecorations theme={theme} />}
          {featureMode === "beach" && <BeachDecorations theme={theme} />}

          {/* Chandelier — castle/farm only (other themes have their own ceiling lights) */}
          {(featureMode === "castle" || featureMode === "farm") && (
            <Chandelier
              position={[0, ROOM_HEIGHT / 2 - 0.5, -ROOM_LENGTH / 2 + 2]}
              accentColor={theme.accent}
            />
          )}

          {/* Wall torches — castle only */}
          {featureMode === "castle" && (
            <>
              <TorchSconce
                position={[-ROOM_WIDTH / 2 + 0.1, 0.5, -2]}
                accentColor={theme.accent}
                rotation={[0, Math.PI / 2, 0]}
              />
              <TorchSconce
                position={[ROOM_WIDTH / 2 - 0.1, 0.5, -2]}
                accentColor={theme.accent}
                rotation={[0, -Math.PI / 2, 0]}
              />
            </>
          )}
        </>
      )}

      {/* Children for room-specific content */}
      {children}

      {/* Section-specific props — furniture styled to featureMode */}
      {sectionKey && (
        <SectionProps
          sectionKey={sectionKey}
          featureMode={featureMode}
          theme={theme}
          onDateRevealed={onDateRevealed}
          config={config}
        />
      )}
    </group>
  );
}

export { ROOM_HEIGHT, ROOM_LENGTH, ROOM_WIDTH };
