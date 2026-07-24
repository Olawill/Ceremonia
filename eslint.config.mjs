import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
    ],
  },
  {
    // react-three-fiber's render loop (useFrame) is inherently imperative —
    // mutating camera/mesh/material refs every frame is the correct r3f
    // pattern, not a bug. The React Compiler purity rules assume components
    // never mutate hook-returned values, which this codebase's 3D rooms
    // violate by design, so they're scoped off for this directory only.
    files: ["components/rooms-r3f/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-render": "off",
    },
  },
];

export default eslintConfig;
