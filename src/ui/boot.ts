/**
 * James Ty Portfolio — title screen. Confident layered name-mark slam
 * (outExpo, no elastic wobble) with a single gold shockwave ring as the hero
 * flourish. Skippable; shown once per session.
 */

import { animate, createTimeline, stagger, utils } from 'animejs'
import { sfx } from '../engine/audio'
import { prefersReducedMotion } from './transitions'

const BOOT_KEY = 'tyr-booted'

export class Boot {
  private done = false
  private pendingResolve: (() => void) | null = null

  constructor(private onComplete: () => void) {}

  async run() {
    const boot = document.getElementById('boot')
    if (!boot) return
    const title = document.getElementById('boot-title')
    const reduced = prefersReducedMotion()

    if (title && !reduced) {
      // Split into per-letter spans for the slam.
      const text = title.textContent ?? 'James Ty Portfolio'
      title.textContent = ''
      for (const ch of text) {
        const span = document.createElement('span')
        span.className = 'boot-letter'
        span.textContent = ch === ' ' ? '\u00A0' : ch
        title.appendChild(span)
      }
      const letters = title.querySelectorAll<HTMLElement>('.boot-letter')
      utils.set(letters, { opacity: 0, y: 70, scale: 1.35 })
      const tl = createTimeline()
      tl.add(
        '.boot-crest',
        { opacity: [0, 1], scale: [0.4, 1], rotate: [-30, 0], duration: 520, ease: 'outExpo' },
        0,
      )
      tl.add(letters, {
        opacity: [0, 1],
        y: [70, 0],
        scale: [1.35, 1],
        duration: 640,
        ease: 'outExpo',
        delay: stagger(45, { start: 140 }),
      })
      // single hero flourish: one expanding gold shockwave ring as the name lands
      const ring = document.createElement('div')
      ring.className = 'boot-ring'
      boot.appendChild(ring)
      animate(ring, {
        scale: [0.3, 2.6],
        opacity: [0.85, 0],
        duration: 1000,
        delay: 980,
        ease: 'outExpo',
        onComplete: () => ring.remove(),
      })
      tl.add(
        '.boot-rule',
        { scaleX: [0, 1], opacity: [0, 1], duration: 700, ease: 'outExpo' },
        '-=500',
      )
      tl.add(
        '.boot-sub',
        { opacity: [0, 1], y: [14, 0], duration: 500, ease: 'outExpo' },
        '-=450',
      )
      tl.add(
        '.boot-byline',
        { opacity: [0, 1], y: [12, 0], duration: 500, ease: 'outExpo' },
        '-=380',
      )
      tl.add(
        '.boot-advance',
        { opacity: [0, 1], duration: 400, ease: 'outQuad' },
        '-=300',
      )
    } else {
      boot.classList.add('boot-static')
    }

    this.armSkip()
  }

  /** Wire up skip: any key, click, or the advance button. */
  private armSkip() {
    const boot = document.getElementById('boot')
    if (!boot) return
    const advance = () => {
      if (this.done) return
      this.done = true
      sfx.confirm()
      try {
        sessionStorage.setItem(BOOT_KEY, '1')
      } catch {
        /* private mode: boot simply always shows */
      }
      const finish = () => {
        boot.hidden = true
        this.pendingResolve?.()
        this.onComplete()
      }
      if (prefersReducedMotion()) {
        finish()
      } else {
        animate('.boot-inner', {
          opacity: [1, 0],
          scale: [1, 1.06],
          duration: 320,
          ease: 'inQuad',
          onComplete: finish,
        })
      }
    }

    document.getElementById('boot-advance')?.addEventListener('click', advance)
    document.addEventListener('keydown', advance, { once: true })
    document.addEventListener('pointerdown', advance, { once: true })
  }

  /** Immediately show the hub (deep links / returning visitors). */
  skipInstant() {
    this.done = true
    const boot = document.getElementById('boot')
    if (boot) boot.hidden = true
    try {
      sessionStorage.setItem(BOOT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  static wasBooted(): boolean {
    try {
      return sessionStorage.getItem(BOOT_KEY) === '1'
    } catch {
      return false
    }
  }
}
