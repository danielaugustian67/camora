export interface Grade {
  id: string
  name: string
  filter: string
  overlay?: { color: string; mode: GlobalCompositeOperation; alpha: number }
  vignette?: number
  grain?: number
  swatch: string
}

export const GRADES: Grade[] = [
  { id: 'none', name: 'Normal', filter: 'none', swatch: '#ddd' },
  { id: 'warm', name: 'Hangat', filter: 'saturate(1.1) contrast(1.05)', overlay: { color: '#ff9a3c', mode: 'soft-light', alpha: 0.35 }, swatch: '#f6b26b' },
  { id: 'cool', name: 'Sejuk', filter: 'saturate(0.95) contrast(1.05)', overlay: { color: '#3c8dff', mode: 'soft-light', alpha: 0.35 }, swatch: '#7fb3ff' },
  { id: 'film', name: 'Film Kodak', filter: 'contrast(1.1) saturate(1.15) sepia(0.15)', overlay: { color: '#ffcf8a', mode: 'soft-light', alpha: 0.3 }, vignette: 0.35, grain: 0.18, swatch: '#e2a85b' },
  { id: 'fuji', name: 'Fuji', filter: 'contrast(1.05) saturate(0.9) hue-rotate(-8deg)', overlay: { color: '#5fd3a4', mode: 'soft-light', alpha: 0.22 }, grain: 0.12, swatch: '#7cc6a6' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.45) contrast(0.95) saturate(0.85) brightness(1.03)', vignette: 0.45, grain: 0.22, swatch: '#c9a26b' },
  { id: 'bw', name: 'Hitam Putih', filter: 'grayscale(1) contrast(1.15)', grain: 0.12, swatch: '#777' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(1) contrast(1.5) brightness(0.9)', vignette: 0.55, grain: 0.2, swatch: '#222' },
  { id: 'pastel', name: 'Pastel', filter: 'saturate(0.75) brightness(1.1) contrast(0.9)', overlay: { color: '#ffc6e0', mode: 'screen', alpha: 0.15 }, swatch: '#ffc6e0' },
  { id: 'pinky', name: 'Pinky', filter: 'saturate(1.1)', overlay: { color: '#ff5fa2', mode: 'soft-light', alpha: 0.4 }, swatch: '#ff8fbf' },
  { id: 'vivid', name: 'Vivid', filter: 'saturate(1.45) contrast(1.12)', swatch: '#ff4f6d' },
  { id: 'matte', name: 'Matte', filter: 'contrast(0.85) brightness(1.06) saturate(0.9)', overlay: { color: '#2b2b40', mode: 'lighten', alpha: 0.25 }, swatch: '#8f8fa3' },
  { id: 'golden', name: 'Golden Hour', filter: 'saturate(1.2) contrast(1.05) brightness(1.05)', overlay: { color: '#ffb000', mode: 'overlay', alpha: 0.25 }, vignette: 0.25, swatch: '#ffb000' },
  { id: 'teal-orange', name: 'Teal & Orange', filter: 'contrast(1.12) saturate(1.2)', overlay: { color: '#008c8c', mode: 'color', alpha: 0.12 }, swatch: '#2a9d8f' },
  { id: 'cyber', name: 'Cyberpunk', filter: 'contrast(1.2) saturate(1.4) hue-rotate(-15deg)', overlay: { color: '#c400ff', mode: 'soft-light', alpha: 0.4 }, swatch: '#c400ff' },
  { id: 'faded', name: 'Faded', filter: 'contrast(0.8) saturate(0.7) brightness(1.1)', grain: 0.1, swatch: '#cfc6b8' },
  { id: 'polaroid', name: 'Polaroid', filter: 'contrast(1.05) saturate(1.05) sepia(0.2) hue-rotate(-5deg)', overlay: { color: '#a0f0ff', mode: 'soft-light', alpha: 0.18 }, vignette: 0.3, grain: 0.15, swatch: '#b8e0d2' },
  { id: 'y2k-flash', name: 'Y2K Flash', filter: 'brightness(1.15) contrast(1.25) saturate(1.1)', vignette: 0.4, grain: 0.15, swatch: '#fff1a8' },
  { id: 'dreamy', name: 'Dreamy', filter: 'brightness(1.08) saturate(1.1) blur(0.3px)', overlay: { color: '#e0c3ff', mode: 'screen', alpha: 0.2 }, swatch: '#e0c3ff' },
  { id: 'sunset', name: 'Sunset', filter: 'saturate(1.25)', overlay: { color: '#ff5e62', mode: 'soft-light', alpha: 0.45 }, swatch: '#ff7a59' },
]

let grainCv: HTMLCanvasElement | null = null
function grain() {
  if (grainCv) return grainCv
  grainCv = document.createElement('canvas')
  grainCv.width = grainCv.height = 256
  const c = grainCv.getContext('2d')!
  const d = c.createImageData(256, 256)
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255
  }
  c.putImageData(d, 0, 0)
  return grainCv
}

/** Apply grade overlays (the CSS filter is applied while drawing the source). */
export function applyGradeOverlays(c: CanvasRenderingContext2D, g: Grade, w: number, h: number, strength = 1) {
  if (g.overlay) {
    c.save(); c.globalCompositeOperation = g.overlay.mode; c.globalAlpha = g.overlay.alpha * strength
    c.fillStyle = g.overlay.color; c.fillRect(0, 0, w, h); c.restore()
  }
  if (g.vignette) {
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72)
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${g.vignette * strength})`)
    c.fillStyle = v; c.fillRect(0, 0, w, h)
  }
  if (g.grain) {
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = g.grain * strength
    c.fillStyle = c.createPattern(grain(), 'repeat')!
    c.translate(Math.random() * 256, Math.random() * 256)
    c.fillRect(-256, -256, w + 512, h + 512); c.restore()
  }
}
