---
layout: home

hero:
  name: '@twi1i9ht/visual-lib'
  text: '数据可视化组件库'
  tagline: 图表 · KPI · 布局 · 地图 — 开箱即用的 Vue 3 组件
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 组件列表
      link: /components/chart/line-chart
    - theme: alt
      text: GitHub
      link: https://github.com/TWILIGHT-wyf/vela-lowcode-editor

features:
  - icon: 📊
    title: 丰富的图表
    details: 折线图、柱状图、饼图、雷达图、仪表盘、桑基图等 10+ 图表组件，基于 ECharts 封装
  - icon: 📈
    title: KPI 指标
    details: 统计卡片、数字滚动、进度条等组件，适用于数据大屏展示
  - icon: 🗺️
    title: 地图组件
    details: 基于 Leaflet 的地图组件，支持瓦片、标记、热力图、聚合、GeoJSON 等图层
  - icon: 🧩
    title: 布局系统
    details: Flex、Grid、Row/Col 等布局组件，快速搭建页面结构
  - icon: 🎛️
    title: 控件组件
    details: 选择器、日期范围、搜索框、滑块等交互控件
  - icon: 🎨
    title: TypeScript
    details: 完整的 TypeScript 类型定义，提供良好的开发体验
---

## 📦 安装

```bash
# npm
npm install @twi1i9ht/visual-lib

# pnpm
pnpm add @twi1i9ht/visual-lib
```

## 🚀 快速使用

```vue
<script setup>
import { lineChart } from '@twi1i9ht/visual-lib'
</script>

<template>
  <lineChart
    :data="[150, 230, 224, 218, 135, 147, 260]"
    :x-axis-data="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
    title="周访问量"
    line-color="#5470c6"
    smooth
  />
</template>
```
