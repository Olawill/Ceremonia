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
  TEXTURE_BEACH_DRIFT,
  TEXTURE_BEACH_DRIFT_NORMAL,
  TEXTURE_BEACH_DRIFT_ROUGH,
  TEXTURE_BEACH_SAND,
  TEXTURE_BEACH_SAND_NORMAL,
  TEXTURE_BEACH_SAND_ROUGH,
  TEXTURE_CASTLE_CEILING,
  TEXTURE_CASTLE_CEILING_NORMAL,
  TEXTURE_CASTLE_CEILING_ROUGH,
} from "@/lib/roomTextures";

interface BeachShellProps {
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

export function BeachShell({ position, theme }: BeachShellProps) {
  const sandTextures = useTexture([
    TEXTURE_BEACH_SAND,
    TEXTURE_BEACH_SAND_NORMAL,
    TEXTURE_BEACH_SAND_ROUGH,
  ]);
  const [sandColor, sandNormal, sandRoughness] = sandTextures as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  const driftTextures = useTexture([
    TEXTURE_BEACH_DRIFT,
    TEXTURE_BEACH_DRIFT_NORMAL,
    TEXTURE_BEACH_DRIFT_ROUGH,
  ]);
  const [driftColor, driftNormal, driftRoughness] = driftTextures as [
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

  const wallSky = new THREE.Color(theme.wall);
  const accent = new THREE.Color(theme.accent);
  const driftwood = new THREE.Color("#a0856c");

  return (
    <group position={position}>
      {/* Sandy floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -ROOM_HEIGHT / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={sandColor}
          normalMap={sandNormal}
          roughnessMap={sandRoughness}
          roughness={0.98}
          repeat={[3, 3]}
        />
      </mesh>

      {/* Sky-blue ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_LENGTH]} />
        <PBRMesh
          map={ceilingColor}
          normalMap={ceilingNormal}
          roughnessMap={ceilingRoughness}
          roughness={0.8}
          repeat={[2, 2]}
        />
      </mesh>

      {/* Left "shore" wall (sky gradient) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={wallSky} roughness={0.9} />
      </mesh>

      {/* Right shore wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_WIDTH / 2, 0, -ROOM_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_LENGTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={wallSky} roughness={0.9} />
      </mesh>

      {/* Back wall - driftwood panel with marble texture */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, -ROOM_LENGTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={theme.wallDark} roughness={0.9} />
      </mesh>

      {/* Driftwood trim */}
      <mesh
        position={[-ROOM_WIDTH / 2 + 0.06, 0, -ROOM_LENGTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.07, 0.07]} />
        <meshStandardMaterial color={driftwood} roughness={0.95} />
      </mesh>
      <mesh
        position={[ROOM_WIDTH / 2 - 0.06, 0, -ROOM_LENGTH / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_LENGTH, 0.07, 0.07]} />
        <meshStandardMaterial color={driftwood} roughness={0.95} />
      </mesh>

      {/* Rope-wrapped post accents */}
      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} position={[x, 0, -ROOM_LENGTH + 0.15]}>
          <cylinderGeometry args={[0.08, 0.1, ROOM_HEIGHT * 0.7, 8]} />
          <meshStandardMaterial color={driftwood} roughness={0.9} />
        </mesh>
      ))}

      {/* Starfish decorations on back wall */}
      {[1, 3].map((x, i) => (
        <group key={i} position={[x, 0.5, -ROOM_LENGTH + 0.05]}>
          {[0, 1, 2, 3, 4].map((arm) => (
            <mesh
              key={arm}
              rotation={[0, 0, (arm * Math.PI * 2) / 5]}
              position={[
                Math.cos((arm * Math.PI * 2) / 5) * 0.15,
                Math.sin((arm * Math.PI * 2) / 5) * 0.15,
                0,
              ]}
            >
              <boxGeometry args={[0.04, 0.2, 0.02]} />
              <meshStandardMaterial color={accent} roughness={0.8} />
            </mesh>
          ))}
          <mesh>
            <circleGeometry args={[0.06, 8]} />
            <meshStandardMaterial color={accent} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
