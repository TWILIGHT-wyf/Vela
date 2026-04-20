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
const srcDir = fileURLToPath(new URL('./src', import.meta.url))

function resolvePackageEntry(relativePath: string): string {
  return fileURLToPath(new URL(relativePath, import.meta.url))
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@vela\/core\/types$/,
        replacement: resolvePackageEntry('../core/src/types/index.ts'),
      },
      {
        find: /^@vela\/core\/contracts$/,
        replacement: resolvePackageEntry('../core/src/contracts/index.ts'),
      },
      {
        find: /^@vela\/core\/runtime$/,
        replacement: resolvePackageEntry('../core/src/runtime/operation.ts'),
      },
      {
        find: /^@vela\/core\/validation$/,
        replacement: resolvePackageEntry('../core/src/validation/index.ts'),
      },
      {
        find: /^@vela\/core\/utils$/,
        replacement: resolvePackageEntry('../core/src/utils/index.ts'),
      },
      {
        find: /^@vela\/core\/constants$/,
        replacement: resolvePackageEntry('../core/src/constants/index.ts'),
      },
      { find: /^@vela\/core$/, replacement: resolvePackageEntry('../core/src/index.ts') },
      { find: /^@vela\/ui$/, replacement: resolvePackageEntry('../ui/index.ts') },
      { find: /^@vela\/ui-react$/, replacement: resolvePackageEntry('../ui-react/src/index.ts') },
      { find: /^@vela\/materials$/, replacement: resolvePackageEntry('../materials/src/index.ts') },
      { find: /^@vela\/renderer$/, replacement: resolvePackageEntry('../renderer/src/index.ts') },
      { find: /^@vela\/generator$/, replacement: resolvePackageEntry('../generator/src/index.ts') },
      { find: /^@\/(.*)$/, replacement: `${srcDir}/$1` },
    ],
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
