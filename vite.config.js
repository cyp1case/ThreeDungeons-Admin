import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set base to your repo name (e.g. /ThreeDungeons-Admin/)
// Local dev uses / so the app works at localhost:5173
const base = process.env.NODE_ENV === 'production' ? '/ThreeDungeons-Admin/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
