"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { EventPartyMember, EventPartyRole } from "@/types/event";
import { useEffect, useState } from "react";

interface Props {
  members: EventPartyMember[];
  bride: string;
  groom?: string;
  sectionLabel?: string;
}

const ROLE_LABELS: Record<EventPartyRole, string> = {
  "maid-of-honour": "Maid of Honour",
  "best-man": "Best Man",
  bridesmaid: "Bridesmaid",
  groomsman: "Groomsman",
  "flower-girl": "Flower Girl",
  "ring-bearer": "Ring Bearer",
  usher: "Usher",
  "mother-of-bride": "Mother of Bride",
  "father-of-bride": "Father of Bride",
  "mother-of-groom": "Mother of Groom",
  "father-of-groom": "Father of Groom",
  godparent: "Godparent",
  godmother: "Godmother",
  godfather: "Godfather",
  parent: "Parent",
  host: "Host",
  guest_of_honour: "Guest of Honour",
  custom: "",
};

function MemberPortrait({
  member,
  gold,
  curtain,
  text,
  isActive,
  onClick,
}: {
  member: EventPartyMember;
  gold: string;
  curtain: string;
  text: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const roleLabel =
    member.role === "custom"
      ? (member.customRole ?? "")
      : ROLE_LABELS[member.role];
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-400"
      style={{
        opacity: isActive ? 1 : 0.5,
        transform: isActive ? "scale(1.12) translateY(-3px)" : "scale(0.95)",
        outline: "none",
      }}
    >
      {/* Portrait frame */}
      <div
        className="relative rounded-sm p-1.5!"
        style={{
          background: `linear-gradient(135deg, ${gold}60, ${gold}30, ${gold}60)`,
          boxShadow: isActive
            ? `0 0 0 1px ${gold}50, 0 6px 24px rgba(0,0,0,0.7), 0 0 20px ${gold}20`
            : `0 0 0 1px ${gold}20, 0 2px 8px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: isActive ? 64 : 50,
            height: isActive ? 72 : 58,
            background: `linear-gradient(160deg, ${curtain}60, rgba(0,0,0,0.7))`,
            transition: "width 0.4s ease, height 0.4s ease",
          }}
        >
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="font-display"
              style={{
                fontSize: isActive ? 22 : 17,
                color: gold,
                textShadow: `0 0 12px ${gold}60`,
              }}
            >
              {initials}
            </span>
          )}
        </div>
        {/* Corner ornaments */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: i < 2 ? 0 : "auto",
              bottom: i >= 2 ? 0 : "auto",
              left: i % 2 === 0 ? 0 : "auto",
              right: i % 2 === 1 ? 0 : "auto",
              width: 8,
              height: 8,
              background: `radial-gradient(circle, ${gold}90, transparent)`,
            }}
          />
        ))}
      </div>
      {/* Name plaque */}
      <div className="text-center" style={{ maxWidth: 70 }}>
        <p
          className="font-display text-xs leading-tight"
          style={{
            color: isActive ? text : `${text}90`,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            fontSize: isActive ? 11 : 9,
          }}
        >
          {member.name.split(" ")[0]}
        </p>
        <p
          className="font-label text-[6px] tracking-[0.3em] uppercase"
          style={{ color: `${gold}${isActive ? "80" : "45"}` }}
        >
          {roleLabel}
        </p>
      </div>
    </button>
  );
}

export function EventPartyPanel({
  members,
  bride,
  groom,
  sectionLabel,
}: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<"bride" | "groom">("bride");

  const bridesSide = members.filter(
    (m) => m.side === "bride" || m.side === "both",
  );
  const groomsSide = members.filter(
    (m) => m.side === "groom" || m.side === "both",
  );
  const currentSide = activeSide === "bride" ? bridesSide : groomsSide;
  const activeDetail = currentSide[activeIndex];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((p) => {
        if (p + 1 >= currentSide.length) {
          setActiveSide((s) => (s === "bride" ? "groom" : "bride"));
          return 0;
        }
        return p + 1;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [currentSide.length]);

  if (!members.length) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4! gap-4">
      {/* Heading */}
      <div
        className="text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}65`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          {sectionLabel ?? "The Wedding Party"}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3vw,26px)",
            color: theme.text,
            letterSpacing: "0.07em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Hall of Honour
        </h2>
      </div>

      {/* Side toggle */}
      {groomsSide.length > 0 && (
        <div
          className="flex gap-1 p-0.5! rounded-full"
          style={{
            border: `1px solid ${theme.gold}55`,
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {(["bride", "groom"] as const).map((side) => (
            <button
              key={side}
              onClick={() => {
                setActiveSide(side);
                setActiveIndex(0);
              }}
              className="font-label text-[7px] tracking-[0.3em] uppercase px-3! py-1! rounded-full cursor-pointer transition-all"
              style={{
                background:
                  activeSide === side ? `${theme.gold}25` : "transparent",
                color: activeSide === side ? theme.gold : `${theme.gold}80`,
                border:
                  activeSide === side
                    ? `1px solid ${theme.gold}40`
                    : "1px solid transparent",
              }}
            >
              {side === "bride" ? bride : (groom ?? "Partner")}&apos;s Side
            </button>
          ))}
        </div>
      )}

      {/* Hall of portraits */}
      <div
        className="flex gap-3 flex-wrap justify-center items-end"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.3s",
        }}
      >
        {currentSide.map((m, i) => (
          <MemberPortrait
            key={m.id}
            member={m}
            gold={theme.gold}
            curtain={theme.curtain}
            text={theme.text}
            isActive={i === activeIndex}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>

      {/* Active member detail */}
      {activeDetail && (
        <div
          className="text-center px-4! py-2! rounded-xl"
          key={`${activeSide}-${activeIndex}`}
          style={{
            border: `1px solid ${theme.gold}25`,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            animation: "fade-in 0.4s ease",
            maxWidth: 320,
          }}
        >
          <p
            className="font-display text-sm"
            style={{
              color: theme.text,
              textShadow: "0 1px 6px rgba(0,0,0,0.9)",
            }}
          >
            {activeDetail.name}
          </p>
          {activeDetail.relation && (
            <p
              className="font-display italic text-xs mt-0.5!"
              style={{ color: `${theme.text}80` }}
            >
              {activeDetail.relation}
            </p>
          )}
        </div>
      )}

      {/* Hall rail */}
      <div
        className="absolute"
        style={{
          top: "26%",
          left: "5%",
          right: "5%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${theme.gold}40, ${theme.gold}60, ${theme.gold}40, transparent)`,
          borderRadius: 2,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.5s",
        }}
      />

      <style>{`@keyframes fade-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
