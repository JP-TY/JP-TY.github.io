# James Ty — Portfolio

A developer portfolio whose interface borrows the menu craft of Atlus JRPGs — *Metaphor: ReFantazio* and *Persona 5* — rendered in a gold-on-charcoal system with wipe transitions and spring-loaded menus. The inspiration lives in the design and motion; every word of copy is straight professional portfolio prose.

**Live:** [jpty.me](https://jpty.me)

## Sections

| Section | Contents |
|---|---|
| About | Profile, education (incl. UTokyo exchange), background |
| Projects | Five projects with stack chips and award lines |
| Experience | Roles and responsibilities, most recent first |
| Achievements | Competition results, awards, certifications |
| Skills | Technologies grouped by category |
| Contact | Email, GitHub, LinkedIn |

## Craft notes

- **Motion**: anime.js v4 — per-letter elastic title entrance, staggered menu slams, springy hovers, diagonal gold/ivory wipe transitions
- **Sound**: WebAudio-synthesized SFX (menu blips, confirm tones, wipe whooshes) — zero audio assets, off by default
- **Ambience**: a lightweight 2D canvas of drifting gold motes; pauses on hidden tabs
- **Typography**: Cinzel (display) · EB Garamond (body) · Archivo (UI labels)
- **Accessibility**: real DOM text throughout, full keyboard nav (arrows/Enter/Esc), `prefers-reduced-motion` fallbacks, ≥44px touch targets, WCAG AA contrast
- **Recruiter path**: hash deep links (`jpty.me/#/projects`) skip straight to any section; `<noscript>` fallback carries the essentials

## Stack

Vite · TypeScript · anime.js v4 · vanilla CSS (design tokens). No frameworks — full control over every frame.

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build to dist/
npm run qa        # Playwright smoke: boots the site, walks every flow, screenshots
```
