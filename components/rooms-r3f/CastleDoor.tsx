"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CastleDoorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  theme: {
    curtain: string;
    curtainDark: string;
    gold: string;
    goldLight: string;
    bg: string;
    bgMid: string;
    text: string;
  };
  isOpen?: boolean;
  isLocked?: boolean;
  onEnter?: () => void;
}

export function CastleDoor({
  position,
  rotation = [0, 0, 0],
  theme,
  isOpen = false,
  isLocked = false,
  onEnter,
}: CastleDoorProps) {
  const doorRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetOpen = isOpen ? 1 : 0;
  const currentOpen = useRef(0);

  useFrame((_, delta) => {
    // Smoothly animate door opening
    currentOpen.current = THREE.MathUtils.lerp(
      currentOpen.current,
      targetOpen,
      delta * 2,
    );

    if (doorRef.current) {
      // Swing door open on Y axis
      doorRef.current.rotation.y = currentOpen.current * Math.PI * 0.6;
    }

    // Animate glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + Math.sin(Date.now() * 0.003) * 0.03;
    }
  });

  const archColor = new THREE.Color(theme.curtainDark);
  const woodColor = new THREE.Color(theme.curtain);
  const goldColor = new THREE.Color(theme.gold);
  const metalColor = new THREE.Color(theme.curtainDark).multiplyScalar(0.6);

  const handleClick = () => {
    if (!isLocked && onEnter) {
      onEnter();
    }
  };

  return (
    <group position={position} rotation={rotation} onClick={handleClick}>
      {/* Door frame - stone archway */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 4.6, 0.25]} />
        <meshStandardMaterial color={archColor} roughness={0.9} />
      </mesh>

      {/* Arch cutout visual - darker inset */}
      <mesh position={[0, 0.1, 0.12]}>
        <boxGeometry args={[2.2, 4.2, 0.1]} />
        <meshStandardMaterial color={archColor} roughness={0.95} />
      </mesh>

      {/* Wooden door panel */}
      <group ref={doorRef} position={[0, -0.1, 0.15]}>
        {/* Main door body */}
        <mesh castShadow>
          <boxGeometry args={[1.8, 3.8, 0.12]} />
          <meshStandardMaterial
            color={woodColor}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Iron bands */}
        {[-1.2, 0, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.07]}>
            <boxGeometry args={[1.7, 0.15, 0.04]} />
            <meshStandardMaterial
              color={metalColor}
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* Door handle / ring */}
        <mesh position={[0.5, 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.12, 0.025, 8, 16]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Vertical handle bar */}
        <mesh position={[0.5, 0.2, 0.08]}>
          <boxGeometry args={[0.05, 0.5, 0.03]} />
          <meshStandardMaterial
            color={goldColor}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Decorative studs */}
        {[
          [-0.4, 1.4],
          [0.4, 1.4],
          [-0.4, -1.4],
          [0.4, -1.4],
        ].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.08]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={goldColor}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Stone keystone above arch */}
      <mesh position={[0, 2.4, -0.05]}>
        <boxGeometry args={[0.4, 0.5, 0.2]} />
        <meshStandardMaterial color={archColor} roughness={0.85} />
      </mesh>

      {/* Arch trim - gold band */}
      <mesh position={[0, 2.15, 0.0]}>
        <boxGeometry args={[2.5, 0.08, 0.15]} />
        <meshStandardMaterial
          color={goldColor}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Door glow / haze */}
      <mesh ref={glowRef} position={[0, 0.2, 0.3]}>
        <planeGeometry args={[1.6, 3.6]} />
        <meshBasicMaterial
          color={theme.goldLight}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lock indicator for locked doors */}
      {isLocked && (
        <group position={[0, 0, 0.2]}>
          {/* Chain across door */}
          {[-0.5, 0.5].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 3.5, 0.04]} />
              <meshStandardMaterial
                color="#2a2a2a"
                roughness={0.6}
                metalness={0.7}
              />
            </mesh>
          ))}
          {/* Padlock */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.25, 0.2, 0.08]} />
            <meshStandardMaterial
              color={goldColor}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
          <mesh position={[0, 0.15, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.025, 8, 12, Math.PI]} />
            <meshStandardMaterial
              color={goldColor}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
