import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  onSuccess:
    "node -e \"const fs=require('fs');const p=require('path');fs.copyFileSync(p.resolve('src','style.css'),p.resolve('dist','style.css'))\"",
})
