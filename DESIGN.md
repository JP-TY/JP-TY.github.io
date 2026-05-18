# Design

## Theme

**TY.STELLAR** — a 2 a.m. starship terminal glowing in phosphor rainbow. Void-black space, CRT arcade energy, everything rendered in glyphs. Dark theme only. Mood: clever, nostalgic, confident.

## Color Palette

Base + phosphor accents on near-black. All body text ≥ 4.5:1 on base; accents are earned through the fiction (planet identity), never sprinkled.

| Token | Value | Role |
|---|---|---|
| `--void` | `#04060a` | Page background, canvas clear color |
| `--panel` | `#0a0f14` | Panel/HUD surface |
| `--grid` | `#1a2630` | Hairlines, panel borders, dividers |
| `--dim` | `#5b7a8c` | Secondary text, captions (≥ 4.5:1 on void) |
| `--text` | `#d7e6ee` | Primary text |
| `--green` | `#3dff8f` | Primary phosphor: HUD, sun/hero, focus rings, links |
| `--cyan` | `#38e1ff` | PROJECTS planet + panel accent |
| `--violet` | `#a68bff` | EXPERIENCE planet + panel accent |
| `--amber` | `#ffb000` | ACHIEVEMENTS planet + panel accent (arcade gold) |
| `--magenta` | `#ff5fd2` | SKILLS planet + panel accent |
| `--orange` | `#ff8a3d` | CONTACT planet + panel accent |
| `--alert` | `#ff5560` | Errors, `SIGNAL LOST` |

Anti-pattern: purple-gradient-on-white, glassmorphism, drop shadows on cards. Depth comes from glyph density, scanlines, and bloom — never soft shadows.

## Typography

Mono-only commitment. Loaded via Google Fonts with `font-display: swap`; ASCII glyph atlas waits on `document.fonts.ready`.

| Face | Use | Notes |
|---|---|---|
| `VT323` | Display: headers, HUD readouts, boot text | CRT terminal voice; large sizes only (≥ 20px) |
| `Azeret Mono` | Body: panel content, lists, captions | Readability workhorse, 400/500/700 |
| `Press Start 2P` | Tiny arcade accents only: high-score table, badges, easter eggs | Never for body; ≤ 10px equivalent usage |

Scale: `--fs-hero: clamp(2.5rem, 6vw, 4.5rem)` · `--fs-h2: clamp(1.75rem, 3.5vw, 2.5rem)` · `--fs-body: 1rem` · `--fs-small: 0.8125rem`. Measure ≤ 72ch. Line-height 1.6 body, 1.1 display.

## Components

- **HUD chrome**: corner-anchored readouts (coordinates, target, mission log), 1px `--grid` frames, `--green` text, no fills
- **Transmission panel**: docked content window — `--panel` bg, 1px border in planet accent, ASCII title bar (`╔═╗`), corner notch, scroll inside panel only
- **Nav strip**: bottom-center planet list, monospace, lock-on highlight in accent
- **Toggle buttons**: `[ SOUND: OFF ]`, `[ CLASSIC MODE ]` bracket-style, 44px targets
- **CRT overlay**: subtle scanlines + vignette at ≤ 6% opacity, disabled under reduced motion

## Layout

Canvas-first: solar system fills viewport as the permanent spatial map. Content lives in corner HUD + docked panels (max-width 720px, centered, 85vw mobile). Asymmetric panel composition; typography-dense, decoration-light. Safe-area + 24px HUD inset.

## Motion

Energy: **cinematic moments, calm idle** (anime.js v4 for DOM; GSAP-style timelines via anime timeline; Three.js loop for orbit/cursor physics).

- Boot: typewriter lines → system reveal bloom. Skippable, sessionStorage once.
- Idle: gentle orbits (0.02–0.1 rad/s), rocket hover-bob, ticking HUD. Nothing else moves.
- Docking: autopilot bezier flight (1.2s, easeInOutQuad) → 4px screen shake ×2 → panel scale 0.96→1 + fade. Signature moment — make it land.
- Panel out: reverse, faster. All transitions 200–400ms; micro-interactions 150–300ms.
- Reduced motion: orbits static, no shake/flicker/typewriter, instant panels (opacity only).
