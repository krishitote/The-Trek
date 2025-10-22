import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
  // 👇 This ensures client-side routing works on Netlify, Render, etc.
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // 👇 This line is key for SPA routing on Netlify
  base: '/',
})
