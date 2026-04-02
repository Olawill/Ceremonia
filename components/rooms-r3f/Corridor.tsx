"use client";

import {
  CORRIDOR_ASSET,
  CORRIDOR_HEIGHT,
  CORRIDOR_LENGTH,
  CORRIDOR_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode } from "@/components/rooms-r3f/Room";
import { BakedCorridor } from "@/components/rooms-r3f/rooms/BakedCorridor";
import { PortcullisGate } from "@/components/rooms-r3f/rooms/PortcullisGate";

import {
  TEXTURE_CORRIDOR_STONE,
  TEXTURE_CORRIDOR_STONE_NORMAL,
  TEXTURE_CORRIDOR_STONE_ROUGH,
} from "@/lib/roomTextures";
import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

interface CorridorTheme {
  floor: string;
  wall: string;
  accent: string;
}

interface CorridorProps {
  position: [number, number, number];
  theme: CorridorTheme;
  isLocked?: boolean;
  hasLight?: boolean;
  featureMode?: FeatureMode;
}

function CorridorPBRMesh({
  map,
  normalMap,
  roughnessMap,
  color,
  roughness = 0.85,
  repeat,
}: {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  color?: string | THREE.Color;
  roughness?: number;
  repeat?: [number, number];
}) {
  useEffect(() => {
    if (repeat) {
      map.repeat.set(...repeat);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
    }
    if (normalMap && repeat) {
      normalMap.repeat.set(...repeat);
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    }
    if (roughnessMap && repeat) {
      roughnessMap.repeat.set(...repeat);
      roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    }
  }, [map, normalMap, roughnessMap, repeat]);
  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(1, 1)}
      roughnessMap={roughnessMap}
      color={color}
      roughness={roughness}
    />
  );
}

export function Corridor({
  position,
  theme,
  isLocked = false,
  hasLight = true,
  featureMode = "castle",
}: CorridorProps) {
  if (CORRIDOR_ASSET.ready) {
    return <BakedCorridor position={position} />;
  }

  const floorColor = new THREE.Color(theme.floor);
  const accentColor = new THREE.Color(theme.accent);

  const stoneTextures = useTexture([
    TEXTURE_CORRIDOR_STONE,
    TEXTURE_CORRIDOR_STONE_NORMAL,
    TEXTURE_CORRIDOR_STONE_ROUGH,
  ]);
  const [stoneColor, stoneNormal, stoneRoughness] = stoneTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  return (
    <group position={position}>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -CORRIDOR_HEIGHT / 2, 0]}
      >
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color={floorColor} roughness={0.95} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, CORRIDOR_HEIGHT / 2, 0]}
      >
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial
          color={floorColor.clone().multiplyScalar(0.6)}
          roughness={0.9}
        />
      </mesh>

      {/* Left wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-CORRIDOR_WIDTH / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[CORRIDOR_LENGTH, CORRIDOR_HEIGHT]} />
        <CorridorPBRMesh
          map={stoneColor}
          normalMap={stoneNormal}
          roughnessMap={stoneRoughness}
          roughness={0.9}
          repeat={[1.5, 1]}
        />
      </mesh>

      {/* Right wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[CORRIDOR_WIDTH / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[CORRIDOR_LENGTH, CORRIDOR_HEIGHT]} />
        <CorridorPBRMesh
          map={stoneColor}
          normalMap={stoneNormal}
          roughnessMap={stoneRoughness}
          roughness={0.9}
          repeat={[1.5, 1]}
        />
      </mesh>

      {/* Archway frame */}
      <mesh position={[0, CORRIDOR_HEIGHT / 2 - 0.3, 0]}>
        <boxGeometry args={[CORRIDOR_WIDTH + 0.3, 0.15, 0.2]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Light sconce on wall */}
      {hasLight && (
        <group position={[0, 0.5, 0.1]}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight
            color={accentColor}
            intensity={1.5}
            distance={4}
            decay={2}
          />
        </group>
      )}

      {/* Theme-appropriate locked gate */}
      {isLocked && (
        <PortcullisGate
          position={[0, 0, CORRIDOR_LENGTH / 2 - 0.2]}
          isLocked={isLocked}
          style={featureMode}
        />
      )}
    </group>
  );
}
