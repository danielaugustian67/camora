# camora — photobooth mandiri

Jalan di browser HP & laptop. Semua proses (background virtual, deteksi wajah, beauty, filter) berjalan di perangkat; foto tidak dikirim ke server.

```bash
npm install
npm run dev      # buka https://localhost:5173 (laptop) atau https://<IP-laptop>:5173 (HP, satu Wi-Fi)
npm run build    # hasil statis di dist/
```

Kamera hanya diizinkan browser di HTTPS/localhost. Dev server memakai sertifikat self-signed, jadi di HP pilih "lanjutkan / tetap buka".

## Struktur
- `src/lib/themes.ts` — daftar tema frame (tambah tema = tambah satu baris)
- `src/lib/frame.ts` — layout (strip 2/3/4, grid 2×2/2×3, polaroid) & render frame
- `src/lib/decor.ts` — stiker prosedural (bintang, hati, bibir, lily, kupu-kupu, pita, …)
- `src/lib/backgrounds.ts` — background virtual
- `src/lib/accessories.ts` — kacamata, topi, stiker wajah (mengikuti landmark wajah)
- `src/lib/grades.ts` — color grading
- `src/lib/pipeline.ts` — kamera → beauty → ganti background → grade → aksesori
- `public/mediapipe`, `public/models` — runtime & model MediaPipe (offline)
