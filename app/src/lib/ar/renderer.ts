import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { MODEL_BUILDERS, type Model } from './models'

const TRI: number[] = (() => {
  const e = FaceLandmarker.FACE_LANDMARKS_TESSELATION
  const out: number[] = []
  for (let i = 0; i + 2 < e.length; i += 3) out.push(e[i].start, e[i + 1].start, e[i + 2].start)
  return out
})()

interface Slot { face: THREE.Group; head: THREE.Group; eye: THREE.Group; occ: THREE.Mesh; skull: THREE.Mesh; models: Map<string, Model> }

/** Renders 3D accessories anchored on each face, occluded by the face mesh + a head ellipsoid. */
export class AccessoryRenderer {
  canvas: HTMLCanvasElement
  private r: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10000, 10000)
  private slots: Slot[] = []
  private occMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide })
  private key: THREE.DirectionalLight

  static create(): AccessoryRenderer | null {
    try { return new AccessoryRenderer() } catch (e) { console.warn('3D accessories unavailable', e); return null }
  }

  private constructor() {
    this.r = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true })
    this.canvas = this.r.domElement
    this.r.setClearColor(0x000000, 0)
    this.r.outputColorSpace = THREE.SRGBColorSpace
    this.r.toneMapping = THREE.ACESFilmicToneMapping
    this.r.toneMappingExposure = 1.0
    const pm = new THREE.PMREMGenerator(this.r)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x554433, 0.6))
    this.key = new THREE.DirectionalLight(0xffffff, 1.6)
    this.key.position.set(0.3, 1, 1)
    this.scene.add(this.key)
  }

  private slot(i: number): Slot {
    if (this.slots[i]) return this.slots[i]
    const face = new THREE.Group()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(478 * 3), 3))
    geo.setIndex(TRI)
    const occ = new THREE.Mesh(geo, this.occMat)
    occ.renderOrder = -1; occ.frustumCulled = false
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), this.occMat)
    skull.renderOrder = -1
    const head = new THREE.Group(), eye = new THREE.Group()
    head.add(skull)
    face.add(head, eye)
    this.scene.add(face, occ)
    return (this.slots[i] = { face, head, eye, occ, skull, models: new Map() })
  }

  render(faces: NormalizedLandmark[][], ids: string[], w: number, h: number) {
    if (this.canvas.width !== w || this.canvas.height !== h) this.r.setSize(w, h, false)
    this.cam.left = -w / 2; this.cam.right = w / 2; this.cam.top = h / 2; this.cam.bottom = -h / 2
    this.cam.updateProjectionMatrix()
    const P = (p: NormalizedLandmark) => new THREE.Vector3(p.x * w - w / 2, h / 2 - p.y * h, -p.z * w)

    this.slots.forEach((s, i) => { const on = i < faces.length; s.face.visible = on; s.occ.visible = on })
    faces.forEach((lm, i) => {
      const s = this.slot(i)
      // occluder mesh, pushed slightly back so frames sitting on the nose aren't clipped
      const arr = s.occ.geometry.attributes.position as THREE.BufferAttribute
      for (let k = 0; k < 478 && k < lm.length; k++) { const v = P(lm[k]); arr.setXYZ(k, v.x, v.y, v.z - 4) }
      arr.needsUpdate = true
      s.occ.geometry.computeBoundingSphere()

      // face basis
      const eL = P(lm[468]), eR = P(lm[473])
      const origin = eL.clone().add(eR).multiplyScalar(0.5)
      const X = eR.clone().sub(eL)
      const ipd = X.length()
      X.normalize()
      const Y = P(lm[10]).sub(P(lm[152]))
      Y.sub(X.clone().multiplyScalar(Y.dot(X))).normalize()
      const Z = new THREE.Vector3().crossVectors(X, Y).normalize()
      if (Z.z < 0) { Z.negate(); X.negate() } // keep right-handed and facing the camera
      const basis = new THREE.Matrix4().makeBasis(X, Y, Z)
      const q = new THREE.Quaternion().setFromRotationMatrix(basis)

      const headW = P(lm[234]).distanceTo(P(lm[454]))
      s.eye.position.copy(origin); s.eye.quaternion.copy(q); s.eye.scale.setScalar(ipd)
      // head centre: above forehead top, pushed back into the skull
      const top = P(lm[10])
      const hc = top.clone().add(Z.clone().multiplyScalar(-headW * 0.42)).add(Y.clone().multiplyScalar(-headW * 0.1))
      s.head.position.copy(hc); s.head.quaternion.copy(q); s.head.scale.setScalar(headW * 1.1)
      s.skull.scale.set(0.84, 1.0, 0.96)
      s.skull.position.set(0, -0.3, 0)

      // models
      const want = new Set(ids)
      for (const [id, m] of s.models) if (!want.has(id)) { m.object.parent?.remove(m.object) ; s.models.delete(id) }
      for (const id of ids) {
        let m = s.models.get(id)
        if (!m) {
          const b = MODEL_BUILDERS[id]; if (!b) continue
          m = b(); s.models.set(id, m)
          ;(m.space === 'eye' ? s.eye : s.head).add(m.object)
        }
        if (m.update) {
          const inv = new THREE.Matrix4().compose(s.eye.position, s.eye.quaternion, s.eye.scale).invert()
          const a = P(lm[234]).applyMatrix4(inv), b = P(lm[454]).applyMatrix4(inv)
          m.update(a.x < b.x ? { earL: a, earR: b } : { earL: b, earR: a })
        }
      }
    })
    this.r.render(this.scene, this.cam)
    return this.canvas
  }
}

export const has3D = (id: string) => id in MODEL_BUILDERS
