import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      include: ['index.ts', 'src/**/*'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'VelaUI',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs'
        if (format === 'cjs') return 'index.js'
        return 'index.umd.js'
      },
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        /^element-plus\/es\/.*$/,
        /^echarts(\/.*)?$/,
        'vue-echarts',
        'marked',
        'dompurify',
        'highlight.js',
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          echarts: 'echarts',
          'echarts/core': 'echarts',
          'echarts/charts': 'echarts',
          'echarts/components': 'echarts',
          'echarts/renderers': 'echarts',
          'vue-echarts': 'VueECharts',
          marked: 'marked',
          dompurify: 'DOMPurify',
          'highlight.js': 'hljs',
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
})
