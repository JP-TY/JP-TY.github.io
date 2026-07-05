import { animate, stagger } from 'animejs'
import { blip } from '../engine/audio'
import { startEffigy } from '../engine/effigy'

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ponytail: storage throws (SecurityError) with blocked cookies; never let it kill boot.
function storageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* private mode: boot simply replays next visit */
  }
}

// ponytail: a failed flourish must never block progress.
function play(a: unknown): void {
  try {
    const done = (a as { completed?: unknown }).completed
    if (done && typeof (done as PromiseLike<unknown>).then === 'function') {
      void Promise.resolve(done).catch(() => undefined)
    }
  } catch {
    /* static frame stands */
  }
}

const LINES = [
  'TY.OS v1.0',
  'checking profile memory ... OK',
  'loading skill grid ....... OK',
  'linking recognition ..... OK',
]

export function runBoot(onDone: () => void): void {
  const boot = document.getElementById('boot')
  const log = document.getElementById('boot-log')
  const title = document.getElementById('boot-title')
  const advance = document.getElementById('boot-advance') as HTMLButtonElement | null
  if (!boot || !log || !title || !advance) {
    onDone()
    return
  }
  const bootEl = boot
  const seen = storageGet('tyos-boot') === '1'
  let done = false
  let revealed = false
  let timer = 0
  // Amber Ancestor burns only while boot is on screen.
  const effigyEl = document.getElementById('effigy')
  const stopEffigy =
    effigyEl instanceof HTMLCanvasElement ? startEffigy(effigyEl) : () => undefined

  const finish = () => {
    if (done) return
    done = true
    window.clearTimeout(timer)
    stopEffigy()
    storageSet('tyos-boot', '1')
    blip(520, 70)
    bootEl.hidden = true
    window.removeEventListener('keydown', key)
    onDone()
  }

  const reveal = () => {
    if (revealed) return
    revealed = true
    window.clearTimeout(timer)
    log.textContent = LINES.join('\n')
    advance.hidden = false
    advance.focus({ preventScroll: true })
    if (reduced() || seen) {
      title.style.opacity = '1'
      return
    }
    try {
      const text = title.textContent ?? ''
      title.setAttribute('aria-label', text)
      title.innerHTML = text
        .split('')
        .map((c) => `<span class="bl" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`)
        .join('')
      play(
        animate('.boot-title .bl', {
          opacity: [0, 1],
          translateY: [22, 0],
          duration: 380,
          delay: stagger(45),
          easing: 'cubicBezier(0.22, 1, 0.36, 1)',
        }),
      )
    } catch {
      title.style.opacity = '1'
    }
  }

  // First press/click fast-forwards to the button; second press enters.
  // This keeps early input from ever feeling swallowed.
  function key(e: KeyboardEvent): void {
    if (bootEl.hidden || done) return
    if (e.key === 'Escape' || revealed) finish()
    else reveal()
  }

  advance.addEventListener('click', finish)
  bootEl.addEventListener('click', (e) => {
    if (e.target !== advance) {
      if (revealed) finish()
      else reveal()
    }
  })
  window.addEventListener('keydown', key)

  if (reduced() || seen) {
    reveal()
    return
  }

  // Safety net: typing chain must never strand the visitor.
  timer = window.setTimeout(reveal, 3000)

  log.textContent = ''
  let i = 0
  const step = (): void => {
    if (done) return
    try {
      if (i < LINES.length) {
        log.textContent += `${LINES[i]}\n`
        blip(740 + i * 40, 40)
        i += 1
        window.setTimeout(step, 170)
      } else {
        reveal()
      }
    } catch {
      reveal()
    }
  }
  step()
}
