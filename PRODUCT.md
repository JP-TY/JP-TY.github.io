# Product

## Register

brand

## Users

- **Primary**: Design/dev community — Awwwards judges, front-end engineers, and tech Twitter/X / r/webdev browsers who judge portfolios on craft and share the exceptional ones. They arrive skeptical, have seen a thousand AI-generated purple-gradient portfolios, and stay only if the first 10 seconds feel authored. Their job: experience the site, appreciate the execution, share it.
- **Secondary**: Recruiters, hiring managers, and hackathon judges evaluating James Gabriel Elijah Ty (BS CS, UP Cebu, 2027) for internships and competitions. Their job: quickly find projects, stack, achievements, and contact.
- **Tertiary**: XR/cloud/geospatial community peers — ISCOLab, GitHub Campus Experts, AWS builder circles.

## Product Purpose

A single-page developer portfolio that IS the résumé's proof of skill: a serious professional site whose interface borrows the menu craft of Atlus JRPGs (Metaphor: ReFantazio, Persona 5) — charcoal surfaces, gold accent system, diagonal wipe transitions, spring-loaded menus. The inspiration lives in the **design and layout only**; all copy is straight professional portfolio prose. Success = visitors finish the experience, remember it, and share it — while recruiters extract every fact in under a minute (hash deep-links included).

## Brand Personality

Precise, confident, quietly stylish. A developer with taste, not a character. First-person, human, direct — grand through craft and restraint, never through costume. If a line wouldn't survive on a senior engineer's portfolio, it doesn't ship.

## Anti-references

- Generic AI-portfolio aesthetics: purple gradients on white, Inter/Roboto, glassmorphic cards floating in a void
- Copying Persona 5's red/black look wholesale — the most-copied game UI on the web; the identity is a gold-on-charcoal system, deliberately not that
- **Roleplay copy in any form** — no fantasy vocabulary ("quest", "trophy", "summoning", "royal", "character sheet"), no lore, no fictional framing, no "press start" energy in the words. The theme is in the geometry, color, and motion — never in the text
- Websites where the theme buries the content — this must carry the full CV's depth
- Overstuffed game HUDs (every-corner-blinking) — restraint in chrome, generosity in craft

## Design Principles

1. **The experience is the portfolio** — the choreography, transitions, and menu craft demonstrate engineering and design skill; the site is project #1.
2. **Theme in the design, not the words** — Atlus inspiration lives in layout, color, and motion; every string of copy reads like a serious professional site.
3. **Style serves function** (Atlus's own hardest-won lesson, per Koji Ise) — if leaning into visuals costs usability, usability wins; every flourish must survive the "can a recruiter extract this in 60 seconds?" test.
4. **Real content, no costume** — every claim sits next to complete, factual CV content.
5. **Respect the visitor** — reduced motion, keyboard, touch, and deep links are first-class, never bolted on.
6. **Performance is part of the aesthetic** — 60fps motion on a mid laptop is the bar; laggy is broken.

## Accessibility & Inclusion

- WCAG 2.1 AA: contrast ≥ 4.5:1 for text, focus-visible states, semantic headings, real DOM content (decorative canvases are aria-hidden)
- `prefers-reduced-motion`: instant transitions, static particles, no shakes/flickers/typewriters
- Full keyboard navigation: menu via arrows/Enter/Esc, visible focus, ARIA menu pattern
- Touch: tap targets ≥ 44px, single-column mobile adaptation
- Hash deep-links (`#/projects` etc.) so recruiters skip straight to facts; SEO/OG meta for link previews
