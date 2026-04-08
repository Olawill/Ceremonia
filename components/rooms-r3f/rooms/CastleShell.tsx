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
  TEXTURE_CASTLE_BANNER,
  TEXTURE_CASTLE_CEILING,
  TEXTURE_CASTLE_CEILING_NORMAL,
  TEXTURE_CASTLE_CEILING_ROUGH,
  TEXTURE_CASTLE_FLOOR,
  TEXTURE_CASTLE_FLOOR_NORMAL,
  TEXTURE_CASTLE_FLOOR_ROUGH,
  TEXTURE_CASTLE_WALL,
  TEXTURE_CASTLE_WALL_NORMAL,
  TEXTURE_CASTLE_WALL_ROUGH,
} from "@/lib/roomTextures";

interface CastleShellProps {
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
  sectionKey?: string;
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

export function CastleShell({ position, theme, sectionKey }: CastleShellProps) {
  const wallTextures = useTexture([
    TEXTURE_CASTLE_WALL,
    TEXTURE_CASTLE_WALL_NORMAL,
    TEXTURE_CASTLE_WALL_ROUGH,
  ]);
  const [wallColor, wallNormal, wallRoughness] = wallTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  const floorTextures = useTexture([
    TEXTURE_CASTLE_FLOOR,
    TEXTURE_CASTLE_FLOOR_NORMAL,
    TEXTURE_CASTLE_FLOOR_ROUGH,
  ]);
  const [floorColor, floorNormal, floorRoughness] = floorTextures as [
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

  const bannerTexture = useTexture(TEXTURE_CASTLE_BANNER) as THREE.Texture;

  const wallDark = new THREE.Color(theme.wallDark);
  const accent = new THREE.Color(theme.accent);

  return (
    <group position={position}>
      {/* Stone tile floor — marble */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={floorColor}
          normalMap={floorNormal}
          roughnessMap={floorRoughness}
          roughness={0.3}
          metalness={0.05}
          repeat={[3, ROOM_LENGTH / 3]}
        />
      </mesh>

      {/* Coffered ceiling — fabric */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={ceilingColor}
          normalMap={ceilingNormal}
          roughnessMap={ceilingRoughness}
          roughness={0.85}
          repeat={[2, 2]}
        />
      </mesh>

      {/* Left stone wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={wallColor}
          normalMap={wallNormal}
          roughnessMap={wallRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Right stone wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={wallColor}
          normalMap={wallNormal}
          roughnessMap={wallRoughness}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Back stone wall */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, -ROOM_LENGTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <PBRMesh
          map={wallColor}
          normalMap={wallNormal}
          roughnessMap={wallRoughness}
          color={wallDark}
          roughness={0.85}
          repeat={[2, 1]}
        />
      </mesh>

      {/* Ceiling beams */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, ROOM_HEIGHT / 2 - 0.1, -ROOM_LENGTH / 2]}>
          <boxGeometry args={[0.2, 0.15, ROOM_LENGTH]} />
          <meshStandardMaterial color={wallDark} roughness={0.85} />
        </mesh>
      ))}

      {/* Wall trim / molding */}
      <mesh
        position={[-ROOM_WIDTH / 2 + 0.05, 0, -ROOM_LENGTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.08, 0.08]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh
        position={[ROOM_WIDTH / 2 - 0.05, 0, -ROOM_LENGTH / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.08, 0.08]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>

      {sectionKey !== "countdown" && (
        <>
          {/* Heraldic banners on left wall */}
          {(
            [
              [-ROOM_WIDTH / 2 + 0.08, 1.0, -ROOM_LENGTH * 0.3, Math.PI / 2],
              [-ROOM_WIDTH / 2 + 0.08, 1.0, -ROOM_LENGTH * 0.7, Math.PI / 2],
              [ROOM_WIDTH / 2 - 0.08, 1.0, -ROOM_LENGTH * 0.3, -Math.PI / 2],
              [ROOM_WIDTH / 2 - 0.08, 1.0, -ROOM_LENGTH * 0.7, -Math.PI / 2],
            ] as [number, number, number, number][]
          ).map(([x, y, z, ry], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[0, ry, 0.03]}>
              <planeGeometry args={[0.7, 1.6]} />
              <meshStandardMaterial
                map={bannerTexture}
                roughness={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}

          {/* Banner rods */}
          {(
            [
              [-ROOM_WIDTH / 2 + 0.08, 1.9, -ROOM_LENGTH * 0.3, Math.PI / 2],
              [-ROOM_WIDTH / 2 + 0.08, 1.9, -ROOM_LENGTH * 0.7, Math.PI / 2],
              [ROOM_WIDTH / 2 - 0.08, 1.9, -ROOM_LENGTH * 0.3, -Math.PI / 2],
              [ROOM_WIDTH / 2 - 0.08, 1.9, -ROOM_LENGTH * 0.7, -Math.PI / 2],
            ] as [number, number, number, number][]
          ).map(([x, y, z, ry], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[0, ry, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
