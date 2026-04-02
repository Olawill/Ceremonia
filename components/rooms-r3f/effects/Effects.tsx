"use client";

import { useThree } from "@react-three/fiber";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useState } from "react";

export function Effects() {
  const gl = useThree((s) => s.gl);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX = 60; // max ~1 second of polling

    const check = () => {
      if (cancelled) return;
      attempts++;
      try {
        const ctx = gl.getContext();
        if (ctx?.getContextAttributes() !== null) {
          setReady(true);
          return;
        }
      } catch {
        // context not yet ready
      }
      if (attempts < MAX) {
        setTimeout(check, 16);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [gl]);

  if (!ready) return null;

  return (
    <EffectComposer>
      {/* Vignette for layered 3D postcard depth feel */}
      <Vignette
        offset={0.4}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
