"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ChandelierProps {
  position: [number, number, number];
  accentColor: string;
}

export function Chandelier({ position, accentColor }: ChandelierProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const flickerRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    t.current += delta;

    // Flicker the point light
    if (flickerRef.current) {
      flickerRef.current.intensity =
        3.5 + Math.sin(t.current * 7.3) * 0.4 + Math.sin(t.current * 13.7) * 0.2;
    }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.sin(t.current * 3.1) * 0.15;
    }
  });

  const goldColor = new THREE.Color(accentColor);
  const metalColor = new THREE.Color("#4a4a4a");

  return (
    <group position={position}>
      {/* Chain from ceiling */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 6]} />
        <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.4, 0.5, 8]} />
        <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Arms */}
      {[-1, 0, 1].map((x, i) => (
        <group key={i}>
          <mesh position={[x * 0.4, -0.2, 0]} rotation={[0, 0, x * 0.3]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Candle */}
          <mesh position={[x * 0.5, -0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
            <meshStandardMaterial color="#f5f0dc" roughness={0.9} />
          </mesh>
          {/* Flame */}
          <mesh position={[x * 0.5, -0.18, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffcc66" />
          </mesh>
        </group>
      ))}

      {/* Central glow sphere */}
      <mesh ref={glowRef} position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
      </mesh>

      {/* Point light from chandelier */}
      <pointLight
        ref={flickerRef}
        position={[0, -0.3, 0]}
        color={accentColor}
        intensity={3.5}
        distance={10}
        decay={2}
      />
    </group>
  );
}
