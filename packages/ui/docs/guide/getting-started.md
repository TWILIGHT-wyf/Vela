# 快速开始

`@twi1i9ht/visual-lib` 是一个基于 Vue 3 的数据可视化组件库，提供图表、KPI、布局等开箱即用的组件。

## 特性

- 🎨 **精选常用组件** — 图表、KPI、布局、控件等
- 📦 **开箱即用** — 无需复杂配置，导入即可使用
- 🔧 **高度可定制** — 丰富的 Props 配置项
- 📊 **ECharts 驱动** — 图表组件基于 ECharts，功能强大
- 💪 **TypeScript** — 完整的类型定义

## 环境要求

- Vue 3.3+
- Node.js 18+

## 安装

::: code-group

```bash [pnpm]
pnpm add @twi1i9ht/visual-lib
```

```bash [npm]
npm install @twi1i9ht/visual-lib
```

```bash [yarn]
yarn add @twi1i9ht/visual-lib
```

:::

## Peer Dependencies

组件库依赖以下库，请确保项目中已安装：

```bash
# 图表组件需要
pnpm add echarts vue-echarts

# 如项目自行使用地图能力（组件库不内置地图组件）
pnpm add leaflet
```

## 基础用法

### 按需导入（推荐）

```vue
<script setup>
import { lineChart, vText } from '@twi1i9ht/visual-lib'
</script>

<template>
  <lineChart :data="[10, 20, 30]" title="销售趋势" />
  <vText content="欢迎使用 Vela UI" :font-size="24" />
</template>
```

### 全局注册

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import VisualLib from '@twi1i9ht/visual-lib'

const app = createApp(App)
app.use(VisualLib)
app.mount('#app')
```

全局注册后可以直接在模板中使用组件名：

```vue
<template>
  <line-chart :data="[10, 20, 30]" />
  <v-text content="欢迎使用" />
</template>
```

## 引入样式

如果你的业务项目自行使用 Leaflet，需要引入 Leaflet 样式：

```ts
// main.ts
import 'leaflet/dist/leaflet.css'
```

## 下一步

- 查看 [安装指南](/guide/installation) 了解更多安装选项
- 浏览 [组件列表](/components/chart/line-chart) 开始使用
