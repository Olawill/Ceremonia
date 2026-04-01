"use client";

import { EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface EffectsProps {}

export function Effects(_props: EffectsProps) {
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
