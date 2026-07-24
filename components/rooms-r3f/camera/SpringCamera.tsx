"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  CAM_Y,
  CAM_Z_INSIDE,
  TOTAL_SEGMENT,
} from "@/components/rooms-r3f/constants";
import { useRoomsStore } from "@/components/rooms-r3f/store";
import { useThree } from "@react-three/fiber";

interface SpringCameraProps {
  activeRoomIndex: number;
  targetRoom: number;
  isMoving: boolean;
  peekTarget?: number;
}

function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return current + (target - current) * Math.exp(-lambda * dt);
}

export function SpringCamera({
  targetRoom,
  isMoving,
  peekTarget = 0,
}: SpringCameraProps) {
  const { camera } = useThree();
  const setArrived = useRoomsStore((s) => s.setArrived);

  const targetIndexRef = useRef(targetRoom);
  const currentZRef = useRef(CAM_Z_INSIDE); // start inside room 0
  const fovRef = useRef(65);
  const hasArrivedRef = useRef(false);
  const lookAtRef = useRef(new THREE.Vector3(0, 0, CAM_Z_INSIDE - 8));
  const bobPhaseRef = useRef(0);
  const bobAmountRef = useRef(0);

  const POS_LAMBDA = 3.5;
  const LOOK_LAMBDA = 4;
  const FOV_LAMBDA = 2.5;

  // Footstep-style head bob — a subtle vertical + roll sway while walking
  // between rooms, damped out the instant the camera settles.
  const BOB_FREQUENCY = 9; // steps per second, roughly a brisk walking cadence
  const BOB_AMPLITUDE = 0.028; // world units of vertical travel

  useEffect(() => {
    if (targetRoom !== targetIndexRef.current) {
      targetIndexRef.current = targetRoom;
      hasArrivedRef.current = false;
    }
  }, [targetRoom]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    const zoomOffset = useRoomsStore.getState().zoomOffset;
    const targetZ =
      -targetIndexRef.current * TOTAL_SEGMENT + CAM_Z_INSIDE - zoomOffset;

    currentZRef.current = damp(
      currentZRef.current,
      targetZ,
      // isMoving ? POS_LAMBDA : POS_LAMBDA * 4,
      POS_LAMBDA,
      dt,
    );

    lookAtRef.current.x = damp(
      lookAtRef.current.x,
      peekTarget,
      LOOK_LAMBDA,
      dt,
    );
    lookAtRef.current.z = damp(
      lookAtRef.current.z,
      targetZ - 8,
      LOOK_LAMBDA,
      dt,
    );

    // Footstep bob — fades in while walking between rooms, fades out on arrival
    bobAmountRef.current = damp(bobAmountRef.current, isMoving ? 1 : 0, 6, dt);
    bobPhaseRef.current += dt * BOB_FREQUENCY * Math.PI * 2;
    const bobY =
      Math.sin(bobPhaseRef.current) * BOB_AMPLITUDE * bobAmountRef.current;
    const bobRoll =
      Math.sin(bobPhaseRef.current * 0.5) * 0.01 * bobAmountRef.current;

    camera.position.set(
      peekTarget * 0.1,
      CAM_Y + bobY,
      currentZRef.current,
    );
    camera.lookAt(lookAtRef.current);
    camera.rotation.z += bobRoll;

    const targetFov = isMoving ? 78 : zoomOffset !== 0 ? 52 : 65;
    fovRef.current = damp(fovRef.current, targetFov, FOV_LAMBDA, dt);
    (camera as THREE.PerspectiveCamera).fov = fovRef.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    if (isMoving && !hasArrivedRef.current) {
      if (Math.abs(currentZRef.current - targetZ) < 0.12) {
        hasArrivedRef.current = true;
        currentZRef.current = targetZ;
        setArrived();
      }
    }
  });

  return null;
}
