"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import { ROOM_LENGTH } from "@/components/rooms-r3f/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Static real-texture URLs (ambientCG CC0 — https://ambientcg.com)
// ─────────────────────────────────────────────────────────────────────────────
// Castle: stone walls, marble floor, fabric banners
export const TEXTURE_CASTLE_WALL = "/textures/Rock025_1K-JPG_Color.jpg";
export const TEXTURE_CASTLE_WALL_NORMAL =
  "/textures/Rock025_1K-JPG_NormalGL.jpg";
export const TEXTURE_CASTLE_WALL_ROUGH =
  "/textures/Rock025_1K-JPG_Roughness.jpg";
export const TEXTURE_CASTLE_FLOOR = "/textures/Marble008_1K-JPG_Color.jpg";
export const TEXTURE_CASTLE_FLOOR_NORMAL =
  "/textures/Marble008_1K-JPG_NormalGL.jpg";
export const TEXTURE_CASTLE_FLOOR_ROUGH =
  "/textures/Marble008_1K-JPG_Roughness.jpg";
export const TEXTURE_CASTLE_CEILING = "/textures/Fabric036_1K-JPG_Color.jpg";
export const TEXTURE_CASTLE_CEILING_NORMAL =
  "/textures/Fabric036_1K-JPG_NormalGL.jpg";
export const TEXTURE_CASTLE_CEILING_ROUGH =
  "/textures/Fabric036_1K-JPG_Roughness.jpg";
export const TEXTURE_CASTLE_BANNER = "/textures/Fabric036_1K-JPG_Color.jpg";

// Farm: wood plank walls/floor
export const TEXTURE_FARM_WOOD = "/textures/Wood046_1K-JPG_Color.jpg";
export const TEXTURE_FARM_WOOD_NORMAL = "/textures/Wood046_1K-JPG_NormalGL.jpg";
export const TEXTURE_FARM_WOOD_ROUGH = "/textures/Wood046_1K-JPG_Roughness.jpg";

// Garden: fabric lattice wall, ground grass
export const TEXTURE_GARDEN_LATTICE = "/textures/Fabric036_1K-JPG_Color.jpg";
export const TEXTURE_GARDEN_LATTICE_NORMAL =
  "/textures/Fabric036_1K-JPG_NormalGL.jpg";
export const TEXTURE_GARDEN_LATTICE_ROUGH =
  "/textures/Fabric036_1K-JPG_Roughness.jpg";
export const TEXTURE_GARDEN_GROUND = "/textures/Ground014_1K-JPG_Color.jpg";
export const TEXTURE_GARDEN_GROUND_NORMAL =
  "/textures/Ground014_1K-JPG_NormalGL.jpg";
export const TEXTURE_GARDEN_GROUND_ROUGH =
  "/textures/Ground014_1K-JPG_Roughness.jpg";

// Beach: sand floor, marble drift accents
export const TEXTURE_BEACH_SAND = "/textures/Ground014_1K-JPG_Color.jpg";
export const TEXTURE_BEACH_SAND_NORMAL =
  "/textures/Ground014_1K-JPG_NormalGL.jpg";
export const TEXTURE_BEACH_SAND_ROUGH =
  "/textures/Ground014_1K-JPG_Roughness.jpg";
export const TEXTURE_BEACH_DRIFT = "/textures/Marble010_1K-JPG_Color.jpg";
export const TEXTURE_BEACH_DRIFT_NORMAL =
  "/textures/Marble010_1K-JPG_NormalGL.jpg";
export const TEXTURE_BEACH_DRIFT_ROUGH =
  "/textures/Marble010_1K-JPG_Roughness.jpg";

// Arcade: facade/panel metal texture
export const TEXTURE_ARCADE_METAL = "/textures/Facade006_1K-JPG_Color.jpg";
export const TEXTURE_ARCADE_METAL_NORMAL =
  "/textures/Facade006_1K-JPG_NormalGL.jpg";
export const TEXTURE_ARCADE_METAL_ROUGH =
  "/textures/Facade006_1K-JPG_Roughness.jpg";
export const TEXTURE_ARCADE_METAL_METAL =
  "/textures/Facade006_1K-JPG_Metalness.jpg";

// Corridor stone
export const TEXTURE_CORRIDOR_STONE = "/textures/Rock025_1K-JPG_Color.jpg";
export const TEXTURE_CORRIDOR_STONE_NORMAL =
  "/textures/Rock025_1K-JPG_NormalGL.jpg";
export const TEXTURE_CORRIDOR_STONE_ROUGH =
  "/textures/Rock025_1K-JPG_Roughness.jpg";

// ── Colour helpers ────────────────────────────────────────────────────────────
export function hexCol(hex: string): THREE.Color {
  const clean = hex.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
  return new THREE.Color(clean);
}

export function hexAlpha(hex: string, alpha: number): string {
  const clean = hex.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Procedural floor tile texture ────────────────────────────────────────────
export function makeFloorTexture(
  col1: string,
  col2: string,
): THREE.CanvasTexture {
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
export function makeWallTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
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
export function makeCeilingTexture(
  baseHex: string,
  goldHex: string,
): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
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
      ctx.strokeRect(x + 8, y + 8, cw - 16, ch - 16);
      ctx.strokeRect(x + 18, y + 18, cw - 36, ch - 36);
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
export function makeStoneTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  const bw = 128,
    bh = 64;
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  for (let row = 0; row * bh < size; row++) {
    const offset = row % 2 === 0 ? 0 : bw / 2;
    for (let col = -1; col * bw < size; col++) {
      ctx.strokeRect(col * bw + offset + 2, row * bh + 2, bw - 4, bh - 4);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.fillRect(col * bw + offset + 4, row * bh + 4, bw - 8, bh - 8);
    }
  }
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
export function makeBannerTexture(
  curtainHex: string,
  goldHex: string,
): THREE.CanvasTexture {
  const w = 128,
    h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, curtainHex);
  grad.addColorStop(1, hexAlpha(curtainHex, 0.67));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, w - 24, h - 24);
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
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = goldHex;
    ctx.fillRect(i * 16 + 4, h - 22, 8, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Timeline event portrait canvas texture ───────────────────────────────────
export function makeTimelineFrameTexture(
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
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, hexAlpha(curtainHex, 0.87));
  bg.addColorStop(1, "#0a0608CC");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  ctx.strokeStyle = hexAlpha(goldHex, 0.5);
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = hexAlpha(goldHex, 0.25);
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = hexAlpha(goldHex, 0.8);
  ctx.textAlign = "center";
  ctx.fillText(year, w / 2, 56);
  ctx.strokeStyle = hexAlpha(goldHex, 0.31);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 68);
  ctx.lineTo(w - 40, 68);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, 148, 40, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(goldHex, 0.09);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(goldHex, 0.38);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "36px serif";
  ctx.fillStyle = goldHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, w / 2, 148);
  ctx.textBaseline = "alphabetic";
  ctx.strokeStyle = hexAlpha(goldHex, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(w - 50, 200);
  ctx.stroke();
  ctx.font = "300 20px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.93);
  ctx.textAlign = "center";
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
  ctx.font = "italic 13px serif";
  ctx.fillStyle = hexAlpha(textHex, 0.44);
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

// ── Photo canvas texture ─────────────────────────────────────────────────────
export function makePhotoTexture(url: string): THREE.CanvasTexture {
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

// ── Wood plank texture ─────────────────────────────────────────────────────────
export function makeWoodTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  const plankH = 64;
  for (let row = 0; row * plankH < size; row++) {
    const offset = row % 2 === 0 ? 0 : 32;
    for (let col = -1; col * 128 + offset < size; col++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.1})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(col * 128 + offset + 3, row * plankH + 3, 122, plankH - 6);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(col * 128 + offset + 5, row * plankH + 5, 118, plankH - 10);
    }
  }
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// ── Neon strip texture ────────────────────────────────────────────────────────
export function makeNeonTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0a1e";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeRect(8, 8, size - 16, size - 16);
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, size - 40, size - 40);
  ctx.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Lattice / garden wall texture ─────────────────────────────────────────────
export function makeLatticeTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// ── Sand texture ───────────────────────────────────────────────────────────────
export function makeSandTexture(baseHex: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 20000; i++) {
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

// ── Event plaque canvas texture ──────────────────────────────────────────────
export function makeEventPlaqueTexture(
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
  ctx.scale(2, 2);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hexAlpha(bgHex, 1.0));
  grad.addColorStop(1, hexAlpha(bgHex, 0.95));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.018})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  ctx.strokeStyle = hexAlpha(goldHex, 0.45);
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = hexAlpha(goldHex, 0.2);
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = hexAlpha(goldHex, 0.9);
  ctx.textAlign = "left";
  ctx.fillText(year, 38, 66);
  ctx.strokeStyle = hexAlpha(goldHex, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(38, 78);
  ctx.lineTo(w - 38, 78);
  ctx.stroke();
  ctx.font = "80px serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = hexAlpha(goldHex, 0.15);
  ctx.fillText(icon, w - 30, 20);
  ctx.textBaseline = "alphabetic";
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

// ── Preload all textures at module level ──────────────────────────────────────
// Called once when the module is first imported, warming the drei texture cache
// so useTexture() returns synchronously inside components — no mid-render suspend.
export function preloadAllRoomTextures() {
  useTexture.preload([
    // Castle
    TEXTURE_CASTLE_WALL,
    TEXTURE_CASTLE_WALL_NORMAL,
    TEXTURE_CASTLE_WALL_ROUGH,
    TEXTURE_CASTLE_FLOOR,
    TEXTURE_CASTLE_FLOOR_NORMAL,
    TEXTURE_CASTLE_FLOOR_ROUGH,
    TEXTURE_CASTLE_CEILING,
    TEXTURE_CASTLE_CEILING_NORMAL,
    TEXTURE_CASTLE_CEILING_ROUGH,
    TEXTURE_CASTLE_BANNER,
    // Farm
    TEXTURE_FARM_WOOD,
    TEXTURE_FARM_WOOD_NORMAL,
    TEXTURE_FARM_WOOD_ROUGH,
    // Garden
    TEXTURE_GARDEN_LATTICE,
    TEXTURE_GARDEN_LATTICE_NORMAL,
    TEXTURE_GARDEN_LATTICE_ROUGH,
    TEXTURE_GARDEN_GROUND,
    TEXTURE_GARDEN_GROUND_NORMAL,
    TEXTURE_GARDEN_GROUND_ROUGH,
    // Beach
    TEXTURE_BEACH_SAND,
    TEXTURE_BEACH_SAND_NORMAL,
    TEXTURE_BEACH_SAND_ROUGH,
    TEXTURE_BEACH_DRIFT,
    TEXTURE_BEACH_DRIFT_NORMAL,
    TEXTURE_BEACH_DRIFT_ROUGH,
    // Arcade
    TEXTURE_ARCADE_METAL,
    TEXTURE_ARCADE_METAL_NORMAL,
    TEXTURE_ARCADE_METAL_ROUGH,
    TEXTURE_ARCADE_METAL_METAL,
    "/textures/Facade006_1K-JPG_Color.jpg",
    // Corridor stone (shared with castle wall)
    TEXTURE_CORRIDOR_STONE,
    TEXTURE_CORRIDOR_STONE_NORMAL,
    TEXTURE_CORRIDOR_STONE_ROUGH,
  ]);
}
