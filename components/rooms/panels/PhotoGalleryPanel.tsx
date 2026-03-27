// ── PhotoGalleryPanel.tsx ─────────────────────────────────────────────────────
"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";

interface Props {
  photos: string[];
  caption?: string;
}

export function PhotoGalleryPanel({ photos, caption }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (!photos.length) return null;

  // Polaroid-style tilt per photo
  const tilts = [-6, 3, -2, 5, -4, 2, -3, 6, -1, 4];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-4 overflow-hidden">
      {/* Heading */}
      <div
        className="text-center flex flex-col items-center gap-1"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}65`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Our Memories
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3.5vw,28px)",
            color: theme.text,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            letterSpacing: "0.06em",
          }}
        >
          Photo Gallery
        </h2>
      </div>

      {/* Polaroid wall */}
      <div className="relative flex flex-wrap justify-center items-center gap-3 max-w-sm">
        {photos.slice(0, 6).map((src, i) => {
          const tilt = tilts[i % tilts.length];
          return (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="relative cursor-pointer transition-all duration-400 hover:scale-105 hover:z-20"
              style={{
                transform: `rotate(${tilt}deg)`,
                opacity: visible ? 1 : 0,
                transitionDelay: `${i * 0.08 + 0.2}s`,
                outline: "none",
              }}
            >
              {/* Polaroid frame */}
              <div
                className="flex flex-col"
                style={{
                  background: "#F5F0E8",
                  padding: "6px 6px 20px 6px",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)",
                  width: 88,
                }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full aspect-square object-cover"
                  style={{ display: "block" }}
                />
                <div className="h-3 flex items-center justify-center mt-1">
                  {caption && (
                    <p className="font-display text-[7px] text-gray-400 text-center">
                      {caption}
                    </p>
                  )}
                </div>
              </div>
              {/* Pin */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: theme.gold,
                  boxShadow: `0 0 6px ${theme.gold}80`,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Count badge */}
      {photos.length > 6 && (
        <p
          className="font-label text-[8px] tracking-[0.4em] uppercase"
          style={{
            color: `${theme.gold}50`,
            textShadow: "0 1px 6px rgba(0,0,0,0.8)",
          }}
        >
          +{photos.length - 6} more
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#F5F0E8",
                padding: "8px 8px 28px 8px",
                boxShadow: `0 0 60px ${theme.gold}30`,
              }}
            >
              <img
                src={photos[lightboxIndex]}
                alt=""
                className="w-full object-cover"
              />
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-3 -right-3 rounded-full flex items-center justify-center font-label text-[10px] cursor-pointer"
              style={{
                width: 24,
                height: 24,
                background: theme.gold,
                color: "#000",
              }}
            >
              ✕
            </button>
            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                disabled={lightboxIndex === 0}
                className="font-label text-[9px] tracking-widest uppercase px-3 py-1 rounded cursor-pointer disabled:opacity-30"
                style={{
                  border: `1px solid ${theme.gold}40`,
                  color: theme.gold,
                }}
              >
                ←
              </button>
              <button
                onClick={() =>
                  setLightboxIndex(
                    Math.min(photos.length - 1, lightboxIndex + 1),
                  )
                }
                disabled={lightboxIndex === photos.length - 1}
                className="font-label text-[9px] tracking-widest uppercase px-3 py-1 rounded cursor-pointer disabled:opacity-30"
                style={{
                  border: `1px solid ${theme.gold}40`,
                  color: theme.gold,
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
