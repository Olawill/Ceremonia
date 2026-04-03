"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import type { EventType } from "@/types/event";

interface HeroRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  bride?: string;
  groom?: string;
  tagLine?: string;
  topLabel?: string;
  eventType?: EventType;
  heroPhotoUrl?: string;
}

// ── Ambient particles ─────────────────────────────────────────────────────────
function AmbientParticles({
  featureMode,
  accentColor,
}: {
  featureMode: FeatureMode;
  accentColor: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 50;

  const data = useRef(
    Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * ROOM_WIDTH * 0.85,
      y: (Math.random() - 0.5) * ROOM_HEIGHT * 0.75,
      z: -(Math.random() * (ROOM_LENGTH - 2) + 1),
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.01,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      rot: Math.random() * Math.PI,
    })),
  );

  const dummy = useRef(new THREE.Object3D());

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    data.current.forEach((p, i) => {
      p.y += p.speed;
      p.rot += p.rotSpeed;
      if (p.y > ROOM_HEIGHT / 2) p.y = -ROOM_HEIGHT / 2;
      const swayX = Math.sin(t * 0.35 + p.phase) * 0.25;
      dummy.current.position.set(p.x + swayX, p.y, p.z);
      dummy.current.rotation.set(p.rot, p.rot * 0.5, p.rot * 0.3);
      dummy.current.scale.setScalar(0.045 + Math.sin(p.phase + t * 0.5) * 0.01);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(i, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  const color =
    featureMode === "arcade"
      ? accentColor
      : featureMode === "beach"
        ? "#aaddff"
        : featureMode === "garden"
          ? "#ffbbcc"
          : "#cc4466";

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1.3]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={featureMode === "beach" ? 0.25 : 0.45}
        emissive={featureMode === "arcade" ? accentColor : undefined}
        emissiveIntensity={featureMode === "arcade" ? 0.4 : 0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Hero photo backdrop on back wall ─────────────────────────────────────────
function HeroPhotoBackdrop({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    // Sits just in front of the back wall, full wall size, semi-transparent
    <mesh position={[0, 0, -ROOM_LENGTH + 0.05]}>
      <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
      <meshStandardMaterial
        map={texture}
        roughness={1}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Main banner on the back wall ──────────────────────────────────────────────
function HeroBanner({
  bride,
  groom,
  topLabel,
  featureMode,
  theme,
}: {
  bride: string;
  groom?: string;
  topLabel?: string;
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const bannerColor =
    featureMode === "arcade"
      ? "#0a0a2e"
      : featureMode === "beach"
        ? "#f5e6d0"
        : featureMode === "garden"
          ? "#2a3a1a"
          : featureMode === "farm"
            ? "#8b3a2a"
            : theme.curtain;

  const accentHex = theme.accent;
  // Hanging banner dimensions — tall and narrow like championship banners
  const bannerW = ROOM_WIDTH * 0.52;
  const bannerH = ROOM_HEIGHT * 0.88;
  const wallZ = -ROOM_LENGTH + 0.08;
  // Banner top hangs near the ceiling
  const bannerTopY = ROOM_HEIGHT / 2 - 0.1;
  const bannerCentreY = bannerTopY - bannerH / 2;

  // Rope attachment points — two points at the top
  const ropeLeft = -bannerW * 0.36;
  const ropeRight = bannerW * 0.36;

  return (
    <group position={[0, 0, wallZ]}>
      {/* ── Hanging ropes from ceiling to banner top ── */}
      {[ropeLeft, ropeRight].map((x, i) => (
        <mesh key={i} position={[x, bannerTopY + 0.15, 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* ── Top mounting rod ── */}
      <mesh
        position={[0, bannerTopY + 0.32, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.018, 0.018, bannerW * 0.85, 8]} />
        <meshStandardMaterial
          color={accentHex}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      {/* Rod end finials */}
      {[-1, 1].map((side, i) => (
        <mesh
          key={i}
          position={[side * bannerW * 0.43, bannerTopY + 0.32, 0.02]}
        >
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>
      ))}

      {/* ── Main banner fabric ── */}
      <group position={[0, bannerCentreY, 0]}>
        {/* Fabric panel */}
        <mesh>
          <planeGeometry args={[bannerW, bannerH]} />
          <meshStandardMaterial color={bannerColor} roughness={0.85} />
        </mesh>

        {/* Gold border — top */}
        <mesh position={[0, bannerH / 2 - 0.04, 0.01]}>
          <planeGeometry args={[bannerW, 0.07]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        {/* Gold border — bottom */}
        <mesh position={[0, -bannerH / 2 + 0.04, 0.01]}>
          <planeGeometry args={[bannerW, 0.07]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        {/* Gold border — left */}
        <mesh position={[-bannerW / 2 + 0.035, 0, 0.01]}>
          <planeGeometry args={[0.07, bannerH]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        {/* Gold border — right */}
        <mesh position={[bannerW / 2 - 0.035, 0, 0.01]}>
          <planeGeometry args={[0.07, bannerH]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Decorative horizontal divider line */}
        <mesh position={[0, bannerH * 0.18, 0.015]}>
          <planeGeometry args={[bannerW * 0.7, 0.018]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh position={[0, -bannerH * 0.08, 0.015]}>
          <planeGeometry args={[bannerW * 0.7, 0.018]} />
          <meshStandardMaterial
            color={accentHex}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Bottom tassel fringe — decorative triangles */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = (i - 4) * (bannerW / 9);
          return (
            <mesh key={i} position={[x, -bannerH / 2 - 0.09, 0.01]}>
              <coneGeometry args={[0.045, 0.2, 4]} />
              <meshStandardMaterial
                color={accentHex}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          );
        })}

        {/* Text content via Html */}
        <Html
          position={[0, 0, 0.02]}
          center
          occlude={false}
          style={{ pointerEvents: "none", width: `${bannerW * 80}px` }}
        >
          <div
            style={{
              textAlign: "center",
              userSelect: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              width: "100%",
            }}
          >
            {/* Top label */}
            {topLabel && (
              <p
                style={{
                  fontFamily: "var(--font-label, sans-serif)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.6em",
                  textTransform: "uppercase",
                  color: accentHex,
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                {topLabel}
              </p>
            )}

            {/* Monogram */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: `1.5px solid ${accentHex}80`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${accentHex}12`,
              }}
            >
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: groom ? "22px" : "28px",
                  fontWeight: 300,
                  color: accentHex,
                  textShadow: `0 0 12px ${accentHex}80`,
                  letterSpacing: "0.02em",
                }}
              >
                {groom
                  ? `${bride.charAt(0)} & ${groom.charAt(0)}`
                  : bride.charAt(0)}
              </span>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "70px",
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${accentHex}90, transparent)`,
              }}
            />

            {/* Primary name */}
            <div
              style={{
                fontFamily: "serif",
                fontSize: "30px",
                fontWeight: 600,
                color:
                  featureMode === "beach"
                    ? "#3a2510"
                    : featureMode === "garden"
                      ? "#f5ead0"
                      : "#F5F0E8",
                letterSpacing: "0.04em",
                lineHeight: 1.1,
                textShadow: "0 2px 16px rgba(0,0,0,0.8)",
              }}
            >
              {bride}
            </div>

            {/* Ampersand + second name */}
            {groom && groom.trim().length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "serif",
                    fontSize: "20px",
                    color: accentHex,
                    textShadow: `0 0 16px ${accentHex}60`,
                    lineHeight: 1,
                  }}
                >
                  &
                </div>
                <div
                  style={{
                    fontFamily: "serif",
                    fontSize: "30px",
                    fontWeight: 600,
                    color:
                      featureMode === "beach"
                        ? "#3a2510"
                        : featureMode === "garden"
                          ? "#f5ead0"
                          : "#F5F0E8",
                    letterSpacing: "0.04em",
                    lineHeight: 1.1,
                    textShadow: "0 2px 16px rgba(0,0,0,0.8)",
                  }}
                >
                  {groom}
                </div>
              </>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ── Wall plaque ───────────────────────────────────────────────────────────────
// wallSide: "left" | "right" — determines position and rotation automatically
function WallPlaque({
  text,
  subText,
  featureMode,
  theme,
  wallSide,
  verticalPos = 0.4,
}: {
  text: string;
  subText?: string;
  featureMode: FeatureMode;
  theme: RoomTheme;
  wallSide: "left" | "right";
  verticalPos?: number;
}) {
  const plaqueColor =
    featureMode === "arcade"
      ? "#0a0a2e"
      : featureMode === "beach"
        ? "#d4b483"
        : featureMode === "garden"
          ? "#3a4a22"
          : featureMode === "farm"
            ? "#7a6040"
            : "#2a1e14";

  const plaqueW = 2.6;
  const plaqueH = 0.85;

  // Camera is inside room at ~Z=-2.5, looking toward Z=-14.
  // Left wall face points in +X direction. Plaque must stick out in +X from left wall.
  // Right wall face points in -X direction. Plaque sticks out in -X from right wall.
  // Position plaques at mid-depth of the room so they're in view.
  const position: [number, number, number] =
    wallSide === "left"
      ? [-ROOM_WIDTH / 2 + 0.08, verticalPos, -ROOM_LENGTH * 0.65]
      : [ROOM_WIDTH / 2 - 0.08, verticalPos, -ROOM_LENGTH * 0.65];

  const rotationY = wallSide === "left" ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Plaque body */}
      <mesh>
        <boxGeometry args={[plaqueW, plaqueH, 0.04]} />
        <meshStandardMaterial color={plaqueColor} roughness={0.7} />
      </mesh>

      {/* Gold outer border */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[plaqueW + 0.09, plaqueH + 0.09, 0.008]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Inset face */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[plaqueW - 0.05, plaqueH - 0.05, 0.008]} />
        <meshStandardMaterial color={plaqueColor} roughness={0.65} />
      </mesh>

      {/* Corner bolts */}
      {(
        [
          [-plaqueW / 2 + 0.11, plaqueH / 2 - 0.11],
          [plaqueW / 2 - 0.11, plaqueH / 2 - 0.11],
          [-plaqueW / 2 + 0.11, -plaqueH / 2 + 0.11],
          [plaqueW / 2 - 0.11, -plaqueH / 2 + 0.11],
        ] as [number, number][]
      ).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.036]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 8]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* Text — transform mode so Html lives in plaque's local 3D space */}

      <Html
        position={[0, 0, 0.06]}
        center
        transform
        distanceFactor={4}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: "216px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "6px",
            userSelect: "none",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              fontFamily: featureMode === "arcade" ? "monospace" : "serif",
              fontSize: "15px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: theme.accent,
              lineHeight: 1.4,
              textShadow:
                featureMode === "arcade" ? `0 0 8px ${theme.accent}` : "none",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {text}
          </div>
          {subText && (
            <div
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: "11px",
                color: `${theme.accent}AA`,
                letterSpacing: "0.08em",
                lineHeight: 1.3,
              }}
            >
              {subText}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
// ── Floor compass rose ────────────────────────────────────────────────────────
function FloorCompassRose({
  featureMode,
  theme,
  navPrompt,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
  navPrompt: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.06;
    }
  });

  return (
    <group
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH * 0.65]}
    >
      {/* Slowly rotating outer ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.6, 0.025, 8, 64]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.8}
          emissive={theme.accent}
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Static inner disc */}
      <mesh position={[0, 0, -0.004]}>
        <circleGeometry args={[1.55, 64]} />
        <meshStandardMaterial
          color={featureMode === "arcade" ? "#0a0a1e" : "#150e06"}
          roughness={0.9}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Cross arms */}
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, 0, rot]} position={[0, 0, 0.002]}>
          <planeGeometry args={[3.1, 0.018]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Cardinal dots */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 1.2, Math.cos(a) * 1.2, 0.005]}
          >
            <circleGeometry args={[0.055, 8]} />
            <meshStandardMaterial
              color={theme.accent}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}

      {/* Nav prompt text */}
      <Html
        position={[0, 0, 0.01]}
        center
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <p
          style={{
            fontFamily: "var(--font-label, sans-serif)",
            fontSize: "11px",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: theme.accent,
            opacity: 0.75,
            userSelect: "none",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {navPrompt}
        </p>
      </Html>
    </group>
  );
}

// ── Ceiling light ─────────────────────────────────────────────────────────────
function CeilingLight({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const flickerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!flickerRef.current || featureMode === "arcade") return;
    const mat = flickerRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity =
      1.8 +
      Math.sin(clock.getElapsedTime() * 3.5) * 0.18 +
      Math.sin(clock.getElapsedTime() * 7.1) * 0.08;
  });

  if (featureMode === "arcade") {
    return (
      <group position={[0, ROOM_HEIGHT / 2 - 0.08, -ROOM_LENGTH * 0.65]}>
        {([-2.5, 0, 2.5] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[1.8, 0.055, 0.055]} />
            <meshStandardMaterial
              color={theme.accent}
              emissive={theme.accent}
              emissiveIntensity={2.5}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (featureMode === "garden") {
    return (
      <group position={[0, ROOM_HEIGHT / 2 - 0.18, -ROOM_LENGTH * 0.65]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[(-4.5 + i) * 0.95, 0, 0]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial
              color="#fff8e0"
              emissive="#fff8e0"
              emissiveIntensity={2.2}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // Castle / farm / beach — chandelier
  return (
    <group position={[0, ROOM_HEIGHT / 2 - 0.28, -ROOM_LENGTH * 0.65]}>
      {/* Chain */}
      <mesh>
        <cylinderGeometry args={[0.018, 0.018, 0.45, 6]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.25, 0.16, 0.28, 12]} />
        <meshStandardMaterial
          color={featureMode === "beach" ? "#c4a35a" : "#2a1e14"}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Central flame glow */}
      <mesh ref={flickerRef} position={[0, -0.26, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          color="#ffeeaa"
          emissive="#ffeeaa"
          emissiveIntensity={2.0}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Arm candles */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 0.32, -0.3, Math.sin(a) * 0.32]}
          >
            <mesh>
              <cylinderGeometry args={[0.022, 0.027, 0.15, 6]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.095, 0]}>
              <sphereGeometry args={[0.034, 6, 6]} />
              <meshStandardMaterial
                color="#ffeeaa"
                emissive="#ffeeaa"
                emissiveIntensity={1.9}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function HeroRoom({
  featureMode,
  theme,
  bride = "Guest",
  groom,
  tagLine,
  topLabel,
  eventType = "wedding",
  heroPhotoUrl,
}: HeroRoomProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navCopy: Partial<Record<string, string>> = {
    wedding: "Navigate to begin the journey",
    birthday: "Navigate to join the celebration",
    baby_shower: "Navigate to meet the little one",
    anniversary: "Navigate to celebrate with us",
    graduation: "Navigate to the ceremony",
    engagement: "Navigate to begin",
    housewarming: "Navigate to explore",
  };
  const navPrompt = navCopy[eventType] ?? "Navigate to continue";

  if (!mounted) return null;

  return (
    <group>
      {/* Floating particles */}
      <AmbientParticles featureMode={featureMode} accentColor={theme.accent} />

      {/* Hero photo — semi-transparent on back wall when provided */}
      {heroPhotoUrl && <HeroPhotoBackdrop url={heroPhotoUrl} />}

      {/* Back wall — main banner with names and monogram */}
      <HeroBanner
        bride={bride}
        groom={groom}
        topLabel={topLabel}
        featureMode={featureMode}
        theme={theme}
      />

      {/* Left wall — event type label */}
      <WallPlaque
        text={topLabel ?? "Together in Love"}
        subText={eventType.replace(/_/g, " ")}
        featureMode={featureMode}
        theme={theme}
        wallSide="left"
        verticalPos={0.5}
      />

      {/* Right wall — tagline */}
      {tagLine && (
        <WallPlaque
          text={tagLine}
          featureMode={featureMode}
          theme={theme}
          wallSide="right"
          verticalPos={0.5}
        />
      )}

      {/* Floor — compass rose with nav prompt */}
      <FloorCompassRose
        featureMode={featureMode}
        theme={theme}
        navPrompt={navPrompt}
      />

      {/* Ceiling light */}
      <CeilingLight featureMode={featureMode} theme={theme} />
    </group>
  );
}
