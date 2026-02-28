# 💍 Wedding Invitation — Next.js + TypeScript + Tailwind CSS v4

A cinematic, interactive wedding invitation built with Next.js 15, TypeScript, Tailwind CSS v4, and GSAP.

---

## Features

| Feature | Details |
|---|---|
| 🎭 Red Velvet Curtain | Opens **on click** only. GSAP-powered sweep with fold textures & gold trim. |
| ✨ Dust Particles | Floating gold particles on a fixed canvas overlay. |
| 🗓 Scratch-to-Reveal | Canvas scratchcard reveals wedding date with confetti burst. |
| 📜 Timeline | Scroll-triggered GSAP animations for each story milestone. |
| 🏛 Venue Details | Intersection Observer fade-in cards. |
| 💌 RSVP | Form with GSAP modal + CSS confetti on submit. |
| 🎆 Finale | ScrollTrigger confetti waves on scroll-into-view. |
| 🎵 Audio Player | Background orchestral audio toggle (bottom-right). Drop your MP3 in `/public/audio/royal.mp3`. |
| 🎨 Themes | **Royal Crimson**, **Midnight Navy**, **Enchanted Forest** — live-switchable via UI or env var. |
| 📐 Parallax | Scroll-driven parallax on the hero section. |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your default theme (optional)
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_WEDDING_THEME=royal   # or midnight | forest

# 3. Add your audio file
cp your-orchestral-music.mp3 public/audio/royal.mp3

# 4. Run dev server
npm run dev
```

---

## Project Structure

```
wedding-invitation/
├── app/
│   ├── globals.css          # Tailwind v4 + CSS theme variables
│   ├── layout.tsx           # Root layout + ThemeProvider
│   └── page.tsx             # Entry point → <WeddingEngine />
│
├── components/
│   ├── WeddingEngine.tsx    # Top-level orchestrator
│   ├── curtain/
│   │   └── VelvetCurtain.tsx
│   ├── effects/
│   │   └── DustParticles.tsx
│   ├── sections/
│   │   ├── ParallaxHero.tsx
│   │   ├── ScratchDate.tsx
│   │   ├── Timeline.tsx
│   │   ├── VenueDetails.tsx
│   │   ├── RSVP.tsx
│   │   └── Finale.tsx
│   └── ui/
│       ├── ThemeSelector.tsx
│       └── AudioPlayer.tsx
│
├── lib/
│   ├── ThemeContext.tsx      # React context for theme
│   └── confetti.ts          # Pure-CSS DOM confetti utility
│
├── themes/
│   └── index.ts             # All theme definitions + active theme
│
├── types/
│   └── theme.ts             # TypeScript interfaces
│
└── public/
    └── audio/
        └── royal.mp3        # ← Drop your orchestral audio here
```

---

## Selecting a Theme

### Option A — Runtime (UI)
Click the **◈ THEME** button (top-right) to switch live.

### Option B — Build-time (env var)
```bash
# .env.local
NEXT_PUBLIC_WEDDING_THEME=midnight   # royal | midnight | forest
```

### Adding a new theme
1. Add an entry to `themes/index.ts`.
2. Add a `[data-theme="yourtheme"]` block in `app/globals.css`.
3. Add it to `ThemeKey` in `types/theme.ts`.

---

## Personalising

- **Names & date** — search for `Isabella`, `Alexander`, `12 • July • 2026` across the components.
- **Venue** — edit `VenueDetails.tsx`.
- **Story** — edit the `EVENTS` array in `Timeline.tsx`.
- **Audio** — replace `/public/audio/royal.mp3`.

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **GSAP 3** + ScrollTrigger
- **Three.js** (available if you want to extend the curtain with 3D)
