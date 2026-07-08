import { animate } from 'animejs'

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ponytail: animejs v4 overloads type .completed oddly; await it only when thenable.
async function settled(a: unknown): Promise<void> {
  const done = (a as { completed?: unknown }).completed
  if (done && typeof (done as PromiseLike<unknown>).then === 'function') {
    await (done as PromiseLike<unknown>).then(
      () => undefined,
      () => undefined,
    )
  }
}

/** Grid-zoom veil: outgoing fades fast, grid wipes, incoming rises. */
export async function veilTo(label: { kicker: string; title: string }, swap: () => void): Promise<void> {
  const veil = document.getElementById('veil')
  if (!veil) {
    swap()
    return
  }
  const kicker = veil.querySelector('.veil-kicker')
  const title = veil.querySelector('.veil-title')
  if (kicker) kicker.textContent = label.kicker
  if (title) title.textContent = label.title
  if (reduced()) {
    swap()
    return
  }
  veil.classList.add('is-on')
  await settled(
    animate('.veil-grid', {
      opacity: [0, 1],
      scale: [0.985, 1],
      duration: 140,
      easing: 'easeOut',
    }),
  )
  swap()
  const view = document.getElementById('page-screen')
  if (view && !view.hidden) {
    await settled(
      animate('#page-screen .rise, #menu-screen .rise', {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 320,
        delay: (_el: unknown, i = 0) => i * 40,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)',
      }),
    )
  }
  await settled(
    animate('.veil-grid', {
      opacity: [1, 0],
      duration: 110,
      easing: 'easeIn',
    }),
  )
  veil.classList.remove('is-on')
}

let busy = false
export function coalesce(fn: () => Promise<void>): void {
  if (busy) return
  busy = true
  void fn().finally(() => {
    busy = false
  })
}
