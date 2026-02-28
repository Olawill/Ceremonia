"use client";

import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";
import { formattedDate } from "@/lib/helper";
import { useCallback, useEffect, useRef, useState } from "react";

interface ScratchDateProps {
  date?: string; // ISO "2026-07-12"
  onRevealed: () => void;
}

export function ScratchDate({
  date = "2026-07-12",
  onRevealed,
}: ScratchDateProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  // ── Lock scroll past this section until date is revealed ──────────────
  useEffect(() => {
    if (revealed) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      // Block scrolling down when section is the active view
      if (rect.top <= 10 && rect.bottom > window.innerHeight * 0.4) {
        const deltaY = e instanceof WheelEvent ? e.deltaY : 0;
        if (deltaY > 0) e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [revealed]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    onRevealed();
    fireConfetti({
      count: 120,
      fixed: true,
      colors: [theme.gold, theme.goldLight, "#ffffff", theme.curtain],
      origin: { x: "50%", y: "45%" },
    });
  }, [theme, onRevealed]);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    // const W = (canvas.width = canvas.offsetWidth || 380);
    // const H = (canvas.height = canvas.offsetHeight || 180);
    const W = (canvas.width = 380);
    const H = (canvas.height = 180);

    // Paint gold foil
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#B8960C");
    grad.addColorStop(0.4, "#D4AF37");
    grad.addColorStop(0.7, "#F0D060");
    grad.addColorStop(1, "#B8960C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Noise texture
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.055})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // Hint text
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.font = `bold ${Math.round(W * 0.042)}px Cinzel, serif`;
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", W / 2, H / 2 + 6);

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
      if (!isFinite(x) || !isFinite(y)) return;

      ctx.globalCompositeOperation = "destination-out";
      const r = 22;
      const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
      radial.addColorStop(0, "rgba(0,0,0,1)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      const data = ctx.getImageData(0, 0, W, H).data;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) transparent++;
      }
      const pct = (transparent / (W * H)) * 100;
      setProgress(Math.min(pct, 100));
      if (pct > 85) handleReveal();
    };

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
      scratch(e);
    });
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", () => {
      drawing = false;
    });
    canvas.addEventListener("mouseleave", () => {
      drawing = false;
    });
    canvas.addEventListener(
      "touchstart",
      (e) => {
        drawing = true;
        scratch(e);
      },
      { passive: false },
    );
    canvas.addEventListener("touchmove", scratch, { passive: false });
    canvas.addEventListener("touchend", () => {
      drawing = false;
    });
  }, [revealed, handleReveal]);

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-5 py-20"
      style={{
        background: `radial-gradient(ellipse at center, ${theme.bgMid} 0%, ${theme.bg} 100%)`,
      }}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <p
          className="font-label uppercase tracking-[0.5em] font-semibold text-[14px]"
          style={{ color: `${theme.gold}70` }}
        >
          A Special Surprise
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(28px,5vw,52px)",
            color: theme.text,
            letterSpacing: "0.08em",
          }}
        >
          Reveal Our Date
        </h2>
        {!revealed && (
          <p
            className="font-display italic text-sm"
            style={{ color: `${theme.gold}55` }}
          >
            Scratch the golden foil to continue ↓
          </p>
        )}
      </div>

      {/* Scratch card */}
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            width: "min(640px, 85vw)",
            height: 180,
            boxShadow: `0 0 60px ${theme.gold}35, 0 20px 60px rgba(0,0,0,0.8)`,
            border: `1px solid ${theme.gold}45`,
          }}
        >
          {/* Revealed layer (underneath the foil) */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}30, ${theme.bg})`,
              padding: "16px",
              paddingBottom: "8px",
            }}
          >
            <p
              className="font-label font-semibold"
              style={{
                fontSize: "clamp(26px,7vw,52px)",
                color: theme.gold,
                letterSpacing: "0.15em",
                textShadow: `0 0 30px ${theme.gold}80`,
              }}
            >
              {formattedDate(date)}
            </p>
            <p
              className="font-label text-[12px] tracking-[0.4em]"
              style={{ color: `${theme.gold}75` }}
            >
              SAVE THE DATE
            </p>
          </div>

          {/* Scratch canvas */}
          {!revealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-2xl cursor-crosshair"
            />
          )}
        </div>

        {/* Progress bar */}
        {!revealed && progress < 85 && (
          <div className="mt-3 space-y-1.5">
            <div
              className="h-0.5 rounded-full overflow-hidden"
              style={{ background: `${theme.gold}20` }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${theme.gold}, ${theme.goldLight})`,
                }}
              />
            </div>
            <p
              className="font-label text-[12px] font-semibold tracking-[0.3em] text-center"
              style={{ color: `${theme.gold}55` }}
            >
              {Math.round(progress)}% REVEALED
            </p>
          </div>
        )}

        {revealed && (
          <div className="text-center mt-4 space-y-2 animate-reveal-pop">
            <p
              className="font-display italic"
              style={{
                color: `${theme.gold}80`,
                fontSize: "clamp(14px,2vw,18px)",
                paddingTop: "1rem",
              }}
            >
              We can&apos;t wait for you to celebrate with us ♡
            </p>
            <p
              className="font-label text-[16px] font-semibold tracking-[0.4em] animate-pulse"
              style={{ color: `${theme.gold}50`, marginTop: "4rem" }}
            >
              ↓ SCROLL TO CONTINUE
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
