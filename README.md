# Ceremonia

**Cinematic event invitations, beautifully hosted.**

Ceremonia is a multi-tenant SaaS platform for creating and hosting cinematic event invitations — weddings, birthdays, baby showers, christenings, bridal showers, housewarmings, anniversaries, graduations, engagements, corporate events, and more. Every event gets its own hosted subdomain, a live split-panel editor, 13 built-in themes, 7 curtain styles, RSVP management with email notifications, a gift registry, guest book, and a curtain-reveal experience guests will remember.

Supports 11 event types with a full vocabulary system that adapts every label, heading, and section to the event context. Tiered pricing (Free → Starter → Pro → Agency) with Stripe subscriptions, plan-gated features, custom domains, white-label branding, and a theme marketplace for Agency subscribers.

**Live demo:** [ceremonia.app/event/demo](https://ceremonia.app/event/demo)

---

## Table of Contents

- [What It Does](#what-it-does)
- [Event Types](#event-types)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Multi-Tenancy & Routing](#multi-tenancy--routing)
- [The Invitation Engine](#the-invitation-engine)
- [Dashboard & Editor](#dashboard--editor)
- [Vocabulary System](#vocabulary-system)
- [Themes](#themes)
- [Plan Gating](#plan-gating)
- [RSVP System](#rsvp-system)
- [File Uploads](#file-uploads)
- [Email Notifications](#email-notifications)
- [Analytics](#analytics)
- [API](#api)
- [Pricing Tiers](#pricing-tiers)
- [Testing](#testing)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## What It Does

Hosts give their event a slug (e.g. `emma-birthday`) and get a fully hosted invitation at `emma-birthday.ceremonia.app`. Guests visit the link, interact with a cinematic curtain reveal, scratch away a foil card to reveal the date, then scroll through a custom invitation — venue details, timeline, menu, dress code, travel guide, registry, and an RSVP form. The host manages everything from a live split-panel editor where every change reflects instantly in an iframe preview.

---

## Event Types

Ceremonia supports 11 event types, each with its own vocabulary that flows through every layer of the application — section headings, editor labels, email notifications, metadata, and invitation copy.

| Event Type      | Emoji | Host Label          | Section Label            |
| --------------- | ----- | ------------------- | ------------------------ |
| `wedding`       | 💍    | Bride / Groom       | Wedding Party            |
| `birthday`      | 🎂    | Celebrant           | Guest of Honour's Circle |
| `baby_shower`   | 🍼    | Mum-to-be / Partner | Our Circle               |
| `christening`   | ✝️    | Parent / Parent     | Godparents & Family      |
| `bridal_shower` | 👰    | Bride-to-be         | Bridal Party             |
| `housewarming`  | 🏠    | Host / Co-host      | Our Circle               |
| `anniversary`   | 🥂    | Partner / Partner   | Our Circle               |
| `graduation`    | 🎓    | Graduate            | Friends & Family         |
| `engagement`    | 💒    | Partner / Partner   | Our Circle               |
| `corporate`     | 💼    | Host                | Team                     |
| `other`         | 🎉    | Host / Co-host      | Our Circle               |

The vocabulary system is the single source of truth for all event-type-specific copy. See [Vocabulary System](#vocabulary-system).

---

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Next.js 15 (App Router, Turbopack)               |
| Language     | TypeScript                                       |
| Styling      | Tailwind CSS v4 (CSS variable token system)      |
| Auth         | Clerk (publicMetadata for plan sync)             |
| Database     | Neon (serverless Postgres) + Drizzle ORM         |
| API          | Elysia + Eden Treaty (type-safe API client)      |
| Payments     | Stripe (subscriptions + one-time)                |
| Storage      | Vercel Blob                                      |
| Email        | Resend                                           |
| Animation    | GSAP (ScrollTrigger, ScrollToPlugin)             |
| Analytics    | PostHog                                          |
| Stock photos | Unsplash + Pixabay (optional, graceful fallback) |
| Icons        | lucide-react                                     |
| Testing      | Vitest (unit + integration), Playwright (E2E)    |
| Runtime      | Bun                                              |
| Hosting      | Vercel                                           |

---

## Architecture

```
ceremonia.app              → marketing + pricing page
app.ceremonia.app          → dashboard (editor, RSVPs, analytics, billing)
[slug].ceremonia.app       → hosted invitation (e.g. emma-birthday.ceremonia.app)
[custom-domain]            → custom domain support (Pro+)
```

The middleware (`proxy.ts`) handles subdomain extraction and rewrites to the correct Next.js route. The dashboard, invitation pages, and API are all served from the same Next.js application.

---

## Project Structure

```
app/
  (dashboard)/
    app/
      dashboard/         → event overview
      editor/[slug]/     → split-panel live editor
      rsvps/             → RSVP management
      analytics/         → view counts, RSVP trends (Pro+)
      billing/           → plan management + Stripe checkout
      settings/          → account, brand name, delete account
  event/
    [slug]/              → hosted invitation page
    preview/             → iframe preview target for the editor
    domain/[host]/       → custom domain redirect handler
  api/
    [[...elysia]]/       → all API routes handled by Elysia
  page.tsx               → marketing + pricing page
  layout.tsx             → root layout (Clerk, fonts, PostHog)

components/
  sections/              → invitation sections (Hero, Countdown, RSVP, etc.)
  curtain/               → 7 curtain reveal animations
  dashboard/editor/      → editor sidebar panels and shell
  EventEngine.tsx      → main invitation renderer

lib/
  eventSections.tsx    → single source of truth for section ordering
  ThemeContext.tsx        → CSS variable injection
  eventHelpers.ts         → getHost1Name, getHost2Name, getHostsLabel

types/
  event.ts               → EventType, EventVocabulary, EVENT_VOCABULARY
  wedding.ts             → EventConfig, all section config interfaces
  theme.ts               → ThemeKey, EventTheme

db/
  schema.ts              → Drizzle table definitions
  migrations/            → SQL migration files
  seed.ts                → demo event seed

server/
  routers/               → Elysia route handlers (events, rsvp, upload, etc.)

emails/
  RSVPNotification.tsx   → React Email template for RSVP notifications

tests/
  unit/                  → Vitest unit tests
  integration/           → Vitest integration tests (Elysia handlers)
  e2e/                   → Playwright end-to-end tests
```

---

## Database Schema

The core table is `events`. Key columns:

```
events
├── id                  uuid PK
├── slug                text UNIQUE         → subdomain
├── eventType           text DEFAULT 'wedding'
├── userId              text FK → users.id
├── bride               text NOT NULL       → host1 display name
├── groom               text NOT NULL       → host2 display name (empty for single-host events)
├── date                date NOT NULL
├── themeKey            text
├── customTheme         jsonb               → EventTheme object
├── curtainStyle        text
├── timeline            jsonb               → TimelineEvent[]
├── menuCourses         jsonb               → Course[]
├── venueDetails        jsonb               → VenueEvent[]
├── rsvpEnabled         boolean
├── rsvpDeadline        date
├── passwordProtected   boolean
├── password            text                → bcrypt hash
├── published           boolean
├── dressCodeEnabled    boolean
├── dressCode           jsonb               → DressCodeConfig
├── accommodationEnabled boolean
├── accommodation       jsonb               → AccommodationConfig
├── eventPartyEnabled boolean
├── eventParty        jsonb               → eventPartyMember[]
├── faqEnabled          boolean
├── faq                 jsonb               → FaqItem[]
├── livestreamEnabled   boolean
├── livestreamUrl       text
├── photoGalleryEnabled boolean
├── galleryPhotos       jsonb               → string[]
├── travelGuideEnabled  boolean
├── travelItems         jsonb               → TravelItem[]
├── registryEnabled     boolean
├── guestBookEnabled    boolean
├── notificationEmail   text
├── viewCount           integer
└── createdAt           timestamp

users
├── id                  text PK             → Clerk user ID
├── email               text
├── stripeCustomerId    text
├── brandName           text                → Agency white-label name
├── plan                plan enum           → free | starter | pro | agency
└── createdAt           timestamp

rsvps
├── id                  uuid PK
├── eventId           uuid FK → events.id
├── name                text
├── attendance          text                → yes | no
├── guests              integer
├── dietary             text
└── createdAt           timestamp

registryItems / registryClaims / guestbook / customThemes
└── ... (see db/schema.ts for full definitions)
```

**Note on `bride`/`groom` columns:** These columns store the host display names for all event types — for a birthday, `bride` holds the celebrant's name and `groom` is empty. The `eventType` column determines how the application interprets and labels these values throughout the UI.

---

## Multi-Tenancy & Routing

**`proxy.ts`** (the Next.js middleware) handles all routing logic:

```
Request: emma-birthday.ceremonia.app
→ Extract subdomain: "emma-birthday"
→ Rewrite to: /event/emma-birthday

Request: my-wedding.com  (custom domain)
→ Not a ceremonia.app subdomain
→ Rewrite to: /event/domain/my-wedding.com
→ Route handler looks up the slug and redirects

Request: app.ceremonia.app/app/dashboard
→ Protected route — Clerk auth.protect()
→ Normal rendering
```

In local development, `demo.localhost:3000` maps to `/event/demo`.

Slug generation is automatic from host names: `Emma` → `emma`, `Emma Turner` → `emma-turner`. If the slug is taken, a timestamp suffix is appended.

---

## The Invitation Engine

`components/EventEngine.tsx` is the root of the public-facing invitation. It:

1. Renders the curtain overlay (one of 7 styles: velvet, drape, sheer, cascade, iris, split, veil)
2. Manages curtain-open state and communicates it to the parent frame via `postMessage`
3. Renders `DustParticles` and `DrapeFrame` atmospheric effects
4. Calls `buildSections()` from `lib/eventSections.tsx` to get the ordered section list
5. Renders each section in a scroll-snapping container with nav dots

**Section ordering** (`lib/eventSections.tsx`):

```
ParallaxHero → ScratchDate → [after date reveal] →
Countdown → Timeline → PhotoGallery → VenueDetails →
DressCode → Accommodation → eventParty → FAQ →
Livestream → TravelGuide → WeddingMenu → RSVP →
Registry → GuestBook → Finale
```

Each section is conditionally included based on `config.*Enabled` flags. All vocabulary (section headings, label copy, finale heading) is derived from `getVocabulary(config.eventType)` at build time in `buildSections`.

---

## Dashboard & Editor

The editor is a split-panel interface: left sidebar (tabbed controls) + right iframe preview.

**`EditorShell.tsx`** orchestrates:

- Holds `config: EventConfig` state
- Sends `PREVIEW_CONFIG` postMessage to the iframe on every change
- Debounce-free — the iframe applies changes via `postMessage` immediately
- Auto-saves on demand; creates a new slug on first save

**`EditorSidebar.tsx`** tabs (labels adapt per event type):

| Tab ID        | Default Label | Adapts?                   |
| ------------- | ------------- | ------------------------- |
| design        | Design        | No                        |
| couple        | Couple        | No                        |
| venue         | Venue         | No                        |
| timeline      | Timeline      | No                        |
| menu          | Menu          | Yes → `vocab.menuLabel`   |
| media         | Media         | No                        |
| gallery       | Gallery       | No                        |
| dresscode     | Attire        | Yes → `vocab.attireLabel` |
| accommodation | Stay          | No                        |
| party         | Party         | Yes → `vocab.partyLabel`  |
| faq           | FAQ           | No                        |
| livestream    | Stream        | No                        |
| travel        | Travel        | No                        |
| rsvp          | RSVP          | No                        |
| registry      | Registry      | No                        |

**`PreviewFrame.tsx`** — the right panel renders an `<iframe>` pointing to `/event/preview`. It listens for `CURTAIN_OPEN` and `DATE_REVEALED` postMessages to show the jump-to-section nav bar. On mobile, the preview opens as a slide-over sheet.

**All tab panels stay mounted** (CSS `hidden` toggle, not conditional render) to prevent rogue API refetches and spurious postMessage emissions on tab switch.

---

## Vocabulary System

The vocabulary system ensures every piece of text in the app adapts to the current event type. The single source of truth is `types/event.ts`.

### `EventVocabulary` interface

```typescript
interface EventVocabulary {
  eventLabel: string; // "Wedding", "Birthday Party", etc.
  host1Label: string; // "Bride", "Celebrant", "Host", etc.
  host2Label?: string; // "Groom", "Partner", etc.
  dualHost: boolean; // Whether a second host field is shown
  partyLabel: string; // "Wedding Party", "Bridal Party", etc.
  menuLabel: string; // "Wedding Menu", "Party Menu", etc.
  menuSubLabel: string; // "Dinner Banquet", "Party Refreshments", etc.
  menuDescription: string; // Subtitle shown in the menu section
  attireLabel: string; // "Dress Code" (same across all types)
  registryLabel: string; // "Wedding Registry", "Baby Registry", etc.
  tagLinePlaceholder: string; // Shown in the ContentEditor tagline field
  finaleHeading: string; // "See You at the Altar", "See You at the Party", etc.
  topLabel: string; // Shown above names in the hero section
  newEventCta: string; // "New Wedding", "New Birthday Party", etc.
  emoji: string; // Shown in dashboard listings
}
```

### Helper functions (`lib/eventHelpers.ts`)

```typescript
getHost1Name(config); // config.host1Name ?? config.bride
getHost2Name(config); // undefined for single-host events
getHostsLabel(config); // "Isabella & Alexander" or just "Emma"
getVocabulary(eventType); // Returns EventVocabulary for the given type
```

### Where vocabulary is applied

- `lib/eventSections.tsx` — section headings, props passed to each section component
- `components/sections/ParallaxHero.tsx` — `topLabel`, conditional `groom` render
- `components/sections/eventParty.tsx` — `sectionLabel`
- `components/sections/WeddingMenu.tsx` — `label`, `subLabel`, `description`
- `components/sections/Finale.tsx` — `finaleHeading`, `showCoupleIllustration`
- `components/sections/Registry.tsx` — `label`
- `components/sections/Countdown.tsx` — `eventLabel`
- `components/sections/RSVP.tsx` — `eventLabel`
- `components/dashboard/editor/ContentEditor.tsx` — field labels, section heading
- `components/dashboard/editor/EditorSidebar.tsx` — tab labels
- `components/dashboard/editor/MenuEditor.tsx` — section heading
- `components/dashboard/editor/eventPartyEditor.tsx` — section heading, role list
- `components/dashboard/editor/NewEventDialog.tsx` — host field labels, event type picker
- `app/event/[slug]/page.tsx` — `<title>`, OpenGraph, description
- `app/(dashboard)/app/editor/[slug]/page.tsx` — editor page title
- `app/event/domain/[host]/page.tsx` — custom domain page title
- `emails/RSVPNotification.tsx` — email subject + body copy
- `app/(dashboard)/app/rsvps/RSVPsClient.tsx` — per-event subtitle + selector
- `app/(dashboard)/app/analytics/AnalyticsClient.tsx` — per-event card headings

---

## Themes

13 built-in themes, each defining a complete set of CSS custom property values:

| Key          | Name                   |
| ------------ | ---------------------- |
| `royal`      | Royal Velvet (default) |
| `midnight`   | Midnight Garden        |
| `forest`     | Forest Sage            |
| `blush`      | Blush Romance          |
| `slate`      | Slate & Steel          |
| `desert`     | Desert Sand            |
| `celestial`  | Celestial              |
| `noir`       | Noir                   |
| `ivory`      | Ivory Light            |
| `sakura`     | Sakura Bloom           |
| `obsidian`   | Obsidian Edge          |
| `terracotta` | Terracotta Dusk        |
| `sage`       | Sage & Silver          |

Each theme sets: `curtain`, `curtainDark`, `curtainSheen`, `gold`, `goldLight`, `bg`, `bgMid`, `text`, `particle`.

**Custom themes** (Pro+) are saved to the `customThemes` table and can be applied in place of built-in themes. The `ThemeCustomiser` component sends live `THEME_UPDATE` postMessages to the preview iframe so colour changes are reflected in real time.

The active theme is injected as CSS custom properties via `ThemeProvider` and a `data-theme` attribute on the root element.

---

## Plan Gating

Feature access is controlled by `lib/plans.ts`. The `PLAN_FEATURES` object maps each plan to its allowed features.

### Plan tiers

| Feature                  | Free | Starter | Pro       | Agency    |
| ------------------------ | ---- | ------- | --------- | --------- |
| Max events               | 1    | 1       | 5         | Unlimited |
| Built-in themes          | 3    | All     | All       | All       |
| Curtain styles           | 1    | All     | All       | All       |
| Custom audio             | ✗    | ✓       | ✓         | ✓         |
| Unlimited RSVPs          | ✗    | ✓       | ✓         | ✓         |
| RSVP email notifications | ✗    | ✓       | ✓         | ✓         |
| Registry (item limit)    | 10   | 30      | Unlimited | Unlimited |
| Custom theme builder     | ✗    | ✗       | ✓         | ✓         |
| Password protection      | ✗    | ✗       | ✓         | ✓         |
| Analytics dashboard      | ✗    | ✗       | ✓         | ✓         |
| CSV RSVP export          | ✗    | ✗       | ✓         | ✓         |
| Custom domain            | ✗    | ✗       | ✓         | ✓         |
| White-label              | ✗    | ✗       | ✗         | ✓         |
| API access               | ✗    | ✗       | ✗         | ✓         |
| Watermark                | ✓    | ✗       | ✗         | ✗         |

### How gating works

Server-side: The Elysia router fetches the owner's plan from `users` and checks `PLAN_FEATURES[plan].featureName` before allowing writes. Returns `403` with a descriptive message on violations.

Client-side: The `PlanGate` component and `usePlan()` hook (reads from Clerk `publicMetadata`) conditionally render upgrade prompts. Plan is synced from Stripe webhooks → DB → Clerk `publicMetadata` to ensure the client always reflects the current subscription state.

---

## RSVP System

Guests submit RSVPs via the `RSVP` section component. The flow:

1. Guest fills in name, attendance (yes/no), guest count, dietary requirements
2. `POST /api/rsvp` — validates the event is published and RSVPs are enabled
3. Checks free plan RSVP cap (20 max) if applicable
4. Saves to `rsvps` table
5. If owner is on Starter+ and has a `notificationEmail`, fires a Resend email asynchronously (non-blocking)
6. Fires a PostHog `rsvp_submitted` event

The host views RSVPs in `/app/rsvps`. Pro+ users can export to CSV via `GET /api/rsvp/export`.

When RSVPs are closed (`rsvpEnabled: false`), the section renders a closed state instead of the form.

---

## File Uploads

All media is stored in **Vercel Blob**. The upload API at `POST /api/upload` accepts:

- `photo` — hero photo, gallery images, party member photos
- `audio` — background music (Starter+ only)

Uploads are gated by plan. The UI (`ImageUploadField`, `MediaUploader`) provides three input modes: drag-and-drop file, URL paste with SSRF protection, and stock photo search (Unsplash + Pixabay, with a curated fallback if API keys are absent).

---

## Email Notifications

RSVP emails are sent via **Resend** using a React Email template (`emails/RSVPNotification.tsx`). The email adapts to event type — "your wedding invitation" becomes "your birthday party invitation" etc.

Emails are sent from `rsvp@ceremonia.app` and include guest name, attendance, guest count, and dietary requirements.

---

## Analytics

PostHog is used for both client-side and server-side event tracking. Events include:

| Event                    | When                              |
| ------------------------ | --------------------------------- |
| `rsvp_submitted`         | Guest submits the RSVP form       |
| `event_created`          | Host creates a new event          |
| `event_saved`            | Host saves changes in the editor  |
| `checkout_initiated`     | Host clicks to upgrade            |
| `subscription_created`   | Stripe webhook — new subscription |
| `subscription_cancelled` | Stripe webhook — cancellation     |
| `payment_completed`      | Stripe webhook — one-time payment |
| `plan_limit_hit`         | Any plan gate is triggered        |
| `event_unlocked`         | Guest enters correct password     |

PostHog is proxied through `/api/ingest` to avoid ad blockers. Initialisation is deferred to avoid Turbopack timing issues.

The in-app analytics page (`/app/analytics`, Pro+) shows view counts and RSVP performance per event.

---

## API

All API routes are handled by a single Elysia app mounted at `app/api/[[...elysia]]/route.ts`. The Eden Treaty client (`useApi()` hook) provides full type safety end-to-end with no code generation step.

### Route overview

```
GET    /api/events              → list user's events
POST   /api/events              → create event
GET    /api/events/:slug        → get event (owner only)
PATCH  /api/events/:slug        → update event (plan-gated fields)
DELETE /api/events/:slug        → delete event

POST   /api/rsvp                  → submit RSVP (public)
GET    /api/rsvp?eventId=       → list RSVPs for event (owner)
GET    /api/rsvp/export?eventId= → CSV export (Pro+)

POST   /api/upload                → upload photo or audio
POST   /api/upload/from-url       → import media from URL

GET    /api/stock/photos          → search stock photos
GET    /api/stock/audio           → search stock audio

GET    /api/registry/:eventId   → list registry items (owner)
POST   /api/registry/:eventId   → add item
PATCH  /api/registry/:id          → update item
DELETE /api/registry/:id          → delete item
GET    /api/registry/public/:slug → public registry view
POST   /api/registry/claim        → guest claims an item
DELETE /api/registry/claim        → guest unclaims an item
POST   /api/registry/confirm-purchase → mark as purchased
POST   /api/registry/scrape       → scrape product URL (Starter+)

GET    /api/custom-themes         → list saved themes (Pro+)
POST   /api/custom-themes         → save theme
PATCH  /api/custom-themes/:id     → update theme
DELETE /api/custom-themes/:id     → delete theme

GET    /api/guestbook/:slug       → list messages (public)
POST   /api/guestbook/:slug       → post message (public, Pro+)
DELETE /api/guestbook/:slug/:id   → delete message (owner)

GET    /api/settings              → get user profile
PATCH  /api/settings              → update brand name
DELETE /api/settings/account      → delete account

POST   /api/billing/checkout      → create Stripe checkout session
POST   /api/billing/portal        → open Stripe billing portal

POST   /api/webhooks/clerk        → sync Clerk user to DB
POST   /api/webhooks/stripe       → sync Stripe plan to DB + Clerk
```

Bearer token auth is used throughout (Clerk session token via `useAuth().getToken()`).

---

## Pricing Tiers

| Plan    | Price             | Events    | Key Features                                                      |
| ------- | ----------------- | --------- | ----------------------------------------------------------------- |
| Free    | $0                | 1         | 3 themes, 20 RSVPs, watermark                                     |
| Starter | $9/mo or $29 once | 1         | All themes, audio, unlimited RSVPs, no watermark                  |
| Pro     | $19/mo            | 5         | Custom themes, analytics, CSV, custom domain, password protection |
| Agency  | $79/mo            | Unlimited | White-label, API access, client management                        |

Stripe products are created with `bun run scripts/setup-stripe.ts` which outputs price IDs to `.env.stripe.local`.

---

## Testing

```bash
bun run test:unit          # Vitest unit tests
bun run test:integration   # Vitest integration tests (API handlers)
bun run test:e2e           # Playwright E2E tests
bun run test               # unit + e2e
bun run test:unit:coverage # Coverage report
```

### Test layers

**Unit tests** (`tests/unit/`) cover pure logic: theme definitions, plan feature flags, plan ordering, subdomain extraction, vocabulary coverage, event helper functions, and component rendering.

**Integration tests** (`tests/integration/`) test the Elysia route handlers directly via `app.handle()`. The DB, Clerk auth, and Vercel Blob are mocked with Vitest. Coverage includes auth gating, plan gating, RSVP submission, upload validation, and all CRUD operations.

**E2E tests** (`tests/e2e/`) use Playwright against a running dev/preview server. The `/event/demo` route is the primary anchor — it renders `DEMO_EVENT_CONFIG` without auth or DB, making it a stable test target. Auth-gated dashboard tests require `tests/e2e/.auth/user.json` (generated by `auth.setup.ts`).

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.x
- A [Neon](https://neon.tech) Postgres database (or local Docker Postgres)
- A [Clerk](https://clerk.com) application
- A [Stripe](https://stripe.com) account
- A [Resend](https://resend.com) account
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store

### Installation

```bash
git clone https://github.com/your-org/ceremonia
cd ceremonia
bun install
```

### Database setup

```bash
# Copy the example env file
cp .env.local.example .env.local
# Fill in your DATABASE_URL, then:

bun run db:migrate   # Run all migrations
bun run db:seed      # Seed the demo event
```

### Stripe products

```bash
bun run scripts/setup-stripe.ts
# Copy the output price IDs into .env.local
```

### Dev server

```bash
bun run dev
```

Visit `http://localhost:3000` for the marketing page and `http://localhost:3000/app/dashboard` for the editor. The demo invitation is at `http://localhost:3000/event/demo`.

To test subdomain routing locally, use `demo.localhost:3000` in a browser that supports it, or configure your `/etc/hosts`.

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=ceremonia.app

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_STARTER_ONCE=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY=price_...

# Resend
RESEND_API_KEY=re_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Stock photos (optional — graceful fallback if absent)
UNSPLASH_ACCESS_KEY=...
PIXABAY_API_KEY=...

# Theme default
NEXT_PUBLIC_WEDDING_THEME=royal
```

---

## Scripts

| Command                           | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `bun run dev`                     | Start dev server with Turbopack                |
| `bun run build`                   | Production build                               |
| `bun run start`                   | Start production server                        |
| `bun run lint`                    | ESLint                                         |
| `bun run db:generate`             | Generate Drizzle migration from schema changes |
| `bun run db:migrate`              | Apply all pending migrations                   |
| `bun run db:push`                 | Push schema directly (dev only)                |
| `bun run db:studio`               | Open Drizzle Studio                            |
| `bun run db:seed`                 | Seed demo event                                |
| `bun run test:unit`               | Run unit tests                                 |
| `bun run test:unit:watch`         | Unit tests in watch mode                       |
| `bun run test:unit:coverage`      | Unit test coverage report                      |
| `bun run test:integration`        | Run integration tests                          |
| `bun run test:e2e`                | Run Playwright E2E tests                       |
| `bun run test:e2e:ui`             | Playwright UI mode                             |
| `bun run test`                    | Unit + E2E                                     |
| `bun run scripts/setup-stripe.ts` | Create Stripe products and price IDs           |

---

## Deployment

The project is designed for **Vercel** deployment.

1. Connect the repo in the Vercel dashboard
2. Set all environment variables in project settings
3. Configure Vercel Blob storage and paste the `BLOB_READ_WRITE_TOKEN`
4. Add a wildcard domain `*.ceremonia.app` in Vercel domain settings for subdomain routing
5. Add Clerk webhook pointing to `https://ceremonia.app/api/webhooks/clerk`
6. Add Stripe webhook pointing to `https://ceremonia.app/api/webhooks/stripe`

The app uses ISR (`revalidate = 60`) on invitation pages, so published event pages are fast without being stale.

**CI** is handled by `.github/workflows/ci.yml` — it runs `db:migrate`, `db:seed`, builds the app, and runs Playwright tests on every push.

---

## Key Design Decisions

**`bride`/`groom` column names are kept** even though the platform supports all event types. Renaming them would require a large migration with no user-facing benefit. The `eventType` column carries the semantic meaning; `bride`/`groom` are treated as `host1`/`host2` at the application layer via `lib/eventHelpers.ts`.

**Always-mounted tab panels** — the editor sidebar uses CSS `hidden` toggling instead of conditional rendering. This prevents remount side effects (API calls, postMessage emissions) when switching tabs.

**`postMessage` as the iframe contract** — all editor↔preview communication flows through typed message events. The preview iframe never re-mounts when config changes; it receives `PREVIEW_CONFIG` messages and applies them in place. This preserves curtain-open and date-revealed state across edits.

**Single source of truth** — `lib/eventSections.tsx` is the only place that decides which sections exist and in what order. `types/event.ts` is the only place that defines event-type vocabulary. Neither is duplicated anywhere else.

**Plan sync via Clerk publicMetadata** — Stripe webhook handlers write plan changes to both the DB and Clerk `publicMetadata`. This means the client-side `usePlan()` hook always reads a fresh value without an extra DB round-trip.
