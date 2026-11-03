import { useMemo } from 'react'
import { THEMES, type LayoutId } from './lib/themes'
import { renderFrame } from './lib/frame'

const pick = (id: string) => THEMES.find(t => t.id === id) ?? THEMES[0]

function Strip({ id, layout, className }: { id: string; layout: LayoutId; className: string }) {
  const url = useMemo(() => renderFrame(pick(id), layout, [], { placeholder: true, scale: 0.4 }).toDataURL('image/png'), [id, layout])
  return <img className={className} src={url} alt="" draggable={false} />
}

const FEATURES = [
  ['🖼️', `${THEMES.length}+ frame tema`, 'Cute, Y2K, floral, vintage, musiman sampai party, tinggal pilih yang sesuai mood.'],
  ['🌄', 'Background virtual', 'Ganti latar di belakangmu secara otomatis, tanpa green screen.'],
  ['🕶️', 'Aksesori 3D', 'Kacamata, mahkota, topi, telinga lucu yang ikut gerak kepala dan pas di wajahmu.'],
  ['💄', 'Beauty & makeup', 'Kulit halus natural, warna bibir, dan look makeup dari Natural sampai Glitter.'],
  ['🎞️', 'Color grading', 'Filter film, vintage, dan aesthetic untuk nuansa foto yang konsisten.'],
  ['📲', 'HP atau laptop', 'Langsung dari browser. Simpan PNG resolusi tinggi atau share ke teman.'],
]

const STEPS = [
  ['01', 'Pilih frame', 'Tentukan layout strip atau grid dan tema favoritmu.'],
  ['02', 'Gaya & pose', 'Pasang background, aksesori, dan makeup, lalu hitung mundur.'],
  ['03', 'Simpan & bagikan', 'Tambah caption, unduh, dan kirim ke teman.'],
]

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing">
      <nav className="l-nav">
        <b className="logo">Camora<span>.</span></b>
        <button className="primary sm" onClick={onStart}>Mulai Foto</button>
      </nav>

      <section className="l-hero">
        <div className="l-copy">
          <span className="l-badge">✨ Photobooth di browser</span>
          <h1>Once in <em>Frame</em>,<br />forever in memory.</h1>
          <p>Bikin photo strip ala photobooth langsung dari HP atau laptop. Pilih frame, pasang gaya, pose, dan cekrek!</p>
          <div className="l-cta">
            <button className="primary lg" onClick={onStart}>Mulai Foto 📸</button>
            <a className="ghost lg" href="#fitur">Lihat fitur</a>
          </div>
          <small>Gratis · tanpa daftar · foto tidak diunggah ke server</small>
        </div>
        <div className="l-art" aria-hidden>
          <Strip id={THEMES[0].id} layout="strip4" className="s1" />
          <Strip id={THEMES[Math.min(12, THEMES.length - 1)].id} layout="strip3" className="s2" />
          <Strip id={THEMES[Math.min(25, THEMES.length - 1)].id} layout="strip4" className="s3" />
        </div>
      </section>

      <div className="l-marquee" aria-hidden>
        <div>{[...THEMES, ...THEMES].map((t, i) => <span key={i}>{t.name} ✦</span>)}</div>
      </div>

      <section id="fitur" className="l-sec">
        <h2>Semua yang kamu butuh untuk foto seru</h2>
        <div className="l-grid">
          {FEATURES.map(([ic, t, d]) => (
            <div key={t} className="l-card"><i>{ic}</i><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="l-sec">
        <h2>Cuma 3 langkah</h2>
        <div className="l-steps">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="l-step"><b>{n}</b><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="l-final">
        <h2>Siap masuk frame?</h2>
        <button className="primary lg light" onClick={onStart}>Mulai Sekarang</button>
      </section>

      <footer className="l-foot">© {new Date().getFullYear()} Camora · Once in Frame</footer>
    </div>
  )
}
