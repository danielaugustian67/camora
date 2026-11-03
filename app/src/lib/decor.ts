// Procedural stickers/decorations. Every drawer paints centered at (0,0)
// with an approximate diameter of `s`.

export type DecorKind =
  | 'star' | 'star3d' | 'heart' | 'pixelHeart' | 'lips' | 'lily' | 'daisy'
  | 'butterfly' | 'bow' | 'sparkle' | 'cloud' | 'pin' | 'cherry' | 'moon'
  | 'note' | 'smiley' | 'strawberry' | 'leaf' | 'tulip' | 'shell' | 'snowflake'
  | 'planet' | 'mushroom' | 'rainbow' | 'tape' | 'film' | 'clover' | 'dot'
  | 'sun' | 'cat' | 'bubble' | 'flame' | 'lightning' | 'diamond' | 'ribbon'

type Drawer = (c: CanvasRenderingContext2D, s: number, col: string, col2: string) => void

function starPath(c: CanvasRenderingContext2D, r: number, inner = 0.45, points = 5) {
  c.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner
    const a = (Math.PI / points) * i - Math.PI / 2
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
  }
  c.closePath()
}

function heartPath(c: CanvasRenderingContext2D, s: number) {
  const r = s / 2
  c.beginPath()
  c.moveTo(0, r * 0.75)
  c.bezierCurveTo(-r * 1.2, -r * 0.05, -r * 0.6, -r * 0.95, 0, -r * 0.4)
  c.bezierCurveTo(r * 0.6, -r * 0.95, r * 1.2, -r * 0.05, 0, r * 0.75)
  c.closePath()
}

function shadow(c: CanvasRenderingContext2D, s: number) {
  c.shadowColor = 'rgba(0,0,0,0.22)'
  c.shadowBlur = s * 0.08
  c.shadowOffsetY = s * 0.04
}

const drawers: Record<DecorKind, Drawer> = {
  star(c, s, col, col2) {
    shadow(c, s)
    starPath(c, s / 2)
    c.fillStyle = col
    c.fill()
    c.shadowColor = 'transparent'
    c.setLineDash([s * 0.03, s * 0.03])
    c.lineWidth = s * 0.025
    c.strokeStyle = col2
    starPath(c, s / 2.25)
    c.stroke()
    c.setLineDash([])
  },
  star3d(c, s) {
    shadow(c, s)
    starPath(c, s / 2, 0.42)
    const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2)
    g.addColorStop(0, '#f4f4f4'); g.addColorStop(0.35, '#9a9a9a')
    g.addColorStop(0.5, '#2b2b2b'); g.addColorStop(0.7, '#d9d9d9'); g.addColorStop(1, '#7a7a7a')
    c.fillStyle = g
    c.fill()
    c.shadowColor = 'transparent'
    c.lineWidth = s * 0.03
    c.strokeStyle = '#e8e8e8'
    c.stroke()
  },
  heart(c, s, col) {
    shadow(c, s)
    heartPath(c, s)
    c.fillStyle = col
    c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = 'rgba(255,255,255,0.45)'
    c.beginPath(); c.ellipse(-s * 0.18, -s * 0.12, s * 0.08, s * 0.05, -0.6, 0, Math.PI * 2); c.fill()
  },
  pixelHeart(c, s, col) {
    const map = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']
    const p = s / 7
    c.translate(-s / 2, -s / 2.6)
    for (let y = 0; y < map.length; y++)
      for (let x = 0; x < 7; x++)
        if (map[y][x] === '1') {
          c.fillStyle = '#ffffff'
          c.fillRect(x * p - p * 0.25, y * p - p * 0.25, p * 1.5, p * 1.5)
        }
    for (let y = 0; y < map.length; y++)
      for (let x = 0; x < 7; x++)
        if (map[y][x] === '1') {
          c.fillStyle = (x === 1 && y === 1) ? '#fff' : col
          c.fillRect(x * p, y * p, p + 0.5, p + 0.5)
        }
  },
  lips(c, s, col) {
    const w = s / 2, h = s / 3.2
    c.fillStyle = col
    c.globalAlpha = 0.9
    c.beginPath()
    c.moveTo(-w, 0)
    c.bezierCurveTo(-w * 0.6, -h * 1.2, -w * 0.15, -h * 1.1, 0, -h * 0.45)
    c.bezierCurveTo(w * 0.15, -h * 1.1, w * 0.6, -h * 1.2, w, 0)
    c.bezierCurveTo(w * 0.5, h * 1.4, -w * 0.5, h * 1.4, -w, 0)
    c.fill()
    c.globalAlpha = 1
    c.strokeStyle = 'rgba(80,0,10,0.5)'
    c.lineWidth = s * 0.03
    c.beginPath(); c.moveTo(-w * 0.85, 0); c.quadraticCurveTo(0, h * 0.35, w * 0.85, 0); c.stroke()
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = s * 0.012
    for (let i = -4; i <= 4; i++) {
      c.beginPath(); c.moveTo(i * w * 0.18, -h * 0.4); c.lineTo(i * w * 0.2, h * 0.5); c.stroke()
    }
  },
  lily(c, s, col, col2) {
    shadow(c, s)
    for (let i = 0; i < 6; i++) {
      c.save()
      c.rotate((Math.PI / 3) * i)
      const g = c.createLinearGradient(0, 0, 0, -s / 2)
      g.addColorStop(0, col2); g.addColorStop(1, col)
      c.fillStyle = g
      c.beginPath()
      c.moveTo(0, 0)
      c.bezierCurveTo(s * 0.18, -s * 0.15, s * 0.08, -s * 0.45, 0, -s * 0.5)
      c.bezierCurveTo(-s * 0.08, -s * 0.45, -s * 0.18, -s * 0.15, 0, 0)
      c.fill()
      c.restore()
    }
    c.shadowColor = 'transparent'
    c.strokeStyle = '#8a5a2b'; c.lineWidth = s * 0.012
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + 0.5
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18); c.stroke()
      c.fillStyle = '#c0632b'
      c.beginPath(); c.arc(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18, s * 0.022, 0, 7); c.fill()
    }
  },
  daisy(c, s, col, col2) {
    shadow(c, s)
    c.fillStyle = col
    for (let i = 0; i < 12; i++) {
      c.save(); c.rotate((Math.PI / 6) * i)
      c.beginPath(); c.ellipse(0, -s * 0.28, s * 0.09, s * 0.2, 0, 0, 7); c.fill()
      c.restore()
    }
    c.shadowColor = 'transparent'
    c.fillStyle = col2
    c.beginPath(); c.arc(0, 0, s * 0.14, 0, 7); c.fill()
  },
  butterfly(c, s, col, col2) {
    shadow(c, s)
    const wing = (dir: number) => {
      c.fillStyle = col
      c.beginPath(); c.ellipse(dir * s * 0.22, -s * 0.14, s * 0.22, s * 0.17, dir * 0.5, 0, 7); c.fill()
      c.fillStyle = col2
      c.beginPath(); c.ellipse(dir * s * 0.16, s * 0.13, s * 0.14, s * 0.12, -dir * 0.4, 0, 7); c.fill()
      c.fillStyle = 'rgba(255,255,255,0.6)'
      c.beginPath(); c.arc(dir * s * 0.26, -s * 0.16, s * 0.05, 0, 7); c.fill()
    }
    wing(-1); wing(1)
    c.shadowColor = 'transparent'
    c.fillStyle = '#4a3a3a'
    c.beginPath(); c.ellipse(0, 0, s * 0.035, s * 0.22, 0, 0, 7); c.fill()
    c.strokeStyle = '#4a3a3a'; c.lineWidth = s * 0.015
    c.beginPath(); c.moveTo(0, -s * 0.2); c.quadraticCurveTo(-s * 0.05, -s * 0.35, -s * 0.12, -s * 0.38); c.stroke()
    c.beginPath(); c.moveTo(0, -s * 0.2); c.quadraticCurveTo(s * 0.05, -s * 0.35, s * 0.12, -s * 0.38); c.stroke()
  },
  bow(c, s, col, col2) {
    shadow(c, s)
    c.fillStyle = col
    for (const d of [-1, 1]) {
      c.beginPath()
      c.moveTo(0, 0)
      c.bezierCurveTo(d * s * 0.2, -s * 0.35, d * s * 0.55, -s * 0.25, d * s * 0.45, 0)
      c.bezierCurveTo(d * s * 0.55, s * 0.2, d * s * 0.2, s * 0.25, 0, 0)
      c.fill()
      c.beginPath()
      c.moveTo(d * s * 0.04, s * 0.04)
      c.lineTo(d * s * 0.22, s * 0.5); c.lineTo(d * s * 0.3, s * 0.42); c.lineTo(d * s * 0.1, 0)
      c.fill()
    }
    c.shadowColor = 'transparent'
    c.fillStyle = col2
    c.beginPath(); c.ellipse(0, 0, s * 0.09, s * 0.11, 0, 0, 7); c.fill()
  },
  sparkle(c, s, col) {
    c.fillStyle = col
    c.beginPath()
    const r = s / 2
    c.moveTo(0, -r)
    c.quadraticCurveTo(0, 0, r, 0)
    c.quadraticCurveTo(0, 0, 0, r)
    c.quadraticCurveTo(0, 0, -r, 0)
    c.quadraticCurveTo(0, 0, 0, -r)
    c.fill()
  },
  cloud(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.arc(-s * 0.22, s * 0.05, s * 0.18, 0, 7)
    c.arc(0, -s * 0.08, s * 0.24, 0, 7)
    c.arc(s * 0.24, s * 0.05, s * 0.17, 0, 7)
    c.rect(-s * 0.22, s * 0.02, s * 0.46, s * 0.2)
    c.fill()
  },
  pin(c, s) {
    c.strokeStyle = '#b8b8b8'; c.lineWidth = s * 0.035; c.lineCap = 'round'
    shadow(c, s)
    c.beginPath()
    c.moveTo(-s * 0.4, s * 0.12)
    c.lineTo(s * 0.35, -s * 0.12)
    c.stroke()
    c.beginPath(); c.moveTo(-s * 0.4, s * 0.2); c.lineTo(s * 0.3, -s * 0.03); c.stroke()
    c.beginPath(); c.arc(-s * 0.42, s * 0.16, s * 0.06, 0, 7); c.stroke()
    c.fillStyle = '#d0d0d0'
    c.beginPath(); c.ellipse(s * 0.34, -s * 0.08, s * 0.1, s * 0.07, -0.3, 0, 7); c.fill()
  },
  cherry(c, s, col) {
    c.strokeStyle = '#3f6b2a'; c.lineWidth = s * 0.03
    c.beginPath(); c.moveTo(-s * 0.18, s * 0.15); c.quadraticCurveTo(-s * 0.05, -s * 0.3, s * 0.08, -s * 0.4); c.stroke()
    c.beginPath(); c.moveTo(s * 0.2, s * 0.12); c.quadraticCurveTo(s * 0.15, -s * 0.2, s * 0.08, -s * 0.4); c.stroke()
    c.fillStyle = '#5c9a3a'
    c.beginPath(); c.ellipse(s * 0.2, -s * 0.38, s * 0.12, s * 0.05, -0.4, 0, 7); c.fill()
    shadow(c, s)
    c.fillStyle = col
    c.beginPath(); c.arc(-s * 0.18, s * 0.25, s * 0.17, 0, 7); c.fill()
    c.beginPath(); c.arc(s * 0.2, s * 0.22, s * 0.17, 0, 7); c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = 'rgba(255,255,255,0.55)'
    c.beginPath(); c.arc(-s * 0.23, s * 0.2, s * 0.04, 0, 7); c.fill()
    c.beginPath(); c.arc(s * 0.15, s * 0.17, s * 0.04, 0, 7); c.fill()
  },
  moon(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.arc(0, 0, s * 0.45, Math.PI * 0.35, Math.PI * 1.65, false)
    c.arc(s * 0.18, -s * 0.02, s * 0.36, Math.PI * 1.55, Math.PI * 0.45, true)
    c.fill()
  },
  note(c, s, col) {
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.06
    c.beginPath(); c.ellipse(-s * 0.2, s * 0.3, s * 0.14, s * 0.1, -0.4, 0, 7); c.fill()
    c.beginPath(); c.ellipse(s * 0.25, s * 0.2, s * 0.14, s * 0.1, -0.4, 0, 7); c.fill()
    c.beginPath(); c.moveTo(-s * 0.08, s * 0.28); c.lineTo(-s * 0.08, -s * 0.35); c.lineTo(s * 0.37, -s * 0.45); c.lineTo(s * 0.37, s * 0.18); c.stroke()
  },
  smiley(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath(); c.arc(0, 0, s * 0.45, 0, 7); c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = '#2b2b2b'
    c.beginPath(); c.ellipse(-s * 0.14, -s * 0.1, s * 0.05, s * 0.09, 0, 0, 7); c.fill()
    c.beginPath(); c.ellipse(s * 0.14, -s * 0.1, s * 0.05, s * 0.09, 0, 0, 7); c.fill()
    c.strokeStyle = '#2b2b2b'; c.lineWidth = s * 0.05; c.lineCap = 'round'
    c.beginPath(); c.arc(0, s * 0.02, s * 0.25, 0.3, Math.PI - 0.3); c.stroke()
  },
  strawberry(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(0, s * 0.45)
    c.bezierCurveTo(-s * 0.45, s * 0.1, -s * 0.4, -s * 0.3, 0, -s * 0.25)
    c.bezierCurveTo(s * 0.4, -s * 0.3, s * 0.45, s * 0.1, 0, s * 0.45)
    c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = '#fff3b0'
    for (let i = 0; i < 9; i++) {
      const x = ((i % 3) - 1) * s * 0.16, y = (Math.floor(i / 3)) * s * 0.17 - s * 0.08
      c.beginPath(); c.ellipse(x, y, s * 0.02, s * 0.035, 0, 0, 7); c.fill()
    }
    c.fillStyle = '#4f9a3a'
    starPath(c, s * 0.2, 0.4, 5)
    c.save(); c.translate(0, -s * 0.28); c.fill(); c.restore()
  },
  leaf(c, s, col, col2) {
    c.fillStyle = col
    c.beginPath(); c.moveTo(0, -s * 0.45)
    c.quadraticCurveTo(s * 0.4, 0, 0, s * 0.45)
    c.quadraticCurveTo(-s * 0.4, 0, 0, -s * 0.45); c.fill()
    c.strokeStyle = col2; c.lineWidth = s * 0.025
    c.beginPath(); c.moveTo(0, -s * 0.4); c.lineTo(0, s * 0.42); c.stroke()
  },
  tulip(c, s, col) {
    c.strokeStyle = '#4f8a3a'; c.lineWidth = s * 0.05
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, s * 0.5); c.stroke()
    c.fillStyle = '#5c9a3a'
    c.beginPath(); c.ellipse(s * 0.12, s * 0.3, s * 0.06, s * 0.16, 0.6, 0, 7); c.fill()
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(-s * 0.22, -s * 0.35)
    c.lineTo(-s * 0.08, -s * 0.2); c.lineTo(0, -s * 0.38); c.lineTo(s * 0.08, -s * 0.2); c.lineTo(s * 0.22, -s * 0.35)
    c.quadraticCurveTo(s * 0.26, s * 0.05, 0, s * 0.05)
    c.quadraticCurveTo(-s * 0.26, s * 0.05, -s * 0.22, -s * 0.35)
    c.fill()
  },
  shell(c, s, col, col2) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath(); c.moveTo(0, s * 0.4)
    c.lineTo(-s * 0.45, -s * 0.05)
    c.arc(0, -s * 0.05, s * 0.45, Math.PI, 0)
    c.closePath(); c.fill()
    c.shadowColor = 'transparent'
    c.strokeStyle = col2; c.lineWidth = s * 0.025
    for (let i = -3; i <= 3; i++) {
      const a = Math.PI * 1.5 + i * 0.38
      c.beginPath(); c.moveTo(0, s * 0.38); c.lineTo(Math.cos(a) * s * 0.44, -s * 0.05 + Math.sin(a) * s * 0.44); c.stroke()
    }
  },
  snowflake(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.05; c.lineCap = 'round'
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate((Math.PI / 3) * i)
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.45); c.stroke()
      c.beginPath(); c.moveTo(0, -s * 0.28); c.lineTo(-s * 0.1, -s * 0.38); c.moveTo(0, -s * 0.28); c.lineTo(s * 0.1, -s * 0.38); c.stroke()
      c.restore()
    }
  },
  planet(c, s, col, col2) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath(); c.arc(0, 0, s * 0.28, 0, 7); c.fill()
    c.shadowColor = 'transparent'
    c.strokeStyle = col2; c.lineWidth = s * 0.06
    c.beginPath(); c.ellipse(0, 0, s * 0.48, s * 0.13, -0.35, 0.15, Math.PI - 0.15, true); c.stroke()
  },
  mushroom(c, s, col) {
    shadow(c, s)
    c.fillStyle = '#fff4e0'
    c.fillRect(-s * 0.1, -s * 0.05, s * 0.2, s * 0.4)
    c.fillStyle = col
    c.beginPath(); c.arc(0, -s * 0.02, s * 0.4, Math.PI, 0); c.closePath(); c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = '#fff'
    for (const [x, y, r] of [[-0.2, -0.15, 0.07], [0.12, -0.25, 0.06], [0.24, -0.08, 0.05], [-0.02, -0.08, 0.04]])
      { c.beginPath(); c.arc(x * s, y * s, r * s, 0, 7); c.fill() }
  },
  rainbow(c, s) {
    const cols = ['#ff8fa3', '#ffc27a', '#fff07a', '#9be59b', '#8fc7ff', '#c49bff']
    c.lineWidth = s * 0.06
    cols.forEach((col, i) => {
      c.strokeStyle = col
      c.beginPath(); c.arc(0, s * 0.2, s * 0.45 - i * s * 0.06, Math.PI, 0); c.stroke()
    })
  },
  tape(c, s, col) {
    c.fillStyle = col
    c.globalAlpha = 0.75
    c.beginPath()
    c.moveTo(-s * 0.5, -s * 0.12)
    for (let i = 0; i <= 6; i++) c.lineTo(-s * 0.5 + i * s / 6, -s * 0.12 + (i % 2 ? -s * 0.02 : 0))
    c.lineTo(s * 0.5, s * 0.12)
    for (let i = 6; i >= 0; i--) c.lineTo(-s * 0.5 + i * s / 6, s * 0.12 + (i % 2 ? s * 0.02 : 0))
    c.closePath(); c.fill()
    c.globalAlpha = 1
  },
  film(c, s, col) {
    c.fillStyle = col
    c.fillRect(-s * 0.5, -s * 0.18, s, s * 0.36)
    c.fillStyle = 'rgba(255,255,255,0.85)'
    for (let i = 0; i < 7; i++) {
      c.fillRect(-s * 0.46 + i * s * 0.14, -s * 0.15, s * 0.07, s * 0.06)
      c.fillRect(-s * 0.46 + i * s * 0.14, s * 0.09, s * 0.07, s * 0.06)
    }
  },
  clover(c, s, col) {
    c.fillStyle = col
    for (let i = 0; i < 4; i++) {
      c.save(); c.rotate((Math.PI / 2) * i + Math.PI / 4)
      c.translate(0, -s * 0.18)
      c.rotate(Math.PI)
      heartPath(c, s * 0.42); c.fill()
      c.restore()
    }
  },
  dot(c, s, col) {
    c.fillStyle = col
    c.beginPath(); c.arc(0, 0, s / 2, 0, 7); c.fill()
  },
  sun(c, s, col) {
    c.fillStyle = col
    for (let i = 0; i < 12; i++) {
      c.save(); c.rotate((Math.PI / 6) * i)
      c.beginPath(); c.moveTo(-s * 0.06, -s * 0.3); c.lineTo(0, -s * 0.5); c.lineTo(s * 0.06, -s * 0.3); c.fill()
      c.restore()
    }
    shadow(c, s)
    c.beginPath(); c.arc(0, 0, s * 0.28, 0, 7); c.fill()
  },
  cat(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(-s * 0.4, -s * 0.05); c.lineTo(-s * 0.35, -s * 0.45); c.lineTo(-s * 0.12, -s * 0.25)
    c.lineTo(s * 0.12, -s * 0.25); c.lineTo(s * 0.35, -s * 0.45); c.lineTo(s * 0.4, -s * 0.05)
    c.ellipse(0, s * 0.05, s * 0.42, s * 0.33, 0, 0, Math.PI)
    c.closePath(); c.fill()
    c.shadowColor = 'transparent'
    c.fillStyle = '#2b2b2b'
    c.beginPath(); c.arc(-s * 0.15, 0, s * 0.045, 0, 7); c.arc(s * 0.15, 0, s * 0.045, 0, 7); c.fill()
    c.fillStyle = '#ff9db0'
    c.beginPath(); c.moveTo(-s * 0.04, s * 0.08); c.lineTo(s * 0.04, s * 0.08); c.lineTo(0, s * 0.13); c.fill()
  },
  bubble(c, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.04
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.beginPath(); c.arc(0, 0, s * 0.45, 0, 7); c.fill(); c.stroke()
    c.fillStyle = 'rgba(255,255,255,0.8)'
    c.beginPath(); c.ellipse(-s * 0.18, -s * 0.18, s * 0.1, s * 0.05, -0.8, 0, 7); c.fill()
  },
  flame(c, s, col, col2) {
    c.fillStyle = col
    c.beginPath(); c.moveTo(0, -s * 0.5)
    c.bezierCurveTo(s * 0.5, -s * 0.05, s * 0.35, s * 0.45, 0, s * 0.45)
    c.bezierCurveTo(-s * 0.35, s * 0.45, -s * 0.45, 0, -s * 0.1, -s * 0.15)
    c.quadraticCurveTo(-s * 0.05, -s * 0.3, 0, -s * 0.5); c.fill()
    c.fillStyle = col2
    c.beginPath(); c.moveTo(0, -s * 0.1)
    c.bezierCurveTo(s * 0.25, s * 0.1, s * 0.2, s * 0.4, 0, s * 0.4)
    c.bezierCurveTo(-s * 0.2, s * 0.4, -s * 0.2, s * 0.1, 0, -s * 0.1); c.fill()
  },
  lightning(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(s * 0.1, -s * 0.5); c.lineTo(-s * 0.25, s * 0.05); c.lineTo(-s * 0.02, s * 0.05)
    c.lineTo(-s * 0.12, s * 0.5); c.lineTo(s * 0.25, -s * 0.08); c.lineTo(s * 0.02, -s * 0.08)
    c.closePath(); c.fill()
  },
  diamond(c, s, col) {
    shadow(c, s)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(-s * 0.4, -s * 0.15); c.lineTo(-s * 0.2, -s * 0.38); c.lineTo(s * 0.2, -s * 0.38)
    c.lineTo(s * 0.4, -s * 0.15); c.lineTo(0, s * 0.42); c.closePath(); c.fill()
    c.shadowColor = 'transparent'
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = s * 0.02
    c.beginPath(); c.moveTo(-s * 0.4, -s * 0.15); c.lineTo(s * 0.4, -s * 0.15)
    c.moveTo(-s * 0.12, -s * 0.15); c.lineTo(0, s * 0.42); c.lineTo(s * 0.12, -s * 0.15)
    c.moveTo(-s * 0.2, -s * 0.38); c.lineTo(-s * 0.12, -s * 0.15); c.moveTo(s * 0.2, -s * 0.38); c.lineTo(s * 0.12, -s * 0.15)
    c.stroke()
  },
  ribbon(c, s, col) {
    c.fillStyle = col
    c.fillRect(-s * 0.5, -s * 0.13, s, s * 0.26)
    c.beginPath(); c.moveTo(-s * 0.5, -s * 0.13); c.lineTo(-s * 0.62, 0); c.lineTo(-s * 0.5, s * 0.13); c.fill()
    c.beginPath(); c.moveTo(s * 0.5, -s * 0.13); c.lineTo(s * 0.62, 0); c.lineTo(s * 0.5, s * 0.13); c.fill()
  },
}

export const DECOR_KINDS = Object.keys(drawers) as DecorKind[]

export function drawDecor(
  c: CanvasRenderingContext2D, kind: DecorKind, x: number, y: number,
  s: number, rot: number, col: string, col2: string,
) {
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  drawers[kind](c, s, col, col2)
  c.restore()
}
