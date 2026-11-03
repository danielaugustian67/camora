import { drawDecor } from './decor'

export interface Pt { x: number; y: number }
export type AccSlot = 'mata' | 'kepala' | 'wajah'
type Draw = (c: CanvasRenderingContext2D) => void // local units: 1 = face width

export interface Accessory { id: string; name: string; slot: AccSlot; emoji: string; draw: Draw }

const lens = (_c: CanvasRenderingContext2D, fn: (side: number) => void) => { fn(-1); fn(1) }
const bridge = (c: CanvasRenderingContext2D, col: string, lw: number, y = -0.02) => {
  c.strokeStyle = col; c.lineWidth = lw
  c.beginPath(); c.moveTo(-0.08, y); c.quadraticCurveTo(0, y - 0.05, 0.08, y); c.stroke()
}
const arms = (c: CanvasRenderingContext2D, col: string, lw: number, x = 0.38) => {
  c.strokeStyle = col; c.lineWidth = lw
  c.beginPath(); c.moveTo(-x, -0.03); c.lineTo(-0.5, -0.06); c.moveTo(x, -0.03); c.lineTo(0.5, -0.06); c.stroke()
}
const heart = (c: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  c.beginPath()
  c.moveTo(x, y + s * 0.38)
  c.bezierCurveTo(x - s * 0.6, y, x - s * 0.3, y - s * 0.48, x, y - s * 0.2)
  c.bezierCurveTo(x + s * 0.3, y - s * 0.48, x + s * 0.6, y, x, y + s * 0.38)
}
const star = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  c.beginPath()
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = (Math.PI / 5) * i - Math.PI / 2; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) }
  c.closePath()
}

export const ACCESSORIES: Accessory[] = [
  // ---------- MATA (anchor: eyes midpoint) ----------
  { id: 'round', name: 'Bulat', slot: 'mata', emoji: '👓', draw: c => {
    lens(c, d => { c.fillStyle = 'rgba(200,230,255,0.15)'; c.beginPath(); c.arc(d * 0.22, 0, 0.15, 0, 7); c.fill(); c.strokeStyle = '#2b2b2b'; c.lineWidth = 0.025; c.stroke() })
    bridge(c, '#2b2b2b', 0.02); arms(c, '#2b2b2b', 0.02)
  } },
  { id: 'heart-glasses', name: 'Hati', slot: 'mata', emoji: '😍', draw: c => {
    lens(c, d => { heart(c, d * 0.22, 0, 0.42); c.fillStyle = 'rgba(255,60,120,0.55)'; c.fill(); c.strokeStyle = '#ff2e7e'; c.lineWidth = 0.025; c.stroke() })
    bridge(c, '#ff2e7e', 0.022, -0.05); arms(c, '#ff2e7e', 0.02, 0.4)
  } },
  { id: 'star-glasses', name: 'Bintang', slot: 'mata', emoji: '🤩', draw: c => {
    lens(c, d => { star(c, d * 0.22, 0, 0.19); c.fillStyle = 'rgba(255,214,0,0.55)'; c.fill(); c.strokeStyle = '#ffb703'; c.lineWidth = 0.022; c.stroke() })
    bridge(c, '#ffb703', 0.022); arms(c, '#ffb703', 0.02, 0.4)
  } },
  { id: 'sunglasses', name: 'Kacamata Hitam', slot: 'mata', emoji: '🕶️', draw: c => {
    lens(c, d => {
      const g = c.createLinearGradient(0, -0.12, 0, 0.12); g.addColorStop(0, '#111'); g.addColorStop(1, '#444')
      c.fillStyle = g; c.beginPath(); c.roundRect(d * 0.22 - 0.17, -0.1, 0.34, 0.2, 0.06); c.fill()
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(d * 0.22 - 0.06, -0.04, 0.05, 0.02, -0.4, 0, 7); c.fill()
    })
    bridge(c, '#111', 0.03, -0.04); arms(c, '#111', 0.025, 0.39)
  } },
  { id: 'cateye', name: 'Cat Eye', slot: 'mata', emoji: '🐱', draw: c => {
    lens(c, d => {
      c.save(); c.scale(d, 1)
      c.beginPath(); c.moveTo(0.07, 0.02); c.quadraticCurveTo(0.1, 0.13, 0.25, 0.12); c.quadraticCurveTo(0.38, 0.1, 0.4, -0.04); c.lineTo(0.43, -0.13); c.quadraticCurveTo(0.25, -0.1, 0.1, -0.08); c.closePath()
      c.fillStyle = 'rgba(80,0,30,0.25)'; c.fill(); c.strokeStyle = '#c2185b'; c.lineWidth = 0.03; c.stroke()
      c.restore()
    })
    bridge(c, '#c2185b', 0.022)
  } },
  { id: 'y2k-visor', name: 'Visor Y2K', slot: 'mata', emoji: '🥽', draw: c => {
    const g = c.createLinearGradient(-0.45, 0, 0.45, 0)
    g.addColorStop(0, 'rgba(255,0,200,0.55)'); g.addColorStop(0.5, 'rgba(0,240,255,0.5)'); g.addColorStop(1, 'rgba(255,0,200,0.55)')
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.46, -0.08); c.quadraticCurveTo(0, -0.18, 0.46, -0.08); c.lineTo(0.42, 0.08); c.quadraticCurveTo(0, 0.16, -0.42, 0.08); c.closePath(); c.fill()
    c.strokeStyle = '#ddd'; c.lineWidth = 0.015; c.stroke()
  } },
  { id: 'nerd', name: 'Nerd', slot: 'mata', emoji: '🤓', draw: c => {
    lens(c, d => { c.fillStyle = 'rgba(220,240,255,0.12)'; c.beginPath(); c.roundRect(d * 0.22 - 0.15, -0.11, 0.3, 0.22, 0.03); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 0.04; c.stroke() })
    bridge(c, '#111', 0.035); arms(c, '#111', 0.03)
  } },
  { id: 'monocle', name: 'Monokel', slot: 'mata', emoji: '🧐', draw: c => {
    c.strokeStyle = '#c9a227'; c.lineWidth = 0.022; c.beginPath(); c.arc(0.22, 0, 0.15, 0, 7); c.stroke()
    c.lineWidth = 0.008; c.beginPath(); c.moveTo(0.3, 0.13); c.quadraticCurveTo(0.42, 0.45, 0.3, 0.7); c.stroke()
  } },
  // ---------- KEPALA (anchor: top of head) ----------
  { id: 'party', name: 'Topi Pesta', slot: 'kepala', emoji: '🥳', draw: c => {
    c.save(); c.translate(0.12, 0); c.rotate(0.25)
    c.beginPath(); c.moveTo(-0.2, 0.05); c.lineTo(0, -0.6); c.lineTo(0.2, 0.05); c.closePath()
    c.fillStyle = '#ff6fb5'; c.fill(); c.clip()
    c.strokeStyle = '#ffe066'; c.lineWidth = 0.05
    for (let y = -0.55; y < 0.1; y += 0.13) { c.beginPath(); c.moveTo(-0.3, y + 0.1); c.lineTo(0.3, y - 0.05); c.stroke() }
    c.restore()
    c.save(); c.translate(0.12, 0); c.rotate(0.25); drawDecor(c, 'dot', 0, -0.62, 0.1, 0, '#4dabf7', ''); c.restore()
  } },
  { id: 'crown', name: 'Mahkota', slot: 'kepala', emoji: '👑', draw: c => {
    const g = c.createLinearGradient(0, -0.3, 0, 0.05); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#d4a017')
    c.fillStyle = g
    c.beginPath(); c.moveTo(-0.3, 0.05); c.lineTo(-0.34, -0.25); c.lineTo(-0.17, -0.1); c.lineTo(0, -0.32); c.lineTo(0.17, -0.1); c.lineTo(0.34, -0.25); c.lineTo(0.3, 0.05); c.closePath(); c.fill()
    c.strokeStyle = '#a07a10'; c.lineWidth = 0.012; c.stroke()
    for (const [x, col] of [[-0.17, '#e63946'], [0, '#4dabf7'], [0.17, '#06d6a0']] as const) { c.fillStyle = col; c.beginPath(); c.arc(x, -0.02, 0.035, 0, 7); c.fill() }
  } },
  { id: 'flower-crown', name: 'Mahkota Bunga', slot: 'kepala', emoji: '🌸', draw: c => {
    const cols: [string, string][] = [['#ffb7c9', '#fff'], ['#fff', '#ffd54f'], ['#c9a7f5', '#fff'], ['#ffd6a5', '#ff8fab']]
    for (let i = -4; i <= 4; i++) {
      const x = i * 0.08, y = 0.12 + (i * i) * 0.006
      if (i % 2 === 0) drawDecor(c, 'leaf', x, y + 0.03, 0.1, i * 0.4 + 1.2, '#7cb342', '#558b2f')
    }
    for (let i = -4; i <= 4; i++) { const [a, b] = cols[(i + 4) % 4]; drawDecor(c, 'daisy', i * 0.085, 0.1 + (i * i) * 0.006, 0.14, i, a, b) }
  } },
  { id: 'bunny', name: 'Telinga Kelinci', slot: 'kepala', emoji: '🐰', draw: c => {
    for (const d of [-1, 1]) {
      c.save(); c.translate(d * 0.15, 0.05); c.rotate(d * 0.2)
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, -0.3, 0.09, 0.3, 0, 0, 7); c.fill(); c.strokeStyle = '#eee'; c.lineWidth = 0.01; c.stroke()
      c.fillStyle = '#ffc2d1'; c.beginPath(); c.ellipse(0, -0.28, 0.045, 0.22, 0, 0, 7); c.fill()
      c.restore()
    }
  } },
  { id: 'cat-ears', name: 'Telinga Kucing', slot: 'kepala', emoji: '😺', draw: c => {
    for (const d of [-1, 1]) {
      c.save(); c.translate(d * 0.25, 0.08); c.rotate(d * 0.3)
      c.fillStyle = '#3b2f2f'; c.beginPath(); c.moveTo(-0.13, 0.05); c.lineTo(0, -0.25); c.lineTo(0.13, 0.05); c.closePath(); c.fill()
      c.fillStyle = '#ff9db0'; c.beginPath(); c.moveTo(-0.07, 0.02); c.lineTo(0, -0.15); c.lineTo(0.07, 0.02); c.closePath(); c.fill()
      c.restore()
    }
  } },
  { id: 'big-bow', name: 'Pita Besar', slot: 'kepala', emoji: '🎀', draw: c => drawDecor(c, 'bow', 0.18, 0.05, 0.35, 0.25, '#ff8fab', '#e05780') },
  { id: 'cowboy', name: 'Koboi', slot: 'kepala', emoji: '🤠', draw: c => {
    c.fillStyle = '#8b5a2b'
    c.beginPath(); c.ellipse(0, 0.04, 0.55, 0.09, 0, 0, 7); c.fill()
    c.beginPath(); c.moveTo(-0.25, 0.04); c.quadraticCurveTo(-0.3, -0.3, -0.1, -0.28); c.quadraticCurveTo(0, -0.22, 0.1, -0.28); c.quadraticCurveTo(0.3, -0.3, 0.25, 0.04); c.fill()
    c.fillStyle = '#5a3a1a'; c.fillRect(-0.26, -0.04, 0.52, 0.06)
  } },
  { id: 'beanie', name: 'Beanie', slot: 'kepala', emoji: '🧢', draw: c => {
    c.fillStyle = '#e76f51'; c.beginPath(); c.arc(0, 0.1, 0.4, Math.PI, 0); c.fill()
    c.fillStyle = '#c4553a'; c.beginPath(); c.roundRect(-0.42, 0.02, 0.84, 0.14, 0.04); c.fill()
    c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 0.015
    for (let x = -0.38; x < 0.4; x += 0.06) { c.beginPath(); c.moveTo(x, 0.03); c.lineTo(x, 0.15); c.stroke() }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -0.32, 0.08, 0, 7); c.fill()
  } },
  { id: 'santa', name: 'Topi Santa', slot: 'kepala', emoji: '🎅', draw: c => {
    c.fillStyle = '#d62828'; c.beginPath(); c.moveTo(-0.38, 0.06); c.quadraticCurveTo(-0.1, -0.5, 0.45, -0.25); c.lineTo(0.38, 0.06); c.closePath(); c.fill()
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-0.42, 0, 0.84, 0.13, 0.06); c.fill()
    c.beginPath(); c.arc(0.46, -0.22, 0.07, 0, 7); c.fill()
  } },
  { id: 'grad-cap', name: 'Toga', slot: 'kepala', emoji: '🎓', draw: c => {
    c.fillStyle = '#1d1d1d'; c.beginPath(); c.moveTo(-0.5, -0.12); c.lineTo(0, -0.28); c.lineTo(0.5, -0.12); c.lineTo(0, 0.02); c.closePath(); c.fill()
    c.beginPath(); c.moveTo(-0.25, -0.06); c.lineTo(-0.25, 0.08); c.quadraticCurveTo(0, 0.16, 0.25, 0.08); c.lineTo(0.25, -0.06); c.fill()
    c.strokeStyle = '#f1c40f'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(0, -0.14); c.lineTo(0.38, -0.08); c.lineTo(0.38, 0.12); c.stroke()
    c.fillStyle = '#f1c40f'; c.fillRect(0.36, 0.1, 0.04, 0.08)
  } },
  { id: 'halo', name: 'Halo', slot: 'kepala', emoji: '😇', draw: c => {
    c.shadowColor = '#fff6a0'; c.shadowBlur = 20
    c.strokeStyle = '#ffe066'; c.lineWidth = 0.05; c.beginPath(); c.ellipse(0, -0.15, 0.28, 0.07, 0, 0, 7); c.stroke()
  } },
  { id: 'devil', name: 'Tanduk', slot: 'kepala', emoji: '😈', draw: c => {
    for (const d of [-1, 1]) {
      c.fillStyle = '#d00000'; c.beginPath(); c.moveTo(d * 0.12, 0.08); c.quadraticCurveTo(d * 0.18, -0.1, d * 0.32, -0.2); c.quadraticCurveTo(d * 0.28, 0, d * 0.26, 0.1); c.closePath(); c.fill()
    }
  } },
  { id: 'star-headband', name: 'Bando Bintang', slot: 'kepala', emoji: '⭐', draw: c => {
    for (const [x, y, s] of [[-0.25, -0.2, 0.12], [0, -0.32, 0.14], [0.25, -0.2, 0.12]]) {
      c.strokeStyle = '#333'; c.lineWidth = 0.008; c.beginPath(); c.moveTo(x * 0.6, 0.08); c.quadraticCurveTo(x, 0, x, y); c.stroke()
      drawDecor(c, 'star', x, y, s, 0, '#ffd166', '#fff')
    }
  } },
  // ---------- WAJAH (anchors from specific landmarks) ----------
  { id: 'blush', name: 'Blush Pipi', slot: 'wajah', emoji: '☺️', draw: () => {} },
  { id: 'freckles', name: 'Freckles', slot: 'wajah', emoji: '🌟', draw: () => {} },
  { id: 'heart-cheeks', name: 'Stiker Hati', slot: 'wajah', emoji: '💕', draw: () => {} },
  { id: 'star-cheeks', name: 'Stiker Bintang', slot: 'wajah', emoji: '✨', draw: () => {} },
  { id: 'mustache', name: 'Kumis', slot: 'wajah', emoji: '🥸', draw: () => {} },
  { id: 'dog', name: 'Hidung Anjing', slot: 'wajah', emoji: '🐶', draw: () => {} },
  { id: 'whiskers', name: 'Kumis Kucing', slot: 'wajah', emoji: '🐈', draw: () => {} },
]

export interface FacePose { eyes: Pt; head: Pt; nose: Pt; lip: Pt; cheekL: Pt; cheekR: Pt; angle: number; fw: number }

/** Build a face pose from 478 normalized landmarks, mapped to canvas pixels (mirrored). */
export function facePose(lm: { x: number; y: number }[], w: number, h: number, mirror: boolean): FacePose {
  const P = (i: number): Pt => ({ x: (mirror ? 1 - lm[i].x : lm[i].x) * w, y: lm[i].y * h })
  let a = P(33), b = P(263)
  if (a.x > b.x) [a, b] = [b, a]
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const l = P(234), r = P(454)
  const fw = Math.hypot(r.x - l.x, r.y - l.y)
  const eyes = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const top = P(10)
  const up = { x: Math.sin(angle), y: -Math.cos(angle) }
  const head = { x: top.x + up.x * fw * 0.1, y: top.y + up.y * fw * 0.1 }
  let cl = P(50), cr = P(280)
  if (cl.x > cr.x) [cl, cr] = [cr, cl]
  return { eyes, head, nose: P(1), lip: P(0), cheekL: cl, cheekR: cr, angle, fw }
}

function at(c: CanvasRenderingContext2D, p: Pt, pose: FacePose, fn: () => void) {
  c.save(); c.translate(p.x, p.y); c.rotate(pose.angle); c.scale(pose.fw, pose.fw); fn(); c.restore()
}

export function drawAccessory(c: CanvasRenderingContext2D, id: string, pose: FacePose) {
  const acc = ACCESSORIES.find(a => a.id === id)
  if (!acc) return
  if (acc.slot === 'mata') return at(c, pose.eyes, pose, () => acc.draw(c))
  if (acc.slot === 'kepala') return at(c, pose.head, pose, () => acc.draw(c))
  const cheeks = [pose.cheekL, pose.cheekR]
  switch (id) {
    case 'blush':
      cheeks.forEach(p => at(c, p, pose, () => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 0.12)
        g.addColorStop(0, 'rgba(255,105,140,0.45)'); g.addColorStop(1, 'rgba(255,105,140,0)')
        c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 0.13, 0.09, 0, 0, 7); c.fill()
      })); break
    case 'freckles':
      cheeks.forEach((p, k) => at(c, p, pose, () => {
        c.fillStyle = 'rgba(140,80,50,0.55)'
        for (let i = 0; i < 9; i++) { const x = ((i * 37) % 11 / 11 - 0.5) * 0.16 * (k ? -1 : 1), y = ((i * 53) % 7 / 7 - 0.6) * 0.1; c.beginPath(); c.arc(x, y, 0.006 + (i % 3) * 0.002, 0, 7); c.fill() }
      })); break
    case 'heart-cheeks':
      cheeks.forEach((p, k) => at(c, p, pose, () => drawDecor(c, 'heart', 0, -0.02, 0.13, k ? 0.2 : -0.2, '#ff4d6d', ''))); break
    case 'star-cheeks':
      cheeks.forEach((p, k) => at(c, p, pose, () => { drawDecor(c, 'sparkle', 0, -0.05, 0.07, 0, '#fff7b0', ''); drawDecor(c, 'sparkle', k ? -0.05 : 0.05, 0.01, 0.04, 0, '#ffffff', '') })); break
    case 'mustache':
      at(c, { x: (pose.nose.x + pose.lip.x) / 2, y: (pose.nose.y + pose.lip.y) / 2 }, pose, () => {
        c.fillStyle = '#2b1a0f'
        for (const d of [-1, 1]) { c.beginPath(); c.moveTo(0, -0.01); c.bezierCurveTo(d * 0.08, -0.06, d * 0.2, -0.04, d * 0.24, -0.08); c.bezierCurveTo(d * 0.2, 0.04, d * 0.08, 0.04, 0, 0.02); c.fill() }
      }); break
    case 'dog':
      at(c, pose.nose, pose, () => {
        c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(0, 0, 0.08, 0.055, 0, 0, 7); c.fill()
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-0.025, -0.02, 0.025, 0.012, 0, 0, 7); c.fill()
      })
      at(c, pose.lip, pose, () => { c.fillStyle = '#ff7f9f'; c.beginPath(); c.ellipse(0, 0.12, 0.06, 0.1, 0, 0, Math.PI); c.fill() })
      break
    case 'whiskers':
      at(c, pose.nose, pose, () => {
        c.strokeStyle = 'rgba(30,30,30,0.85)'; c.lineWidth = 0.008; c.lineCap = 'round'
        for (const d of [-1, 1]) for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(d * 0.12, 0.03 + i * 0.02); c.lineTo(d * 0.38, i * 0.07); c.stroke() }
        c.fillStyle = '#ff9db0'; c.beginPath(); c.moveTo(-0.035, -0.01); c.lineTo(0.035, -0.01); c.lineTo(0, 0.03); c.fill()
      }); break
  }
}
