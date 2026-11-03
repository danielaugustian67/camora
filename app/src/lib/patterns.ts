import type { PatternKind } from './themes'
import { drawDecor } from './decor'
import { rng } from './rng'

/** Fill rect (x,y,w,h) with a repeating pattern. Unit `u` scales the motif. */
export function drawPattern(
  c: CanvasRenderingContext2D, kind: PatternKind, color: string,
  x: number, y: number, w: number, h: number, u: number, seed = 1,
) {
  if (kind === 'none' || !color) return
  c.save()
  c.beginPath(); c.rect(x, y, w, h); c.clip()
  c.fillStyle = color; c.strokeStyle = color
  const r = rng(seed)
  switch (kind) {
    case 'dots':
      for (let j = 0, yy = y; yy < y + h + u; yy += u, j++)
        for (let xx = x + (j % 2 ? u / 2 : 0); xx < x + w + u; xx += u)
          { c.beginPath(); c.arc(xx, yy, u * 0.16, 0, 7); c.fill() }
      break
    case 'gingham':
      for (let xx = x; xx < x + w; xx += u * 2) c.fillRect(xx, y, u, h)
      for (let yy = y; yy < y + h; yy += u * 2) c.fillRect(x, yy, w, u)
      break
    case 'stripes':
      for (let xx = x; xx < x + w; xx += u * 1.2) c.fillRect(xx, y, u * 0.6, h)
      break
    case 'diagonal':
      c.lineWidth = u * 0.25
      for (let k = -h; k < w + h; k += u * 0.8) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k - h, y + h); c.stroke() }
      break
    case 'checker':
      for (let j = 0, yy = y; yy < y + h; yy += u, j++)
        for (let i = 0, xx = x; xx < x + w; xx += u, i++) if ((i + j) % 2) c.fillRect(xx, yy, u, u)
      break
    case 'grid':
      c.lineWidth = Math.max(1, u * 0.04)
      for (let xx = x; xx < x + w; xx += u * 0.7) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + h); c.stroke() }
      for (let yy = y; yy < y + h; yy += u * 0.7) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke() }
      break
    case 'waves':
      c.lineWidth = u * 0.12
      for (let yy = y; yy < y + h + u; yy += u * 0.8) {
        c.beginPath()
        for (let xx = x - u; xx < x + w + u; xx += u / 6) c.lineTo(xx, yy + Math.sin((xx / u) * Math.PI) * u * 0.15)
        c.stroke()
      }
      break
    case 'hearts': case 'stars': case 'floral': case 'clouds': {
      const k = kind === 'hearts' ? 'heart' : kind === 'stars' ? 'sparkle' : kind === 'floral' ? 'daisy' : 'cloud'
      for (let j = 0, yy = y; yy < y + h + u; yy += u * 1.3, j++)
        for (let xx = x + (j % 2 ? u * 0.65 : 0); xx < x + w + u; xx += u * 1.3) {
          const s = u * (kind === 'stars' ? 0.3 + r() * 0.35 : 0.5)
          c.save(); c.shadowColor = 'transparent'
          drawDecor(c, k, xx, yy, s, (r() - 0.5) * 0.6, color, color)
          c.restore()
        }
      break
    }
    case 'sprinkles':
      c.lineCap = 'round'; c.lineWidth = u * 0.1
      for (let i = 0; i < (w * h) / (u * u) * 1.5; i++) {
        const px = x + r() * w, py = y + r() * h, a = r() * Math.PI
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * u * 0.25, py + Math.sin(a) * u * 0.25); c.stroke()
      }
      break
    case 'leopard':
      for (let i = 0; i < (w * h) / (u * u) * 0.9; i++) {
        const px = x + r() * w, py = y + r() * h, s = u * (0.15 + r() * 0.15)
        c.lineWidth = s * 0.45
        c.beginPath(); c.arc(px, py, s, r() * 3, r() * 3 + 3.6); c.stroke()
      }
      break
  }
  c.restore()
}
