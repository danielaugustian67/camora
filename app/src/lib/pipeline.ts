import type { FaceLandmarker, ImageSegmenter, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { drawAccessory, drawSkinEffect, facePose, isSkinEffect } from './accessories'
import { getBackground } from './backgrounds'
import { applyGradeOverlays, GRADES } from './grades'
import { drawCover } from './frame'
import { BeautyGL, hexToRgb } from './beautygl'
import { LandmarkSmoother } from './smooth'
import { Makeup } from './makeup'
import { AccessoryRenderer, has3D } from './ar/renderer'

export interface Settings {
  bg: string // 'none' | 'blur' | background id
  grade: string
  gradeStrength: number
  smooth: number
  bright: number
  lip: string | null
  gloss: number
  lipAmt: number
  acc: { mata?: string; kepala?: string; wajah?: string }
  makeup: string
  makeupAmt: number
  mirror: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  bg: 'none', grade: 'none', gradeStrength: 1, smooth: 0.45, bright: 0.3, lip: null, gloss: 0.4, lipAmt: 0.55, acc: {}, mirror: true, makeup: 'none', makeupAmt: 0.8,
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
  raw = mk(); out = mk(); tmp = mk(); person = mk(); mask = mk(); acc = mk()
  skinMask = mk(); lipMask = mk(); probe = mk(8, 8)
  maskData: ImageData | null = null
  seg: ImageSegmenter | null = null
  face: FaceLandmarker | null = null
  gl: BeautyGL | null | undefined
  smoother = new LandmarkSmoother()
  makeup = new Makeup()
  ar: AccessoryRenderer | null | undefined
  lastTs = 0
  faces: NormalizedLandmark[][] = []      // smoothed: accessories
  rawFaces: NormalizedLandmark[][] = []   // exact for this frame: beauty / lips

  private size(w: number, h: number) {
    for (const c of [this.raw, this.out, this.tmp, this.person, this.acc]) if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
    const mw = Math.round(w / 2), mh = Math.round(h / 2)
    if (this.skinMask.width !== mw || this.skinMask.height !== mh) { this.skinMask.width = mw; this.skinMask.height = mh }
    if (this.lipMask.width !== w || this.lipMask.height !== h) { this.lipMask.width = w; this.lipMask.height = h }
  }

  private poly(path: Path2D | CanvasRenderingContext2D, lm: NormalizedLandmark[], idx: readonly number[], w: number, h: number, grow = 1) {
    let cx = 0, cy = 0
    idx.forEach(i => { cx += lm[i].x; cy += lm[i].y }); cx /= idx.length; cy /= idx.length
    idx.forEach((i, k) => {
      const x = (cx + (lm[i].x - cx) * grow) * w, y = (cy + (lm[i].y - cy) * grow) * h
      k ? path.lineTo(x, y) : path.moveTo(x, y)
    })
    path.closePath()
  }

  private buildMasks(faces: NormalizedLandmark[][], wantLip: boolean) {
    const mw = this.skinMask.width, mh = this.skinMask.height
    const sc = this.skinMask.getContext('2d')!, lc = this.lipMask.getContext('2d')!
    sc.globalCompositeOperation = 'source-over'; sc.filter = 'none'
    sc.fillStyle = '#000'; sc.fillRect(0, 0, mw, mh)
    const lw = this.lipMask.width, lh = this.lipMask.height
    lc.filter = 'none'; lc.fillStyle = '#000'; lc.fillRect(0, 0, lw, lh)
    for (const lm of faces) {
      const fw = Math.hypot((lm[454].x - lm[234].x) * mw, (lm[454].y - lm[234].y) * mh)
      sc.globalCompositeOperation = 'source-over'
      sc.filter = `blur(${Math.max(1, fw * 0.045)}px)`
      sc.fillStyle = '#fff'
      sc.beginPath(); this.poly(sc, lm, FACE_OVAL, mw, mh, 0.94); sc.fill()
      sc.fillStyle = '#000'
      sc.filter = `blur(${Math.max(1, fw * 0.02)}px)`
      for (const [idx, g] of [[EYE_L, 1.7], [EYE_R, 1.7], [BROW_L, 1.35], [BROW_R, 1.35], [LIPS, 1.12]] as const) {
        sc.beginPath(); this.poly(sc, lm, idx, mw, mh, g); sc.fill()
      }
      if (wantLip) {
        const p = new Path2D()
        this.poly(p, lm, LIPS, lw, lh, 0.98)
        this.poly(p, lm, INNER_LIPS, lw, lh, 1.08)
        lc.filter = `blur(${Math.max(0.8, fw * 2 * 0.006)}px)`
        lc.fillStyle = '#fff'
        lc.fill(p, 'evenodd')
      }
    }
    sc.filter = 'none'; lc.filter = 'none'
  }

  /** average luminance of the face region (0..1), used to match accessory lighting */
  private faceLight(lm: NormalizedLandmark[], w: number, h: number) {
    const x0 = lm[234].x * w, x1 = lm[454].x * w, y0 = lm[10].y * h, y1 = lm[152].y * h
    const pc = this.probe.getContext('2d', { willReadFrequently: true })!
    pc.drawImage(this.raw, Math.min(x0, x1), y0, Math.abs(x1 - x0) || 1, (y1 - y0) || 1, 0, 0, 8, 8)
    const d = pc.getImageData(0, 0, 8, 8).data
    let s = 0
    for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    return s / (64 * 255)
  }

  /** Process one frame from `src` (video/image) and return the composed canvas. */
  process(src: CanvasImageSource, sw: number, sh: number, s: Settings, maxW = 1280) {
    const k = Math.min(1, maxW / sw)
    const w = Math.round(sw * k), h = Math.round(sh * k)
    this.size(w, h)
    const rc = this.raw.getContext('2d')!
    rc.save()
    if (s.mirror) { rc.translate(w, 0); rc.scale(-1, 1) }
    rc.drawImage(src, 0, 0, w, h)
    rc.restore()

    let ts = performance.now()
    if (ts <= this.lastTs) ts = this.lastTs + 1
    this.lastTs = ts

    const anyAcc = !!(s.acc.mata || s.acc.kepala || s.acc.wajah)
    const needFace = s.makeup !== 'none' || s.smooth > 0 || s.bright > 0 || !!s.lip || anyAcc
    this.faces = []; this.rawFaces = []
    if (needFace && this.face) {
      try {
        this.rawFaces = this.face.detectForVideo(this.raw, ts).faceLandmarks
        this.faces = this.smoother.smooth(this.rawFaces, ts)
      } catch (e) { console.warn(e) }
    }

    // ---- person layer with beauty ----
    const pc = this.person.getContext('2d')!
    pc.globalCompositeOperation = 'source-over'; pc.filter = 'none'; pc.globalAlpha = 1
    pc.drawImage(this.raw, 0, 0)
    if (this.rawFaces.length && (s.smooth > 0 || s.bright > 0 || s.lip)) {
      if (this.gl === undefined) this.gl = BeautyGL.create()
      if (this.gl) {
        this.buildMasks(this.rawFaces, !!s.lip)
        const fw = Math.max(...this.rawFaces.map(lm => Math.hypot((lm[454].x - lm[234].x) * w, (lm[454].y - lm[234].y) * h)))
        const res = this.gl.run(this.raw, this.skinMask, this.lipMask, {
          radius: Math.max(2, fw * 0.028), smooth: s.smooth, bright: s.bright,
          lip: s.lip ? hexToRgb(s.lip) : null, lipAmt: s.lipAmt, gloss: s.gloss,
        })
        pc.drawImage(res, 0, 0)
      }
    }
    if (s.makeup !== 'none') this.makeup.apply(pc, this.rawFaces, s.makeup, s.makeupAmt, w, h)
    if (s.acc.wajah && isSkinEffect(s.acc.wajah))
      for (const lm of this.rawFaces) drawSkinEffect(pc, s.acc.wajah, facePose(lm, w, h))

    // ---- background replacement ----
    const oc = this.out.getContext('2d')!
    oc.globalCompositeOperation = 'source-over'; oc.filter = 'none'; oc.globalAlpha = 1
    let composed = false
    if (s.bg !== 'none' && this.seg) {
      try {
        const res = this.seg.segmentForVideo(this.raw, ts)
        const m = res.confidenceMasks?.[0]
        if (m) {
          const mw = m.width, mh = m.height
          const arr = m.getAsFloat32Array()
          if (this.mask.width !== mw || this.mask.height !== mh) { this.mask.width = mw; this.mask.height = mh; this.maskData = null }
          this.maskData ??= new ImageData(mw, mh)
          const d = this.maskData.data
          for (let i = 0; i < arr.length; i++) d[i * 4 + 3] = Math.min(1, Math.max(0, (arr[i] - 0.3) / 0.45)) * 255
          this.mask.getContext('2d')!.putImageData(this.maskData, 0, 0)
          if (s.bg === 'blur') {
            oc.filter = `blur(${Math.round(w * 0.02)}px)`; oc.drawImage(this.raw, 0, 0); oc.filter = 'none'
          } else {
            const bg = getBackground(s.bg, 1600, 1200)
            if (bg) drawCover(oc, bg, bg.width, bg.height, { x: 0, y: 0, w, h })
          }
          const tc = this.tmp.getContext('2d')!
          tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1
          tc.clearRect(0, 0, w, h)
          tc.filter = `blur(${Math.max(1, w / 500)}px)`
          tc.drawImage(this.mask, 0, 0, w, h)
          tc.filter = 'none'
          tc.globalCompositeOperation = 'source-in'
          tc.drawImage(this.person, 0, 0)
          tc.globalCompositeOperation = 'source-over'
          oc.drawImage(this.tmp, 0, 0)
          composed = true
        }
        res.close()
      } catch (e) { console.warn(e) }
    }
    if (!composed) oc.drawImage(this.person, 0, 0)

    // ---- accessories: contact shadow + light matching, before grading so they share the look ----
    if (anyAcc && this.faces.length) {
      const ac = this.acc.getContext('2d')!
      ac.clearRect(0, 0, w, h)
      let light = 0, fwMax = 0
      const ids3d = [s.acc.mata, s.acc.kepala].filter((x): x is string => !!x && has3D(x))
      if (ids3d.length && this.ar === undefined) this.ar = AccessoryRenderer.create()
      for (const lm of this.faces) {
        const pose = facePose(lm, w, h)
        fwMax = Math.max(fwMax, pose.fw)
        light += this.faceLight(lm, w, h)
        for (const id of [s.acc.wajah, s.acc.mata, s.acc.kepala])
          if (id && !isSkinEffect(id) && !(this.ar && has3D(id))) drawAccessory(ac, id, pose)
      }
      if (this.ar && ids3d.length) ac.drawImage(this.ar.render(this.faces, ids3d, w, h), 0, 0)
      light /= this.faces.length
      const tc = this.tmp.getContext('2d')!
      tc.globalAlpha = 1; tc.filter = 'none'
      tc.globalCompositeOperation = 'copy'; tc.drawImage(this.acc, 0, 0)
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = '#000'; tc.fillRect(0, 0, w, h)
      tc.globalCompositeOperation = 'source-over'
      oc.save()
      oc.globalCompositeOperation = 'multiply'
      oc.globalAlpha = 0.32
      oc.filter = `blur(${Math.max(1, fwMax * 0.018)}px)`
      oc.drawImage(this.tmp, 0, fwMax * 0.02)
      oc.restore()
      const kb = Math.max(0.55, Math.min(1.08, 0.45 + light * 1.1))
      oc.save()
      oc.filter = `brightness(${kb.toFixed(3)}) blur(${Math.max(0.3, w / 2600).toFixed(2)}px)`
      oc.drawImage(this.acc, 0, 0)
      oc.restore()
    }

    // ---- color grade ----
    const g = GRADES.find(x => x.id === s.grade) ?? GRADES[0]
    if (g.filter !== 'none') {
      const tc = this.tmp.getContext('2d')!
      tc.globalCompositeOperation = 'copy'; tc.filter = g.filter; tc.globalAlpha = 1
      tc.drawImage(this.out, 0, 0)
      tc.filter = 'none'; tc.globalCompositeOperation = 'source-over'
      oc.globalAlpha = s.gradeStrength
      oc.drawImage(this.tmp, 0, 0)
      oc.globalAlpha = 1
    }
    applyGradeOverlays(oc, g, w, h, s.gradeStrength)
    return this.out
  }
}
