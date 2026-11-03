import { drawDecor, type DecorKind } from './decor'
import { drawPattern } from './patterns'
import type { PatternKind } from './themes'
import { hash, rng } from './rng'

type C = CanvasRenderingContext2D
type BgFn = (c: C, w: number, h: number, r: () => number) => void

const lin = (c: C, h: number, stops: string[], w = 0) => {
  const g = c.createLinearGradient(0, 0, w, h)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  return g
}
const fill = (c: C, w: number, h: number, stops: string[], diag = false) => {
  c.fillStyle = stops.length === 1 ? stops[0] : lin(c, h, stops, diag ? w : 0)
  c.fillRect(0, 0, w, h)
}
const radial = (c: C, w: number, h: number, inner: string, outer: string) => {
  const g = c.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.5, Math.max(w, h) * 0.75)
  g.addColorStop(0, inner); g.addColorStop(1, outer)
  c.fillStyle = g; c.fillRect(0, 0, w, h)
}
const bokeh = (c: C, w: number, h: number, r: () => number, cols: string[], n = 40) => {
  c.save(); c.globalCompositeOperation = 'lighter'
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = (0.02 + r() * 0.07) * w
    const g = c.createRadialGradient(x, y, 0, x, y, s)
    const col = cols[i % cols.length]
    g.addColorStop(0, col); g.addColorStop(0.7, col.replace(/[\d.]+\)$/, '0.15)')); g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill()
  }
  c.restore()
}
const scatter = (c: C, w: number, h: number, r: () => number, kinds: [DecorKind, string, string][], n: number, min = 0.04, max = 0.1, alpha = 1) => {
  c.save(); c.globalAlpha = alpha
  for (let i = 0; i < n; i++) {
    const [k, a, b] = kinds[i % kinds.length]
    drawDecor(c, k, r() * w, r() * h, w * (min + r() * (max - min)), (r() - 0.5) * 1.2, a, b)
  }
  c.restore()
}
const pat = (c: C, w: number, h: number, k: PatternKind, col: string, u = 0.07) => drawPattern(c, k, col, 0, 0, w, h, w * u)
const hills = (c: C, w: number, h: number, cols: string[], base = 0.6) => {
  cols.forEach((col, i) => {
    const y0 = h * (base + i * 0.12)
    c.fillStyle = col
    c.beginPath(); c.moveTo(0, h)
    for (let x = 0; x <= w; x += w / 40) c.lineTo(x, y0 + Math.sin(x / w * Math.PI * (1.5 + i) + i * 2) * h * 0.05)
    c.lineTo(w, h); c.fill()
  })
}
const vignette = (c: C, w: number, h: number, a = 0.35) => {
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`)
  c.fillStyle = g; c.fillRect(0, 0, w, h)
}
const sun = (c: C, x: number, y: number, s: number, col: string) => {
  const g = c.createRadialGradient(x, y, 0, x, y, s * 2)
  g.addColorStop(0, col); g.addColorStop(0.45, col); g.addColorStop(0.5, col.replace(/[\d.]+\)$/, '0.3)')); g.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 2, 0, 7); c.fill()
}

export interface Background { id: string; name: string; draw: BgFn }

const B = (id: string, name: string, draw: BgFn): Background => ({ id, name, draw })

export const BACKGROUNDS: Background[] = [
  B('sky-hills', 'Langit & Bukit', (c, w, h, r) => { fill(c, w, h, ['#8fd3ff', '#d9f1ff']); scatter(c, w, h * 0.45, r, [['cloud', '#fff', '']], 6, 0.12, 0.22); hills(c, w, h, ['#a6d96a', '#7cb342', '#558b2f']) }),
  B('meadow', 'Padang Bunga', (c, w, h, r) => { fill(c, w, h, ['#cfe9ff', '#fff8e1']); hills(c, w, h, ['#b5d99c', '#8fbf6a'], 0.55); c.save(); c.translate(0, h * 0.62); scatter(c, w, h * 0.38, r, [['daisy', '#fff', '#ffd54f'], ['tulip', '#f48fb1', ''], ['daisy', '#f8bbd0', '#fff']], 40, 0.03, 0.06); c.restore() }),
  B('pastel-sky', 'Pastel Sky', (c, w, h, r) => { fill(c, w, h, ['#a8d8ff', '#ffd6f0']); scatter(c, w, h, r, [['cloud', '#ffffff', '']], 10, 0.12, 0.25, 0.9); scatter(c, w, h, r, [['sparkle', '#ffffff', '']], 25, 0.01, 0.03) }),
  B('sakura', 'Sakura', (c, w, h, r) => { fill(c, w, h, ['#ffe4ef', '#fff7fa']); scatter(c, w, h, r, [['daisy', '#ffb7c9', '#fff'], ['daisy', '#ffd1dc', '#ffb7c9']], 45, 0.03, 0.08, 0.85) }),
  B('lavender', 'Lavender', (c, w, h, r) => { fill(c, w, h, ['#c7b3f2', '#f9d5ec']); scatter(c, w, h, r, [['moon', '#fff6c9', ''], ['sparkle', '#fff', ''], ['star', '#fff', '#c7b3f2']], 30, 0.02, 0.06) }),
  B('pink-satin', 'Pink Satin', (c, w, h) => { fill(c, w, h, ['#f8bbd0', '#fce4ec', '#f48fb1', '#fce4ec', '#f8bbd0'], true); pat(c, w, h, 'stripes', 'rgba(255,255,255,0.15)', 0.06) }),
  B('rose-velvet', 'Rose Velvet', (c, w, h) => { radial(c, w, h, '#a4161a', '#3b0a0d'); vignette(c, w, h, 0.5) }),
  B('picnic', 'Piknik', (c, w, h, r) => { fill(c, w, h, ['#ffffff']); pat(c, w, h, 'gingham', 'rgba(230,57,80,0.3)', 0.06); scatter(c, w, h, r, [['strawberry', '#e63950', ''], ['cherry', '#d62839', '']], 10, 0.05, 0.08) }),
  B('peach-dots', 'Peach Dots', (c, w, h) => { fill(c, w, h, ['#ffe0cc']); pat(c, w, h, 'dots', 'rgba(255,255,255,0.8)', 0.08) }),
  B('mint', 'Mint', (c, w, h) => { fill(c, w, h, ['#bff0dc', '#e6fff5']); pat(c, w, h, 'checker', 'rgba(255,255,255,0.35)', 0.08) }),
  B('chrome', 'Chrome Y2K', (c, w, h, r) => { fill(c, w, h, ['#e6e6ef', '#9fa0b3', '#ffffff', '#b8b9cc'], true); scatter(c, w, h, r, [['star3d', '', ''], ['sparkle', '#fff', '']], 14, 0.05, 0.12) }),
  B('bubblegum', 'Bubblegum', (c, w, h, r) => { fill(c, w, h, ['#ff6fb5', '#ffc4e1'], true); pat(c, w, h, 'hearts', 'rgba(255,255,255,0.25)', 0.1); scatter(c, w, h, r, [['bubble', '#fff', '']], 15, 0.04, 0.1) }),
  B('synthwave', 'Synthwave', (c, w, h) => {
    fill(c, w, h, ['#140433', '#4a0e6b', '#ff4f9a']); sun(c, w / 2, h * 0.55, w * 0.16, 'rgba(255,200,90,1)')
    c.fillStyle = '#140433'; c.fillRect(0, h * 0.62, w, h)
    c.strokeStyle = '#ff4fd8'; c.lineWidth = 2
    for (let i = 0; i < 14; i++) { const y = h * 0.62 + (i * i) * h * 0.003; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * 0.02, h * 0.62); c.lineTo(w / 2 + i * w * 0.15, h); c.stroke() }
  }),
  B('hot-pink', 'Hot Pink', (c, w, h) => { radial(c, w, h, '#ff4fa3', '#9d0b5b') }),
  B('arcade', 'Arcade', (c, w, h, r) => { fill(c, w, h, ['#1a1a33']); pat(c, w, h, 'grid', 'rgba(125,255,122,0.25)', 0.08); scatter(c, w, h, r, [['pixelHeart', '#ff4f6d', ''], ['pixelHeart', '#7dff7a', ''], ['star', '#4fc3ff', '#fff']], 14, 0.04, 0.08) }),
  B('studio-white', 'Studio Putih', (c, w, h) => radial(c, w, h, '#ffffff', '#d9d9d9')),
  B('studio-grey', 'Studio Abu', (c, w, h) => { radial(c, w, h, '#9a9a9a', '#3c3c3c') }),
  B('studio-black', 'Studio Hitam', (c, w, h) => radial(c, w, h, '#3a3a3a', '#050505')),
  B('olive-studio', 'Studio Olive', (c, w, h) => radial(c, w, h, '#9aa06a', '#3f4228')),
  B('latte', 'Latte', (c, w, h) => { radial(c, w, h, '#f3e6d3', '#b8977a') }),
  B('retro-room', 'Kamar Retro', (c, w, h) => { fill(c, w, h, ['#e8c9a0']); pat(c, w, h, 'stripes', 'rgba(160,100,50,0.18)', 0.05); c.fillStyle = '#7a4f2a'; c.fillRect(0, h * 0.78, w, h) }),
  B('sepia-wall', 'Dinding Sepia', (c, w, h) => { fill(c, w, h, ['#efe2c9', '#cdb48f']); pat(c, w, h, 'floral', 'rgba(140,100,60,0.12)', 0.09); vignette(c, w, h, 0.3) }),
  B('groovy', 'Groovy 70s', (c, w, h) => {
    const cols = ['#7a2e12', '#c44d2c', '#f2a541', '#ffd166', '#fff1d0']
    cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(w / 2, h * 1.1, Math.max(w, h) * (1.1 - i * 0.2), 0, 7); c.fill() })
  }),
  B('diner', 'Diner', (c, w, h) => { fill(c, w, h, ['#4cc9f0']); c.save(); c.translate(0, h * 0.65); pat(c, w, h * 0.35, 'checker', '#111', 0.08); c.restore(); c.fillStyle = '#fff'; c.fillRect(0, h * 0.62, w, h * 0.03); c.fillStyle = '#e63946'; c.fillRect(0, h * 0.6, w, h * 0.02) }),
  B('gold-bokeh', 'Gold Bokeh', (c, w, h, r) => { fill(c, w, h, ['#0c1427', '#1d2b4f']); bokeh(c, w, h, r, ['rgba(255,210,110,0.7)', 'rgba(255,240,200,0.5)']) }),
  B('beach', 'Pantai', (c, w, h, r) => { fill(c, w, h, ['#7fd3ff', '#cdefff']); sun(c, w * 0.8, h * 0.18, w * 0.07, 'rgba(255,230,120,1)'); c.fillStyle = '#1e96c8'; c.fillRect(0, h * 0.5, w, h * 0.2); pat(c, w, h * 0.7, 'none', ''); c.fillStyle = '#f6dcae'; c.beginPath(); c.moveTo(0, h * 0.68); c.quadraticCurveTo(w / 2, h * 0.62, w, h * 0.7); c.lineTo(w, h); c.lineTo(0, h); c.fill(); c.save(); c.translate(0, h * 0.72); scatter(c, w, h * 0.28, r, [['shell', '#ffd6c4', '#f4a28c']], 6, 0.04, 0.06); c.restore() }),
  B('autumn', 'Musim Gugur', (c, w, h, r) => { fill(c, w, h, ['#f4a259', '#bc4b51'], true); scatter(c, w, h, r, [['leaf', '#ffb347', '#7a3d14'], ['leaf', '#e8743b', '#6a2e0c'], ['leaf', '#c0392b', '#5a1a0a']], 40, 0.04, 0.09) }),
  B('snow', 'Salju', (c, w, h, r) => { fill(c, w, h, ['#9cc3f0', '#eaf3ff']); hills(c, w, h, ['#ffffff', '#eef4ff'], 0.72); scatter(c, w, h, r, [['snowflake', '#ffffff', ''], ['dot', '#ffffff', '']], 60, 0.01, 0.04) }),
  B('xmas', 'Natal', (c, w, h, r) => { fill(c, w, h, ['#0b3d20', '#1e5631']); bokeh(c, w, h, r, ['rgba(255,80,80,0.6)', 'rgba(255,215,0,0.6)', 'rgba(255,255,255,0.5)'], 50) }),
  B('lebaran', 'Lebaran', (c, w, h, r) => { fill(c, w, h, ['#062e1d', '#198754']); pat(c, w, h, 'diagonal', 'rgba(255,215,0,0.08)'); scatter(c, w, h, r, [['star', '#ffd700', '#062e1d'], ['sparkle', '#fff6c2', '']], 25, 0.02, 0.05); drawDecor(c, 'moon', w * 0.8, h * 0.2, w * 0.18, 0.3, '#ffd700', '') }),
  B('merdeka', 'Merdeka', (c, w, h, r) => { c.fillStyle = '#ce1126'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#ffffff'; c.fillRect(0, h / 2, w, h / 2); scatter(c, w, h, r, [['star', '#ffd700', '#fff']], 12, 0.03, 0.06, 0.8) }),
  B('spooky', 'Spooky', (c, w, h, r) => { fill(c, w, h, ['#140a24', '#3d1f5c']); drawDecor(c, 'moon', w * 0.75, h * 0.2, w * 0.2, 0.2, '#ffcf6b', ''); scatter(c, w, h, r, [['sparkle', '#ff8c00', '']], 30, 0.01, 0.03); hills(c, w, h, ['#0a0512'], 0.82) }),
  B('hearts', 'Love', (c, w, h, r) => { fill(c, w, h, ['#ff4d6d', '#ffb3c1'], true); scatter(c, w, h, r, [['heart', '#ffffff', ''], ['heart', '#c9184a', ''], ['heart', '#ff8fa3', '']], 40, 0.03, 0.1, 0.9) }),
  B('confetti', 'Confetti', (c, w, h, r) => { fill(c, w, h, ['#fff0f5']); c.save(); c.lineCap = 'round'; const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#c77dff']; for (let i = 0; i < 260; i++) { c.fillStyle = cols[i % 5]; c.save(); c.translate(r() * w, r() * h); c.rotate(r() * 6); c.fillRect(0, 0, w * 0.012, w * 0.025); c.restore() } c.restore() }),
  B('disco', 'Disco', (c, w, h, r) => { fill(c, w, h, ['#240046', '#7209b7']); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { c.fillStyle = `hsla(${r() * 360},90%,60%,0.12)`; c.beginPath(); c.moveTo(w / 2, -10); c.lineTo(r() * w * 1.4 - w * 0.2, h); c.lineTo(r() * w * 1.4 - w * 0.2, h); c.lineTo(r() * w * 1.4 - w * 0.2 + w * 0.15, h); c.fill() } c.globalCompositeOperation = 'source-over'; bokeh(c, w, h, r, ['rgba(255,255,255,0.4)', 'rgba(247,37,133,0.5)'], 25) }),
  B('wedding', 'Wedding', (c, w, h, r) => { radial(c, w, h, '#fffaf3', '#e9dccb'); scatter(c, w, h, r, [['lily', '#ffffff', '#f6e7d8'], ['leaf', '#a3b18a', '#588157']], 14, 0.06, 0.12, 0.7); bokeh(c, w, h, r, ['rgba(255,240,210,0.5)'], 20) }),
  B('pop-yellow', 'Pop Kuning', (c, w, h, r) => { fill(c, w, h, ['#ffe066']); pat(c, w, h, 'dots', 'rgba(255,255,255,0.7)', 0.07); scatter(c, w, h, r, [['smiley', '#ffd43b', ''], ['lightning', '#4dabf7', '']], 8, 0.06, 0.1) }),
  B('forest', 'Hutan', (c, w, h, r) => { fill(c, w, h, ['#b7e4c7', '#2d6a4f']); for (let i = 0; i < 18; i++) { const x = r() * w, s = h * (0.25 + r() * 0.35); c.fillStyle = ['#1b4332', '#2d6a4f', '#40916c'][i % 3]; c.beginPath(); c.moveTo(x, h - s * 1.6); c.lineTo(x - s * 0.35, h); c.lineTo(x + s * 0.35, h); c.fill() } }),
  B('underwater', 'Bawah Laut', (c, w, h, r) => { fill(c, w, h, ['#48cae4', '#03045e']); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(200,240,255,0.06)'; const x = r() * w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w * 0.1, 0); c.lineTo(x + w * 0.3, h); c.lineTo(x + w * 0.15, h); c.fill() } c.globalCompositeOperation = 'source-over'; scatter(c, w, h, r, [['bubble', '#caf0f8', '']], 30, 0.01, 0.05) }),
  B('sunflower', 'Bunga Matahari', (c, w, h, r) => { fill(c, w, h, ['#8ecae6', '#ffe8a3']); c.save(); c.translate(0, h * 0.45); scatter(c, w, h * 0.55, r, [['daisy', '#ffbe0b', '#6b4423'], ['leaf', '#6a994e', '#386641']], 40, 0.06, 0.12); c.restore() }),
  B('galaxy', 'Galaksi', (c, w, h, r) => { fill(c, w, h, ['#0b0b2b', '#2e1a5e', '#5a189a'], true); bokeh(c, w, h, r, ['rgba(160,120,255,0.3)', 'rgba(255,120,200,0.25)'], 12); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(255,255,255,${r()})`; c.fillRect(r() * w, r() * h, 1.5, 1.5) } drawDecor(c, 'planet', w * 0.82, h * 0.22, w * 0.15, -0.3, '#ffb4a2', '#e5989b') }),
  B('city-night', 'Kota Malam', (c, w, h, r) => { fill(c, w, h, ['#0d0221', '#261447']); bokeh(c, w, h * 0.7, r, ['rgba(255,0,170,0.5)', 'rgba(0,240,255,0.5)', 'rgba(255,251,0,0.4)'], 45); for (let x = 0; x < w;) { const bw = w * (0.05 + r() * 0.08), bh = h * (0.15 + r() * 0.35); c.fillStyle = '#07010f'; c.fillRect(x, h - bh, bw, bh); c.fillStyle = 'rgba(255,230,150,0.6)'; for (let wy = h - bh + 8; wy < h - 8; wy += 14) for (let wx = x + 5; wx < x + bw - 5; wx += 10) if (r() > 0.6) c.fillRect(wx, wy, 4, 6); x += bw + 2 } }),
]

const cache = new Map<string, HTMLCanvasElement>()

export function getBackground(id: string, w: number, h: number) {
  const key = `${id}:${w}x${h}`
  let cv = cache.get(key)
  if (cv) return cv
  const bg = BACKGROUNDS.find(b => b.id === id)
  if (!bg) return null
  cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  bg.draw(cv.getContext('2d')!, w, h, rng(hash(id)))
  cache.set(key, cv)
  return cv
}
