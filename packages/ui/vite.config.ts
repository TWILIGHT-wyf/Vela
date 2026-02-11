import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    // 自动生成 .d.ts 类型文件，这样主项目引用时才有代码提示
    dts(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      // 入口文件
      entry: resolve(__dirname, 'index.ts'),
      name: 'one-visual-lib',
      fileName: 'visual-lib',
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      // 使用正则表达式匹配 echarts 的所有子模块
      external: [
        'vue',
        '@vela/core',
        /^@vela\/core(\/.*)?$/,
        /^echarts(\/.*)?$/, // echarts 及其所有子模块
        'vue-echarts',
        /^leaflet(\/.*)?$/, // leaflet 及其所有子模块
        'leaflet.heat',
        'leaflet.markercluster',
      ],
      output: {
        // 使用命名导出，避免 default export 警告
        exports: 'named',
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          echarts: 'echarts',
          'echarts/core': 'echarts',
          'echarts/charts': 'echarts',
          'echarts/components': 'echarts',
          'echarts/renderers': 'echarts',
          'echarts/features': 'echarts',
          'vue-echarts': 'VueECharts',
          leaflet: 'L',
          'leaflet/dist/leaflet.css': '',
        },
      },
    },
  },
})
