"use client";

import { BedDoubleIcon, MapPinIcon, PlaneIcon } from "lucide-react";
import { useRef } from "react";

import { useTheme } from "@/lib/ThemeContext";

import { TravelItem } from "@/types/wedding";

interface Props {
  items: TravelItem[];
  city: string;
}

const icons = {
  hotel: BedDoubleIcon,
  airport: PlaneIcon,
  tip: MapPinIcon,
};

export function TravelGuide({ items, city }: Props) {
  const { theme } = useTheme();
  const ref = useRef<HTMLElement>(null);

  if (!items.length) return null;

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center px-8 py-20"
    >
      <p
        className="font-label text-[11px] tracking-[0.5em] uppercase mb-2"
        style={{ color: theme.gold }}
      >
        Getting to {city}
      </p>
      <h2 className="font-display text-3xl mb-12" style={{ color: theme.text }}>
        Travel & Stay
      </h2>
      <div className="grid gap-4 max-w-2xl w-full">
        {items.map((item, i) => {
          const Icon = icons[item.type];
          return (
            <a
              key={i}
              href={item.link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 rounded-xl border transition-all hover:border-(--gold)"
              style={{
                borderColor: `${theme.gold}20`,
                background: `${theme.gold}05`,
              }}
            >
              <Icon
                className="size-5 mt-0.5 shrink-0"
                style={{ color: theme.gold }}
              />
              <div>
                <p
                  className="font-label text-[12px] tracking-wider"
                  style={{ color: theme.gold }}
                >
                  {item.name}
                </p>
                <p
                  className="font-display text-sm mt-1"
                  style={{ color: `${theme.text}90` }}
                >
                  {item.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
