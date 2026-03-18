import type { App, Component } from 'vue'
// @vela/ui/index.ts

/**
 * 使用 Vite 的 import.meta.glob 动态导入所有组件
 * 这样新增组件只需在对应目录创建 .vue 文件，无需手动注册
 */
const componentModules = import.meta.glob<{ default: Component }>('./src/components/**/*.vue', {
  eager: true,
})

/**
 * 从文件路径提取组件名称
 * 例如：'./src/components/chart/lineChart/lineChart.vue' -> 'lineChart'
 *       './src/components/kpi/text/Text.vue' -> 'vText'
 */
function extractComponentName(path: string): string {
  const match = path.match(/\/([^/]+)\.vue$/)
  if (!match || !match[1]) return ''

  const fileName = match[1]

  // 对于非图表组件，如果文件名首字母是大写，添加 'v' 前缀
  // 图表组件保持原名（如 lineChart, barChart）
  if (path.includes('/chart/')) {
    return fileName
  }

  // 其他组件：如果首字母大写，加 'v' 前缀
  const firstChar = fileName.charAt(0)
  if (firstChar && firstChar === firstChar.toUpperCase()) {
    return `v${fileName}`
  }

  return fileName
}

// 动态构建组件注册表
const componentRegistry: Record<string, Component> = {}

for (const path in componentModules) {
  const mod = componentModules[path]
  const componentName = extractComponentName(path)
  if (componentName && mod?.default) {
    componentRegistry[componentName] = mod.default
  }
}

// 图表组件
export const lineChart = componentRegistry.lineChart
export const barChart = componentRegistry.barChart
export const pieChart = componentRegistry.pieChart
export const doughnutChart = componentRegistry.doughnutChart
export const radarChart = componentRegistry.radarChart
export const gaugeChart = componentRegistry.gaugeChart
export const funnelChart = componentRegistry.funnelChart
export const scatterChart = componentRegistry.scatterChart
export const sankeyChart = componentRegistry.sankeyChart
export const stackedBarChart = componentRegistry.stackedBarChart

// KPI 组件
export const vText = componentRegistry.vText
export const vBox = componentRegistry.vBox
export const vStat = componentRegistry.vStat
export const vProgress = componentRegistry.vProgress
export const vCountUp = componentRegistry.vCountUp

// 基础组件
export const vContainer = componentRegistry.vContainer
export const vButton = componentRegistry.vButton

// 布局组件
export const vBadge = componentRegistry.vBadge
export const vPanel = componentRegistry.vPanel
export const vFlex = componentRegistry.vFlex
export const vGrid = componentRegistry.vGrid
export const vTabs = componentRegistry.vTabs
export const vModal = componentRegistry.vModal
export const vRow = componentRegistry.vRow
export const vCol = componentRegistry.vCol

// 数据组件
export const vTable = componentRegistry.vTable
export const vList = componentRegistry.vList

// 控件组件
export const vButtonGroup = componentRegistry.vButtonGroup
export const vCheckboxGroup = componentRegistry.vCheckboxGroup
export const vDateRange = componentRegistry.vDateRange
export const vMultiSelect = componentRegistry.vMultiSelect
export const vSearchBox = componentRegistry.vSearchBox
export const vSelect = componentRegistry.vSelect
export const vTextInput = componentRegistry.vTextInput
export const vTextareaInput = componentRegistry.vTextareaInput
export const vNumberInput = componentRegistry.vNumberInput
export const vRadioGroup = componentRegistry.vRadioGroup
export const vCheckbox = componentRegistry.vCheckbox
export const vDatePicker = componentRegistry.vDatePicker
export const vTimePicker = componentRegistry.vTimePicker
export const vUpload = componentRegistry.vUpload
export const vTreeSelect = componentRegistry.vTreeSelect
export const vCascader = componentRegistry.vCascader
export const vSlider = componentRegistry.vSlider
export const vSwitch = componentRegistry.vSwitch
export const vNavButton = componentRegistry.vNavButton
export const vBreadcrumb = componentRegistry.vBreadcrumb
export const vPagination = componentRegistry.vPagination

// 内容组件
export const vHtml = componentRegistry.vHtml
export const vIframe = componentRegistry.vIframe
export const vMarkdown = componentRegistry.vMarkdown

// 媒体组件
export const vImage = componentRegistry.vImage
export const vVideo = componentRegistry.vVideo

// Group 组件
export const vGroup = componentRegistry.vGroup

// 导出组件注册表，供外部使用
export { componentRegistry }

// 导出 Hooks
export * from './src/hooks/useDataSource'

// 导出 Composables
export * from './src/composables'

// 导出工具函数
export * from './src/utils/dataUtils'

// 导出类型
export type { TableColumn } from './src/types/component-props'

// 提供 Vue 插件式的安装方法
export default {
  install(app: App) {
    // 自动注册所有组件
    for (const [name, component] of Object.entries(componentRegistry)) {
      app.component(name, component)
    }
  },
}
