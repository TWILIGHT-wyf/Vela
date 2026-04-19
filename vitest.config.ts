import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vela/core/types': path.resolve(__dirname, 'packages/core/src/types/index.ts'),
      '@vela/core/runtime': path.resolve(__dirname, 'packages/core/src/runtime/operation.ts'),
      '@vela/core/validation': path.resolve(__dirname, 'packages/core/src/validation/index.ts'),
      '@vela/core/contracts': path.resolve(__dirname, 'packages/core/src/contracts/index.ts'),
      '@vela/core/utils': path.resolve(__dirname, 'packages/core/src/utils/index.ts'),
      '@vela/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@vela/ui': path.resolve(__dirname, 'packages/ui/index.ts'),
      '@vela/ui-react': path.resolve(__dirname, 'packages/ui-react/src/index.ts'),
      '@vela/renderer': path.resolve(__dirname, 'packages/renderer/src/index.ts'),
      '@vela/generator': path.resolve(__dirname, 'packages/generator/src/index.ts'),
      '@vela/materials': path.resolve(__dirname, 'packages/materials/src/index.ts'),
      '@': path.resolve(__dirname, 'packages/editor/src'),
    },
  },
  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'jsdom',
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/components/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'packages/**/tests/**/*.{test,spec}.ts',
    ],
    exclude: [...configDefaults.exclude, 'tests/e2e/**', 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    server: {
      deps: {
        inline: ['element-plus'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/tests/**',
        '**/*.config.{js,ts}',
        '**/index.ts', // Usually just re-exports
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
