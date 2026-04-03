// ── Room geometry constants ────────────────────────────────────────────────────
export const ROOM_LENGTH = 14;
export const ROOM_WIDTH = 9;
export const ROOM_HEIGHT = 4.5;

// ── Camera constants ──────────────────────────────────────────────────────────
export const CAM_Y = 0.4;
// export const CAM_Z_OFFSET = 4.8;
// export const CAM_Z_OFFSET = -3.0;
export const CAM_SPRING_STIFFNESS = 180;
export const CAM_SPRING_DAMPING = 22;

// ── Corridor constants ───────────────────────────────────────────────────────
export const CORRIDOR_LENGTH = 3.5;
export const CORRIDOR_WIDTH = 2.8;
export const CORRIDOR_HEIGHT = 3.2;

// ── Combined segment ─────────────────────────────────────────────────────────
export const TOTAL_SEGMENT = ROOM_LENGTH + CORRIDOR_LENGTH;

// ── Particle constants ────────────────────────────────────────────────────────
export const DUST_COUNT_FULL = 320;
export const DUST_COUNT_PREVIEW = 80;

// Camera outside a room — standing in front of the door, facing it
export const CAM_Z_OUTSIDE = 3.5; // positive = in front of room front face

// Camera inside a room — standing inside, looking toward back wall
export const CAM_Z_INSIDE = -2.5; // negative = past the front face, inside

// ── Travel ease (for legacy imperative engine) ───────────────────────────────
export const TRAVEL_EASE = 0.072;

import type { FeatureMode } from "@/types/event";

export interface RoomAsset {
  model: string;
  texture: string;
  /** true once the .glb and baked .jpg exist in /public */
  ready: boolean;
}

export const ROOM_ASSETS: Record<FeatureMode, RoomAsset> = {
  castle: {
    model: "/models/room-castle.glb",
    texture: "/textures/baked/room-castle-baked.jpg",
    ready: false, // flip to true once Blender asset is exported
  },
  farm: {
    model: "/models/room-farm.glb",
    texture: "/textures/baked/room-farm-baked.jpg",
    ready: false,
  },
  arcade: {
    model: "/models/room-arcade.glb",
    texture: "/textures/baked/room-arcade-baked.jpg",
    ready: false,
  },
  garden: {
    model: "/models/room-garden.glb",
    texture: "/textures/baked/room-garden-baked.jpg",
    ready: false,
  },
  beach: {
    model: "/models/room-beach.glb",
    texture: "/textures/baked/room-beach-baked.jpg",
    ready: false,
  },
};

export const CORRIDOR_ASSET = {
  model: "/models/corridor.glb",
  texture: "/textures/baked/corridor-baked.jpg",
  ready: false,
};
