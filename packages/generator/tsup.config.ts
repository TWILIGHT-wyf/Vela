import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/projectGenerator.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@vela/core'],
  splitting: false,
  treeshake: true,
})
