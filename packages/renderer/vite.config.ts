import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

const externalPackages = [
  'vue',
  'vue-router',
  'lodash-es',
  'element-plus',
  '@element-plus/icons-vue',
  '@vue/shared',
  '@vueuse/core',
  '@vueuse/shared',
  '@vela/core',
  '@vela/materials',
  '@vela/ui',
]

const externalPathPrefixes = [
  resolve(__dirname, '../core').replace(/\\/g, '/'),
  resolve(__dirname, '../materials').replace(/\\/g, '/'),
  resolve(__dirname, '../ui').replace(/\\/g, '/'),
]

function isExternal(id: string): boolean {
  const normalizedId = id.replace(/\\/g, '/')

  if (
    externalPackages.some(
      (pkg) => normalizedId === pkg || normalizedId.startsWith(`${pkg}/`),
    )
  ) {
    return true
  }

  return externalPathPrefixes.some((prefix) => normalizedId.startsWith(prefix))
}

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    emptyOutDir: true,
    rollupOptions: {
      external: isExternal,
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    preserveSymlinks: true,
  },
})
