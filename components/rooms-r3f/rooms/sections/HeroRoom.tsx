// "use client";

// import { Html, useTexture } from "@react-three/drei";
// import { useFrame } from "@react-three/fiber";
// import { useEffect, useRef, useState } from "react";
// import * as THREE from "three";

// import {
//   ROOM_HEIGHT,
//   ROOM_LENGTH,
//   ROOM_WIDTH,
// } from "@/components/rooms-r3f/constants";
// import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
// import type { EventType } from "@/types/event";

// interface HeroRoomProps {
//   featureMode: FeatureMode;
//   theme: RoomTheme;
//   bride?: string;
//   groom?: string;
//   tagLine?: string;
//   topLabel?: string;
//   eventType?: EventType;
//   heroPhotoUrl?: string;
// }

// // ── Petal / particle system ───────────────────────────────────────────────────
// // Instanced geometry — one draw call for all particles
// function AmbientParticles({
//   featureMode,
//   accentColor,
// }: {
//   featureMode: FeatureMode;
//   accentColor: string;
// }) {
//   const meshRef = useRef<THREE.InstancedMesh>(null);
//   const COUNT = 60;

//   // Each particle: [x, y, z, phase, speed, rotSpeed]
//   const data = useRef(
//     Array.from({ length: COUNT }, () => ({
//       x: (Math.random() - 0.5) * ROOM_WIDTH * 0.9,
//       y: (Math.random() - 0.5) * ROOM_HEIGHT * 0.8,
//       z: -(Math.random() * ROOM_LENGTH),
//       phase: Math.random() * Math.PI * 2,
//       speed: 0.008 + Math.random() * 0.012,
//       rotSpeed: (Math.random() - 0.5) * 0.02,
//       rot: Math.random() * Math.PI,
//     })),
//   );

//   const dummy = useRef(new THREE.Object3D());

//   useFrame(({ clock }) => {
//     const mesh = meshRef.current;
//     if (!mesh) return;
//     const t = clock.getElapsedTime();
//     data.current.forEach((p, i) => {
//       // Drift upward slowly, sway side to side
//       p.y += p.speed;
//       p.rot += p.rotSpeed;
//       if (p.y > ROOM_HEIGHT / 2) p.y = -ROOM_HEIGHT / 2;
//       const swayX = Math.sin(t * 0.4 + p.phase) * 0.3;
//       dummy.current.position.set(p.x + swayX, p.y, p.z);
//       dummy.current.rotation.set(p.rot, p.rot * 0.5, p.rot * 0.3);
//       dummy.current.scale.setScalar(0.04 + Math.sin(p.phase + t) * 0.01);
//       dummy.current.updateMatrix();
//       mesh.setMatrixAt(i, dummy.current.matrix);
//     });
//     mesh.instanceMatrix.needsUpdate = true;
//   });

//   // Shape depends on featureMode
//   const geo =
//     featureMode === "beach"
//       ? new THREE.SphereGeometry(1, 4, 4) // bubbles
//       : featureMode === "arcade"
//         ? new THREE.BoxGeometry(1, 1, 0.1) // confetti squares
//         : featureMode === "garden"
//           ? new THREE.CircleGeometry(1, 5) // flower petals
//           : new THREE.PlaneGeometry(1, 1.4); // rose petals (castle/farm)

//   const color =
//     featureMode === "arcade"
//       ? accentColor
//       : featureMode === "beach"
//         ? "#aaddff"
//         : featureMode === "garden"
//           ? "#ffbbcc"
//           : "#cc4466";

//   return (
//     <instancedMesh ref={meshRef} args={[geo, undefined, COUNT]}>
//       <meshStandardMaterial
//         color={color}
//         transparent
//         opacity={featureMode === "beach" ? 0.3 : 0.55}
//         emissive={featureMode === "arcade" ? accentColor : undefined}
//         emissiveIntensity={featureMode === "arcade" ? 0.5 : 0}
//         side={THREE.DoubleSide}
//       />
//     </instancedMesh>
//   );
// }

// // ── Monogram medallion ────────────────────────────────────────────────────────
// function MonogramMedallion({
//   h1,
//   h2,
//   accentColor,
//   featureMode,
//   position,
// }: {
//   h1: string;
//   h2: string;
//   accentColor: string;
//   featureMode: FeatureMode;
//   position: [number, number, number];
// }) {
//   const groupRef = useRef<THREE.Group>(null);
//   useFrame(({ clock }) => {
//     if (groupRef.current) {
//       groupRef.current.rotation.z =
//         Math.sin(clock.getElapsedTime() * 0.3) * 0.03;
//     }
//   });

//   const initials = h2 ? `${h1.charAt(0)} & ${h2.charAt(0)}` : h1.charAt(0);
//   const medalColor =
//     featureMode === "arcade"
//       ? "#0a0a1e"
//       : featureMode === "beach"
//         ? "#c4a35a"
//         : featureMode === "garden"
//           ? "#3d5636"
//           : featureMode === "farm"
//             ? "#6b5340"
//             : "#3a2510";

//   return (
//     <group ref={groupRef} position={position}>
//       {/* Outer decorative ring */}
//       <mesh>
//         <torusGeometry args={[0.72, 0.045, 8, 48]} />
//         <meshStandardMaterial
//           color={accentColor}
//           roughness={0.2}
//           metalness={0.9}
//         />
//       </mesh>
//       {/* Inner ring */}
//       <mesh>
//         <torusGeometry args={[0.55, 0.025, 8, 48]} />
//         <meshStandardMaterial
//           color={accentColor}
//           roughness={0.3}
//           metalness={0.7}
//         />
//       </mesh>
//       {/* Medallion face */}
//       <mesh position={[0, 0, 0.02]}>
//         <circleGeometry args={[0.52, 48]} />
//         <meshStandardMaterial color={medalColor} roughness={0.6} />
//       </mesh>
//       {/* Radial spokes */}
//       {Array.from({ length: 12 }).map((_, i) => {
//         const a = (i / 12) * Math.PI * 2;
//         return (
//           <mesh
//             key={i}
//             position={[Math.cos(a) * 0.63, Math.sin(a) * 0.63, 0.01]}
//             rotation={[0, 0, a]}
//           >
//             <boxGeometry args={[0.06, 0.02, 0.01]} />
//             <meshStandardMaterial
//               color={accentColor}
//               roughness={0.2}
//               metalness={0.8}
//             />
//           </mesh>
//         );
//       })}
//       {/* Initials via Html — crisp at any resolution */}
//       <Html position={[0, 0, 0.05]} center transform distanceFactor={3}>
//         <div
//           style={{
//             fontFamily: "serif",
//             fontSize: 28,
//             color: accentColor,
//             textShadow: `0 0 12px ${accentColor}80`,
//             letterSpacing: "0.05em",
//             userSelect: "none",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {initials}
//         </div>
//       </Html>
//     </group>
//   );
// }

// // ── Stone/styled plaque ───────────────────────────────────────────────────────
// function WallPlaque({
//   text,
//   subText,
//   width,
//   height,
//   position,
//   rotation,
//   featureMode,
//   accentColor,
// }: {
//   text: string;
//   subText?: string;
//   width: number;
//   height: number;
//   position: [number, number, number];
//   rotation: [number, number, number];
//   featureMode: FeatureMode;
//   accentColor: string;
// }) {
//   const plaqueColor =
//     featureMode === "arcade"
//       ? "#0a0a2e"
//       : featureMode === "beach"
//         ? "#d4b483"
//         : featureMode === "garden"
//           ? "#4a5a30"
//           : featureMode === "farm"
//             ? "#8b7355"
//             : "#2a1e14";

//   return (
//     <group position={position} rotation={rotation as unknown as THREE.Euler}>
//       {/* Plaque backing */}
//       <mesh>
//         <boxGeometry args={[width, height, 0.06]} />
//         <meshStandardMaterial color={plaqueColor} roughness={0.75} />
//       </mesh>
//       {/* Gold border frame */}
//       <mesh position={[0, 0, 0.035]}>
//         <boxGeometry args={[width + 0.06, height + 0.06, 0.01]} />
//         <meshStandardMaterial
//           color={accentColor}
//           roughness={0.2}
//           metalness={0.85}
//         />
//       </mesh>
//       <mesh position={[0, 0, 0.04]}>
//         <boxGeometry args={[width - 0.04, height - 0.04, 0.01]} />
//         <meshStandardMaterial color={plaqueColor} roughness={0.75} />
//       </mesh>
//       {/* Text via Html */}
//       <Html
//         position={[0, subText ? 0.08 : 0, 0.07]}
//         center
//         transform
//         distanceFactor={4}
//       >
//         <div
//           style={{
//             width: `${width * 80}px`,
//             textAlign: "center",
//             fontFamily: featureMode === "arcade" ? "monospace" : "serif",
//             fontSize: featureMode === "arcade" ? 11 : 13,
//             color: accentColor,
//             letterSpacing: "0.15em",
//             textTransform: "uppercase",
//             userSelect: "none",
//             lineHeight: 1.4,
//             textShadow:
//               featureMode === "arcade" ? `0 0 8px ${accentColor}` : "none",
//           }}
//         >
//           {text}
//         </div>
//       </Html>
//       {subText && (
//         <Html position={[0, -0.1, 0.07]} center transform distanceFactor={4}>
//           <div
//             style={{
//               width: `${width * 80}px`,
//               textAlign: "center",
//               fontFamily: "serif",
//               fontStyle: "italic",
//               fontSize: 10,
//               color: `${accentColor}AA`,
//               letterSpacing: "0.08em",
//               userSelect: "none",
//             }}
//           >
//             {subText}
//           </div>
//         </Html>
//       )}
//     </group>
//   );
// }

// function HeroPhotoBackdrop({
//   url,
//   width,
//   height,
// }: {
//   url: string;
//   width: number;
//   height: number;
// }) {
//   const texture = useTexture(url);
//   return (
//     <mesh position={[0, 0, -0.02]}>
//       <planeGeometry args={[width, height]} />
//       <meshStandardMaterial
//         map={texture}
//         roughness={1}
//         transparent
//         opacity={0.55}
//       />
//     </mesh>
//   );
// }

// // ── Main banner on back wall ──────────────────────────────────────────────────
// function HeroBanner({
//   bride,
//   groom,
//   topLabel,
//   featureMode,
//   theme,
//   heroPhotoUrl,
// }: {
//   bride: string;
//   groom?: string;
//   topLabel?: string;
//   featureMode: FeatureMode;
//   theme: RoomTheme;
//   heroPhotoUrl?: string;
// }) {
//   // Banner material adapts to featureMode
//   const bannerColor =
//     featureMode === "arcade"
//       ? "#0a0a2e"
//       : featureMode === "beach"
//         ? "#f5e6d0"
//         : featureMode === "garden"
//           ? "#2a3a1a"
//           : featureMode === "farm"
//             ? "#8b3a2a"
//             : theme.curtain;

//   const bannerW = ROOM_WIDTH * 0.72;
//   const bannerH = ROOM_HEIGHT * 0.6;

//   return (
//     <group position={[0, 0.2, -ROOM_LENGTH + 0.08]}>
//       {/* Hero photo backdrop — shown behind banner when provided */}
//       {heroPhotoUrl && (
//         <HeroPhotoBackdrop
//           url={heroPhotoUrl}
//           width={ROOM_WIDTH}
//           height={ROOM_HEIGHT}
//         />
//       )}

//       {/* Banner fabric — narrower when photo shows behind it */}
//       <mesh>
//         <planeGeometry
//           args={[heroPhotoUrl ? bannerW * 0.55 : bannerW, bannerH]}
//         />
//         <meshStandardMaterial
//           color={bannerColor}
//           roughness={0.85}
//           side={THREE.DoubleSide}
//           transparent={!!heroPhotoUrl}
//           opacity={heroPhotoUrl ? 0.88 : 1}
//         />
//       </mesh>

//       {/* Top hanging rod */}
//       <mesh
//         position={[0, bannerH / 2 + 0.06, 0.05]}
//         rotation={[0, 0, Math.PI / 2]}
//       >
//         <cylinderGeometry args={[0.04, 0.04, bannerW + 0.3, 8]} />
//         <meshStandardMaterial
//           color={theme.accent}
//           roughness={0.2}
//           metalness={0.85}
//         />
//       </mesh>

//       {/* Rod finials */}
//       {([-1, 1] as const).map((side, i) => (
//         <mesh
//           key={i}
//           position={[side * (bannerW / 2 + 0.18), bannerH / 2 + 0.06, 0.05]}
//         >
//           <sphereGeometry args={[0.09, 8, 8]} />
//           <meshStandardMaterial
//             color={theme.accent}
//             roughness={0.15}
//             metalness={0.9}
//           />
//         </mesh>
//       ))}

//       {/* Rope fringe at bottom */}
//       {Array.from({ length: 14 }).map((_, i) => (
//         <mesh
//           key={i}
//           position={[
//             -bannerW / 2 + 0.28 + i * ((bannerW - 0.3) / 13),
//             -bannerH / 2 - 0.12,
//             0.02,
//           ]}
//         >
//           <cylinderGeometry args={[0.012, 0.008, 0.22, 5]} />
//           <meshStandardMaterial
//             color={theme.accent}
//             roughness={0.4}
//             metalness={0.5}
//           />
//         </mesh>
//       ))}

//       {/* Monogram medallion — centred upper third */}
//       <MonogramMedallion
//         h1={bride}
//         h2={groom ?? ""}
//         accentColor={theme.accent}
//         featureMode={featureMode}
//         position={[0, bannerH * 0.22, 0.08]}
//       />

//       {/* Names text — lower two thirds */}
//       <Html
//         position={[0, -bannerH * 0.08, 0.08]}
//         center
//         transform
//         distanceFactor={5.5}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             userSelect: "none",
//             pointerEvents: "none",
//           }}
//         >
//           {topLabel && (
//             <div
//               style={{
//                 fontFamily: "var(--font-label, sans-serif)",
//                 fontSize: 10,
//                 letterSpacing: "0.55em",
//                 textTransform: "uppercase",
//                 color: `${theme.accent}CC`,
//                 marginBottom: 6,
//               }}
//             >
//               {topLabel}
//             </div>
//           )}
//           <div
//             style={{
//               fontFamily: "serif",
//               fontSize: featureMode === "arcade" ? 32 : 36,
//               fontWeight: 500,
//               color:
//                 featureMode === "beach"
//                   ? "#3a2510"
//                   : featureMode === "garden"
//                     ? "#f5ead0"
//                     : "#F5F0E8",
//               letterSpacing: "0.06em",
//               lineHeight: 1.1,
//               textShadow: "0 2px 12px rgba(0,0,0,0.5)",
//             }}
//           >
//             {bride}
//             {groom && groom.trim().length > 0 && (
//               <>
//                 <div
//                   style={{
//                     fontSize: 18,
//                     color: theme.accent,
//                     marginTop: 2,
//                     marginBottom: 2,
//                     textShadow: `0 0 16px ${theme.accent}60`,
//                   }}
//                 >
//                   &
//                 </div>
//                 {groom}
//               </>
//             )}
//           </div>
//         </div>
//       </Html>
//     </group>
//   );
// }

// // ── Floor compass rose ────────────────────────────────────────────────────────
// function FloorCompassRose({
//   featureMode,
//   accentColor,
//   navPrompt,
// }: {
//   featureMode: FeatureMode;
//   accentColor: string;
//   navPrompt: string;
// }) {
//   const ringRef = useRef<THREE.Mesh>(null);
//   useFrame(({ clock }) => {
//     if (ringRef.current) {
//       ringRef.current.rotation.z = clock.getElapsedTime() * 0.08;
//     }
//   });

//   return (
//     <group
//       rotation={[-Math.PI / 2, 0, 0]}
//       position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH / 2]}
//     >
//       {/* Outer ring — slowly rotates */}
//       <mesh ref={ringRef}>
//         <torusGeometry args={[1.8, 0.03, 8, 64]} />
//         <meshStandardMaterial
//           color={accentColor}
//           roughness={0.2}
//           metalness={0.8}
//           emissive={accentColor}
//           emissiveIntensity={0.15}
//         />
//       </mesh>
//       {/* Inner filled circle */}
//       <mesh position={[0, 0, -0.005]}>
//         <circleGeometry args={[1.75, 64]} />
//         <meshStandardMaterial
//           color={featureMode === "arcade" ? "#0a0a1e" : "#1a1008"}
//           roughness={0.9}
//           transparent
//           opacity={0.45}
//         />
//       </mesh>
//       {/* Cardinal direction markers */}
//       {["N", "E", "S", "W"].map((dir, i) => {
//         const a = (i / 4) * Math.PI * 2;
//         return (
//           <mesh
//             key={dir}
//             position={[Math.sin(a) * 1.4, Math.cos(a) * 1.4, 0.01]}
//           >
//             <circleGeometry args={[0.06, 8]} />
//             <meshStandardMaterial
//               color={accentColor}
//               roughness={0.2}
//               metalness={0.8}
//             />
//           </mesh>
//         );
//       })}
//       {/* Cross arms */}
//       {[0, Math.PI / 2].map((rot, i) => (
//         <mesh key={i} rotation={[0, 0, rot]}>
//           <planeGeometry args={[3.4, 0.02]} />
//           <meshStandardMaterial
//             color={accentColor}
//             roughness={0.2}
//             metalness={0.7}
//             transparent
//             opacity={0.5}
//           />
//         </mesh>
//       ))}
//       {/* Nav prompt text */}
//       <Html position={[0, 0, 0.02]} center transform distanceFactor={3}>
//         <div
//           style={{
//             fontFamily: "var(--font-label, sans-serif)",
//             fontSize: 8,
//             letterSpacing: "0.5em",
//             textTransform: "uppercase",
//             color: accentColor,
//             opacity: 0.7,
//             userSelect: "none",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {navPrompt}
//         </div>
//       </Html>
//     </group>
//   );
// }

// // ── Tagline plaque on right wall ───────────────────────────────────────────────
// // ── Date/event plaque on left wall ────────────────────────────────────────────

// // ── Main export ───────────────────────────────────────────────────────────────
// export function HeroRoom({
//   featureMode,
//   theme,
//   bride = "Taiwo",
//   groom,
//   tagLine,
//   topLabel,
//   eventType = "wedding",
//   heroPhotoUrl,
// }: HeroRoomProps) {
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const navCopy: Record<string, string> = {
//     wedding: "Navigate to begin →",
//     birthday: "Navigate to celebrate →",
//     baby_shower: "Navigate to meet the little one →",
//     anniversary: "Navigate to celebrate →",
//     graduation: "Navigate to the ceremony →",
//     other: "Navigate to continue →",
//   };
//   const navPrompt = navCopy[eventType] ?? navCopy.other;

//   if (!mounted) return null;

//   return (
//     <group>
//       {/* Ambient particles */}
//       <AmbientParticles featureMode={featureMode} accentColor={theme.accent} />

//       {/* Back wall — main banner with names */}
//       <HeroBanner
//         bride={bride}
//         groom={groom}
//         topLabel={topLabel}
//         featureMode={featureMode}
//         theme={theme}
//         heroPhotoUrl={heroPhotoUrl}
//       />

//       {/* Left wall — event label plaque */}
//       <WallPlaque
//         text={topLabel ?? "Together in Love"}
//         subText={eventType.replace("_", " ")}
//         width={2.2}
//         height={0.65}
//         position={[-ROOM_WIDTH / 2 + 0.08, 0.5, -ROOM_LENGTH / 2]}
//         rotation={[0, Math.PI / 2, 0]}
//         featureMode={featureMode}
//         accentColor={theme.accent}
//       />

//       {/* Right wall — tagline plaque */}
//       {tagLine && (
//         <WallPlaque
//           text={tagLine}
//           width={2.4}
//           height={0.55}
//           position={[ROOM_WIDTH / 2 - 0.08, 0.5, -ROOM_LENGTH / 2]}
//           rotation={[0, -Math.PI / 2, 0]}
//           featureMode={featureMode}
//           accentColor={theme.accent}
//         />
//       )}

//       {/* Floor — compass rose with nav prompt */}
//       <FloorCompassRose
//         featureMode={featureMode}
//         accentColor={theme.accent}
//         navPrompt={navPrompt}
//       />

//       {/* Ceiling light — featureMode appropriate */}
//       <CeilingLight featureMode={featureMode} accentColor={theme.accent} />
//     </group>
//   );
// }

// // ── Ceiling light ─────────────────────────────────────────────────────────────
// function CeilingLight({
//   featureMode,
//   accentColor,
// }: {
//   featureMode: FeatureMode;
//   accentColor: string;
// }) {
//   const flickerRef = useRef<THREE.Mesh>(null);
//   useFrame(({ clock }) => {
//     if (flickerRef.current && featureMode !== "arcade") {
//       const mat = flickerRef.current.material as THREE.MeshStandardMaterial;
//       mat.emissiveIntensity =
//         1.8 +
//         Math.sin(clock.getElapsedTime() * 3.5) * 0.2 +
//         Math.sin(clock.getElapsedTime() * 7.1) * 0.1;
//     }
//   });

//   if (featureMode === "arcade") {
//     // Neon strip lights
//     return (
//       <group position={[0, ROOM_HEIGHT / 2 - 0.08, -ROOM_LENGTH / 2]}>
//         {([-2.5, 0, 2.5] as number[]).map((x, i) => (
//           <mesh key={i} position={[x, 0, 0]}>
//             <boxGeometry args={[1.8, 0.06, 0.06]} />
//             <meshStandardMaterial
//               color={accentColor}
//               emissive={accentColor}
//               emissiveIntensity={2.5}
//             />
//           </mesh>
//         ))}
//       </group>
//     );
//   }

//   if (featureMode === "garden") {
//     // String of fairy lights
//     return (
//       <group position={[0, ROOM_HEIGHT / 2 - 0.15, -ROOM_LENGTH / 2]}>
//         {Array.from({ length: 12 }).map((_, i) => (
//           <mesh key={i} position={[(-5.5 + i) * 0.9, 0, 0]}>
//             <sphereGeometry args={[0.05, 6, 6]} />
//             <meshStandardMaterial
//               color="#fff8e0"
//               emissive="#fff8e0"
//               emissiveIntensity={2.0}
//             />
//           </mesh>
//         ))}
//       </group>
//     );
//   }

//   // Castle / farm / beach — chandelier-style
//   return (
//     <group position={[0, ROOM_HEIGHT / 2 - 0.3, -ROOM_LENGTH / 2]}>
//       {/* Chain */}
//       <mesh>
//         <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
//         <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
//       </mesh>
//       {/* Body */}
//       <mesh position={[0, -0.38, 0]}>
//         <cylinderGeometry args={[0.28, 0.18, 0.3, 12]} />
//         <meshStandardMaterial
//           color={featureMode === "beach" ? "#c4a35a" : "#2a1e14"}
//           roughness={0.4}
//           metalness={0.3}
//         />
//       </mesh>
//       {/* Flame glow */}
//       <mesh ref={flickerRef} position={[0, -0.28, 0]}>
//         <sphereGeometry args={[0.1, 8, 8]} />
//         <meshStandardMaterial
//           color="#ffeeaa"
//           emissive="#ffeeaa"
//           emissiveIntensity={2.0}
//           transparent
//           opacity={0.9}
//         />
//       </mesh>
//       {/* Arm candles */}
//       {Array.from({ length: 4 }).map((_, i) => {
//         const a = (i / 4) * Math.PI * 2;
//         return (
//           <group
//             key={i}
//             position={[Math.cos(a) * 0.35, -0.32, Math.sin(a) * 0.35]}
//           >
//             <mesh>
//               <cylinderGeometry args={[0.025, 0.03, 0.18, 6]} />
//               <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
//             </mesh>
//             <mesh position={[0, 0.11, 0]}>
//               <sphereGeometry args={[0.038, 6, 6]} />
//               <meshStandardMaterial
//                 color="#ffeeaa"
//                 emissive="#ffeeaa"
//                 emissiveIntensity={1.8}
//               />
//             </mesh>
//           </group>
//         );
//       })}
//     </group>
//   );
// }

"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  ROOM_HEIGHT,
  ROOM_LENGTH,
  ROOM_WIDTH,
} from "@/components/rooms-r3f/constants";
import type { FeatureMode, RoomTheme } from "@/components/rooms-r3f/Room";
import type { EventType } from "@/types/event";

interface HeroRoomProps {
  featureMode: FeatureMode;
  theme: RoomTheme;
  bride?: string;
  groom?: string;
  tagLine?: string;
  topLabel?: string;
  eventType?: EventType;
  heroPhotoUrl?: string;
}

// ── Ambient particles ─────────────────────────────────────────────────────────
function AmbientParticles({
  featureMode,
  accentColor,
}: {
  featureMode: FeatureMode;
  accentColor: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 50;

  const data = useRef(
    Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * ROOM_WIDTH * 0.85,
      y: (Math.random() - 0.5) * ROOM_HEIGHT * 0.75,
      z: -(Math.random() * (ROOM_LENGTH - 2) + 1),
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.01,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      rot: Math.random() * Math.PI,
    })),
  );

  const dummy = useRef(new THREE.Object3D());

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    data.current.forEach((p, i) => {
      p.y += p.speed;
      p.rot += p.rotSpeed;
      if (p.y > ROOM_HEIGHT / 2) p.y = -ROOM_HEIGHT / 2;
      const swayX = Math.sin(t * 0.35 + p.phase) * 0.25;
      dummy.current.position.set(p.x + swayX, p.y, p.z);
      dummy.current.rotation.set(p.rot, p.rot * 0.5, p.rot * 0.3);
      dummy.current.scale.setScalar(0.045 + Math.sin(p.phase + t * 0.5) * 0.01);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(i, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  const color =
    featureMode === "arcade"
      ? accentColor
      : featureMode === "beach"
        ? "#aaddff"
        : featureMode === "garden"
          ? "#ffbbcc"
          : "#cc4466";

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1.3]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={featureMode === "beach" ? 0.25 : 0.45}
        emissive={featureMode === "arcade" ? accentColor : undefined}
        emissiveIntensity={featureMode === "arcade" ? 0.4 : 0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Hero photo backdrop on back wall ─────────────────────────────────────────
function HeroPhotoBackdrop({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    // Sits just in front of the back wall, full wall size, semi-transparent
    <mesh position={[0, 0, -ROOM_LENGTH + 0.05]}>
      <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
      <meshStandardMaterial
        map={texture}
        roughness={1}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Main banner on the back wall ──────────────────────────────────────────────
function HeroBanner({
  bride,
  groom,
  topLabel,
  featureMode,
  theme,
}: {
  bride: string;
  groom?: string;
  topLabel?: string;
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const bannerColor =
    featureMode === "arcade"
      ? "#0a0a2e"
      : featureMode === "beach"
        ? "#f5e6d0"
        : featureMode === "garden"
          ? "#2a3a1a"
          : featureMode === "farm"
            ? "#8b3a2a"
            : theme.curtain;

  const bannerW = ROOM_WIDTH * 0.68;
  const bannerH = ROOM_HEIGHT * 0.72;

  // Back wall is at Z = -ROOM_LENGTH, facing +Z (toward camera)
  // So we place content at Z = -ROOM_LENGTH + small_offset
  const wallZ = -ROOM_LENGTH + 0.08;

  return (
    <group position={[0, 0.1, wallZ]}>
      {/* Fabric backing */}
      <mesh>
        <planeGeometry args={[bannerW, bannerH]} />
        <meshStandardMaterial color={bannerColor} roughness={0.88} />
      </mesh>

      {/* Gold border trim — 4 sides */}
      {/* Top */}
      <mesh position={[0, bannerH / 2, 0.01]}>
        <planeGeometry args={[bannerW + 0.12, 0.06]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -bannerH / 2, 0.01]}>
        <planeGeometry args={[bannerW + 0.12, 0.06]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      {/* Left */}
      <mesh position={[-bannerW / 2, 0, 0.01]}>
        <planeGeometry args={[0.06, bannerH]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      {/* Right */}
      <mesh position={[bannerW / 2, 0, 0.01]}>
        <planeGeometry args={[0.06, bannerH]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Top hanging rod */}
      <mesh
        position={[0, bannerH / 2 + 0.08, 0.04]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.035, 0.035, bannerW + 0.4, 8]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      {/* Rod finials */}
      {([-1, 1] as const).map((side, i) => (
        <mesh
          key={i}
          position={[side * (bannerW / 2 + 0.22), bannerH / 2 + 0.08, 0.04]}
        >
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* Rope fringe along bottom */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            -bannerW / 2 + 0.25 + i * ((bannerW - 0.4) / 15),
            -bannerH / 2 - 0.13,
            0.02,
          ]}
        >
          <cylinderGeometry args={[0.01, 0.007, 0.24, 5]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* All text content via a single Html panel — crisp, properly sized */}
      <Html
        position={[0, 0, 0.06]}
        center
        transform
        distanceFactor={9}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: "560px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            userSelect: "none",
          }}
        >
          {/* Medallion */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: `2.5px solid ${theme.accent}`,
              boxShadow: `0 0 20px ${theme.accent}50, inset 0 0 20px ${theme.accent}20`,
              background: `${bannerColor}CC`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "6px",
                borderRadius: "50%",
                border: `1px solid ${theme.accent}55`,
              }}
            />
            <span
              style={{
                fontFamily: "serif",
                fontSize: groom ? "34px" : "42px",
                fontWeight: 300,
                color: theme.accent,
                textShadow: `0 0 14px ${theme.accent}80`,
                letterSpacing: groom ? "0.02em" : "0",
                lineHeight: 1,
              }}
            >
              {groom
                ? `${bride.charAt(0)} & ${groom.charAt(0)}`
                : bride.charAt(0)}
            </span>
          </div>

          {/* Top label */}
          {topLabel && (
            <p
              style={{
                fontFamily: "var(--font-label, sans-serif)",
                fontSize: "8px",
                fontWeight: 600,
                letterSpacing: "0.55em",
                textTransform: "uppercase",
                color: `${theme.accent}CC`,
                margin: 0,
              }}
            >
              {topLabel}
            </p>
          )}

          {/* Divider */}
          <div
            style={{
              width: "90px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${theme.accent}80, transparent)`,
            }}
          />

          {/* Names */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "serif",
                fontSize: "36px",
                fontWeight: 500,
                color:
                  featureMode === "beach"
                    ? "#3a2510"
                    : featureMode === "garden"
                      ? "#f5ead0"
                      : "#F5F0E8",
                letterSpacing: "0.05em",
                lineHeight: 1.1,
                textShadow: "0 2px 20px rgba(0,0,0,0.7)",
              }}
            >
              {bride}
            </div>
            {groom && groom.trim().length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "serif",
                    fontSize: "26px",
                    color: theme.accent,
                    margin: "6px 0",
                    textShadow: `0 0 20px ${theme.accent}60`,
                  }}
                >
                  &
                </div>
                <div
                  style={{
                    fontFamily: "serif",
                    fontSize: "36px",
                    fontWeight: 500,
                    color:
                      featureMode === "beach"
                        ? "#3a2510"
                        : featureMode === "garden"
                          ? "#f5ead0"
                          : "#F5F0E8",
                    letterSpacing: "0.05em",
                    lineHeight: 1.1,
                    textShadow: "0 2px 20px rgba(0,0,0,0.7)",
                  }}
                >
                  {groom}
                </div>
              </>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── Wall plaque ───────────────────────────────────────────────────────────────
// wallSide: "left" | "right" — determines position and rotation automatically
function WallPlaque({
  text,
  subText,
  featureMode,
  theme,
  wallSide,
  verticalPos = 0.4,
}: {
  text: string;
  subText?: string;
  featureMode: FeatureMode;
  theme: RoomTheme;
  wallSide: "left" | "right";
  verticalPos?: number;
}) {
  const plaqueColor =
    featureMode === "arcade"
      ? "#0a0a2e"
      : featureMode === "beach"
        ? "#d4b483"
        : featureMode === "garden"
          ? "#3a4a22"
          : featureMode === "farm"
            ? "#7a6040"
            : "#2a1e14";

  const plaqueW = 2.6;
  const plaqueH = 0.85;

  // Camera is inside room at ~Z=-2.5, looking toward Z=-14.
  // Left wall face points in +X direction. Plaque must stick out in +X from left wall.
  // Right wall face points in -X direction. Plaque sticks out in -X from right wall.
  // Position plaques at mid-depth of the room so they're in view.
  const position: [number, number, number] =
    wallSide === "left"
      ? [-ROOM_WIDTH / 2 + 0.08, verticalPos, -ROOM_LENGTH * 0.45]
      : [ROOM_WIDTH / 2 - 0.08, verticalPos, -ROOM_LENGTH * 0.45];

  const rotationY = wallSide === "left" ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Plaque body */}
      <mesh>
        <boxGeometry args={[plaqueW, plaqueH, 0.04]} />
        <meshStandardMaterial color={plaqueColor} roughness={0.7} />
      </mesh>

      {/* Gold outer border */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[plaqueW + 0.09, plaqueH + 0.09, 0.008]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Inset face */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[plaqueW - 0.05, plaqueH - 0.05, 0.008]} />
        <meshStandardMaterial color={plaqueColor} roughness={0.65} />
      </mesh>

      {/* Corner bolts */}
      {(
        [
          [-plaqueW / 2 + 0.11, plaqueH / 2 - 0.11],
          [plaqueW / 2 - 0.11, plaqueH / 2 - 0.11],
          [-plaqueW / 2 + 0.11, -plaqueH / 2 + 0.11],
          [plaqueW / 2 - 0.11, -plaqueH / 2 + 0.11],
        ] as [number, number][]
      ).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.036]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 8]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* Text — no transform, fixed pixel size, readable from inside room */}
      <Html
        position={[0, subText ? 0.1 : 0, 0.05]}
        center
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: "220px",
            textAlign: "center",
            userSelect: "none",
            background: "transparent",
          }}
        >
          <div
            style={{
              fontFamily: featureMode === "arcade" ? "monospace" : "serif",
              fontSize: "13px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: theme.accent,
              lineHeight: 1.4,
              textShadow:
                featureMode === "arcade" ? `0 0 8px ${theme.accent}` : "none",
            }}
          >
            {text}
          </div>
          {subText && (
            <div
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: "10px",
                color: `${theme.accent}99`,
                letterSpacing: "0.1em",
                marginTop: "4px",
              }}
            >
              {subText}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
// ── Floor compass rose ────────────────────────────────────────────────────────
function FloorCompassRose({
  featureMode,
  theme,
  navPrompt,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
  navPrompt: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.06;
    }
  });

  return (
    <group
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -ROOM_HEIGHT / 2 + 0.01, -ROOM_LENGTH / 2]}
    >
      {/* Slowly rotating outer ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.6, 0.025, 8, 64]} />
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.2}
          metalness={0.8}
          emissive={theme.accent}
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Static inner disc */}
      <mesh position={[0, 0, -0.004]}>
        <circleGeometry args={[1.55, 64]} />
        <meshStandardMaterial
          color={featureMode === "arcade" ? "#0a0a1e" : "#150e06"}
          roughness={0.9}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Cross arms */}
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, 0, rot]} position={[0, 0, 0.002]}>
          <planeGeometry args={[3.1, 0.018]} />
          <meshStandardMaterial
            color={theme.accent}
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Cardinal dots */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 1.2, Math.cos(a) * 1.2, 0.005]}
          >
            <circleGeometry args={[0.055, 8]} />
            <meshStandardMaterial
              color={theme.accent}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}

      {/* Nav prompt text */}
      <Html
        position={[0, 0, 0.01]}
        center
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <p
          style={{
            fontFamily: "var(--font-label, sans-serif)",
            fontSize: "11px",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: theme.accent,
            opacity: 0.75,
            userSelect: "none",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {navPrompt}
        </p>
      </Html>
    </group>
  );
}

// ── Ceiling light ─────────────────────────────────────────────────────────────
function CeilingLight({
  featureMode,
  theme,
}: {
  featureMode: FeatureMode;
  theme: RoomTheme;
}) {
  const flickerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!flickerRef.current || featureMode === "arcade") return;
    const mat = flickerRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity =
      1.8 +
      Math.sin(clock.getElapsedTime() * 3.5) * 0.18 +
      Math.sin(clock.getElapsedTime() * 7.1) * 0.08;
  });

  if (featureMode === "arcade") {
    return (
      <group position={[0, ROOM_HEIGHT / 2 - 0.08, -ROOM_LENGTH / 2]}>
        {([-2.5, 0, 2.5] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[1.8, 0.055, 0.055]} />
            <meshStandardMaterial
              color={theme.accent}
              emissive={theme.accent}
              emissiveIntensity={2.5}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (featureMode === "garden") {
    return (
      <group position={[0, ROOM_HEIGHT / 2 - 0.18, -ROOM_LENGTH / 2]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[(-4.5 + i) * 0.95, 0, 0]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial
              color="#fff8e0"
              emissive="#fff8e0"
              emissiveIntensity={2.2}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // Castle / farm / beach — chandelier
  return (
    <group position={[0, ROOM_HEIGHT / 2 - 0.28, -ROOM_LENGTH / 2]}>
      {/* Chain */}
      <mesh>
        <cylinderGeometry args={[0.018, 0.018, 0.45, 6]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.25, 0.16, 0.28, 12]} />
        <meshStandardMaterial
          color={featureMode === "beach" ? "#c4a35a" : "#2a1e14"}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Central flame glow */}
      <mesh ref={flickerRef} position={[0, -0.26, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          color="#ffeeaa"
          emissive="#ffeeaa"
          emissiveIntensity={2.0}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Arm candles */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 0.32, -0.3, Math.sin(a) * 0.32]}
          >
            <mesh>
              <cylinderGeometry args={[0.022, 0.027, 0.15, 6]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.095, 0]}>
              <sphereGeometry args={[0.034, 6, 6]} />
              <meshStandardMaterial
                color="#ffeeaa"
                emissive="#ffeeaa"
                emissiveIntensity={1.9}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function HeroRoom({
  featureMode,
  theme,
  bride = "Guest",
  groom,
  tagLine,
  topLabel,
  eventType = "wedding",
  heroPhotoUrl,
}: HeroRoomProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navCopy: Partial<Record<string, string>> = {
    wedding: "Navigate to begin the journey",
    birthday: "Navigate to join the celebration",
    baby_shower: "Navigate to meet the little one",
    anniversary: "Navigate to celebrate with us",
    graduation: "Navigate to the ceremony",
    engagement: "Navigate to begin",
    housewarming: "Navigate to explore",
  };
  const navPrompt = navCopy[eventType] ?? "Navigate to continue";

  if (!mounted) return null;

  return (
    <group>
      {/* Floating particles */}
      <AmbientParticles featureMode={featureMode} accentColor={theme.accent} />

      {/* Hero photo — semi-transparent on back wall when provided */}
      {heroPhotoUrl && <HeroPhotoBackdrop url={heroPhotoUrl} />}

      {/* Back wall — main banner with names and monogram */}
      <HeroBanner
        bride={bride}
        groom={groom}
        topLabel={topLabel}
        featureMode={featureMode}
        theme={theme}
      />

      {/* Left wall — event type label */}
      <WallPlaque
        text={topLabel ?? "Together in Love"}
        subText={eventType.replace(/_/g, " ")}
        featureMode={featureMode}
        theme={theme}
        wallSide="left"
        verticalPos={0.5}
      />

      {/* Right wall — tagline */}
      {tagLine && (
        <WallPlaque
          text={tagLine}
          featureMode={featureMode}
          theme={theme}
          wallSide="right"
          verticalPos={0.5}
        />
      )}

      {/* Floor — compass rose with nav prompt */}
      <FloorCompassRose
        featureMode={featureMode}
        theme={theme}
        navPrompt={navPrompt}
      />

      {/* Ceiling light */}
      <CeilingLight featureMode={featureMode} theme={theme} />
    </group>
  );
}
