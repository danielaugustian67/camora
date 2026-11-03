import type { LayoutId, Theme } from './themes'
import { drawDecor } from './decor'
import { drawPattern } from './patterns'
import { hash, rng } from './rng'

export interface Rect { x: number; y: number; w: number; h: number }
export interface FrameGeometry { W: number; H: number; slots: Rect[]; footer: Rect; aspect: number }

/** Geometry of a layout at base width. `aspect` = slot width / height. */
export function geometry(layout: LayoutId): FrameGeometry {
  if (layout.startsWith('strip')) {
    const n = Number(layout.slice(5))
    const W = 900, m = W * 0.075, gap = W * 0.04
    const sw = W - m * 2, sh = sw * 0.75
    const slots = Array.from({ length: n }, (_, i) => ({ x: m, y: m + i * (sh + gap), w: sw, h: sh }))
    const top = m + n * sh + (n - 1) * gap
    const fh = W * 0.3
    return { W, H: top + fh, slots, footer: { x: 0, y: top, w: W, h: fh }, aspect: 4 / 3 }
  }
  if (layout.startsWith('grid')) {
    const rows = layout === 'grid4' ? 2 : 3
    const W = 1200, m = W * 0.05, gap = W * 0.03
    const sw = (W - m * 2 - gap) / 2, sh = sw * 4 / 3
    const slots: Rect[] = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++)
      slots.push({ x: m + c * (sw + gap), y: m + r * (sh + gap), w: sw, h: sh })
    const top = m + rows * sh + (rows - 1) * gap
    const fh = W * 0.2
    return { W, H: top + fh, slots, footer: { x: 0, y: top, w: W, h: fh }, aspect: 3 / 4 }
  }
  // polaroid
  const W = 1000, m = W * 0.07
  const sw = W - m * 2, sh = sw * 1.2
  return { W, H: m + sh + W * 0.32, slots: [{ x: m, y: m, w: sw, h: sh }], footer: { x: 0, y: m + sh, w: W, h: W * 0.32 }, aspect: 1 / 1.2 }
}

function roundRect(c: CanvasRenderingContext2D, r: Rect, rad: number) {
  c.beginPath()
  c.roundRect(r.x, r.y, r.w, r.h, rad)
}

export function drawCover(c: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, r: Rect) {
  const s = Math.max(r.w / iw, r.h / ih)
  const w = iw * s, h = ih * s
  c.drawImage(img, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h)
}

export interface Photo { img: CanvasImageSource; w: number; h: number }

export interface RenderOpts {
  caption?: string
  showDate?: boolean
  scale?: number
  placeholder?: boolean
}

export function renderFrame(theme: Theme, layout: LayoutId, photos: (Photo | null)[], opts: RenderOpts = {}) {
  const g = geometry(layout)
  const sc = opts.scale ?? 1
  const cv = document.createElement('canvas')
  cv.width = Math.round(g.W * sc)
  cv.height = Math.round(g.H * sc)
  const c = cv.getContext('2d')!
  c.scale(sc, sc)
  const W = g.W, H = g.H
  const u = W / 14

  // strip background
  if (theme.strip2) {
    const grad = c.createLinearGradient(0, 0, W * 0.4, H)
    grad.addColorStop(0, theme.strip); grad.addColorStop(1, theme.strip2)
    c.fillStyle = grad
  } else c.fillStyle = theme.strip
  c.fillRect(0, 0, W, H)
  drawPattern(c, theme.pattern, theme.patternColor, 0, 0, W, H, u, hash(theme.id))

  if (theme.footerBand) {
    const f = g.footer
    const by = f.y + f.h * 0.12
    c.fillStyle = theme.footerBand.color
    c.fillRect(0, by, W, H - by)
    drawPattern(c, theme.footerBand.pattern, theme.footerBand.patternColor, 0, by, W, H - by, u * 0.8, 7)
    // scalloped lace edge
    c.fillStyle = theme.footerBand.color
    for (let x = 0; x < W + u; x += u * 0.5) { c.beginPath(); c.arc(x, by, u * 0.25, Math.PI, 0); c.fill() }
  }

  // slots
  g.slots.forEach((s, i) => {
    const rad = theme.radius * s.w
    if (theme.slotBorder) {
      const b = W * 0.016
      c.fillStyle = theme.slotBorder
      roundRect(c, { x: s.x - b, y: s.y - b, w: s.w + b * 2, h: s.h + b * 2 }, rad + b)
      c.fill()
    }
    c.save()
    roundRect(c, s, rad)
    c.clip()
    c.fillStyle = theme.slotFill
    c.fillRect(s.x, s.y, s.w, s.h)
    const p = photos[i]
    if (p) drawCover(c, p.img, p.w, p.h, s)
    else if (opts.placeholder) {
      // soft placeholder silhouette
      c.fillStyle = 'rgba(0,0,0,0.07)'
      c.beginPath(); c.arc(s.x + s.w / 2, s.y + s.h * 0.45, s.h * 0.17, 0, 7); c.fill()
      c.beginPath(); c.ellipse(s.x + s.w / 2, s.y + s.h * 1.02, s.h * 0.35, s.h * 0.35, 0, Math.PI, 0); c.fill()
    }
    c.restore()
  })

  // decorations, seeded per theme + layout so the frame stays stable
  const r = rng(hash(theme.id + layout))
  if (theme.decor.length && theme.decorCount) {
    const anchors: [number, number][] = []
    g.slots.forEach(s => {
      anchors.push([s.x, s.y], [s.x + s.w, s.y + s.h * 0.95], [s.x + s.w, s.y + s.h * 0.05], [s.x, s.y + s.h])
    })
    const f = g.footer
    anchors.push([f.w * 0.85, f.y + f.h * 0.55], [f.w * 0.12, f.y + f.h * 0.5])
    for (let i = anchors.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [anchors[i], anchors[j]] = [anchors[j], anchors[i]] }
    const count = Math.min(anchors.length, theme.decorCount + Math.floor(g.slots.length / 2))
    for (let i = 0; i < count; i++) {
      const [kind, col, col2] = theme.decor[i % theme.decor.length]
      const [ax, ay] = anchors[i]
      const size = W * (0.15 + r() * 0.1) * (kind === 'tape' || kind === 'film' || kind === 'pin' ? 1.6 : 1)
      drawDecor(c, kind, ax + (r() - 0.5) * W * 0.04, ay + (r() - 0.5) * W * 0.04, size, (r() - 0.5) * 0.9, col, col2)
    }
  }

  // caption
  const f = g.footer
  const caption = opts.caption ?? theme.caption
  const fs = Math.min(f.h * 0.3, (W * 0.9) / Math.max(4, caption.length) * (theme.font === 'Press Start 2P' ? 1 : 1.7))
  c.fillStyle = theme.captionColor
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.font = `${fs}px "${theme.font}", cursive`
  const hasBand = !!theme.footerBand
  const cy = f.y + f.h * (opts.showDate ? 0.45 : 0.55)
  if (hasBand) {
    // pill label like "the joy of being"
    const tw = c.measureText(caption).width
    c.fillStyle = '#ffffffdd'
    roundRect(c, { x: W / 2 - tw / 2 - fs * 0.6, y: cy - fs * 0.85, w: tw + fs * 1.2, h: fs * 1.7 }, fs)
    c.fill()
    c.fillStyle = theme.captionColor
  }
  c.fillText(caption, W / 2, cy)
  if (opts.showDate) {
    c.font = `${f.h * 0.11}px "Fredoka", sans-serif`
    c.globalAlpha = 0.85
    c.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, f.y + f.h * 0.75)
    c.globalAlpha = 1
  }
  return cv
}
