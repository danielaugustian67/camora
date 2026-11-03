import { useEffect, useMemo, useState } from 'react'
import { THEMES, type LayoutId, type Theme } from './lib/themes'
import { renderFrame } from './lib/frame'

export default function Result({ theme, layout, shots, onTheme, onRetake, onHome }: {
  theme: Theme; layout: LayoutId; shots: HTMLCanvasElement[]
  onTheme: (t: Theme) => void; onRetake: () => void; onHome: () => void
}) {
  const [caption, setCaption] = useState(theme.caption)
  const [showDate, setShowDate] = useState(true)
  useEffect(() => setCaption(theme.caption), [theme])

  const photos = useMemo(() => shots.map(s => ({ img: s, w: s.width, h: s.height })), [shots])
  const canvas = useMemo(() => renderFrame(theme, layout, photos, { caption, showDate, scale: 1.6 }), [theme, layout, photos, caption, showDate])
  const url = useMemo(() => canvas.toDataURL('image/png'), [canvas])
  const minis = useMemo(() => THEMES.map(t => ({ t, url: renderFrame(t, layout, photos, { scale: 0.12 }).toDataURL('image/jpeg', 0.7) })), [layout, photos])

  const fileName = `camora-${theme.id}-${Date.now()}.png`
  const download = () => {
    const a = document.createElement('a')
    a.href = url; a.download = fileName; a.click()
  }
  const share = async () => {
    const blob: Blob = await new Promise(r => canvas.toBlob(b => r(b!), 'image/png'))
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'camora' }).catch(() => {})
    else download()
  }

  return (
    <div className="result">
      <div className="topbar">
        <button className="ghost" onClick={onRetake}>← Foto ulang</button>
        <b>Hasil</b>
        <button className="ghost" onClick={onHome}>Beranda</button>
      </div>
      <div className="result-body">
        <img className="final" src={url} alt="hasil photobooth" />
        <div className="result-side">
          <label>Tulisan
            <input value={caption} maxLength={40} onChange={e => setCaption(e.target.value)} />
          </label>
          <label className="row"><input type="checkbox" checked={showDate} onChange={e => setShowDate(e.target.checked)} /> Tampilkan tanggal</label>
          <div className="btns">
            <button className="primary" onClick={download}>⬇️ Download PNG</button>
            <button className="ghost" onClick={share}>📤 Bagikan</button>
          </div>
          <h4>Ganti frame (tanpa foto ulang)</h4>
          <div className="minis">
            {minis.map(({ t, url }) => (
              <button key={t.id} className={t.id === theme.id ? 'on' : ''} onClick={() => onTheme(t)} title={t.name}>
                <img src={url} alt={t.name} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
