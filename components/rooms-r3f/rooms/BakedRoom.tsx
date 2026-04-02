"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface BakedRoomProps {
  modelPath: string;
  texturePath: string;
  position?: [number, number, number];
}

export function BakedRoom({
  modelPath,
  texturePath,
  position = [0, 0, 0],
}: BakedRoomProps) {
  const { scene } = useGLTF(modelPath);
  const bakedTex = useTexture(texturePath);

  useMemo(() => {
    bakedTex.flipY = false; // GLTF UV convention — opposite of Three.js default
    bakedTex.colorSpace = THREE.SRGBColorSpace;

    // Log bounding box in dev so you can verify the model scale
    if (process.env.NODE_ENV === "development") {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      console.log("[BakedRoom] model size:", size);
    }

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

// Preload hints — called at module level to warm the cache before the room renders
export function preloadBakedRoom(modelPath: string, texturePath: string) {
  useGLTF.preload(modelPath);
}
