"use client";

import { useThree } from "@react-three/fiber";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useState } from "react";

export function Effects() {
  const gl = useThree((s) => s.gl);
  const [ready, setReady] = useState(false);

  const [contextConfirmed, setContextConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX = 40; // max ~1 second of polling

    const markReady = (withContext: boolean) => {
      if (cancelled) return;
      setContextConfirmed(withContext);
      setReady(true);
    };

    const check = () => {
      if (cancelled) return;
      attempts++;
      try {
        const ctx = gl.getContext();
        const attrs = ctx?.getContextAttributes();
        if (attrs !== null && attrs !== undefined) {
          markReady(true);
          return;
        }
      } catch {
        // context not yet ready
      }

      if (attempts < MAX) {
        setTimeout(check, 50);
      } else {
        // Context never confirmed — signal ready anyway so the
        // loading overlay doesn't block forever. Skip postprocessing.
        markReady(false);
      }
    };

    // Wait two frames before first attempt — context needs time to initialise
    setTimeout(check, 100);
    return () => {
      cancelled = true;
    };
  }, [gl]);

  if (!ready || !contextConfirmed) return null;

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
