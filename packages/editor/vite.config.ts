import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const devPort = Number(process.env.VITE_PORT ?? 4173)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@vela/editor': fileURLToPath(new URL('./src', import.meta.url)),
      '@vela/core': fileURLToPath(new URL('../core/src', import.meta.url)),
      '@vela/ui': fileURLToPath(new URL('../ui', import.meta.url)),
      '@vela/materials': fileURLToPath(new URL('../materials/src', import.meta.url)),
      '@vela/renderer': fileURLToPath(new URL('../renderer/src', import.meta.url)),
      '@vela/generator': fileURLToPath(new URL('../generator/src', import.meta.url)),
    },
  },
  define: {
    // Babel 需要 process.env 在浏览器环境中可用
    'process.env': {},
  },
  server: {
    port: Number.isNaN(devPort) ? 4173 : devPort,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
