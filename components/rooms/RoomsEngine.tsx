"use client";

import { useTheme } from "@/lib/ThemeContext";
import { type EventConfig } from "@/types/event";
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
  isEditorPreview?: boolean;
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
// const DUST_COUNT =
//   typeof window !== "undefined" && window.self !== window.top
//     ? 80 // preview iframe — reduced for performance
//     : 320; // guest page — full effect

const DUST_COUNT_FULL = 320;
const DUST_COUNT_PREVIEW = 80;

// ── Camera spring ───────────────────────────────────────────────────────────
const CAM_SPRING_STIFFNESS = 180;
const CAM_SPRING_DAMPING = 22;

function hexCol(hex: string): THREE.Color {
  // Strip alpha / non-hex chars and parse
  const clean = hex.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
  return new THREE.Color(clean);
}

// ── Convert a hex colour + 0–1 alpha to a CSS rgba() string ─────────────────
// Canvas 2D API does not reliably support 8-digit hex colours; rgba() is safe.
function hexAlpha(hex: string, alpha: number): string {
  const clean = hex.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
  tex.colorSpace = THREE.SRGBColorSpace;
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
  tex.colorSpace = THREE.SRGBColorSpace;
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
  ctx.strokeStyle = hexAlpha(goldHex, 0.33);
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
      ctx.fillStyle = hexAlpha(goldHex, 0.25);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;

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
  tex.colorSpace = THREE.SRGBColorSpace;
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
  grad.addColorStop(1, hexAlpha(curtainHex, 0.67));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Border
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  // Fleur-de-lis approximation using arcs
  ctx.fillStyle = hexAlpha(goldHex, 0.8);
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
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Timeline event portrait canvas texture ───────────────────────────────────
function makeTimelineFrameTexture(
  year: string,
  icon: string,
  title: string,
  desc: string,
  goldHex: string,
  curtainHex: string,
  textHex: string,
): THREE.CanvasTexture {
  const w = 256,
    h = 384;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Background — deep curtain gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, hexAlpha(curtainHex, 0.87));
  bg.addColorStop(1, "#0a0608CC");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Parchment noise
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  // Gold border
  ctx.strokeStyle = hexAlpha(goldHex, 0.5);
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = hexAlpha(goldHex, 0.25);
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  // Year — top
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = hexAlpha(goldHex, 0.8);
  ctx.textAlign = "center";
  ctx.fillText(year, w / 2, 56);

  // Divider below year
  ctx.strokeStyle = hexAlpha(goldHex, 0.31);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 68);
  ctx.lineTo(w - 40, 68);
  ctx.stroke();

  // Icon medallion — circle
  ctx.beginPath();
  ctx.arc(w / 2, 148, 40, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(goldHex, 0.09);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(goldHex, 0.38);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Icon glyph
  ctx.font = "36px serif";
  ctx.fillStyle = goldHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, w / 2, 148);
  ctx.textBaseline = "alphabetic";

  // Divider below medallion
  ctx.strokeStyle = hexAlpha(goldHex, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(w - 50, 200);
  ctx.stroke();

  // Title
  ctx.font = "300 20px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.93);
  ctx.textAlign = "center";
  // Word-wrap title into 2 lines max
  const words = title.split(" ");
  let line = "";
  let y = 234;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > w - 48 && line) {
      ctx.fillText(line, w / 2, y);
      line = word;
      y += 26;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, w / 2, y);

  // Description — smaller italic
  ctx.font = "italic 13px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.44);
  // Word-wrap desc into up to 4 lines
  const descWords = desc.split(" ");
  let dLine = "";
  let dy = y + 32;
  for (const word of descWords) {
    const test = dLine + (dLine ? " " : "") + word;
    if (ctx.measureText(test).width > w - 56 && dLine) {
      ctx.fillText(dLine, w / 2, dy);
      dLine = word;
      dy += 18;
      if (dy > h - 30) break;
    } else {
      dLine = test;
    }
  }
  if (dy <= h - 30) ctx.fillText(dLine, w / 2, dy);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePhotoTexture(url: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const aspect = img.width / img.height;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (aspect > 1) {
      sx = (img.width - img.height) / 2;
      sw = img.height;
    } else {
      sy = (img.height - img.width) / 2;
      sh = img.width;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    tex.needsUpdate = true;
  };
  img.src = url;

  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeEventPlaqueTexture(
  year: string,
  icon: string,
  title: string,
  desc: string,
  goldHex: string,
  curtainHex: string,
  textHex: string,
  bgHex: string,
): THREE.CanvasTexture {
  const w = 512,
    h = 384;

  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 768;
  const ctx = c.getContext("2d")!;
  ctx.scale(2, 2); // draw at 2x resolution, coordinates stay the same

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hexAlpha(bgHex, 1.0));
  grad.addColorStop(1, hexAlpha(bgHex, 0.95));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Noise
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.018})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  // Gold border
  ctx.strokeStyle = hexAlpha(goldHex, 0.45);
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = hexAlpha(goldHex, 0.2);
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  // Year — top left
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = hexAlpha(goldHex, 0.9);
  ctx.textAlign = "left";
  ctx.fillText(year, 38, 66);

  // Divider
  ctx.strokeStyle = hexAlpha(goldHex, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(38, 78);
  ctx.lineTo(w - 38, 78);
  ctx.stroke();

  // Icon — large, right side
  ctx.font = "80px serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = hexAlpha(goldHex, 0.15);
  ctx.fillText(icon, w - 30, 20);
  ctx.textBaseline = "alphabetic";

  // Title — large
  ctx.font = "300 32px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.95);
  ctx.textAlign = "left";
  const titleWords = title.split(" ");
  let tLine = "",
    ty = 130;
  for (const word of titleWords) {
    const test = tLine + (tLine ? " " : "") + word;
    if (ctx.measureText(test).width > w - 76 && tLine) {
      ctx.fillText(tLine, 38, ty);
      tLine = word;
      ty += 42;
    } else {
      tLine = test;
    }
  }
  ctx.fillText(tLine, 38, ty);
  ty += 32;

  // Desc
  ctx.font = "italic 24px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.55);
  const descWords = (desc ?? "").split(" ");
  let dLine = "",
    dy = ty + 8;
  for (const word of descWords) {
    const test = dLine + (dLine ? " " : "") + word;
    if (ctx.measureText(test).width > w - 76 && dLine) {
      ctx.fillText(dLine, 38, dy);
      dLine = word;
      dy += 28;
      if (dy > h - 36) break;
    } else {
      dLine = test;
    }
  }
  if (dy <= h - 36) ctx.fillText(dLine, 38, dy);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function RoomsEngine({
  config,
  sections,
  dateRevealed,
  onDateRevealed,
  isEditorPreview = false,
}: RoomsEngineProps) {
  const { theme } = useTheme();

  const DUST_COUNT = isEditorPreview ? DUST_COUNT_PREVIEW : DUST_COUNT_FULL;

  // When rendered inline in the editor (not in a full-page iframe/route),
  // position:fixed is already contained by the transform wrapper in PreviewFrame.
  // We use absolute positioning to match the containing block in both contexts.
  const isInline = typeof window !== "undefined" && window.self === window.top;

  const [isNarrow, setIsNarrow] = useState(false);

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

  const peekXRef = useRef(0); // current horizontal look offset
  const peekTargetRef = useRef(0); // target: -1 = left, 0 = centre, 1 = right
  const peekCooldownRef = useRef(false); // debounce timeline plaque advances

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
      peekTargetRef.current = 0;
      setIsAnimating(true);
      setShowContent(false);

      activeRef.current = clamped;
      setActiveIndex(clamped);

      // Broadcast to parent editor frame (iframe) or same window (inline) so
      // the jump bar highlights correctly in both rendering contexts
      if (!isInline) {
        window.parent.postMessage(
          { type: "SECTION_CHANGE", index: clamped },
          "*",
        );
      } else {
        // Inline in editor — post to same window, PreviewFrame listens here
        // _fromRooms flag prevents RoomsEngine's own SCROLL_TO handler from echoing
        window.postMessage(
          { type: "SECTION_CHANGE", index: clamped, _fromRooms: true },
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

      // Notify the parent that the date has been revealed — this is a no-op
      // if EventEngine already set dateRevealed=true via ScratchDate's onRevealed,
      // but acts as a safety net if the reveal path was triggered differently
      onDateRevealed();

      // Small delay so the guest sees the scratch completion before moving
      setTimeout(() => {
        goTo(scratchRoomIndex + 1);
      }, 1200);
    }
  }, [dateRevealed, scratchRoomIndex, goTo, onDateRevealed]);

  useEffect(() => {
    maxAllowedIndexRef.current = maxAllowedIndex;
  }, [maxAllowedIndex]);

  // ── Build all rooms into the scene ────────────────────────────────────────
  const buildScene = useCallback(
    (
      scene: THREE.Scene,
      t: typeof theme,
      W: number,
      H: number,
      cfg: EventConfig,
    ) => {
      // Clear existing room meshes (keep lights added separately)
      const toRemove: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData.isRoom) toRemove.push(obj);
      });
      toRemove.forEach((obj) => {
        if (obj.userData.countdownInterval) {
          clearInterval(obj.userData.countdownInterval);
        }
        scene.remove(obj);
      });
      lightsRef.current = [];
      doorGlowsRef.current = [];

      const bgCol = hexCol(t.bg);
      const bgMidCol = hexCol(t.bgMid);
      const wallCol = hexCol(t.curtain);
      const darkCol = hexCol(t.curtainDark);
      const goldCol = hexCol(t.gold);
      const goldLtCol = hexCol(t.goldLight);

      const inEditor = isEditorPreview;
      const inIframe = !isEditorPreview && window.self !== window.top;
      const isGuest = !isEditorPreview && window.self === window.top;

      // Hard cap on total dynamic lights to stay under WebGL uniform limit.
      // MeshStandardMaterial shaders allocate uniform slots for every light
      // in the scene. GPU limit is typically 256 vec4 uniforms in fragment
      // shader. Each PointLight costs ~3 uniforms, SpotLight ~6.
      // Cap: 12 point lights max on guest, 0 on editor/iframe.
      const MAX_LIGHTS = isGuest ? 12 : 0;
      let lightCount = 0;

      const addLight = (light: THREE.PointLight | THREE.SpotLight) => {
        if (lightCount >= MAX_LIGHTS) return;
        lightCount++;
        scene.add(light);
        if (light instanceof THREE.SpotLight) {
          scene.add(light.target);
        }
        lightsRef.current.push(light as THREE.PointLight);
      };

      const manyRooms = sections.length > 6;

      // ── Textures ──────────────────────────────────────────────────────────
      const floorTex = makeFloorTexture(t.curtainDark, t.bg);
      const wallTex = makeWallTexture(t.bgMid);
      const ceilTex = makeCeilingTexture(t.bgMid, t.gold);
      const stoneTex = makeStoneTexture(t.curtainDark);
      const bannerTex = makeBannerTexture(t.curtain, t.gold);

      // ── Shared materials ──────────────────────────────────────────────────
      const floorMat = new THREE.MeshLambertMaterial({
        map: floorTex,
      });

      const ceilMat = new THREE.MeshLambertMaterial({
        map: ceilTex,
        color: bgCol.clone().multiplyScalar(0.75),
      });

      const goldMat = new THREE.MeshStandardMaterial({
        color: goldCol,
        roughness: 0.18,
        metalness: 0.92,
        emissive: goldLtCol,
        emissiveIntensity: 0.08,
      });

      const stoneMat = new THREE.MeshLambertMaterial({
        map: stoneTex,
      });

      const carpetMat = new THREE.MeshLambertMaterial({
        color: wallCol,
      });

      const bannerMat = new THREE.MeshStandardMaterial({
        map: bannerTex,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });

      // ── Per-room + corridor construction ─────────────────────────────────
      sections.forEach((section, roomIndex) => {
        const group = new THREE.Group();
        group.userData.isRoom = true;
        // Room origin Z: each room+corridor pair is TOTAL_SEGMENT apart
        const rZ = -(roomIndex * TOTAL_SEGMENT);

        // ── Front wall with Gothic pointed arch ──
        const frontZ = rZ - ROOM_LENGTH;
        const aw = 2.7;
        const ar = aw / 2;

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
        const beamMat = new THREE.MeshLambertMaterial({
          color: darkCol,
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
        const sideWallMat = new THREE.MeshLambertMaterial({
          map: wallTex,
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
        const backWallMat = new THREE.MeshLambertMaterial({
          map: wallTex,
          color: bgCol.clone().multiplyScalar(0.82),
        });

        const backWall = new THREE.Mesh(
          new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
          backWallMat,
        );

        backWall.rotation.y = Math.PI;
        backWall.position.set(0, 0, rZ + 0.1);
        group.add(backWall);

        // ════════════════════════════════════════════════════════════════════════
        // BACK WALL CONTENT — faces camera on entry, built per section key
        // ════════════════════════════════════════════════════════════════════════
        {
          // Universal: section title engraved near top of back wall
          const titleCv = document.createElement("canvas");
          titleCv.width = 512;
          titleCv.height = 72;
          const tCtx = titleCv.getContext("2d")!;
          // tCtx.clearRect(0, 0, 512, 72);
          tCtx.fillStyle = hexAlpha(t.bg, 1.0);
          tCtx.fillRect(0, 0, 512, 72);
          tCtx.strokeStyle = hexAlpha(t.gold, 0.33);
          tCtx.lineWidth = 1;
          tCtx.beginPath();
          tCtx.moveTo(48, 14);
          tCtx.lineTo(464, 14);
          tCtx.stroke();
          tCtx.beginPath();
          tCtx.moveTo(48, 58);
          tCtx.lineTo(464, 58);
          tCtx.stroke();
          tCtx.fillStyle = hexAlpha(t.gold, 0.73);
          tCtx.font = "300 26px serif";
          tCtx.textAlign = "center";
          tCtx.fillText((section.label ?? "").toUpperCase(), 256, 46);
          const titleTex = new THREE.CanvasTexture(titleCv);
          titleTex.colorSpace = THREE.SRGBColorSpace;
          const titleMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(ROOM_WIDTH * 0.7, 0.55),
            new THREE.MeshBasicMaterial({
              map: titleTex,
            }),
          );
          // Title mesh
          // titleMesh.rotation.y = Math.PI;
          titleMesh.rotation.y = 0;
          titleMesh.position.set(0, ROOM_HEIGHT / 2 - 0.35, rZ + 0.25);

          group.add(titleMesh);

          // ── Section-specific back wall content ────────────────────────────────
          // if (section.key === "timeline") {
          //   const events = cfg.timeline ?? [];
          //   if (events.length > 0) {
          //     // Distribute events across 4 wall surfaces, stacking vertically per wall
          //     // Slot 0 = back wall, 1 = left wall, 2 = right wall, 3 = front-left panel
          //     const clampY = (y: number, plaqueH: number) =>
          //       Math.max(
          //         -ROOM_HEIGHT / 2 + plaqueH / 2 + 0.1,
          //         Math.min(ROOM_HEIGHT / 2 - plaqueH / 2 - 0.3, y),
          //       );

          //     const wallSlots = [
          //       {
          //         // Back wall — faces camera directly on entry
          //         rotation: new THREE.Euler(0, Math.PI, 0),
          //         position: (stackIdx: number, totalInSlot: number) => {
          //           const plaqueH = ROOM_WIDTH * 0.78 * (384 / 512);
          //           const totalH =
          //             totalInSlot * plaqueH + (totalInSlot - 1) * 0.1;
          //           const startY = totalH / 2 - plaqueH / 2;
          //           const rawY = startY - stackIdx * (plaqueH + 0.1);
          //           return new THREE.Vector3(
          //             0,
          //             clampY(rawY, plaqueH),
          //             rZ + 0.25,
          //           );
          //         },
          //         width: ROOM_WIDTH * 0.78,
          //       },
          //       {
          //         // Left wall — visible when peeking left
          //         rotation: new THREE.Euler(0, -Math.PI / 2, 0),
          //         position: (stackIdx: number, totalInSlot: number) => {
          //           const plaqueH = ROOM_LENGTH * 0.55 * (384 / 512);
          //           const totalH =
          //             totalInSlot * plaqueH + (totalInSlot - 1) * 0.1;
          //           const startY = totalH / 2 - plaqueH / 2;
          //           const rawY = startY - stackIdx * (plaqueH + 0.1);
          //           return new THREE.Vector3(
          //             -ROOM_WIDTH / 2 + 0.25,
          //             clampY(rawY, plaqueH),
          //             rZ - ROOM_LENGTH / 2,
          //           );
          //         },
          //         width: ROOM_LENGTH * 0.55,
          //       },
          //       {
          //         // Right wall — visible when peeking right
          //         rotation: new THREE.Euler(0, Math.PI / 2, 0),
          //         position: (stackIdx: number, totalInSlot: number) => {
          //           const plaqueH = ROOM_LENGTH * 0.55 * (384 / 512);
          //           const totalH =
          //             totalInSlot * plaqueH + (totalInSlot - 1) * 0.1;
          //           const startY = totalH / 2 - plaqueH / 2;
          //           const rawY = startY - stackIdx * (plaqueH + 0.1);
          //           return new THREE.Vector3(
          //             ROOM_WIDTH / 2 - 0.25,
          //             clampY(rawY, plaqueH),
          //             rZ - ROOM_LENGTH / 2,
          //           );
          //         },
          //         width: ROOM_LENGTH * 0.55,
          //       },
          //       {
          //         // Front wall left panel (beside arch) — visible when looking forward
          //         rotation: new THREE.Euler(0, 0, 0),
          //         position: (stackIdx: number, totalInSlot: number) => {
          //           const plaqueH = 1.8 * (384 / 512);
          //           const totalH =
          //             totalInSlot * plaqueH + (totalInSlot - 1) * 0.08;
          //           const startY = totalH / 2 - plaqueH / 2;
          //           const rawY = startY - stackIdx * (plaqueH + 0.08);
          //           return new THREE.Vector3(
          //             -(ROOM_WIDTH / 2 - 1.1),
          //             clampY(rawY, plaqueH),
          //             frontZ + 0.08,
          //           );
          //         },
          //         width: 1.8,
          //       },
          //     ];

          //     // Group events into the 4 slots: 0,4,8 → slot0; 1,5,9 → slot1; etc.
          //     const slotEvents: (typeof events)[0][][] = [[], [], [], []];
          //     events.forEach((ev, idx) => {
          //       slotEvents[idx % 4].push(ev);
          //     });

          //     slotEvents.forEach((slotEvs, slotIdx) => {
          //       if (slotEvs.length === 0) return;
          //       const slot = wallSlots[slotIdx];

          //       slotEvs.forEach((ev, stackIdx) => {
          //         // Scale down plaque width if stacking more than 1 to avoid overlap
          //         const scale = slotEvs.length > 1 ? 0.72 : 1.0;
          //         const scaledW = slot.width * scale;
          //         const scaledH = scaledW * (384 / 512);

          //         const tex = makeEventPlaqueTexture(
          //           ev.year,
          //           ev.icon,
          //           ev.title,
          //           ev.desc,
          //           t.gold,
          //           t.curtain,
          //           t.text,
          //           t.bg,
          //         );
          //         const plaque = new THREE.Mesh(
          //           new THREE.PlaneGeometry(scaledW, scaledH),
          //           new THREE.MeshBasicMaterial({
          //             map: tex,
          //           }),
          //         );
          //         plaque.rotation.copy(slot.rotation);
          //         plaque.position.copy(slot.position(stackIdx, slotEvs.length));
          //         group.add(plaque);
          //       });
          //     });
          //   }
          // }

          if (section.key === "timeline") {
            const events = cfg.timeline ?? [];
            if (events.length > 0) {
              // Store plaques in a ref so the peek input can swap which is visible.
              // We render all plaques at the same position on the back wall,
              // showing only the active one via material opacity.
              const timelinePlaquesRef: THREE.Mesh[] = [];

              events.forEach((ev, idx) => {
                const tex = makeEventPlaqueTexture(
                  ev.year,
                  ev.icon,
                  ev.title,
                  ev.desc,
                  t.gold,
                  t.curtain,
                  t.text,
                  t.bg,
                );

                // Wider on landscape viewports, narrower on portrait/mobile
                const plaqueW =
                  ROOM_WIDTH * (W < 768 ? 0.28 : W < 1280 ? 0.33 : 0.38);
                const plaqueH = plaqueW * (384 / 512);

                const mat = new THREE.MeshBasicMaterial({
                  map: tex,
                  transparent: true,
                  opacity: idx === 0 ? 1 : 0,
                  depthWrite: false,
                });

                const plaque = new THREE.Mesh(
                  new THREE.PlaneGeometry(plaqueW, plaqueH),
                  mat,
                );

                // Sit flush against back wall, facing camera (rotation.y = Math.PI
                // so normal points toward +Z / camera)
                // plaque.rotation.y = Math.PI;
                plaque.rotation.y = 0;
                plaque.position.set(0, 0.1, rZ + 0.25);
                plaque.userData.timelinePlaque = true;
                plaque.userData.timelineRoomIndex = roomIndex;
                group.add(plaque);
                timelinePlaquesRef.push(plaque);
              });

              // Counter badge — "1 / N"
              const badgeCv = document.createElement("canvas");
              badgeCv.width = 256;
              badgeCv.height = 64;
              const bCtx = badgeCv.getContext("2d")!;
              bCtx.fillStyle = hexAlpha(t.bg, 0.85);
              bCtx.fillRect(0, 0, 256, 64);
              bCtx.strokeStyle = hexAlpha(t.gold, 0.4);
              bCtx.lineWidth = 1.5;
              bCtx.strokeRect(4, 4, 248, 56);
              bCtx.font = "bold 22px monospace";
              bCtx.fillStyle = hexAlpha(t.gold, 0.9);
              bCtx.textAlign = "center";
              bCtx.textBaseline = "middle";
              bCtx.fillText(`1 / ${events.length}`, 128, 32);

              const badgeTex = new THREE.CanvasTexture(badgeCv);
              badgeTex.colorSpace = THREE.SRGBColorSpace;

              const badge = new THREE.Mesh(
                new THREE.PlaneGeometry(ROOM_WIDTH * 0.22, 0.28),
                new THREE.MeshBasicMaterial({
                  map: badgeTex,
                  transparent: true,
                }),
              );
              // badge.rotation.y = Math.PI;
              badge.rotation.y = 0;
              badge.position.set(0, -ROOM_HEIGHT / 2 + 1.1, rZ + 0.25);
              badge.userData.timelineBadge = true;
              badge.userData.timelineRoomIndex = roomIndex;
              group.add(badge);

              // Track active index per room in userData on the group
              group.userData.timelineActiveIdx = 0;
              group.userData.timelinePlaques = timelinePlaquesRef;
              group.userData.timelineBadge = badge;
              group.userData.timelineBadgeTex = badgeTex;
              group.userData.timelineBadgeCtx = bCtx;
              group.userData.timelineTotal = events.length;
            }
          } else if (section.key === "gallery") {
            const photos = cfg.galleryPhotos ?? [];
            if (photos.length > 0) {
              // 2x2 photo grid mosaic on the back wall
              const gridW = 512,
                gridH = 512;
              const cv = document.createElement("canvas");
              cv.width = gridW;
              cv.height = gridH;
              const ctx = cv.getContext("2d")!;
              ctx.fillStyle = hexAlpha(t.curtainDark, 0.67);
              ctx.fillRect(0, 0, gridW, gridH);

              // Gold border
              ctx.strokeStyle = hexAlpha(t.gold, 0.38);
              ctx.lineWidth = 2;
              ctx.strokeRect(6, 6, gridW - 12, gridH - 12);

              const tex = new THREE.CanvasTexture(cv);
              tex.colorSpace = THREE.SRGBColorSpace;
              const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(ROOM_WIDTH * 0.7, ROOM_WIDTH * 0.7),
                new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
              );
              mesh.rotation.y = Math.PI;
              mesh.position.set(0, -0.1, frontZ + 0.15);
              group.add(mesh);

              // Load each photo and draw into the grid when ready
              photos.slice(0, 4).forEach((url, i) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                  const col = i % 2,
                    row = Math.floor(i / 2);
                  const pad = 8;
                  const cellW = (gridW - pad * 3) / 2;
                  const cellH = (gridH - pad * 3) / 2;
                  const dx = pad + col * (cellW + pad);
                  const dy = pad + row * (cellH + pad);
                  // Cover-crop the image into the cell
                  const aspect = img.width / img.height;
                  let sx = 0,
                    sy = 0,
                    sw = img.width,
                    sh = img.height;
                  const cellAspect = cellW / cellH;
                  if (aspect > cellAspect) {
                    sw = img.height * cellAspect;
                    sx = (img.width - sw) / 2;
                  } else {
                    sh = img.width / cellAspect;
                    sy = (img.height - sh) / 2;
                  }
                  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, cellW, cellH);
                  // Gold divider lines
                  ctx.strokeStyle = hexAlpha(t.gold, 0.25);
                  ctx.lineWidth = pad;
                  ctx.strokeRect(0, gridH / 2 - pad / 2, gridW, 0);
                  ctx.strokeRect(gridW / 2 - pad / 2, 0, 0, gridH);
                  tex.needsUpdate = true;
                };
                img.src = url;
              });
            }
          }
          // else if (section.key === "countdown") {
          //   const events = cfg; // full config available as cfg

          //   const cvW = 1024,
          //     cvH = 768;
          //   const cv = document.createElement("canvas");
          //   cv.width = cvW;
          //   cv.height = cvH;
          //   const ctx = cv.getContext("2d")!;

          //   const tex = new THREE.CanvasTexture(cv);
          //   tex.colorSpace = THREE.SRGBColorSpace;

          //   // Fit within room height with margins for title strip + floor gap
          //   const maxPlaqueH = ROOM_HEIGHT - 0.8;
          //   const maxPlaqueW = ROOM_WIDTH * 0.35;
          //   const plaqueH = Math.min(maxPlaqueH, maxPlaqueW * (cvH / cvW));
          //   const plaqueW = plaqueH * (cvW / cvH);

          //   const mesh = new THREE.Mesh(
          //     new THREE.PlaneGeometry(plaqueW, plaqueH),
          //     new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
          //   );
          //   mesh.rotation.y = 0;
          //   mesh.position.set(0, -0.15, rZ + 0.25);
          //   group.add(mesh);

          //   // ── Draw function — called every second ──────────────────────────────
          //   const drawCountdown = () => {
          //     ctx.clearRect(0, 0, cvW, cvH);

          //     // Derive time left
          //     const dateStr = cfg.date ?? DEMO_EVENT_CONFIG.date;
          //     const [yr, mo, dy2] = dateStr.split("-").map(Number);
          //     const eventDate = new Date(yr, mo - 1, dy2);
          //     const diff = eventDate.getTime() - Date.now();
          //     const tl =
          //       diff <= 0
          //         ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
          //         : {
          //             days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          //             hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          //             minutes: Math.floor((diff / (1000 * 60)) % 60),
          //             seconds: Math.floor((diff / 1000) % 60),
          //           };

          //     // ── Background ───────────────────────────────────────────────────────
          //     const bg = ctx.createLinearGradient(0, 0, 0, cvH);
          //     bg.addColorStop(0, hexAlpha(t.bg, 0.0));
          //     bg.addColorStop(1, hexAlpha(t.bg, 0.0));
          //     ctx.fillStyle = bg;
          //     ctx.fillRect(0, 0, cvW, cvH);

          //     // ── Hourglass ornament ───────────────────────────────────────────────
          //     const hx = cvW / 2,
          //       hy = 80;
          //     ctx.save();
          //     ctx.translate(hx - 16, hy - 28);
          //     // Top bulb
          //     ctx.beginPath();
          //     ctx.moveTo(4, 4);
          //     ctx.quadraticCurveTo(4, 32, 16, 40);
          //     ctx.quadraticCurveTo(28, 32, 28, 4);
          //     ctx.closePath();
          //     ctx.fillStyle = hexAlpha(t.curtain, 0.35);
          //     ctx.fill();
          //     ctx.strokeStyle = hexAlpha(t.gold, 0.6);
          //     ctx.lineWidth = 1.5;
          //     ctx.stroke();
          //     // Bottom bulb
          //     ctx.beginPath();
          //     ctx.moveTo(4, 76);
          //     ctx.quadraticCurveTo(4, 48, 16, 40);
          //     ctx.quadraticCurveTo(28, 48, 28, 76);
          //     ctx.closePath();
          //     ctx.fillStyle = hexAlpha(t.curtain, 0.25);
          //     ctx.fill();
          //     ctx.strokeStyle = hexAlpha(t.gold, 0.6);
          //     ctx.stroke();
          //     // Sand
          //     ctx.fillStyle = hexAlpha(t.gold, 0.25);
          //     ctx.beginPath();
          //     ctx.moveTo(8, 6);
          //     ctx.quadraticCurveTo(8, 28, 16, 36);
          //     ctx.quadraticCurveTo(24, 28, 24, 6);
          //     ctx.closePath();
          //     ctx.fill();
          //     // Sand pile bottom
          //     ctx.beginPath();
          //     ctx.ellipse(16, 70, 6, 2, 0, 0, Math.PI * 2);
          //     ctx.fillStyle = hexAlpha(t.gold, 0.35);
          //     ctx.fill();
          //     // Frame bars
          //     ctx.fillStyle = hexAlpha(t.gold, 0.5);
          //     ctx.fillRect(2, 2, 28, 4);
          //     ctx.fillRect(2, 74, 28, 4);
          //     ctx.restore();

          //     // ── "Until We Say I Do" label ────────────────────────────────────────
          //     const isWedding = cfg.eventType === "wedding";
          //     const untilLabel = `UNTIL ${isWedding ? "WE SAY I DO" : "THE BIG DAY"}`;
          //     ctx.font = "bold 24px monospace";
          //     ctx.fillStyle = hexAlpha(t.gold, 1.0);
          //     ctx.textAlign = "center";
          //     ctx.letterSpacing = "0.5em";
          //     ctx.fillText(untilLabel, cvW / 2 - 12, 172);
          //     ctx.letterSpacing = "0";

          //     // ── "Counting Down" heading ──────────────────────────────────────────
          //     ctx.font = "bold 58px serif";
          //     ctx.fillStyle = hexAlpha(t.text, 0.95);
          //     ctx.textAlign = "center";
          //     ctx.fillText("Counting Down", cvW / 2, 238);

          //     // Divider
          //     ctx.strokeStyle = hexAlpha(t.gold, 0.5);
          //     ctx.lineWidth = 1;
          //     ctx.beginPath();
          //     ctx.moveTo(cvW / 2 - 80, 256);
          //     ctx.lineTo(cvW / 2 + 80, 256);
          //     ctx.stroke();

          //     // ── Date + location line (matches CountdownPanel exactly) ────────────
          //     ctx.font = "bold italic 28px serif";
          //     ctx.fillStyle = hexAlpha(t.gold, 0.85);
          //     ctx.textAlign = "center";
          //     const venueStr = cfg.venueDetails?.[0]
          //       ? createCountDownLoaction(cfg.venueDetails[0])
          //       : "";
          //     ctx.fillText(formattedDate(cfg.date ?? ""), cvW / 2, 292);
          //     ctx.fillText(venueStr, cvW / 2, 330);

          //     // ── Stone digit blocks ───────────────────────────────────────────────
          //     const units2 = [
          //       { v: tl.days, label: "DAYS" },
          //       { v: tl.hours, label: "HRS" },
          //       { v: tl.minutes, label: "MIN" },
          //       { v: tl.seconds, label: "SEC" },
          //     ];

          //     const blockW = 160,
          //       blockH = 140,
          //       gap = 24;
          //     const totalW = units2.length * blockW + (units2.length - 1) * gap;
          //     const startX = (cvW - totalW) / 2;
          //     const blockY = 390;

          //     units2.forEach(({ v, label }, i) => {
          //       const bx = startX + i * (blockW + gap);

          //       // Block background
          //       const blockGrad = ctx.createLinearGradient(
          //         bx,
          //         blockY,
          //         bx + blockW,
          //         blockY + blockH,
          //       );
          //       blockGrad.addColorStop(0, hexAlpha(t.curtain, 0.45));
          //       blockGrad.addColorStop(1, "rgba(0,0,0,0.55)");
          //       ctx.fillStyle = blockGrad;
          //       ctx.beginPath();
          //       ctx.roundRect(bx, blockY, blockW, blockH, 10);
          //       ctx.fill();

          //       // Block border
          //       ctx.strokeStyle = hexAlpha(t.gold, 0.3);
          //       ctx.lineWidth = 1.5;
          //       ctx.beginPath();
          //       ctx.roundRect(bx, blockY, blockW, blockH, 10);
          //       ctx.stroke();

          //       // Corner notches
          //       const notchSize = 12;
          //       [
          //         [bx + 4, blockY + 4],
          //         [bx + blockW - 4 - notchSize, blockY + 4],
          //         [bx + 4, blockY + blockH - 4 - notchSize],
          //         [
          //           bx + blockW - 4 - notchSize,
          //           blockY + blockH - 4 - notchSize,
          //         ],
          //       ].forEach(([nx, ny], ni) => {
          //         ctx.strokeStyle = hexAlpha(t.gold, 0.22);
          //         ctx.lineWidth = 1;
          //         ctx.beginPath();
          //         if (ni === 0) {
          //           ctx.moveTo(nx, ny + notchSize);
          //           ctx.lineTo(nx, ny);
          //           ctx.lineTo(nx + notchSize, ny);
          //         }
          //         if (ni === 1) {
          //           ctx.moveTo(nx, ny);
          //           ctx.lineTo(nx + notchSize, ny);
          //           ctx.lineTo(nx + notchSize, ny + notchSize);
          //         }
          //         if (ni === 2) {
          //           ctx.moveTo(nx, ny);
          //           ctx.lineTo(nx, ny + notchSize);
          //           ctx.lineTo(nx + notchSize, ny + notchSize);
          //         }
          //         if (ni === 3) {
          //           ctx.moveTo(nx, ny);
          //           ctx.lineTo(nx + notchSize, ny); /* skip */
          //         }
          //         ctx.stroke();
          //       });

          //       // Centre engraved line
          //       ctx.strokeStyle = hexAlpha(t.gold, 0.18);
          //       ctx.lineWidth = 1;
          //       ctx.beginPath();
          //       ctx.moveTo(bx + 16, blockY + blockH / 2);
          //       ctx.lineTo(bx + blockW - 16, blockY + blockH / 2);
          //       ctx.stroke();

          //       // Number
          //       ctx.font = "bold 72px monospace";
          //       ctx.fillStyle = hexAlpha(t.gold, 0.92);
          //       ctx.textAlign = "center";
          //       ctx.textBaseline = "middle";
          //       ctx.shadowColor = hexAlpha(t.gold, 0.4);
          //       ctx.shadowBlur = 12;
          //       ctx.fillText(
          //         String(v).padStart(2, "0"),
          //         bx + blockW / 2,
          //         blockY + blockH / 2,
          //       );
          //       ctx.shadowBlur = 0;
          //       ctx.textBaseline = "alphabetic";

          //       // Separator dots (between blocks)
          //       if (i < units2.length - 1) {
          //         const dotX = bx + blockW + gap / 2;
          //         const dotY1 = blockY + blockH / 2 - 12;
          //         const dotY2 = blockY + blockH / 2 + 12;
          //         ctx.fillStyle = hexAlpha(t.gold, 0.5);
          //         ctx.beginPath();
          //         ctx.arc(dotX, dotY1, 4, 0, Math.PI * 2);
          //         ctx.fill();
          //         ctx.beginPath();
          //         ctx.arc(dotX, dotY2, 4, 0, Math.PI * 2);
          //         ctx.fill();
          //       }

          //       // Label below block
          //       ctx.font = "bold 22px monospace";
          //       ctx.fillStyle = hexAlpha(t.gold, 0.9);
          //       ctx.textAlign = "center";
          //       ctx.textBaseline = "alphabetic";
          //       ctx.letterSpacing = "0.3em";
          //       ctx.fillText(label, bx + blockW / 2 - 4, blockY + blockH + 36);
          //       ctx.letterSpacing = "0";
          //     });

          //     // ── Interlocked rings ────────────────────────────────────────────────
          //     const rx = cvW / 2,
          //       ry = cvH - 72,
          //       rrad = 28;
          //     for (const [cx3, fill] of [
          //       [rx - 20, 0.3],
          //       [rx + 20, 0.3],
          //     ] as [number, number][]) {
          //       ctx.beginPath();
          //       ctx.arc(cx3, ry, rrad, 0, Math.PI * 2);
          //       ctx.fillStyle = hexAlpha(t.gold, fill);
          //       ctx.fill();
          //       ctx.strokeStyle = hexAlpha(t.gold, 0.7);
          //       ctx.lineWidth = 2;
          //       ctx.stroke();
          //     }

          //     tex.needsUpdate = true;
          //   };

          //   // Draw immediately then tick every second
          //   drawCountdown();
          //   const intervalId = setInterval(drawCountdown, 1000);

          //   // Store interval ID on group so it can be cleared on rebuild
          //   group.userData.countdownInterval = intervalId;
          // }
        }

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
          new THREE.MeshLambertMaterial({
            map: wallTex,
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

        const panelMat2 = new THREE.MeshLambertMaterial({
          color: new THREE.Color(t.curtainDark).multiplyScalar(1.15),
        });

        // Dado rail (horizontal gold strip at ~0.9 height)
        if (section.key !== "timeline") {
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
        }

        // ── PORTRAIT FRAMES on side walls (2 per side) ──
        const frameMat2 = new THREE.MeshStandardMaterial({
          color: goldCol,
          roughness: 0.2,
          metalness: 0.9,
          emissive: goldLtCol,
          emissiveIntensity: 0.06,
        });

        const matMat2 = new THREE.MeshLambertMaterial({
          color: darkCol,
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

            // Per-section frame fill — side walls face 90° from camera so frames
            // are visible when the guest glances left/right. We fill them with
            // content relevant to the room; the primary back-wall content plane
            // (added below, outside this loop) is what greets guests on entry.
            const wallSide = wallX < 0 ? 0 : 1; // 0 = left wall, 1 = right wall
            const frameSlot = wallSide * 2 + f; // 0,1 = left; 2,3 = right

            let innerMat: THREE.Material = matMat2;

            if (section.key === "timeline") {
              continue;
              // const events = cfg.timeline ?? [];
              // const ev = events[frameSlot];
              // if (ev) {
              //   innerMat = new THREE.MeshBasicMaterial({
              //     map: makeTimelineFrameTexture(
              //       ev.year,
              //       ev.icon,
              //       ev.title,
              //       ev.desc,
              //       t.gold,
              //       t.curtain,
              //       t.text,
              //     ),
              //   });
              // }
            } else if (section.key === "gallery") {
              const photos = cfg.galleryPhotos ?? [];
              const url = photos[frameSlot];
              if (url) {
                innerMat = new THREE.MeshBasicMaterial({
                  map: makePhotoTexture(url),
                });
              }
            }

            frameGrp.add(new THREE.Mesh(innerGeo, innerMat));

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

            // Editor: no picture lights at all
            // iframe: one PointLight per wall side (f===0 only, not per frame)
            // Guest with few rooms: one PointLight per frame (full quality)
            // Guest with many rooms: one PointLight per wall side only
            if (isGuest && !manyRooms) {
              const picLight = new THREE.SpotLight(
                goldLtCol,
                1.8,
                3.5,
                Math.PI / 7,
                0.4,
              );
              picLight.position.set(wallX * 0.75, ROOM_HEIGHT / 2 - 0.3, fz);
              picLight.target.position.set(wallX * 0.8, 0, fz);

              addLight(picLight);
            } else if (isGuest && manyRooms && f === 0) {
              const picLight = new THREE.PointLight(goldLtCol, 0.9, 4.0, 2.2);
              picLight.position.set(
                wallX * 0.75,
                ROOM_HEIGHT / 2 - 0.4,
                rZ - ROOM_LENGTH / 2,
              );

              addLight(picLight);
            }
            // inEditor: nothing added
          }

          // ── WALL SCONCE (between the two frames) ──
          const sconceZ = rZ - ROOM_LENGTH / 2;

          // Sconce lights: guest page only — iframe and editor rely on globe emissive
          if (isGuest) {
            const sconcePt = new THREE.PointLight(
              goldLtCol,
              manyRooms ? 1.0 : 1.4,
              ROOM_WIDTH * 1.1,
              2.0,
            );
            sconcePt.position.set(wallX * 0.82, ROOM_HEIGHT / 2 - 0.7, sconceZ);

            addLight(sconcePt);
          }

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
              new THREE.MeshLambertMaterial({
                color: darkCol,
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

        // Editor preview: no dynamic lights at all — ambient + emissive only
        if (!inEditor) {
          const chanLight = new THREE.PointLight(
            goldLtCol,
            4.0,
            inIframe
              ? ROOM_LENGTH * 0.9
              : manyRooms
                ? ROOM_LENGTH * 1.0
                : ROOM_LENGTH * 1.3,
            1.5,
          );
          chanLight.position.set(0, ROOM_HEIGHT / 2 - 0.85, chanZ);
          chanLight.castShadow = isGuest && !manyRooms;
          if (isGuest && !manyRooms) chanLight.shadow.mapSize.set(256, 256);

          addLight(chanLight);
        }

        // ── HERALDIC BANNERS hanging between frames ──
        if (section.key !== "timeline") {
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
        }

        // ── DECORATIVE COLUMNS flanking the arch ──
        for (const colX of [-(aw / 2 + 0.25), aw / 2 + 0.25]) {
          // Column shaft
          const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.16, ROOM_HEIGHT * 0.88, 12),
            new THREE.MeshLambertMaterial({
              color: darkCol,
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
              new THREE.MeshLambertMaterial({
                color: darkCol,
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

          if (!inEditor) {
            const torchLight = new THREE.PointLight(
              new THREE.Color(1, 0.55, 0.12),
              2.0,
              inIframe ? 3.0 : ROOM_WIDTH * 0.85,
              2.5,
            );
            torchLight.position.set(tx, -0.04, rZ - 0.18);

            addLight(torchLight);
          }
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
              new THREE.MeshLambertMaterial({
                map: wallTex,
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
            // Corridor lights: guest page only, and only one side when many rooms
            const corrLightPos = new THREE.Vector3(
              cx,
              CORRIDOR_HEIGHT / 2 - ROOM_HEIGHT / 2 - 0.4,
              corrMid,
            );
            const isFirstCorrSide = cx === -CORRIDOR_WIDTH / 2 + 0.08;
            if (isGuest && (!manyRooms || isFirstCorrSide)) {
              const corrLight = new THREE.PointLight(
                goldLtCol,
                manyRooms ? 1.0 : 0.8,
                CORRIDOR_WIDTH * 2,
                2.5,
              );

              corrLight.position.copy(corrLightPos);

              addLight(corrLight);
            }

            const cGlobe = new THREE.Mesh(
              new THREE.SphereGeometry(0.045, 8, 6),
              new THREE.MeshStandardMaterial({
                color: goldLtCol,
                emissive: goldLtCol,
                emissiveIntensity: 1.4,
                roughness: 0,
              }),
            );
            // cGlobe.position.copy(corrLight.position);
            cGlobe.position.copy(corrLightPos);
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
    [sections, config],
  );

  // ── Three.js initialisation ───────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || mount.offsetWidth || 0;
    const H = mount.clientHeight || mount.offsetHeight || 0;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);

    // In the editor preview iframe, cap pixel ratio at 1 and disable shadows
    // to keep the frame budget manageable
    // const inPreview = window.self !== window.top;
    const inPreview = isEditorPreview || window.self !== window.top;
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
    scene.fog = new THREE.Fog(hexCol(theme.bg).getHex(), 8, ROOM_LENGTH * 1.8);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(70, W / H, 0.05, 200);
    camera.position.set(0, CAM_Y, CAM_Z_OFFSET);
    camera.lookAt(0, CAM_Y, -1);
    cameraRef.current = camera;

    // Ambient — stronger in editor where we skip dynamic lights
    scene.add(
      new THREE.AmbientLight(
        hexCol(theme.bg).lerp(new THREE.Color("#fff"), 0.35),
        isEditorPreview ? 1.8 : 0.5,
      ),
    );
    // Add a hemisphere light for editor mode to give depth without uniforms
    if (isEditorPreview) {
      scene.add(
        new THREE.HemisphereLight(
          hexCol(theme.goldLight).getHex(),
          hexCol(theme.curtainDark).getHex(),
          0.6,
        ),
      );
    }

    // Build geometry
    buildScene(scene, theme, W, H, config);

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
    const onResize = (entries?: ResizeObserverEntry[]) => {
      // const w = mount.clientWidth || mount.offsetWidth;
      // const h = mount.clientHeight || mount.offsetHeight;
      // if (!w || !h) return;
      // Use ResizeObserver contentRect when available — gives exact container
      // dimensions regardless of window size, critical for inline editor preview
      const w =
        entries?.[0]?.contentRect.width ||
        mount.clientWidth ||
        mount.offsetWidth;
      const h =
        entries?.[0]?.contentRect.height ||
        mount.clientHeight ||
        mount.offsetHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      prevRT.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      setIsNarrow(w < 520);
    };

    const ro = new ResizeObserver((entries) => onResize(entries));
    ro.observe(mount);
    window.addEventListener("resize", () => onResize());
    requestAnimationFrame(() => onResize());

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
        setTimeout(() => setShowContent(true), 120);
      }

      // Camera position: Z tracks room travel, bob + sway when moving
      bobTimeRef.current += dt;
      const bobAmt = moving ? 0.025 : 0.008;
      const swayAmt = moving ? 0.018 : 0.005;

      const camX = Math.sin(bobTimeRef.current * 1.1) * swayAmt;
      const camY =
        CAM_Y + Math.abs(Math.sin(bobTimeRef.current * 2.4)) * bobAmt;
      const camZ = CAM_Z_OFFSET - currentZRef.current;
      // const camZ = currentZRef.current - CAM_Z_OFFSET;

      camera.position.set(camX, camY, camZ);

      // Look ahead into the room — fixed point far ahead on the Z axis
      // Slight downward tilt when moving for a natural walking lean
      const lookTiltY = moving ? camY - 0.04 : camY;
      peekXRef.current +=
        (peekTargetRef.current * 4.0 - peekXRef.current) * 0.08;

      // ── Timeline: use peek buttons to cycle through event plaques ──
      const activeSection = sections[activeRef.current];
      if (activeSection?.key === "timeline" && peekTargetRef.current !== 0) {
        // Find the active room group
        if (!peekCooldownRef.current) {
          peekCooldownRef.current = true;
          setTimeout(() => {
            peekCooldownRef.current = false;
          }, 600);

          const dir = peekTargetRef.current > 0 ? 1 : -1;
          sceneRef.current?.traverse((obj) => {
            if (
              obj instanceof THREE.Group &&
              obj.userData.isRoom &&
              obj.userData.timelinePlaques
            ) {
              const plaques: THREE.Mesh[] = obj.userData.timelinePlaques;
              const total: number = obj.userData.timelineTotal;
              const cur: number = obj.userData.timelineActiveIdx;
              const next = Math.max(0, Math.min(total - 1, cur + dir));
              if (next === cur) return;

              // Fade out current, fade in next
              (plaques[cur].material as THREE.MeshBasicMaterial).opacity = 0;
              (plaques[next].material as THREE.MeshBasicMaterial).opacity = 1;
              obj.userData.timelineActiveIdx = next;

              // Update badge texture
              const bCtx: CanvasRenderingContext2D =
                obj.userData.timelineBadgeCtx;
              const badgeTex: THREE.CanvasTexture =
                obj.userData.timelineBadgeTex;
              const t2 = theme; // closure — theme is in scope
              bCtx.clearRect(0, 0, 256, 64);
              bCtx.fillStyle = hexAlpha(t2.bg, 0.85);
              bCtx.fillRect(0, 0, 256, 64);
              bCtx.strokeStyle = hexAlpha(t2.gold, 0.4);
              bCtx.lineWidth = 1.5;
              bCtx.strokeRect(4, 4, 248, 56);
              bCtx.font = "bold 22px monospace";
              bCtx.fillStyle = hexAlpha(t2.gold, 0.9);
              bCtx.textAlign = "center";
              bCtx.textBaseline = "middle";
              bCtx.fillText(`${next + 1} / ${total}`, 128, 32);
              badgeTex.needsUpdate = true;
            }
          });
        }

        // Don't rotate camera for timeline — zero out peek so wall stays centred
        peekXRef.current = 0;
      }

      // Use a close forward distance so the horizontal offset creates real angular rotation.
      // camZ - 5 means we look 5 units ahead — a 4-unit sideways offset gives ~38° peek angle.
      camera.lookAt(camX + peekXRef.current, lookTiltY, camZ - 5);

      // camera.lookAt(camX, lookTiltY, camZ - 100);

      // Field-of-view pulse when moving (zoom-out slight)
      const fovTarget = moving ? 71 : 70;
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
      // const inPreview = window.self !== window.top;
      const inPreview = isEditorPreview || window.self !== window.top;
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
      ro.disconnect();
      window.removeEventListener("resize", () => onResize());
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, []); // mount once

  // Re-build scene geometry when theme changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.fog = new THREE.Fog(hexCol(theme.bg).getHex(), 8, ROOM_LENGTH * 1.8);
    buildScene(scene, theme, window.innerWidth, window.innerHeight, config);
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
      if (e.data?.type === "RESET_PREVIEW") {
        // Reset camera and navigation state to room 0
        activeRef.current = 0;
        setActiveIndex(0);
        targetZRef.current = 0;
        currentZRef.current = 0;
        camVelRef.current = 0;
        animatingRef.current = false;
        setIsAnimating(false);
        setShowContent(true);
        return;
      }

      if (e.data?.type === "SCROLL_TO" && typeof e.data.index === "number") {
        // Ignore echoed messages in inline mode — only act on messages
        // that originate from a different source (the jump bar button click
        // posts directly, not via the RoomsEngine itself)
        if (e.data._fromRooms) return;
        goTo(e.data.index);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    // Don't start a navigation swipe if peeking is active
    if (peekTargetRef.current !== 0) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    // Don't navigate if peek was activated during this touch
    if (peekTargetRef.current !== 0) {
      touchStartX.current = null;
      return;
    }
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 45) goTo(activeRef.current + (dx > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div
      // className="fixed inset-0 overflow-hidden"
      className="absolute inset-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0 size-full" />

      {/* Dynamic vignette — darkens edges during room travel */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          opacity: !showContent ? 1 : 0,
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
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: showContent ? 1 : 0 }}
      >
        {sections.map((section, i) => {
          // Sections fully replaced by 3D wall geometry — no HTML overlay needed
          const promotedTo3D = new Set([
            "timeline",
            // "countdown"
          ]);
          if (promotedTo3D.has(section.key)) return null;

          return (
            <div
              key={section.key}
              data-rooms-panel
              className="absolute inset-0"
              style={{
                display: i === activeIndex ? "block" : "none",
                pointerEvents:
                  i === activeIndex && showContent ? "auto" : "none",
                overflowY: i === activeIndex ? "auto" : "hidden",
                background: "transparent",
                WebkitMaskImage:
                  "radial-gradient(ellipse 78% 70% at 50% 50%, black 30%, transparent 100%)",
                maskImage:
                  "radial-gradient(ellipse 78% 70% at 50% 50%, black 30%, transparent 100%)",
              }}
            >
              {section.node}
            </div>
          );
        })}
      </div>

      {/* Timeline: hint that both walls have portrait frames */}
      {showContent && sections[activeIndex]?.key === "timeline" && (
        <div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ opacity: 0.55 }}
        >
          <p
            className="font-label font-semibold text-[9px] text-center tracking-[0.4em] uppercase"
            style={{ color: theme.gold }}
          >
            {config.timeline?.length
              ? `Our story · ${config.timeline.length} moments · use ‹ › to browse`
              : "Our story · look left and right"}
          </p>
        </div>
      )}

      {/* ── Room name — bottom centre HUD ── */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none @container-[rooms-preview]/[max-width:300px]:hidden"
        style={{
          opacity: showContent ? 1 : 0,
          transition: "opacity 0.5s ease",
          display: isNarrow ? "none" : undefined,
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

      {/* ── Peek left/right — only for sections with side-wall frame content ── */}
      {showContent &&
        !isAnimating &&
        ["timeline", "gallery"].includes(sections[activeIndex]?.key) && (
          <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-20 flex items-center justify-between px-3!">
            <button
              className="pointer-events-auto flex items-center justify-center rounded-full transition-all cursor-pointer opacity-40 hover:opacity-90"
              style={{
                width: 32,
                height: 32,
                background: `${theme.bg}CC`,
                border: `1px solid ${theme.gold}40`,
                color: theme.gold,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                peekTargetRef.current = -1;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                peekTargetRef.current = -1;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onTouchCancel={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
            <button
              className="pointer-events-auto flex items-center justify-center rounded-full transition-all cursor-pointer opacity-40 hover:opacity-90"
              style={{
                width: 32,
                height: 32,
                background: `${theme.bg}CC`,
                border: `1px solid ${theme.gold}40`,
                color: theme.gold,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 1;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 1;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
              onTouchCancel={(e) => {
                e.stopPropagation();
                peekTargetRef.current = 0;
              }}
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
          </div>
        )}

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
