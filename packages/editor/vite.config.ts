import { fileURLToPath, URL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const devPort = Number(process.env.VITE_PORT ?? 4173)

function readServerPortFromEnvFile(): string | null {
  try {
    const serverEnvPath = resolve(__dirname, '../../server/.env')
    if (!existsSync(serverEnvPath)) {
      return null
    }

    const content = readFileSync(serverEnvPath, 'utf-8')
    const lines = content.split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const [rawKey, ...rest] = trimmed.split('=')
      const key = rawKey?.trim()
      if (key !== 'PORT' && key !== 'PROXY_PORT') continue

      const value = rest
        .join('=')
        .trim()
        .replace(/^['\"]|['\"]$/g, '')
      if (value) return value
    }
  } catch {
    // Ignore parse errors and fallback to defaults/env vars
  }

  return null
}

const serverPort =
  process.env.VITE_API_PROXY_PORT ??
  process.env.PORT ??
  process.env.PROXY_PORT ??
  readServerPortFromEnvFile() ??
  '3001'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? `http://127.0.0.1:${serverPort}`

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
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
