# Design

## Theme

A serious portfolio with an Atlus-inspired interface: charcoal darkness, ivory text, one dominant gold accent system. Dark theme only. Mood: precise, confident, quietly stylish — the game inspiration lives entirely in **layout, color, and motion**, never in copy. Reference DNA: Metaphor: ReFantazio's UI (Koji Ise, GDC 2025) — one dominant color, central gaze lines, angle + contrast for context, info always on the bright side of the composition.

## Color Palette

All body text ≥ 4.5:1 on base. Gold is THE color (Persona 5's lesson: one dominant color, no competing accents); crimson is earned, rare, meaningful.

| Token | Value | Role |
|---|---|---|
| `--charcoal` | `#250505` | Page background — sampled from the game's red-black grounds (GUD swatch `#250505`) |
| `--panel` | `#2a0606` | Panel/menu surface — the game's dominant oxblood red (`#2a0606`) |
| `--panel-2` | `#340707` | Raised surface, hover fills (richer blood-red, sampled `#340707`) |
| `--line` | `#54191d` | Hairlines, frame borders (dried-blood maroon) |
| `--dim` | `#c9b291` | Secondary text (parchment, ≥ 4.5:1 on charcoal) |
| `--ivory` | `#f6efdd` | Primary text (aged cream) |
| `--gold` | `#c9a13e` | THE accent: frames, headings, cursor, focus rings — royal gold linework over red |
| `--gold-bright` | `#f0d078` | Hover/active gold, highlights |
| `--gold-deep` | `#8f6617` | Gold shadows, pressed states |
| `--crimson` | `#c22a34` | Crimson: menu-selection wash (the game marks active rows in blood-red), rare emphasis, errors |

Anti-pattern: purple-gradient-on-white, glassmorphism, soft drop shadows on cards. Depth comes from engraved line-work, corner ornaments, layered gold borders, and diagonal geometry — never blur.

## Typography

Three faces, committed. Loaded via Google Fonts with `font-display: swap`.

| Face | Use | Notes |
|---|---|---|
| `Cinzel` | Display: name-mark, section headings, menu commands | Engraved Trajan-style caps — the one overtly "game" note, kept formal |
| `EB Garamond` | Body: long-form prose | Bookish serif; italic for emphasis lines |
| `Archivo` | UI labels: small-caps tracking, stats, badges, buttons | The modern pop layer — Ise's "modern fonts on classical art" blend |

Scale: `--fs-title: clamp(3rem, 9vw, 7rem)` · `--fs-h2: clamp(1.75rem, 3.5vw, 2.5rem)` · `--fs-body: 1rem` · `--fs-ui: 0.8125rem`. Measure ≤ 68ch. Line-height 1.6 body, 1.05 display. Letter-spacing: Archivo labels +0.14em, Cinzel display +0.02em.

## Components

- **Command menu**: left-anchored primary nav; gold cursor glyph; selected row grows right with gold-bright fill sweep; staggered slam-in on open
- **Profile card**: right-side summary — NAME, ROLE, AFFILIATIONS, FOCUS, plus PROJECTS / AWARDS / CERTS counters
- **Section view**: full-viewport document panel (max-width 900px, 92vw mobile) with double gold frame, corner ornaments, scroll inside panel only
- **Status strip**: bottom bar — LOCATION · EDUCATION · contact micro-links, Archivo small-caps
- **Wipe overlay**: the **blade cut**, read like a Metaphor chapter card — a charcoal base band drops the lights, gold + charcoal slabs slice across at −12° behind a bright blade edge and racing glint; at the covered moment an ivory cut-flash fires, a gold seam diamond blooms at centre, and the destination name types in letter-by-letter on a charcoal plate riding the blade; the blade then continues out the far side while the fresh scene reveals underneath (signature transition)
- **Atmosphere**: candle-glow radial bloom top-center + faint diagonal hairline patterning on the vignette layer — static depth behind solid panels
- **Toggle buttons**: `[ SOUND: OFF ]` bracket-style, 44px targets
- **Ambience canvas**: aria-hidden three-layer parallax — drifting ember motes, diagonal gold hairline streaks, large slow-rotating hollow diamonds; subtle pointer parallax; renders one static frame under reduced motion

## Layout

Full-viewport "screens" (title → hub → section), hash-routed, not a scrolling page. Asymmetric Atlus composition: menu weight left, profile card right, gaze lines draw the eye to the bright (ivory/gold) side. Decorative canvas layers aria-hidden; safe-area insets + 24px chrome margin; single-column stack under 720px.

## Motion

Energy: **precise slams, calm idle** (anime.js v4: `animate`, `createTimeline`, `createTimer`, `stagger`, `utils`, `createSpring`).

- Title: per-letter **layered slam** (fast fall + settle, no elastic) with one expanding gold shockwave ring as the single hero flourish. Skippable, sessionStorage once
- Menu: items slam in staggered (50–70ms), hover = lightly damped spring scale + cursor slide + SFX (damping raised to kill overshoot — no bounce)
- View change: **blade cut** — slabs sweep in `outExpo` (~380ms, 230ms internal), ivory cut-flash + seam diamond + letter-by-letter name plate at the covered moment, the outgoing scene flees the blade, exit continues out the far side ~75% of enter time; navigation is coalesced so a cut never restarts mid-swing; content swaps under cover
- Section entrance: heading letters rise, frame drifts in, the section name settles as an engraved corner watermark, content staggers up
- Counters: `createTimer`-driven stat rolls; micro-interactions 150–300ms
- Idle: three-layer ambience drifts slowly (motes, streaks, rotating diamonds); nothing else moves
- Laws (animate.md): one orchestrated entrance per view, transform/opacity only, exits faster than entrances, no elastic/bounce, reduced motion always honored
