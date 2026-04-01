"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DUST_COUNT_FULL, DUST_COUNT_PREVIEW } from "@/components/rooms-r3f/constants";

interface DustParticlesProps {
  isEditorPreview?: boolean;
}

export default function DustParticles({ isEditorPreview = false }: DustParticlesProps) {
  const count = isEditorPreview ? DUST_COUNT_PREVIEW : DUST_COUNT_FULL;
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8; // x: [-4, 4]
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4; // y: [-2, 2]
      pos[i * 3 + 2] = -Math.random() * 30; // z: [0, -30]
    }
    return pos;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += delta * 0.1 * (Math.random() - 0.3);
      if (posArray[i * 3 + 1] > 2) {
        posArray[i * 3 + 1] = -2;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#d4af37"
        size={0.02}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}
