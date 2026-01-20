import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
// vite.config.ts might not exist if it was moved to packages/editor or not at root
// Fallback: define basic config if import fails or just define minimal config here
// Assuming this is a monorepo root config.

export default defineConfig({
  resolve: {
    alias: {
      '@vela/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@vela/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
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
