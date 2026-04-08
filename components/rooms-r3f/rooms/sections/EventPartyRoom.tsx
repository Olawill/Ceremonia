"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import type { EventPartyMember } from "@/types/event";
import { useFrame } from "@react-three/fiber";
import { useRoomsStore } from "../../store";

interface EventPartyRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  members?: EventPartyMember[];
  bride?: string;
  groom?: string;
}

// ── Portrait frame with canvas-rendered member info ───────────────────────────
function PortraitFrame({
  members,
  position,
  rotation,
  accent,
  sideLabel,
  size = "normal",
  onClick,
}: {
  members: EventPartyMember[];
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
  sideLabel: string;
  size?: "normal" | "wide";
  onClick?: (member: EventPartyMember) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const activeRef = useRef(0);
  const timerRef = useRef(0);
  const texRef = useRef<THREE.CanvasTexture | null>(null);

  const [hovered, setHovered] = useState(false);

  const CYCLE_INTERVAL = 3.5;

  const W = size === "wide" ? 1.6 : 1.1;
  const H = size === "wide" ? 1.9 : 1.45;
  const CW = size === "wide" ? 1024 : 768;
  const CH = size === "wide" ? 1280 : 1024;

  const drawMember = (member: EventPartyMember, index: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d")!;

    // Rich oil painting background
    const bg = ctx.createRadialGradient(
      CW / 2,
      CH * 0.38,
      0,
      CW / 2,
      CH * 0.38,
      CW * 0.72,
    );
    bg.addColorStop(0, "#2e2018");
    bg.addColorStop(1, "#0a0704");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // Subtle canvas texture lines
    ctx.strokeStyle = "rgba(255,255,255,0.018)";
    ctx.lineWidth = 1;
    for (let y = 0; y < CH; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CW, y);
      ctx.stroke();
    }

    // Top label band
    ctx.fillStyle = accent + "22";
    ctx.fillRect(0, 0, CW, 68);
    ctx.fillStyle = accent + "bb";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sideLabel.toUpperCase(), CW / 2, 34);

    // Ornate circle border
    const cx = CW / 2;
    const cy = CH * 0.39;
    const cr = CW * 0.3;

    // Outer glow ring
    ctx.strokeStyle = accent + "30";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, cr + 14, 0, Math.PI * 2);
    ctx.stroke();

    // Main circle fill
    ctx.fillStyle = accent + "1a";
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Circle border
    ctx.strokeStyle = accent + "aa";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    // Inner decorative ring
    ctx.strokeStyle = accent + "44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr - 18, 0, Math.PI * 2);
    ctx.stroke();

    // If member has a photo, attempt to load it — otherwise show initials
    const initials = member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    if (member.photoUrl) {
      // Draw photo clipped to circle
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cr - 6, 0, Math.PI * 2);
        ctx.clip();
        // Scale to fill circle
        const s = (cr * 2) / Math.min(img.width, img.height);
        const iw = img.width * s;
        const ih = img.height * s;
        ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
        ctx.restore();
        // Re-apply accent ring on top of photo
        ctx.strokeStyle = accent + "aa";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();
        // Re-draw text over photo
        drawText();
        const tex = new THREE.CanvasTexture(canvas);
        if (texRef.current) texRef.current.dispose();
        texRef.current = tex;
        if (meshRef.current) {
          const m = meshRef.current.material as THREE.MeshBasicMaterial;
          m.map = tex;
          m.needsUpdate = true;
        }
      };
      img.src = member.photoUrl;
    }

    // Initials (always drawn; photo will overdraw if it loads)
    ctx.fillStyle = accent;
    ctx.font = `bold 140px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30;
    ctx.fillText(initials, cx, cy);
    ctx.shadowBlur = 0;

    const drawText = () => {
      // Name
      ctx.fillStyle = "#f8f2e8";
      ctx.font = "bold 52px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillText(member.name, CW / 2, CH * 0.64);
      ctx.shadowBlur = 0;

      // Decorative rule
      ctx.strokeStyle = accent + "70";
      ctx.lineWidth = 2;
      const ruleY = CH * 0.64 + 62;
      ctx.beginPath();
      ctx.moveTo(CW * 0.22, ruleY);
      ctx.lineTo(CW * 0.78, ruleY);
      ctx.stroke();

      // Role
      const roleLabel =
        member.role === "custom"
          ? (member.customRole ?? "")
          : member.role
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
      ctx.fillStyle = accent + "dd";
      ctx.font = "32px sans-serif";
      ctx.fillText(roleLabel, CW / 2, ruleY + 18);

      // Relation
      if (member.relation) {
        ctx.fillStyle = "#f5f0e870";
        ctx.font = "italic 28px serif";
        ctx.fillText(member.relation, CW / 2, ruleY + 64);
      }

      // Pagination dots if cycling
      if (members.length > 1) {
        const dotSpacing = 22;
        const startX = CW / 2 - ((members.length - 1) * dotSpacing) / 2;
        members.forEach((_, di) => {
          ctx.beginPath();
          ctx.arc(startX + di * dotSpacing, CH - 30, 7, 0, Math.PI * 2);
          ctx.fillStyle = di === index ? accent : accent + "35";
          ctx.fill();
        });
      }
    };

    drawText();

    const tex = new THREE.CanvasTexture(canvas);
    if (texRef.current) texRef.current.dispose();
    texRef.current = tex;
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (members.length === 0) return;
    drawMember(members[0], 0);
    return () => {
      texRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, accent]);

  // Only cycle if this frame has more than 1 member assigned to it
  useFrame((_, delta) => {
    if (members.length <= 1) return;
    timerRef.current += delta;
    if (timerRef.current >= CYCLE_INTERVAL) {
      timerRef.current = 0;
      activeRef.current = (activeRef.current + 1) % members.length;
      drawMember(members[activeRef.current], activeRef.current);
    }
  });

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Outer gold frame */}
      <mesh
        position={[0, 0, -0.065]}
        scale={hovered ? [1.03, 1.03, 1] : [1, 1, 1]}
      >
        <boxGeometry args={[W + 0.28, H + 0.28, 0.08]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.12}
          metalness={0.95}
        />
      </mesh>
      {/* Mat board */}
      <mesh position={[0, 0, -0.018]}>
        <boxGeometry args={[W + 0.08, H + 0.08, 0.03]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.9} />
      </mesh>
      {/* Portrait surface — meshBasicMaterial so always visible */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.005]}
        scale={hovered ? [1.03, 1.03, 1] : [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick && members.length > 0) {
            onClick(members[activeRef.current]);
          }
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial />
      </mesh>
      {/* Nameplate */}
      <mesh position={[0, -(H / 2 + 0.13), -0.02]}>
        <boxGeometry args={[W * 0.72, 0.14, 0.045]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.16}
          metalness={0.92}
        />
      </mesh>
      {/* Frame corner ornaments */}
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as [number, number][]
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[sx * (W / 2 + 0.1), sy * (H / 2 + 0.1), -0.03]}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.1}
            metalness={0.98}
          />
        </mesh>
      ))}
      {/* Dedicated portrait spotlight */}
      <pointLight
        position={[0, H / 2 + 0.5, 0.4]}
        color="#fff8e0"
        intensity={2.5}
        distance={3.5}
        decay={2}
      />

      {hovered && (
        <pointLight
          position={[0, 0, 0.5]}
          color={accent}
          intensity={1.8}
          distance={2}
          decay={2}
        />
      )}
    </group>
  );
}

// ── Dado rail strip ───────────────────────────────────────────────────────────
function DadoRail({
  position,
  width,
  color,
}: {
  position: [number, number, number];
  width: number;
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.06, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.055, 0]}>
        <boxGeometry args={[width, 0.04, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.55} />
      </mesh>
    </group>
  );
}

// ── Central balustrade divider ────────────────────────────────────────────────
function Balustrade({ accent }: { accent: string }) {
  const floorY = -ROOM_HEIGHT / 2;
  const posts = 8;
  const spacing = (ROOM_LENGTH * 0.55) / posts;
  return (
    <group>
      {/* Top rail */}
      <mesh position={[0, floorY + 0.68, -ROOM_LENGTH * 0.55]}>
        <boxGeometry args={[0.08, 0.06, ROOM_LENGTH * 0.55]} />
        <meshStandardMaterial color="#3a2510" roughness={0.4} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: posts }).map((_, i) => (
        <mesh
          key={i}
          position={[0, floorY + 0.34, -ROOM_LENGTH * 0.28 - i * spacing]}
        >
          <boxGeometry args={[0.06, 0.68, 0.06]} />
          <meshStandardMaterial color="#3a2510" roughness={0.45} />
        </mesh>
      ))}
      {/* Gold finials on posts */}
      {Array.from({ length: posts }).map((_, i) => (
        <mesh
          key={i}
          position={[0, floorY + 0.72, -ROOM_LENGTH * 0.28 - i * spacing]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.14}
            metalness={0.96}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function EventPartyRoom({ theme, members = [] }: EventPartyRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  const bridesSide = members.filter(
    (m) => m.side === "bride" || m.side === "both",
  );
  const groomsSide = members.filter(
    (m) => m.side === "groom" || m.side === "both",
  );

  // Distribute members across N frames for a side.
  // Each frame gets at most Math.ceil(total/frameCount) members.
  // Frame 0 gets members[0..k-1], frame 1 gets members[k..2k-1], etc.
  // If a frame has exactly 1 member, no cycling. If more, it cycles.
  function distributeMembers(
    sideMembers: EventPartyMember[],
    frameCount: number,
  ): EventPartyMember[][] {
    const result: EventPartyMember[][] = Array.from(
      { length: frameCount },
      () => [],
    );
    sideMembers.forEach((m, i) => {
      result[i % frameCount].push(m);
    });
    return result;
  }

  // 3 frames per side: 2 on the side wall, 1 on the back wall
  const BRIDE_FRAME_COUNT = 3;
  const GROOM_FRAME_COUNT = 3;

  const brideFrames = distributeMembers(bridesSide, BRIDE_FRAME_COUNT);
  const groomFrames = distributeMembers(groomsSide, GROOM_FRAME_COUNT);

  const activeBrideFrames = brideFrames.filter((f) => f.length > 0);
  const activeGroomFrames = groomFrames.filter((f) => f.length > 0);

  const frameY = 0.4; // vertical centre of frames
  // Left wall (bride): 2 frames at different depths
  const leftWallZ1 = -ROOM_LENGTH * 0.58;
  const leftWallZ2 = -ROOM_LENGTH * 0.85;
  // Right wall (groom): 2 frames at different depths
  const rightWallZ1 = -ROOM_LENGTH * 0.58;
  const rightWallZ2 = -ROOM_LENGTH * 0.85;
  // Back wall: side of door
  const backWallX = ROOM_WIDTH / 4;
  const backWallZ = -ROOM_LENGTH + 0.1;

  return (
    <group>
      {/* ── Bride's side frames — left wall (up to 2) + back-left (up to 1) ── */}
      {[
        [-ROOM_WIDTH / 2 + 0.08, frameY, leftWallZ1, 0, Math.PI / 2, 0],
        [-ROOM_WIDTH / 2 + 0.08, frameY, leftWallZ2, 0, Math.PI / 2, 0],
        [-backWallX, frameY, backWallZ, 0, 0, 0],
      ]
        .slice(0, activeBrideFrames.length)
        .map(([x, y, z, rx, ry, rz], i) => (
          <PortraitFrame
            key={i}
            members={activeBrideFrames[i]}
            position={[x, y, z]}
            rotation={[rx, ry, rz]}
            accent={accent}
            sideLabel="Bride's Side"
            size={i === 2 ? "wide" : "normal"}
            onClick={(member) =>
              useRoomsStore.getState().setOpenPartyMember(member)
            }
          />
        ))}

      {/* ── Groom's side frames — right wall (up to 2) + back-right (up to 1) ── */}
      {[
        [ROOM_WIDTH / 2 - 0.08, frameY, rightWallZ1, 0, -Math.PI / 2, 0],
        [ROOM_WIDTH / 2 - 0.08, frameY, rightWallZ2, 0, -Math.PI / 2, 0],
        [backWallX, frameY, backWallZ, 0, 0, 0],
      ]
        .slice(0, activeGroomFrames.length)
        .map(([x, y, z, rx, ry, rz], i) => (
          <PortraitFrame
            key={i}
            members={activeGroomFrames[i]}
            position={[x, y, z]}
            rotation={[rx, ry, rz]}
            accent={accent}
            sideLabel="Groom's Side"
            size={i === 2 ? "wide" : "normal"}
            onClick={(member) =>
              useRoomsStore.getState().setOpenPartyMember(member)
            }
          />
        ))}

      {/* ── Dado rails ── */}
      <DadoRail
        position={[-ROOM_WIDTH / 2 + 0.02, floorY + 0.9, -ROOM_LENGTH * 0.5]}
        width={ROOM_LENGTH}
        color={accent}
      />
      <DadoRail
        position={[ROOM_WIDTH / 2 - 0.02, floorY + 0.9, -ROOM_LENGTH * 0.5]}
        width={ROOM_LENGTH}
        color={accent}
      />

      {/* ── Central balustrade divider ── */}
      <Balustrade accent={accent} />

      {/* ── Herringbone floor inlay ── */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, i % 2 === 0 ? Math.PI / 4 : -Math.PI / 4, 0]}
          position={[
            0,
            floorY + 0.003,
            -ROOM_LENGTH * 0.2 - i * (ROOM_LENGTH * 0.07),
          ]}
        >
          <planeGeometry args={[0.18, 0.5]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#3a2510" : "#2a1808"}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* ── Coffered ceiling medallion ── */}
      <mesh
        position={[0, ROOM_HEIGHT / 2 - 0.04, -ROOM_LENGTH * 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.8, 0.06, 6, 24]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh
        position={[0, ROOM_HEIGHT / 2 - 0.04, -ROOM_LENGTH * 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.4, 0.04, 6, 24]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ── Ceiling pendant ── */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.15, -ROOM_LENGTH * 0.5]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial
          color="#fff8e0"
          emissive="#fff8e0"
          emissiveIntensity={1.8}
        />
      </mesh>
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH * 0.5]}
        color="#fff8e0"
        intensity={3.5}
        distance={10}
        decay={1.5}
      />
      <pointLight
        position={[0, ROOM_HEIGHT / 2 - 0.2, -ROOM_LENGTH * 0.75]}
        color="#fff8e0"
        intensity={2.0}
        distance={8}
        decay={1.5}
      />

      {/* ── Side wall sconces ── */}
      {([-ROOM_WIDTH / 2 + 0.1, ROOM_WIDTH / 2 - 0.1] as number[]).map(
        (x, i) => (
          <group key={i}>
            <mesh position={[x, 0.6, -ROOM_LENGTH * 0.42]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            <pointLight
              position={[x, 0.72, -ROOM_LENGTH * 0.42]}
              color="#fff8e0"
              intensity={1.2}
              distance={4}
              decay={2}
            />
            <mesh position={[x, 0.6, -ROOM_LENGTH * 0.72]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial
                color={accent}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            <pointLight
              position={[x, 0.72, -ROOM_LENGTH * 0.72]}
              color="#fff8e0"
              intensity={1.2}
              distance={4}
              decay={2}
            />
          </group>
        ),
      )}
    </group>
  );
}
