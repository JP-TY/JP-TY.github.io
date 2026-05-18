# Product

## Register

brand

## Users

- **Primary**: Design/dev community — Awwwards judges, front-end engineers, and tech Twitter/X / r/webdev browsers who judge portfolios on craft and share the exceptional ones. They arrive skeptical, have seen a thousand AI-generated purple-gradient portfolios, and stay only if the first 10 seconds feel authored. Their job: experience the site, appreciate the execution, share it.
- **Secondary**: Recruiters, hiring managers, and hackathon judges evaluating James Gabriel Elijah Ty (BS CS, UP Cebu, 2027) for internships and competitions. Their job: quickly find projects, stack, achievements, and contact — without fighting the metaphor.
- **Tertiary**: XR/cloud/geospatial community peers — ISCOLab, GitHub Campus Experts, AWS builder circles.

## Product Purpose

A single-page developer portfolio that IS the résumé's proof of skill: an ASCII-rendered solar system where an ASCII rocket cursor docks on planets to reveal About, Projects, Experience, Achievements, Skills, and Contact. Success = visitors finish the experience, remember it, and share it — while recruiters can still extract every CV fact in under a minute.

## Brand Personality

Playful, self-aware, retro-futuristic. The space/terminal fiction is played straight but never earnest — the copy winks at retro-game nostalgia ("docking…", "transmission received", easter eggs, Konami-style touches). 3-word personality: **clever, nostalgic, confident**. First-person, human, a little cheeky — never corporate, never lore-heavy enough to slow someone down.

## Anti-references

- Generic AI-portfolio aesthetics: purple gradients on white, Inter/Roboto, glassmorphic cards floating in a void
- Websites where the metaphor buries the content (3D toys with no substance behind them — ours must carry the full CV's depth)
- CRT cosplay that ignores accessibility — no contrast-hostile scanline noise
- Overstuffed sci-fi HUDs (every-corners-blinking) — restraint in chrome, generosity in craft

## Design Principles

1. **The experience is the portfolio** — technical execution (custom ASCII renderer, physics cursor, choreography) must itself demonstrate engineering and design skill; the site is project #1.
2. **One fiction, played straight** — every element (cursor, HUD, panels, copy) belongs to the starship fiction; anything that breaks it gets cut.
3. **Playful surface, serious substance** — every joke sits next to real, complete CV content; a recruiter is never more than one click from facts.
4. **Respect the pilot** — reduced motion, keyboard, touch, and a full classic (scrolling) mode are first-class, never bolted on.
5. **Performance is part of the aesthetic** — 60fps ASCII on a mid laptop is the bar; a laggy spaceship is a broken spaceship.

## Accessibility & Inclusion

- WCAG 2.1 AA: contrast ≥ 4.5:1 for text, focus-visible states, semantic headings, real DOM content (canvas is the map, not the content)
- `prefers-reduced-motion`: static system, instant panels, no shake/flicker
- Full keyboard navigation to every planet and panel; visible focus
- Touch support: drag-orbit, tap-to-dock
- **Classic mode toggle**: a traditional, fully accessible scrolling portfolio for anyone who wants zero theatrics
