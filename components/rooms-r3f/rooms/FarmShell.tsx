"use client";

import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import {
  TEXTURE_CASTLE_CEILING,
  TEXTURE_CASTLE_CEILING_NORMAL,
  TEXTURE_CASTLE_CEILING_ROUGH,
  TEXTURE_FARM_WOOD,
  TEXTURE_FARM_WOOD_NORMAL,
  TEXTURE_FARM_WOOD_ROUGH,
} from "@/lib/roomTextures";

interface FarmShellProps {
  position: [number, number, number];
  theme: {
    floor: string;
    floorAlt: string;
    wall: string;
    wallDark: string;
    accent: string;
    ceiling: string;
    curtain: string;
    curtainDark: string;
  };
}

function PBRMesh({
  map,
  normalMap,
  roughnessMap,
  color,
  roughness = 0.8,
  metalness = 0,
  repeat,
}: {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  color?: string | THREE.Color;
  roughness?: number;
  metalness?: number;
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
      metalness={metalness}
    />
  );
}

export function FarmShell({ position, theme }: FarmShellProps) {
  const woodTextures = useTexture([
    TEXTURE_FARM_WOOD,
    TEXTURE_FARM_WOOD_NORMAL,
    TEXTURE_FARM_WOOD_ROUGH,
  ]);
  const [woodColor, woodNormal, woodRoughness] = woodTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  const ceilingTextures = useTexture([
    TEXTURE_CASTLE_CEILING,
    TEXTURE_CASTLE_CEILING_NORMAL,
    TEXTURE_CASTLE_CEILING_ROUGH,
  ]);
  const [ceilingColor, ceilingNormal, ceilingRoughness] = ceilingTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  const woodDark = new THREE.Color(theme.wallDark);
  const accent = new THREE.Color(theme.accent);

  return (
    <group position={position}>
      {/* Wood plank floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={woodColor}
          normalMap={woodNormal}
          roughnessMap={woodRoughness}
          roughness={0.75}
          repeat={[2, 3]}
        />
      </mesh>

      {/* Sloped hay-scented ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={ceilingColor}
          normalMap={ceilingNormal}
          roughnessMap={ceilingRoughness}
          roughness={0.95}
          repeat={[2, 2]}
        />
      </mesh>

      {/* Left wood-plank wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={woodColor}
          normalMap={woodNormal}
          roughnessMap={woodRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Right wood-plank wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={woodColor}
          normalMap={woodNormal}
          roughnessMap={woodRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Back wood-plank wall */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, -ROOM_LENGTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={woodColor}
          normalMap={woodNormal}
          roughnessMap={woodRoughness}
          color={woodDark}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Exposed beams */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, ROOM_HEIGHT / 2 - 0.12, -ROOM_LENGTH / 2]}>
          <boxGeometry args={[0.25, 0.2, ROOM_LENGTH]} />
          <meshStandardMaterial color={woodDark} roughness={0.9} />
        </mesh>
      ))}

      {/* Horizontal siding trim */}
      {[-1, 0, 1].map((y, i) => (
        <mesh
          key={i}
          position={[
            -ROOM_WIDTH / 2 + 0.06,
            y - ROOM_HEIGHT / 4,
            -ROOM_LENGTH / 2,
          ]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[ROOM_LENGTH, 0.06, 0.04]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 0, 1].map((y, i) => (
        <mesh
          key={i}
          position={[
            ROOM_WIDTH / 2 - 0.06,
            y - ROOM_HEIGHT / 4,
            -ROOM_LENGTH / 2,
          ]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <boxGeometry args={[ROOM_LENGTH, 0.06, 0.04]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
      ))}

      {/* Barn lantern (ceiling-hung) */}
      <group position={[0, ROOM_HEIGHT / 2 - 0.6, -ROOM_LENGTH / 2 + 2]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.35, 0.5, 8]} />
          <meshStandardMaterial
            color={woodDark}
            roughness={0.6}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
        {/* Hanging chain */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
          <meshStandardMaterial
            color="#555555"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
