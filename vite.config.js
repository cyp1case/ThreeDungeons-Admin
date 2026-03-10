import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set base to your repo name (e.g. /ThreeDungeons-Admin/)
// Staging builds use /ThreeDungeons-Admin/staging/ subpath
// Local dev uses / so the app works at localhost:5173
const isStaging = process.env.BUILD_TARGET === 'staging'
const base = process.env.NODE_ENV === 'production'
  ? (isStaging ? '/ThreeDungeons-Admin/staging/' : '/ThreeDungeons-Admin/')
  : '/'

export default defineConfig({
  base,
  build: {
    outDir: isStaging ? 'dist/staging' : 'dist',
  },
  plugins: [react()],
})
