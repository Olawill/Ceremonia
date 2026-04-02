"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface BakedCorridorProps {
  position?: [number, number, number];
}

export function BakedCorridor({ position = [0, 0, 0] }: BakedCorridorProps) {
  const { scene } = useGLTF("/models/corridor.glb");
  const bakedTex = useTexture("/textures/baked/corridor-baked.jpg");

  useMemo(() => {
    bakedTex.flipY = false;
    bakedTex.colorSpace = THREE.SRGBColorSpace;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          map: bakedTex,
        });
      }
    });
  }, [scene, bakedTex]);

  return <primitive object={scene} position={position} dispose={null} />;
}
