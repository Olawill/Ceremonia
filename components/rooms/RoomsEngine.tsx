"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { EventConfig } from "@/types/event";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Tooltip } from "../ui/Tooltip";

interface Section {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface RoomsEngineProps {
  config: EventConfig;
  sections: Section[];
  dateRevealed: boolean;
  onDateRevealed: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────
const ROOM_LENGTH = 14; // depth of each room (Z axis)
const ROOM_WIDTH = 9; // width (X axis)
const ROOM_HEIGHT = 4.5; // height (Y axis)
const CAM_Y = 0.0; // eye height (centred feels more cinematic)
const CAM_Z_OFFSET = 4.8; // how far back from room centre the camera rests
const TRAVEL_EASE = 0.072; // lerp factor — lower = slower/smoother

// ── Corridor constants ──────────────────────────────────────────────────────
const CORRIDOR_LENGTH = 3.5; // gap between rooms — the passageway
const CORRIDOR_WIDTH = 2.8; // narrower than the room, creates a chokepoint
const CORRIDOR_HEIGHT = 3.2; // lower ceiling for drama
const TOTAL_SEGMENT = ROOM_LENGTH + CORRIDOR_LENGTH; // one full room+corridor unit

// ── Particle system ─────────────────────────────────────────────────────────
const DUST_COUNT =
  typeof window !== "undefined" && window.self !== window.top
    ? 80 // preview iframe — reduced for performance
    : 320; // guest page — full effect

// ── Camera spring ───────────────────────────────────────────────────────────
const CAM_SPRING_STIFFNESS = 180;
const CAM_SPRING_DAMPING = 22;

function hexCol(hex: string): THREE.Color {
  // Strip alpha / non-hex chars and parse
  const clean = hex.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
  return new THREE.Color(clean);
}

// ── Procedural floor tile texture ────────────────────────────────────────────
function makeFloorTexture(col1: string, col2: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const tileSize = size / 4;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? col1 : col2;
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }
  // Grout lines
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(size, i * tileSize);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, ROOM_LENGTH / 3);
  return tex;
}

// ── Procedural wall texture (subtle fabric/plaster) ──────────────────────────
function makeWallTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // Base fill
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  // Noise overlay
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// ── Ceiling rose / coffered pattern ──────────────────────────────────────────
function makeCeilingTexture(
  baseHex: string,
  goldHex: string,
): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  // Coffers: 3x3 grid of recessed squares
  const cols = 3,
    rows = 3;
  const cw = size / cols,
    ch = size / rows;
  ctx.strokeStyle = goldHex + "55";
  ctx.lineWidth = 3;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw,
        y = r * ch;
      // Outer border
      ctx.strokeRect(x + 8, y + 8, cw - 16, ch - 16);
      // Inner border
      ctx.strokeRect(x + 18, y + 18, cw - 36, ch - 36);
      // Centre dot
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + ch / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = goldHex + "40";
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// ── Stone block texture for corridors ────────────────────────────────────────
function makeStoneTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  // Stone blocks
  const bw = 128,
    bh = 64;
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  for (let row = 0; row * bh < size; row++) {
    const offset = row % 2 === 0 ? 0 : bw / 2;
    for (let col = -1; col * bw < size; col++) {
      ctx.strokeRect(col * bw + offset + 2, row * bh + 2, bw - 4, bh - 4);
      // Subtle highlight on each block
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.fillRect(col * bw + offset + 4, row * bh + 4, bw - 8, bh - 8);
    }
  }
  // Noise
  for (let i = 0; i < 12000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// ── Heraldic banner canvas texture ───────────────────────────────────────────
function makeBannerTexture(
  curtainHex: string,
  goldHex: string,
): THREE.CanvasTexture {
  const w = 128,
    h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, curtainHex);
  grad.addColorStop(1, curtainHex + "AA");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Border
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  // Fleur-de-lis approximation using arcs
  ctx.fillStyle = goldHex + "CC";
  const cx = w / 2,
    cy = h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 5, cy - 40, 10, 60);
  ctx.beginPath();
  ctx.arc(cx - 22, cy + 10, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 22, cy + 10, 12, 0, Math.PI * 2);
  ctx.fill();
  // Fringe bottom
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = goldHex;
    ctx.fillRect(i * 16 + 4, h - 22, 8, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function RoomsEngine({
  sections,
  dateRevealed,
  onDateRevealed,
}: RoomsEngineProps) {
  const { theme } = useTheme();
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Index of the scratch-date room — navigation beyond this is locked until revealed
  const scratchRoomIndex = sections.findIndex((s) => s.key === "scratch");
  const hasLock = scratchRoomIndex !== -1 && !dateRevealed;
  // Maximum room the guest can navigate to before scratching
  const maxAllowedIndex = hasLock ? scratchRoomIndex : sections.length - 1;

  const maxAllowedIndexRef = useRef(maxAllowedIndex);

  // Three.js state — all in refs, no useState for perf-critical values
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const currentZRef = useRef(0);
  const targetZRef = useRef(0);
  const bobTimeRef = useRef(0);
  const isMovingRef = useRef(false);

  // Motion-blur ghost: previous frame rendered at lower opacity
  const prevRTRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const blurMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const blurQuadRef = useRef<THREE.Mesh | null>(null);
  const blurSceneRef = useRef<THREE.Scene | null>(null);
  const blurCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const lightsRef = useRef<THREE.PointLight[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const activeRef = useRef(0);
  const animatingRef = useRef(false);

  const touchStartX = useRef<number | null>(null);

  // Spring physics for smooth camera
  const camVelRef = useRef(0);
  const dustRef = useRef<THREE.Points | null>(null);
  // Per-room door glow meshes — animated in the render loop
  const doorGlowsRef = useRef<THREE.Mesh[]>([]);
  // Transition vignette opacity — driven by movement speed
  const vignetteRef = useRef<HTMLDivElement>(null);

  // ── Navigate to a room ────────────────────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (animatingRef.current) return;
      // const clamped = Math.max(0, Math.min(sections.length - 1, index));
      const clamped = Math.max(0, Math.min(maxAllowedIndexRef.current, index));
      if (clamped === activeRef.current) return;

      animatingRef.current = true;
      setIsAnimating(true);
      setShowContent(false); // hide HTML content during travel

      activeRef.current = clamped;
      setActiveIndex(clamped);

      // Broadcast to parent editor frame so the jump bar highlights correctly
      if (window.self !== window.top) {
        window.parent.postMessage(
          { type: "SECTION_CHANGE", index: clamped },
          "*",
        );
      }

      // Target Z: camera rests at front of each room
      targetZRef.current = clamped * TOTAL_SEGMENT;
      // Don't zero velocity — let spring carry existing momentum into new target
      // but cap it so it doesn't overshoot wildly on rapid successive presses
      camVelRef.current = Math.max(-8, Math.min(8, camVelRef.current));
    },
    [sections.length],
  );

  // When the date is revealed, unlock all rooms and advance past the scratch room
  const prevDateRevealedRef = useRef(dateRevealed);
  useEffect(() => {
    if (dateRevealed && !prevDateRevealedRef.current) {
      prevDateRevealedRef.current = true;
      // Small delay so the guest sees the scratch completion before moving
      setTimeout(() => {
        goTo(scratchRoomIndex + 1);
      }, 1200);
    }
  }, [dateRevealed, scratchRoomIndex, goTo]);

  useEffect(() => {
    maxAllowedIndexRef.current = maxAllowedIndex;
  }, [maxAllowedIndex]);

  // ── Build all rooms into the scene ────────────────────────────────────────
  const buildScene = useCallback(
    (scene: THREE.Scene, t: typeof theme, W: number, H: number) => {
      // Clear existing room meshes (keep lights added separately)
      const toRemove: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData.isRoom) toRemove.push(obj);
      });
      toRemove.forEach((obj) => scene.remove(obj));
      lightsRef.current = [];
      doorGlowsRef.current = [];

      const bgCol = hexCol(t.bg);
      const bgMidCol = hexCol(t.bgMid);
      const wallCol = hexCol(t.curtain);
      const darkCol = hexCol(t.curtainDark);
      const goldCol = hexCol(t.gold);
      const goldLtCol = hexCol(t.goldLight);

      // ── Textures ──────────────────────────────────────────────────────────
      const floorTex = makeFloorTexture(t.curtainDark, t.bg);
      const wallTex = makeWallTexture(t.bgMid);
      const ceilTex = makeCeilingTexture(t.bgMid, t.gold);
      const stoneTex = makeStoneTexture(t.curtainDark);
      const bannerTex = makeBannerTexture(t.curtain, t.gold);

      // ── Shared materials ──────────────────────────────────────────────────
      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.92,
        metalness: 0.06,
      });
      const ceilMat = new THREE.MeshStandardMaterial({
        map: ceilTex,
        roughness: 0.95,
        color: bgCol.clone().multiplyScalar(0.75),
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: goldCol,
        roughness: 0.18,
        metalness: 0.92,
        emissive: goldLtCol,
        emissiveIntensity: 0.08,
      });
      const stoneMat = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.95,
      });
      const carpetMat = new THREE.MeshStandardMaterial({
        color: wallCol,
        roughness: 0.98,
      });
      const bannerMat = new THREE.MeshStandardMaterial({
        map: bannerTex,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });

      // ── Per-room + corridor construction ─────────────────────────────────
      sections.forEach((_, roomIndex) => {
        const group = new THREE.Group();
        group.userData.isRoom = true;
        // Room origin Z: each room+corridor pair is TOTAL_SEGMENT apart
        const rZ = roomIndex * TOTAL_SEGMENT;

        // ════════════════════════════════════════════════════════════════════
        //  A. ROOM GEOMETRY
        // ════════════════════════════════════════════════════════════════════

        // ── Floor (marble tile) ──
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_LENGTH),
          floorMat,
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -ROOM_HEIGHT / 2, rZ - ROOM_LENGTH / 2);
        floor.receiveShadow = true;
        group.add(floor);

        // Carpet runner down centre
        const runner = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5, ROOM_LENGTH - 0.6),
          carpetMat,
        );
        runner.rotation.x = -Math.PI / 2;
        runner.position.set(0, -ROOM_HEIGHT / 2 + 0.002, rZ - ROOM_LENGTH / 2);
        group.add(runner);
        // Gold carpet border strips
        for (const sx of [-0.78, 0.78]) {
          const strip = new THREE.Mesh(
            new THREE.PlaneGeometry(0.07, ROOM_LENGTH - 0.6),
            goldMat,
          );
          strip.rotation.x = -Math.PI / 2;
          strip.position.set(
            sx,
            -ROOM_HEIGHT / 2 + 0.003,
            rZ - ROOM_LENGTH / 2,
          );
          group.add(strip);
        }

        // ── Coffered ceiling ──
        const ceil = new THREE.Mesh(
          new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_LENGTH),
          ceilMat,
        );
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(0, ROOM_HEIGHT / 2, rZ - ROOM_LENGTH / 2);
        group.add(ceil);

        // Ceiling centre beam (runs front-to-back)
        const beamGeo = new THREE.BoxGeometry(0.22, 0.18, ROOM_LENGTH);
        const beamMat = new THREE.MeshStandardMaterial({
          color: darkCol,
          roughness: 0.8,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, ROOM_HEIGHT / 2 - 0.09, rZ - ROOM_LENGTH / 2);
        group.add(beam);
        // Cross beams (left-right, 3 of them)
        for (let b = 0; b < 3; b++) {
          const xBeam = new THREE.Mesh(
            new THREE.BoxGeometry(ROOM_WIDTH, 0.18, 0.22),
            beamMat,
          );
          xBeam.position.set(
            0,
            ROOM_HEIGHT / 2 - 0.09,
            rZ - (ROOM_LENGTH * (b + 1)) / 4,
          );
          group.add(xBeam);
        }

        // ── Side walls with wallpaper texture ──
        const sideWallMat = new THREE.MeshStandardMaterial({
          map: wallTex,
          roughness: 0.85,
          color: bgCol.clone().lerp(hexCol(t.bgMid), 0.5),
        });
        const leftWall = new THREE.Mesh(
          new THREE.PlaneGeometry(ROOM_LENGTH, ROOM_HEIGHT),
          sideWallMat,
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-ROOM_WIDTH / 2, 0, rZ - ROOM_LENGTH / 2);
        leftWall.receiveShadow = true;
        group.add(leftWall);

        const rightWall = leftWall.clone();
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(ROOM_WIDTH / 2, 0, rZ - ROOM_LENGTH / 2);
        group.add(rightWall);

        // ── Back wall ──
        const backWallMat = new THREE.MeshStandardMaterial({
          map: wallTex,
          roughness: 0.88,
          color: bgCol.clone().multiplyScalar(0.82),
        });
        const backWall = new THREE.Mesh(
          new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
          backWallMat,
        );
        backWall.rotation.y = Math.PI;
        backWall.position.set(0, 0, rZ + 0.1);
        group.add(backWall);

        // ── Front wall with Gothic pointed arch ──
        const frontZ = rZ - ROOM_LENGTH;
        const aw = 2.7;
        const ar = aw / 2;
        // Gothic arch: two offset circles creating a pointed top
        const archBottomY = -ROOM_HEIGHT / 2;
        const archStraightH = ROOM_HEIGHT * 0.42;
        const pointHeight = ROOM_HEIGHT * 0.78;

        const wallShape = new THREE.Shape();
        wallShape.moveTo(-ROOM_WIDTH / 2, archBottomY);
        wallShape.lineTo(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
        wallShape.lineTo(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
        wallShape.lineTo(ROOM_WIDTH / 2, archBottomY);
        wallShape.closePath();

        // Gothic pointed arch hole — two overlapping arcs
        const archHole = new THREE.Path();
        archHole.moveTo(-aw / 2, archBottomY);
        archHole.lineTo(-aw / 2, archBottomY + archStraightH);
        // Left arc of pointed arch (arc centred slightly right)
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI - (i / steps) * (Math.PI * 0.7);
          const cx2 = ar * 0.3;
          archHole.lineTo(
            cx2 + Math.cos(a) * ar * 1.1,
            archBottomY +
              archStraightH +
              Math.sin(a) * (pointHeight - archStraightH),
          );
        }
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI * 1.7 - (i / steps) * (Math.PI * 0.7);
          const cx2 = -ar * 0.3;
          archHole.lineTo(
            cx2 + Math.cos(a) * ar * 1.1,
            archBottomY +
              archStraightH +
              Math.sin(a) * (pointHeight - archStraightH),
          );
        }
        archHole.lineTo(aw / 2, archBottomY);
        wallShape.holes.push(archHole);

        const frontWallMesh = new THREE.Mesh(
          new THREE.ShapeGeometry(wallShape, 48),
          new THREE.MeshStandardMaterial({
            map: wallTex,
            roughness: 0.9,
            color: bgMidCol,
            side: THREE.DoubleSide,
          }),
        );
        frontWallMesh.position.z = frontZ;
        group.add(frontWallMesh);

        // Gold arch trim tube
        const archTrimPts: THREE.Vector3[] = [
          new THREE.Vector3(-aw / 2, archBottomY, frontZ - 0.02),
          new THREE.Vector3(
            -aw / 2,
            archBottomY + archStraightH,
            frontZ - 0.02,
          ),
        ];
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI - (i / steps) * (Math.PI * 0.7);
          archTrimPts.push(
            new THREE.Vector3(
              ar * 0.3 + Math.cos(a) * ar * 1.1,
              archBottomY +
                archStraightH +
                Math.sin(a) * (pointHeight - archStraightH),
              frontZ - 0.02,
            ),
          );
        }
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI * 1.7 - (i / steps) * (Math.PI * 0.7);
          archTrimPts.push(
            new THREE.Vector3(
              -ar * 0.3 + Math.cos(a) * ar * 1.1,
              archBottomY +
                archStraightH +
                Math.sin(a) * (pointHeight - archStraightH),
              frontZ - 0.02,
            ),
          );
        }
        archTrimPts.push(new THREE.Vector3(aw / 2, archBottomY, frontZ - 0.02));
        const trimCurve = new THREE.CatmullRomCurve3(archTrimPts);
        group.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(trimCurve, 64, 0.04, 8, false),
            goldMat,
          ),
        );

        // ── WAINSCOTING — dado rail + lower panel ──
        const railMat = new THREE.MeshStandardMaterial({
          color: goldCol,
          roughness: 0.25,
          metalness: 0.85,
        });
        const panelMat2 = new THREE.MeshStandardMaterial({
          color: new THREE.Color(t.curtainDark).multiplyScalar(1.15),
          roughness: 0.82,
        });
        // Dado rail (horizontal gold strip at ~0.9 height)
        for (const wallX of [-ROOM_WIDTH / 2 + 0.03, ROOM_WIDTH / 2 - 0.03]) {
          for (const railY of [
            -ROOM_HEIGHT / 2 + 0.9,
            ROOM_HEIGHT / 2 - 0.28,
          ]) {
            const rail = new THREE.Mesh(
              new THREE.BoxGeometry(ROOM_LENGTH, 0.055, 0.055),
              railMat,
            );
            rail.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
            rail.position.set(wallX, railY, rZ - ROOM_LENGTH / 2);
            group.add(rail);
          }
          // Lower panel fill (darker than wall above dado)
          const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(ROOM_LENGTH - 0.1, 0.86),
            panelMat2,
          );
          panel.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
          panel.position.set(
            wallX + (wallX < 0 ? 0.04 : -0.04),
            -ROOM_HEIGHT / 2 + 0.44,
            rZ - ROOM_LENGTH / 2,
          );
          group.add(panel);
          // Panel detail: recessed rectangles every ~1.5 units
          const panelCount = Math.floor((ROOM_LENGTH - 0.3) / 1.5);
          for (let p = 0; p < panelCount; p++) {
            const pz = rZ - 0.4 - p * 1.5 - 0.75;
            const moulding = new THREE.Mesh(
              new THREE.BoxGeometry(0.02, 0.62, 1.2),
              goldMat,
            );
            moulding.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
            moulding.position.set(
              wallX + (wallX < 0 ? 0.04 : -0.04),
              -ROOM_HEIGHT / 2 + 0.44,
              pz,
            );
            group.add(moulding);
          }
        }

        // ── PORTRAIT FRAMES on side walls (2 per side) ──
        const frameMat2 = new THREE.MeshStandardMaterial({
          color: goldCol,
          roughness: 0.2,
          metalness: 0.9,
          emissive: goldLtCol,
          emissiveIntensity: 0.06,
        });
        const matMat2 = new THREE.MeshStandardMaterial({
          color: darkCol,
          roughness: 1,
        });

        for (const wallX of [-ROOM_WIDTH / 2, ROOM_WIDTH / 2]) {
          for (let f = 0; f < 2; f++) {
            const fz = rZ - ROOM_LENGTH * (f === 0 ? 0.28 : 0.72);
            const fw = f === 0 ? 1.4 : 1.0;
            const fh = f === 0 ? 1.9 : 1.3;

            const frameGrp = new THREE.Group();
            // Outer frame
            frameGrp.add(
              new THREE.Mesh(
                new THREE.BoxGeometry(fw + 0.16, fh + 0.16, 0.045),
                frameMat2,
              ),
            );
            // Inner matte
            const innerGeo = new THREE.BoxGeometry(fw, fh, 0.02);
            innerGeo.translate(0, 0, 0.018);
            frameGrp.add(new THREE.Mesh(innerGeo, matMat2));
            // Corner ornament spheres
            for (const [cx2, cy2] of [
              [-fw / 2 - 0.04, fh / 2 + 0.04],
              [fw / 2 + 0.04, fh / 2 + 0.04],
              [-fw / 2 - 0.04, -fh / 2 - 0.04],
              [fw / 2 + 0.04, -fh / 2 - 0.04],
            ]) {
              frameGrp
                .add(
                  new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), goldMat),
                )
                .position.set(cx2, cy2, 0.01);
            }

            const xPos = wallX + (wallX < 0 ? 0.055 : -0.055);
            frameGrp.position.set(xPos, 0.35, fz);
            frameGrp.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
            group.add(frameGrp);

            // Use PointLight in preview (cheaper), SpotLight on guest page
            const inPrev = window.self !== window.top;
            if (inPrev) {
              const picLight = new THREE.PointLight(goldLtCol, 0.9, 3.0, 2.2);
              picLight.position.set(wallX * 0.75, ROOM_HEIGHT / 2 - 0.3, fz);
              scene.add(picLight);
              lightsRef.current.push(picLight);
            } else {
              const picLight = new THREE.SpotLight(
                goldLtCol,
                1.8,
                3.5,
                Math.PI / 7,
                0.4,
              );
              picLight.position.set(wallX * 0.75, ROOM_HEIGHT / 2 - 0.3, fz);
              picLight.target.position.set(wallX * 0.8, 0, fz);
              scene.add(picLight);
              scene.add(picLight.target);
              lightsRef.current.push(picLight as unknown as THREE.PointLight);
            }
          }

          // ── WALL SCONCE (between the two frames) ──
          const sconceZ = rZ - ROOM_LENGTH / 2;
          const sconcePt = new THREE.PointLight(
            goldLtCol,
            1.4,
            ROOM_WIDTH * 1.1,
            2.0,
          );
          sconcePt.position.set(wallX * 0.82, ROOM_HEIGHT / 2 - 0.7, sconceZ);
          scene.add(sconcePt);
          lightsRef.current.push(sconcePt);

          // Sconce geometry: backplate + arm + globe
          const sconceGrp = new THREE.Group();
          sconceGrp.position.set(
            wallX + (wallX < 0 ? 0.04 : -0.04),
            ROOM_HEIGHT / 2 - 0.68,
            sconceZ,
          );
          sconceGrp.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
          // Backplate
          sconceGrp.add(
            new THREE.Mesh(
              new THREE.BoxGeometry(0.28, 0.38, 0.04),
              new THREE.MeshStandardMaterial({
                color: darkCol,
                roughness: 0.7,
              }),
            ),
          );
          // Arm
          sconceGrp
            .add(
              new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6),
                goldMat,
              ),
            )
            .position.set(0, 0, 0.14);
          // Globe
          const globe = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 12, 10),
            new THREE.MeshStandardMaterial({
              color: goldLtCol,
              emissive: goldLtCol,
              emissiveIntensity: 1.6,
              roughness: 0,
              transparent: true,
              opacity: 0.85,
            }),
          );
          globe.position.set(0, 0, 0.26);
          sconceGrp.add(globe);
          group.add(sconceGrp);
        }

        // ── CHANDELIER (more detailed) ──
        const chanZ = rZ - ROOM_LENGTH / 2;
        const chand = new THREE.Group();
        chand.position.set(0, ROOM_HEIGHT / 2 - 0.02, chanZ);

        // Chain links (stacked cylinders)
        for (let link = 0; link < 6; link++) {
          const linkMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.08, 6),
            goldMat,
          );
          linkMesh.position.y = -link * 0.09 - 0.04;
          chand.add(linkMesh);
        }
        // Main body tier 1 (crown)
        const tier1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.28, 0.14, 16),
          goldMat,
        );
        tier1.position.y = -0.6;
        chand.add(tier1);
        // Tier 2 (lower ring)
        const tier2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.18, 0.1, 16),
          goldMat,
        );
        tier2.position.y = -0.82;
        chand.add(tier2);
        // Drop pendants (12 teardrop shapes)
        for (let p = 0; p < 12; p++) {
          const pAngle = (p / 12) * Math.PI * 2;
          const pRadius = p % 2 === 0 ? 0.38 : 0.26;
          const dropGeo = new THREE.CylinderGeometry(0.0, 0.025, 0.18, 6);
          const drop = new THREE.Mesh(
            dropGeo,
            new THREE.MeshStandardMaterial({
              color: goldLtCol,
              roughness: 0.1,
              metalness: 0.8,
              transparent: true,
              opacity: 0.8,
            }),
          );
          drop.position.set(
            Math.cos(pAngle) * pRadius,
            -0.78 - 0.09 - (p % 2 === 0 ? 0.1 : 0),
            Math.sin(pAngle) * pRadius,
          );
          chand.add(drop);
        }
        // Arms + candles (8)
        for (let a = 0; a < 8; a++) {
          const angle = (a / 8) * Math.PI * 2;
          // S-curved arm approximation
          const armCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.62, 0),
            new THREE.Vector3(
              Math.cos(angle) * 0.2,
              -0.68,
              Math.sin(angle) * 0.2,
            ),
            new THREE.Vector3(
              Math.cos(angle) * 0.38,
              -0.6,
              Math.sin(angle) * 0.38,
            ),
            new THREE.Vector3(
              Math.cos(angle) * 0.5,
              -0.55,
              Math.sin(angle) * 0.5,
            ),
          ]);
          chand.add(
            new THREE.Mesh(
              new THREE.TubeGeometry(armCurve, 12, 0.01, 6, false),
              goldMat,
            ),
          );
          // Candle cup
          const candleCup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.025, 0.07, 8),
            goldMat,
          );
          candleCup.position.set(
            Math.cos(angle) * 0.5,
            -0.52,
            Math.sin(angle) * 0.5,
          );
          chand.add(candleCup);

          // Flame (glowing elongated sphere)
          const flame = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 8, 6),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(1, 0.8, 0.3),
              emissive: new THREE.Color(1, 0.6, 0.1),
              emissiveIntensity: 2.5,
              roughness: 0,
            }),
          );
          flame.scale.y = 1.6;
          flame.position.set(
            Math.cos(angle) * 0.5,
            -0.44,
            Math.sin(angle) * 0.5,
          );
          chand.add(flame);
        }
        group.add(chand);

        // Main chandelier light
        const chanLight = new THREE.PointLight(
          goldLtCol,
          4.0,
          ROOM_LENGTH * 1.3,
          1.5,
        );
        chanLight.position.set(0, ROOM_HEIGHT / 2 - 0.85, chanZ);

        const inPrev = window.self !== window.top;
        chanLight.castShadow = !inPrev;
        if (!inPrev) chanLight.shadow.mapSize.set(256, 256);

        scene.add(chanLight);
        lightsRef.current.push(chanLight);

        // ── HERALDIC BANNERS hanging between frames ──
        for (const wallX of [-ROOM_WIDTH / 2, ROOM_WIDTH / 2]) {
          const bannerGrp = new THREE.Group();
          const bannerMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 1.2),
            bannerMat,
          );
          // Hang from ceiling edge
          const bx = wallX + (wallX < 0 ? 0.1 : -0.1);
          bannerGrp.position.set(
            bx,
            ROOM_HEIGHT / 2 - 0.7,
            rZ - ROOM_LENGTH / 2 + 0.5,
          );
          bannerGrp.rotation.y = wallX < 0 ? Math.PI / 2 : -Math.PI / 2;
          // Slight forward tilt for realism
          bannerGrp.rotation.z = wallX < 0 ? 0.04 : -0.04;
          bannerGrp.add(bannerMesh);

          // Hanging rod above banner
          const bannerRod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6),
            goldMat,
          );
          bannerRod.position.set(0, 0.62, 0);
          bannerRod.rotation.set(0, 0, Math.PI / 2);
          bannerGrp.add(bannerRod);

          group.add(bannerGrp);
        }

        // ── DECORATIVE COLUMNS flanking the arch ──
        for (const colX of [-(aw / 2 + 0.25), aw / 2 + 0.25]) {
          // Column shaft
          const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.16, ROOM_HEIGHT * 0.88, 12),
            new THREE.MeshStandardMaterial({
              color: darkCol,
              roughness: 0.6,
              metalness: 0.1,
            }),
          );
          shaft.position.set(
            colX,
            -ROOM_HEIGHT / 2 + ROOM_HEIGHT * 0.44,
            frontZ - 0.18,
          );
          group.add(shaft);
          // Capital (top ornament)
          const capital = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.14, 0.2, 12),
            goldMat,
          );
          capital.position.set(
            colX,
            ROOM_HEIGHT / 2 - ROOM_HEIGHT * 0.1,
            frontZ - 0.18,
          );
          group.add(capital);

          // Base
          const columnBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.15, 12),
            goldMat,
          );
          columnBase.position.set(
            colX,
            -ROOM_HEIGHT / 2 + 0.075,
            frontZ - 0.18,
          );
          group.add(columnBase);
        }

        // ── TORCHES on back wall (flanking the entry) ──
        for (const tx of [-(ROOM_WIDTH / 2 - 0.9), ROOM_WIDTH / 2 - 0.9]) {
          const torchGrp = new THREE.Group();
          torchGrp.position.set(tx, -0.4, rZ - 0.18);
          // Handle
          torchGrp.add(
            new THREE.Mesh(
              new THREE.CylinderGeometry(0.025, 0.02, 0.5, 8),
              new THREE.MeshStandardMaterial({
                color: darkCol,
                roughness: 0.8,
              }),
            ),
          );
          // Bracket
          torchGrp.add(
            new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.12), goldMat),
          );
          // Flame
          const torchFlame = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.22, 8),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(1, 0.5, 0.05),
              emissive: new THREE.Color(1, 0.4, 0),
              emissiveIntensity: 3.0,
              roughness: 0,
            }),
          );
          torchFlame.position.y = 0.37;
          torchGrp.add(torchFlame);
          group.add(torchGrp);

          // Torch flickering light
          const torchLight = new THREE.PointLight(
            new THREE.Color(1, 0.55, 0.12),
            2.2,
            ROOM_WIDTH * 0.85,
            2.2,
          );
          torchLight.position.set(tx, -0.04, rZ - 0.18);
          scene.add(torchLight);
          lightsRef.current.push(torchLight);
        }

        // ════════════════════════════════════════════════════════════════════
        //  B. CORRIDOR between this room and the next
        //     Positioned at: frontZ going back CORRIDOR_LENGTH more
        // ════════════════════════════════════════════════════════════════════
        if (roomIndex < sections.length - 1) {
          const corrStart = frontZ; // z=frontZ (front wall of room)
          const corrEnd = frontZ - CORRIDOR_LENGTH; // z=frontZ - corridor length
          const corrMid = (corrStart + corrEnd) / 2;
          const wallShift = (ROOM_WIDTH - CORRIDOR_WIDTH) / 2; // side walls step inward

          // Floor (stone)
          const corrFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_LENGTH),
            stoneMat,
          );
          corrFloor.rotation.set(-Math.PI / 2, 0, 0);
          corrFloor.position.set(0, -ROOM_HEIGHT / 2, corrMid);
          group.add(corrFloor);

          // Ceiling
          const corrCeil = new THREE.Mesh(
            new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_LENGTH),
            new THREE.MeshStandardMaterial({
              color: bgCol.clone().multiplyScalar(0.55),
              roughness: 1,
            }),
          );
          corrCeil.rotation.set(Math.PI / 2, 0, 0);
          corrCeil.position.set(0, CORRIDOR_HEIGHT / 2, corrMid);
          group.add(corrCeil);

          // Side walls (stone)
          for (const wx of [-CORRIDOR_WIDTH / 2, CORRIDOR_WIDTH / 2]) {
            const side = new THREE.Mesh(
              new THREE.PlaneGeometry(CORRIDOR_LENGTH, CORRIDOR_HEIGHT),
              stoneMat,
            );
            side.rotation.y = wx < 0 ? Math.PI / 2 : -Math.PI / 2;
            side.position.set(
              wx,
              CORRIDOR_HEIGHT / 2 - ROOM_HEIGHT / 2,
              corrMid,
            );
            group.add(side);
          }
          // Transition "shoulder" walls — fill the gap where corridor narrows
          for (const wx of [-ROOM_WIDTH / 2, ROOM_WIDTH / 2]) {
            const shoulder = new THREE.Mesh(
              new THREE.PlaneGeometry(wallShift - 0.05, ROOM_HEIGHT),
              new THREE.MeshStandardMaterial({
                map: wallTex,
                roughness: 0.9,
                color: bgMidCol,
                side: THREE.DoubleSide,
              }),
            );
            shoulder.rotation.y = wx < 0 ? -Math.PI / 2 : Math.PI / 2;
            shoulder.position.set(
              wx < 0
                ? -ROOM_WIDTH / 2 + wallShift / 2
                : ROOM_WIDTH / 2 - wallShift / 2,
              0,
              corrStart - 0.02,
            );
            group.add(shoulder);
          }

          // Sconces in corridor (2 brackets, one per side)
          for (const cx of [
            -CORRIDOR_WIDTH / 2 + 0.08,
            CORRIDOR_WIDTH / 2 - 0.08,
          ]) {
            const corrLight = new THREE.PointLight(
              goldLtCol,
              0.8,
              CORRIDOR_WIDTH * 2,
              2.5,
            );
            corrLight.position.set(
              cx,
              CORRIDOR_HEIGHT / 2 - ROOM_HEIGHT / 2 - 0.4,
              corrMid,
            );
            scene.add(corrLight);
            lightsRef.current.push(corrLight);

            const cGlobe = new THREE.Mesh(
              new THREE.SphereGeometry(0.045, 8, 6),
              new THREE.MeshStandardMaterial({
                color: goldLtCol,
                emissive: goldLtCol,
                emissiveIntensity: 1.4,
                roughness: 0,
              }),
            );
            cGlobe.position.copy(corrLight.position);
            group.add(cGlobe);
          }

          // ── DOOR GLOW at corridor opening (animated amber haze) ──
          const glowMat = new THREE.MeshBasicMaterial({
            color: goldLtCol,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
          });
          const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(aw * 0.85, ROOM_HEIGHT * 0.78),
            glowMat,
          );
          glow.position.set(0, 0, corrStart - 0.05);
          group.add(glow);
          doorGlowsRef.current.push(glow);
        }

        scene.add(group);
      });

      // ── DUST PARTICLE SYSTEM ──────────────────────────────────────────────
      if (dustRef.current) scene.remove(dustRef.current);
      const dustPositions = new Float32Array(DUST_COUNT * 3);
      const totalSceneLength = sections.length * TOTAL_SEGMENT;
      for (let i = 0; i < DUST_COUNT; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * ROOM_WIDTH * 0.9;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * ROOM_HEIGHT * 0.8;
        dustPositions[i * 3 + 2] = -(Math.random() * totalSceneLength);
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(dustPositions, 3),
      );
      const dustMat = new THREE.PointsMaterial({
        color: goldLtCol,
        size: 0.014,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.45,
      });
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);
      dustRef.current = dust;
    },
    [sections],
  );

  // ── Three.js initialisation ───────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || window.innerWidth;
    const H = mount.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);

    // In the editor preview iframe, cap pixel ratio at 1 and disable shadows
    // to keep the frame budget manageable
    const inPreview = window.self !== window.top;
    renderer.setPixelRatio(
      inPreview ? 1 : Math.min(window.devicePixelRatio, 1.5),
    );
    renderer.shadowMap.enabled = !inPreview;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene + fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(
      hexCol(theme.bg).getHex(),
      ROOM_LENGTH * 0.8,
      ROOM_LENGTH * 2.6,
    );
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(70, W / H, 0.05, 200);
    camera.position.set(0, CAM_Y, CAM_Z_OFFSET);
    camera.lookAt(0, CAM_Y, -1);
    cameraRef.current = camera;

    // Ambient
    scene.add(
      new THREE.AmbientLight(
        hexCol(theme.bg).lerp(new THREE.Color("#fff"), 0.25),
        0.5,
      ),
    );

    // Build geometry
    buildScene(scene, theme, W, H);

    // ── Motion-blur accumulation setup ──
    const prevRT = new THREE.WebGLRenderTarget(W, H);
    prevRTRef.current = prevRT;
    const blurScene = new THREE.Scene();
    blurSceneRef.current = blurScene;
    const blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    blurCamRef.current = blurCam;
    const blurMat = new THREE.MeshBasicMaterial({
      map: prevRT.texture,
      transparent: true,
      opacity: 0.0, // 0 = off when still, set dynamically
    });
    blurMatRef.current = blurMat;
    const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat);
    blurSceneRef.current.add(blurQuad);
    blurQuadRef.current = blurQuad;

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      prevRT.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Render loop ──
    let last = performance.now();
    const animate = (now: number) => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const prev = currentZRef.current;

      // ── Spring physics camera ──
      // F = -stiffness * displacement - damping * velocity
      const displacement = currentZRef.current - targetZRef.current;
      const springForce =
        -CAM_SPRING_STIFFNESS * displacement -
        CAM_SPRING_DAMPING * camVelRef.current;
      camVelRef.current += springForce * dt;
      currentZRef.current += camVelRef.current * dt;

      const speed = Math.abs(currentZRef.current - prev) / dt;
      const moving = speed > 0.04;
      isMovingRef.current = moving;

      // Detect arrival
      // Spring settles when both displacement and velocity are negligible
      if (
        animatingRef.current &&
        Math.abs(currentZRef.current - targetZRef.current) < 0.02 &&
        Math.abs(camVelRef.current) < 0.05
      ) {
        currentZRef.current = targetZRef.current;
        camVelRef.current = 0;
        animatingRef.current = false;
        setIsAnimating(false);
        setShowContent(true);
      }

      // Camera position: Z tracks room travel, bob + sway when moving
      bobTimeRef.current += dt;
      const bobAmt = moving ? 0.025 : 0.008;
      const swayAmt = moving ? 0.018 : 0.005;
      camera.position.set(
        Math.sin(bobTimeRef.current * 1.1) * swayAmt,
        CAM_Y + Math.abs(Math.sin(bobTimeRef.current * 2.4)) * bobAmt,
        CAM_Z_OFFSET - currentZRef.current,
      );

      // Camera tilt forward when moving (lean into the walk)
      const tiltTarget = moving ? -0.04 : 0;
      camera.rotation.x += (tiltTarget - camera.rotation.x) * 0.08;

      // Field-of-view pulse when moving (zoom-out slight)
      const fovTarget = moving ? 74 : 70;
      camera.fov += (fovTarget - camera.fov) * 0.06;
      camera.updateProjectionMatrix();

      // ── Motion blur: blend previous frame behind current ──
      const blurAmount = Math.min(speed * 0.12, 0.55);
      if (blurMat) {
        blurMat.opacity = moving ? blurAmount : 0;
      }

      // 1. Render current frame to screen
      renderer.render(scene, camera);

      // 2. Overlay previous frame at low opacity for blur effect
      if (moving && blurMat.opacity > 0.02) {
        renderer.autoClear = false;
        renderer.render(blurScene, blurCam);
        renderer.autoClear = true;
      }

      // 3. Copy current to prevRT — only needed when blur is active
      if (moving) {
        renderer.setRenderTarget(prevRT);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
      }

      // ── Drift dust particles slowly upward and forward ──
      if (dustRef.current) {
        const pos = dustRef.current.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < DUST_COUNT; i++) {
          pos[i * 3 + 1] += dt * 0.035; // rise
          pos[i * 3 + 2] -= dt * (moving ? 0.3 : 0.04); // drift toward camera (faster when moving)
          if (pos[i * 3 + 1] > ROOM_HEIGHT / 2)
            pos[i * 3 + 1] = -ROOM_HEIGHT / 2;
          if (pos[i * 3 + 2] > CAM_Z_OFFSET)
            pos[i * 3 + 2] = -(sections.length * TOTAL_SEGMENT);
        }
        dustRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // ── Pulse door glow (warm amber breath on archways) ──
      doorGlowsRef.current.forEach((glow, gi) => {
        const mat = glow.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.05 + Math.sin(now * 0.0012 + gi * 2.1) * 0.04;
      });

      // Skip per-light animation in preview when camera is idle — saves ~2ms/frame
      const inPreview = window.self !== window.top;
      if (!inPreview || moving || animatingRef.current) {
        // ── Torch flicker (warm orange lights) ──
        lightsRef.current.forEach((light, li) => {
          if (!(light instanceof THREE.PointLight)) return;

          // Torch lights have orange colour — detect by hue approximation
          const isOrange = light.color.r > 0.8 && light.color.g < 0.7;
          if (isOrange) {
            light.intensity =
              2.2 +
              Math.sin(now * 0.0041 + li * 3.3) * 0.6 +
              Math.sin(now * 0.011 + li * 1.7) * 0.3;
          }
        });

        // ── Sconce / chandelier flicker (gold lights) ──
        lightsRef.current.forEach((light, i) => {
          if (!(light instanceof THREE.PointLight)) return;
          const isGold = light.color.r < 1.1 && light.color.g > 0.5;
          const isOrange = light.color.r > 0.8 && light.color.g < 0.7;
          if (isGold && !isOrange) {
            light.intensity = 1.3 + Math.sin(now * 0.0028 + i * 2.3) * 0.18;
          }
        });
      }
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, []); // mount once

  // Re-build scene geometry when theme changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.fog = new THREE.Fog(
      hexCol(theme.bg).getHex(),
      ROOM_LENGTH * 0.8,
      ROOM_LENGTH * 2.6,
    );
    buildScene(scene, theme, window.innerWidth, window.innerHeight);
  }, [theme, buildScene]);

  // ── Input handlers ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "d")
        goTo(activeRef.current + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "a")
        goTo(activeRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SCROLL_TO" && typeof e.data.index === "number")
        goTo(e.data.index);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 45) goTo(activeRef.current + (dx > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Dynamic vignette — darkens edges during room travel */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          opacity: isAnimating ? 1 : 0,
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* ── Walking HUD ── */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-end pb-28">
          <div className="flex flex-col items-center gap-3">
            {/* Direction arrow */}
            <div
              className="font-label text-[10px] tracking-[0.5em] uppercase"
              style={{ color: theme.gold + "70" }}
            >
              {activeIndex > activeRef.current - 1
                ? "Moving forward"
                : "Moving back"}
            </div>
            {/* Footstep dots with staggered bounce */}
            <div className="flex gap-2.5 items-end" style={{ height: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-full animate-bounce"
                  style={{
                    width: i % 2 === 0 ? 5 : 7,
                    height: i % 2 === 0 ? 5 : 7,
                    background: theme.gold,
                    opacity: 0.5 + i * 0.12,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: "0.45s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content panel — fades in once camera arrives ── */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-600"
        style={{ opacity: showContent ? 1 : 0 }}
      >
        {sections.map((section, i) => (
          <div
            key={section.key}
            data-rooms-panel
            className="absolute inset-0 overflow-y-auto"
            style={{
              display: i === activeIndex ? "block" : "none",
              pointerEvents: i === activeIndex && showContent ? "auto" : "none",
              // Vignette: blend content into room at edges
              WebkitMaskImage:
                "radial-gradient(ellipse 78% 70% at 50% 50%, black 30%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse 78% 70% at 50% 50%, black 30%, transparent 100%)",
            }}
          >
            {section.node}
          </div>
        ))}
      </div>

      {/* ── Room name — bottom centre HUD ── */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{
          opacity: showContent ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <div
          className="font-label font-bold text-[9px] tracking-[0.6em] uppercase px-5! py-1.5! rounded-full text-center"
          style={{
            border: `1px solid ${theme.gold}55`,
            color: theme.gold + "80",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          {sections[activeIndex]?.label}
        </div>
      </div>

      {/* ── Navigation arrows — game-style, bottom corners ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0 || isAnimating}
          className="flex items-center justify-center rounded-full transition-all disabled:opacity-20 cursor-pointer"
          style={{
            width: 44,
            height: 44,
            background: `${theme.bg}DD`,
            border: `1px solid ${theme.gold}40`,
            color: theme.gold,
            backdropFilter: "blur(10px)",
          }}
        >
          <ChevronLeftIcon className="size-5" />
        </button>

        {/* Progress pips */}
        <div className="flex items-center gap-1.5">
          {sections.map((s, i) => {
            const isLocked = hasLock && i > scratchRoomIndex;
            const isActive = i === activeIndex;

            return (
              <Tooltip
                key={s.key}
                content={isLocked ? "Scratch the date to unlock" : s.label}
                position="top"
                delay={200}
              >
                <button
                  key={s.key}
                  onClick={() => !isLocked && goTo(i)}
                  disabled={isAnimating || isLocked}
                  title={s.label}
                  className="rounded-full transition-all duration-300 cursor-pointer disabled:cursor-default"
                  style={{
                    width: isActive ? 18 : 5,
                    height: 5,
                    background: isLocked
                      ? theme.gold + "15"
                      : isActive
                        ? theme.gold
                        : theme.gold + "30",
                    border: `1px solid ${isLocked ? theme.gold + "20" : theme.gold + "50"}`,
                    cursor: isLocked ? "not-allowed" : "pointer",
                  }}
                />
              </Tooltip>
            );
          })}
        </div>

        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex >= maxAllowedIndex || isAnimating}
          className="flex items-center justify-center rounded-full transition-all disabled:opacity-20 cursor-pointer"
          style={{
            width: 44,
            height: 44,
            background: `${theme.bg}DD`,
            border: `1px solid ${theme.gold}40`,
            color: theme.gold,
            backdropFilter: "blur(10px)",
          }}
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      {/* ── Lock hint — shown when on scratch room and not yet revealed ── */}
      {hasLock && activeIndex === scratchRoomIndex && showContent && (
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ opacity: 0.75 }}
        >
          <div
            className="flex items-center gap-2 px-4! py-2! rounded-full font-label font-semibold text-[9px] tracking-[0.4em] uppercase"
            style={{
              border: `1px solid ${theme.gold}65`,
              color: theme.gold + "90",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            ✦ Scratch to reveal the date and unlock the remaining rooms
          </div>
        </div>
      )}

      {/* ── Keyboard hint — first room only ── */}
      {activeIndex === 0 && showContent && (
        <div
          className="absolute top-6 right-6 z-20 pointer-events-none"
          style={{ opacity: 0.5 }}
        >
          <p
            className="font-label font-semibold text-[9px] tracking-[0.4em] uppercase"
            style={{ color: theme.gold }}
          >
            ← → to navigate · swipe on mobile
          </p>
        </div>
      )}
    </div>
  );
}
