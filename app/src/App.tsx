import { useEffect, useMemo, useState } from 'react'
import { THEMES, LAYOUTS, CATEGORIES, type Theme, type LayoutId } from './lib/themes'
import { renderFrame } from './lib/frame'
import Booth from './Booth'
import Result from './Result'
import Landing from './Landing'

type Step = 'landing' | 'pick' | 'booth' | 'result'

function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const fams = ['Pacifico', 'Fredoka', 'Playfair Display', 'Caveat', 'Press Start 2P', 'Bebas Neue', 'Dancing Script', 'Lobster']
    Promise.all(fams.map(f => document.fonts.load(`40px "${f}"`).catch(() => null)))
      .then(() => setReady(true))
    const t = setTimeout(() => setReady(true), 2500)
    return () => clearTimeout(t)
  }, [])
  return ready
}

function Thumb({ theme, layout, active, onClick }: { theme: Theme; layout: LayoutId; active: boolean; onClick: () => void }) {
  const url = useMemo(() => renderFrame(theme, layout, [], { placeholder: true, scale: 0.25 }).toDataURL('image/png'), [theme, layout])
  return (
    <button className={`thumb ${active ? 'active' : ''}`} onClick={onClick} title={theme.name}>
      <img src={url} alt={theme.name} loading="lazy" />
      <span>{theme.name}</span>
    </button>
  )
}

export default function App() {
  const fonts = useFontsReady()
  const [step, setStep] = useState<Step>('landing')
  const [cat, setCat] = useState<string>('Semua')
  const [layout, setLayout] = useState<LayoutId>('strip3')
  const [theme, setTheme] = useState<Theme>(THEMES[0])
  const [shots, setShots] = useState<HTMLCanvasElement[]>([])

  const list = cat === 'Semua' ? THEMES : THEMES.filter(t => t.cat === cat)

  if (step === 'landing') return <Landing onStart={() => { setStep('pick'); scrollTo(0, 0) }} />
  if (step === 'booth')
    return <Booth theme={theme} layout={layout} onBack={() => setStep('pick')} onDone={s => { setShots(s); setStep('result') }} />
  if (step === 'result')
    return <Result theme={theme} layout={layout} shots={shots} onTheme={setTheme} onRetake={() => setStep('booth')} onHome={() => setStep('pick')} />

  return (
    <div className="pick">
      <header className="hero">
        <h1 onClick={() => setStep('landing')} style={{ cursor: 'pointer' }}>Camora<span> - Once in Frame</span></h1>
      </header>

      <section className="layouts">
        {LAYOUTS.map(l => (
          <button key={l.id} className={`chip ${layout === l.id ? 'on' : ''}`} onClick={() => setLayout(l.id)}>
            {l.name} <small>{l.shots} foto</small>
          </button>
        ))}
      </section>

      <section className="cats">
        {['Semua', ...CATEGORIES].map(c => (
          <button key={c} className={`chip small ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </section>

      {fonts ? (
        <section className="grid">
          {list.map(t => <Thumb key={t.id + layout} theme={t} layout={layout} active={t.id === theme.id} onClick={() => setTheme(t)} />)}
        </section>
      ) : <p className="muted center">Memuat frame…</p>}

      <div className="cta">
        <span>{theme.name} · {LAYOUTS.find(l => l.id === layout)!.name}</span>
        <button className="primary" onClick={() => setStep('booth')}>Mulai Foto 📸</button>
      </div>
    </div>
  )
}
