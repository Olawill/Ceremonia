"use client";

import {
  BuildingIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  WalletIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { formattedDeadlineDate } from "@/lib/helper";
import { useTheme } from "@/lib/ThemeContext";
import type { AccommodationConfig, AccommodationOption } from "@/types/event";

interface Props {
  accommodation: AccommodationConfig;
  headingLabel?: string; // vocab.accommodationCardLabel
  introLabel?: string; // vocab.accommodationIntro
}

// ── Wall faces ───────────────────────────────────────────────────────────────

function Stars({ count, gold }: { count: number; gold: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className="size-3.5"
          style={{
            color: i < count ? gold : `${gold}20`,
            fill: i < count ? gold : "transparent",
            filter: i < count ? `drop-shadow(0 0 4px ${gold}80)` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Concierge placard — mounted on a wall face ───────────────────────────────
function HotelPlacard({
  option,
  gold,
  text,
  curtain,
  isActive,
}: {
  option: AccommodationOption;
  gold: string;
  text: string;
  curtain: string;
  isActive: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-4 w-full max-w-sm mx-auto transition-all duration-700"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive
          ? "scale(1) translateY(0)"
          : "scale(0.94) translateY(12px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Decorative top ornament */}
      <div className="flex items-center gap-3 justify-center">
        <div
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${gold}60)`,
          }}
        />
        <span style={{ color: gold, fontSize: 10, letterSpacing: "0.5em" }}>
          ✦
        </span>
        <div
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, ${gold}60, transparent)`,
          }}
        />
      </div>

      {/* Main placard frame */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${gold}35`,
          background: `linear-gradient(160deg, rgba(0,0,0,0.72) 0%, ${curtain}18 50%, rgba(0,0,0,0.65) 100%)`,
          boxShadow: `0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 ${gold}20, 0 0 80px ${gold}08`,
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Gold corner ornaments */}
        {[
          "top-0 left-0",
          "top-0 right-0",
          "bottom-0 left-0",
          "bottom-0 right-0",
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-5 h-5 pointer-events-none`}
            style={{ opacity: 0.6 }}
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d={
                  i === 0
                    ? "M0 8 L0 0 L8 0"
                    : i === 1
                      ? "M20 8 L20 0 L12 0"
                      : i === 2
                        ? "M0 12 L0 20 L8 20"
                        : "M20 12 L20 20 L12 20"
                }
                stroke={gold}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        ))}

        {/* Hotel image banner */}
        {option.imageUrl ? (
          <div className="w-full h-32 overflow-hidden relative">
            <img
              src={option.imageUrl}
              alt={option.name}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.75) saturate(0.9)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)`,
              }}
            />
            {/* Overlaid name on image */}
            <div className="absolute bottom-0 left-0 right-0 px-5! pb-3!">
              <p
                className="font-display text-xl leading-tight"
                style={{
                  color: "#F5F0E8",
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                }}
              >
                {option.name}
              </p>
            </div>
          </div>
        ) : (
          // No image — show an elegant typographic header
          <div
            className="px-6! pt-6! pb-4! flex flex-col gap-1"
            style={{
              background: `linear-gradient(135deg, ${curtain}30, transparent)`,
              borderBottom: `1px solid ${gold}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-1!">
              <BuildingIcon className="size-3.5" style={{ color: gold }} />
              <span
                className="font-label text-[9px] tracking-[0.5em] uppercase"
                style={{ color: `${gold}80` }}
              >
                Where to Stay
              </span>
            </div>
            <p
              className="font-display text-2xl leading-tight"
              style={{
                color: "#F5F0E8",
                textShadow: `0 0 20px ${gold}30`,
                letterSpacing: "0.03em",
              }}
            >
              {option.name}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="px-5! py-4! flex flex-col gap-3">
          {/* Stars + price row */}
          <div className="flex items-center justify-between">
            {option.stars ? (
              <Stars count={option.stars} gold={gold} />
            ) : (
              <div />
            )}
            {option.pricePerNight && (
              <div
                className="flex items-center gap-1.5 px-3! py-1! rounded-full font-label text-[9px] tracking-[0.3em] uppercase"
                style={{
                  border: `1px solid ${gold}40`,
                  color: gold,
                  background: `${gold}12`,
                }}
              >
                <WalletIcon className="size-3" />
                {option.pricePerNight}
              </div>
            )}
          </div>

          {/* Description */}
          {option.description && (
            <p
              className="font-display italic text-sm leading-relaxed"
              style={{ color: `${text}75` }}
            >
              {option.description}
            </p>
          )}

          {/* Divider */}
          <div
            className="h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${gold}30, transparent)`,
            }}
          />

          {/* Info rows */}
          <div className="flex flex-col gap-2">
            {option.address && (
              <div className="flex items-start gap-2.5">
                <MapPinIcon
                  className="size-3.5 mt-0.5! shrink-0"
                  style={{ color: `${gold}70` }}
                />
                <p
                  className="font-display text-sm leading-snug"
                  style={{ color: `${text}70` }}
                >
                  {option.address}
                  {option.distanceFromVenue && (
                    <span
                      className="ml-1! font-label text-[9px] tracking-widest uppercase"
                      style={{ color: `${gold}80` }}
                    >
                      · {option.distanceFromVenue}
                    </span>
                  )}
                </p>
              </div>
            )}

            {option.bookingDeadline && (
              <div className="flex items-center gap-2.5">
                <CalendarIcon
                  className="size-3.5 shrink-0"
                  style={{ color: `${gold}70` }}
                />
                <p
                  className="font-display text-sm"
                  style={{ color: `${text}70` }}
                >
                  Book by{" "}
                  <span style={{ color: gold }}>
                    {formattedDeadlineDate(option.bookingDeadline)}
                  </span>
                </p>
              </div>
            )}

            {option.blockCode && (
              <div className="flex items-center gap-2.5">
                <TagIcon
                  className="size-3.5 shrink-0"
                  style={{ color: `${gold}70` }}
                />
                <p
                  className="font-display text-sm"
                  style={{ color: `${text}70` }}
                >
                  Group code:{" "}
                  <span
                    className="font-mono px-2! py-0.5! rounded text-[11px]"
                    style={{
                      color: gold,
                      background: `${gold}18`,
                      letterSpacing: "0.15em",
                    }}
                  >
                    {option.blockCode}
                  </span>
                </p>
              </div>
            )}

            {option.phone && (
              <div className="flex items-center gap-2.5">
                <PhoneIcon
                  className="size-3.5 shrink-0"
                  style={{ color: `${gold}70` }}
                />
                <a
                  href={`tel:${option.phone}`}
                  className="font-display text-sm transition-opacity hover:opacity-60"
                  style={{ color: `${text}70` }}
                >
                  {option.phone}
                </a>
              </div>
            )}
          </div>

          {/* CTA button */}
          {option.bookingUrl && (
            <a
              href={option.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1! flex items-center justify-center gap-2 py-2.5! rounded-xl font-label text-[10px] tracking-[0.35em] uppercase transition-all hover:opacity-80 active:scale-95"
              style={{
                border: `1px solid ${gold}50`,
                color: gold,
                background: `linear-gradient(135deg, ${gold}18, ${gold}08)`,
                boxShadow: `0 0 20px ${gold}15`,
              }}
            >
              Reserve Now
              <ExternalLinkIcon className="size-3" />
            </a>
          )}
        </div>
      </div>

      {/* Decorative bottom ornament */}
      <div className="flex items-center gap-3 justify-center">
        <div
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${gold}40)`,
          }}
        />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? 4 : 2.5,
                height: i === 1 ? 4 : 2.5,
                background: i === 1 ? gold : `${gold}50`,
              }}
            />
          ))}
        </div>
        <div
          className="h-px flex-1"
          style={{
            background: `linear-gradient(90deg, ${gold}40, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

// ── Intro wall — the north face, shown first ──────────────────────────────────
function IntroWall({
  intro,
  introLabel,
  headingLabel,
  totalHotels,
  gold,
  text,
  curtain,
  isActive,
}: {
  intro?: string;
  introLabel?: string;
  headingLabel?: string;
  totalHotels: number;
  gold: string;
  text: string;
  curtain: string;
  isActive: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-6 text-center transition-all duration-700 max-w-xs mx-auto px-4!"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive
          ? "scale(1) translateY(0)"
          : "scale(0.94) translateY(16px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Illuminated manuscript ornament */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{
          border: `1px solid ${gold}35`,
          background: `radial-gradient(circle, ${gold}15, transparent)`,
          boxShadow: `0 0 30px ${gold}20`,
        }}
      >
        <BuildingIcon className="size-7" style={{ color: gold }} />
      </div>

      <div className="flex flex-col gap-2">
        <p
          className="font-label text-[9px] tracking-[0.6em] uppercase"
          style={{ color: `${gold}70` }}
        >
          {headingLabel ?? "Where to Stay"}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(28px,5vw,40px)",
            color: text,
            letterSpacing: "0.06em",
            textShadow: `0 2px 20px rgba(0,0,0,0.8), 0 0 40px ${gold}20`,
          }}
        >
          {introLabel ?? "Accommodation"}
        </h2>
      </div>

      {intro && (
        <p
          className="font-display italic text-sm leading-relaxed max-w-[260px]"
          style={{
            color: `${text}70`,
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          }}
        >
          {intro}
        </p>
      )}

      {/* Hotel count badge */}
      <div
        className="flex items-center gap-2 px-4! py-2! rounded-full font-label text-[9px] tracking-[0.4em] uppercase"
        style={{
          border: `1px solid ${gold}60`,
          color: `${gold}90`,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
        }}
      >
        {totalHotels} {totalHotels === 1 ? "property" : "properties"} selected
      </div>

      {/* Pan hint */}
      <div className="flex flex-col items-center gap-2 mt-2!">
        <div
          className="flex items-center gap-3 font-label text-[8px] tracking-[0.4em] uppercase"
          style={{ color: `${gold}80` }}
        >
          <ChevronLeftIcon
            className="size-3.5"
            style={{ color: `${gold}70` }}
          />
          Pan to explore
          <ChevronRightIcon
            className="size-3.5"
            style={{ color: `${gold}70` }}
          />
        </div>
        {/* Animated panning indicator */}
        <div
          className="w-16 h-0.5 rounded-full overflow-hidden"
          style={{ background: `${gold}15` }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
              animation: "pan-hint 2s ease-in-out infinite",
              width: "40%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pan-hint {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

// ── Wall label chip — small compass indicator ─────────────────────────────────
function WallCompass({ label, gold }: { label: string; gold: string }) {
  return (
    <div
      className="font-label text-[8px] tracking-[0.5em] uppercase px-3! py-1! rounded-full"
      style={{
        border: `1px solid ${gold}25`,
        color: `${gold}50`,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
      }}
    >
      {label}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AccommodationPanel({ accommodation, headingLabel, introLabel }: Props) {
  const { theme } = useTheme();
  const { options, intro } = accommodation;

  // Current yaw angle in degrees (horizontal pan)
  const [yaw, setYaw] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragStartYaw = useRef(0);
  const yawRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snap targets: 0° = intro, then each hotel at evenly spaced angles
  // With up to 4 hotels: 0, 90, 180, 270
  const totalFaces = 1 + options.length; // intro + one per hotel
  const angleStep = totalFaces <= 4 ? 90 : 360 / totalFaces;
  const snapAngles = Array.from(
    { length: totalFaces },
    (_, i) => i * angleStep,
  );

  // Snap to nearest face
  const snapToNearest = useCallback(
    (currentYaw: number) => {
      const normalised = ((currentYaw % 360) + 360) % 360;
      let nearest = snapAngles[0];
      let minDist = 999;
      for (const angle of snapAngles) {
        const dist = Math.abs(normalised - angle);
        const wrapped = Math.min(dist, 360 - dist);
        if (wrapped < minDist) {
          minDist = wrapped;
          nearest = angle;
        }
      }
      // Find the nearest in absolute terms (avoid sudden jumps)
      const diff = ((nearest - normalised + 540) % 360) - 180;
      return currentYaw + diff;
    },
    [snapAngles],
  );

  const activeFace =
    Math.round((((yaw % 360) + 360) % 360) / angleStep) % totalFaces;

  // Go to a specific face
  const goToFace = useCallback(
    (faceIndex: number) => {
      const targetYaw = faceIndex * angleStep;
      // Find shortest rotation path
      const current = yaw;
      const diff =
        ((targetYaw - (((current % 360) + 360) % 360) + 540) % 360) - 180;
      const snapped = current + diff;
      setYaw(snapped);
      yawRef.current = snapped;
    },
    [yaw, angleStep],
  );

  // ── Mouse/Touch drag handlers ────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartYaw.current = yawRef.current;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    // 300px of drag = 90° rotation
    const newYaw = dragStartYaw.current + (dx / 300) * 90;
    setYaw(newYaw);
    yawRef.current = newYaw;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const snapped = snapToNearest(yawRef.current);
    setYaw(snapped);
    yawRef.current = snapped;
  };

  // ── Perspective transform for each wall face ─────────────────────────────
  // Each face is rotated around the Y axis by its base angle, then the whole
  // "room cylinder" is counter-rotated by the current yaw so the target face
  // faces the camera.
  const getFaceStyle = (faceIndex: number): React.CSSProperties => {
    const faceAngle = faceIndex * angleStep;
    const relativeAngle = faceAngle - yaw;
    const normalised = ((relativeAngle % 360) + 360) % 360;

    // How far off-centre (0 = directly facing camera, 90 = side wall)
    const absAngle = normalised > 180 ? 360 - normalised : normalised;

    // Radius of the virtual cylinder the faces sit on (in px)
    const radius = 320;

    const rad = (relativeAngle * Math.PI) / 180;
    const translateZ = Math.cos(rad) * radius - radius;
    const translateX = Math.sin(rad) * radius;
    const rotateY = -relativeAngle;

    // Fade out walls that are nearly behind camera
    const opacity =
      absAngle > 100 ? 0 : absAngle > 60 ? 1 - (absAngle - 60) / 40 : 1;
    const pointerEvents: React.CSSProperties["pointerEvents"] =
      absAngle < 30 ? "auto" : "none";

    return {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
      opacity,
      pointerEvents,
      transition: isDragging
        ? "none"
        : "transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease",
    };
  };

  const wallLabels = ["Entrance", ...options.map((_, i) => `Suite ${i + 1}`)];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        // perspective: "800px",
        // perspectiveOrigin: "50% 50%",
        background: "transparent",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          perspective: "800px",
          perspectiveOrigin: "50% 50%",
          background: "transparent",
        }}
      >
        {/* ── 3D cylinder of walls ── */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            height: "100%",
            transformStyle: "preserve-3d",
            background: "transparent",
          }}
        >
          {/* Intro face */}
          <div style={getFaceStyle(0)}>
            <IntroWall
              intro={intro}
              introLabel={introLabel}
              totalHotels={options.length}
              gold={theme.gold}
              text={theme.text}
              curtain={theme.curtain}
              isActive={activeFace === 0}
            />
          </div>

          {/* One face per hotel */}
          {options.map((option, i) => (
            <div key={option.id} style={getFaceStyle(i + 1)}>
              <HotelPlacard
                option={option}
                gold={theme.gold}
                text={theme.text}
                curtain={theme.curtain}
                isActive={activeFace === i + 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom HUD ── */}
      <div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none"
        style={{ opacity: 0.9 }}
      >
        {/* Wall compass label */}
        <WallCompass label={wallLabels[activeFace] ?? ""} gold={theme.gold} />

        {/* Face indicator pips */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalFaces }).map((_, i) => (
            <button
              key={i}
              className="rounded-full transition-all duration-300 pointer-events-auto cursor-pointer"
              style={{
                width: i === activeFace ? 20 : 5,
                height: 5,
                background: i === activeFace ? theme.gold : `${theme.gold}30`,
                border: `1px solid ${theme.gold}50`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                goToFace(i);
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Left / Right nav arrows ── */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full pointer-events-auto cursor-pointer transition-all hover:opacity-80 active:scale-90"
        style={{
          width: 36,
          height: 36,
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${theme.gold}30`,
          color: theme.gold,
          backdropFilter: "blur(8px)",
          opacity: activeFace === 0 ? 0.3 : 0.8,
        }}
        onClick={(e) => {
          e.stopPropagation();
          goToFace(Math.max(0, activeFace - 1));
        }}
        disabled={activeFace === 0}
      >
        <ChevronLeftIcon className="size-4" />
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full pointer-events-auto cursor-pointer transition-all hover:opacity-80 active:scale-90"
        style={{
          width: 36,
          height: 36,
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${theme.gold}30`,
          color: theme.gold,
          backdropFilter: "blur(8px)",
          opacity: activeFace === totalFaces - 1 ? 0.3 : 0.8,
        }}
        onClick={(e) => {
          e.stopPropagation();
          goToFace(Math.min(totalFaces - 1, activeFace + 1));
        }}
        disabled={activeFace === totalFaces - 1}
      >
        <ChevronRightIcon className="size-4" />
      </button>

      {/* ── Subtle ambient edge vignette to help text stand out ── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(ellipse 85% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </div>
  );
}
