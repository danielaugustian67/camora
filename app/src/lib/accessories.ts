import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

/**
 * Face-tracked accessories, drawn procedurally with physically-inspired shading
 * (metal/acetate gradients, transparent tinted lenses with reflections, fabric/fur
 * texture). Local units: 1 = face width. Contact shadows and light matching are
 * applied by the pipeline on the whole accessory layer.
 */

export interface Pt { x: number; y: number }
export type AccSlot = 'mata' | 'kepala' | 'wajah'
export interface AccCtx { span: number; yaw: number }
type Draw = (c: CanvasRenderingContext2D, k: AccCtx) => void

export interface Accessory { id: string; name: string; slot: AccSlot; emoji: string; draw: Draw; skin?: boolean }

type C = CanvasRenderingContext2D

// ---------------------------------------------------------------- helpers
const lg = (c: C, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
  const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g
}
const rg = (c: C, x: number, y: number, r0: number, r1: number, stops: [number, string][], x1 = x, y1 = y) => {
  const g = c.createRadialGradient(x, y, r0, x1, y1, r1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g
}
let seed = 1
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

// ---------------------------------------------------------------- eyewear
type Shape = (p: Path2D, r: number) => void
const circle: Shape = (p, r) => { p.moveTo(r, 0); p.arc(0, 0, r, 0, Math.PI * 2) }
const rounded: Shape = (p, r) => p.roundRect(-r * 1.18, -r * 0.82, r * 2.36, r * 1.64, r * 0.38)
const wayfarer: Shape = (p, r) => {
  p.moveTo(-r * 1.2, -r * 0.78); p.lineTo(r * 1.25, -r * 0.85)
  p.quadraticCurveTo(r * 1.3, r * 0.3, r * 0.85, r * 0.72); p.quadraticCurveTo(0, r * 0.9, -r * 0.85, r * 0.7)
  p.quadraticCurveTo(-r * 1.25, r * 0.3, -r * 1.2, -r * 0.78); p.closePath()
}
const aviator: Shape = (p, r) => {
  p.moveTo(-r * 1.15, -r * 0.7); p.quadraticCurveTo(0, -r * 0.95, r * 1.15, -r * 0.7)
  p.bezierCurveTo(r * 1.35, r * 0.3, r * 0.7, r * 1.15, 0, r * 1.05)
  p.bezierCurveTo(-r * 0.9, r * 0.95, -r * 1.25, r * 0.2, -r * 1.15, -r * 0.7); p.closePath()
}
const cateye: Shape = (p, r) => { // right lens; left is mirrored
  p.moveTo(-r * 1.05, -r * 0.45); p.quadraticCurveTo(0, -r * 0.8, r * 1.45, -r * 1.0)
  p.quadraticCurveTo(r * 1.2, r * 0.6, r * 0.2, r * 0.75); p.quadraticCurveTo(-r * 0.95, r * 0.75, -r * 1.05, -r * 0.45); p.closePath()
}
const heart: Shape = (p, r) => {
  p.moveTo(0, r * 1.0)
  p.bezierCurveTo(-r * 1.7, -r * 0.1, -r * 0.9, -r * 1.4, 0, -r * 0.55)
  p.bezierCurveTo(r * 0.9, -r * 1.4, r * 1.7, -r * 0.1, 0, r * 1.0); p.closePath()
}
const star: Shape = (p, r) => {
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.55 : r * 1.25, a = (Math.PI / 5) * i - Math.PI / 2
    i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  p.closePath()
}
const shapePath = (s: Shape, r: number, mirror = false) => {
  const p = new Path2D(); s(p, r)
  if (!mirror) return p
  const q = new Path2D(); q.addPath(p, new DOMMatrix([-1, 0, 0, 1, 0, 0])); return q
}

interface Material { kind: 'acetate' | 'metal' | 'tortoise' | 'glossy'; base: string; light: string; dark: string }
interface LensTint { top: string; bottom: string; mirror?: boolean }

const MAT = {
  black: { kind: 'acetate', base: '#141414', light: '#5a5a5a', dark: '#000' },
  gold: { kind: 'metal', base: '#c9a24a', light: '#fff1c4', dark: '#6b4e16' },
  silver: { kind: 'metal', base: '#a8adb4', light: '#ffffff', dark: '#4a4f57' },
  rose: { kind: 'metal', base: '#d9a08f', light: '#ffe9e1', dark: '#7a4a3c' },
  tortoise: { kind: 'tortoise', base: '#5a2e12', light: '#c88a3c', dark: '#1e0d04' },
  clearPink: { kind: 'glossy', base: 'rgba(255,170,190,0.75)', light: 'rgba(255,255,255,0.9)', dark: 'rgba(170,60,90,0.8)' },
  red: { kind: 'glossy', base: '#d1123f', light: '#ff8fae', dark: '#6d0018' },
  yellow: { kind: 'glossy', base: '#f5b800', light: '#fff2a8', dark: '#8a5a00' },
} satisfies Record<string, Material>

const LENS = {
  clear: { top: 'rgba(200,220,235,0.10)', bottom: 'rgba(255,255,255,0.04)' },
  dark: { top: 'rgba(12,12,16,0.92)', bottom: 'rgba(40,40,48,0.82)' },
  brown: { top: 'rgba(60,32,12,0.88)', bottom: 'rgba(170,110,60,0.55)' },
  pink: { top: 'rgba(255,60,120,0.55)', bottom: 'rgba(255,170,200,0.35)' },
  amber: { top: 'rgba(255,170,0,0.55)', bottom: 'rgba(255,230,120,0.30)' },
  mirror: { top: 'rgba(80,170,255,0.85)', bottom: 'rgba(255,120,220,0.75)', mirror: true },
} satisfies Record<string, LensTint>

function paintMaterial(c: C, area: Path2D, m: Material, r: number) {
  c.save()
  c.clip(area, 'evenodd')
  if (m.kind === 'metal') {
    c.fillStyle = lg(c, 0, -r * 1.3, 0, r * 1.3, [[0, m.light], [0.22, m.base], [0.48, m.dark], [0.55, m.base], [0.78, m.light], [1, m.dark]])
  } else if (m.kind === 'tortoise') {
    c.fillStyle = m.base
  } else {
    c.fillStyle = lg(c, 0, -r * 1.3, 0, r * 1.3, [[0, m.light], [0.15, m.base], [0.85, m.base], [1, m.dark]])
  }
  c.fillRect(-r * 3, -r * 3, r * 6, r * 6)
  if (m.kind === 'tortoise') {
    seed = 7
    for (let i = 0; i < 60; i++) {
      const x = (rnd() - 0.5) * r * 4, y = (rnd() - 0.5) * r * 3, s = r * (0.08 + rnd() * 0.25)
      c.fillStyle = rg(c, x, y, 0, s, [[0, i % 3 ? m.light : '#e0a85a'], [1, 'rgba(0,0,0,0)']])
      c.globalAlpha = 0.65
      c.beginPath(); c.ellipse(x, y, s, s * 0.6, rnd() * 3, 0, 7); c.fill()
    }
    c.globalAlpha = 1
    c.fillStyle = lg(c, 0, -r, 0, r, [[0, 'rgba(255,255,255,0.18)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']])
    c.fillRect(-r * 3, -r * 3, r * 6, r * 6)
  }
  c.restore()
}

function paintLens(c: C, lens: Path2D, t: LensTint, r: number) {
  c.save()
  c.clip(lens)
  c.fillStyle = lg(c, 0, -r, 0, r, [[0, t.top], [1, t.bottom]])
  c.fillRect(-r * 3, -r * 3, r * 6, r * 6)
  if (t.mirror) {
    c.globalCompositeOperation = 'screen'
    c.fillStyle = lg(c, -r, -r, r, r, [[0, 'rgba(255,255,255,0.0)'], [0.45, 'rgba(255,255,255,0.35)'], [0.55, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0.25)']])
    c.fillRect(-r * 3, -r * 3, r * 6, r * 6)
    c.globalCompositeOperation = 'source-over'
  }
  // soft environment reflection (window light) + sharp specular streak
  c.rotate(-0.6)
  c.fillStyle = lg(c, -r * 0.9, 0, -r * 0.1, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']])
  c.fillRect(-r * 0.9, -r * 2, r * 0.8, r * 4)
  c.fillStyle = lg(c, r * 0.12, 0, r * 0.24, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.16)'], [1, 'rgba(255,255,255,0)']])
  c.fillRect(r * 0.12, -r * 2, r * 0.12, r * 4)
  c.restore()
}

function bevel(c: C, outer: Path2D, r: number, lw: number) {
  c.save()
  c.clip(outer)
  c.strokeStyle = lg(c, 0, -r * 1.2, 0, r * 1.2, [[0, 'rgba(255,255,255,0.55)'], [0.35, 'rgba(255,255,255,0.0)'], [1, 'rgba(255,255,255,0.12)']])
  c.lineWidth = lw
  c.stroke(outer)
  c.restore()
}

interface GlassesSpec { shape: Shape; r: number; thick: number; mat: Material; lens: LensTint; mirrorLeft?: boolean; pads?: boolean; topBar?: boolean }

function glasses(g: GlassesSpec): Draw {
  return (c, k) => {
    const half = k.span / 2
    const cy = Math.cos(k.yaw)
    const rr = g.r * k.span / 0.42
    const t = g.thick * rr
    const sides: number[] = Math.sin(k.yaw) > 0 ? [1, -1] : [-1, 1] // far side first
    // temples (go back toward the ears; hide the one turned away)
    for (const d of sides) {
      if (d * Math.sin(k.yaw) > 0.12) continue
      const x0 = d * (half * cy + rr * 1.15 * cy)
      c.save()
      c.strokeStyle = g.mat.kind === 'metal' ? g.mat.dark : g.mat.base
      c.lineWidth = t * 0.55; c.lineCap = 'round'
      c.beginPath(); c.moveTo(x0, -rr * 0.35); c.lineTo(d * 0.56 * Math.max(0.5, cy), -rr * 0.5); c.stroke()
      c.restore()
    }
    // bridge
    {
      const p = new Path2D()
      const xi = half * cy - rr * 0.95 * cy
      p.moveTo(-xi, -rr * 0.25); p.quadraticCurveTo(0, -rr * 0.65, xi, -rr * 0.25)
      c.save(); c.lineCap = 'round'
      c.strokeStyle = g.mat.kind === 'metal' ? lg(c, 0, -rr * 0.7, 0, -rr * 0.1, [[0, g.mat.light], [0.5, g.mat.base], [1, g.mat.dark]]) : g.mat.base
      c.lineWidth = t * (g.mat.kind === 'metal' ? 0.7 : 1.0)
      c.stroke(p)
      if (g.topBar) { const q = new Path2D(); q.moveTo(-xi - rr * 0.6, -rr * 0.85); q.quadraticCurveTo(0, -rr * 1.0, xi + rr * 0.6, -rr * 0.85); c.lineWidth = t * 0.55; c.stroke(q) }
      c.restore()
    }
    for (const d of sides) {
      const ss = 1 - d * Math.sin(k.yaw) * 0.28
      c.save()
      c.translate(d * half * cy, 0)
      c.scale(cy * ss, ss)
      const mirror = !!g.mirrorLeft && d < 0
      const inner = shapePath(g.shape, rr, mirror)
      const outer = shapePath(g.shape, rr + t, mirror)
      paintLens(c, inner, g.lens, rr)
      const ring = new Path2D(); ring.addPath(outer); ring.addPath(inner)
      paintMaterial(c, ring, g.mat, rr + t)
      bevel(c, outer, rr, t * 0.35)
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = rr * 0.012; c.stroke(inner)
      if (g.pads) {
        c.fillStyle = 'rgba(255,255,255,0.35)'
        c.beginPath(); c.ellipse(-d * rr * 0.85, rr * 0.35, rr * 0.07, rr * 0.13, d * 0.3, 0, 7); c.fill()
      }
      c.restore()
    }
  }
}

const shieldVisor: Draw = (c, k) => {
  const w = k.span * 1.25, cy = Math.cos(k.yaw)
  c.save(); c.scale(cy, 1)
  const p = new Path2D()
  p.moveTo(-w, -0.09); p.quadraticCurveTo(0, -0.17, w, -0.09)
  p.quadraticCurveTo(w * 1.02, 0.06, w * 0.75, 0.1); p.quadraticCurveTo(0, 0.16, -w * 0.75, 0.1)
  p.quadraticCurveTo(-w * 1.02, 0.06, -w, -0.09); p.closePath()
  paintLens(c, p, LENS.mirror, 0.2)
  c.save(); c.clip(p)
  c.fillStyle = lg(c, 0, -0.15, 0, 0.15, [[0, 'rgba(255,255,255,0.35)'], [0.3, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.2)']])
  c.fillRect(-1, -1, 2, 2); c.restore()
  c.strokeStyle = lg(c, 0, -0.17, 0, 0.16, [[0, '#ffffff'], [0.5, '#9aa0aa'], [1, '#e5e7ea']]); c.lineWidth = 0.012; c.stroke(p)
  c.restore()
}

// ---------------------------------------------------------------- headwear
const shadowed = (c: C, blur: number, fn: () => void) => {
  // shadow params live in device pixels, so convert from local face units
  const m = c.getTransform(), px = Math.hypot(m.a, m.b)
  c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = blur * px; c.shadowOffsetY = blur * px * 0.3; fn(); c.restore()
}
const gem = (c: C, x: number, y: number, r: number, col: string) => {
  c.fillStyle = rg(c, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, '#ffffff'], [0.25, col], [1, '#000000']])
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill()
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, 7); c.fill()
}

function petal(c: C, len: number, wid: number, base: string, tip: string, vein = true) {
  const p = new Path2D()
  p.moveTo(0, 0); p.bezierCurveTo(wid, -len * 0.25, wid * 0.8, -len * 0.85, 0, -len)
  p.bezierCurveTo(-wid * 0.8, -len * 0.85, -wid, -len * 0.25, 0, 0)
  c.fillStyle = lg(c, 0, 0, 0, -len, [[0, base], [1, tip]]); c.fill(p)
  if (vein) { c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = wid * 0.06; c.beginPath(); c.moveTo(0, -len * 0.05); c.lineTo(0, -len * 0.8); c.stroke() }
  c.save(); c.clip(p); c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(-wid * 0.3, -len * 0.55, wid * 0.25, len * 0.3, 0.2, 0, 7); c.fill(); c.restore()
}
function flower(c: C, x: number, y: number, s: number, petals: number, base: string, tip: string, center: string, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot)
  for (let i = 0; i < petals; i++) { c.save(); c.rotate((Math.PI * 2 / petals) * i); petal(c, s, s * 0.45, base, tip); c.restore() }
  c.fillStyle = rg(c, -s * 0.05, -s * 0.05, 0, s * 0.28, [[0, '#fff6b0'], [0.5, center], [1, '#7a4a10']])
  c.beginPath(); c.arc(0, 0, s * 0.24, 0, 7); c.fill()
  c.restore()
}
function leaf(c: C, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot); petal(c, s, s * 0.32, '#3f7a2a', '#8fc56a'); c.restore()
}
function fur(c: C, path: Path2D, base: string, light: string, r: number, n = 260) {
  c.save(); c.clip(path)
  c.fillStyle = base; c.fillRect(-2, -2, 4, 4)
  seed = 3
  c.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const x = (rnd() - 0.5) * r * 2, y = (rnd() - 0.5) * r * 2, a = -Math.PI / 2 + (rnd() - 0.5) * 1.2
    c.strokeStyle = i % 3 ? light : 'rgba(0,0,0,0.08)'; c.lineWidth = r * 0.012
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.06, y + Math.sin(a) * r * 0.06); c.stroke()
  }
  c.restore()
}

const crown: Draw = c => {
  const p = new Path2D()
  p.moveTo(-0.32, 0.06); p.lineTo(-0.36, -0.2); p.lineTo(-0.2, -0.06); p.lineTo(-0.1, -0.26); p.lineTo(0, -0.1)
  p.lineTo(0.1, -0.26); p.lineTo(0.2, -0.06); p.lineTo(0.36, -0.2); p.lineTo(0.32, 0.06); p.closePath()
  shadowed(c, 0.03, () => { c.fillStyle = '#b8860b'; c.fill(p) })
  c.save(); c.clip(p)
  c.fillStyle = lg(c, -0.4, -0.3, 0.4, 0.1, [[0, '#fff3b0'], [0.25, '#e8b923'], [0.45, '#8a6205'], [0.6, '#f7d55c'], [0.8, '#b8860b'], [1, '#fff0a0']])
  c.fillRect(-0.5, -0.5, 1, 1)
  c.fillStyle = lg(c, 0, -0.3, 0, 0.08, [[0, 'rgba(255,255,255,0.35)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']])
  c.fillRect(-0.5, -0.5, 1, 1)
  c.restore()
  c.strokeStyle = 'rgba(90,60,0,0.6)'; c.lineWidth = 0.006; c.stroke(p)
  c.fillStyle = lg(c, 0, 0, 0, 0.07, [[0, '#ffe680'], [1, '#8a6205']]); c.fillRect(-0.33, 0.0, 0.66, 0.06)
  ;[[-0.36, -0.2], [-0.1, -0.26], [0.1, -0.26], [0.36, -0.2]].forEach(([x, y]) => gem(c, x, y, 0.025, '#f5f5ff'))
  gem(c, -0.18, 0.03, 0.024, '#e0115f'); gem(c, 0, 0.03, 0.03, '#1e6fff'); gem(c, 0.18, 0.03, 0.024, '#0fa36b')
}

const tiara: Draw = c => {
  for (let i = -6; i <= 6; i++) {
    const x = i * 0.045, h = 0.1 + Math.cos(i / 6 * Math.PI / 2) * 0.12
    c.strokeStyle = lg(c, x, 0.05, x, 0.05 - h, [[0, '#9aa0aa'], [1, '#ffffff']]); c.lineWidth = 0.014
    c.beginPath(); c.moveTo(x * 1.2, 0.06); c.quadraticCurveTo(x * 1.1, 0.06 - h * 0.5, x, 0.05 - h); c.stroke()
    gem(c, x, 0.05 - h, 0.012 + (i === 0 ? 0.01 : 0), i === 0 ? '#9fd8ff' : '#ffffff')
  }
  c.strokeStyle = lg(c, -0.3, 0, 0.3, 0, [[0, '#9aa0aa'], [0.5, '#ffffff'], [1, '#9aa0aa']]); c.lineWidth = 0.014
  c.beginPath(); c.moveTo(-0.32, 0.08); c.quadraticCurveTo(0, 0.02, 0.32, 0.08); c.stroke()
}

const flowerCrown: Draw = c => {
  const pal: [string, string, string][] = [['#ffd1dc', '#ff8fab', '#ffcf40'], ['#ffffff', '#f3e9ff', '#ffcf40'], ['#ffe0b5', '#ffa36c', '#c96a10'], ['#e7d3ff', '#b48cf0', '#ffcf40']]
  for (let i = -7; i <= 7; i++) {
    const x = i * 0.045, y = 0.1 + (i * i) * 0.0022
    leaf(c, x, y + 0.01, 0.07, (i % 2 ? 1 : -1) * 1.2 + i * 0.1)
  }
  for (let i = -6; i <= 6; i++) {
    const [b, t, ctr] = pal[(i + 12) % pal.length]
    const x = i * 0.05, y = 0.09 + (i * i) * 0.0022
    shadowed(c, 0.015, () => flower(c, x, y, i % 2 ? 0.045 : 0.06, i % 2 ? 6 : 5, t, b, ctr, i))
  }
}

const ears = (outer: string, outerLight: string, inner: string, tall: number, wide: number, spread: number, rot: number, round: boolean): Draw => c => {
  for (const d of [-1, 1]) {
    c.save(); c.translate(d * spread, 0.06); c.rotate(d * rot)
    const p = new Path2D()
    if (round) p.ellipse(0, -tall / 2, wide, tall / 2, 0, 0, Math.PI * 2)
    else { p.moveTo(-wide, 0.03); p.quadraticCurveTo(-wide * 0.5, -tall * 0.6, d * wide * 0.1, -tall); p.quadraticCurveTo(wide * 0.6, -tall * 0.55, wide, 0.03); p.closePath() }
    shadowed(c, 0.02, () => { c.fillStyle = outer; c.fill(p) })
    fur(c, p, outer, outerLight, tall)
    c.save(); c.clip(p); c.fillStyle = lg(c, -wide, 0, wide, 0, [[0, 'rgba(0,0,0,0.25)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.2)']]); c.fillRect(-1, -1, 2, 2); c.restore()
    const q = new Path2D()
    if (round) q.ellipse(0, -tall * 0.45, wide * 0.5, tall * 0.38, 0, 0, Math.PI * 2)
    else { q.moveTo(-wide * 0.55, 0.0); q.quadraticCurveTo(-wide * 0.3, -tall * 0.5, d * wide * 0.05, -tall * 0.78); q.quadraticCurveTo(wide * 0.3, -tall * 0.45, wide * 0.55, 0.0); q.closePath() }
    c.fillStyle = rg(c, 0, -tall * 0.45, 0, tall * 0.5, [[0, inner], [1, 'rgba(160,60,80,0.9)']]); c.fill(q)
    c.restore()
  }
  c.strokeStyle = lg(c, 0, -0.03, 0, 0.03, [[0, '#555'], [1, '#111']]); c.lineWidth = 0.018
  c.beginPath(); c.arc(0, 0.28, 0.36, Math.PI * 1.15, Math.PI * 1.85); c.stroke()
}

const satinBow: Draw = c => {
  c.save(); c.translate(0.2, 0.0); c.rotate(0.3)
  for (const d of [-1, 1]) {
    const tail = new Path2D(); tail.moveTo(d * 0.01, 0.01); tail.lineTo(d * 0.08, 0.2); tail.lineTo(d * 0.11, 0.17); tail.lineTo(d * 0.13, 0.21); tail.lineTo(d * 0.04, 0.0); tail.closePath()
    c.fillStyle = lg(c, 0, 0, d * 0.1, 0.2, [[0, '#ff6f9c'], [0.5, '#ffc2d6'], [1, '#d84a7a']]); c.fill(tail)
    const p = new Path2D()
    p.moveTo(0, 0); p.bezierCurveTo(d * 0.06, -0.14, d * 0.2, -0.12, d * 0.17, 0); p.bezierCurveTo(d * 0.2, 0.1, d * 0.06, 0.1, 0, 0)
    shadowed(c, 0.02, () => { c.fillStyle = '#ff7aa6'; c.fill(p) })
    c.save(); c.clip(p)
    c.fillStyle = lg(c, 0, -0.12, 0, 0.1, [[0, '#ffd6e5'], [0.3, '#ff7aa6'], [0.55, '#ffc2d6'], [0.75, '#e0507f'], [1, '#a8204f']]); c.fillRect(-0.3, -0.3, 0.6, 0.6)
    c.restore()
  }
  c.fillStyle = rg(c, -0.01, -0.01, 0, 0.04, [[0, '#ffd6e5'], [1, '#c2185b']]); c.beginPath(); c.ellipse(0, 0, 0.035, 0.045, 0, 0, 7); c.fill()
  c.restore()
}

const cowboy: Draw = c => {
  const brim = new Path2D(); brim.ellipse(0, 0.05, 0.6, 0.1, 0, 0, Math.PI * 2)
  shadowed(c, 0.04, () => { c.fillStyle = '#6b4420'; c.fill(brim) })
  c.fillStyle = lg(c, 0, -0.05, 0, 0.15, [[0, '#b07a45'], [0.5, '#8a5a2b'], [1, '#4e3015']]); c.fill(brim)
  const crownP = new Path2D()
  crownP.moveTo(-0.27, 0.05); crownP.quadraticCurveTo(-0.32, -0.32, -0.1, -0.3); crownP.quadraticCurveTo(0, -0.22, 0.1, -0.3); crownP.quadraticCurveTo(0.32, -0.32, 0.27, 0.05); crownP.closePath()
  c.fillStyle = lg(c, -0.3, 0, 0.3, 0, [[0, '#5a3818'], [0.35, '#a87444'], [0.6, '#8a5a2b'], [1, '#4a2c10']]); c.fill(crownP)
  c.fillStyle = lg(c, 0, -0.04, 0, 0.04, [[0, '#2a1a0a'], [1, '#4a3018']]); c.fillRect(-0.275, -0.04, 0.55, 0.07)
  c.strokeStyle = 'rgba(255,230,190,0.35)'; c.setLineDash([0.012, 0.01]); c.lineWidth = 0.004
  c.beginPath(); c.ellipse(0, 0.05, 0.56, 0.085, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([])
}

const beanie: Draw = c => {
  const dome = new Path2D(); dome.moveTo(-0.42, 0.06); dome.bezierCurveTo(-0.42, -0.42, 0.42, -0.42, 0.42, 0.06); dome.closePath()
  shadowed(c, 0.03, () => { c.fillStyle = '#b8473a'; c.fill(dome) })
  c.save(); c.clip(dome)
  c.fillStyle = '#c9584a'; c.fillRect(-0.5, -0.5, 1, 1)
  for (let x = -0.42; x < 0.44; x += 0.035) {
    c.fillStyle = lg(c, x, 0, x + 0.035, 0, [[0, 'rgba(0,0,0,0.18)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(0,0,0,0.18)']])
    c.fillRect(x, -0.5, 0.035, 0.6)
  }
  c.fillStyle = rg(c, -0.1, -0.25, 0.02, 0.5, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(0,0,0,0.3)']]); c.fillRect(-0.5, -0.5, 1, 1)
  c.restore()
  const cuff = new Path2D(); cuff.roundRect(-0.44, -0.02, 0.88, 0.13, 0.05)
  c.fillStyle = '#a53d31'; c.fill(cuff)
  c.save(); c.clip(cuff)
  for (let x = -0.44; x < 0.46; x += 0.025) { c.fillStyle = lg(c, x, 0, x + 0.025, 0, [[0, 'rgba(0,0,0,0.25)'], [0.5, 'rgba(255,255,255,0.15)'], [1, 'rgba(0,0,0,0.25)']]); c.fillRect(x, -0.05, 0.025, 0.2) }
  c.restore()
  const pom = new Path2D(); pom.arc(0, -0.34, 0.08, 0, Math.PI * 2)
  shadowed(c, 0.02, () => { c.fillStyle = '#f2ece4'; c.fill(pom) })
  fur(c, pom, '#f4efe8', 'rgba(255,255,255,0.9)', 0.1, 160)
}

const santa: Draw = c => {
  const cone = new Path2D(); cone.moveTo(-0.38, 0.05); cone.bezierCurveTo(-0.3, -0.45, 0.2, -0.45, 0.48, -0.2); cone.lineTo(0.38, 0.05); cone.closePath()
  shadowed(c, 0.03, () => { c.fillStyle = '#b3121b'; c.fill(cone) })
  c.save(); c.clip(cone)
  c.fillStyle = lg(c, -0.4, 0, 0.4, 0, [[0, '#7a0a10'], [0.35, '#d62828'], [0.6, '#c21a22'], [1, '#6d080d']]); c.fillRect(-0.6, -0.6, 1.2, 1)
  c.restore()
  const trim = new Path2D(); trim.roundRect(-0.43, -0.02, 0.86, 0.14, 0.07)
  fur(c, trim, '#f3f0ea', 'rgba(255,255,255,0.95)', 0.45, 500)
  const pom = new Path2D(); pom.arc(0.48, -0.2, 0.075, 0, Math.PI * 2)
  fur(c, pom, '#f3f0ea', 'rgba(255,255,255,0.95)', 0.1, 140)
}

const gradCap: Draw = c => {
  const top = new Path2D(); top.moveTo(-0.52, -0.12); top.lineTo(0, -0.3); top.lineTo(0.52, -0.12); top.lineTo(0, 0.04); top.closePath()
  const base = new Path2D(); base.moveTo(-0.27, -0.05); base.lineTo(-0.27, 0.09); base.quadraticCurveTo(0, 0.17, 0.27, 0.09); base.lineTo(0.27, -0.05); base.closePath()
  c.fillStyle = lg(c, -0.27, 0, 0.27, 0, [[0, '#050505'], [0.5, '#2a2a2a'], [1, '#050505']]); c.fill(base)
  shadowed(c, 0.03, () => { c.fillStyle = '#151515'; c.fill(top) })
  c.save(); c.clip(top); c.fillStyle = lg(c, -0.3, -0.3, 0.3, 0.05, [[0, '#3a3a3a'], [1, '#0a0a0a']]); c.fillRect(-0.6, -0.4, 1.2, 0.5); c.restore()
  c.strokeStyle = '#e8b923'; c.lineWidth = 0.008
  c.beginPath(); c.moveTo(0, -0.13); c.quadraticCurveTo(0.25, -0.12, 0.4, -0.08); c.lineTo(0.4, 0.12); c.stroke()
  c.fillStyle = lg(c, 0.37, 0.1, 0.43, 0.22, [[0, '#ffe27a'], [1, '#a87a0a']]); c.fillRect(0.375, 0.1, 0.05, 0.11)
  c.fillStyle = '#e8b923'; c.beginPath(); c.arc(0, -0.13, 0.015, 0, 7); c.fill()
}

const halo: Draw = c => {
  c.save()
  c.shadowColor = 'rgba(255,240,160,0.95)'; c.shadowBlur = 25
  c.strokeStyle = lg(c, -0.28, 0, 0.28, 0, [[0, '#f7d046'], [0.5, '#fffbe0'], [1, '#f7d046']]); c.lineWidth = 0.035
  c.beginPath(); c.ellipse(0, -0.16, 0.27, 0.06, 0, 0, 7); c.stroke()
  c.restore()
}

const horns: Draw = c => {
  for (const d of [-1, 1]) {
    const p = new Path2D()
    p.moveTo(d * 0.1, 0.08); p.bezierCurveTo(d * 0.12, -0.05, d * 0.2, -0.16, d * 0.34, -0.22); p.bezierCurveTo(d * 0.3, -0.1, d * 0.28, 0.0, d * 0.24, 0.1); p.closePath()
    shadowed(c, 0.02, () => { c.fillStyle = '#7a0000'; c.fill(p) })
    c.save(); c.clip(p)
    c.fillStyle = lg(c, d * 0.1, 0, d * 0.3, -0.1, [[0, '#4a0000'], [0.45, '#c1121f'], [0.6, '#ff6b6b'], [1, '#5c0000']]); c.fillRect(-0.5, -0.5, 1, 1)
    c.restore()
  }
}

const partyHat: Draw = c => {
  c.save(); c.translate(0.1, 0.02); c.rotate(0.22)
  const cone = new Path2D(); cone.moveTo(-0.17, 0.04); cone.lineTo(0, -0.5); cone.lineTo(0.17, 0.04); cone.closePath()
  shadowed(c, 0.03, () => { c.fillStyle = '#ff5fa2'; c.fill(cone) })
  c.save(); c.clip(cone)
  c.fillStyle = '#ff5fa2'; c.fillRect(-0.3, -0.6, 0.6, 0.7)
  c.fillStyle = '#ffd23f'
  for (let y = -0.5; y < 0.1; y += 0.11) { c.beginPath(); c.moveTo(-0.3, y + 0.08); c.lineTo(0.3, y - 0.02); c.lineTo(0.3, y + 0.02); c.lineTo(-0.3, y + 0.12); c.fill() }
  c.fillStyle = lg(c, -0.17, 0, 0.17, 0, [[0, 'rgba(0,0,0,0.3)'], [0.35, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.35)']]); c.fillRect(-0.3, -0.6, 0.6, 0.7)
  c.restore()
  const pom = new Path2D(); pom.arc(0, -0.52, 0.05, 0, Math.PI * 2)
  fur(c, pom, '#4dabf7', 'rgba(220,240,255,0.9)', 0.06, 120)
  c.restore()
}

const starBand: Draw = c => {
  c.strokeStyle = lg(c, 0, -0.03, 0, 0.03, [[0, '#444'], [1, '#111']]); c.lineWidth = 0.016
  c.beginPath(); c.arc(0, 0.28, 0.36, Math.PI * 1.15, Math.PI * 1.85); c.stroke()
  for (const [x, y, s] of [[-0.22, -0.2, 0.06], [0, -0.3, 0.075], [0.22, -0.2, 0.06]]) {
    c.strokeStyle = '#999'; c.lineWidth = 0.005
    c.beginPath(); c.moveTo(x * 0.8, 0.0); c.bezierCurveTo(x, -0.05, x * 1.1, y + 0.1, x, y); c.stroke()
    const p = new Path2D(); star(p, s)
    c.save(); c.translate(x, y)
    shadowed(c, 0.015, () => { c.fillStyle = '#f5b800'; c.fill(p) })
    c.save(); c.clip(p); c.fillStyle = lg(c, -s, -s, s, s, [[0, '#fff6b0'], [0.45, '#ffd23f'], [0.55, '#e0a000'], [1, '#fff0a0']]); c.fillRect(-s * 2, -s * 2, s * 4, s * 4); c.restore()
    c.restore()
  }
}

// ---------------------------------------------------------------- registry
export const ACCESSORIES: Accessory[] = [
  { id: 'round-gold', name: 'Bulat Emas', slot: 'mata', emoji: '👓', draw: glasses({ shape: circle, r: 0.15, thick: 0.08, mat: MAT.gold, lens: LENS.clear, pads: true }) },
  { id: 'wayfarer', name: 'Wayfarer', slot: 'mata', emoji: '🕶️', draw: glasses({ shape: wayfarer, r: 0.135, thick: 0.2, mat: MAT.black, lens: LENS.dark }) },
  { id: 'aviator', name: 'Aviator', slot: 'mata', emoji: '😎', draw: glasses({ shape: aviator, r: 0.14, thick: 0.06, mat: MAT.gold, lens: LENS.brown, pads: true, topBar: true }) },
  { id: 'tortoise', name: 'Tortoise', slot: 'mata', emoji: '🤓', draw: glasses({ shape: rounded, r: 0.13, thick: 0.17, mat: MAT.tortoise, lens: LENS.clear }) },
  { id: 'cateye', name: 'Cat Eye', slot: 'mata', emoji: '🐱', draw: glasses({ shape: cateye, r: 0.115, thick: 0.15, mat: MAT.red, lens: LENS.clear, mirrorLeft: true }) },
  { id: 'clear-pink', name: 'Bening Pink', slot: 'mata', emoji: '🩷', draw: glasses({ shape: circle, r: 0.155, thick: 0.13, mat: MAT.clearPink, lens: LENS.clear }) },
  { id: 'silver-rect', name: 'Silver Kotak', slot: 'mata', emoji: '🧑‍💻', draw: glasses({ shape: rounded, r: 0.125, thick: 0.06, mat: MAT.silver, lens: LENS.clear, pads: true }) },
  { id: 'mirror', name: 'Mirror Y2K', slot: 'mata', emoji: '🪩', draw: glasses({ shape: rounded, r: 0.13, thick: 0.05, mat: MAT.silver, lens: LENS.mirror, pads: true }) },
  { id: 'heart', name: 'Hati', slot: 'mata', emoji: '😍', draw: glasses({ shape: heart, r: 0.13, thick: 0.14, mat: MAT.red, lens: LENS.pink }) },
  { id: 'star', name: 'Bintang', slot: 'mata', emoji: '🤩', draw: glasses({ shape: star, r: 0.12, thick: 0.13, mat: MAT.yellow, lens: LENS.amber }) },
  { id: 'rose-round', name: 'Rose Gold', slot: 'mata', emoji: '🌹', draw: glasses({ shape: circle, r: 0.16, thick: 0.06, mat: MAT.rose, lens: LENS.pink, pads: true }) },
  { id: 'visor', name: 'Visor Y2K', slot: 'mata', emoji: '🥽', draw: shieldVisor },

  { id: 'crown', name: 'Mahkota', slot: 'kepala', emoji: '👑', draw: crown },
  { id: 'tiara', name: 'Tiara', slot: 'kepala', emoji: '💎', draw: tiara },
  { id: 'flower-crown', name: 'Mahkota Bunga', slot: 'kepala', emoji: '🌸', draw: flowerCrown },
  { id: 'bunny', name: 'Kelinci', slot: 'kepala', emoji: '🐰', draw: ears('#f4f1ee', 'rgba(255,255,255,0.9)', '#ffc2d1', 0.5, 0.085, 0.14, 0.18, true) },
  { id: 'cat-ears', name: 'Kucing', slot: 'kepala', emoji: '😺', draw: ears('#2f2622', 'rgba(110,90,80,0.8)', '#ff9db0', 0.26, 0.12, 0.27, 0.3, false) },
  { id: 'fox-ears', name: 'Rubah', slot: 'kepala', emoji: '🦊', draw: ears('#d96b27', 'rgba(255,190,120,0.8)', '#fff1e0', 0.3, 0.13, 0.27, 0.32, false) },
  { id: 'bow', name: 'Pita Satin', slot: 'kepala', emoji: '🎀', draw: satinBow },
  { id: 'cowboy', name: 'Koboi', slot: 'kepala', emoji: '🤠', draw: cowboy },
  { id: 'beanie', name: 'Beanie', slot: 'kepala', emoji: '🧶', draw: beanie },
  { id: 'santa', name: 'Santa', slot: 'kepala', emoji: '🎅', draw: santa },
  { id: 'grad-cap', name: 'Toga', slot: 'kepala', emoji: '🎓', draw: gradCap },
  { id: 'party', name: 'Pesta', slot: 'kepala', emoji: '🥳', draw: partyHat },
  { id: 'halo', name: 'Halo', slot: 'kepala', emoji: '😇', draw: halo },
  { id: 'devil', name: 'Tanduk', slot: 'kepala', emoji: '😈', draw: horns },
  { id: 'star-band', name: 'Bando Bintang', slot: 'kepala', emoji: '⭐', draw: starBand },

  { id: 'blush', name: 'Blush', slot: 'wajah', emoji: '☺️', draw: () => {}, skin: true },
  { id: 'freckles', name: 'Freckles', slot: 'wajah', emoji: '🌰', draw: () => {}, skin: true },
  { id: 'sunkissed', name: 'Sun-kissed', slot: 'wajah', emoji: '☀️', draw: () => {}, skin: true },
  { id: 'heart-cheeks', name: 'Stiker Hati', slot: 'wajah', emoji: '💕', draw: () => {} },
  { id: 'glitter', name: 'Glitter', slot: 'wajah', emoji: '✨', draw: () => {} },
  { id: 'whiskers', name: 'Kumis Kucing', slot: 'wajah', emoji: '🐈', draw: () => {} },
]

export interface FacePose { eyes: Pt; head: Pt; nose: Pt; lip: Pt; cheekL: Pt; cheekR: Pt; angle: number; fw: number; span: number; yaw: number }

/** Face pose in canvas pixels from (already smoothed) landmarks. */
export function facePose(lm: NormalizedLandmark[], w: number, h: number): FacePose {
  const P = (i: number): Pt => ({ x: lm[i].x * w, y: lm[i].y * h })
  const hasIris = lm.length > 473
  let a = hasIris ? P(468) : P(33), b = hasIris ? P(473) : P(263)
  if (a.x > b.x) [a, b] = [b, a]
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  let li = 234, ri = 454
  if (lm[li].x > lm[ri].x) [li, ri] = [ri, li]
  const l = P(li), r = P(ri)
  const fw = Math.hypot(r.x - l.x, r.y - l.y)
  // yaw from the depth difference of the face sides (z shares x scale in MediaPipe)
  const yaw = Math.max(-0.9, Math.min(0.9, Math.atan2((lm[ri].z - lm[li].z) * w, fw)))
  const eyes = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const span = Math.hypot(b.x - a.x, b.y - a.y) / fw
  const top = P(10)
  const up = { x: Math.sin(angle), y: -Math.cos(angle) }
  const head = { x: top.x + up.x * fw * 0.2, y: top.y + up.y * fw * 0.2 }
  let cl = P(205), cr = P(425)
  if (cl.x > cr.x) [cl, cr] = [cr, cl]
  return { eyes, head, nose: P(1), lip: P(0), cheekL: cl, cheekR: cr, angle, fw, span: span / Math.max(0.6, Math.cos(yaw)), yaw }
}

function at(c: C, p: Pt, pose: FacePose, fn: () => void) {
  c.save(); c.translate(p.x, p.y); c.rotate(pose.angle); c.scale(pose.fw, pose.fw); fn(); c.restore()
}

export const isSkinEffect = (id?: string) => !!id && !!ACCESSORIES.find(a => a.id === id)?.skin

/** Skin-level effects painted directly onto the photo with blend modes (before grading). */
export function drawSkinEffect(c: C, id: string, pose: FacePose) {
  const cheeks = [pose.cheekL, pose.cheekR]
  c.save()
  if (id === 'blush' || id === 'sunkissed') {
    c.globalCompositeOperation = 'soft-light'
    cheeks.forEach(p => at(c, p, pose, () => {
      c.fillStyle = rg(c, 0, 0, 0, 0.16, [[0, id === 'blush' ? 'rgba(255,60,110,0.75)' : 'rgba(255,110,60,0.7)'], [1, 'rgba(255,80,120,0)']])
      c.beginPath(); c.ellipse(0, 0, 0.17, 0.12, -0.2, 0, 7); c.fill()
    }))
    if (id === 'sunkissed') at(c, { x: pose.nose.x, y: pose.nose.y - pose.fw * 0.08 }, pose, () => {
      c.fillStyle = rg(c, 0, 0, 0, 0.12, [[0, 'rgba(255,110,60,0.6)'], [1, 'rgba(255,110,60,0)']])
      c.beginPath(); c.ellipse(0, 0, 0.2, 0.07, 0, 0, 7); c.fill()
    })
  }
  if (id === 'freckles' || id === 'sunkissed') {
    c.globalCompositeOperation = 'multiply'
    seed = 11
    const spots = (p: Pt, n: number, spread: number) => at(c, p, pose, () => {
      for (let i = 0; i < n; i++) {
        const x = (rnd() - 0.5) * spread, y = (rnd() - 0.5) * spread * 0.55, r = 0.0035 + rnd() * 0.004
        c.fillStyle = rg(c, x, y, 0, r, [[0, `rgba(150,85,50,${0.35 + rnd() * 0.3})`], [1, 'rgba(150,85,50,0)']])
        c.beginPath(); c.arc(x, y, r, 0, 7); c.fill()
      }
    })
    spots({ x: pose.nose.x, y: pose.nose.y - pose.fw * 0.06 }, 22, 0.22)
    cheeks.forEach(p => spots({ x: (p.x + pose.nose.x) / 2, y: p.y - pose.fw * 0.03 }, 30, 0.2))
  }
  c.restore()
}

export function drawAccessory(c: C, id: string, pose: FacePose) {
  const acc = ACCESSORIES.find(a => a.id === id)
  if (!acc || acc.skin) return
  const k: AccCtx = { span: pose.span, yaw: pose.yaw }
  if (acc.slot === 'mata') return at(c, pose.eyes, pose, () => acc.draw(c, k))
  if (acc.slot === 'kepala') return at(c, pose.head, pose, () => { c.scale(1.2 * (Math.cos(pose.yaw) * 0.25 + 0.75), 1.2); acc.draw(c, k) })
  const cheeks = [pose.cheekL, pose.cheekR]
  switch (id) {
    case 'heart-cheeks':
      cheeks.forEach((p, i) => at(c, p, pose, () => {
        const hp = new Path2D(); heart(hp, 0.035)
        c.rotate(i ? 0.25 : -0.25)
        c.fillStyle = lg(c, 0, -0.04, 0, 0.04, [[0, '#ff8fab'], [1, '#d6004c']]); c.fill(hp)
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-0.012, -0.012, 0.008, 0.005, -0.6, 0, 7); c.fill()
      })); break
    case 'glitter':
      seed = 5
      cheeks.forEach(p => at(c, p, pose, () => {
        for (let i = 0; i < 40; i++) {
          const x = (rnd() - 0.5) * 0.16, y = (rnd() - 0.8) * 0.12, s = 0.003 + rnd() * 0.006
          c.fillStyle = ['#ffffff', '#ffe8a3', '#ffd1f0', '#c8f4ff'][i % 4]
          c.globalAlpha = 0.6 + rnd() * 0.4
          c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * 0.5, y); c.lineTo(x, y + s * 2); c.lineTo(x - s * 0.5, y); c.fill()
          c.beginPath(); c.moveTo(x - s * 2, y); c.lineTo(x, y + s * 0.5); c.lineTo(x + s * 2, y); c.lineTo(x, y - s * 0.5); c.fill()
        }
        c.globalAlpha = 1
      })); break
    case 'whiskers':
      at(c, pose.nose, pose, () => {
        c.strokeStyle = 'rgba(25,20,20,0.8)'; c.lineCap = 'round'
        for (const d of [-1, 1]) for (let i = -1; i <= 1; i++) {
          c.lineWidth = 0.006 - Math.abs(i) * 0.001
          c.beginPath(); c.moveTo(d * 0.1, 0.05 + i * 0.022); c.quadraticCurveTo(d * 0.25, 0.03 + i * 0.05, d * 0.38, i * 0.08 - 0.01); c.stroke()
        }
        c.fillStyle = rg(c, 0, 0.0, 0, 0.04, [[0, '#ffb3c4'], [1, '#e0607f']])
        c.beginPath(); c.moveTo(-0.032, -0.012); c.quadraticCurveTo(0, -0.025, 0.032, -0.012); c.quadraticCurveTo(0.01, 0.03, 0, 0.032); c.quadraticCurveTo(-0.01, 0.03, -0.032, -0.012); c.fill()
      }); break
  }
}
