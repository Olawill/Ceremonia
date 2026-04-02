"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  CAM_Y,
  CAM_Z_INSIDE,
  CAM_Z_OUTSIDE,
  TOTAL_SEGMENT,
} from "@/components/rooms-r3f/constants";
import { useRoomsStore } from "@/components/rooms-r3f/store";

interface SpringCameraProps {
  activeRoomIndex: number;
  targetRoom: number;
  isMoving: boolean;
  peekX?: number;
  peekTarget?: number;
}

// THREE.MathUtils.damp is a critically-damped exponential ease:
// newValue = current + (target - current) * Math.exp(-lambda * deltaTime)
// No overshoot, no oscillation — smooth and guaranteed to converge.
function damp(
  current: number,
  target: number,
  lambda: number,
  deltaTime: number,
): number {
  return current + (target - current) * Math.exp(-lambda * deltaTime);
}

export function SpringCamera({
  activeRoomIndex,
  targetRoom,
  isMoving,
  peekX = 0,
  peekTarget = 0,
}: SpringCameraProps) {
  const { camera } = useThree();
  const setArrived = useRoomsStore((s) => s.setArrived);

  // Current logical Z position (before offset) — starts at camera's initial z
  const currentZRef = useRef(camera.position.z - CAM_Z_INSIDE);
  const fovRef = useRef(65);
  const hasArrivedRef = useRef(false);

  // Target index — changes trigger a new target position
  const targetIndexRef = useRef(activeRoomIndex);

  const roomPhaseRef = useRef<"outside" | "inside">("outside");

  // Smoothness constants (higher = faster snap)
  const POS_LAMBDA = 4; // Position damping — higher = snappier, no overshoot
  const LOOK_LAMBDA = 6; // LookAt damping — slightly higher for responsive feel
  const FOV_LAMBDA = 3; // FOV animation — slower for cinematic feel

  // Keep target index in sync
  useEffect(() => {
    if (targetRoom !== targetIndexRef.current) {
      targetIndexRef.current = targetRoom;
      hasArrivedRef.current = false;
    }
  }, [targetRoom]);

  const roomPhase = useRoomsStore((s) => s.roomPhase);
  useEffect(() => {
    roomPhaseRef.current = roomPhase;
    hasArrivedRef.current = false; // retrigger arrival detection on phase change
  }, [roomPhase]);

  // Initialise Z from camera position on first frame
  const initRef = useRef(false);
  const lookAtPosRef = useRef(new THREE.Vector3(peekX, 0, 0));

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1); // cap to prevent huge jumps on tab regain

    // Initialise once camera is available
    if (!initRef.current) {
      currentZRef.current = camera.position.z - CAM_Z_INSIDE;
      initRef.current = true;
    }

    // const targetZ = -targetIndexRef.current * TOTAL_SEGMENT;

    const roomOriginZ = -targetIndexRef.current * TOTAL_SEGMENT;
    // Outside = in front of the room's front face (positive offset)
    // Inside  = past the front face, looking toward back wall (negative offset)
    const phaseOffset =
      roomPhaseRef.current === "outside" ? CAM_Z_OUTSIDE : CAM_Z_INSIDE;
    const targetZ = roomOriginZ + phaseOffset;

    // Smooth exponential ease toward target — never overshoots
    currentZRef.current = damp(
      currentZRef.current,
      targetZ,
      isMoving ? POS_LAMBDA : POS_LAMBDA * 4,
      clampedDelta,
    );

    // Smooth lookAt target
    const lookX = peekX + peekTarget;
    lookAtPosRef.current.x = damp(
      lookAtPosRef.current.x,
      lookX,
      LOOK_LAMBDA,
      clampedDelta,
    );

    const lookAhead =
      roomPhaseRef.current === "outside"
        ? roomOriginZ - 2 // look at the door face when outside
        : roomOriginZ + phaseOffset - 8; // look deep into the room when inside

    lookAtPosRef.current.z = damp(
      lookAtPosRef.current.z,
      lookAhead,
      LOOK_LAMBDA,
      clampedDelta,
    );

    // Apply camera position
    camera.position.set(peekX, CAM_Y, currentZRef.current);
    camera.lookAt(lookAtPosRef.current);

    // Cinematic FOV — wider when moving, narrower at rest
    const targetFov = isMoving ? 78 : 65;
    fovRef.current = damp(fovRef.current, targetFov, FOV_LAMBDA, clampedDelta);
    (camera as THREE.PerspectiveCamera).fov = fovRef.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // Signal arrival when camera has settled at target
    if (isMoving && !hasArrivedRef.current) {
      const dist = Math.abs(currentZRef.current - targetZ);
      // Close enough — damp() guarantees we'll reach it
      if (dist < 0.05) {
        hasArrivedRef.current = true;
        currentZRef.current = targetZ; // snap to exact target
        setArrived();
      }
    }
  });

  return null;
}
