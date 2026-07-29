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
  {
    // react-hook-form's register()/handleSubmit()/watch() APIs are built on
    // refs and mutable subscriptions under the hood — a documented
    // incompatibility with the React Compiler's purity/memoization
    // assumptions (the "incompatible library" diagnostic names react-hook-form
    // directly). Converting one render-body watch() call to useWatch() just
    // pushes the compiler's analysis into the next RHF internal (e.g.
    // handleSubmit's own ref access), so these files are scoped off rather
    // than rewritten around a third-party API the compiler doesn't support.
    files: [
      "components/sections/RSVP.tsx",
      "components/rooms/panels/RSVPPanel.tsx",
      "components/dashboard/editor/RSVPSettings.tsx",
      "components/dashboard/editor/TimelineEditor.tsx",
      "components/dashboard/editor/ContentEditor.tsx",
      "components/dashboard/editor/VenueEditor.tsx",
      "components/dashboard/editor/MenuEditor.tsx",
      "components/dashboard/editor/NewEventDialog.tsx",
    ],
    rules: {
      "react-hooks/incompatible-library": "off",
      "react-hooks/refs": "off",
    },
  },
];

export default eslintConfig;
