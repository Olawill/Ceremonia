"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useRef, useState } from "react";

interface Detail {
  label: string;
  value: string;
  sub: string;
}

const DETAILS: Detail[] = [
  { label: "Ceremony", value: "4:00 PM", sub: "Grand Ballroom" },
  { label: "Reception", value: "7:00 PM", sub: "Garden Terrace" },
  { label: "Location", value: "Ashford Estate", sub: "Tuscany, Italy" },
];

function CathedralSVG({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-2xl mx-auto"
    >
      {/* ── Sky atmosphere ── */}
      <radialGradient id="sky" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stopColor={gold} stopOpacity="0.07" />
        <stop offset="100%" stopColor={gold} stopOpacity="0" />
      </radialGradient>
      <rect x="0" y="0" width="480" height="360" fill="url(#sky)" />

      {/* ── Stars ── */}
      {[
        [20, 18],
        [60, 8],
        [100, 22],
        [150, 6],
        [200, 14],
        [240, 4],
        [280, 14],
        [330, 8],
        [380, 20],
        [440, 10],
        [460, 25],
        [30, 40],
        [420, 35],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 3 === 0 ? 1.5 : 1}
          fill={`${gold}80`}
        />
      ))}

      {/* ── Far background towers (depth) ── */}
      <rect
        x="30"
        y="120"
        width="25"
        height="200"
        fill={`${curtain}15`}
        stroke={`${gold}20`}
        strokeWidth="0.5"
      />
      <polygon
        points="30,120 42.5,85 55,120"
        fill={`${curtain}20`}
        stroke={`${gold}25`}
        strokeWidth="0.5"
      />
      <line
        x1="42.5"
        y1="85"
        x2="42.5"
        y2="62"
        stroke={`${gold}30`}
        strokeWidth="0.8"
      />
      <circle cx="42.5" cy="61" r="1.5" fill={`${gold}60`} />

      <rect
        x="425"
        y="120"
        width="25"
        height="200"
        fill={`${curtain}15`}
        stroke={`${gold}20`}
        strokeWidth="0.5"
      />
      <polygon
        points="425,120 437.5,85 450,120"
        fill={`${curtain}20`}
        stroke={`${gold}25`}
        strokeWidth="0.5"
      />
      <line
        x1="437.5"
        y1="85"
        x2="437.5"
        y2="62"
        stroke={`${gold}30`}
        strokeWidth="0.8"
      />
      <circle cx="437.5" cy="61" r="1.5" fill={`${gold}60`} />

      {/* ── Left flying buttresses ── */}
      <path
        d="M95,280 Q105,240 120,200"
        stroke={`${gold}25`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M95,310 Q108,265 125,225"
        stroke={`${gold}20`}
        strokeWidth="1"
        fill="none"
      />

      {/* ── Right flying buttresses ── */}
      <path
        d="M385,280 Q375,240 360,200"
        stroke={`${gold}25`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M385,310 Q372,265 355,225"
        stroke={`${gold}20`}
        strokeWidth="1"
        fill="none"
      />

      {/* ── LEFT MAIN TOWER ── */}
      <rect
        x="68"
        y="140"
        width="62"
        height="180"
        fill={`${curtain}45`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      {/* Tower horizontal band */}
      <rect x="68" y="200" width="62" height="4" fill={`${gold}25`} />
      <rect x="68" y="240" width="62" height="3" fill={`${gold}20`} />
      {/* Tower pointed roof */}
      <polygon
        points="68,140 99,72 130,140"
        fill={`${curtain}65`}
        stroke={`${gold}60`}
        strokeWidth="0.8"
      />
      {/* Tower spire */}
      <line x1="99" y1="72" x2="99" y2="30" stroke={gold} strokeWidth="1.8" />
      <circle cx="99" cy="28" r="4.5" fill={gold} opacity="0.95" />
      {/* Cross */}
      <line x1="93" y1="48" x2="105" y2="48" stroke={gold} strokeWidth="1.5" />
      {/* Tower windows - lancet arches */}
      <path
        d="M80,155 L80,178 Q90,168 100,178 L100,155"
        fill={`${gold}12`}
        stroke={`${gold}45`}
        strokeWidth="0.8"
      />
      <path
        d="M105,155 L105,178 Q115,168 125,178 L125,155"
        fill={`${gold}12`}
        stroke={`${gold}45`}
        strokeWidth="0.8"
      />
      <path
        d="M80,190 L80,212 Q90,202 100,212 L100,190"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <path
        d="M105,190 L105,212 Q115,202 125,212 L125,190"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />

      {/* ── RIGHT MAIN TOWER ── */}
      <rect
        x="350"
        y="140"
        width="62"
        height="180"
        fill={`${curtain}45`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      <rect x="350" y="200" width="62" height="4" fill={`${gold}25`} />
      <rect x="350" y="240" width="62" height="3" fill={`${gold}20`} />
      <polygon
        points="350,140 381,72 412,140"
        fill={`${curtain}65`}
        stroke={`${gold}60`}
        strokeWidth="0.8"
      />
      <line x1="381" y1="72" x2="381" y2="30" stroke={gold} strokeWidth="1.8" />
      <circle cx="381" cy="28" r="4.5" fill={gold} opacity="0.95" />
      <line x1="375" y1="48" x2="387" y2="48" stroke={gold} strokeWidth="1.5" />
      <path
        d="M362,155 L362,178 Q372,168 382,178 L382,155"
        fill={`${gold}12`}
        stroke={`${gold}45`}
        strokeWidth="0.8"
      />
      <path
        d="M387,155 L387,178 Q397,168 407,178 L407,155"
        fill={`${gold}12`}
        stroke={`${gold}45`}
        strokeWidth="0.8"
      />
      <path
        d="M362,190 L362,212 Q372,202 382,212 L382,190"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <path
        d="M387,190 L387,212 Q397,202 407,212 L407,190"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />

      {/* ── NAVE (main body) ── */}
      <rect
        x="120"
        y="175"
        width="240"
        height="145"
        fill={`${curtain}35`}
        stroke={`${gold}45`}
        strokeWidth="0.8"
      />
      {/* Nave horizontal courses */}
      <line
        x1="120"
        y1="220"
        x2="360"
        y2="220"
        stroke={`${gold}18`}
        strokeWidth="0.6"
      />
      <line
        x1="120"
        y1="250"
        x2="360"
        y2="250"
        stroke={`${gold}15`}
        strokeWidth="0.5"
      />

      {/* ── CENTRE SPIRE / CROSSING TOWER ── */}
      <rect
        x="195"
        y="130"
        width="90"
        height="60"
        fill={`${curtain}50`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      <polygon
        points="195,130 240,65 285,130"
        fill={`${curtain}65`}
        stroke={`${gold}60`}
        strokeWidth="0.9"
      />
      {/* Centre spire */}
      <line x1="240" y1="65" x2="240" y2="14" stroke={gold} strokeWidth="2.2" />
      <circle cx="240" cy="12" r="5.5" fill={gold} opacity="0.97" />
      {/* Cross on main spire */}
      <line x1="232" y1="35" x2="248" y2="35" stroke={gold} strokeWidth="1.8" />
      {/* Octagonal lantern */}
      <rect
        x="222"
        y="125"
        width="36"
        height="16"
        rx="2"
        fill={`${curtain}60`}
        stroke={`${gold}55`}
        strokeWidth="0.7"
      />

      {/* ── ROSE WINDOW ── */}
      <circle
        cx="240"
        cy="155"
        r="22"
        stroke={`${gold}70`}
        strokeWidth="1.2"
        fill={`${gold}06`}
      />
      <circle
        cx="240"
        cy="155"
        r="15"
        stroke={`${gold}50`}
        strokeWidth="0.8"
        fill={`${gold}04`}
      />
      <circle
        cx="240"
        cy="155"
        r="7"
        stroke={`${gold}40`}
        strokeWidth="0.6"
        fill={`${gold}08`}
      />
      {/* Tracery spokes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={240 + Math.cos(a) * 7}
            y1={155 + Math.sin(a) * 7}
            x2={240 + Math.cos(a) * 22}
            y2={155 + Math.sin(a) * 22}
            stroke={`${gold}40`}
            strokeWidth="0.7"
          />
        );
      })}
      {/* Petal circles between inner and outer rings */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={240 + Math.cos(a) * 11}
            cy={155 + Math.sin(a) * 11}
            r="3"
            fill={`${gold}15`}
            stroke={`${gold}40`}
            strokeWidth="0.5"
          />
        );
      })}

      {/* ── NAVE CLERESTORY WINDOWS ── */}
      {[140, 168, 196, 284, 312, 340].map((x, i) => (
        <path
          key={i}
          d={`M${x},178 L${x},215 Q${x + 12},200 ${x + 24},215 L${x + 24},178`}
          fill={`${gold}10`}
          stroke={`${gold}40`}
          strokeWidth="0.6"
        />
      ))}

      {/* ── TRANSEPT ARMS ── */}
      {/* Left transept */}
      <rect
        x="96"
        y="220"
        width="55"
        height="100"
        fill={`${curtain}38`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <polygon
        points="96,220 123.5,188 151,220"
        fill={`${curtain}52`}
        stroke={`${gold}45`}
        strokeWidth="0.7"
      />
      <path
        d="M105,230 L105,258 Q116,244 127,258 L127,230"
        fill={`${gold}10`}
        stroke={`${gold}35`}
        strokeWidth="0.6"
      />
      {/* Right transept */}
      <rect
        x="329"
        y="220"
        width="55"
        height="100"
        fill={`${curtain}38`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <polygon
        points="329,220 356.5,188 384,220"
        fill={`${curtain}52`}
        stroke={`${gold}45`}
        strokeWidth="0.7"
      />
      <path
        d="M340,230 L340,258 Q351,244 362,258 L362,230"
        fill={`${gold}10`}
        stroke={`${gold}35`}
        strokeWidth="0.6"
      />

      {/* ── MAIN WEST PORTAL (grand entrance) ── */}
      {/* Portal arch surround */}
      <path
        d="M192,320 L192,248 Q240,210 288,248 L288,320"
        fill={`${curtain}55`}
        stroke={`${gold}55`}
        strokeWidth="1"
      />
      {/* Inner portal arch */}
      <path
        d="M202,320 L202,254 Q240,222 278,254 L278,320"
        fill={`${curtain}65`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      {/* Portal tympanum */}
      <path
        d="M208,320 L208,260 Q240,232 272,260 L272,320"
        fill={`${curtain}75`}
        stroke={`${gold}35`}
        strokeWidth="0.5"
      />
      {/* Door */}
      <path
        d="M222,320 L222,272 Q240,260 258,272 L258,320"
        fill={`${curtain}85`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      {/* Door panels */}
      <line
        x1="240"
        y1="265"
        x2="240"
        y2="320"
        stroke={`${gold}35`}
        strokeWidth="0.7"
      />
      <line
        x1="222"
        y1="290"
        x2="258"
        y2="290"
        stroke={`${gold}25`}
        strokeWidth="0.5"
      />
      {/* Door knockers */}
      <circle cx="233" cy="282" r="2.5" fill={gold} opacity="0.7" />
      <circle cx="247" cy="282" r="2.5" fill={gold} opacity="0.7" />
      {/* Portal columns */}
      <line
        x1="205"
        y1="254"
        x2="205"
        y2="320"
        stroke={`${gold}35`}
        strokeWidth="1.5"
      />
      <line
        x1="275"
        y1="254"
        x2="275"
        y2="320"
        stroke={`${gold}35`}
        strokeWidth="1.5"
      />
      {/* Capital tops */}
      <ellipse cx="205" cy="254" rx="4" ry="2" fill={`${gold}40`} />
      <ellipse cx="275" cy="254" rx="4" ry="2" fill={`${gold}40`} />

      {/* ── SIDE PORTAL WINDOWS ── */}
      <path
        d="M130,248 L130,280 Q145,265 160,280 L160,248"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <path
        d="M320,248 L320,280 Q335,265 350,280 L350,248"
        fill={`${gold}10`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />

      {/* ── STEPS ── */}
      <rect x="178" y="318" width="124" height="5" rx="1" fill={`${gold}30`} />
      <rect x="165" y="323" width="150" height="5" rx="1" fill={`${gold}25`} />
      <rect x="150" y="328" width="180" height="5" rx="1" fill={`${gold}20`} />

      {/* ── GROUND LINE ── */}
      <line
        x1="30"
        y1="333"
        x2="450"
        y2="333"
        stroke={`${gold}22`}
        strokeWidth="0.8"
      />

      {/* ── PINNACLES on towers ── */}
      {[76, 88, 114, 126, 358, 370, 394, 406].map((x, i) => (
        <g key={i}>
          <line
            x1={x}
            y1="140"
            x2={x}
            y2={120 + (i % 2) * 5}
            stroke={`${gold}40`}
            strokeWidth="1"
          />
          <circle cx={x} cy={118 + (i % 2) * 5} r="2" fill={`${gold}55`} />
        </g>
      ))}

      {/* ── DECORATIVE QUATREFOILS on nave ── */}
      {[158, 216, 264, 322].map((x, i) => (
        <g key={i}>
          <circle
            cx={x}
            cy="235"
            r="7"
            stroke={`${gold}30`}
            strokeWidth="0.6"
            fill="none"
          />
          {Array.from({ length: 4 }).map((_, j) => {
            const a = (j / 4) * Math.PI * 2;
            return (
              <circle
                key={j}
                cx={x + Math.cos(a) * 5}
                cy={235 + Math.sin(a) * 5}
                r="3.5"
                stroke={`${gold}25`}
                strokeWidth="0.5"
                fill={`${gold}05`}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export function VenueDetails() {
  const { theme } = useTheme();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center gap-16 py-20 px-5"
      style={{
        background: `linear-gradient(180deg, ${theme.bgMid}, ${theme.bg})`,
      }}
    >
      <div
        className="text-center space-y-4 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
        }}
      >
        <p
          className="font-label uppercase tracking-[0.5em] text-[14px] font-semibold"
          style={{ color: `${theme.gold}70` }}
        >
          The Celebration
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(28px,5vw,52px)",
            color: theme.text,
            letterSpacing: "0.08em",
          }}
        >
          Venue &amp; Details
        </h2>
        <div
          className="w-16 h-px mx-auto"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />
      </div>

      <div
        className="w-full flex flex-col items-center transition-all duration-1000 delay-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
        }}
      >
        <CathedralSVG gold={theme.gold} curtain={theme.curtain} />
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {DETAILS.map((d, i) => (
          <div
            key={d.label}
            className="rounded-xl px-10 py-8 text-center transition-all"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}15, transparent)`,
              border: `1px solid ${theme.gold}25`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transitionDuration: "800ms",
              transitionDelay: `${0.2 + i * 0.15}s`,
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              padding: "12px",
            }}
          >
            <p
              className="font-label text-[16px] font-bold tracking-[0.4em] mb-3"
              style={{ color: `${theme.gold}65` }}
            >
              {d.label}
            </p>
            <p
              className="font-display text-4xl mb-1.5"
              style={{ color: theme.gold }}
            >
              {d.value}
            </p>
            <p
              className="font-display italic text-xl"
              style={{ color: `${theme.text}65` }}
            >
              {d.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
