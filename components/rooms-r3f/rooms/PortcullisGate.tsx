"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type GateStyle = "castle" | "farm" | "arcade" | "garden" | "beach";

interface PortcullisGateProps {
  position: [number, number, number];
  isLocked: boolean;
  style?: GateStyle;
}

function CastleGate() {
  return (
    <group>
      {/* Vertical bars (portcullis) */}
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 3.2, 8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* Horizontal bars */}
      {[0.8, 0, -0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[2.0, 0.06, 0.06]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* Stone archway */}
      <mesh position={[0, 1.8, -0.05]}>
        <boxGeometry args={[2.4, 0.4, 0.2]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      {/* Gold spikes on top */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 2.1, 0]}>
          <coneGeometry args={[0.05, 0.2, 6]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function FarmGate() {
  return (
    <group>
      {/* Wooden crossed gate */}
      <mesh rotation={[0, 0, 0.15]} position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 3.2, 0.08]} />
        <meshStandardMaterial color="#6b5340" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, -0.15]} position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 3.2, 0.08]} />
        <meshStandardMaterial color="#7a6450" roughness={0.9} />
      </mesh>
      {/* Horizontal boards */}
      {[0.8, 0, -0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0.05]}>
          <boxGeometry args={[1.8, 0.2, 0.06]} />
          <meshStandardMaterial color="#8b7355" roughness={0.85} />
        </mesh>
      ))}
      {/* Metal hinges */}
      {[-0.6, 0.6].map((y, i) => (
        <mesh key={i} position={[-0.85, y, 0.05]}>
          <boxGeometry args={[0.12, 0.15, 0.05]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ArcadeGate() {
  return (
    <group>
      {/* Neon barrier */}
      {[-1, 1].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
          <meshStandardMaterial color="#1a1a3e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* Neon strips */}
      <mesh position={[0, 1.2, 0.05]}>
        <boxGeometry args={[2.0, 0.06, 0.04]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0, -0.5, 0.05]}>
        <boxGeometry args={[2.0, 0.06, 0.04]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Warning sign */}
      <mesh position={[0, 1.6, 0.06]}>
        <boxGeometry args={[0.8, 0.4, 0.04]} />
        <meshBasicMaterial color="#ff0044" />
      </mesh>
    </group>
  );
}

function GardenGate() {
  return (
    <group>
      {/* Wooden fence gate */}
      <mesh position={[-0.5, 0, 0]}>
        <boxGeometry args={[0.08, 2.8, 0.06]} />
        <meshStandardMaterial color="#5a7a40" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <boxGeometry args={[0.08, 2.8, 0.06]} />
        <meshStandardMaterial color="#6a8a50" roughness={0.9} />
      </mesh>
      {/* Horizontal rails */}
      {[0.9, 0, -0.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.2, 0.12, 0.05]} />
          <meshStandardMaterial color="#7a9a60" roughness={0.85} />
        </mesh>
      ))}
      {/* Flower vines */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0.05]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function BeachGate() {
  return (
    <group>
      {/* Rope barrier */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
          <meshStandardMaterial color="#d4c4a8" roughness={0.9} />
        </mesh>
      ))}
      {/* Horizontal rope */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
        <meshStandardMaterial color="#c4b498" roughness={0.9} />
      </mesh>
      {/* Beach rope knots */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0.03]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#a08060" roughness={0.95} />
        </mesh>
      ))}
      {/* Driftwood posts */}
      {[-1, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 1.0, 8]} />
          <meshStandardMaterial color="#d4c4a8" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export function PortcullisGate({ position, isLocked, style = "castle" }: PortcullisGateProps) {
  const shakeRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    if (!isLocked || !shakeRef.current) return;
    t.current += delta;
    shakeRef.current.rotation.z = Math.sin(t.current * 2.3) * 0.008;
  });

  return (
    <group ref={shakeRef} position={position}>
      {style === "castle" && <CastleGate />}
      {style === "farm" && <FarmGate />}
      {style === "arcade" && <ArcadeGate />}
      {style === "garden" && <GardenGate />}
      {style === "beach" && <BeachGate />}
    </group>
  );
}
