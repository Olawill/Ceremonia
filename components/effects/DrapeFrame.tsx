"use client";

import { useTheme } from "@/lib/ThemeContext";

/**
 * A lightweight fixed frame that makes it look like you're peeking through
 * theatre drapes at all times. Rendered on top of all content after curtain opens.
 * Only shown when curtainStyle === "drape".
 */
export function DrapeFrame() {
  const { theme } = useTheme();
  const W = 1000;
  const H = 600;

  // Swag valance – same deep arc as the opening curtain
  const swag = `M0,0 L0,90 C100,250 300,340 500,275 C700,340 900,250 ${W},90 L${W},0 Z`;

  const gatherLines = Array.from({ length: 18 }, (_, i) => {
    const x = (i / 17) * W;
    const norm = (x - W / 2) / (W / 2);
    const cy = 242 + 68 * (norm * norm);
    return { x, cy };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-90">
      {/* ── Top swag valance ── */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ height: "clamp(140px, 24vh, 280px)" }}
      >
        <defs>
          <linearGradient id="frame-sg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.curtainDark} />
            <stop offset="40%" stopColor={theme.curtain} />
            <stop offset="75%" stopColor={theme.curtainSheen} />
            <stop offset="100%" stopColor={theme.curtainDark} />
          </linearGradient>
          <linearGradient id="frame-sg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={theme.curtainSheen}
              stopOpacity="0.5"
            />
            <stop offset="25%" stopColor={theme.curtain} stopOpacity="0" />
            <stop
              offset="50%"
              stopColor={theme.curtainDark}
              stopOpacity="0.25"
            />
            <stop offset="75%" stopColor={theme.curtain} stopOpacity="0" />
            <stop
              offset="100%"
              stopColor={theme.curtainSheen}
              stopOpacity="0.5"
            />
          </linearGradient>
          <filter id="frame-shadow">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="16"
              floodColor="rgba(0,0,0,0.7)"
            />
          </filter>
        </defs>

        <path d={swag} fill="url(#frame-sg)" filter="url(#frame-shadow)" />
        <path d={swag} fill="url(#frame-sg2)" />

        {/* Fold lines */}
        {gatherLines.map((gl, i) => (
          <line
            key={i}
            x1={gl.x}
            y1="0"
            x2={gl.x}
            y2={gl.cy * 0.85}
            stroke={i % 2 === 0 ? theme.curtainDark : theme.curtainSheen}
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeOpacity={i % 2 === 0 ? 0.5 : 0.18}
          />
        ))}

        {/* Gold rail */}
        <rect
          x="0"
          y="0"
          width={W}
          height="6"
          fill={theme.gold}
          opacity="0.95"
        />
        <rect
          x="0"
          y="6"
          width={W}
          height="2"
          fill={theme.goldLight}
          opacity="0.45"
        />

        {/* Tassels at junction points */}
        {[
          { cx: 55, cy: 88 },
          { cx: 945, cy: 88 },
        ].map((t, idx) => (
          <g key={idx}>
            <circle
              cx={t.cx}
              cy={t.cy}
              r="18"
              fill={theme.gold}
              opacity="0.95"
            />
            <circle
              cx={t.cx}
              cy={t.cy}
              r="11"
              fill={theme.goldLight}
              opacity="0.8"
            />
            <circle
              cx={t.cx}
              cy={t.cy}
              r="5"
              fill={theme.curtainDark}
              opacity="0.5"
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={t.cx + Math.cos(angle) * 11}
                  y1={t.cy + Math.sin(angle) * 11}
                  x2={t.cx + Math.cos(angle) * 28}
                  y2={t.cy + 46 + Math.sin(angle) * 3}
                  stroke={theme.gold}
                  strokeWidth="2.5"
                  strokeOpacity="0.85"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* ── Left bunched panel ── */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{ width: "10%", minWidth: 60 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="lp" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.curtain} />
              <stop offset="55%" stopColor={theme.curtainSheen} />
              <stop offset="100%" stopColor={theme.curtainDark} />
            </linearGradient>
          </defs>
          {/* Bunched shape – wide at top, pinched at tieback, fans at bottom */}
          <path
            d="M0,0 L100,0 C80,100 72,200 78,310 C82,380 60,500 25,600 C10,660 0,720 0,800 Z"
            fill="url(#lp)"
          />
          {/* Fold lines */}
          {[20, 40, 60, 80].map((x, i) => (
            <path
              key={i}
              d={`M${x},0 C${x - 5},120 ${x - 8},240 ${x - 3},320 C${x},400 ${x - 10},520 ${x - 15},650`}
              stroke={i % 2 === 0 ? theme.curtainDark : theme.curtainSheen}
              strokeWidth="2"
              strokeOpacity={i % 2 === 0 ? 0.45 : 0.2}
              fill="none"
            />
          ))}
          {/* Gold inner trim */}
          <line
            x1="98"
            y1="0"
            x2="98"
            y2="800"
            stroke={theme.gold}
            strokeWidth="2.5"
            opacity="0.7"
          />
        </svg>
        {/* Tieback */}
        <div className="absolute z-10" style={{ right: -8, top: "42%" }}>
          <svg width="50" height="90" viewBox="0 0 50 90" overflow="visible">
            <defs>
              <linearGradient id="tb-l" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.curtainDark} />
                <stop offset="50%" stopColor={theme.gold} />
                <stop offset="100%" stopColor={theme.curtainDark} />
              </linearGradient>
            </defs>
            <path
              d="M50,18 C32,18 8,26 3,44 C-1,60 12,68 25,66"
              stroke="url(#tb-l)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="25" cy="66" r="11" fill={theme.gold} opacity="0.96" />
            <circle
              cx="25"
              cy="66"
              r="6.5"
              fill={theme.goldLight}
              opacity="0.82"
            />
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={i}
                x1={17 + i * 2}
                y1="76"
                x2={16 + i * 2.1}
                y2={88 + (i % 3) * 4}
                stroke={theme.gold}
                strokeWidth="2"
                strokeOpacity="0.85"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* ── Right bunched panel ── */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{ width: "10%", minWidth: 60 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="rp" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={theme.curtain} />
              <stop offset="55%" stopColor={theme.curtainSheen} />
              <stop offset="100%" stopColor={theme.curtainDark} />
            </linearGradient>
          </defs>
          <path
            d="M100,0 L0,0 C20,100 28,200 22,310 C18,380 40,500 75,600 C90,660 100,720 100,800 Z"
            fill="url(#rp)"
          />
          {[20, 40, 60, 80].map((x, i) => (
            <path
              key={i}
              d={`M${100 - x},0 C${100 - x + 5},120 ${100 - x + 8},240 ${100 - x + 3},320 C${100 - x},400 ${100 - x + 10},520 ${100 - x + 15},650`}
              stroke={i % 2 === 0 ? theme.curtainDark : theme.curtainSheen}
              strokeWidth="2"
              strokeOpacity={i % 2 === 0 ? 0.45 : 0.2}
              fill="none"
            />
          ))}
          <line
            x1="2"
            y1="0"
            x2="2"
            y2="800"
            stroke={theme.gold}
            strokeWidth="2.5"
            opacity="0.7"
          />
        </svg>
        {/* Tieback */}
        <div className="absolute z-10" style={{ left: -8, top: "42%" }}>
          <svg width="50" height="90" viewBox="0 0 50 90" overflow="visible">
            <defs>
              <linearGradient id="tb-r" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={theme.curtainDark} />
                <stop offset="50%" stopColor={theme.gold} />
                <stop offset="100%" stopColor={theme.curtainDark} />
              </linearGradient>
            </defs>
            <path
              d="M0,18 C18,18 42,26 47,44 C51,60 38,68 25,66"
              stroke="url(#tb-r)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="25" cy="66" r="11" fill={theme.gold} opacity="0.96" />
            <circle
              cx="25"
              cy="66"
              r="6.5"
              fill={theme.goldLight}
              opacity="0.82"
            />
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={i}
                x1={17 + i * 2}
                y1="76"
                x2={16 + i * 2.1}
                y2={88 + (i % 3) * 4}
                stroke={theme.gold}
                strokeWidth="2"
                strokeOpacity="0.85"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* ── Bottom border – floor edge ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.gold}40, transparent)`,
        }}
      />
    </div>
  );
}
