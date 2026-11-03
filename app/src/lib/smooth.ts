import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

/** One-Euro filter: kills landmark jitter when still, stays responsive when moving. */
class OneEuro {
  private x: number | null = null
  private dx = 0
  private minCutoff = 1.7
  private beta = 6
  private dCutoff = 1
  private alpha(cutoff: number, dt: number) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt) }
  filter(v: number, dt: number) {
    if (this.x === null) { this.x = v; return v }
    const d = (v - this.x) / dt
    this.dx += this.alpha(this.dCutoff, dt) * (d - this.dx)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += this.alpha(cutoff, dt) * (v - this.x)
    return this.x
  }
}

export class LandmarkSmoother {
  private faces: { f: OneEuro[]; nose: { x: number; y: number } }[] = []
  private last = 0

  smooth(faces: NormalizedLandmark[][], now: number): NormalizedLandmark[][] {
    const dt = this.last ? Math.min(0.1, Math.max(0.001, (now - this.last) / 1000)) : 1 / 30
    this.last = now
    const used = new Set<number>()
    const next: typeof this.faces = []
    const out = faces.map(lm => {
      // match to the previous face with the nearest nose
      let best = -1, bd = 0.05
      this.faces.forEach((p, i) => {
        if (used.has(i)) return
        const d = Math.hypot(p.nose.x - lm[1].x, p.nose.y - lm[1].y)
        if (d < bd) { bd = d; best = i }
      })
      const prev = best >= 0 ? (used.add(best), this.faces[best]) : null
      const f = prev?.f ?? Array.from({ length: lm.length * 3 }, () => new OneEuro())
      next.push({ f, nose: { x: lm[1].x, y: lm[1].y } })
      return lm.map((p, i) => ({
        x: f[i * 3].filter(p.x, dt), y: f[i * 3 + 1].filter(p.y, dt), z: f[i * 3 + 2].filter(p.z, dt), visibility: p.visibility,
      }))
    })
    this.faces = next
    return out
  }
}
