"use client";

import type { FeatureMode } from "@/components/rooms-r3f/Room";
import { TOTAL_SEGMENT } from "@/components/rooms-r3f/constants";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface WorldEnvironmentProps {
  featureMode: FeatureMode;
  sectionCount: number;
  accentColor: string;
}

// Total Z extent of all rooms
const worldLength = (count: number) => count * TOTAL_SEGMENT + 40;

export function WorldEnvironment({
  featureMode,
  sectionCount,
  accentColor,
}: WorldEnvironmentProps) {
  const totalLen = worldLength(sectionCount);

  switch (featureMode) {
    case "castle":
      return <CastleWorld totalLen={totalLen} accent={accentColor} />;
    case "farm":
      return <FarmWorld totalLen={totalLen} accent={accentColor} />;
    case "arcade":
      return <ArcadeWorld totalLen={totalLen} accent={accentColor} />;
    case "garden":
      return <GardenWorld totalLen={totalLen} accent={accentColor} />;
    case "beach":
      return <BeachWorld totalLen={totalLen} accent={accentColor} />;
  }
}

// ── Castle world — stone courtyard, night sky ─────────────────────────────────
function CastleWorld({
  totalLen,
  accent,
}: {
  totalLen: number;
  accent: string;
}) {
  return (
    <group>
      {/* Stone ground extending in all directions */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -totalLen / 2]}
      >
        <planeGeometry args={[60, totalLen + 20]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.95} />
      </mesh>
      {/* Night sky dome */}
      <mesh>
        <sphereGeometry args={[80, 32, 16]} />
        <meshStandardMaterial
          color="#050308"
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>
      {/* Stars — instanced points */}
      <CastleStars />
      {/* Distant castle battlements silhouette */}
      <CastleSilhouette totalLen={totalLen} accent={accent} />
      {/* Torches lining the path */}
      {Array.from({ length: Math.floor(totalLen / 8) }).map((_, i) => (
        <PathTorch
          key={i}
          position={[-5.5, -2.26, -i * 8 - 4]}
          accent={accent}
        />
      ))}
      {Array.from({ length: Math.floor(totalLen / 8) }).map((_, i) => (
        <PathTorch
          key={i + 100}
          position={[5.5, -2.26, -i * 8 - 4]}
          accent={accent}
        />
      ))}

      {/* Castle entrance gate — at Z=+2, what camera sees on load */}
      <group position={[0, 0, 2]}>
        {/* Gate arch */}
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[6, 5.5, 0.4]} />
          <meshStandardMaterial color="#2a1e14" roughness={0.9} />
        </mesh>
        {/* Gate opening */}
        <mesh position={[0, 1.8, 0.01]}>
          <boxGeometry args={[3.5, 4.2, 0.5]} />
          <meshStandardMaterial color="#050305" roughness={1} />
        </mesh>
        {/* Tower left */}
        <mesh position={[-4, 2, 0]}>
          <boxGeometry args={[2.5, 7, 2.5]} />
          <meshStandardMaterial color="#1a1008" roughness={0.95} />
        </mesh>
        {/* Tower right */}
        <mesh position={[4, 2, 0]}>
          <boxGeometry args={[2.5, 7, 2.5]} />
          <meshStandardMaterial color="#1a1008" roughness={0.95} />
        </mesh>
        {/* Portcullis */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-1.5 + i * 0.75, 1.8, 0.05]}>
            <boxGeometry args={[0.08, 4.2, 0.06]} />
            <meshStandardMaterial
              color="#2a2a2a"
              roughness={0.5}
              metalness={0.7}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CastleStars() {
  const COUNT = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  // Position stars randomly on the sky sphere
  const positions = useRef(
    Array.from({ length: COUNT }, () => {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      return new THREE.Vector3(
        70 * Math.sin(phi) * Math.cos(theta),
        Math.abs(70 * Math.cos(phi)) + 5, // keep above horizon
        70 * Math.sin(phi) * Math.sin(theta),
      );
    }),
  );

  // Set matrices once
  useFrame(() => {
    if (!meshRef.current) return;
    positions.current.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.setScalar(0.12 + Math.random() * 0.08);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial
        color="#fffce8"
        emissive="#fffce8"
        emissiveIntensity={1.5}
      />
    </instancedMesh>
  );
}

function CastleSilhouette({
  totalLen,
  accent,
}: {
  totalLen: number;
  accent: string;
}) {
  // Distant wall at the end of the scene
  return (
    <group position={[0, 0, -totalLen - 10]}>
      {/* Main wall */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[50, 8, 1.5]} />
        <meshStandardMaterial color="#1a1008" roughness={1} />
      </mesh>
      {/* Battlements */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-22 + i * 4, 7.5, 0]}>
          <boxGeometry args={[2, 2, 1.5]} />
          <meshStandardMaterial color="#1a1008" roughness={1} />
        </mesh>
      ))}
      {/* Two towers */}
      {([-24, 24] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 6, 0]}>
            <boxGeometry args={[5, 14, 5]} />
            <meshStandardMaterial color="#140c06" roughness={1} />
          </mesh>
          {/* Cone top */}
          <mesh position={[0, 14.5, 0]}>
            <coneGeometry args={[3, 4, 8]} />
            <meshStandardMaterial color="#0a0806" roughness={1} />
          </mesh>
          {/* Window glow */}
          <mesh position={[0, 7, 2.6]}>
            <planeGeometry args={[1.2, 1.8]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PathTorch({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  const flickerRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flickerRef.current) return;
    const mat = flickerRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.getElapsedTime();
    mat.emissiveIntensity = 1.5 + Math.sin(t * 4.1 + position[2] * 0.3) * 0.4;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.6, 6]} />
        <meshStandardMaterial color="#3a2510" roughness={0.8} />
      </mesh>
      <mesh ref={flickerRef} position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial
          color="#ffaa33"
          emissive="#ffaa33"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

// ── Farm world — open field, blue sky, barn buildings ────────────────────────
function FarmWorld({ totalLen, accent }: { totalLen: number; accent: string }) {
  return (
    <group>
      {/* Grass field */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -totalLen / 2]}
      >
        <planeGeometry args={[80, totalLen + 20]} />
        <meshStandardMaterial color="#3a5a28" roughness={0.98} />
      </mesh>
      {/* Dirt path down the centre */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.25, -totalLen / 2]}
      >
        <planeGeometry args={[4, totalLen + 20]} />
        <meshStandardMaterial color="#8b6b40" roughness={0.95} />
      </mesh>
      {/* Sky — warm golden hour */}
      <mesh>
        <sphereGeometry args={[80, 32, 16]} />
        <meshStandardMaterial
          color="#e8c880"
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>
      {/* Fence posts lining path */}
      {Array.from({ length: Math.floor(totalLen / 3) }).map((_, i) => (
        <group key={i}>
          <mesh position={[-3.5, -1.76, -i * 3 - 1.5]}>
            <boxGeometry args={[0.12, 1, 0.12]} />
            <meshStandardMaterial color="#6b5040" roughness={0.9} />
          </mesh>
          <mesh position={[3.5, -1.76, -i * 3 - 1.5]}>
            <boxGeometry args={[0.12, 1, 0.12]} />
            <meshStandardMaterial color="#6b5040" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Horizontal fence rails */}
      {([-3.5, 3.5] as number[]).map((x, side) => (
        <mesh key={side} position={[x, -1.5, -totalLen / 2]}>
          <boxGeometry args={[0.06, 0.06, totalLen]} />
          <meshStandardMaterial color="#7a6050" roughness={0.85} />
        </mesh>
      ))}
      {/* Hay bales scattered in fields */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (i % 2 === 0 ? -8 : 8) + (Math.random() - 0.5) * 4,
            -1.96,
            -(i * 12 + 6),
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.7, 0.7, 1.2, 12]} />
          <meshStandardMaterial color="#c4a030" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Arcade world — neon-lit arcade hall ───────────────────────────────────────
function ArcadeWorld({
  totalLen,
  accent,
}: {
  totalLen: number;
  accent: string;
}) {
  return (
    <group>
      {/* Dark tiled floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -totalLen / 2]}
      >
        <planeGeometry args={[30, totalLen + 20]} />
        <meshStandardMaterial color="#0a0a1e" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, -totalLen / 2]}>
        <planeGeometry args={[30, totalLen + 20]} />
        <meshStandardMaterial color="#050510" roughness={0.8} />
      </mesh>
      {/* Side walls */}
      {([-13, 13] as number[]).map((x, i) => (
        <mesh
          key={i}
          rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          position={[x, 1.8, -totalLen / 2]}
        >
          <planeGeometry args={[totalLen + 20, 9]} />
          <meshStandardMaterial color="#080818" roughness={0.7} />
        </mesh>
      ))}
      {/* Neon floor grid lines */}
      {Array.from({ length: Math.floor(totalLen / 3) }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.24, -i * 3 - 1.5]}
        >
          <planeGeometry args={[28, 0.04]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
      {/* Vertical neon strips on walls */}
      {Array.from({ length: Math.floor(totalLen / 6) }).map((_, i) => (
        <group key={i}>
          <mesh position={[-12.8, 1, -i * 6 - 3]}>
            <boxGeometry args={[0.04, 5, 0.04]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={1.8}
            />
          </mesh>
          <mesh position={[12.8, 1, -i * 6 - 3]}>
            <boxGeometry args={[0.04, 5, 0.04]} />
            <meshStandardMaterial
              color="#ff00ff"
              emissive="#ff00ff"
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Garden world — open garden, daytime, flower beds ─────────────────────────
function GardenWorld({
  totalLen,
  accent,
}: {
  totalLen: number;
  accent: string;
}) {
  return (
    <group>
      {/* Soft grass */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -totalLen / 2]}
      >
        <planeGeometry args={[60, totalLen + 20]} />
        <meshStandardMaterial color="#4a7a38" roughness={0.98} />
      </mesh>
      {/* Light blue sky */}
      <mesh>
        <sphereGeometry args={[80, 32, 16]} />
        <meshStandardMaterial
          color="#87ceeb"
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>
      {/* Stone path */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.25, -totalLen / 2]}
      >
        <planeGeometry args={[3.5, totalLen + 20]} />
        <meshStandardMaterial color="#8a8a7a" roughness={0.9} />
      </mesh>
      {/* Flower beds on both sides */}
      {Array.from({ length: Math.floor(totalLen / 5) }).map((_, i) => (
        <group key={i}>
          <mesh position={[-5 - Math.random() * 2, -2.15, -i * 5 - 2.5]}>
            <sphereGeometry args={[0.3 + Math.random() * 0.2, 6, 6]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#ff88aa" : i % 3 === 1 ? "#ffee44" : accent}
              roughness={0.9}
            />
          </mesh>
          <mesh position={[5 + Math.random() * 2, -2.15, -i * 5 - 2.5]}>
            <sphereGeometry args={[0.3 + Math.random() * 0.2, 6, 6]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#ff88aa" : i % 3 === 1 ? "#ffee44" : accent}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Beach world — sandy shore, ocean, sky ────────────────────────────────────
function BeachWorld({
  totalLen,
  accent,
}: {
  totalLen: number;
  accent: string;
}) {
  const waveRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waveRef.current) {
      waveRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.4) * 1.5;
    }
  });

  return (
    <group>
      {/* Sand */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -totalLen / 2]}
      >
        <planeGeometry args={[60, totalLen + 20]} />
        <meshStandardMaterial color="#d4b483" roughness={0.98} />
      </mesh>
      {/* Ocean — one side */}
      <mesh
        ref={waveRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[22, -2.2, -totalLen / 2]}
      >
        <planeGeometry args={[20, totalLen + 20]} />
        <meshStandardMaterial
          color="#2a6a9a"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Sky — warm sunset */}
      <mesh>
        <sphereGeometry args={[80, 32, 16]} />
        <meshStandardMaterial
          color="#ff8844"
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>
      {/* Seashells scattered on path */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 6,
            -2.22,
            -Math.random() * totalLen,
          ]}
        >
          <sphereGeometry args={[0.06 + Math.random() * 0.06, 6, 6]} />
          <meshStandardMaterial color="#f0e8d0" roughness={0.6} />
        </mesh>
      ))}
      {/* Driftwood pieces */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[3 + Math.random() * 4, -2.2, -i * (totalLen / 6) - 5]}
          rotation={[0, Math.random(), 0]}
        >
          <cylinderGeometry args={[0.08, 0.12, 1.2 + Math.random(), 6]} />
          <meshStandardMaterial color="#a08060" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
