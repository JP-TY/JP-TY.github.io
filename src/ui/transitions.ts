/**
 * James Ty Portfolio — shared motion helpers.
 *
 * Signature transition: the BLADE CUT, read like a Metaphor chapter card.
 *   1. a deep charcoal base band drops the room's lights,
 *   2. a gold slab and a charcoal blade sweep across at -12° — the blade's
 *      bright edge slices the screen while a glint races ahead of it,
 *   3. at the covered moment: ivory cut-flash, a gold seam diamond blooms at
 *      centre, the destination name types in letter-by-letter on a charcoal
 *      plate riding the blade, and a low cover thud lands (if sound is on),
 *   4. the blade CONTINUES its sweep out the far side — one continuous
 *      direction, exit ~75% of enter time — while the fresh scene reveals
 *      underneath: heading letters rise, the frame drifts in, a ghost of the
 *      section name settles into the frame corner.
 *
 * anime.js v4 API. Reduced motion: instant swap, no overlay, no reveals.
 */

import { animate, stagger, utils } from 'animejs'
import { sfx } from '../engine/audio'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const ENTER_MS = 380
const HOLD_MS = 115
const EXIT_MS = 290
/** Section→section swaps: the quicker internal cut. */
const FAST = { enter: 230, hold: 70, exit: 185 }

/** Wrap each character in an animatable span; aria-label keeps SRs verbal. */
function splitLetters(el: HTMLElement, text: string): HTMLElement[] {
  el.textContent = ''
  el.setAttribute('aria-label', text)
  return Array.from(text).map((ch) => {
    const s = document.createElement('span')
    s.className = 'ns-letter'
    s.textContent = ch === ' ' ? '\u00A0' : ch
    el.appendChild(s)
    return s
  })
}

export interface WipeOpts {
  fast?: boolean
  /** Name-plate copy, typed in at the covered moment. */
  title?: string
  kicker?: string
}

/**
 * Cover the screen with the blade cut, run `middle` while hidden, reveal.
 * Resolves when the blade has fully cleared. Reduced motion: instant.
 */
export function wipeTransition(middle: () => void, opts: WipeOpts = {}): Promise<void> {
  const wipe = document.getElementById('wipe')
  if (!wipe || prefersReducedMotion()) {
    middle()
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const t = opts.fast ? FAST : { enter: ENTER_MS, hold: HOLD_MS, exit: EXIT_MS }
    const slabs = wipe.querySelectorAll<HTMLElement>('.wipe-b, .wipe-a')
    const base = wipe.querySelector<HTMLElement>('.wipe-base')
    const sliver = wipe.querySelector<HTMLElement>('.wipe-c')
    const flash = wipe.querySelector<HTMLElement>('.cut-flash')
    const seam = wipe.querySelector<HTMLElement>('.cut-seam')
    const plate = wipe.querySelector<HTMLElement>('.wipe-name')
    const plateKicker = plate?.querySelector<HTMLElement>('.wipe-kicker') ?? null
    const plateTitle = plate?.querySelector<HTMLElement>('.wipe-title') ?? null

    // Reset to the pre-cut state.
    utils.set(slabs, { xPercent: 130, skewX: -12 })
    if (base) utils.set(base, { opacity: 0, scale: 1.05 })
    if (sliver) utils.set(sliver, { xPercent: 950, skewX: -12, opacity: 1 })
    if (flash) utils.set(flash, { opacity: 0 })
    if (seam) utils.set(seam, { rotate: 45, scale: 0, opacity: 0.95 })
    if (plate) utils.set(plate, { opacity: 0, x: 0 })

    wipe.style.display = 'block'
    sfx.wipe()

    // The cut: base dims, gold slab then blade slab slice across.
    if (base)
      animate(base, { opacity: [0, 1], scale: [1.05, 1], duration: Math.min(220, t.enter), ease: 'outQuad' })
    animate(slabs, {
      xPercent: [130, 0],
      skewX: [-12, -12],
      duration: t.enter,
      ease: 'outExpo',
      delay: stagger(70),
    })
    if (sliver)
      animate(sliver, {
        xPercent: [950, -500],
        skewX: [-12, -12],
        duration: t.enter + 120,
        ease: 'outExpo',
        delay: 40,
      })

    // Covered moment: swap scenes, flash, seam bloom, name plate slams on.
    window.setTimeout(() => {
      middle()
      sfx.cover()
      if (flash) animate(flash, { opacity: [0, 0.55, 0], duration: 170, ease: 'outQuad' })
      if (sliver) animate(sliver, { opacity: 0, duration: 130, ease: 'outQuad' })
      if (seam) animate(seam, { scale: [0, 1], duration: 280, ease: 'outExpo' })
      if (plate && plateTitle) {
        const letters = splitLetters(plateTitle, (opts.title ?? '').toUpperCase())
        if (plateKicker) plateKicker.textContent = opts.kicker ?? ''
        utils.set(plate, { opacity: 1 })
        animate(letters, {
          opacity: [0, 1],
          y: ['0.65em', '0em'],
          duration: 340,
          ease: 'outExpo',
          delay: stagger(20),
        })
      }
    }, t.enter)

    // The blade continues out the far side; the scene reveals underneath.
    window.setTimeout(() => {
      if (plate) animate(plate, { x: [0, 72], duration: t.exit, ease: 'inQuad' })
      if (seam)
        animate(seam, { opacity: [0.95, 0], scale: [1, 1.3], rotate: [45, 45], duration: t.exit, ease: 'inQuad' })
      if (base) animate(base, { opacity: [1, 0], duration: t.exit, ease: 'inQuad' })
      if (sliver) {
        utils.set(sliver, { xPercent: 500, opacity: 0.9 })
        animate(sliver, {
          xPercent: [500, -900],
          opacity: [0.9, 0],
          skewX: [-12, -12],
          duration: t.exit,
          ease: 'inQuad',
        })
      }
      animate(slabs, {
        xPercent: [0, -130],
        skewX: [-12, -12],
        duration: t.exit,
        ease: 'inQuart',
        delay: stagger(45),
        onComplete: () => {
          wipe.style.display = 'none'
          if (flash) utils.set(flash, { opacity: 0 })
          if (sliver) utils.set(sliver, { opacity: 1 })
          if (seam) utils.set(seam, { rotate: 45, scale: 0 })
          if (plate) utils.set(plate, { opacity: 0, x: 0 })
          resolve()
        },
      })
    }, t.enter + t.hold)
  })
}

/** The outgoing hub flees the arriving blade. */
export function exitHub(): void {
  if (prefersReducedMotion()) return
  const els = document.querySelectorAll<HTMLElement>('.menu-item, .char-card, .hub-brand, .status-strip')
  animate(els, { opacity: [1, 0], x: [0, -46], duration: 230, ease: 'inQuad', delay: stagger(18) })
}

/** The outgoing document flees the arriving blade. */
export function exitView(): void {
  if (prefersReducedMotion()) return
  const frame = document.querySelector<HTMLElement>('#view .view-frame')
  const wm = document.querySelector<HTMLElement>('#view-watermark')
  if (frame) animate(frame, { opacity: [1, 0], x: [0, -56], duration: 200, ease: 'inQuad' })
  if (wm) animate(wm, { opacity: [1, 0], x: [0, -84], duration: 200, ease: 'inQuad' })
}

/** Entrance for the hub: menu slams in, rules sweep, card drifts after. */
export function revealHub(): void {
  if (prefersReducedMotion()) return
  const items = document.querySelectorAll<HTMLElement>('.menu-item')
  const rules = document.querySelectorAll<HTMLElement>('.menu-rule')
  const card = document.querySelector<HTMLElement>('.char-card')
  const brand = document.querySelector<HTMLElement>('.hub-brand')
  const strip = document.querySelector<HTMLElement>('.status-strip')
  utils.set(items, { opacity: 0, x: -56, rotate: -4 })
  utils.set(rules, { scaleX: 0 })
  if (card) utils.set(card, { opacity: 0, x: 48 })
  if (brand) utils.set(brand, { opacity: 0, y: -18 })
  if (strip) utils.set(strip, { opacity: 0, y: 16 })
  animate(items, {
    opacity: [0, 1],
    x: [-56, 0],
    rotate: [-4, 0],
    duration: 620,
    ease: 'outExpo',
    delay: stagger(60, { start: 120 }),
  })
  animate(rules, {
    scaleX: [0, 1],
    duration: 500,
    ease: 'outExpo',
    delay: stagger(70, { start: 560 }),
  })
  if (card) animate(card, { opacity: [0, 1], x: [48, 0], duration: 700, ease: 'outExpo', delay: 420 })
  if (brand) animate(brand, { opacity: [0, 1], y: [-18, 0], duration: 600, ease: 'outExpo', delay: 60 })
  if (strip) animate(strip, { opacity: [0, 1], y: [16, 0], duration: 500, ease: 'outExpo', delay: 560 })
}

/**
 * Entrance for a freshly revealed section: heading letters rise, frame
 * drifts in, the engraved watermark settles, content staggers up.
 * Call under cover (from the wipe's `middle`) so it plays as the blade clears.
 */
export function revealView(): void {
  if (prefersReducedMotion()) return
  const frame = document.querySelector<HTMLElement>('#view .view-frame')
  if (frame) {
    utils.set(frame, { opacity: 0, y: 30 })
    animate(frame, { opacity: [0, 1], y: [30, 0], duration: 420, ease: 'outExpo', delay: 40 })
  }
  const heading = document.querySelector<HTMLElement>('#view-heading')
  if (heading && heading.textContent) {
    const letters = splitLetters(heading, heading.textContent)
    utils.set(letters, { opacity: 0, y: '0.6em' })
    animate(letters, {
      opacity: [0, 1],
      y: ['0.6em', '0em'],
      duration: 380,
      ease: 'outExpo',
      delay: stagger(16, { start: 120 }),
    })
  }
  const wm = document.querySelector<HTMLElement>('#view-watermark')
  if (wm) {
    utils.set(wm, { opacity: 0, x: 44 })
    animate(wm, { opacity: [0, 1], x: [44, 0], duration: 700, ease: 'outExpo', delay: 220 })
  }
  const els = document.querySelectorAll<HTMLElement>('#view .reveal')
  utils.set(els, { opacity: 0, y: 24 })
  animate(els, {
    opacity: [0, 1],
    y: [24, 0],
    duration: 500,
    ease: 'outExpo',
    delay: stagger(45, { start: 220 }),
  })
}
