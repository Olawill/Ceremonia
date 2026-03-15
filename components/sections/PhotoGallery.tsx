"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import { useTheme } from "@/lib/ThemeContext";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  photos: string[]; // array of URLs
  caption?: string;
}

export function PhotoGallery({ photos, caption }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".photo-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 60, rotate: () => (Math.random() - 0.5) * 12 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 75%" },
      },
    );
  }, []);

  if (!photos.length) return null;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-8! py-20!">
      <p
        className="font-label text-[11px] tracking-[0.5em] uppercase mb-12!"
        style={{ color: theme.gold }}
      >
        Our Memories
      </p>
      <div
        ref={containerRef}
        className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl w-full"
      >
        {photos.map((src, i) => (
          <div
            key={i}
            className="photo-card relative bg-white p-3! pb-10! shadow-2xl"
            style={{ transform: `rotate(${((i % 3) - 1) * 3}deg)` }}
          >
            <img
              src={src}
              alt=""
              className="w-full aspect-square object-cover"
            />
            <div className="absolute bottom-3 left-0 right-0 text-center font-display text-xs text-gray-400">
              {caption ?? ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
