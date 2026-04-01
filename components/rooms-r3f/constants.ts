// ── Room geometry constants ────────────────────────────────────────────────────
export const ROOM_LENGTH = 14;
export const ROOM_WIDTH = 9;
export const ROOM_HEIGHT = 4.5;

// ── Camera constants ──────────────────────────────────────────────────────────
export const CAM_Y = 0.0;
export const CAM_Z_OFFSET = 4.8;
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

// ── Travel ease (for legacy imperative engine) ───────────────────────────────
export const TRAVEL_EASE = 0.072;
