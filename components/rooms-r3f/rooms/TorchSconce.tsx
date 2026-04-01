"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TorchSconceProps {
  position: [number, number, number];
  accentColor: string;
  rotation?: [number, number, number];
}

// Wall-mounted torch bracket with flickering flame
export function TorchSconce({ position, accentColor, rotation = [0, 0, 0] }: TorchSconceProps) {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    t.current += delta * (3 + Math.random() * 0.5);

    // Chaotic flicker
    if (lightRef.current) {
      lightRef.current.intensity =
        1.8 +
        Math.sin(t.current * 8.1) * 0.3 +
        Math.sin(t.current * 15.7) * 0.15 +
        (Math.random() - 0.5) * 0.1;
    }

    // Flame wobble
    if (flameRef.current) {
      flameRef.current.rotation.z = Math.sin(t.current * 6.3) * 0.08;
      flameRef.current.scale.y = 0.9 + Math.sin(t.current * 9.1) * 0.15;
    }
  });

  const goldColor = new THREE.Color(accentColor);
  const darkMetal = new THREE.Color("#3a3530");

  return (
    <group position={position} rotation={rotation}>
      {/* Wall bracket */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.08, 0.3, 0.06]} />
        <meshStandardMaterial color={darkMetal} metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Horizontal arm */}
      <mesh position={[0.12, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Torch cup */}
      <mesh position={[0.22, 0.08, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.12, 8]} />
        <meshStandardMaterial color={darkMetal} metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Flame */}
      <group ref={flameRef} position={[0.22, 0.2, 0]}>
        <mesh>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshBasicMaterial color="#ffaa33" transparent opacity={0.9} />
        </mesh>
        {/* Inner glow */}
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#fff5cc" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Point light */}
      <pointLight
        ref={lightRef}
        position={[0.22, 0.2, 0]}
        color="#ff9933"
        intensity={1.8}
        distance={5}
        decay={2}
      />
    </group>
  );
}
