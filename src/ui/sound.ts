/**
 * Tiny WebAudio bleeps — arcade relay sounds, off by default.
 */
export class Sound {
  private ctx: AudioContext | null = null
  enabled = false

  toggle(): boolean {
    this.enabled = !this.enabled
    if (this.enabled && !this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.enabled) void this.ctx?.resume()
    return this.enabled
  }

  private blip(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.03): void {
    if (!this.enabled || !this.ctx) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(this.ctx.destination)
    osc.start(t)
    osc.stop(t + dur)
  }

  hover(): void {
    this.blip(880, 0.05, 'square', 0.015)
  }

  dock(): void {
    this.blip(220, 0.12, 'square')
    window.setTimeout(() => this.blip(440, 0.18, 'square'), 90)
  }

  undock(): void {
    this.blip(440, 0.08, 'square', 0.02)
    window.setTimeout(() => this.blip(220, 0.12, 'square', 0.02), 60)
  }
}
