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
  TEXTURE_GARDEN_GROUND,
  TEXTURE_GARDEN_GROUND_NORMAL,
  TEXTURE_GARDEN_GROUND_ROUGH,
  TEXTURE_GARDEN_LATTICE,
  TEXTURE_GARDEN_LATTICE_NORMAL,
  TEXTURE_GARDEN_LATTICE_ROUGH,
} from "@/lib/roomTextures";

interface GardenShellProps {
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

export function GardenShell({ position, theme }: GardenShellProps) {
  const latticeTextures = useTexture([
    TEXTURE_GARDEN_LATTICE,
    TEXTURE_GARDEN_LATTICE_NORMAL,
    TEXTURE_GARDEN_LATTICE_ROUGH,
  ]);
  const [latticeTex, latticeNormal, latticeRoughness] = latticeTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  const groundTextures = useTexture([
    TEXTURE_GARDEN_GROUND,
    TEXTURE_GARDEN_GROUND_NORMAL,
    TEXTURE_GARDEN_GROUND_ROUGH,
  ]);
  const [groundColor, groundNormal, groundRoughness] = groundTextures as [
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

  const accent = new THREE.Color(theme.accent);
  const latticeCol = new THREE.Color(theme.wallDark);

  return (
    <group position={position}>
      {/* Grass-textured floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={groundColor}
          normalMap={groundNormal}
          roughnessMap={groundRoughness}
          roughness={0.95}
          repeat={[3, 3]}
        />
      </mesh>

      {/* Garden ceiling (soft sky glow) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={ceilingColor}
          normalMap={ceilingNormal}
          roughnessMap={ceilingRoughness}
          roughness={0.9}
          repeat={[2, 2]}
        />
      </mesh>

      {/* Left lattice wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={latticeTex}
          normalMap={latticeNormal}
          roughnessMap={latticeRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Right lattice wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={latticeTex}
          normalMap={latticeNormal}
          roughnessMap={latticeRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Back lattice wall */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, -ROOM_LENGTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={latticeTex}
          normalMap={latticeNormal}
          roughnessMap={latticeRoughness}
          color={latticeCol}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Vine trellis strips */}
      {[-2, 2].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0, -ROOM_LENGTH + 0.1]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <boxGeometry args={[ROOM_HEIGHT * 0.9, 0.08, 0.04]} />
          <meshStandardMaterial color={latticeCol} roughness={0.9} />
        </mesh>
      ))}

      {/* Flower box trim at base */}
      <mesh
        position={[
          -ROOM_WIDTH / 2 + 0.1,
          -ROOM_HEIGHT / 2 + 0.15,
          -ROOM_LENGTH / 2,
        ]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.3, 0.2]} />
        <meshStandardMaterial color={latticeCol} roughness={0.9} />
      </mesh>
      <mesh
        position={[
          ROOM_WIDTH / 2 - 0.1,
          -ROOM_HEIGHT / 2 + 0.15,
          -ROOM_LENGTH / 2,
        ]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.3, 0.2]} />
        <meshStandardMaterial color={latticeCol} roughness={0.9} />
      </mesh>

      {/* Fairy-light string across ceiling */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[i * 2 - 2, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH / 4]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.01, 0.01, ROOM_WIDTH - 1, 4]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
