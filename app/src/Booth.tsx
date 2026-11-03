import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutId, Theme } from './lib/themes'
import { LAYOUTS } from './lib/themes'
import { geometry, drawCover } from './lib/frame'
import { Pipeline, DEFAULT_SETTINGS, type Settings } from './lib/pipeline'
import { BACKGROUNDS, getBackground } from './lib/backgrounds'
import { ACCESSORIES, type AccSlot } from './lib/accessories'
import { GRADES } from './lib/grades'
import { getFaceLandmarker, getSegmenter } from './lib/vision'

type Tab = 'bg' | 'acc' | 'beauty' | 'warna' | 'atur'
const LIPS = ['#d62839', '#ff4d6d', '#c9184a', '#ff8fab', '#b5651d', '#9d0208', '#e5989b']

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function Booth({ theme, layout, onBack, onDone }: {
  theme: Theme; layout: LayoutId; onBack: () => void; onDone: (s: HTMLCanvasElement[]) => void
}) {
  const n = LAYOUTS.find(l => l.id === layout)!.shots
  const aspect = geometry(layout).aspect
  const outW = aspect >= 1 ? 1200 : Math.round(1200 * aspect)
  const outH = Math.round(outW / aspect)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pipe = useMemo(() => new Pipeline(), [])
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, bg: theme.bg })
  const sRef = useRef(settings); sRef.current = settings
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [camErr, setCamErr] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('bg')
  const [timer, setTimer] = useState(3)
  const [count, setCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [shots, setShots] = useState<(HTMLCanvasElement | null)[]>(() => Array(n).fill(null))
  const upload = useRef<HTMLImageElement | null>(null)
  const set = (p: Partial<Settings>) => setSettings(s => ({ ...s, ...p }))

  // camera
  useEffect(() => {
    let stream: MediaStream | null = null
    let alive = true
    setCamErr(null)
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(s => {
        if (!alive) { s.getTracks().forEach(t => t.stop()); return }
        stream = s
        const v = videoRef.current!
        v.srcObject = s
        v.play().catch(() => {})
      })
      .catch(e => setCamErr(e?.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di browser, atau unggah foto dari galeri.' : 'Kamera tidak tersedia. Kamu masih bisa unggah foto dari galeri.'))
    if (!navigator.mediaDevices) setCamErr('Browser ini tidak mendukung kamera (butuh HTTPS). Kamu masih bisa unggah foto.')
    set({ mirror: facing === 'user' })
    return () => { alive = false; stream?.getTracks().forEach(t => t.stop()) }
  }, [facing])

  // lazy-load models only when a feature needs them
  const needSeg = settings.bg !== 'none'
  const needFace = settings.smooth > 0 || !!settings.lip || Object.values(settings.acc).some(Boolean)
  useEffect(() => {
    if (needSeg && !pipe.seg) { setLoading('Menyiapkan background virtual…'); getSegmenter().then(s => { pipe.seg = s; setLoading(null) }) }
  }, [needSeg, pipe])
  useEffect(() => {
    if (needFace && !pipe.face) { setLoading('Menyiapkan deteksi wajah…'); getFaceLandmarker().then(f => { pipe.face = f; setLoading(null) }) }
  }, [needFace, pipe])

  // render loop
  useEffect(() => {
    let raf = 0
    const cv = canvasRef.current!
    cv.width = outW; cv.height = outH
    const ctx = cv.getContext('2d')!
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const v = videoRef.current
      const src: CanvasImageSource | null = upload.current ?? (v && v.readyState >= 2 ? v : null)
      if (!src) return
      const sw = src instanceof HTMLVideoElement ? src.videoWidth : (src as HTMLImageElement).naturalWidth
      const sh = src instanceof HTMLVideoElement ? src.videoHeight : (src as HTMLImageElement).naturalHeight
      const s = upload.current ? { ...sRef.current, mirror: false } : sRef.current
      const out = pipe.process(src, sw, sh, s, 1280)
      drawCover(ctx, out, out.width, out.height, { x: 0, y: 0, w: outW, h: outH })
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [pipe, outW, outH])

  const snap = useCallback(() => {
    const c = document.createElement('canvas')
    c.width = outW; c.height = outH
    c.getContext('2d')!.drawImage(canvasRef.current!, 0, 0)
    setFlash(true); setTimeout(() => setFlash(false), 250)
    return c
  }, [outW, outH])

  const shootAt = async (i: number) => {
    for (let t = timer; t > 0; t--) { setCount(t); await wait(1000) }
    setCount(0)
    const c = snap()
    setShots(prev => { const p = [...prev]; p[i] = c; return p })
    await wait(700)
  }

  const runAll = async () => {
    if (busy) return
    setBusy(true)
    const fresh: (HTMLCanvasElement | null)[] = Array(n).fill(null)
    setShots(fresh)
    for (let i = 0; i < n; i++) await shootAt(i)
    setBusy(false)
  }

  const retake = async (i: number) => {
    if (busy) return
    setBusy(true); await shootAt(i); setBusy(false)
  }

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const next = [...shots]
    let slot = next.findIndex(s => !s); if (slot < 0) slot = 0
    for (const f of Array.from(files)) {
      if (slot >= n) break
      const img = new Image()
      img.src = URL.createObjectURL(f)
      await img.decode()
      upload.current = img
      await wait(250) // let a few frames render through the pipeline
      next[slot++] = snap()
      URL.revokeObjectURL(img.src)
    }
    upload.current = null
    setShots(next)
    setBusy(false)
  }

  const bgThumbs = useMemo(() => BACKGROUNDS.map(b => ({ ...b, url: getBackground(b.id, 160, 120)!.toDataURL('image/jpeg', 0.8) })), [])
  const done = shots.every(Boolean)
  const nextEmpty = shots.findIndex(s => !s)

  return (
    <div className="booth">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Frame</button>
        <b>{theme.name}</b>
        <button className="ghost" onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}>🔄 Kamera</button>
      </div>

      <div className="stage-wrap">
        <div className="stage" style={{ aspectRatio: `${outW} / ${outH}`, width: `min(100%, 760px, calc(var(--stage-h) * ${outW / outH}))` }}>
          <video ref={videoRef} playsInline muted className="hidden-video" />
          <canvas ref={canvasRef} />
          {count > 0 && <div className="count" key={count}>{count}</div>}
          {flash && <div className="flash" />}
          {loading && <div className="loading">{loading}</div>}
          {camErr && <div className="err">{camErr}</div>}
          {busy && nextEmpty >= 0 && <div className="badge">Foto {nextEmpty + 1} / {n}</div>}
        </div>

        <div className="shots">
          {shots.map((s, i) => (
            <button key={i} className="shot" onClick={() => s && retake(i)} title={s ? 'Ketuk untuk ulang foto ini' : ''} style={{ aspectRatio: `${outW} / ${outH}` }}>
              {s ? <img src={s.toDataURL('image/jpeg', 0.6)} alt="" /> : <span>{i + 1}</span>}
              {s && <em>↻</em>}
            </button>
          ))}
        </div>

        <div className="actions">
          <label className="ghost file">🖼️ Unggah<input type="file" accept="image/*" multiple onChange={e => onUpload(e.target.files)} /></label>
          {nextEmpty >= 0 && shots.some(Boolean)
            ? <button className="shutter" disabled={busy} onClick={() => retake(nextEmpty)} aria-label="Foto berikutnya" />
            : <button className="shutter" disabled={busy} onClick={runAll} aria-label="Mulai foto" />}
          <button className="primary" disabled={!done || busy} onClick={() => onDone(shots as HTMLCanvasElement[])}>Lanjut →</button>
        </div>
        <p className="hint">{busy ? 'Senyum! 😁' : shots.some(Boolean) ? 'Ketuk foto kecil untuk mengulang satu foto.' : `Tekan tombol bulat: ${n} foto otomatis dengan timer ${timer} detik.`}</p>
      </div>

      <div className="panel">
        <nav className="tabs">
          {([['bg', '🌄 Background'], ['acc', '🕶️ Aksesori'], ['beauty', '✨ Beauty'], ['warna', '🎨 Warna'], ['atur', '⏱️ Timer']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </nav>

        <div className="tab-body">
          {tab === 'bg' && (
            <div className="swatches">
              <button className={`sw ${settings.bg === 'none' ? 'on' : ''}`} onClick={() => set({ bg: 'none' })}><div className="sw-img plain">Asli</div><span>Tanpa</span></button>
              <button className={`sw ${settings.bg === 'blur' ? 'on' : ''}`} onClick={() => set({ bg: 'blur' })}><div className="sw-img plain blurish">Blur</div><span>Blur</span></button>
              {bgThumbs.map(b => (
                <button key={b.id} className={`sw ${settings.bg === b.id ? 'on' : ''} ${b.id === theme.bg ? 'rec' : ''}`} onClick={() => set({ bg: b.id })}>
                  <img className="sw-img" src={b.url} alt="" /><span>{b.name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'acc' && (['mata', 'kepala', 'wajah'] as AccSlot[]).map(slot => (
            <div key={slot} className="acc-row">
              <h4>{slot === 'mata' ? 'Kacamata' : slot === 'kepala' ? 'Kepala' : 'Wajah'}</h4>
              <div className="emojis">
                <button className={!settings.acc[slot] ? 'on' : ''} onClick={() => set({ acc: { ...settings.acc, [slot]: undefined } })}>🚫</button>
                {ACCESSORIES.filter(a => a.slot === slot).map(a => (
                  <button key={a.id} title={a.name} className={settings.acc[slot] === a.id ? 'on' : ''} onClick={() => set({ acc: { ...settings.acc, [slot]: a.id } })}>
                    {a.emoji}<small>{a.name}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {tab === 'beauty' && (
            <div className="sliders">
              <label>Haluskan kulit <input type="range" min={0} max={1} step={0.05} value={settings.smooth} onChange={e => set({ smooth: +e.target.value })} /></label>
              <label>Cerahkan <input type="range" min={0} max={1} step={0.05} value={settings.bright} onChange={e => set({ bright: +e.target.value })} /></label>
              <h4>Warna bibir</h4>
              <div className="dots">
                <button className={!settings.lip ? 'on' : ''} onClick={() => set({ lip: null })}>🚫</button>
                {LIPS.map(c => <button key={c} className={settings.lip === c ? 'on' : ''} style={{ background: c }} onClick={() => set({ lip: c })} />)}
              </div>
              <button className="ghost" onClick={() => set({ smooth: 0, bright: 0, lip: null })}>Reset beauty</button>
            </div>
          )}

          {tab === 'warna' && (
            <>
              <div className="grades">
                {GRADES.map(g => (
                  <button key={g.id} className={settings.grade === g.id ? 'on' : ''} onClick={() => set({ grade: g.id })}>
                    <i style={{ background: g.swatch }} />{g.name}
                  </button>
                ))}
              </div>
              <div className="sliders">
                <label>Intensitas <input type="range" min={0} max={1} step={0.05} value={settings.gradeStrength} onChange={e => set({ gradeStrength: +e.target.value })} /></label>
              </div>
            </>
          )}

          {tab === 'atur' && (
            <div className="sliders">
              <h4>Timer per foto</h4>
              <div className="dots">
                {[0, 3, 5, 10].map(t => <button key={t} className={`txt ${timer === t ? 'on' : ''}`} onClick={() => setTimer(t)}>{t ? `${t}s` : 'Off'}</button>)}
              </div>
              <label className="row"><input type="checkbox" checked={settings.mirror} onChange={e => set({ mirror: e.target.checked })} /> Mirror (cermin)</label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
