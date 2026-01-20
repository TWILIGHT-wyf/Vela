/// <reference types="vite/client" />
import { defineAsyncComponent, type Component } from 'vue'
import type { MaterialMeta } from '@vela/core/types'
import { componentRegistry as uiComponentRegistry } from '@vela/ui'

/**
 * 使用 Vite 的 import.meta.glob 自动导入所有组件实现 (.vue)
 */
const vueModules = import.meta.glob<{ default: Component }>([
  './*/**/*.vue', // 匹配所有子目录下的 .vue 文件
  '!./**/components/**', // 排除嵌套的 components 目录
])

/**
 * 使用 Vite 的 import.meta.glob 自动导入所有组件元数据 (index.ts)
 */
const metaModules = import.meta.glob<{ default: MaterialMeta }>(['./**/index.ts'], {
  eager: true,
})

/**
 * 从文件路径提取组件名称
 * 例如：'./chart/lineChart/lineChart.vue' -> 'LineChart'
 *       './kpi/text/Text.vue' -> 'Text'
 */
function extractComponentName(path: string): string {
  const match = path.match(/\/([^/]+)\.vue$/)
  if (!match) return ''
  const name = match[1]
  // 首字母大写
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * 从元数据路径提取组件名称
 * 例如：'./chart/lineChart/index.ts' -> 'LineChart'
 */
function extractMetaComponentName(path: string): string {
  const match = path.match(/\/([^/]+)\/index\.ts$/)
  if (!match) return ''
  const name = match[1]
  // 首字母大写
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * 组件实现注册表 - componentMap
 * 使用 defineAsyncComponent 实现异步加载
 */
export const componentMap: Record<string, Component> = {}

// 自动注册所有 Vue 组件（异步加载）
for (const path in vueModules) {
  const componentName = extractComponentName(path)
  if (componentName) {
    componentMap[componentName] = defineAsyncComponent(
      vueModules[path] as () => Promise<{ default: Component }>,
    )
  }
}

// Debug: 打印所有注册的组件
console.log('[Registry] Registered components:', Object.keys(componentMap).sort())

/**
 * 组件元数据列表 - materialList
 * 从所有 index.ts 中提取 MaterialMeta
 */
export const materialList: MaterialMeta[] = []

for (const path in metaModules) {
  const meta = metaModules[path]?.default
  if (meta && meta.componentName) {
    materialList.push(meta)
  }
}

// Debug: 打印所有物料
console.log(
  '[Registry] Loaded materials:',
  materialList.map((m) => `${m.category}/${m.componentName}`).sort(),
)

// 别名映射 (兼容旧名称)
const ALIAS_MAP: Record<string, string> = {
  KpiText: 'Text',
  KpiProgress: 'Progress',
  KpiStat: 'Stat',
  KpiBox: 'Box',
  KpiCountUp: 'CountUp',
  // 图表旧名称兼容
  stackedBarChart: 'StackedBarChart',
  scatterChart: 'ScatterChart',
  sankeyChart: 'SankeyChart',
  radarChart: 'RadarChart',
  funnelChart: 'FunnelChart',
  doughnutChart: 'DoughnutChart',
  barChart: 'BarChart',
  lineChart: 'LineChart',
  pieChart: 'PieChart',
  gaugeChart: 'GaugeChart',
}

/**
 * 解析组件名称（处理别名和大小写）
 */
function resolveComponentName(name: string): string | null {
  const targetName = ALIAS_MAP[name] || name

  // 1. 精确匹配
  if (componentMap[targetName]) return targetName

  // 2. PascalCase 匹配
  const pascalName = targetName.charAt(0).toUpperCase() + targetName.slice(1)
  if (componentMap[pascalName]) return pascalName

  return null
}

/**
 * 获取组件实现，优先使用 materials 的包装，其次从 @vela/ui 获取
 */
export function getComponent(name: string): Component | string {
  console.log(`[Registry] getComponent called with: ${name}`)

  // 1. 尝试解析 materials 组件
  const resolvedName = resolveComponentName(name)
  if (resolvedName) {
    console.log(`[Registry] Found in componentMap: ${resolvedName}`)
    return componentMap[resolvedName]
  }

  // 2. V1.5: 回退到 @vela/ui 的组件 (添加 v 前缀)
  // 注意：这里也尝试用 PascalCase 处理 name
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
  const uiComponentName = `v${pascalName}`

  if ((uiComponentRegistry as any)[uiComponentName]) {
    console.log(`[Registry] Found in UI registry: ${uiComponentName}`)
    return (uiComponentRegistry as any)[uiComponentName]
  }

  // 3. 兜底返回 div
  console.warn(`[Registry] Component ${name} not found, falling back to div`)
  return 'div'
}

/**
 * 检查组件是否已注册
 */
export function hasComponent(name: string): boolean {
  if (resolveComponentName(name)) return true

  const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
  const uiComponentName = `v${pascalName}`
  return uiComponentName in uiComponentRegistry
}

/**
 * 获取所有已注册的组件名称
 */
export function getRegisteredComponents(): string[] {
  return Object.keys(componentMap)
}

/**
 * 根据 category 分组获取物料列表
 */
export function getMaterialsByCategory(): Record<string, MaterialMeta[]> {
  const grouped: Record<string, MaterialMeta[]> = {}
  materialList.forEach((meta) => {
    const category = meta.category || '其他'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(meta)
  })
  return grouped
}

/**
 * 从 MaterialMeta 的 props 中提取默认值
 */
export function extractDefaultProps(props: MaterialMeta['props']): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const key in props) {
    const prop = props[key]
    if (prop && 'defaultValue' in prop) {
      defaults[key] = prop.defaultValue
    }
  }
  return defaults
}

// 保持向后兼容
export const componentRegistry = componentMap
