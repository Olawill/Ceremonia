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
  TEXTURE_ARCADE_METAL,
  TEXTURE_ARCADE_METAL_METAL,
  TEXTURE_ARCADE_METAL_NORMAL,
  TEXTURE_ARCADE_METAL_ROUGH,
  TEXTURE_CASTLE_CEILING,
  TEXTURE_CASTLE_CEILING_NORMAL,
  TEXTURE_CASTLE_CEILING_ROUGH,
} from "@/lib/roomTextures";

interface ArcadeShellProps {
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
  metalnessMap,
  color,
  roughness = 0.8,
  metalness = 0,
  repeat,
}: {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
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
    if (metalnessMap && repeat) {
      metalnessMap.repeat.set(...repeat);
      metalnessMap.wrapS = metalnessMap.wrapT = THREE.RepeatWrapping;
    }
  }, [map, normalMap, roughnessMap, metalnessMap, repeat]);
  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(1, 1)}
      roughnessMap={roughnessMap}
      metalnessMap={metalnessMap}
      color={color}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

export function ArcadeShell({ position, theme }: ArcadeShellProps) {
  const darkWallTexture = useTexture(
    "/textures/Facade006_1K-JPG_Color.jpg",
  ) as THREE.Texture;

  const metalTextures = useTexture([
    TEXTURE_ARCADE_METAL,
    TEXTURE_ARCADE_METAL_NORMAL,
    TEXTURE_ARCADE_METAL_ROUGH,
    TEXTURE_ARCADE_METAL_METAL,
  ]);
  const [metalColor, metalNormal, metalRoughness, metalnessMap] =
    metalTextures as [
      THREE.Texture,
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

  useEffect(() => {
    darkWallTexture.wrapS = darkWallTexture.wrapT = THREE.RepeatWrapping;
    darkWallTexture.repeat.set(4, 4);
  }, [darkWallTexture]);

  return (
    <group position={position}>
      {/* Dark grid floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <meshStandardMaterial
          color={theme.floor}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* LED ceiling panel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={ceilingColor}
          normalMap={ceilingNormal}
          roughnessMap={ceilingRoughness}
          roughness={0.3}
          metalness={0.8}
          repeat={[2, 2]}
        />
      </mesh>

      {/* Metal panel left wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={metalColor}
          normalMap={metalNormal}
          roughnessMap={metalRoughness}
          metalnessMap={metalnessMap}
          roughness={0.5}
          metalness={0.3}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Metal panel right wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={metalColor}
          normalMap={metalNormal}
          roughnessMap={metalRoughness}
          metalnessMap={metalnessMap}
          roughness={0.5}
          metalness={0.3}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Neon back wall */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, -ROOM_LENGTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={theme.wall}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Neon strip trim - horizontal */}
      {[0.5, -0.5].map((y, i) => (
        <mesh key={i} position={[0, y, -ROOM_LENGTH + 0.02]}>
          <boxGeometry args={[ROOM_WIDTH, 0.04, 0.04]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={1}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Vertical neon strips on side walls */}
      {[-3, 0, 3].map((x, i) => (
        <mesh
          key={i}
          position={[-ROOM_WIDTH / 2 + 0.02, 0, x - ROOM_LENGTH / 2]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.03, ROOM_HEIGHT * 0.8, 0.03]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
      {[-3, 0, 3].map((x, i) => (
        <mesh
          key={i}
          position={[ROOM_WIDTH / 2 - 0.02, 0, x - ROOM_LENGTH / 2]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.03, ROOM_HEIGHT * 0.8, 0.03]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Overhead LED bar */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.15, -ROOM_LENGTH / 2]}>
        <boxGeometry args={[ROOM_WIDTH - 1, 0.1, 0.1]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
