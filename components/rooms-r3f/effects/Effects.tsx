"use client";

import { useThree } from "@react-three/fiber";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useState } from "react";

export function Effects() {
  const gl = useThree((s) => s.gl);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer mounting EffectComposer until the WebGL context attributes are
    // confirmed readable. In popup windows (undocked preview) the context
    // initialises asynchronously and getContextAttributes() returns null on
    // the first frame, causing postprocessing's addPass to crash.
    const ctx = gl.getContext();
    if (ctx && ctx.getContextAttributes() !== null) {
      setReady(true);
      return;
    }
    // Poll until the context is ready (resolves within 1-2 frames normally)
    const id = setInterval(() => {
      const c = gl.getContext();
      if (c && c.getContextAttributes() !== null) {
        setReady(true);
        clearInterval(id);
      }
    }, 16);
    return () => clearInterval(id);
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
