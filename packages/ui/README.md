# @vela/ui

Vela LowCode UI Component Library - 数据可视化组件库 for Vue 3

基于 Vue 3 + TypeScript + ECharts 的数据可视化大屏组件库，提供开箱即用的图表、KPI、布局等常用组件。

## ✨ 特性

- 🎨 **精选常用组件** - 图表、KPI、布局、表单控件等开箱即用
- 📊 **ECharts 集成** - 深度封装 ECharts，支持所有图表类型
- 🎯 **TypeScript** - 完整的类型定义
- 🌳 **Tree-shaking** - 按需引入，减小打包体积
- 🔧 **灵活配置** - 扁平化属性接口，易于低代码平台集成

## 📦 安装

```bash
npm install @vela/ui
# 或
pnpm add @vela/ui
# 或
yarn add @vela/ui
```

## 🔧 使用

### 完整引入

```typescript
import { createApp } from 'vue'
import VelaUI from '@vela/ui'
import '@vela/ui/dist/style.css'

const app = createApp(App)
app.use(VelaUI)
```

### 按需引入

```vue
<template>
  <lineChart :data="chartData" :x-axis="xAxis" />
  <vText text="Hello World" :font-size="24" />
</template>

<script setup>
import { lineChart, vText } from '@vela/ui'
import '@vela/ui/dist/style.css'

const chartData = [120, 200, 150, 80, 70, 110]
const xAxis = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
</script>
```

## 📚 组件分类

### 图表组件 (Chart)

- `lineChart` - 折线图
- `barChart` - 柱状图
- `pieChart` - 饼图
- `doughnutChart` - 环形图
- `radarChart` - 雷达图
- `gaugeChart` - 仪表盘
- `funnelChart` - 漏斗图
- `scatterChart` - 散点图
- `sankeyChart` - 桑基图
- `stackedBarChart` - 堆叠柱状图

### KPI 组件

- `vText` - 文本
- `vStat` - 统计卡片
- `vCountUp` - 数字滚动
- `vProgress` - 进度条
- `vBox` - 信息盒子

### 布局组件

- `vRow` / `vCol` - 栅格布局
- `vFlex` - Flex 布局
- `vGrid` - Grid 布局
- `vPanel` - 面板
- `vTabs` - 标签页
- `vModal` - 弹窗
- `vGroup` - 组件组合

### 数据展示

- `vTable` - 表格
- `vList` - 列表

### 表单控件

- `vSelect` - 下拉选择
- `vDateRange` - 日期范围
- `vSlider` - 滑块
- `vSwitch` - 开关
- `vSearchBox` - 搜索框
- `vButtonGroup` - 按钮组
- `vCheckboxGroup` - 复选框组
- `vPagination` - 分页
- `vBreadcrumb` - 面包屑
- `vNavButton` - 导航按钮

### 内容媒体

- `vImage` - 图片
- `vVideo` - 视频
- `vHtml` - HTML 内容
- `vMarkdown` - Markdown
- `vIframe` - 内嵌页面

## 🎯 低代码平台集成

本组件库专为低代码平台设计，所有组件支持 JSON Schema 配置：

```typescript
// 组件可以通过 JSON 配置驱动
const componentConfig = {
  componentName: 'lineChart',
  props: {
    data: [120, 200, 150],
    color: '#409EFF',
  },
  style: {
    width: 400,
    height: 300,
  },
}
```

## 📖 文档

完整文档请访问：[https://visual-lib-docs.vercel.app/](https://visual-lib-docs.vercel.app/)

## 🔗 相关项目

- [Vela LowCode Editor](https://github.com/TWILIGHT-wyf/vela-lowcode-editor) - 基于本组件库的低代码平台

## 📄 License

MIT
