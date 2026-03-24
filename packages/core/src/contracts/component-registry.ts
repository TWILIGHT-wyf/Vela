/**
 * 统一组件注册表（单一真相源）。
 *
 * 维护 NodeSchema.component 的规范名与 Vue/React 实现名映射，
 * 其余映射表应由这里派生，避免多处维护导致漂移。
 */

// ============================================================================
// 类型
// ============================================================================

export type ComponentCategory =
  | 'chart'
  | 'kpi'
  | 'basic'
  | 'layout'
  | 'data'
  | 'form'
  | 'media'
  | 'content'
  | 'gis'
  | 'advanced'
  | 'navigation'
  | 'v2'

export interface ComponentDefinition {
  /** NodeSchema.component 使用的规范组件名 */
  name: string
  /** 组件分组 */
  category: ComponentCategory
  /** @vela/ui 中的 Vue 组件标签名 */
  vueTag: string
  /** @vela/ui-react 中的 React 组件名（null 表示未实现） */
  reactComponent: string | null
  /** 是否为可承载子节点的容器组件 */
  isContainer?: boolean
}

// ============================================================================
// 组件注册表（单一真相源）
// ============================================================================

export const COMPONENT_REGISTRY: readonly ComponentDefinition[] = [
  // ── Chart ─────────────────────────────────────────────────
  { name: 'lineChart', category: 'chart', vueTag: 'lineChart', reactComponent: 'ReactECharts' },
  { name: 'barChart', category: 'chart', vueTag: 'barChart', reactComponent: 'ReactECharts' },
  { name: 'pieChart', category: 'chart', vueTag: 'pieChart', reactComponent: 'ReactECharts' },
  {
    name: 'doughnutChart',
    category: 'chart',
    vueTag: 'doughnutChart',
    reactComponent: 'ReactECharts',
  },
  {
    name: 'scatterChart',
    category: 'chart',
    vueTag: 'scatterChart',
    reactComponent: 'ReactECharts',
  },
  { name: 'radarChart', category: 'chart', vueTag: 'radarChart', reactComponent: 'ReactECharts' },
  { name: 'gaugeChart', category: 'chart', vueTag: 'gaugeChart', reactComponent: 'ReactECharts' },
  { name: 'funnelChart', category: 'chart', vueTag: 'funnelChart', reactComponent: 'ReactECharts' },
  { name: 'sankeyChart', category: 'chart', vueTag: 'sankeyChart', reactComponent: 'ReactECharts' },
  {
    name: 'stackedBarChart',
    category: 'chart',
    vueTag: 'stackedBarChart',
    reactComponent: 'ReactECharts',
  },

  // ── KPI ───────────────────────────────────────────────────
  { name: 'Text', category: 'basic', vueTag: 'vText', reactComponent: 'Text' },
  { name: 'box', category: 'kpi', vueTag: 'vBox', reactComponent: 'Box' },
  { name: 'stat', category: 'kpi', vueTag: 'vStat', reactComponent: 'Stat' },
  { name: 'countUp', category: 'kpi', vueTag: 'vCountUp', reactComponent: 'CountUp' },
  { name: 'progress', category: 'kpi', vueTag: 'vProgress', reactComponent: 'Progress' },

  // ── Basic ─────────────────────────────────────────────────
  { name: 'badge', category: 'basic', vueTag: 'vBadge', reactComponent: 'Badge' },
  { name: 'button', category: 'basic', vueTag: 'vButton', reactComponent: 'Button' },
  {
    name: 'Container',
    category: 'basic',
    vueTag: 'vContainer',
    reactComponent: 'Container',
    isContainer: true,
  },
  {
    name: 'Group',
    category: 'basic',
    vueTag: 'vGroup',
    reactComponent: 'Group',
    isContainer: true,
  },

  // ── Layout ────────────────────────────────────────────────
  { name: 'row', category: 'layout', vueTag: 'vRow', reactComponent: 'Row', isContainer: true },
  { name: 'col', category: 'layout', vueTag: 'vCol', reactComponent: 'Col', isContainer: true },
  { name: 'flex', category: 'layout', vueTag: 'vFlex', reactComponent: 'Flex', isContainer: true },
  { name: 'grid', category: 'layout', vueTag: 'vGrid', reactComponent: 'Grid', isContainer: true },
  {
    name: 'modal',
    category: 'layout',
    vueTag: 'vModal',
    reactComponent: 'Modal',
    isContainer: true,
  },
  {
    name: 'panel',
    category: 'layout',
    vueTag: 'vPanel',
    reactComponent: 'Panel',
    isContainer: true,
  },
  { name: 'tabs', category: 'layout', vueTag: 'vTabs', reactComponent: 'Tabs', isContainer: true },

  // ── Data ──────────────────────────────────────────────────
  { name: 'table', category: 'data', vueTag: 'vTable', reactComponent: 'Table' },
  { name: 'list', category: 'data', vueTag: 'vList', reactComponent: 'List' },

  // ── Form ──────────────────────────────────────────────────
  { name: 'select', category: 'form', vueTag: 'vSelect', reactComponent: 'Select' },
  { name: 'TextInput', category: 'form', vueTag: 'vTextInput', reactComponent: 'TextInput' },
  {
    name: 'TextareaInput',
    category: 'form',
    vueTag: 'vTextareaInput',
    reactComponent: 'TextareaInput',
  },
  { name: 'NumberInput', category: 'form', vueTag: 'vNumberInput', reactComponent: 'NumberInput' },
  { name: 'RadioGroup', category: 'form', vueTag: 'vRadioGroup', reactComponent: 'RadioGroup' },
  { name: 'Checkbox', category: 'form', vueTag: 'vCheckbox', reactComponent: 'Checkbox' },
  { name: 'DatePicker', category: 'form', vueTag: 'vDatePicker', reactComponent: 'DatePicker' },
  { name: 'TimePicker', category: 'form', vueTag: 'vTimePicker', reactComponent: 'TimePicker' },
  { name: 'Upload', category: 'form', vueTag: 'vUpload', reactComponent: 'Upload' },
  { name: 'TreeSelect', category: 'form', vueTag: 'vTreeSelect', reactComponent: 'TreeSelect' },
  { name: 'Cascader', category: 'form', vueTag: 'vCascader', reactComponent: 'Cascader' },
  { name: 'multiSelect', category: 'form', vueTag: 'vMultiSelect', reactComponent: 'MultiSelect' },
  { name: 'dateRange', category: 'form', vueTag: 'vDateRange', reactComponent: 'DateRange' },
  { name: 'searchBox', category: 'form', vueTag: 'vSearchBox', reactComponent: 'SearchBox' },
  { name: 'slider', category: 'form', vueTag: 'vSlider', reactComponent: 'Slider' },
  { name: 'switch', category: 'form', vueTag: 'vSwitch', reactComponent: 'Switch' },
  {
    name: 'checkboxGroup',
    category: 'form',
    vueTag: 'vCheckboxGroup',
    reactComponent: 'CheckboxGroup',
  },
  { name: 'buttonGroup', category: 'form', vueTag: 'vButtonGroup', reactComponent: 'ButtonGroup' },

  // ── Media ─────────────────────────────────────────────────
  { name: 'image', category: 'media', vueTag: 'vImage', reactComponent: 'Image' },
  { name: 'video', category: 'media', vueTag: 'vVideo', reactComponent: 'Video' },

  // ── Content ───────────────────────────────────────────────
  { name: 'markdown', category: 'content', vueTag: 'vMarkdown', reactComponent: 'Markdown' },
  { name: 'html', category: 'content', vueTag: 'vHtml', reactComponent: 'Html' },
  { name: 'iframe', category: 'content', vueTag: 'vIframe', reactComponent: 'Iframe' },

  // ── Navigation ────────────────────────────────────────────
  { name: 'navButton', category: 'navigation', vueTag: 'vNavButton', reactComponent: 'NavButton' },
  {
    name: 'breadcrumb',
    category: 'navigation',
    vueTag: 'vBreadcrumb',
    reactComponent: 'Breadcrumb',
  },
  {
    name: 'pagination',
    category: 'navigation',
    vueTag: 'vPagination',
    reactComponent: 'Pagination',
  },
] as const

// ============================================================================
// 旧别名映射：历史名称 -> 规范名称
// ============================================================================

export const COMPONENT_ALIASES: Readonly<Record<string, string>> = {
  // KPI legacy prefixes
  KpiText: 'Text',
  KpiProgress: 'progress',
  KpiStat: 'stat',
  KpiBox: 'box',
  KpiCountUp: 'countUp',

  // Layout legacy names
  flexbox: 'flex',
  gridLayout: 'grid',

  // Form legacy names
  dropdown: 'select',
  datePicker: 'dateRange',
  Input: 'TextInput',
  Textarea: 'TextareaInput',
  InputNumber: 'NumberInput',
  Radio: 'RadioGroup',
  singleDatePicker: 'DatePicker',
  timeSelector: 'TimePicker',
  fileUpload: 'Upload',
}

// ============================================================================
// 包装组件：代码生成时解析为 div
// ============================================================================

export const WRAPPER_COMPONENTS: ReadonlySet<string> = new Set([
  'page',
  'fragment',
  'layout',
  'dialog',
])

// ============================================================================
// HTML 原生标签（非组件库组件）
// ============================================================================

export const HTML_TAGS: ReadonlySet<string> = new Set([
  'a',
  'article',
  'aside',
  'button',
  'div',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'img',
  'input',
  'label',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'section',
  'select',
  'span',
  'table',
  'tbody',
  'td',
  'textarea',
  'th',
  'thead',
  'tr',
  'ul',
  'video',
])

// ============================================================================
// 派生查找表（模块加载时一次性构建）
// ============================================================================

/** 规范名 -> ComponentDefinition */
const _definitionMap = new Map<string, ComponentDefinition>()
for (const def of COMPONENT_REGISTRY) {
  _definitionMap.set(def.name, def)
}

/** 规范名 -> Vue 标签名 */
const _vueTagMap: Record<string, string> = {}
/** 规范名 -> React 组件名 */
const _reactComponentMap: Record<string, string> = {}

for (const def of COMPONENT_REGISTRY) {
  _vueTagMap[def.name] = def.vueTag
  if (def.reactComponent) {
    _reactComponentMap[def.name] = def.reactComponent
  }
}

/** 冻结后对外暴露的映射表 */
export const VUE_TAG_MAP: Readonly<Record<string, string>> = Object.freeze(_vueTagMap)
export const REACT_TAG_MAP: Readonly<Record<string, string>> = Object.freeze(_reactComponentMap)

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将可能的别名解析为规范组件名。
 */
export function resolveComponentAlias(name: string): string {
  return COMPONENT_ALIASES[name] ?? name
}

/**
 * 获取 Vue 标签名；未命中时回退原值。
 */
export function getVueTagName(schemaName: string): string {
  const canonical = resolveComponentAlias(schemaName)
  return VUE_TAG_MAP[canonical] ?? canonical
}

/**
 * 获取 React 组件名；若未实现则返回 null。
 */
export function getReactComponentName(schemaName: string): string | null {
  const canonical = resolveComponentAlias(schemaName)
  return REACT_TAG_MAP[canonical] ?? null
}

/**
 * 获取组件定义（自动解析别名）。
 */
export function getComponentDefinition(name: string): ComponentDefinition | undefined {
  const canonical = resolveComponentAlias(name)
  return _definitionMap.get(canonical)
}

/**
 * 按分类获取组件定义。
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((def) => def.category === category)
}

/**
 * 判断是否为包装组件（page/fragment/layout/dialog）。
 */
export function isWrapperComponent(name: string): boolean {
  return WRAPPER_COMPONENTS.has(name.toLowerCase())
}

/**
 * 判断是否为原生 HTML 标签。
 */
export function isHtmlTag(name: string): boolean {
  return HTML_TAGS.has(name.toLowerCase())
}

/**
 * 为 Vue 代码生成解析组件标签名。
 * 包装组件 -> div，原生标签 -> 原值，其余走注册表映射。
 */
export function resolveVueComponentTag(name: string): string {
  if (!name || typeof name !== 'string') return 'div'
  const normalized = name.trim()
  if (!normalized) return 'div'

  if (isWrapperComponent(normalized)) return 'div'
  if (isHtmlTag(normalized)) return normalized

  return getVueTagName(normalized)
}

/**
 * 为 React 代码生成解析组件名。
 * 包装组件 -> div，原生标签 -> 小写原值，其余走注册表映射。
 */
export function resolveReactComponentTag(name: string): string {
  if (!name || typeof name !== 'string') return 'div'
  const normalized = name.trim()
  if (!normalized) return 'div'

  if (isWrapperComponent(normalized)) return 'div'
  if (isHtmlTag(normalized.toLowerCase())) return normalized.toLowerCase()

  return getReactComponentName(normalized) ?? normalized
}

/**
 * 判断组件是否已注册（含别名）。
 */
export function isRegisteredComponent(name: string): boolean {
  const canonical = resolveComponentAlias(name)
  return _definitionMap.has(canonical)
}

/**
 * 获取全部规范组件名。
 */
export function getAllComponentNames(): string[] {
  return COMPONENT_REGISTRY.map((def) => def.name)
}

/**
 * 保留组件名集合。
 * 与 HTML 标签或框架内置名冲突时，编辑器注册全局组件会加前缀。
 */
export const RESERVED_COMPONENT_NAMES: ReadonlySet<string> = new Set([
  'Button',
  'Input',
  'Select',
  'Option',
  'Form',
  'Table',
  'Dialog',
  'Menu',
  'Image',
  'Link',
  'Text',
  'Icon',
  'Container',
  'Header',
  'Footer',
  'Main',
  'Aside',
  'Col',
  'Row',
  'Progress',
  'Slider',
  'Switch',
])
