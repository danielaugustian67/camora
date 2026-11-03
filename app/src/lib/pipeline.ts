import type { FaceLandmarker, ImageSegmenter, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { drawAccessory, facePose } from './accessories'
import { getBackground } from './backgrounds'
import { applyGradeOverlays, GRADES } from './grades'
import { drawCover } from './frame'

export interface Settings {
  bg: string // 'none' | 'blur' | background id
  grade: string
  gradeStrength: number
  smooth: number
  bright: number
  lip: string | null
  acc: { mata?: string; kepala?: string; wajah?: string }
  mirror: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  bg: 'none', grade: 'none', gradeStrength: 1, smooth: 0.4, bright: 0.3, lip: null, acc: {}, mirror: true,
}

const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
const INNER_LIPS = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
const EYE_L = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
const EYE_R = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
const BROW_L = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
const BROW_R = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]

const mk = (w = 1, h = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

export class Pipeline {
  raw = mk(); out = mk(); tmp = mk(); person = mk(); mask = mk()
  maskData: ImageData | null = null
  seg: ImageSegmenter | null = null
  face: FaceLandmarker | null = null
  lastTs = 0
  faces: NormalizedLandmark[][] = []

  private size(w: number, h: number) {
    for (const c of [this.raw, this.out, this.tmp, this.person]) if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
  }

  private poly(c: CanvasRenderingContext2D, lm: NormalizedLandmark[], idx: readonly number[], w: number, h: number, grow = 1) {
    let cx = 0, cy = 0
    idx.forEach(i => { cx += lm[i].x; cy += lm[i].y }); cx /= idx.length; cy /= idx.length
    c.beginPath()
    idx.forEach((i, k) => {
      const x = (cx + (lm[i].x - cx) * grow) * w, y = (cy + (lm[i].y - cy) * grow) * h
      k ? c.lineTo(x, y) : c.moveTo(x, y)
    })
    c.closePath()
  }

  /** Process one frame from `src` (video/image) and return the composed canvas. */
  process(src: CanvasImageSource, sw: number, sh: number, s: Settings, maxW = 960) {
    const k = Math.min(1, maxW / sw)
    const w = Math.round(sw * k), h = Math.round(sh * k)
    this.size(w, h)
    const rc = this.raw.getContext('2d', { willReadFrequently: false })!
    rc.save()
    if (s.mirror) { rc.translate(w, 0); rc.scale(-1, 1) }
    rc.drawImage(src, 0, 0, w, h)
    rc.restore()

    let ts = performance.now()
    if (ts <= this.lastTs) ts = this.lastTs + 1
    this.lastTs = ts

    const needFace = s.smooth > 0 || !!s.lip || !!(s.acc.mata || s.acc.kepala || s.acc.wajah)
    this.faces = []
    if (needFace && this.face) {
      try { this.faces = this.face.detectForVideo(this.raw, ts).faceLandmarks } catch (e) { console.warn(e) }
    }

    // ---- person layer with beauty ----
    const pc = this.person.getContext('2d')!
    pc.globalCompositeOperation = 'source-over'
    pc.filter = 'none'
    pc.drawImage(this.raw, 0, 0)
    for (const lm of this.faces) {
      const fw = Math.hypot((lm[454].x - lm[234].x) * w, (lm[454].y - lm[234].y) * h)
      if (s.smooth > 0) {
        const tc = this.tmp.getContext('2d')!
        tc.clearRect(0, 0, w, h)
        tc.save()
        this.poly(tc, lm, FACE_OVAL, w, h, 0.97)
        tc.clip()
        tc.filter = `blur(${Math.max(1, fw * 0.018 * s.smooth)}px)`
        tc.drawImage(this.raw, 0, 0)
        tc.filter = 'none'
        // keep eyes, brows and mouth sharp
        tc.globalCompositeOperation = 'destination-out'
        for (const [idx, g] of [[EYE_L, 1.5], [EYE_R, 1.5], [BROW_L, 1.25], [BROW_R, 1.25], [LIPS, 1.15]] as const) {
          this.poly(tc, lm, idx, w, h, g); tc.filter = `blur(${fw * 0.01}px)`; tc.fill(); tc.filter = 'none'
        }
        tc.restore()
        pc.globalAlpha = Math.min(0.9, 0.35 + s.smooth * 0.55)
        pc.drawImage(this.tmp, 0, 0)
        pc.globalAlpha = 1
      }
      if (s.lip) {
        const path = new Path2D()
        for (const idx of [LIPS, INNER_LIPS]) {
          idx.forEach((i, n) => n ? path.lineTo(lm[i].x * w, lm[i].y * h) : path.moveTo(lm[i].x * w, lm[i].y * h))
          path.closePath()
        }
        pc.save()
        pc.filter = `blur(${Math.max(1, fw * 0.006)}px)`
        pc.fillStyle = s.lip
        pc.globalCompositeOperation = 'soft-light'
        pc.globalAlpha = 0.95
        pc.fill(path, 'evenodd')
        pc.globalCompositeOperation = 'multiply'
        pc.globalAlpha = 0.3
        pc.fill(path, 'evenodd')
        pc.restore()
      }
    }

    // ---- background replacement ----
    const oc = this.out.getContext('2d')!
    oc.globalCompositeOperation = 'source-over'
    oc.filter = 'none'
    oc.globalAlpha = 1
    if (s.bg !== 'none' && this.seg) {
      let ok = false
      try {
        const res = this.seg.segmentForVideo(this.raw, ts)
        const m = res.confidenceMasks?.[0]
        if (m) {
          const mw = m.width, mh = m.height
          const arr = m.getAsFloat32Array()
          if (this.mask.width !== mw || this.mask.height !== mh) { this.mask.width = mw; this.mask.height = mh; this.maskData = null }
          this.maskData ??= new ImageData(mw, mh)
          const d = this.maskData.data
          for (let i = 0; i < arr.length; i++) {
            const v = Math.min(1, Math.max(0, (arr[i] - 0.25) / 0.5)) // sharpen edge
            d[i * 4 + 3] = v * 255
          }
          this.mask.getContext('2d')!.putImageData(this.maskData, 0, 0)
          ok = true
        }
        res.close()
      } catch (e) { console.warn(e) }

      if (ok) {
        if (s.bg === 'blur') {
          oc.filter = `blur(${Math.round(w * 0.02)}px)`
          oc.drawImage(this.raw, 0, 0)
          oc.filter = 'none'
        } else {
          const bg = getBackground(s.bg, 1280, 960)
          if (bg) drawCover(oc, bg, bg.width, bg.height, { x: 0, y: 0, w, h })
        }
        const tc = this.tmp.getContext('2d')!
        tc.globalCompositeOperation = 'source-over'
        tc.clearRect(0, 0, w, h)
        tc.filter = `blur(${Math.max(1, w / 400)}px)`
        tc.drawImage(this.mask, 0, 0, w, h)
        tc.filter = 'none'
        tc.globalCompositeOperation = 'source-in'
        tc.drawImage(this.person, 0, 0)
        tc.globalCompositeOperation = 'source-over'
        oc.drawImage(this.tmp, 0, 0)
      } else oc.drawImage(this.person, 0, 0)
    } else oc.drawImage(this.person, 0, 0)

    // ---- color grade + brightening ----
    const g = GRADES.find(x => x.id === s.grade) ?? GRADES[0]
    const bright = s.bright > 0 ? `brightness(${1 + s.bright * 0.12}) contrast(${1 - s.bright * 0.04}) saturate(${1 + s.bright * 0.08})` : ''
    const f = [g.filter === 'none' ? '' : g.filter, bright].filter(Boolean).join(' ')
    if (f) {
      const tc = this.tmp.getContext('2d')!
      tc.globalCompositeOperation = 'copy'
      tc.filter = f
      tc.globalAlpha = 1
      tc.drawImage(this.out, 0, 0)
      tc.filter = 'none'
      tc.globalCompositeOperation = 'source-over'
      oc.globalAlpha = g.id === 'none' ? 1 : s.gradeStrength
      oc.drawImage(this.tmp, 0, 0)
      oc.globalAlpha = 1
    }
    applyGradeOverlays(oc, g, w, h, s.gradeStrength)

    // ---- accessories ----
    for (const lm of this.faces) {
      const pose = facePose(lm, w, h, false)
      for (const id of [s.acc.wajah, s.acc.mata, s.acc.kepala]) if (id) drawAccessory(oc, id, pose)
    }
    return this.out
  }
}
