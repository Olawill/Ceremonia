// ── FAQPanel.tsx ──────────────────────────────────────────────────────────────
"use client";
import { useTheme } from "@/lib/ThemeContext";
import type { FaqItem } from "@/types/event";
import { useEffect, useState } from "react";

export function FAQPanel({ items, sectionLabel }: { items: FaqItem[]; sectionLabel?: string }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 3;
  const pageItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-4">
      {/* Stone tablet heading */}
      <div
        className="flex flex-col items-center gap-2 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-px w-8"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.gold}60)`,
            }}
          />
          <span style={{ color: theme.gold, fontSize: 12 }}>✦</span>
          <div
            className="h-px w-8"
            style={{
              background: `linear-gradient(90deg, ${theme.gold}60, transparent)`,
            }}
          />
        </div>
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}95`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Questions & Answers
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(20px,3.5vw,30px)",
            color: theme.text,
            letterSpacing: "0.07em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {sectionLabel ?? "FAQ"}
        </h2>
      </div>

      {/* Accordion cards — styled as chiselled stone tablets */}
      <div
        className="w-full max-w-xs flex flex-col gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.3s",
        }}
      >
        {pageItems.map((item, i) => {
          const globalIdx = page * ITEMS_PER_PAGE + i;
          const isOpen = openIndex === globalIdx;
          return (
            <button
              key={item.id}
              onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
              className="w-full text-left rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                border: `1px solid ${isOpen ? theme.gold + "50" : theme.gold + "20"}`,
                background: isOpen
                  ? `linear-gradient(135deg, ${theme.curtain}40, rgba(0,0,0,0.65))`
                  : "rgba(0,0,0,0.35)",
                backdropFilter: "blur(8px)",
                boxShadow: isOpen
                  ? `0 0 20px ${theme.gold}15, inset 0 1px 0 ${theme.gold}20`
                  : "none",
              }}
            >
              <div className="flex items-start justify-between gap-2 px-3! py-2.5!">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span
                    className="font-label font-bold text-[8px] tracking-[0.3em] shrink-0 mt-0.5!"
                    style={{ color: `${theme.gold}90` }}
                  >
                    {String(globalIdx + 1).padStart(2, "0")}
                  </span>
                  <p
                    className="font-display font-bold text-xs leading-snug"
                    style={{
                      color: theme.text,
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {item.question}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs transition-transform duration-300"
                  style={{
                    color: theme.gold,
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  ✦
                </span>
              </div>
              {isOpen && (
                <div
                  className="px-3! pb-3!"
                  style={{ borderTop: `1px solid ${theme.gold}15` }}
                >
                  <p
                    className="font-display font-semibold italic text-xs leading-relaxed mt-2"
                    style={{ color: `${theme.text}90` }}
                  >
                    {item.answer}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setPage(i);
                setOpenIndex(null);
              }}
              className="rounded-full transition-all cursor-pointer"
              style={{
                width: i === page ? 16 : 5,
                height: 5,
                background: i === page ? theme.gold : `${theme.gold}30`,
                border: `1px solid ${theme.gold}40`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
