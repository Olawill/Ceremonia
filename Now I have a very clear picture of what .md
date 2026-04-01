Now I have a very clear picture of what that sandbox is doing and what makes it look so good. Here's the full summary:

---

## What makes that scene realistic — and how to replicate it

### What the sandbox actually is

The sandbox is Bruno Simon's **Three.js Journey Level 1** scene — a fully modelled, textured room with furniture, props, and baked lighting — viewed through a **fisheye lens effect** built with drei's `<RenderCubeTexture>`. The scene itself is a `.glb` file exported from Blender, not procedurally generated geometry. The realism comes almost entirely from **Blender + baked lighting**, not from real-time Three.js rendering tricks.

---

### The two pillars of realistic 3D: GLTF models + baked textures

**Pillar 1 — GLTF models from Blender**

The room is a single `.glb` file containing all geometry: walls, floor, ceiling, furniture, decorations, light fixtures — every surface modelled with proper proportions, bevels, and UV maps. Procedurally generated `BoxGeometry` and `PlaneGeometry` primitives (what Ceremonia currently uses) look like a game from 2004 because there's no surface detail, no variation, no real proportions.

**Pillar 2 — Baked lighting textures**

This is the single biggest quality multiplier. In Blender you place real lights, run a full path-trace render (which can take minutes), and the result — shadows, bounce light, ambient occlusion, glossy reflections — gets baked into a single texture map applied to the geometry with `MeshBasicMaterial`. Because `MeshBasicMaterial` needs no lights at runtime, the GPU does almost no lighting work. The scene renders fast and looks photorealistic because the lighting information is already embedded in the pixels.

```
// After baking in Blender, the Three.js code is this simple:
const bakedTexture = useTexture('/room-baked.jpg')
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Apply to everything in the loaded GLTF
gltf.scene.traverse((child) => {
  if (child.isMesh) child.material = bakedMaterial
})
```

No lights. No shadows. No uniforms. Just a texture lookup. That's it.

---

### The fisheye effect (the creative flourish on top)

The fisheye is a post-processing trick using drei's `<RenderCubeTexture>`:

1. A `CubeCamera` renders the entire scene into 6 faces of a cube render target (like a 360° photograph)
2. That cube texture is applied as the `envMap` of a large sphere that fills the screen
3. The sphere's curved surface distorts the image into a fisheye projection
4. An `OrthographicCamera` films the sphere dead-on

```tsx
<RenderCubeTexture>
  {/* your entire scene goes here */}
  <primitive object={gltf.scene} />
</RenderCubeTexture>
```

The key insight from the author (drcmda, creator of R3F): `fbo.texture.isRenderTargetTexture = false` — this undocumented flag stops Three.js from flipping the cubemap, which it does by default and which ruins the effect.

---

### What Ceremonia needs to do to achieve this quality

**Step 1 — Model a corridor/hallway in Blender**

Build one room segment in Blender: ornate plaster walls, herringbone or marble floor, coffered ceiling, arched doorway, sconce fixtures, carpet runner, wainscoting. Export as `.glb`. This is a one-time asset creation step — the same model tiled for all rooms.

**Step 2 — Bake lighting in Blender**

Place warm point lights at each sconce and chandelier. Set up Cycles path-tracing. Bake the result to a UV texture at 2048×2048. Export the baked texture as a `.jpg`. The resulting file is typically 300–800KB. This is the step that makes everything look photorealistic — no amount of real-time Three.js tricks can match it.

**Step 3 — Load in R3F with MeshBasicMaterial**

```tsx
function Room() {
  const { scene } = useGLTF("/models/room.glb");
  const bakedTex = useTexture("/textures/room-baked.jpg");
  bakedTex.flipY = false; // GLTF UV coordinates are flipped vs Three.js default

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({ map: bakedTex });
      }
    });
  }, [scene, bakedTex]);

  return <primitive object={scene} dispose={null} />;
}
```

**Step 4 — Add emissive meshes for light sources**

Sconce globes, candle flames, chandelier crystals get `MeshStandardMaterial` with `emissive` colour and `emissiveIntensity` — they glow without needing actual lights in the scene.

```tsx
<mesh>
  <sphereGeometry args={[0.07, 12, 10]} />
  <meshStandardMaterial
    color="#f5d080"
    emissive="#f5d080"
    emissiveIntensity={2.0}
  />
</mesh>
```

**Step 5 — One optional environment map for reflective surfaces**

For marble floors or gold fixtures that need reflections, add a single low-resolution HDR environment map. Drei makes this one line:

```tsx
<Environment preset="apartment" />
// or a custom HDR:
<Environment files="/textures/interior.hdr" />
```

**Step 6 — HTML panels for section content via drei's `<Html>`**

Instead of canvas-drawn text textures, use `<Html>` from drei to project real DOM elements into the 3D space:

```tsx
import { Html } from "@react-three/drei";

function RoomContent({ section }) {
  return (
    <Html
      position={[0, 0, 0.3]}
      transform
      occlude
      style={{ width: 380, pointerEvents: "auto" }}
    >
      {section.node}
    </Html>
  );
}
```

Real fonts. Real CSS. Crisp at any resolution. No more blurry canvas text.

---

### The complete technology stack for the rewrite

| Concern               | Tool                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| 3D modelling          | Blender (free) — one corridor segment                                      |
| Baked lighting        | Blender Cycles path-tracer                                                 |
| Runtime rendering     | R3F v9 + `@react-three/drei`                                               |
| Model loading         | `useGLTF` (cached, suspense-ready)                                         |
| Textures              | `useTexture` (cached)                                                      |
| Section content in 3D | `<Html transform>` from drei                                               |
| Camera spring         | `useFrame` with lerp + `invalidate()`                                      |
| Performance           | `frameloop="demand"`, `PerformanceMonitor`, `MeshBasicMaterial` everywhere |
| Emissive lights       | `MeshStandardMaterial` with `emissive` only — no point lights needed       |

---

### Why the current engine can't look this good without the model

No amount of code changes to the current procedural engine will match baked lighting quality. The current engine generates geometry algorithmically — flat `PlaneGeometry` walls with `CanvasTexture` patterns. Baked lighting in Blender produces physically accurate inter-reflections, soft shadows under furniture, warm light spill from sconces, and ambient occlusion in corners. These effects require a path tracer to compute — they can't be approximated with real-time `PointLight` in a browser.

The modelling work in Blender is the investment that unlocks everything else. Once a single `.glb` corridor with a baked texture exists, the R3F code to display it is surprisingly simple — about 30 lines as shown above.

# Ceremonia 3D Rooms — Blender Scene Design Prompt

---

## Global Art Direction

**Style:** Cinematic luxury interior — warm candlelit stone-and-velvet palace aesthetic. Every room shares the same architectural DNA: vaulted stone ceilings, ornate gold trim, dark hardwood or marble floors, arched Gothic doorways. Rooms feel like chambers in a grand estate or castle, each themed to its content purpose.

**Lighting philosophy:** All ambient and architectural lighting is **baked in Blender Cycles** (2048×2048 per room, possibly 4096 for hero rooms). Only emissive surfaces (candles, screens, globes, neon) are real-time. Zero real-time point lights except for interactive glows.

**Materials:** Every static surface uses a single baked texture applied with `MeshBasicMaterial`. Interactive or glowing elements use `MeshStandardMaterial` with `emissive` only — no runtime lights needed.

**Colour palette:** Deep burgundy/wine, near-black stone, aged ivory, warm gold accents. Each room introduces one accent colour tied to its theme (blue for venue, green for travel, red for party, etc.).

**Scale:** Each room is roughly 9m wide × 14m deep × 4.5m tall, connected by a narrowing stone corridor 2.8m wide × 3.5m long. Every room has an ornate arched door at the front wall, with a brass nameplate showing the room number and room name.

**Door system:** Every room's front-facing arch has a physical wooden door with:

- A brass number plate (01, 02, 03…) in the top centre
- An engraved room name plaque below the number
- A gold door handle
- For locked rooms (any room past Room 02 before the scratch date is revealed): the door has a visible padlock, a red glowing seal, and the handle does not move when approached. An attempt to open it shows the padlock rattle and a particle burst, then bounces back.
- For unlocked rooms: the door swings open with a creak as the camera approaches, revealing the next corridor.

---

## Room 01 — Parallax Hero (Opening / Welcome)

**Room name on door:** "The Grand Entrance"

**Concept:** The exterior of a large stone castle, farm, arcade, garden, or beach scene (configurable per event type). The camera approaches through iron gates or hedgerows. The welcome banner hangs on the outside façade of the building like a giant ceremonial drape — a long tapestry suspended from iron hooks above the main arch.

**Scene breakdown:**

- **Castle variant (wedding/engagement):** Grey stone castle exterior at golden hour. A massive deep burgundy velvet banner with gold rope fringe drapes down the full height of the front wall, with the couple's names embroidered in gold script, the date, and tagline. Stone gargoyles flank the gate. Rose petals drift upward.
- **Farm variant (birthday/anniversary):** Red barn with weathered timber and wildflower meadow. A painted canvas banner stretched between two barn posts, hand-lettered style. String lights between the posts. Hay bales stacked as decoration.
- **Arcade variant (graduation/corporate):** Neon-lit arcade façade, pixel-art style marquee above the door spelling out the event name. Flashing lights, coin tokens scattered on the floor.
- **Garden variant (baby shower/christening/bridal shower):** White pergola covered in climbing roses and wisteria. The welcome banner hangs as a floral wreath with the event details woven into the design.
- **Beach variant (housewarming/casual):** Weathered wooden beach hut with a sun-bleached banner tied to the veranda posts. Seashells on the steps, soft sand floor, ocean visible in the background.

**Banner content displayed:** Host name(s), event tagline, event date, top label (e.g. "Together in Love").

**Animation:** The banner sways gently in a simulated breeze. Particles (rose petals / fireflies / confetti / bubbles depending on variant) drift across the scene. The camera slowly dollies forward as if arriving.

**Interactivity:** None — purely cinematic. Advances to the next room on any tap/click.

---

## Room 02 — Scratch Date (Date Reveal)

**Room name on door:** "The Vault"

**Concept:** A private study or vault room. Dark mahogany panelling, green banker's lamp on a desk, leather-bound books on shelves. In the centre of the room sits a heavy antique writing desk. On the desk surface is a large square card with a silver scratch-panel finish — like a lottery scratch card but the size of an A4 sheet, mounted in an ornate frame, sitting on dark green felt.

**Scene breakdown:**

- The desk is centred in the room, lit by the banker's lamp (emissive glow on the lamp shade casting warm green-yellow light onto the desk surface — baked).
- The scratch card on the desk has the text "Scratch to Reveal" engraved in the silver panel surround, with a small gold ✦ symbol.
- When the user scratches (pointer drag), the silver panel reveals the date beneath, done via a real-time canvas mask as currently implemented, but now projected as a texture on the desk surface geometry.
- Surrounding the card on the desk: a wax seal stamp, a quill pen, an ink pot, scattered gold coins — all modelled props.
- Bookshelves line the side walls, filled with leather-bound books of various sizes.
- A magnifying glass sits beside the card for thematic effect.

**Lock behaviour:** This is Room 02. All rooms past this door are locked until the scratch reveals the date. Once revealed:

- The card glows gold and lifts slightly off the desk (emissive + scale animation).
- The lamp light changes from green to warm gold.
- An audible "seal broken" particle burst (golden sparks) emanates from the card.
- All subsequent room doors unlock (the padlock meshes disappear).

**Navigation:** The guest can move past this room to the corridor even without scratching — but all doors beyond are sealed. The corridor doors show the padlock effect on approach.

---

## Room 03 — Countdown

**Room name on door:** "The Clock Tower"

**Concept:** A stone clock tower chamber. Rough-hewn stone walls with narrow lancet windows showing a starry sky. Four large grandfather clock faces mounted on each of the four walls — one for Days, one for Hours, one for Minutes, one for Seconds. Each clock has its own Roman numeral face, brass hands, and pendulum visible through a glass panel below.

**Scene breakdown:**

- **Four wall clocks:** Each is a full grandfather clock built into the wall, with the clock face showing the relevant countdown unit. The clock face renders the current number in the countdown using a real-time `CanvasTexture` on the clock face geometry only — everything else is baked.
  - North wall (back): **DAYS** — largest clock, most ornate, with a moon phase complication at the top.
  - East wall (right): **HOURS** — slightly smaller, brass filigree frame.
  - West wall (left): **MINUTES** — matching the hours clock, mirror image.
  - South wall (front, beside door): **SECONDS** — smallest, ticking rapidly, with a visible pendulum swinging.
- **Floor centrepiece:** A round compass rose inlaid into the stone floor in gold and black marble, with the event date and venue location engraved around the circumference.
- **Windows:** Each lancet window shows a static baked night sky with a crescent moon silhouette.
- **Date and location plaque:** A stone tablet mounted on the back wall below the Days clock, with the event date and venue carved into it — baked into the texture.
- **Pendulums:** The seconds clock pendulum swings using a simple `useFrame` rotation — the only real-time mesh animation.

**Interactivity:** None — purely informational. Time updates every second via canvas texture update on the four clock faces only.

---

## Room 04 — Timeline (Our Story)

**Room name on door:** "The Gallery of Moments"

**Concept:** A dimly lit photography studio or darkroom aesthetic. Red safelight glows. Photographs hang from clips on washing lines strung across the room. The back wall has a large lightbox display.

**Scene breakdown:**

- **Washing lines:** 2–3 strings of wire strung across the room width, photos hanging from bulldog clips. Each photo is a timeline event rendered as a polaroid-style physical card hanging at a slight angle. The cards sway gently.
- **Polaroid cards:** Each card shows the event year at the top (in marker pen style), a placeholder image area (grey with a ✦ icon if no image), and a handwritten-style caption. Cards have a slight curl and crease baked into the geometry (slightly bent plane with normal map).
- **Interaction:** Clicking a polaroid card triggers a **camera roll animation** — the camera glides forward and the card expands to fill the screen like opening a contact sheet. In this expanded view, the full event details (year, icon, title, description) are displayed as a physical printed sheet. Left/right navigation arrows let the guest flip through the timeline in order. Closing returns to the room view.
- **Back wall lightbox:** A large illuminated white panel (emissive) with the word "Our Story" in large stencil letters.
- **Floor:** Dark wood herringbone, baked with amber spotlights from above.
- **Ceiling:** Industrial-style with exposed pipes and Edison bulb strings.

**Lock:** Room is hidden/door sealed if `timelineEnabled` is false.

---

## Room 05 — Gallery (Photo Gallery)

**Room name on door:** "The Exhibition"

**Concept:** A modern art gallery white cube space, but with warm gold picture rails and ornate frames. Clean white-washed walls with gallery spotlights (baked).

**Scene breakdown:**

- **Side walls:** Large framed photographs mounted at eye level, evenly spaced with gallery labels below each one. Each frame has a gold frame moulding, white mat board, and the guest's uploaded photo displayed inside using a real-time texture loaded from the image URL.
- **Back wall:** One large hero photograph, double the size of the others, centred with a dramatic spotlight.
- **Gallery labels:** Small white cards below each frame with a typed caption if provided, in the style of a museum label.
- **Floor:** Polished concrete or pale marble, baked.
- **Interaction:** Clicking any photograph expands it to a full-screen lightbox view (same camera-roll mechanic as timeline room), with navigation to browse all gallery images in sequence. The expanded view feels like looking at a print through a jeweller's loupe.
- **Gallery bench:** A low padded bench in the centre of the room for visual composition.

**Lock:** Door sealed if `photoGalleryEnabled` is false or no photos uploaded.

---

## Room 06 — Venue Details

**Room name on door:** "The Map Room"

**Concept:** An explorer's cartography room. Large antique maps pinned to boards, a globe, a compass, scattered navigation instruments. The room feels like an admiral's chart room aboard a tall ship, or a Victorian geography society.

**Scene breakdown:**

- **Back wall:** A massive hand-drawn illustrated map of the venue region (generated as a canvas texture styled as a parchment map with stylised geography). The venue location is marked with a large red pin and a flag reading the venue name.
- **Central table:** A large table with a detailed diorama model of the venue building sitting on it — a simple 3D block model with the venue name engraved on a plaque at its base. Surrounding it are miniature compass roses, rulers, and wax seals.
- **Left wall:** A tall wooden notice board with pinned cards for each `VenueEvent` entry (Ceremony, Reception, Location). Each card is a physical index card with the label, value, and sub-text written in quill-pen style. Cards are pinned at slight angles.
- **Right wall:** A large framed window or porthole showing an illustrated exterior view of the venue environment (forest, cityscape, coast — chosen based on venue location).
- **Globe:** A spinning antique globe on a brass stand in the corner, with the venue country highlighted in gold — simple emissive overlay updated at runtime.
- **Ceiling:** Exposed timber beams with hanging navigation lanterns (emissive).

**Interactivity:** Clicking the map zooms in to show a more detailed venue area view. Clicking a pinned card highlights it and shows the full venue detail in a close-up view.

---

## Room 07 — Dress Code

**Room name on door:** "The Atelier"

**Concept:** A high-fashion atelier or runway space. Polished runway floor, dramatic lighting (baked), fashion house aesthetic.

**Scene breakdown:**

- **Central runway:** A raised platform runs the length of the room like a fashion show catwalk. On it stand 2–4 mannequins dressed in outfits coloured to match the `colourPalette` entries. Each mannequin holds a small placard with the dress code style name. The mannequins are simple but elegant — smooth white forms with coloured fabric geometry draped over them.
- **Fashion walk animation:** The mannequins are animated in a slow looping walk cycle down the runway using baked keyframe animation in the GLTF. If no animation is possible, a gentle swaying idle pose is used.
- **Side walls (avoid colours):** On each side wall hang large printed posters in the style of old Western "WANTED" criminal posters — sepia-toned, torn edges, dramatic typography. Each poster shows a colour swatch in the centre (the avoid colour), with "AVOID" written in bold across the top and the colour hex/name below. Posters are slightly crooked, some torn.
- **Back wall:** A large ornate mirror framed in gold with the dress code style name and description engraved on a placard below it.
- **Floor:** Glossy black runway floor, baked with spotlight reflections.
- **Ceiling:** Row of stage PAR cans (theatrical spotlights) pointing down at the runway — emissive.
- **Notes card:** A folded tent card on a small side table near the entrance with the dress code `notes` field printed on it.

**Lock:** Door sealed if `dressCodeEnabled` is false.

---

## Room 08 — Accommodation

**Room name on door:** "The Concierge"

**Concept:** A grand hotel lobby from the 1920s golden age. Marble floors, a reception desk, brass bell, key hooks on the wall, potted palms.

**Scene breakdown:**

- **Reception desk:** A large carved wooden front desk centred in the room. Behind it stands a concierge figurine (simple low-poly character). On the desk surface: a brass bell, a leather-bound guest register, a pen holder.
- **Key wall:** Behind the desk, a wall of numbered wooden key hooks. Each hook corresponds to an accommodation option. The hook for each hotel has a large ornate room key hanging from it, with a tag showing the hotel name. Clicking a key "takes" it and a card flies out showing the full hotel details.
- **Hotel cards:** Each accommodation option gets a physical hotel room card displayed on the desk, fanned out like a hand of playing cards. Each card shows the hotel name, stars, price, distance. Clicking flips it over to show address, booking code, booking deadline, and a "Book Now" button.
- **Lobby details:** Brass chandelier (emissive), marble floor with geometric inlay pattern, potted palms in brass urns, a grandfather clock in the corner. Framed hotel illustrations on the walls (one per accommodation option, showing the hotel building).
- **Intro text:** The `accommodation.intro` field is displayed as an embossed notice in a brass frame mounted on the desk front.

**Lock:** Door sealed if `accommodationEnabled` is false or no options provided.

---

## Room 09 — Event Party (Wedding/Event Party)

**Room name on door:** "The Portraits Hall"

**Concept:** A portrait hall like those found in stately homes — long room with high ceilings, each wall dedicated to one side of the event party.

**Scene breakdown:**

- **Wall allocation:** The room has as many portrait walls as there are distinct `side` values in the event party (bride's side, groom's side, or both). Each wall is richly decorated with a coloured dado rail in the host's signature colour.
- **Portrait frames:** Each event party member gets an oil-painting-style portrait frame on their host's wall. The frame is large and ornate with gold leaf moulding. Inside:
  - If a `photoUrl` is provided: the photo is shown with an oil-painting post-processing treatment (canvas texture with painterly overlay).
  - If no photo: a silhouette portrait in the appropriate colour with the member's initials.
  - Below the frame: a brass nameplate engraved with the member's name, role (in small caps), and relation.
- **Frame arrangement:** Frames are arranged in a grid on the wall, sized proportionally — larger for Maid of Honour / Best Man, smaller for bridesmaids/groomsmen.
- **Room divider:** A low carved wooden balustrade runs down the centre of the room, dividing bride's side (left) from groom's side (right).
- **Ceiling:** Coffered ceiling with central rose medallion, painted with a celestial mural — baked.
- **Floor:** Herringbone parquet, baked with afternoon light from tall windows on the end wall.
- **Interactivity:** Clicking a portrait frame shows a close-up view with the member's full details (name, role, relation) displayed on a pull-cord card that drops from the bottom of the frame.

**Lock:** Door sealed if `eventPartyEnabled` is false or no members provided.

---

## Room 10 — FAQ

**Room name on door:** "The Library"

**Concept:** A private members' library. Dark oak shelves floor to ceiling, rolling library ladder, deep leather armchairs, fireplace.

**Scene breakdown:**

- **Central table:** A large reading table with a single enormous leather-bound binder on it. The binder cover is embossed with "Frequently Asked Questions" in gold foil. The binder is the size of a coffee table book — clearly the centrepiece.
- **Interaction:** Clicking the binder causes it to swing open with a satisfying page-rustle animation (GLTF keyframe or simple rotation on the cover mesh). Inside, the pages are actual rendered DOM content via `<Html>` — the FAQ accordion component, styled to look like typed pages with hand-written margin notes.
- **Background:** Full library shelves with book spines visible (baked). A roaring fireplace on the side wall with animated emissive flicker. A globe in the corner. A reading lamp (emissive) on the table beside the binder.
- **Armchairs:** Two leather armchairs flank the table for atmospheric composition.

**Lock:** Door sealed if `faqEnabled` is false or no items provided.

---

## Room 11 — RSVP

**Room name on door:** "The Registry Office"

**Concept:** A formal registry or administration room. High clerk's desk, official stamps, wax seals, scrolled certificates.

**Scene breakdown:**

- **Central table:** Same heavy table as the FAQ room but different binder — this one is red leather with "RSVP Register" embossed on the cover in gold. When clicked, it opens to reveal the RSVP form rendered as `<Html>` styled as an official form with printed field labels and handwriting-style input fields.
- **Wall of confirmations:** The back wall has a cork board covered in folded RSVP cards (representing already-submitted RSVPs if count available), each pinned with a gold pin.
- **Clerk's tools:** Rubber stamp set, inkpad, wax seal melting station (decorative), official scroll tied with ribbon (contains the RSVP deadline date displayed as a canvas texture).
- **Deadline notice:** A large framed official notice on the side wall reading "RESPONSES REQUIRED BY [date]" in typewriter font — canvas texture updated from `rsvpDeadline`.
- **Atmosphere:** Warm wood tones, green desk lamp (emissive), filing cabinets along the walls.

---

## Room 12 — Guestbook

**Room name on door:** "The Signing Room"

**Concept:** A warm signing ceremony room. Round table, single candle, a beautiful open book.

**Scene breakdown:**

- **The book:** The most beautiful object in any room. A large open book with cream pages, gold-leafed edges, lies flat on a round velvet-covered table. The left page shows existing messages, styled as handwritten entries with different ink colours. The right page is blank for the current guest.
- **Interaction:** Clicking the right (blank) page opens the guestbook form via `<Html>` overlay — name and message fields styled as though writing with a fountain pen on the page. Submitting shows the message appearing as a new entry on the left page with a gentle ink-appearing animation.
- **Surrounding detail:** A single tall candle in a brass holder (emissive flame), a small vase of flowers, and a glass of water on the table. A "Please sign our guestbook" calligraphy sign on a small easel.
- **Walls:** Pale ivory panelling, framed botanical illustrations, soft baked light from tall windows.

---

## Room 13 — Travel Guide

**Room name on door:** "The Travel Agency"

**Concept:** A vintage 1950s travel agency office. World map on the wall, globe on the desk, stacked suitcases, travel posters.

**Scene breakdown:**

- **Travel posters:** Each `TravelItem` gets a vintage travel poster mounted on the walls — illustrated in a retro Art Deco style (canvas texture with stylised illustration). Hotel items show a hotel building; airport items show a stylised aeroplane; tip items show a star rating badge.
- **Suitcase stack:** A pile of vintage leather suitcases in the corner, each with a luggage tag showing a travel tip or key piece of information.
- **Desk:** An agent's desk with a typewriter, airline schedules, and a brochure rack. The brochures are physical folded cards (thin box meshes) that can be picked up (clicked) to reveal the full travel item detail.
- **World map:** A large Mercator projection on the back wall with the destination city marked with a red pin and a string connecting to a label card.
- **Atmosphere:** Warm amber and teal tones, ceiling fan (spinning emissive blade mesh), potted palm, rattan furniture.

**Lock:** Door sealed if `travelGuideEnabled` is false or no items provided.

---

## Room 14 — Menu

**Room name on door:** "The Banquet Hall"

**Concept:** A grand banquet hall. Long dining table set for a formal dinner. Menu scrolls hang on the walls like medieval proclamations.

**Scene breakdown:**

- **Menu scrolls:** Each menu category (`course`) gets its own large parchment scroll hanging on the wall, mounted on two wooden dowels (top and bottom), with the category name as a heading. The scroll contains the items for that course in calligraphic script — rendered as a canvas texture per scroll.
- **Scroll browsing:** If there are more categories than wall space allows, the scrolls can be browsed by peeking left/right (the existing peek system). Each scroll is positioned on a different wall section.
- **Guest preference checkboxes:** On the dining table sits a folded place card for each menu item. The guest can click a place card to "claim" it — the card flips to show a gold check mark, indicating their preference. A maximum count badge on each category scroll shows how many guests have selected that item.
- **Dining table:** Long mahogany table set with white linen, silver candlesticks (emissive), crystal glasses, and gold cutlery — all baked geometry, fully dressed.
- **Back wall:** A large stone fireplace with a roaring fire (emissive animated flame geometry). Above the mantle: the event host names and date on a carved wooden plaque.
- **Ceiling:** Timber hammer-beam ceiling with hanging iron chandeliers (emissive).

---

## Room 15 — Livestream

**Room name on door:** "The Screening Room"

**Concept:** A private cinema or gentleman's club screening room. Deep red velvet walls, leather cinema seats, a projection screen, a retro television set.

**Scene breakdown:**

- **The television:** A large vintage wooden-cabinet TV set with a curved screen sits on a cabinet in the centre of the room. When the livestream is not active (before the event date), the TV screen shows static (animated canvas texture noise) with a "BROADCAST BEGINS [date]" overlay. A "Do Not Disturb — Broadcast Pending" sign hangs from the TV cabinet.
- **Turning the TV on:** When within the broadcast window, the guest can click the TV. A turning-knob animation plays (the dial on the side of the TV rotates), the static clears, and the livestream iframe loads into the TV screen geometry via `<Html>`.
- **Platform indicator:** A small channel card in a brass frame sits on top of the TV showing the platform name and icon (YouTube, Zoom, etc.).
- **Cinema seats:** 2–3 rows of red velvet cinema seats face the TV. Armrests with cup holders contain popcorn models.
- **Projection booth:** A small window in the back wall shows a projection light beam (volumetric cone mesh with low opacity emissive material) cutting through the room.
- **Walls:** Dark red velvet curtaining, framed film posters showing stylised versions of the event artwork.

**Lock:** Door sealed if `livestreamEnabled` is false or no URL provided.

---

## Room 16 — Registry

**Room name on door:** "The Gift Room"

**Concept:** A festive gift room. Wrapped presents stacked on shelves and tables, ribbons and bows everywhere, warm fairy lights.

**Scene breakdown:**

- **Gift shelves:** Wall-to-wall shelving units filled with wrapped gift boxes of various sizes. Each gift corresponds to a registry item — box size roughly proportional to item price. Each box has a gift tag hanging from a ribbon with the item name.
- **Claimed items:** Items already reserved/purchased have their ribbon tied in a bow (unreserved items have an untied ribbon). Fully purchased items have a sold-out sticker.
- **Interaction:** Clicking a gift causes it to float up slightly (scale + translate animation) and a gift card unfolds showing the item details, price, image, and claim/purchase buttons — rendered as `<Html>`.
- **Name prompt:** The name prompt floats as a small card held by a bow on a gift box at the entrance of the room.
- **Central table:** A large table covered in pastel tissue paper with a "Gift Ideas" arch sign above it made of flowers and ribbons.
- **Atmosphere:** Fairy lights strung between shelves (emissive dots), pearlescent wrapping paper colours, warm white ambient (baked).

---

## Room 17 — Finale

**Room name on door:** "The Grand Finale"

**Concept:** A grand celebration hall, the most spectacular room. Cathedral ceiling, gold and white palette, balloons covering the ceiling, confetti everywhere.

**Scene breakdown:**

- **Ceiling:** Almost completely covered with hundreds of balloons in the event's colour palette — modelled as sphere clusters of varying sizes, baked with subtle shading. During the finale trigger, a balloon-drop animation plays: balloons fall from the ceiling and gently float to the floor using simple physics (each balloon follows a gentle sine-wave descent path).
- **Confetti:** A particle system of flat rectangular confetti pieces in gold, white, and accent colours rains continuously once the room is entered. Instanced geometry for performance.
- **Finale banner:** A huge ceremonial banner suspended across the width of the room like a tournament display. It shows the couple/host names in large ornate script, the "See You at the Altar" (or event-specific) heading, and the formatted event date. The banner has deep folds and a velvet texture — baked geometry.
- **Stage:** The far end of the room has a raised platform (like a bandstand) with the couple illustration (or event-type equivalent) as a large sculptural centrepiece — the SVG illustration translated into simple 3D geometry.
- **Ornamental rings/arch:** Two large interlocked rings (or event-specific symbol) above the stage, gold chrome material with `envMap` reflections.
- **Side walls:** Tall mirrors in ornate frames reflecting the balloon-filled room — achieved with `<CubeCamera>` render targets for realistic reflection.
- **Floor:** White marble with gold inlay compass rose, baked with candle reflections.
- **Lighting moment:** On entry, a warm golden light sweep animation plays (a plane with an emissive gradient texture slides across the floor from the entrance to the stage, like a spotlight sweeping).

---

## Navigation and Door System (Global)

**Every door:**

- Physical wooden door mesh with ornate carving detail
- Brass number plate on the front face (01 through 17)
- Engraved room name plate below the number
- Gold door handle
- Hinged correctly — opens inward into the room

**Locked door behaviour (all rooms past Room 02 before scratch):**

- Door has a visible brass padlock on the handle
- A red glowing seal on the door frame (emissive)
- On approach: padlock rattles, red particles burst, door bounces back
- Tooltip/placard on the door: "Scratch the date to unlock"

**Unlocking sequence (after scratch):**

- All padlock meshes disappear with a particle burst
- Door frames shift from red to gold emissive glow
- A brief "click" sound plays per door as they unlock
- Doors now swing open on approach

**Corridor between rooms:**

- Stone arched corridor, same material as current engine
- Wall sconces (emissive globes) provide amber light
- Baked shadows in the corners
- The far end shows a hint of the next room's colour/atmosphere bleeding through the arch

---

## Asset Checklist for Blender

Each of the following must be modelled, UV unwrapped, and baked:

- `room-hero.glb` + `room-hero-baked.jpg` (× 5 variants: castle, farm, arcade, garden, beach)
- `room-vault.glb` + `room-vault-baked.jpg`
- `room-clocktower.glb` + `room-clocktower-baked.jpg`
- `room-gallery-film.glb` + `room-gallery-film-baked.jpg`
- `room-gallery-art.glb` + `room-gallery-art-baked.jpg`
- `room-maproom.glb` + `room-maproom-baked.jpg`
- `room-atelier.glb` + `room-atelier-baked.jpg`
- `room-concierge.glb` + `room-concierge-baked.jpg`
- `room-portraits.glb` + `room-portraits-baked.jpg`
- `room-library.glb` + `room-library-baked.jpg`
- `room-registry.glb` + `room-registry-baked.jpg`
- `room-signingroom.glb` + `room-signingroom-baked.jpg`
- `room-travelagency.glb` + `room-travelagency-baked.jpg`
- `room-banquethall.glb` + `room-banquethall-baked.jpg`
- `room-screeningroom.glb` + `room-screeningroom-baked.jpg`
- `room-giftroom.glb` + `room-giftroom-baked.jpg`
- `room-grandfinale.glb` + `room-grandfinale-baked.jpg`
- `corridor.glb` + `corridor-baked.jpg` (shared between all rooms)
- `door.glb` + `door-baked.jpg` (shared, with nameplate as runtime canvas texture)

**Bake settings for all rooms:**

- Render engine: Cycles
- Samples: 256 minimum, 512 preferred
- Output: 2048×2048 JPEG at 95% quality (4096 for hero and finale rooms)
- Bake type: Combined (diffuse + shadows + AO + indirect)
- Margin: 8px
- `flipY = false` on all textures when loaded in Three.js (GLTF UV convention)

Take a look at the code here (knowledge base), and then help me modify based on the prompt above to use the blender. Also, remember that all rooms will be based on the

```typescriptreact
type FeatureMode = "castle" | "farm" | "arcade" | "garden" | "beach";
```

selected. Also, we need to ensure we can change the featuremode from the design panel and update the config as needed. Also, when we undock, the rooms must still work. It currently works for the scroll navmode, but not for the rooms navmode:

Only rewrite code when we need a full rewrite, instead of just what code needs to change and where in each file the change should be applied, be very descriptive. Ensure no unused variable or imports in any files pleas
