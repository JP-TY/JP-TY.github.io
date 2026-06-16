---
name: TY.OS Retro Phosphor
description: Amber-voiced retro-futurist terminal portfolio with LED-matrix ancestor boot for James Ty
colors:
  amber-voice: "#F5B544"
  amber-hot: "#FFD97A"
  abysmal-ink: "#0A0C10"
  console-panel: "#12100B"
  raised-hull: "#1C170C"
  hull-hairline: "#3A2F18"
  signal-ivory: "#F5ECD7"
  dim-readout: "#B3A67F"
typography:
  display:
    fontFamily: "Chakra Petch, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 9vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Chakra Petch, Arial Narrow, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "3px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.abysmal-ink}"
    textColor: "{colors.amber-voice}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  menu-row-active:
    backgroundColor: "{colors.raised-hull}"
    textColor: "{colors.signal-ivory}"
    rounded: "{rounded.sm}"
    padding: "12px"
  chip:
    backgroundColor: "{colors.abysmal-ink}"
    textColor: "{colors.dim-readout}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
---

# Design System: TY.OS Retro Phosphor

## 1. Overview

**Creative North Star: "The Ancestral Terminal"**

A retro-futurist phosphor console: full amber voice on near-black, LED-matrix texture everywhere (grain motes, grid hairlines, full-screen scanlines, phosphor glow on display type). Game craft carries the frame; prose stays senior-engineer serious. The system explicitly rejects the previous teal-only pass, gold-on-charcoal Atlus identity, purple-gradient AI slop, glassmorphism, and any roleplay vocabulary.

Motion is choreographed but calm: one orchestrated entrance per view, staggered reveals, grid-zoom view changes. Exits run faster than entrances. Reduced motion collapses everything to instant and every canvas to a static frame.

**Key Characteristics:**
- Full amber voice, zero exceptions
- Ancestor effigy burns behind the boot copy, nowhere else
- Scanlines plus grain plus grid plus vignette: texture is the atmosphere
- Corner brackets, LED-dot dividers, blinking cursor, turn-on flash: CRT grammar on every surface
- Timeline rail for experience as hero track
- Flat tonal depth with phosphor glow, no decorative shadows

## 2. Colors

Single-phosphor strategy: warm amber carries the entire interface, links included.

### Primary
- **Amber Voice** (#F5B544, hot #FFD97A): kickers, stats, menu cursor and active states, timeline rail, awards, focus rings, boot title and advance. The brand (11.2:1 on ink).

### Secondary
- Retired. A prior teal signal role was fully purged; every accent is amber.

### Neutral
- **Abysmal Ink** (#0A0C10): page background, warm-tinted black.
- **Console Panel** (#12100B): menu and document surfaces.
- **Raised Hull** (#1C170C): hover fills, raised nodes.
- **Hull Hairline** (#3A2F18): borders, grid lines.
- **Signal Ivory** (#F5ECD7): primary text.
- **Dim Readout** (#B3A67F): secondary text, holds AA on ink and panel.

### Named Rules
**The Amber Voice Rule.** Amber is the only voice color. If an element needs emphasis, it is amber. No second hue exists.

## 3. Typography

**Display Font:** Chakra Petch (with Arial Narrow)
**Body Font:** Source Serif 4 (with Georgia)
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** Amber-terminal phosphor meets museum caption. Display type carries a soft amber glow; body stays calm serif; mono carries readouts. Faces chosen over reflex-reject defaults (Space Grotesk, IBM Plex family, Fraunces).

### Hierarchy
- **Display** (700, clamp(3rem, 9vw, 6rem), 1.05): boot title and save headings only, amber-hot with phosphor glow.
- **Headline** (700, clamp(1.75rem, 3.5vw, 2.5rem), 1.1): view headings with faint amber glow.
- **Title** (600, 1.125rem, 1.3): project names, timeline roles.
- **Body** (400/500, 1rem, 1.65, max 68ch): evidence paragraphs, compensated for dark background.
- **Label** (600, 0.8125rem, +0.14em tracking, uppercase): kickers, stats, buttons.

### Named Rules
**The Roman Headers Rule.** Headings are always roman, never italic. Emphasis via weight or amber, never gradient text.
**The Glow Budget Rule.** Glow lives on display type, stat numerals, and the boot advance only. Body copy never glows.

## 4. Elevation

Flat by default. Depth comes from tonal layering (ink over panel over hull), 1px hairlines, phosphor glow on accents, and full-screen scanlines. No decorative blur shadows.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Glow appears only as phosphor voice (display type, active states, focus) never as shadow decoration.

## 5. Components

### Buttons
- **Shape:** gently squared edges (3px radius)
- **Primary:** ink background, amber text and border, amber glow, 12px 24px padding
- **Hover / Focus:** amber-dim fill on hover; 2px amber focus-visible ring with offset
- **Secondary:** borderless menu rows; active row gets hull fill plus amber border plus inner glow

### Chips
- **Style:** ink background, dim text, hairline border, pill radius
- **State:** static metadata only, no selected variant

### Cards / Containers
- **Corner Style:** squared edges (3px radius)
- **Background:** panel for the save slot; ink for system blocks and detail panels; pages float free over the global ambience
- **Shadow Strategy:** none, flat by default; glow only on amber accents
- **Border:** 1px hull hairline; amber only for active states
- **Internal Padding:** page screens breathe full-viewport (see Page screen); cards keep 24px

### Inputs / Fields
- **Style:** no text inputs in this build; slot and node buttons use 44px minimum targets
- **Focus:** amber ring, consistent across all interactive elements
- **Error / Disabled:** danger red reserved for errors; no disabled states ship

### Navigation
- Minimized index over a solar-system menu: planets are click portals with hover ignition, backed by a slim edge tab. Mousing to the left edge or tabbing to the tab slides in the grand-menu drawer: skewed display rows with amber slab sweeps and mono indices. Full game controls: arrows or WASD/HJKL move, Enter confirms, digits 1-6 quick-travel from anywhere in the app, I toggles the drawer, ESC closes or returns. Arrow keys also hop between skill hexes directionally. The drawer is inert and invisible when closed. Sticky sysbar and status strip frame everything.

### Dream (menu signature)
- Full-bleed solar system in bright amber dot-matrix, centered on a proper dithered sun (boiling granulation disc, dark sunspot umbrae with bright rims, bright limb, hugging corona rings, rotating flare arcs, slow tick ring, deep halo) with six large page-planets turning as a slow carousel (one shared tilt and speed, even phases on wide orbits 0.34 to 0.99, so the formation keeps clear space while it moves; the relax pass also holds planet centers out of the solar disc) with crescent phases and character (soft drifting bands with a round beacon glint on the experience world, twin rings, a moon, periodic comet), each carrying a strong glow halo plus dotted halo ring so the system is the unmistakable focus, each wired to the center by its own spoke with traveling pulses. The spiral sprawls corner to corner across the whole page. Tags are big bold 15px numbered labels (`01 · PROFILE`, `> 04 · EXPERIENCE` when locked), each anchored radially outward from the sun with a dotted leader line, shadowed for contrast, and deconflicted every frame against the sun, discs, and other tags so text is never covered. Taps map through CSS/backing-store size, carry a fat-finger floor with nearest-match, and ignite on touchstart. Planets and their labels are click portals; arrows hop the lit planet with Enter to land, digits quick-travel, hovering or focusing either end (planet or drawer row) ignites the pair. Ignition scales the planet 1.22x, fires a rotating dotted lock ring with corner targeting brackets plus a dotted tag underline, and spotlights the rest dim. Separation relaxation is a safety net that keeps clear space around discs, rings, and moons. The menu type scales with viewport height so the whole index fits without scrolling; the left shade keeps type readable. Static frame under reduced motion with hover relight intact; the loop stops when a page opens.

### Favicon (tab signature)
- The tab icon is a live 48px black hole: rotating Doppler-split accretion band, shadow, and photon ring, redrawn several times per second into the icon link. Pauses while the tab hides; static under reduced motion; the inline SVG remains the fallback.

### Page screen
- Full-viewport page: RETURN button plus kicker up top, display heading, intro, then the section body at a 1080px measure. Same content renderers as before, more air. Corner brackets survive only on the save slot and portrait frame.

### Save Slot
- Panel card with mono metadata and amber stat numerals. Hover and focus shift border to amber with glow and raise the surface. Single slot; scales to more without layout change.

### Skill constellation (skills signature)
- The skills page is full-bleed: the constellation fills its region with the evidence panel docked beside it, so no overlay ever blocks a node. The whole map is constructed the way the boot hole is made: hexagon outlines, Lucide glyphs, and the JTY monogram are all drawn dot-by-dot on canvas through an animated Bayer threshold, with pulses traveling the core traces. Model coordinates live in a fixed 920x600 space mapped onto any container; node sizes stay in device pixels so drawn hexes always match their hit-areas. Transparent DOM buttons sit exactly over the drawn hexes for click, hover, keyboard, and focus, and drive a shared hover state the canvas reads every frame. Selecting any node lights its whole branch and loads the docked panel while inactive branches dim to a whisper; a sonar pulse rings the selected anchor and a hint bar counts nodes and branches. Labels stay crisp DOM text. Keyboard operable throughout with directional d-pad hops between hexes and visible focus intact. Both canvas loops stop dead on route change and render static frames under reduced motion.

### Field Portrait (profile signature)
- The field photo re-graded as smooth amber phosphor: luminance mapped through a warm duotone ramp with a gentle contrast curve, baked scanlines, soft vignette, and a slow scan band. The face stays fully recognizable with zero quantization artifacting. Framed with corner brackets. Static frame under reduced motion; the plain photo stays visible if canvas or the image fails.

### Amber Ancestor (boot signature)
- Scaled-up canvas black hole rendered as a boiling ASCII/dot-matrix hybrid: analytic glow field (halo, Doppler-limbed band with differential rotation and breathing tilt, shadow core, photon ring, lensed arcs, front pass) quantized through a time-jittered Bayer threshold, bright cells mutating ASCII glyphs and dim cells LED dots, plus rolling CRT band and corner telemetry. Burns behind the boot copy under a contrast shade at ~30fps. Starts on boot, stops dead on finish. Static single frame under reduced motion. Aria-hidden; never carries content.

### Trophy shelf (recognition signature)
- Awards render as tiered trophies: gold for championships and top honors, silver for runners-up, bronze for mentions, each with its own medal glyph and glow weight. A filter row (all, top honors, runners-up, mentions) narrows the shelf with instant hide; buttons carry aria-pressed. Hover lifts the trophy. Keyboard operable throughout.

### Badge case (recognition signature)
- Certifications live in a closed case: a lid button showing the credential count toggles the badge grid with a grid-rows unfold. Badges are numbered phosphor discs with names. Lid carries aria-expanded; content hides again on close. Instant under reduced motion.

### Scanlines (global texture)
- Fixed full-screen repeating gradient, pointer-events none, below content chrome. The grain motes canvas and hairline grid sit beneath it, joined by a slow aurora layer: two drifting amber glow blobs on minute-long loops. A soft vignette darkens the frame edges above the ambience but below content. All decorative layers are aria-hidden.

### CRT grammar (signature details)
- Corner brackets: amber L-ticks on the save slot and portrait frame.
- LED-dot dividers: dotted amber rule under view and save headings.
- Kicker prefix `[ :: ]` on view and save headings.
- Blinking block cursor on the boot log; rare phosphor flicker on the sysbar brand.
- Turn-on flash: a bright line expands and dies on every view change inside the veil. Timeline stops mark as glowing amber diamonds, never dots. All motion collapses under reduced motion.

## 6. Do's and Don'ts

### Do:
- **Do** use amber for everything carrying emphasis: voice, frames, cursor, focus, stats, awards, headings glow, links, active states.
- **Do** keep copy recruiter-serious; game feel lives in geometry and motion only.
- **Do** give experience a timeline rail with period, role, and 2 bullets per stop.
- **Do** honor `prefers-reduced-motion` with instant swaps and static canvas frames.

### Don't:
- **Don't** reuse charcoal `#250505`, royal gold, Cinzel/EB Garamond, or the blade-cut wipe from the previous build.
- **Don't** use purple gradients on white, glassmorphism, side-stripe borders (>1px colored border-left), gradient text, or identical card grids.
- **Don't** write roleplay copy (quest, trophy, summon, HP, lore, press-start energy).
- **Don't** pick reflex-reject fonts (Space Grotesk, IBM Plex family, Fraunces, Inter, etc.) or drift into editorial-magazine defaults.
- **Don't** animate layout properties; transform and opacity only, no bounce or elastic.
- **Don't** introduce a second hue; teal was fully retired from the system.
- **Don't** splash amber glow on body copy.
