"use client";

import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import { ArcadeShell } from "@/components/rooms-r3f/rooms/ArcadeShell";
import { BeachShell } from "@/components/rooms-r3f/rooms/BeachShell";
import { CastleShell } from "@/components/rooms-r3f/rooms/CastleShell";
import { Chandelier } from "@/components/rooms-r3f/rooms/Chandelier";
import { FarmShell } from "@/components/rooms-r3f/rooms/FarmShell";
import { GardenShell } from "@/components/rooms-r3f/rooms/GardenShell";
import { TorchSconce } from "@/components/rooms-r3f/rooms/TorchSconce";
import { hexCol } from "@/lib/roomTextures";

export type FeatureMode = "castle" | "farm" | "arcade" | "garden" | "beach";

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
  const accentColor = hexCol(theme.accent);
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

function GardenDecorations({ theme }: { theme: RoomTheme }) {
  const accentColor = hexCol(theme.accent);
  const wallColor = hexCol(theme.wall);

  return (
    <group>
      {/* Flower arrangement */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <group key={i} position={[x, 0.5, -ROOM_LENGTH / 2 + 0.5]}>
          {/* Vase */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.15, 0.1, 0.4, 8]} />
            <meshStandardMaterial color="#8b7355" roughness={0.8} />
          </mesh>
          {/* Stems */}
          {[0, 0.1, -0.1].map((ox, j) => (
            <mesh key={j} position={[ox, 0.2, 0]} rotation={[0.1, 0, ox * 0.5]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
              <meshStandardMaterial color="#4a6741" roughness={0.9} />
            </mesh>
          ))}
          {/* Flower blooms */}
          {[
            [0, 0.5],
            [0.1, 0.45],
            [-0.1, 0.55],
          ].map(([ox, oy], j) => (
            <mesh key={j} position={[ox, oy, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={j === 0 ? "#ff6b6b" : j === 1 ? "#ffd93d" : "#6bcb77"}
                roughness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Woven basket */}
      <mesh
        position={[2.5, -ROOM_HEIGHT / 2 + 0.25, -2]}
        rotation={[0, 0.5, 0]}
      >
        <cylinderGeometry args={[0.4, 0.35, 0.5, 12]} />
        <meshStandardMaterial color="#a08060" roughness={0.95} />
      </mesh>

      {/* Bird house */}
      <group position={[-2.5, 1.5, -ROOM_LENGTH / 2 + 0.3]}>
        <mesh>
          <boxGeometry args={[0.4, 0.5, 0.3]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
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
      <mesh position={[1, 2, -1]} rotation={[0, 0, 0]}>
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
  const accentColor = hexCol(theme.accent);
  const sandColor = hexCol(theme.floor);

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
      <group position={[-2, 0.5, -ROOM_LENGTH / 2 + 0.4]}>
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
  children?: React.ReactNode;
}

export function Room({ position, theme, featureMode, children }: RoomProps) {
  return (
    <group position={position}>
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

      {/* Children for room-specific content */}
      {children}
    </group>
  );
}

export { ROOM_HEIGHT, ROOM_LENGTH, ROOM_WIDTH };
