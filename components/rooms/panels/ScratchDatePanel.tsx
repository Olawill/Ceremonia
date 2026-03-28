"use client";

import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";
import { formattedDate } from "@/lib/helper";
import type { EventType } from "@/types/event";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  date?: string;
  onRevealed: () => void;
  revealLabel?: string;
  eventType?: EventType;
}

// ── Velvet table SVG ─────────────────────────────────────────────────────────
function VelvetTable({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg viewBox="0 0 240 60" fill="none" className="w-full max-w-xs">
      {/* Table shadow */}
      <ellipse cx="120" cy="56" rx="100" ry="5" fill="rgba(0,0,0,0.35)" />
      {/* Legs */}
      <rect
        x="30"
        y="32"
        width="8"
        height="24"
        rx="3"
        fill={`${gold}70`}
        stroke={`${gold}85`}
        strokeWidth="0.8"
      />
      <rect
        x="202"
        y="32"
        width="8"
        height="24"
        rx="3"
        fill={`${gold}70`}
        stroke={`${gold}85`}
        strokeWidth="0.8"
      />
      {/* Table top */}
      <rect
        x="10"
        y="18"
        width="220"
        height="18"
        rx="4"
        fill={`${curtain}`}
        stroke={`${gold}80`}
        strokeWidth="1"
      />
      {/* Velvet sheen */}
      <rect
        x="16"
        y="20"
        width="208"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.08)"
      />
      {/* Gold trim */}
      <rect x="10" y="18" width="220" height="3" rx="2" fill={`${gold}70`} />
      <rect x="10" y="33" width="220" height="3" rx="2" fill={`${gold}70`} />
    </svg>
  );
}

export function ScratchDatePanel({
  date = "2026-07-12",
  onRevealed,
  revealLabel,
  eventType,
}: Props) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSampleRef = useRef(0);

  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const onRevealedRef = useRef(onRevealed);
  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    onRevealedRef.current();
    fireConfetti({
      count: 120,
      fixed: true,
      colors: [
        themeRef.current.gold,
        themeRef.current.goldLight,
        "#ffffff",
        themeRef.current.curtain,
      ],
      origin: { x: "50%", y: "45%" },
      containerId: "scratch-panel-confetti",
    });
  }, []);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect0 = canvas.getBoundingClientRect();
    if (rect0.width === 0) {
      // Panel is hidden — wait for it to become display:block before initialising
      const panel = canvas.closest<HTMLElement>("[data-rooms-panel]");
      if (!panel) return;
      const obs = new MutationObserver(() => {
        if (panel.style.display !== "none") {
          obs.disconnect();
          setCanvasReady(true);
        }
      });
      obs.observe(panel, { attributes: true, attributeFilter: ["style"] });
      return () => obs.disconnect();
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const W = (canvas.width = Math.round(rect0.width) || 280);
    const H = (canvas.height = Math.round(rect0.height) || 100);

    // Gold foil
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#B8960C");
    grad.addColorStop(0.4, "#D4AF37");
    grad.addColorStop(0.7, "#F0D060");
    grad.addColorStop(1, "#B8960C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Noise
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    // Hint
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.font = `bold 13px Cinzel, serif`;
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", W / 2, H / 2 + 5);

    let drawing = false;
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * (W / rect.width),
        y: (src.clientY - rect.top) * (H / rect.height),
      };
    };
    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.globalCompositeOperation = "destination-out";
      const radial = ctx.createRadialGradient(x, y, 0, x, y, 20);
      radial.addColorStop(0, "rgba(0,0,0,1)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      // Throttle the expensive GPU→CPU pixel readback to every 150ms
      const now = performance.now();
      if (now - lastSampleRef.current < 150) return;
      lastSampleRef.current = now;

      const data = ctx.getImageData(0, 0, W, H).data;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 128) transparent++;
      const pct = (transparent / (W * H)) * 100;
      setProgress(Math.min(pct, 100));
      if (pct > 95) handleReveal();
    };

    const onMouseDown = (e: MouseEvent) => {
      drawing = true;
      scratch(e);
    };
    const onMouseMove = (e: MouseEvent) => scratch(e);
    const onMouseUp = () => {
      drawing = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      drawing = true;
      scratch(e);
    };
    const onTouchMove = (e: TouchEvent) => scratch(e);
    const onTouchEnd = () => {
      drawing = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [revealed, handleReveal, canvasReady]);

  const doneMessage: Record<string, string> = {
    wedding: "We can't wait to celebrate with you ♡",
    birthday: "We can't wait to party with you ♡",
    baby_shower: "We can't wait to share this moment with you ♡",
    anniversary: "We can't wait to celebrate with you ♡",
    other: "We can't wait to see you there ♡",
  };

  return (
    <div
      id="scratch-panel-confetti"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5! overflow-hidden"
    >
      {/* Heading */}
      <div
        className="text-center flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-16px)",
          transition:
            "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p
          className="font-label font-semibold text-[11px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}`,
            textShadow: "0 1px 8px rgba(0,0,0,0.9)",
          }}
        >
          A Special Surprise
        </p>
        <h2
          className="font-display font-semibold"
          style={{
            fontSize: "clamp(22px,4vw,34px)",
            color: theme.text,
            letterSpacing: "0.08em",
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
          }}
        >
          {revealLabel ?? "Reveal Our Date"}
        </h2>
        {!revealed && (
          <p
            className="font-display font-semibold italic text-xs"
            style={{
              color: `${theme.gold}90`,
              textShadow: "0 1px 6px rgba(0,0,0,0.8)",
            }}
          >
            Scratch the golden foil below
          </p>
        )}
      </div>

      {/* The velvet table with scratch card on it */}
      <div
        className="flex flex-col items-center gap-2 w-full max-w-xs"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) rotateX(0deg)"
            : "translateY(20px) rotateX(4deg)",
          transition:
            "opacity 0.9s ease 0.2s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s",
          perspective: 600,
        }}
      >
        {/* Scratch card — sits on the table */}
        <div
          className="relative rounded-xl overflow-hidden w-full"
          style={{
            width: 280,
            height: 100,
            border: `1px solid ${theme.gold}50`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 4px ${theme.curtain}30, 0 0 20px ${theme.gold}20`,
          }}
        >
          {/* Revealed layer */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-2!"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}60, ${theme.bg}CC)`,
              overflow: "hidden",
            }}
          >
            <p
              className="font-label font-semibold"
              style={{
                fontSize: "clamp(13px,3.5vw,22px)",
                letterSpacing: "0.05em",
                color: theme.gold,
                textShadow: `0 0 20px ${theme.gold}80`,
              }}
            >
              {formattedDate(date, true)}
            </p>
            <p
              className="font-label font-semibold text-[11px] tracking-[0.5em]"
              style={{ color: `${theme.gold}` }}
            >
              SAVE THE DATE
            </p>
          </div>
          {/* Foil canvas */}
          {!revealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              style={{ borderRadius: 12 }}
            />
          )}
        </div>

        {/* Table */}
        <VelvetTable gold={theme.gold} curtain={theme.curtain} />

        {/* Progress */}
        {!revealed && progress > 5 && (
          <div
            className="h-0.5 rounded-full overflow-hidden w-full"
            style={{ background: `${theme.gold}15` }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.gold}, ${theme.goldLight})`,
              }}
            />
          </div>
        )}
      </div>

      {/* Post-reveal message */}
      {revealed && (
        <div
          className="text-center flex flex-col items-center gap-2"
          style={{ animation: "fade-up 0.6s ease forwards" }}
        >
          <p
            className="font-display font-semibold italic text-sm"
            style={{
              color: `${theme.gold}`,
              textShadow: "0 1px 8px rgba(0,0,0,0.9)",
            }}
          >
            {doneMessage[eventType ?? "other"] ?? doneMessage.other}
          </p>
          <p
            className="font-label font-semibold text-[10px] tracking-[0.5em] uppercase"
            style={{ color: `${theme.gold}80` }}
          >
            SWIPE → TO CONTINUE
          </p>
        </div>
      )}

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
