"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import { useRoomsStore } from "@/components/rooms-r3f/store";

import type { DressCodeConfig } from "@/types/event";

interface DressCodeRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  dressCode?: DressCodeConfig;
}

// Cache so we don't refetch the same hex on every render
const colorNameCache = new Map<string, string>();

async function fetchColorName(hex: string): Promise<string> {
  const key = hex.replace("#", "").toLowerCase();
  if (colorNameCache.has(key)) return colorNameCache.get(key)!;
  try {
    const res = await fetch(
      `https://api.color.pizza/v1/?values=${key}&list=bestOf`,
    );
    const data = await res.json();
    const name: string = data?.colors?.[0]?.name ?? hex;
    colorNameCache.set(key, name);
    return name;
  } catch {
    colorNameCache.set(key, hex);
    return hex;
  }
}

// ── Runway platform ───────────────────────────────────────────────────────────

function Runway({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Platform surface */}
      <mesh>
        <boxGeometry args={[1.8, 0.14, ROOM_LENGTH * 0.72]} />
        <meshStandardMaterial color="#111" roughness={0.08} metalness={0.2} />
      </mesh>
      {/* Edge strips */}
      {([-0.9, 0.9] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.072, 0]}>
          <boxGeometry args={[0.04, 0.01, ROOM_LENGTH * 0.72]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
      {/* Dotted centre line */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.072, -ROOM_LENGTH * 0.3 + i * (ROOM_LENGTH * 0.05)]}
        >
          <boxGeometry args={[0.04, 0.01, 0.12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Simple mannequin with fabric draped over it ────────────────────────────

function Mannequin({
  position,
  fabricColor,
  swayOffset,
  colourName,
}: {
  position: [number, number, number];
  fabricColor: string;
  swayOffset: number;
  colourName?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y =
      Math.sin(clock.getElapsedTime() * 0.55 + swayOffset) * 0.06;
  });

  useEffect(() => {
    if (!colourName) return;
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    // Pill background
    ctx.fillStyle = "rgba(10,6,2,0.82)";
    ctx.beginPath();
    ctx.roundRect(0, 0, 384, 96, 20);
    ctx.fill();
    // Colour swatch circle
    ctx.fillStyle = fabricColor;
    ctx.beginPath();
    ctx.arc(52, 48, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Label text
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(colourName.toUpperCase(), 96, 48);
    const tex = new THREE.CanvasTexture(canvas);
    if (labelRef.current) {
      const m = labelRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [fabricColor, colourName]);

  return (
    <group ref={groupRef} position={position}>
      {/* Stand pole */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Base disc */}
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.05, 16]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.2, 8]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.7} />
      </mesh>
      {/* Colour name label — floats above head */}
      {colourName && (
        <mesh ref={labelRef} position={[0, 1.32, 0]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.72, 0.18]} />
          <meshBasicMaterial
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Torso */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.22, 0.17, 0.9, 10]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.7} />
      </mesh>
      {/* Shoulder bar */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.65, 8]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Fabric — draped dress/suit geometry */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.28, 0.52, 1.1, 12]} />
        <meshStandardMaterial
          color={fabricColor}
          roughness={0.4}
          metalness={0.05}
          emissive={fabricColor}
          emissiveIntensity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fabric flare — wider bottom for more colour coverage */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.38, 0.58, 0.5, 12]} />
        <meshStandardMaterial
          color={fabricColor}
          roughness={0.4}
          metalness={0.05}
          emissive={fabricColor}
          emissiveIntensity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Ornate back-wall mirror with style plaque ─────────────────────────────────

function OrnateBackMirror({
  accent,
  styleLabel,
  styleDescription,
  position,
  rotation,
}: {
  accent: string;
  styleLabel: string;
  styleDescription: string;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const plaqueRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = "#1a0e04";
    ctx.font = "bold 40px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(styleLabel.toUpperCase(), 256, 52);
    ctx.fillStyle = "#5a4030";
    ctx.font = "italic 26px serif";
    ctx.fillText(styleDescription, 256, 106);
    const tex = new THREE.CanvasTexture(canvas);
    if (plaqueRef.current) {
      const m = plaqueRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [styleLabel, styleDescription]);

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Gold frame */}
      <mesh position={[0, 0, -0.045]}>
        <boxGeometry args={[2.6, 2.2, 0.06]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.14}
          metalness={0.94}
        />
      </mesh>
      {/* Mirror surface */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.4, 2.0]} />
        <meshStandardMaterial
          color="#c8d8e0"
          roughness={0.05}
          metalness={0.95}
          envMapIntensity={1.0}
        />
      </mesh>
      {/* Frame ornamental corners */}
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as [number, number][]
      ).map(([sx, sy], i) => (
        <mesh key={i} position={[sx * 1.22, sy * 1.02, -0.02]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.12}
            metalness={0.96}
          />
        </mesh>
      ))}
      {/* Plaque below mirror */}
      <mesh position={[0, -1.22, -0.02]}>
        <boxGeometry args={[1.8, 0.35, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.88} />
      </mesh>
      <mesh ref={plaqueRef} position={[0, -1.22, 0.01]}>
        <planeGeometry args={[1.76, 0.33]} />
        <meshStandardMaterial roughness={0.5} />
      </mesh>

      <pointLight
        position={[0.5, 0, 0.3]}
        color="#fff8e8"
        intensity={2.5}
        distance={5}
        decay={2}
      />
    </group>
  );
}

// ── Ceiling PAR can spotlight rig ─────────────────────────────────────────────

function PARCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Can body */}
      <mesh>
        <cylinderGeometry args={[0.095, 0.08, 0.22, 8]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Lens */}
      <mesh position={[0, -0.12, 0]}>
        <circleGeometry args={[0.078, 16]} />
        <meshStandardMaterial
          color="#ffeecc"
          emissive="#ffeecc"
          emissiveIntensity={2.8}
        />
      </mesh>
      <spotLight
        position={[0, -0.12, 0]}
        target-position={[0, -ROOM_HEIGHT, 0]}
        color="#fff5e0"
        intensity={6}
        angle={0.35}
        penumbra={0.45}
        distance={ROOM_HEIGHT + 1}
        decay={1.5}
        castShadow={false}
      />
    </group>
  );
}

// ── Side table with notes card ────────────────────────────────────────────────

function NotesCard({
  position,
  notes,
  accent,
  onOpen,
}: {
  position: [number, number, number];
  notes: string;
  accent: string;
  onOpen: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#faf5e8";
    ctx.fillRect(0, 0, 640, 480);

    // Outer gold border
    ctx.strokeStyle = accent + "90";
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 624, 464);
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 604, 444);

    // Header band
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 640, 72);

    // Header text
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4;
    ctx.fillText("A NOTE FROM US", 320, 36);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = accent + "50";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(32, 88);
    ctx.lineTo(608, 88);
    ctx.stroke();

    // Body text — larger, darker, better line height
    ctx.fillStyle = "#1a0a04";
    ctx.font = "italic 28px serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const words = notes.split(" ");
    let line = "";
    let y = 104;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 580 && line !== "") {
        ctx.fillText(line.trim(), 30, y);
        line = word + " ";
        y += 42;
        if (y > 430) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), 30, y);
    const tex = new THREE.CanvasTexture(canvas);
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshBasicMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    return () => tex.dispose();
  }, [notes, accent]);

  return (
    <group position={position}>
      {/* Small side table */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.6]} />
        <meshStandardMaterial color="#1a1010" roughness={0.5} />
      </mesh>
      {(
        [
          [-0.38, -0.25],
          [0.38, -0.25],
          [-0.38, 0.25],
          [0.38, 0.25],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.32, z]}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
      {/* Card — upright, facing camera */}
      <mesh
        position={[0, 0.28, 0]}
        rotation={[0, 0, 0]}
        scale={hovered ? [1.06, 1.06, 1] : [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
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
        <boxGeometry args={[0.82, 0.58, 0.008]} />
        <meshStandardMaterial color="#faf5e8" roughness={0.85} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[0, 0.28, 0.006]}
        rotation={[0, 0, 0]}
        scale={hovered ? [1.06, 1.06, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[0.8, 0.56]} />
        <meshBasicMaterial transparent />
      </mesh>
      {/* Dedicated light so card is always readable */}
      <pointLight
        position={[0, 0.6, 0.4]}
        color="#fff8e0"
        intensity={2.5}
        distance={2.5}
        decay={2}
      />

      {hovered && (
        <pointLight
          position={[0, 0.5, 0.5]}
          color={accent}
          intensity={1.2}
          distance={1.8}
          decay={2}
        />
      )}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const STYLE_LABELS: Record<string, { label: string; description: string }> = {
  "black-tie": {
    label: "Black Tie",
    description: "Tuxedos & floor-length gowns",
  },
  "black-tie-optional": {
    label: "Black Tie Optional",
    description: "Tuxedos welcome, dark suits accepted",
  },
  cocktail: {
    label: "Cocktail Attire",
    description: "Suits & cocktail or midi dresses",
  },
  "smart-casual": {
    label: "Smart Casual",
    description: "Neat, polished — no jeans or trainers",
  },
  "garden-party": {
    label: "Garden Party",
    description: "Florals, linens & block colours welcome",
  },
  "beach-formal": {
    label: "Beach Formal",
    description: "Light fabrics, no stilettos",
  },
  casual: {
    label: "Casual",
    description: "Come comfortable — just celebrate with us",
  },
  "african-formal": {
    label: "African Formal",
    description: "Aso-ebi, agbada, kente & traditional dress",
  },
  "south-asian-formal": {
    label: "South Asian Formal",
    description: "Sarees, lehengas, sherwanis & kurta sets",
  },
  "east-asian-formal": {
    label: "East Asian Formal",
    description: "Qipao, hanbok, kimono or formal Western dress",
  },
  "middle-eastern": {
    label: "Middle Eastern",
    description: "Thobes, abayas, kaftans & elegant formal wear",
  },
  "latin-formal": {
    label: "Latin Formal",
    description: "Guayaberas, huipil, or elegant festa attire",
  },
  "smart-traditional": {
    label: "Smart Traditional",
    description: "Your finest cultural or formal attire",
  },
  traditional: {
    label: "Traditional Attire",
    description: "Dress in your cultural best",
  },
};

function MannequinParade({
  palette,
  floorY,
}: {
  palette: string[];
  floorY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const SPACING = 2.8;
  const totalLength = palette.length * SPACING;
  const allColours = [...palette, ...palette];

  useFrame((_, delta) => {
    if (!groupRef.current || palette.length === 0) return;
    // Walk forward (toward camera = increasing Z)
    groupRef.current.position.z += delta * 0.7;
    if (groupRef.current.position.z > totalLength) {
      groupRef.current.position.z = 0;
    }
  });

  const [colourNames, setColourNames] = useState<string[]>(
    palette.map((hex) => hex.toUpperCase()), // show hex immediately while fetching
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(palette.map((hex) => fetchColorName(hex))).then((names) => {
      if (!cancelled) setColourNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [palette.join(",")]);

  if (palette.length === 0) return <group />;

  return (
    <group ref={groupRef}>
      {allColours.map((colour, i) => (
        <Mannequin
          key={i}
          position={[0, floorY + 0.35, -ROOM_LENGTH * 0.28 - i * SPACING]}
          fabricColor={colour}
          swayOffset={i * 1.3}
          colourName={colourNames[i % palette.length]}
        />
      ))}
    </group>
  );
}

function WantedCarousel({
  colours,
  position,
  rotation,
}: {
  colours: string[];
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const namesRef = useRef<string[]>(colours.map((hex) => hex.toUpperCase()));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const slideXRef = useRef(0); // current X offset of active slide (0 = settled)
  const dirRef = useRef(0); // 0 = idle, -1 = sliding left (next), 1 = sliding right (prev)
  const activeRef = useRef(0); // index of current colour
  const nextRef = useRef(1); // index of incoming colour
  const dwellRef = useRef(0); // time spent on current slide

  const W = 420;
  const H = 620;
  const DWELL = 2.8; // seconds per colour
  const SLIDE_SPEED = W * 1.8; // px per second

  useEffect(() => {
    let cancelled = false;
    Promise.all(colours.map((hex) => fetchColorName(hex))).then((names) => {
      if (!cancelled) namesRef.current = names;
    });
    return () => {
      cancelled = true;
    };
  }, [colours.join(",")]);

  const drawSlide = (
    ctx: CanvasRenderingContext2D,
    colour: string,
    offsetX: number,
  ) => {
    const cx = W / 2 + offsetX;
    const cy = H * 0.42;
    const cr = 140;

    // White backing disc
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, cr + 8, 0, Math.PI * 2);
    ctx.fill();

    // Colour fill
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Dark outline
    ctx.strokeStyle = "#1a0800";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    // Red X lines
    ctx.strokeStyle = "rgba(204,0,0,0.75)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - cr * 0.65, cy - cr * 0.65);
    ctx.lineTo(cx + cr * 0.65, cy + cr * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + cr * 0.65, cy - cr * 0.65);
    ctx.lineTo(cx - cr * 0.65, cy + cr * 0.65);
    ctx.stroke();

    // Hex label below circle
    const idx = colours.indexOf(colour) !== -1 ? colours.indexOf(colour) : 0;

    // const label = match ? match.name.toUpperCase() : colour.toUpperCase();
    const label = (namesRef.current[idx] ?? colour).toUpperCase();
    const labelY = cy + cr + 18;
    const labelPadX = 22;
    const labelPadY = 10;
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Measure text width for pill sizing
    const textW = ctx.measureText(label).width;
    const pillW = textW + labelPadX * 2;
    const pillH = 46;
    const pillX = cx - pillW / 2;

    // White pill background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(pillX, labelY, pillW, pillH, 8);
    ctx.fill();

    // Dark border
    ctx.strokeStyle = "#1a080044";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, labelY, pillW, pillH, 8);
    ctx.stroke();

    // Label text
    ctx.fillStyle = "#1a0800";
    ctx.fillText(label, cx, labelY + labelPadY);
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const tex = texRef.current;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext("2d")!;

    // Poster chrome — redrawn each frame
    ctx.clearRect(0, 0, W, H);

    // Sepia background
    ctx.fillStyle = "#d4b87a";
    ctx.fillRect(0, 0, W, H);

    // Age overlay edges
    ctx.fillStyle = "#a08040aa";
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);

    // Torn edge
    ctx.fillStyle = "#c4a86a";
    for (let x = 0; x < W; x += 12) {
      ctx.fillRect(x, 0, 6, 4 + Math.floor((x * 3) % 8));
    }

    // Borders
    ctx.strokeStyle = "#5a3a10";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // WANTED header
    ctx.fillStyle = "#1a0800";
    ctx.font = "bold 72px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("WANTED", W / 2, 28);

    // Decorative rule
    ctx.strokeStyle = "#5a3a10";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 110);
    ctx.lineTo(W - 28, 110);
    ctx.stroke();

    // Clip to inner area so slides don't bleed past poster chrome
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 118, W - 40, H - 160);
    ctx.clip();

    // Draw active slide at current offset
    drawSlide(ctx, colours[activeRef.current], slideXRef.current);

    // Draw incoming slide — enters from opposite side
    if (dirRef.current !== 0) {
      const incomingOffset = slideXRef.current + dirRef.current * -W;
      drawSlide(ctx, colours[nextRef.current], incomingOffset);
    }

    ctx.restore();

    // AVOID footer — always visible, outside clip
    ctx.fillStyle = "#cc0000";
    ctx.font = "bold 64px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.strokeText("AVOID", W / 2, H - 18);
    ctx.fillText("AVOID", W / 2, H - 18);

    // Pagination dots if more than 1 colour
    if (colours.length > 1) {
      const dotY = H - 22;
      const dotSpacing = 18;
      const totalDots = colours.length;
      const startX = W / 2 - ((totalDots - 1) * dotSpacing) / 2;
      for (let d = 0; d < totalDots; d++) {
        ctx.beginPath();
        ctx.arc(startX + d * dotSpacing, dotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = d === activeRef.current ? "#cc0000" : "#cc000055";
        ctx.fill();
      }
    }

    tex.needsUpdate = true;
  };

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    texRef.current = tex;
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    }
    redraw();
    return () => tex.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colours]);

  useFrame((_, delta) => {
    if (colours.length <= 1) return;

    if (dirRef.current === 0) {
      // Dwelling on current slide
      dwellRef.current += delta;
      if (dwellRef.current >= DWELL) {
        dwellRef.current = 0;
        dirRef.current = -1; // slide left = go to next
        nextRef.current = (activeRef.current + 1) % colours.length;
        slideXRef.current = 0;
      }
    } else {
      // Animating slide
      slideXRef.current += dirRef.current * SLIDE_SPEED * delta;

      // Slide complete when active has moved fully off screen
      if (Math.abs(slideXRef.current) >= W) {
        activeRef.current = nextRef.current;
        slideXRef.current = 0;
        dirRef.current = 0;
      }
    }

    redraw();
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef}>
        <planeGeometry args={[1.3, 1.75]} />
        <meshStandardMaterial color="#d4b87a" roughness={0.85} />
      </mesh>
    </group>
  );
}

export function DressCodeRoom({ theme, dressCode }: DressCodeRoomProps) {
  const accent = theme.accent;
  const floorY = -ROOM_HEIGHT / 2;

  const palette = dressCode?.colourPalette?.length
    ? dressCode.colourPalette
    : ["#2a2a5a", "#5a2a2a", "#1a4a1a"];
  const avoidColours = dressCode?.avoidColours ?? [];

  const styleMeta = dressCode?.style
    ? (STYLE_LABELS[dressCode.style] ?? {
        label: dressCode.style,
        description: "",
      })
    : { label: "Dress Code", description: "" };
  const styleLabel = dressCode?.title ?? styleMeta.label;
  const styleDescription = styleMeta.description;

  return (
    <group>
      {/* ── Runway ── */}
      <Runway position={[0, floorY + 0.07, -ROOM_LENGTH * 0.52]} />

      {/* ── Mannequin parade — all palette colours, looping ── */}
      <MannequinParade palette={palette} floorY={floorY} />

      {/* ── Back wall ornate mirror ── */}
      <OrnateBackMirror
        accent={accent}
        styleLabel={styleLabel}
        styleDescription={styleDescription}
        position={[-ROOM_WIDTH / 2 + 0.08, 0.4, -ROOM_LENGTH * 0.82]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* ── Left wall: avoid-colour WANTED posters ── */}
      {avoidColours.filter((_, i) => i % 2 === 0).length > 0 && (
        <WantedCarousel
          colours={avoidColours.filter((_, i) => i % 2 === 0)}
          position={[-ROOM_WIDTH / 2 + 0.06, 0.5, -ROOM_LENGTH * 0.62]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}

      {/* ── Right wall: avoid-colour WANTED posters ── */}
      {avoidColours.filter((_, i) => i % 2 === 1).length > 0 && (
        <WantedCarousel
          colours={avoidColours.filter((_, i) => i % 2 === 1)}
          position={[ROOM_WIDTH / 2 - 0.06, 0.5, -ROOM_LENGTH * 0.62]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      )}

      {/* ── PAR can lights across ceiling ── */}
      {Array.from({ length: 5 }).map((_, i) => (
        <PARCan
          key={i}
          position={[
            0,
            ROOM_HEIGHT / 2 - 0.11,
            -ROOM_LENGTH * (0.22 + i * 0.14),
          ]}
        />
      ))}

      {/* ── PAR can ceiling rig rail ── */}
      <mesh position={[0, ROOM_HEIGHT / 2 - 0.04, -ROOM_LENGTH * 0.52]}>
        <boxGeometry args={[0.28, 0.06, ROOM_LENGTH * 0.72]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* ── Glossy runway floor reflection strip ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY + 0.002, -ROOM_LENGTH * 0.52]}
      >
        <planeGeometry args={[1.82, ROOM_LENGTH * 0.72]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.04}
          metalness={0.3}
        />
      </mesh>

      {/* ── Notes card (only if notes present) ── */}
      {dressCode?.notes && (
        <NotesCard
          position={[ROOM_WIDTH / 2 - 0.65, floorY + 0.55, -ROOM_LENGTH * 0.62]}
          notes={dressCode.notes}
          accent={accent}
          onOpen={() =>
            useRoomsStore.getState().setOpenCard({
              year: "",
              icon: "📝",
              title: "A Note From Us",
              desc: dressCode.notes!,
            })
          }
        />
      )}
    </group>
  );
}
