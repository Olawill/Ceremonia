"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import { Course } from "@/types/event";

interface EventMenuProps {
  courses?: Course[];
  label?: string;
  subLabel?: string; // e.g. "Dinner Banquet" | "Party Food" | "Brunch"
  description?: string; // e.g. "A five-course culinary journey..." | "Light bites and drinks"
}

const COURSES = [
  {
    course: "Amuse-Bouche",
    items: [
      "Truffle Arancini",
      "Burrata Crostini with Fig Jam",
      "Smoked Salmon Blini",
    ],
  },
  {
    course: "First Course",
    items: [
      "Seared Scallops · Cauliflower Purée · Caviar",
      "Heirloom Tomato Salad · Burrata · Basil Oil",
    ],
  },
  {
    course: "Second Course",
    items: [
      "Wild Mushroom Velouté · Truffle Foam",
      "Lobster Bisque · Crème Fraîche · Chives",
    ],
  },
  {
    course: "Main Course",
    items: [
      "Beef Tenderloin · Bordelaise · Pommes Dauphine",
      "Pan-Seared Sea Bass · Beurre Blanc · Asparagus",
      "Wild Mushroom Risotto · Parmesan · Herbs (V)",
    ],
  },
  {
    course: "Dessert",
    items: [
      "Wedding Cake · Champagne Buttercream",
      "Crème Brûlée · Seasonal Berries",
      "Chocolate Fondant · Vanilla Bean Ice Cream",
    ],
  },
];

function TableSVG({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  // Petal helper for roses
  const RosePetals = ({
    cx,
    cy,
    r,
    color,
  }: {
    cx: number;
    cy: number;
    r: number;
    color: string;
  }) => (
    <g>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(a) * r * 0.55}
            cy={cy + Math.sin(a) * r * 0.55}
            rx={r * 0.55}
            ry={r * 0.35}
            transform={`rotate(${(i / 6) * 360}, ${cx + Math.cos(a) * r * 0.55}, ${cy + Math.sin(a) * r * 0.55})`}
            fill={color}
            opacity="0.9"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.38} fill={gold} opacity="0.8" />
      <circle cx={cx} cy={cy} r={r * 0.18} fill="#FFF8DC" opacity="0.7" />
    </g>
  );

  // Candle helper
  const Candle = ({
    x,
    y,
    h,
    w,
    glow,
  }: {
    x: number;
    y: number;
    h: number;
    w: number;
    glow: number;
  }) => (
    <g>
      {/* Glow halo */}
      <ellipse
        cx={x}
        cy={y - h - 4}
        rx={glow}
        ry={glow * 0.8}
        fill={gold}
        opacity="0.12"
      />
      {/* Outer flame */}
      <ellipse
        cx={x}
        cy={y - h - 4}
        rx={w * 0.7}
        ry={w * 1.4}
        fill={gold}
        opacity="0.95"
      />
      {/* Inner flame */}
      <ellipse
        cx={x}
        cy={y - h - 5}
        rx={w * 0.35}
        ry={w * 0.9}
        fill="#FFF8DC"
        opacity="0.9"
      />
      {/* Wick */}
      <line
        x1={x}
        y1={y - h}
        x2={x}
        y2={y - h - 3}
        stroke="#333"
        strokeWidth="0.7"
      />
      {/* Body */}
      <rect
        x={x - w}
        y={y - h}
        width={w * 2}
        height={h}
        rx={w * 0.4}
        fill={`${text}18`}
        stroke={`${gold}55`}
        strokeWidth="0.7"
      />
      {/* Wax drip */}
      <path
        d={`M${x + w * 0.5},${y - h + 3} Q${x + w * 0.8},${y - h + 8} ${x + w * 0.4},${y - h + 12}`}
        stroke={`${text}25`}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Holder plate */}
      <ellipse
        cx={x}
        cy={y}
        rx={w * 1.8}
        ry={w * 0.7}
        fill={gold}
        opacity="0.5"
        stroke={gold}
        strokeWidth="0.8"
      />
    </g>
  );

  // Wine glass helper
  const WineGlass = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      {/* Bowl */}
      <path
        d={`M${cx - 7},${cy} Q${cx - 8},${cy + 14} ${cx - 2},${cy + 16} L${cx + 2},${cy + 16} Q${cx + 8},${cy + 14} ${cx + 7},${cy}`}
        fill={`${gold}08`}
        stroke={`${gold}40`}
        strokeWidth="0.8"
      />
      {/* Rim ellipse */}
      <ellipse
        cx={cx}
        cy={cy}
        rx="7"
        ry="2.5"
        stroke={`${gold}45`}
        strokeWidth="0.8"
        fill={`${gold}06`}
      />
      {/* Wine fill */}
      <ellipse
        cx={cx}
        cy={cy + 12}
        rx="4.5"
        ry="1.8"
        fill={`${curtain}50`}
        opacity="0.6"
      />
      {/* Stem */}
      <line
        x1={cx}
        y1={cy + 16}
        x2={cx}
        y2={cy + 26}
        stroke={`${gold}40`}
        strokeWidth="0.9"
      />
      {/* Base */}
      <ellipse
        cx={cx}
        cy={cy + 26}
        rx="5"
        ry="1.8"
        stroke={`${gold}40`}
        strokeWidth="0.8"
        fill={`${gold}08`}
      />
    </g>
  );

  // Plate setting helper
  const PlaceSetting = ({
    cx,
    cy,
    rx,
    ry,
  }: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  }) => (
    <g>
      {/* Charger plate */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx + 4}
        ry={ry + 1.5}
        fill={`${gold}18`}
        stroke={`${gold}55`}
        strokeWidth="1"
      />
      {/* Main plate */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={`${text}10`}
        stroke={`${gold}40`}
        strokeWidth="0.8"
      />
      {/* Inner ring */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 4}
        ry={ry - 1.5}
        stroke={`${gold}25`}
        strokeWidth="0.5"
        fill="none"
      />
      {/* Food suggestion */}
      <ellipse cx={cx} cy={cy} rx={rx - 8} ry={ry - 3} fill={`${curtain}20`} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 500 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-2xl mx-auto"
    >
      {/* ── Ambient candlelight atmosphere ── */}
      <radialGradient id="glow" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor={gold} stopOpacity="0.08" />
        <stop offset="100%" stopColor={gold} stopOpacity="0" />
      </radialGradient>
      <rect x="0" y="0" width="500" height="320" fill="url(#glow)" />

      {/* ── Table legs ── */}
      <line
        x1="145"
        y1="215"
        x2="130"
        y2="300"
        stroke={`${gold}45`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="355"
        y1="215"
        x2="370"
        y2="300"
        stroke={`${gold}45`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="195"
        y1="222"
        x2="185"
        y2="300"
        stroke={`${gold}35`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="305"
        y1="222"
        x2="315"
        y2="300"
        stroke={`${gold}35`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cross brace */}
      <path
        d="M133,268 Q250,255 367,268"
        stroke={`${gold}30`}
        strokeWidth="1.5"
        fill="none"
      />

      {/* ── Table top ── */}
      <ellipse
        cx="250"
        cy="175"
        rx="200"
        ry="68"
        fill={`${curtain}30`}
        stroke={`${gold}55`}
        strokeWidth="1.2"
      />
      {/* Tablecloth inner ring */}
      <ellipse
        cx="250"
        cy="175"
        rx="186"
        ry="60"
        stroke={`${gold}22`}
        strokeWidth="0.7"
        strokeDasharray="6 4"
        fill="none"
      />
      {/* Tablecloth drape skirt */}
      <path
        d="M50,175 Q130,240 250,248 Q370,240 450,175"
        stroke={`${gold}25`}
        strokeWidth="0.8"
        fill={`${gold}04`}
      />

      {/* ── Floor shadow ── */}
      <ellipse cx="250" cy="302" rx="155" ry="10" fill="rgba(0,0,0,0.3)" />

      {/* ── PLACE SETTINGS ── */}
      {/* Far left guest */}
      <PlaceSetting cx={88} cy={172} rx={26} ry={9} />
      {/* Fork */}
      <line
        x1="58"
        y1="166"
        x2="55"
        y2="178"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="62"
        y1="165"
        x2="59"
        y2="177"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Knife */}
      <line
        x1="117"
        y1="165"
        x2="120"
        y2="177"
        stroke={`${gold}40`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Spoon */}
      <line
        x1="121"
        y1="164"
        x2="124"
        y2="176"
        stroke={`${gold}35`}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <WineGlass cx={88} cy={152} />
      <WineGlass cx={100} cy={149} />

      {/* Left-centre guest */}
      <PlaceSetting cx={175} cy={198} rx={28} ry={10} />
      <line
        x1="142"
        y1="192"
        x2="138"
        y2="205"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="147"
        y1="191"
        x2="143"
        y2="204"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="206"
        y1="191"
        x2="210"
        y2="204"
        stroke={`${gold}40`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <WineGlass cx={172} cy={176} />
      <WineGlass cx={185} cy={173} />

      {/* Right-centre guest */}
      <PlaceSetting cx={325} cy={198} rx={28} ry={10} />
      <line
        x1="292"
        y1="192"
        x2="288"
        y2="205"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="355"
        y1="191"
        x2="359"
        y2="204"
        stroke={`${gold}40`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="360"
        y1="191"
        x2="364"
        y2="204"
        stroke={`${gold}35`}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <WineGlass cx={322} cy={176} />
      <WineGlass cx={335} cy={173} />

      {/* Far right guest */}
      <PlaceSetting cx={412} cy={172} rx={26} ry={9} />
      <line
        x1="382"
        y1="166"
        x2="378"
        y2="178"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="440"
        y1="165"
        x2="443"
        y2="177"
        stroke={`${gold}40`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="444"
        y1="164"
        x2="447"
        y2="176"
        stroke={`${gold}35`}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <WineGlass cx={408} cy={152} />
      <WineGlass cx={420} cy={149} />

      {/* ── CENTREPIECE TALL CANDELABRA ── */}
      {/* Base */}
      <ellipse
        cx="250"
        cy="168"
        rx="14"
        ry="5"
        fill={gold}
        opacity="0.6"
        stroke={gold}
        strokeWidth="0.8"
      />
      {/* Stem */}
      <rect
        x="247"
        y="130"
        width="6"
        height="38"
        rx="2"
        fill={`${gold}50`}
        stroke={`${gold}70`}
        strokeWidth="0.7"
      />
      {/* Arms */}
      <path
        d="M250,148 Q230,142 222,138"
        stroke={`${gold}60`}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M250,148 Q270,142 278,138"
        stroke={`${gold}60`}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M250,155 Q235,150 228,147"
        stroke={`${gold}50`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M250,155 Q265,150 272,147"
        stroke={`${gold}50`}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Candles on arms */}
      <Candle x={222} y={138} h={16} w={2.5} glow={12} />
      <Candle x={278} y={138} h={16} w={2.5} glow={12} />
      <Candle x={228} y={147} h={13} w={2} glow={9} />
      <Candle x={272} y={147} h={13} w={2} glow={9} />
      {/* Centre tall candle */}
      <Candle x={250} y={130} h={22} w={3} glow={16} />

      {/* ── FLOWER ARRANGEMENTS ── */}
      {/* Left bouquet */}
      <path
        d="M195,162 Q192,155 190,148 L196,148 Q198,155 196,162Z"
        fill={`${curtain}60`}
        stroke={`${gold}50`}
        strokeWidth="0.7"
      />
      {/* stems */}
      {[
        [-8, -18],
        [-4, -22],
        [0, -24],
        [4, -22],
        [8, -18],
        [-6, -14],
        [6, -14],
      ].map(([dx, dy], i) => (
        <line
          key={i}
          x1={193}
          y1={150}
          x2={193 + dx}
          y2={150 + dy}
          stroke={`${text}30`}
          strokeWidth="0.9"
        />
      ))}
      <RosePetals cx={185} cy={130} r={7} color={`${curtain}80`} />
      <RosePetals cx={193} cy={126} r={8} color={`${curtain}90`} />
      <RosePetals cx={201} cy={130} r={7} color={`${curtain}80`} />
      <RosePetals cx={188} cy={136} r={6} color={`${curtain}70`} />
      <RosePetals cx={198} cy={136} r={6} color={`${curtain}70`} />
      {/* Accent buds */}
      <circle cx={183} cy={124} r="3" fill={`${gold}60`} />
      <circle cx={203} cy={124} r="3" fill={`${gold}60`} />
      <circle cx={193} cy={120} r="3.5" fill={`${gold}70`} />
      {/* Leaves */}
      <path
        d="M186,132 Q179,128 181,122"
        stroke={`${text}35`}
        strokeWidth="1.2"
        fill={`${text}10`}
      />
      <path
        d="M200,132 Q207,128 205,122"
        stroke={`${text}35`}
        strokeWidth="1.2"
        fill={`${text}10`}
      />

      {/* Right bouquet */}
      <path
        d="M305,162 Q302,155 300,148 L306,148 Q308,155 306,162Z"
        fill={`${curtain}60`}
        stroke={`${gold}50`}
        strokeWidth="0.7"
      />
      {[
        [-8, -18],
        [-4, -22],
        [0, -24],
        [4, -22],
        [8, -18],
        [-6, -14],
        [6, -14],
      ].map(([dx, dy], i) => (
        <line
          key={i}
          x1={303}
          y1={150}
          x2={303 + dx}
          y2={150 + dy}
          stroke={`${text}30`}
          strokeWidth="0.9"
        />
      ))}
      <RosePetals cx={295} cy={130} r={7} color={`${curtain}80`} />
      <RosePetals cx={303} cy={126} r={8} color={`${curtain}90`} />
      <RosePetals cx={311} cy={130} r={7} color={`${curtain}80`} />
      <RosePetals cx={298} cy={136} r={6} color={`${curtain}70`} />
      <RosePetals cx={308} cy={136} r={6} color={`${curtain}70`} />
      <circle cx={293} cy={124} r="3" fill={`${gold}60`} />
      <circle cx={313} cy={124} r="3" fill={`${gold}60`} />
      <circle cx={303} cy={120} r="3.5" fill={`${gold}70`} />
      <path
        d="M296,132 Q289,128 291,122"
        stroke={`${text}35`}
        strokeWidth="1.2"
        fill={`${text}10`}
      />
      <path
        d="M310,132 Q317,128 315,122"
        stroke={`${text}35`}
        strokeWidth="1.2"
        fill={`${text}10`}
      />

      {/* ── SCATTERED PETALS on tablecloth ── */}
      {[
        [130, 185],
        [155, 195],
        [200, 208],
        [230, 212],
        [270, 212],
        [300, 208],
        [345, 195],
        [370, 185],
        [390, 178],
      ].map(([px, py], i) => (
        <ellipse
          key={i}
          cx={px}
          cy={py}
          rx="4"
          ry="2.5"
          transform={`rotate(${i * 33}, ${px}, ${py})`}
          fill={`${curtain}50`}
          opacity="0.5"
        />
      ))}

      {/* ── SIDE CANDLES (pillar candles on table) ── */}
      <Candle x={140} y={165} h={18} w={3.5} glow={14} />
      <Candle x={155} y={168} h={12} w={2.5} glow={10} />
      <Candle x={360} y={165} h={18} w={3.5} glow={14} />
      <Candle x={345} y={168} h={12} w={2.5} glow={10} />

      {/* ── MENU CARD in centre front ── */}
      <rect
        x="230"
        y="186"
        width="40"
        height="28"
        rx="3"
        fill={`${text}12`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      <line
        x1="235"
        y1="192"
        x2="265"
        y2="192"
        stroke={`${gold}40`}
        strokeWidth="0.5"
      />
      <line
        x1="235"
        y1="197"
        x2="265"
        y2="197"
        stroke={`${gold}30`}
        strokeWidth="0.4"
      />
      <line
        x1="235"
        y1="202"
        x2="265"
        y2="202"
        stroke={`${gold}30`}
        strokeWidth="0.4"
      />
      <line
        x1="235"
        y1="207"
        x2="265"
        y2="207"
        stroke={`${gold}25`}
        strokeWidth="0.4"
      />

      {/* ── SCATTERED GOLD CONFETTI / PETALS ── */}
      {[
        [105, 160],
        [420, 160],
        [200, 175],
        [300, 175],
        [130, 170],
        [370, 170],
      ].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="1.5" fill={gold} opacity="0.4" />
      ))}

      {/* ── TALL VASE FLOWERS (left of centre) ── */}
      {/* Vase */}
      <path
        d="M218,175 Q214,168 213,158 L214,148 Q216,143 221,142 Q226,143 228,148 L229,158 Q228,168 224,175Z"
        fill={`${curtain}55`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      <ellipse
        cx="221"
        cy="175"
        rx="7"
        ry="2.5"
        fill={`${curtain}65`}
        stroke={`${gold}45`}
        strokeWidth="0.6"
      />
      <ellipse
        cx="221"
        cy="142"
        rx="5"
        ry="2"
        fill={`${curtain}45`}
        stroke={`${gold}35`}
        strokeWidth="0.5"
      />
      {/* Gold band on vase */}
      <path
        d="M213,160 Q221,162 229,160"
        stroke={gold}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {/* Tall stems */}
      <line
        x1="218"
        y1="144"
        x2="205"
        y2="95"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="221"
        y1="143"
        x2="221"
        y2="88"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="224"
        y1="144"
        x2="237"
        y2="92"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="216"
        y1="145"
        x2="200"
        y2="110"
        stroke={`${text}25`}
        strokeWidth="0.9"
      />
      <line
        x1="226"
        y1="145"
        x2="242"
        y2="108"
        stroke={`${text}25`}
        strokeWidth="0.9"
      />
      {/* Leaf sprays */}
      <path
        d="M210,118 Q202,112 206,104"
        stroke={`${text}35`}
        strokeWidth="1.5"
        fill={`${text}12`}
        strokeLinecap="round"
      />
      <path
        d="M232,115 Q240,108 236,100"
        stroke={`${text}35`}
        strokeWidth="1.5"
        fill={`${text}12`}
        strokeLinecap="round"
      />
      <path
        d="M219,108 Q211,100 215,92"
        stroke={`${text}30`}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Blooms – roses */}
      <RosePetals cx={205} cy={93} r={8} color={`${curtain}85`} />
      <RosePetals cx={221} cy={86} r={9} color={`${curtain}90`} />
      <RosePetals cx={237} cy={90} r={8} color={`${curtain}85`} />
      <RosePetals cx={200} cy={108} r={6} color={`${curtain}70`} />
      <RosePetals cx={242} cy={106} r={6} color={`${curtain}70`} />
      {/* Baby's breath / accent dots */}
      {[
        [208, 100],
        [215, 95],
        [227, 89],
        [233, 95],
        [214, 105],
        [228, 102],
      ].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r="1.8" fill="#FFF8DC" opacity="0.7" />
      ))}

      {/* ── TALL VASE FLOWERS (right of centre) ── */}
      <path
        d="M270,175 Q266,168 265,158 L266,148 Q268,143 273,142 Q278,143 280,148 L281,158 Q280,168 276,175Z"
        fill={`${curtain}55`}
        stroke={`${gold}50`}
        strokeWidth="0.8"
      />
      <ellipse
        cx="273"
        cy="175"
        rx="7"
        ry="2.5"
        fill={`${curtain}65`}
        stroke={`${gold}45`}
        strokeWidth="0.6"
      />
      <ellipse
        cx="273"
        cy="142"
        rx="5"
        ry="2"
        fill={`${curtain}45`}
        stroke={`${gold}35`}
        strokeWidth="0.5"
      />
      <path
        d="M265,160 Q273,162 281,160"
        stroke={gold}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <line
        x1="270"
        y1="144"
        x2="257"
        y2="95"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="273"
        y1="143"
        x2="273"
        y2="88"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="276"
        y1="144"
        x2="289"
        y2="92"
        stroke={`${text}30`}
        strokeWidth="1.2"
      />
      <line
        x1="268"
        y1="145"
        x2="252"
        y2="110"
        stroke={`${text}25`}
        strokeWidth="0.9"
      />
      <line
        x1="278"
        y1="145"
        x2="294"
        y2="108"
        stroke={`${text}25`}
        strokeWidth="0.9"
      />
      <path
        d="M262,118 Q254,112 258,104"
        stroke={`${text}35`}
        strokeWidth="1.5"
        fill={`${text}12`}
        strokeLinecap="round"
      />
      <path
        d="M284,115 Q292,108 288,100"
        stroke={`${text}35`}
        strokeWidth="1.5"
        fill={`${text}12`}
        strokeLinecap="round"
      />
      <path
        d="M271,108 Q263,100 267,92"
        stroke={`${text}30`}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <RosePetals cx={257} cy={93} r={8} color={`${curtain}85`} />
      <RosePetals cx={273} cy={86} r={9} color={`${curtain}90`} />
      <RosePetals cx={289} cy={90} r={8} color={`${curtain}85`} />
      <RosePetals cx={252} cy={108} r={6} color={`${curtain}70`} />
      <RosePetals cx={294} cy={106} r={6} color={`${curtain}70`} />
      {[
        [260, 100],
        [267, 95],
        [279, 89],
        [285, 95],
        [266, 105],
        [280, 102],
      ].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r="1.8" fill="#FFF8DC" opacity="0.7" />
      ))}
    </svg>
  );
}

export function EventMenu({
  courses,
  label,
  subLabel,
  description,
}: EventMenuProps) {
  const { theme } = useTheme();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  const displayCourses = courses ?? COURSES;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center gap-4 py-24! px-5!"
      style={{
        background: `radial-gradient(ellipse at 60% 40%, ${theme.curtain}20 0%, ${theme.bg} 65%)`,
      }}
    >
      {/* Heading */}
      <div
        className="text-center space-y-4! transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
        }}
      >
        <p
          className="font-label uppercase tracking-[0.5em] text-[14px] font-semibold"
          style={{ color: `${theme.gold}70` }}
        >
          {subLabel ?? "Dinner Banquet"}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(28px,5vw,56px)",
            color: theme.text,
            letterSpacing: "0.08em",
          }}
        >
          {label ?? "The Menu"}
        </h2>
        <div
          className="w-16 h-px mx-auto"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />
        <p
          className="font-display italic font-semibold"
          style={{
            color: `${theme.text}55`,
            fontSize: "clamp(13px,1.8vw,17px)",
          }}
        >
          {description ?? "A culinary journey curated with love"}
        </p>
      </div>

      {/* Table illustration */}
      <div
        className="w-full flex flex-col items-center transition-all duration-1000 delay-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <TableSVG gold={theme.gold} curtain={theme.curtain} text={theme.text} />
      </div>

      {/* Menu card */}
      <div
        className="w-full max-w-2xl rounded-2xl p-8! md:p-12! transition-all duration-1000 delay-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          background: `linear-gradient(145deg, ${theme.curtain}25, ${theme.bg}CC)`,
          border: `1px solid ${theme.gold}30`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.gold}15`,
          padding: "16px",
        }}
      >
        {/* Top ornament */}
        <div className="text-center mb-8!">
          <span
            style={{ color: theme.gold, fontSize: 22, letterSpacing: "0.5em" }}
          >
            ✦ ◆ ✦
          </span>
        </div>

        <div className="flex flex-col gap-8">
          {displayCourses.map((c, i) => (
            <div
              key={c.course}
              className="transition-all duration-700"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${0.4 + i * 0.1}s`,
              }}
            >
              {/* Course label */}
              <div className="flex items-center gap-4 mb-3!">
                <div
                  className="flex-1 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${theme.gold}40)`,
                  }}
                />
                <p
                  className="font-label text-[12px] font-semibold tracking-[0.5em] uppercase"
                  style={{ color: `${theme.gold}80` }}
                >
                  {c.course}
                </p>
                <div
                  className="flex-1 h-px"
                  style={{
                    background: `linear-gradient(90deg, ${theme.gold}40, transparent)`,
                  }}
                />
              </div>

              {/* Dishes */}
              <div className="space-y-2! text-center">
                {c.items.map((item) => (
                  <p
                    key={item}
                    className="font-display italic font-semibold"
                    style={{
                      color: `${theme.text}85`,
                      fontSize: "clamp(14px,1.8vw,17px)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom ornament */}
        <div className="text-center mt-8! space-y-3!">
          <span
            style={{ color: theme.gold, fontSize: 22, letterSpacing: "0.5em" }}
          >
            ✦ ◆ ✦
          </span>
          <p
            className="font-label text-[11px] font-semibold tracking-[0.4em] uppercase block"
            style={{ color: `${theme.gold}50` }}
          >
            Dietary requirements can be accommodated upon request
          </p>
        </div>
      </div>
    </section>
  );
}
