/// <reference types="vite/client" />
import { defineAsyncComponent, type Component } from 'vue'
import type { MaterialMeta, PropSchema } from '@vela/core/types'
import { componentRegistry as uiComponentRegistry } from '@vela/ui'
import {
  COMPONENT_ALIASES,
  getComponentDefinition,
  type ComponentCategory,
} from '@vela/core/contracts'
import { normalizeCategoryName } from './materialsMeta'

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

/**
 * 组件元数据列表 - materialList
 * 从所有 index.ts 中提取 MaterialMeta
 */
export const materialList: MaterialMeta[] = []

for (const path in metaModules) {
  const meta = metaModules[path]?.default
  if (meta && (meta.name || meta.componentName)) {
    // 兼容处理：确保 name 存在
    if (!meta.name && meta.componentName) {
      meta.name = meta.componentName
    }
    materialList.push(meta)
  }
}

// Alias map is now imported from @vela/core/contracts (COMPONENT_ALIASES)
// Re-export as ALIAS_MAP for local backward compatibility
const ALIAS_MAP = COMPONENT_ALIASES

const CATEGORY_LABEL_MAP: Partial<Record<ComponentCategory, string>> = {
  basic: '基础',
  form: '表单',
  layout: '布局',
  data: '数据',
  chart: '图表',
  navigation: '导航',
  kpi: 'KPI',
  content: '内容',
  media: '媒体',
  advanced: '高级',
}

/**
 * 冗余/过于底层的容器不再在物料面板直接暴露，避免用户在多套容器之间迷失。
 * 这些组件仍可被历史数据正常渲染。
 */
const PANEL_EXCLUDED_MATERIALS = new Set([
  'Row',
  'Col',
  'Grid',
  'Group',
  'Page',
  'row',
  'col',
  'grid',
  'group',
  'page',
])

/**
 * 布局类物料优先级（越靠前越优先展示）
 */
const LAYOUT_MATERIAL_PRIORITY = ['Container', 'GridBox', 'Flex', 'Panel', 'Tabs', 'Modal']

function lowerFirst(name: string): string {
  return name ? name.charAt(0).toLowerCase() + name.slice(1) : name
}

function upperFirst(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name
}

function resolveMaterialCategory(meta: MaterialMeta): string {
  const name = meta.name || meta.componentName || ''
  const candidates = [name, lowerFirst(name), upperFirst(name)]

  for (const candidate of candidates) {
    const definition = getComponentDefinition(candidate)
    if (definition) {
      const mapped = CATEGORY_LABEL_MAP[definition.category]
      if (mapped) {
        return mapped
      }
    }
  }

  return normalizeCategoryName(meta.category || '其他')
}

function materialDisplayName(meta: MaterialMeta): string {
  const title = meta.title
  return typeof title === 'string' ? title : meta.name || meta.componentName || ''
}

function isMaterialVisibleInPanel(meta: MaterialMeta): boolean {
  const name = meta.name || meta.componentName || ''
  return !PANEL_EXCLUDED_MATERIALS.has(name)
}

function getMaterialSortOrder(category: string, meta: MaterialMeta): number {
  if (category !== '布局') {
    return Number.MAX_SAFE_INTEGER
  }

  const name = meta.name || meta.componentName || ''
  const index = LAYOUT_MATERIAL_PRIORITY.indexOf(name)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
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

const uiRegistry = uiComponentRegistry as Record<string, Component>

/**
 * 获取组件实现，优先使用 materials 的包装，其次从 @vela/ui 获取
 */
export function getComponent(name: string): Component | string {
  // 1. 尝试解析 materials 组件
  const resolvedName = resolveComponentName(name)
  if (resolvedName) {
    return componentMap[resolvedName]
  }

  // 2. V1.5: 回退到 @vela/ui 的组件 (添加 v 前缀)
  // 注意：这里也尝试用 PascalCase 处理 name
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
  const uiComponentName = `v${pascalName}`

  if (uiRegistry[uiComponentName]) {
    return uiRegistry[uiComponentName]
  }

  // 3. 兜底返回 div
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
    if (!isMaterialVisibleInPanel(meta)) {
      return
    }

    const category = resolveMaterialCategory(meta)
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(meta)
  })

  Object.entries(grouped).forEach(([category, list]) => {
    list.sort((a, b) => {
      const orderA = getMaterialSortOrder(category, a)
      const orderB = getMaterialSortOrder(category, b)
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return materialDisplayName(a).localeCompare(materialDisplayName(b), 'zh-Hans-CN')
    })
  })

  return grouped
}

/**
 * 从 MaterialMeta 的 props 中提取默认值
 * 支持 ObjectSetter 嵌套属性的递归提取
 */
function extractDefaultsFromSchema(
  props: MaterialMeta['props'] | PropSchema[] | Record<string, PropSchema> | undefined,
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  if (!props) {
    return defaults
  }

  // 统一转为数组处理
  const propList: PropSchema[] = Array.isArray(props)
    ? props
    : Object.values(props as Record<string, PropSchema>)

  propList.forEach((prop) => {
    let value = prop.defaultValue

    // 递归处理 ObjectSetter 的嵌套属性
    if (prop.setter === 'ObjectSetter' && prop.properties) {
      const subDefaults = extractDefaultsFromSchema(prop.properties)
      // 合并：显式 defaultValue 优先，嵌套属性填充缺失值
      if (typeof value === 'object' && value !== null) {
        value = { ...subDefaults, ...value }
      } else if (Object.keys(subDefaults).length > 0) {
        value = subDefaults
      }
    }

    if (value !== undefined) {
      defaults[prop.name] = value
    }
  })

  return defaults
}

export function extractDefaultProps(
  props: MaterialMeta['props'] | PropSchema[],
): Record<string, unknown> {
  return extractDefaultsFromSchema(props)
}

/**
 * 从 MaterialMeta 的 styles 中提取默认 style 值。
 * 历史物料可能将默认样式写在 styles，而不是 props。
 */
export function extractDefaultStyles(
  styles: MaterialMeta['styles'] | Record<string, PropSchema> | undefined,
): Record<string, unknown> {
  return extractDefaultsFromSchema(styles)
}

// 保持向后兼容
export const componentRegistry = componentMap
