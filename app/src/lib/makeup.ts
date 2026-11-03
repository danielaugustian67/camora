import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

/**
 * Landmark-driven makeup, painted in blend layers so the skin texture stays visible:
 *   multiply layer -> eyeshadow, brows, blush, contour
 *   normal layer   -> eyeliner / lashes
 *   screen layer   -> highlighter, shimmer
 */
export interface MakeupLook {
  id: string; name: string; swatch: string
  shadow?: [string, number]            // colour, strength
  shadowOuter?: string                 // darker outer-corner colour
  liner?: [string, number, number]     // colour, thickness (× face width), wing length
  brow?: [string, number]
  blush?: [string, number]
  contour?: number
  highlight?: number
  shimmer?: number
}

export const MAKEUP: MakeupLook[] = [
  { id: 'none', name: 'Tanpa', swatch: 'linear-gradient(135deg,#eee,#bbb)' },
  { id: 'natural', name: 'Natural', swatch: 'linear-gradient(135deg,#e8c3a8,#c99272)', shadow: ['#b98a6e', 0.35], liner: ['#3a2a22', 0.004, 0.2], brow: ['#5a4030', 0.3], blush: ['#e89a8a', 0.28], highlight: 0.25 },
  { id: 'soft-glam', name: 'Soft Glam', swatch: 'linear-gradient(135deg,#d9a38a,#8a5040)', shadow: ['#c08068', 0.5], shadowOuter: '#6e3a2c', liner: ['#1a1210', 0.006, 0.6], brow: ['#4a3226', 0.4], blush: ['#e08a80', 0.35], contour: 0.35, highlight: 0.45, shimmer: 0.25 },
  { id: 'korean', name: 'Korean', swatch: 'linear-gradient(135deg,#ffd0d0,#f2a0a8)', shadow: ['#f0a0a0', 0.4], liner: ['#4a2a22', 0.0035, 0.1], brow: ['#6a5040', 0.25], blush: ['#ff8fa0', 0.4], highlight: 0.5, shimmer: 0.35 },
  { id: 'peach', name: 'Peachy', swatch: 'linear-gradient(135deg,#ffc8a0,#f08a5a)', shadow: ['#f0a070', 0.5], shadowOuter: '#c8683e', liner: ['#3a2418', 0.0045, 0.35], brow: ['#5a4030', 0.3], blush: ['#ff9a70', 0.42], highlight: 0.4, shimmer: 0.3 },
  { id: 'smokey', name: 'Smokey', swatch: 'linear-gradient(135deg,#777,#111)', shadow: ['#5a5050', 0.65], shadowOuter: '#1a1414', liner: ['#050505', 0.008, 0.55], brow: ['#2e221c', 0.45], blush: ['#c07a70', 0.2], contour: 0.45, highlight: 0.3 },
  { id: 'rose', name: 'Rose Gold', swatch: 'linear-gradient(135deg,#f0c0b0,#b0606a)', shadow: ['#d08a88', 0.55], shadowOuter: '#8a3e4a', liner: ['#2a1416', 0.005, 0.45], brow: ['#4a3226', 0.35], blush: ['#e88090', 0.38], contour: 0.25, highlight: 0.5, shimmer: 0.55 },
  { id: 'bold', name: 'Bold Wing', swatch: 'linear-gradient(135deg,#333,#a0303a)', shadow: ['#a87060', 0.4], shadowOuter: '#4a2420', liner: ['#000000', 0.01, 1.0], brow: ['#2a1e18', 0.5], blush: ['#d07070', 0.3], contour: 0.5, highlight: 0.45 },
  { id: 'party', name: 'Glitter', swatch: 'linear-gradient(135deg,#d8b0ff,#7a50c0)', shadow: ['#a080d0', 0.55], shadowOuter: '#5030a0', liner: ['#120a20', 0.006, 0.6], brow: ['#3a2a22', 0.35], blush: ['#f090c0', 0.35], highlight: 0.55, shimmer: 0.9 },
]

const LID_L = [33, 246, 161, 160, 159, 158, 157, 173, 133]
const LID_R = [263, 466, 388, 387, 386, 385, 384, 398, 362]
const LOW_L = [33, 7, 163, 144, 145, 153, 154, 155, 133]
const LOW_R = [263, 249, 390, 373, 374, 380, 381, 382, 362]
const BROWLOW_L = [46, 53, 52, 65, 55]
const BROWLOW_R = [276, 283, 282, 295, 285]
const BROW_L = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
const BROW_R = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]

type P = [number, number]
const mk = () => document.createElement('canvas')

export class Makeup {
  private mul = mk(); private nrm = mk(); private scr = mk()

  apply(dst: CanvasRenderingContext2D, faces: NormalizedLandmark[][], id: string, amt: number, w: number, h: number) {
    const look = MAKEUP.find(m => m.id === id)
    if (!look || look.id === 'none' || !faces.length || amt <= 0) return
    for (const c of [this.mul, this.nrm, this.scr]) {
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
      c.getContext('2d')!.clearRect(0, 0, w, h)
    }
    const M = this.mul.getContext('2d')!, N = this.nrm.getContext('2d')!, S = this.scr.getContext('2d')!
    // multiply layer starts white (= no change)
    M.fillStyle = '#fff'; M.fillRect(0, 0, w, h)

    for (const lm of faces) {
      const p = (i: number): P => [lm[i].x * w, lm[i].y * h]
      const fw = Math.hypot(p(454)[0] - p(234)[0], p(454)[1] - p(234)[1])
      const blur = (c: CanvasRenderingContext2D, k: number) => { c.filter = `blur(${Math.max(0.5, fw * k)}px)` }
      const path = (c: CanvasRenderingContext2D, pts: P[]) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath() }

      for (const side of [0, 1]) {
        const lid = (side ? LID_R : LID_L).map(p), low = (side ? LOW_R : LOW_L).map(p)
        const browLow = (side ? BROWLOW_R : BROWLOW_L).map(p)
        const browAt = (t: number): P => { // t: 0 outer .. 1 inner
          const f = t * (browLow.length - 1), i = Math.min(browLow.length - 2, Math.floor(f)), u = f - i
          return [browLow[i][0] + (browLow[i + 1][0] - browLow[i][0]) * u, browLow[i][1] + (browLow[i + 1][1] - browLow[i][1]) * u]
        }
        const crease = (k: number) => lid.map((q, i): P => { const b = browAt(i / (lid.length - 1)); return [q[0] + (b[0] - q[0]) * k, q[1] + (b[1] - q[1]) * k] })

        // ---- eyeshadow (multiply), inner lighter, outer corner deeper
        if (look.shadow) {
          const [col, st] = look.shadow
          M.save(); blur(M, 0.022); M.globalAlpha = st * amt; M.fillStyle = col
          path(M, [...lid, ...crease(0.55).reverse()]); M.fill()
          if (look.shadowOuter) {
            const o = lid[0], c2 = crease(0.6)
            const g = M.createRadialGradient(o[0], o[1] - fw * 0.02, 0, o[0], o[1] - fw * 0.02, fw * 0.12)
            g.addColorStop(0, look.shadowOuter); g.addColorStop(1, 'rgba(255,255,255,0)')
            M.fillStyle = g; path(M, [...lid.slice(0, 5), ...c2.slice(0, 5).reverse()]); M.fill()
          }
          // soft smudge under the lower lash line
          M.globalAlpha = st * amt * 0.35; M.lineWidth = fw * 0.012; M.strokeStyle = look.shadowOuter ?? col
          M.beginPath(); low.slice(0, 6).forEach(([x, y], i) => i ? M.lineTo(x, y + fw * 0.004) : M.moveTo(x, y + fw * 0.004)); M.stroke()
          M.restore()
        }
        // ---- brows (multiply, feathered)
        if (look.brow) {
          M.save(); blur(M, 0.006); M.globalAlpha = look.brow[1] * amt; M.fillStyle = look.brow[0]
          path(M, (side ? BROW_R : BROW_L).map(p)); M.fill(); M.restore()
        }
        // ---- liner (normal) along the upper lash line, tapered, with wing
        if (look.liner) {
          const [col, th, wing] = look.liner
          const outer = lid[0], prev = lid[1]
          const dx = outer[0] - prev[0], dy = outer[1] - prev[1], L = Math.hypot(dx, dy) || 1
          const tip: P = [outer[0] + (dx / L) * fw * 0.06 * wing, outer[1] + (dy / L) * fw * 0.06 * wing - fw * 0.03 * wing]
          N.save(); blur(N, 0.0018); N.globalAlpha = Math.min(1, 0.85 * amt + 0.1); N.fillStyle = col
          const t = fw * th
          const top = lid.map(([x, y], i): P => [x, y - t * (0.3 + 0.9 * (1 - i / (lid.length - 1)))])
          path(N, [tip, ...top, ...[...lid].reverse(), [outer[0], outer[1] + t * 0.4]]); N.fill()
          N.restore()
        }
        // keep eyeballs clean
        for (const c of [M]) { c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff'; blur(c, 0.002); path(c, [...lid, ...[...low].reverse()]); c.fill(); c.restore() }
        for (const c of [N]) { c.save(); c.globalCompositeOperation = 'destination-out'; path(c, [...lid.map(([x, y]): P => [x, y + fw * 0.004]), ...[...low].reverse()]); c.fill(); c.restore() }

        // ---- shimmer on the lid centre (screen)
        if (look.shimmer) {
          const c = crease(0.25)[4]
          const g = S.createRadialGradient(c[0], c[1], 0, c[0], c[1], fw * 0.05)
          g.addColorStop(0, `rgba(255,240,225,${0.35 * look.shimmer * amt})`); g.addColorStop(1, 'rgba(255,240,225,0)')
          S.fillStyle = g; S.fillRect(c[0] - fw * 0.06, c[1] - fw * 0.06, fw * 0.12, fw * 0.12)
          // glitter specks
          let r = 7 + side
          for (let i = 0; i < 24 * look.shimmer; i++) {
            r = (r * 16807) % 2147483647; const a = r / 2147483647
            r = (r * 16807) % 2147483647; const b = r / 2147483647
            const q = lid[1 + Math.floor(a * 6)], cq = crease(0.4)[1 + Math.floor(a * 6)]
            const x = q[0] + (cq[0] - q[0]) * b, y = q[1] + (cq[1] - q[1]) * b
            S.fillStyle = `rgba(255,255,255,${0.6 * amt})`; S.beginPath(); S.arc(x, y, Math.max(0.5, fw * 0.0018), 0, 7); S.fill()
          }
        }
      }

      // ---- blush (multiply, very soft) on the apples of the cheeks
      const cheek = (i: number, j: number): P => { const a = p(i), b = p(j); return [(a[0] * 2 + b[0]) / 3, (a[1] * 2 + b[1]) / 3] }
      if (look.blush) {
        for (const [c, toward] of [[cheek(205, 50), 234], [cheek(425, 280), 454]] as const) {
          const e = p(toward); const cx = c[0] + (e[0] - c[0]) * 0.15, cy = c[1] - fw * 0.01
          const g = M.createRadialGradient(cx, cy, 0, cx, cy, fw * 0.16)
          g.addColorStop(0, look.blush[0]); g.addColorStop(1, 'rgba(255,255,255,0)')
          M.save(); M.globalAlpha = look.blush[1] * amt; M.fillStyle = g
          M.beginPath(); M.ellipse(cx, cy, fw * 0.16, fw * 0.11, Math.atan2(e[1] - c[1], e[0] - c[0]) * 0.3, 0, 7); M.fill(); M.restore()
        }
      }
      // ---- contour under the cheekbones + jaw sides
      if (look.contour) {
        M.save(); blur(M, 0.05); M.globalAlpha = look.contour * amt * 0.5; M.fillStyle = '#9a7262'
        for (const [a, b] of [[234, 207], [454, 427]]) {
          const A = p(a), B = p(b)
          M.beginPath(); M.moveTo(A[0], A[1]); M.lineTo(B[0], B[1]); M.lineWidth = fw * 0.05; M.strokeStyle = '#9a7262'; M.lineCap = 'round'; M.stroke()
        }
        M.restore()
      }
      // ---- highlighter: nose bridge, cheekbone tops, cupid's bow
      if (look.highlight) {
        S.save(); blur(S, 0.02); S.globalAlpha = look.highlight * amt * 0.45; S.strokeStyle = '#fff4ea'; S.lineCap = 'round'
        S.lineWidth = fw * 0.02; S.beginPath(); S.moveTo(...p(168)); S.lineTo(...p(195)); S.stroke()
        S.lineWidth = fw * 0.035
        for (const [a, b] of [[116, 118], [345, 347]]) { S.beginPath(); S.moveTo(...p(a)); S.lineTo(...p(b)); S.stroke() }
        S.lineWidth = fw * 0.012; S.beginPath(); S.arc(...p(0), fw * 0.01, 0, 7); S.stroke()
        S.restore()
      }
    }

    dst.save()
    dst.globalCompositeOperation = 'multiply'; dst.drawImage(this.mul, 0, 0)
    dst.globalCompositeOperation = 'source-over'; dst.drawImage(this.nrm, 0, 0)
    dst.globalCompositeOperation = 'screen'; dst.drawImage(this.scr, 0, 0)
    dst.restore()
  }
}
