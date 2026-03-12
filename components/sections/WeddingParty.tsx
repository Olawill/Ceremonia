"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { WeddingPartyMember, WeddingPartyRole } from "@/types/wedding";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  members: WeddingPartyMember[];
  bride: string;
  groom: string;
}

const ROLE_LABELS: Record<WeddingPartyRole, string> = {
  "maid-of-honour": "Maid of Honour",
  "best-man": "Best Man",
  bridesmaid: "Bridesmaid",
  groomsman: "Groomsman",
  "flower-girl": "Flower Girl",
  "ring-bearer": "Ring Bearer",
  usher: "Usher",
  "mother-of-bride": "Mother of the Bride",
  "father-of-bride": "Father of the Bride",
  "mother-of-groom": "Mother of the Groom",
  "father-of-groom": "Father of the Groom",
  custom: "",
};

function MemberCard({ member }: { member: WeddingPartyMember }) {
  const { theme } = useTheme();
  const roleLabel =
    member.role === "custom"
      ? (member.customRole ?? "")
      : ROLE_LABELS[member.role];

  return (
    <div
      className="wp-card flex flex-col items-center gap-3 p-6! rounded-2xl border"
      style={{
        borderColor: `${theme.gold}20`,
        background: `${theme.gold}04`,
      }}
    >
      {/* Photo or initials fallback */}
      <div
        className="size-20 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: `${theme.gold}40`,
          background: `${theme.gold}10`,
        }}
      >
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-2xl" style={{ color: theme.gold }}>
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h3
          className="font-display text-lg tracking-wide"
          style={{ color: theme.text }}
        >
          {member.name}
        </h3>
        <p
          className="font-label text-[10px] tracking-[0.4em] uppercase"
          style={{ color: theme.gold }}
        >
          {roleLabel}
        </p>
        {member.relation && (
          <p
            className="font-display italic text-sm mt-1!"
            style={{ color: `${theme.text}60` }}
          >
            {member.relation}
          </p>
        )}
      </div>
    </div>
  );
}

export function WeddingParty({ members, bride, groom }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const bridesSide = members.filter(
    (m) => m.side === "bride" || m.side === "both",
  );
  const groomsSide = members.filter(
    (m) => m.side === "groom" || m.side === "both",
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".wp-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      },
    );
  }, []);

  if (!members.length) return null;

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-8! py-24! gap-14"
      style={{ background: theme.bg }}
    >
      <div className="flex flex-col items-center gap-3">
        <p
          className="font-label text-[11px] tracking-[0.6em] uppercase"
          style={{ color: theme.gold }}
        >
          The Wedding Party
        </p>
        <h2
          className="font-display text-[clamp(28px,5vw,48px)] tracking-[0.05em]"
          style={{ color: theme.text }}
        >
          Meet Our People
        </h2>
      </div>

      <div ref={containerRef} className="w-full max-w-3xl flex flex-col gap-14">
        {/* Bride's side */}
        {bridesSide.length > 0 && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${theme.gold}30)`,
                }}
              />
              <p
                className="font-label text-[10px] tracking-[0.5em] uppercase shrink-0"
                style={{ color: `${theme.gold}80` }}
              >
                {bride}&apos;s Side
              </p>
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to left, transparent, ${theme.gold}30)`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {bridesSide.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          </div>
        )}

        {/* Groom's side */}
        {groomsSide.length > 0 && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${theme.gold}30)`,
                }}
              />
              <p
                className="font-label text-[10px] tracking-[0.5em] uppercase shrink-0"
                style={{ color: `${theme.gold}80` }}
              >
                {groom}&apos;s Side
              </p>
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to left, transparent, ${theme.gold}30)`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {groomsSide.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
