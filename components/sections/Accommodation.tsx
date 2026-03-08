"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BuildingIcon,
  CalendarIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  WalletIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { formattedDeadlineDate } from "@/lib/helper";
import { useTheme } from "@/lib/ThemeContext";
import type { AccommodationConfig, AccommodationOption } from "@/types/wedding";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  accommodation: AccommodationConfig;
}

function Stars({ count, gold }: { count: number; gold: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className="size-3"
          style={{
            color: i < count ? gold : `${gold}25`,
            fill: i < count ? gold : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function HotelCard({
  option,
  index,
}: {
  option: AccommodationOption;
  index: number;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="acc-card flex flex-col rounded-2xl border overflow-hidden"
      style={{
        borderColor: `${theme.gold}25`,
        background: `${theme.gold}05`,
      }}
    >
      {/* Image */}
      {option.imageUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={option.imageUrl}
            alt={option.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <BuildingIcon
                className="size-3.5 shrink-0"
                style={{ color: theme.gold }}
              />
              <h3
                className="font-display text-xl"
                style={{ color: theme.text }}
              >
                {option.name}
              </h3>
            </div>
            {option.stars && <Stars count={option.stars} gold={theme.gold} />}
          </div>
          {option.pricePerNight && (
            <div
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-label text-[10px] tracking-widest"
              style={{
                borderColor: `${theme.gold}40`,
                color: theme.gold,
                background: `${theme.gold}10`,
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
            className="font-display italic text-sm"
            style={{ color: `${theme.text}70` }}
          >
            {option.description}
          </p>
        )}

        {/* Details grid */}
        <div className="flex flex-col gap-2">
          {option.address && (
            <div className="flex items-start gap-2">
              <MapPinIcon
                className="size-3.5 mt-0.5 shrink-0"
                style={{ color: `${theme.gold}80` }}
              />
              <p
                className="font-display text-sm"
                style={{ color: `${theme.text}70` }}
              >
                {option.address}
                {option.distanceFromVenue && (
                  <span style={{ color: `${theme.gold}80` }}>
                    {" "}
                    — {option.distanceFromVenue}
                  </span>
                )}
              </p>
            </div>
          )}

          {option.bookingDeadline && (
            <div className="flex items-center gap-2">
              <CalendarIcon
                className="size-3.5 shrink-0"
                style={{ color: `${theme.gold}80` }}
              />
              <p
                className="font-display text-sm"
                style={{ color: `${theme.text}70` }}
              >
                Book by{" "}
                <span style={{ color: theme.gold }}>
                  {formattedDeadlineDate(option.bookingDeadline)}
                </span>
              </p>
            </div>
          )}

          {option.blockCode && (
            <div className="flex items-center gap-2">
              <TagIcon
                className="size-3.5 shrink-0"
                style={{ color: `${theme.gold}80` }}
              />
              <p
                className="font-display text-sm"
                style={{ color: `${theme.text}70` }}
              >
                Group code:{" "}
                <span
                  className="font-mono px-2 py-0.5 rounded"
                  style={{
                    color: theme.gold,
                    background: `${theme.gold}15`,
                    letterSpacing: "0.1em",
                  }}
                >
                  {option.blockCode}
                </span>
              </p>
            </div>
          )}

          {option.phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon
                className="size-3.5 shrink-0"
                style={{ color: `${theme.gold}80` }}
              />
              <a
                href={`tel:${option.phone}`}
                className="font-display text-sm transition-opacity hover:opacity-70"
                style={{ color: `${theme.text}70` }}
              >
                {option.phone}
              </a>
            </div>
          )}
        </div>

        {/* CTA */}
        {option.bookingUrl && (
          <a
            href={option.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border font-label text-[11px] tracking-[0.3em] uppercase transition-all hover:opacity-80"
            style={{
              borderColor: `${theme.gold}50`,
              color: theme.gold,
              background: `${theme.gold}10`,
            }}
          >
            Book Now
            <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function Accommodation({ accommodation }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".acc-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      },
    );
  }, []);

  if (!accommodation.options.length) return null;

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-8 py-24 gap-12"
      style={{ background: theme.bg }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <p
            className="font-label text-[11px] tracking-[0.6em] uppercase"
            style={{ color: theme.gold }}
          >
            Where to Stay
          </p>
          <h2
            className="font-display text-[clamp(28px,5vw,48px)] tracking-[0.05em]"
            style={{ color: theme.text }}
          >
            Accommodation
          </h2>
          {accommodation.intro && (
            <p
              className="font-display italic text-base text-center max-w-lg"
              style={{ color: `${theme.text}70` }}
            >
              {accommodation.intro}
            </p>
          )}
        </div>

        {/* Cards */}
        <div ref={containerRef} className="w-full flex flex-col gap-6">
          {accommodation.options.map((option, i) => (
            <HotelCard key={option.id} option={option} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
