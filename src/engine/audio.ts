/**
 * James Ty Portfolio — WebAudio-synthesized SFX. Zero asset bytes.
 * Off by default; unlocked only after the user enables sound (autoplay policy).
 * Blip/slam/cancel/whoosh — the Atlus menu quartet.
 */

let ctx: AudioContext | null = null
let enabled = false

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  if (on) ac() // unlock on the enabling gesture
}

export function isSoundEnabled() {
  return enabled
}

interface ToneOpts {
  freq: number
  dur: number
  type?: OscillatorType
  vol?: number
  /** End frequency for a quick glide. */
  glide?: number
  delay?: number
}

function tone({ freq, dur, type = 'square', vol = 0.06, glide, delay = 0 }: ToneOpts) {
  const c = ac()
  if (!c || !enabled) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glide !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t0 + dur)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noiseBurst(dur: number, vol = 0.05, delay = 0, freq = 900) {
  const c = ac()
  if (!c || !enabled) return
  const t0 = c.currentTime + delay
  const frames = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(t0)
}

export const sfx = {
  move() {
    tone({ freq: 1240, dur: 0.05, type: 'square', vol: 0.035 })
  },
  confirm() {
    tone({ freq: 520, dur: 0.09, glide: 1180, vol: 0.06 })
    tone({ freq: 1560, dur: 0.14, delay: 0.05, vol: 0.04 })
  },
  cancel() {
    tone({ freq: 620, dur: 0.09, glide: 240, vol: 0.05 })
  },
  /** Low thud + shimmer at the covered moment of the blade cut. */
  cover() {
    tone({ freq: 210, dur: 0.16, type: 'triangle', glide: 60, vol: 0.1 })
    noiseBurst(0.08, 0.026, 0, 3200)
  },
  wipe() {
    noiseBurst(0.24, 0.045, 0, 700)
    noiseBurst(0.18, 0.03, 0.12, 1500)
  },
  open() {
    tone({ freq: 340, dur: 0.16, glide: 760, vol: 0.05 })
    tone({ freq: 1520, dur: 0.1, delay: 0.1, vol: 0.03 })
  },
  title() {
    tone({ freq: 392, dur: 0.5, type: 'triangle', vol: 0.05 })
    tone({ freq: 587, dur: 0.55, type: 'triangle', vol: 0.045, delay: 0.09 })
    tone({ freq: 784, dur: 0.7, type: 'triangle', vol: 0.05, delay: 0.18 })
  },
}
