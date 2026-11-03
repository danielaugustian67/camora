import * as THREE from 'three'

/**
 * Procedural 3D accessories.
 * Eyewear lives in "eye space": origin = midpoint between pupils, 1 unit = pupil distance (IPD),
 *   +x = subject's right on screen, +y = up, +z = toward the camera.
 * Headwear lives in "head space": origin = head centre at hairline height, 1 unit = head width.
 */

export interface FitCtx {
  /** ear anchor points in eye space (where glasses temples rest) */
  earL: THREE.Vector3
  earR: THREE.Vector3
}

export interface Model {
  object: THREE.Object3D
  space: 'eye' | 'head'
  update?: (ctx: FitCtx) => void
}

// ------------------------------------------------------------------ materials
const metal = (color: number, roughness = 0.2) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness })
const acetate = (color: number, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, ...opts })
const fabric = (color: number, map?: THREE.Texture, bump?: THREE.Texture) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.95, metalness: 0, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).multiplyScalar(1.3), map, bumpMap: bump, bumpScale: 2 })
const lensMat = (color: number, opacity: number, mirror = false) => new THREE.MeshPhysicalMaterial({
  color, transparent: true, opacity, roughness: 0.04, metalness: mirror ? 0.9 : 0, clearcoat: 1, clearcoatRoughness: 0.02,
  envMapIntensity: mirror ? 2.2 : 1.6, side: THREE.DoubleSide, depthWrite: false,
})
const gemMat = (color: number) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.02, metalness: 0.1, clearcoat: 1, iridescence: 0.6, envMapIntensity: 2.5 })

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
let rs = 9
const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647 }

const tortoiseTex = () => canvasTex(256, 256, c => {
  c.fillStyle = '#4a240c'; c.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = 6 + rnd() * 26
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, i % 3 ? 'rgba(200,130,50,0.9)' : 'rgba(230,170,80,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.6, rnd() * 3, 0, 7); c.fill()
  }
}, [3, 3])
const knitTex = () => canvasTex(128, 128, c => {
  c.fillStyle = '#888'; c.fillRect(0, 0, 128, 128)
  for (let x = 0; x < 128; x += 8) for (let y = 0; y < 128; y += 10) {
    const g = c.createLinearGradient(x, 0, x + 8, 0)
    g.addColorStop(0, '#333'); g.addColorStop(0.5, '#eee'); g.addColorStop(1, '#333')
    c.fillStyle = g; c.beginPath(); c.ellipse(x + 4, y + 5, 3.6, 5.5, 0, 0, 7); c.fill()
  }
}, [28, 6])
const fuzzTex = () => canvasTex(128, 128, c => {
  const d = c.createImageData(128, 128)
  for (let i = 0; i < d.data.length; i += 4) { const v = 90 + rnd() * 165; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 }
  c.putImageData(d, 0, 0)
}, [6, 6])
const stripeTex = (a: string, b: string) => canvasTex(64, 256, c => {
  c.fillStyle = a; c.fillRect(0, 0, 64, 256); c.fillStyle = b
  for (let y = 0; y < 256; y += 48) c.fillRect(0, y, 64, 20)
}, [1, 1])

// ------------------------------------------------------------------ lens shapes (y up)
type ShapeFn = (r: number) => THREE.Shape
const circle: ShapeFn = r => { const s = new THREE.Shape(); s.absellipse(0, 0, r, r, 0, Math.PI * 2, false, 0); return s }
const roundRect = (wf: number, hf: number, rad: number): ShapeFn => r => {
  const w = r * wf, h = r * hf, q = r * rad, s = new THREE.Shape()
  s.moveTo(-w + q, -h); s.lineTo(w - q, -h); s.quadraticCurveTo(w, -h, w, -h + q); s.lineTo(w, h - q); s.quadraticCurveTo(w, h, w - q, h)
  s.lineTo(-w + q, h); s.quadraticCurveTo(-w, h, -w, h - q); s.lineTo(-w, -h + q); s.quadraticCurveTo(-w, -h, -w + q, -h); return s
}
const wayfarer: ShapeFn = r => {
  const s = new THREE.Shape()
  s.moveTo(-r * 1.1, r * 0.72); s.lineTo(r * 1.15, r * 0.8)
  s.quadraticCurveTo(r * 1.2, -r * 0.3, r * 0.8, -r * 0.66); s.quadraticCurveTo(0, -r * 0.82, -r * 0.8, -r * 0.64)
  s.quadraticCurveTo(-r * 1.15, -r * 0.3, -r * 1.1, r * 0.72); return s
}
const aviator: ShapeFn = r => {
  const s = new THREE.Shape()
  s.moveTo(-r * 1.08, r * 0.62); s.quadraticCurveTo(0, r * 0.86, r * 1.08, r * 0.62)
  s.bezierCurveTo(r * 1.26, -r * 0.3, r * 0.65, -r * 1.06, 0, -r * 0.97)
  s.bezierCurveTo(-r * 0.84, -r * 0.88, -r * 1.16, -r * 0.2, -r * 1.08, r * 0.62); return s
}
const cateye: ShapeFn = r => { // subject's right lens (outer corner at +x)
  const s = new THREE.Shape()
  s.moveTo(-r * 0.98, r * 0.4); s.quadraticCurveTo(0, r * 0.74, r * 1.32, r * 0.92)
  s.quadraticCurveTo(r * 1.1, -r * 0.56, r * 0.18, -r * 0.7); s.quadraticCurveTo(-r * 0.9, -r * 0.7, -r * 0.98, r * 0.4); return s
}
const heart: ShapeFn = r => {
  const s = new THREE.Shape()
  s.moveTo(0, -r * 0.95)
  s.bezierCurveTo(-r * 1.6, r * 0.1, -r * 0.85, r * 1.3, 0, r * 0.52)
  s.bezierCurveTo(r * 0.85, r * 1.3, r * 1.6, r * 0.1, 0, -r * 0.95); return s
}
const star: ShapeFn = r => {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.55 : r * 1.2, a = (Math.PI / 5) * i + Math.PI / 2
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  return s
}

function scaledShape(fn: ShapeFn, r: number, sx = 1) {
  const s = fn(r)
  if (sx === 1) return s
  const pts = s.getPoints(64).map(p => new THREE.Vector2(p.x * sx, p.y))
  return new THREE.Shape(pts.reverse())
}

interface GlassesSpec { shape: ShapeFn; r: number; thick: number; frame: THREE.Material; lens: THREE.Material; mirrorLeft?: boolean; topBar?: boolean; templeMat?: THREE.Material }

export function glasses(g: GlassesSpec): Model {
  const root = new THREE.Group()
  const depth = 0.06
  const lensZ = 0.26
  for (const d of [-1, 1]) {
    const side = new THREE.Group()
    side.position.set(d * 0.5, 0, lensZ)
    side.rotation.y = -d * 0.12 // slight face-form wrap
    const mirror = !!g.mirrorLeft && d < 0
    const sx = mirror ? -1 : 1
    const outer = scaledShape(g.shape, g.r + g.r * g.thick, sx)
    outer.holes.push(new THREE.Path(scaledShape(g.shape, g.r, sx).getPoints(96)))
    const frameGeo = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3, curveSegments: 64 })
    frameGeo.translate(0, 0, -depth / 2)
    side.add(new THREE.Mesh(frameGeo, g.frame))
    const lens = new THREE.Mesh(new THREE.ShapeGeometry(scaledShape(g.shape, g.r * 1.02, sx), 64), g.lens)
    lens.renderOrder = 2
    side.add(lens)
    root.add(side)
  }
  // bridge
  const inner = 0.5 - g.r * 0.95
  const bridgeCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-inner, g.r * 0.3, lensZ), new THREE.Vector3(0, g.r * 0.52, lensZ + 0.05), new THREE.Vector3(inner, g.r * 0.3, lensZ)])
  root.add(new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 24, g.r * g.thick * 0.42, 12), g.frame))
  if (g.topBar) {
    const tb = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5 - g.r * 0.4, g.r * 0.78, lensZ), new THREE.Vector3(0, g.r * 0.86, lensZ + 0.06), new THREE.Vector3(0.5 + g.r * 0.4, g.r * 0.78, lensZ)])
    root.add(new THREE.Mesh(new THREE.TubeGeometry(tb, 24, g.r * g.thick * 0.3, 10), g.frame))
  }
  // temples: unit cylinders re-aimed at the ears every frame
  const temples = [-1, 1].map(() => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12)
    geo.translate(0, 0.5, 0)
    const m = new THREE.Mesh(geo, g.templeMat ?? g.frame)
    root.add(m)
    return m
  })
  const up = new THREE.Vector3(0, 1, 0)
  const thick = g.r * g.thick * 0.45
  return {
    object: root, space: 'eye',
    update: ({ earL, earR }) => {
      ;[earL, earR].forEach((ear, i) => {
        const d = i === 0 ? -1 : 1
        const hinge = new THREE.Vector3(d * (0.5 + g.r * 1.12), g.r * 0.35, lensZ - 0.04)
        const target = ear.clone().add(new THREE.Vector3(0, 0.05, -0.1))
        const dir = target.clone().sub(hinge)
        const t = temples[i]
        t.position.copy(hinge)
        t.quaternion.setFromUnitVectors(up, dir.clone().normalize())
        t.scale.set(thick, dir.length(), thick * 1.6)
      })
    },
  }
}

export function visor(): Model {
  const root = new THREE.Group()
  const geo = new THREE.CylinderGeometry(1.25, 1.25, 0.5, 64, 1, true, -1.0, 2.0)
  geo.rotateY(Math.PI)
  const m = new THREE.Mesh(geo, lensMat(0x9fb8ff, 0.72, true))
  m.position.set(0, 0.02, -0.95)
  m.rotation.y = Math.PI
  root.add(m)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.012, 8, 96, 2.0), metal(0xdfe3ea, 0.15))
  rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 2 - 1.0
  rim.position.set(0, 0.27, -0.95)
  root.add(rim)
  return { object: root, space: 'eye' }
}

// ------------------------------------------------------------------ headwear (head units)
const sphere = (r: number, mat: THREE.Material, seg = 24) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat)
const pom = (r: number, color: number) => { const m = sphere(r, fabric(color, undefined, fuzzTex()), 32); return m }

function crown(): Model {
  const root = new THREE.Group()
  const geo = new THREE.CylinderGeometry(0.36, 0.34, 0.16, 160, 6, true)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    if (y > -0.079) {
      const a = Math.atan2(x, z)
      const spike = Math.pow(Math.max(0, Math.cos(a * 4)), 6) * 0.16
      pos.setY(i, y + ((y + 0.08) / 0.16) * spike)
    }
  }
  geo.computeVertexNormals()
  const gold = metal(0xe2b13c, 0.18)
  gold.side = THREE.DoubleSide
  root.add(new THREE.Mesh(geo, gold))
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.018, 12, 96), gold)
  band.rotation.x = Math.PI / 2; band.position.y = -0.07
  root.add(band)
  const cols = [0xd0103a, 0x1e5fff, 0x0e9f6a, 0xd0103a, 0x1e5fff]
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const g = sphere(0.026, gemMat(cols[k % cols.length]))
    g.position.set(Math.sin(a) * 0.355, -0.02, Math.cos(a) * 0.355)
    root.add(g)
    const p = sphere(0.018, gemMat(0xffffff))
    p.position.set(Math.sin(a) * 0.35, 0.16, Math.cos(a) * 0.35)
    root.add(p)
  }
  root.position.y = 0.1
  root.scale.set(1.08, 1, 1.25)
  return { object: root, space: 'head' }
}

function tiara(): Model {
  const root = new THREE.Group()
  const silver = metal(0xe8ebf0, 0.12)
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.012, 8, 80, Math.PI * 0.8), silver)
  band.rotation.x = Math.PI / 2; band.rotation.z = Math.PI * 0.1
  root.add(band)
  for (let k = -6; k <= 6; k++) {
    const a = k * 0.2
    const h = 0.05 + Math.cos(k / 6 * Math.PI / 2) * 0.12
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(a) * 0.42, 0, Math.cos(a) * 0.42),
      new THREE.Vector3(Math.sin(a) * 0.43, h * 0.6, Math.cos(a) * 0.43),
      new THREE.Vector3(Math.sin(a) * 0.42, h, Math.cos(a) * 0.42),
    ])
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.006, 6), silver))
    const g = sphere(k === 0 ? 0.03 : 0.016, gemMat(k === 0 ? 0x8fd0ff : 0xffffff))
    g.position.set(Math.sin(a) * 0.42, h, Math.cos(a) * 0.42)
    root.add(g)
  }
  root.position.y = 0.04
  root.scale.set(1, 1, 1.2)
  return { object: root, space: 'head' }
}

function flowerCrown(): Model {
  const root = new THREE.Group()
  const pal: [number, number][] = [[0xffb7c9, 0xffd23f], [0xffffff, 0xffc93c], [0xffcf9e, 0xe07b1a], [0xd7b8ff, 0xffd23f]]
  const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x4f8a35, roughness: 0.6, sheen: 0.5 })
  for (let k = -9; k <= 9; k++) {
    const a = k * 0.17
    const [pc, cc] = pal[(k + 18) % pal.length]
    const petalMat = new THREE.MeshPhysicalMaterial({ color: pc, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide })
    const f = new THREE.Group()
    const n = k % 2 ? 6 : 5
    const s = k % 2 ? 0.045 : 0.06
    for (let i = 0; i < n; i++) {
      const p = sphere(1, petalMat, 16)
      p.scale.set(s * 0.45, s, s * 0.18)
      const t = (i / n) * Math.PI * 2
      p.position.set(Math.cos(t) * s * 0.8, Math.sin(t) * s * 0.8, 0)
      p.rotation.z = t - Math.PI / 2
      p.rotation.x = 0.35
      f.add(p)
    }
    const c = sphere(s * 0.3, new THREE.MeshPhysicalMaterial({ color: cc, roughness: 0.8 }), 12)
    c.position.z = s * 0.1
    f.add(c)
    const lf = sphere(1, leafMat, 12)
    lf.scale.set(0.02, 0.055, 0.008)
    lf.position.set(s * 0.9, -s * 0.9, -0.01); lf.rotation.z = 0.8
    f.add(lf)
    f.position.set(Math.sin(a) * 0.43, Math.cos(k * 1.7) * 0.012, Math.cos(a) * 0.43)
    f.lookAt(Math.sin(a) * 2, 0, Math.cos(a) * 2)
    root.add(f)
  }
  root.position.y = 0.02
  root.scale.set(1, 1, 1.2)
  return { object: root, space: 'head' }
}

function headband(color = 0x1a1a1a) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 10, 80, Math.PI), acetate(color))
  m.position.set(0, -0.25, -0.02)
  return m
}

function ears(kind: 'bunny' | 'cat' | 'fox'): Model {
  const root = new THREE.Group()
  root.add(headband())
  const outerCol = kind === 'bunny' ? 0xf3efea : kind === 'cat' ? 0x2c2320 : 0xd5682a
  const innerCol = kind === 'fox' ? 0xfff0de : 0xffaabd
  const outerMat = fabric(outerCol, undefined, fuzzTex())
  const innerMat = fabric(innerCol, undefined, fuzzTex())
  const shape = (s: number) => {
    const sh = new THREE.Shape()
    if (kind === 'bunny') { sh.absellipse(0, 0.2 * s, 0.075 * s, 0.22 * s, 0, Math.PI * 2, false, 0) }
    else { sh.moveTo(-0.11 * s, 0); sh.quadraticCurveTo(-0.08 * s, 0.14 * s, 0, 0.24 * s); sh.quadraticCurveTo(0.08 * s, 0.14 * s, 0.11 * s, 0); sh.lineTo(-0.11 * s, 0) }
    return sh
  }
  for (const d of [-1, 1]) {
    const e = new THREE.Group()
    const o = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(kind === 'bunny' ? 1.1 : 1), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3 }), outerMat)
    const i = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(kind === 'bunny' ? 0.75 : 0.62), { depth: 0.01, bevelEnabled: false }), innerMat)
    i.position.set(0, kind === 'bunny' ? 0.05 : 0.02, 0.046)
    e.add(o, i)
    e.position.set(d * (kind === 'bunny' ? 0.15 : 0.3), kind === 'bunny' ? 0.18 : 0.12, 0.02)
    e.rotation.z = -d * (kind === 'bunny' ? 0.15 : 0.35)
    e.rotation.x = -0.1
    root.add(e)
  }
  return { object: root, space: 'head' }
}

function bow(): Model {
  const root = new THREE.Group()
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xff7aa6, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xffd6e5), clearcoat: 0.4 })
  for (const d of [-1, 1]) {
    const lobe = sphere(1, satin, 32)
    lobe.scale.set(0.13, 0.08, 0.045)
    lobe.position.set(d * 0.11, 0.01, 0); lobe.rotation.z = d * 0.25
    root.add(lobe)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.012), satin)
    tail.position.set(d * 0.04, -0.09, 0); tail.rotation.z = d * 0.35
    root.add(tail)
  }
  const knot = sphere(0.04, satin, 24); knot.scale.set(1, 1.15, 0.8)
  root.add(knot)
  root.position.set(0.24, 0.12, 0.28)
  root.rotation.set(-0.3, 0.6, 0.35)
  return { object: root, space: 'head' }
}

function cowboy(): Model {
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x8a5a2b, roughness: 0.72, sheen: 0.3, side: THREE.DoubleSide, bumpMap: fuzzTex(), bumpScale: 0.5 })
  const prof = [
    [0.0, 0.32], [0.18, 0.33], [0.31, 0.3], [0.36, 0.12], [0.37, 0.0],
    [0.5, -0.005], [0.66, 0.02], [0.78, 0.07], [0.82, 0.1],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const hat = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), leather)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.372, 0.37, 0.06, 96, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x2a1a0a, roughness: 0.5, side: THREE.DoubleSide }))
  band.position.y = 0.04
  const root = new THREE.Group(); root.add(hat, band)
  // curl brim sides up
  const pos = (hat.geometry as THREE.BufferGeometry).attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z)
    if (r > 0.4) pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x) / 0.82, 3) * 0.14 * ((r - 0.4) / 0.42))
  }
  hat.geometry.computeVertexNormals()
  root.position.y = 0.02
  root.scale.set(1, 1, 1.15)
  return { object: root, space: 'head' }
}

function beanie(): Model {
  const knit = knitTex()
  const mat = fabric(0xc9584a, undefined, knit)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat)
  dome.scale.set(1.04, 0.95, 1.18)
  const cuffTex = knitTex(); cuffTex.repeat.set(40, 2)
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.54, 0.15, 96, 1, true), fabric(0xb4473b, undefined, cuffTex))
  cuff.scale.set(1.04, 1, 1.18); cuff.position.y = 0.02
  const p = pom(0.11, 0xf3eee6); p.position.y = 0.5
  const root = new THREE.Group(); root.add(dome, cuff, p)
  root.position.y = -0.02
  return { object: root, space: 'head' }
}

function santa(): Model {
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0xb3121b, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0xff6060), side: THREE.DoubleSide })
  const geo = new THREE.ConeGeometry(0.5, 0.62, 64, 24, true)
  geo.translate(0, 0.31, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = Math.max(0, (y - 0.15) / 0.47)
    pos.setX(i, pos.getX(i) + t * t * 0.45)
    pos.setY(i, y - t * t * 0.22)
  }
  geo.computeVertexNormals()
  const cone = new THREE.Mesh(geo, velvet)
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.075, 20, 96), fabric(0xf4f1ea, undefined, fuzzTex()))
  trim.rotation.x = Math.PI / 2
  const p = pom(0.085, 0xf4f1ea); p.position.set(0.45, 0.4, 0)
  const root = new THREE.Group(); root.add(cone, trim, p)
  root.scale.set(1.04, 1, 1.18)
  return { object: root, space: 'head' }
}

function party(): Model {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 64, 1, true), new THREE.MeshPhysicalMaterial({ map: stripeTex('#ff5fa2', '#ffd23f'), roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }))
  cone.position.y = 0.25
  const p = pom(0.05, 0x4dabf7); p.position.y = 0.51
  const root = new THREE.Group(); root.add(cone, p)
  root.position.set(0.12, 0.08, 0.05)
  root.rotation.z = -0.3
  return { object: root, space: 'head' }
}

function gradCap(): Model {
  const black = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.6, sheen: 0.4, side: THREE.DoubleSide })
  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.16, 64, 1, true), black)
  skull.scale.set(1.04, 1, 1.18); skull.position.y = 0.06
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.025, 0.95), black)
  board.position.y = 0.15; board.rotation.y = Math.PI / 4
  const gold = metal(0xe8b923, 0.35)
  const btn = sphere(0.025, gold); btn.position.y = 0.17
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0.3, 0.165, 0.3), new THREE.Vector3(0.48, 0.15, 0.35), new THREE.Vector3(0.5, 0.0, 0.36)]), 24, 0.006, 6), gold)
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.12, 12), gold); tassel.position.set(0.5, -0.06, 0.36)
  const root = new THREE.Group(); root.add(skull, board, btn, cord, tassel)
  root.rotation.x = -0.08
  return { object: root, space: 'head' }
}

function halo(): Model {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 16, 96), new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffd23f, emissiveIntensity: 1.4, roughness: 0.3, metalness: 0.4 }))
  m.rotation.x = Math.PI / 2 - 0.1
  m.position.y = 0.45
  return { object: m, space: 'head' }
}

function horns(): Model {
  const root = new THREE.Group()
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xb3121b, roughness: 0.25, clearcoat: 1 })
  for (const d of [-1, 1]) {
    const geo = new THREE.ConeGeometry(0.06, 0.24, 32, 16)
    geo.translate(0, 0.12, 0)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) { const t = pos.getY(i) / 0.24; pos.setX(i, pos.getX(i) + d * t * t * 0.08) }
    geo.computeVertexNormals()
    const h = new THREE.Mesh(geo, mat)
    h.position.set(d * 0.2, -0.02, 0.12); h.rotation.z = -d * 0.25; h.rotation.x = -0.15
    root.add(h)
  }
  return { object: root, space: 'head' }
}

function starBand(): Model {
  const root = new THREE.Group()
  root.add(headband(0x222222))
  const gold = metal(0xf2b800, 0.2)
  const wire = metal(0xb0b0b0, 0.3)
  for (const [x, h, s] of [[-0.2, 0.22, 0.055], [0, 0.3, 0.07], [0.2, 0.22, 0.055]]) {
    const base = new THREE.Vector3(x * 0.9, 0.18, 0.08)
    const tip = new THREE.Vector3(x * 1.2, h + 0.12, 0.12)
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([base, new THREE.Vector3(x, h * 0.8 + 0.1, 0.1), tip]), 16, 0.004, 6), wire))
    const st = new THREE.Mesh(new THREE.ExtrudeGeometry(star(s), { depth: 0.015, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 }), gold)
    st.position.copy(tip)
    root.add(st)
  }
  return { object: root, space: 'head' }
}

// ------------------------------------------------------------------ registry
export const MODEL_BUILDERS: Record<string, () => Model> = {
  'round-gold': () => glasses({ shape: circle, r: 0.36, thick: 0.08, frame: metal(0xd4af37, 0.18), lens: lensMat(0xffffff, 0.08) }),
  'wayfarer': () => glasses({ shape: wayfarer, r: 0.36, thick: 0.22, frame: acetate(0x0d0d0d), lens: lensMat(0x0a0a10, 0.9) }),
  'aviator': () => glasses({ shape: aviator, r: 0.37, thick: 0.06, frame: metal(0xd4af37, 0.15), lens: lensMat(0x6b3a14, 0.7), topBar: true }),
  'tortoise': () => glasses({ shape: roundRect(1.18, 0.85, 0.4), r: 0.32, thick: 0.18, frame: acetate(0xffffff, { map: tortoiseTex() }), lens: lensMat(0xffffff, 0.08) }),
  'cateye': () => glasses({ shape: cateye, r: 0.33, thick: 0.16, frame: acetate(0xb0102f), lens: lensMat(0xffffff, 0.08), mirrorLeft: true }),
  'clear-pink': () => glasses({ shape: circle, r: 0.38, thick: 0.14, frame: acetate(0xffa6bd, { transparent: true, opacity: 0.75 }), lens: lensMat(0xffffff, 0.06) }),
  'silver-rect': () => glasses({ shape: roundRect(1.2, 0.78, 0.3), r: 0.31, thick: 0.07, frame: metal(0xc4c8ce, 0.15), lens: lensMat(0xffffff, 0.08) }),
  'mirror': () => glasses({ shape: roundRect(1.15, 0.85, 0.45), r: 0.33, thick: 0.06, frame: metal(0xe0e3e8, 0.12), lens: lensMat(0x7fb0ff, 0.85, true) }),
  'heart': () => glasses({ shape: heart, r: 0.33, thick: 0.14, frame: acetate(0xd1123f), lens: lensMat(0xff3d7f, 0.55) }),
  'star': () => glasses({ shape: star, r: 0.3, thick: 0.13, frame: acetate(0xf5b800), lens: lensMat(0xffb000, 0.5) }),
  'rose-round': () => glasses({ shape: circle, r: 0.39, thick: 0.06, frame: metal(0xe0a896, 0.15), lens: lensMat(0xff7aa0, 0.45) }),
  'visor': visor,
  'crown': crown, 'tiara': tiara, 'flower-crown': flowerCrown,
  'bunny': () => ears('bunny'), 'cat-ears': () => ears('cat'), 'fox-ears': () => ears('fox'),
  'bow': bow, 'cowboy': cowboy, 'beanie': beanie, 'santa': santa, 'grad-cap': gradCap,
  'party': party, 'halo': halo, 'devil': horns, 'star-band': starBand,
}
