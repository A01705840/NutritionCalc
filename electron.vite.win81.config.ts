import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Versión para Windows 7/8/8.1: se empaqueta con Electron 22 (Node 16, Chrome 108),
// la última que corre en esos sistemas. Mismo código, compilado para esas versiones.
export default defineConfig({
  main: { build: { target: 'node16' } },
  preload: { build: { target: 'node16' } },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [react()],
    build: { target: 'chrome108' }
  }
})
