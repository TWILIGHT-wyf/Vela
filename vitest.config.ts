import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vela/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@vela/ui': path.resolve(__dirname, 'packages/ui/index.ts'),
      '@vela/renderer': path.resolve(__dirname, 'packages/renderer/src/index.ts'),
      // Add other workspace aliases as needed
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/components/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'packages/**/tests/**/*.spec.ts', // Support package-local tests
    ],
    exclude: [...configDefaults.exclude, 'tests/e2e/**', 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    server: {
      deps: {
        inline: ['element-plus'],
      },
    },
  },
})
