/** Minimal WebAudio blips. Off by default, toggled in sysbar. */

let ctx: AudioContext | null = null
let enabled = false

export function isSoundOn(): boolean {
  return enabled
}

export function setSound(on: boolean): void {
  enabled = on
  if (on && !ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      ctx = null
    }
  }
  if (!on && ctx) {
    void ctx.close().catch(() => undefined)
    ctx = null
  }
}

export function blip(freq = 660, ms = 60): void {
  if (!enabled || !ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + ms / 1000)
  } catch {
    /* silent */
  }
}
