import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// HTTPS + host so the booth can be opened from a phone on the same Wi-Fi
// (browsers only allow camera access on https or localhost).
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: true },
})
