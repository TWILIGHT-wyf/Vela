/**
 * Unified Component Registry — Single Source of Truth
 *
 * This module defines the canonical mapping between internal component names
 * (as stored in NodeSchema.component), and their framework-specific tag names
 * for Vue (@vela/ui) and React (@vela/ui-react).
 *
 * ALL other mapping tables in the codebase should derive from this registry:
 * - packages/generator/src/emitters/vue3/emitProject.ts   → VUE_COMPONENT_MAP
 * - packages/generator/src/emitters/react/emitProject.ts  → REACT_COMPONENT_MAP
 * - packages/materials/src/registry.ts                     → ALIAS_MAP
 * - packages/materials/src/metadata-registry.ts            → aliases
 * - packages/renderer/src/runtime/RuntimeComponent.vue     → typeMap
 * - packages/editor/src/main.ts                            → RESERVED_NAMES
 */

// ============================================================================
// Types
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
  /** Canonical schema name used in NodeSchema.component */
  name: string
  /** Component category for grouping */
  category: ComponentCategory
  /** Vue component tag name in @vela/ui (e.g. 'vText', 'lineChart') */
  vueTag: string
  /** React component name in @vela/ui-react (null = not yet implemented) */
  reactComponent: string | null
  /** Whether the component is a container that can hold children */
  isContainer?: boolean
}

// ============================================================================
// Component Registry — the single source of truth
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
// Legacy Aliases — map old schema names to canonical names
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
// Wrapper Components — resolve to 'div' in code generation
// ============================================================================

export const WRAPPER_COMPONENTS: ReadonlySet<string> = new Set([
  'page',
  'fragment',
  'layout',
  'dialog',
])

// ============================================================================
// HTML Tags — native elements, not library components
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
// Derived Lookup Maps (computed once at module load)
// ============================================================================

/** Internal name → ComponentDefinition */
const _definitionMap = new Map<string, ComponentDefinition>()
for (const def of COMPONENT_REGISTRY) {
  _definitionMap.set(def.name, def)
}

/** Internal name → Vue tag */
const _vueTagMap: Record<string, string> = {}
/** Internal name → React component name */
const _reactComponentMap: Record<string, string> = {}

for (const def of COMPONENT_REGISTRY) {
  _vueTagMap[def.name] = def.vueTag
  if (def.reactComponent) {
    _reactComponentMap[def.name] = def.reactComponent
  }
}

/** Frozen derived maps for external consumption */
export const VUE_TAG_MAP: Readonly<Record<string, string>> = Object.freeze(_vueTagMap)
export const REACT_TAG_MAP: Readonly<Record<string, string>> = Object.freeze(_reactComponentMap)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolve a possibly-aliased component name to its canonical internal name.
 *
 * @example
 * resolveComponentAlias('KpiText')   // → 'Text'
 * resolveComponentAlias('flexbox')   // → 'flex'
 * resolveComponentAlias('lineChart') // → 'lineChart' (identity)
 */
export function resolveComponentAlias(name: string): string {
  return COMPONENT_ALIASES[name] ?? name
}

/**
 * Get the Vue tag name for a given internal component name.
 * Returns the name itself if not found in the registry.
 */
export function getVueTagName(schemaName: string): string {
  const canonical = resolveComponentAlias(schemaName)
  return VUE_TAG_MAP[canonical] ?? canonical
}

/**
 * Get the React component name for a given internal component name.
 * Returns null if the component has no React implementation.
 */
export function getReactComponentName(schemaName: string): string | null {
  const canonical = resolveComponentAlias(schemaName)
  return REACT_TAG_MAP[canonical] ?? null
}

/**
 * Get the ComponentDefinition for a given name (resolves aliases).
 */
export function getComponentDefinition(name: string): ComponentDefinition | undefined {
  const canonical = resolveComponentAlias(name)
  return _definitionMap.get(canonical)
}

/**
 * Get all components in a given category.
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((def) => def.category === category)
}

/**
 * Check if a name refers to a wrapper component (page, fragment, layout, dialog).
 * These are rendered as 'div' in generated code.
 */
export function isWrapperComponent(name: string): boolean {
  return WRAPPER_COMPONENTS.has(name.toLowerCase())
}

/**
 * Check if a name is a native HTML tag.
 */
export function isHtmlTag(name: string): boolean {
  return HTML_TAGS.has(name.toLowerCase())
}

/**
 * Resolve a component name for Vue code generation.
 * Wrapper components → 'div', HTML tags → identity, others → VUE_TAG_MAP lookup.
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
 * Resolve a component name for React code generation.
 * Wrapper components → 'div', HTML tags → identity, others → REACT_TAG_MAP lookup.
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
 * Check if a component is known in the registry (including aliases).
 */
export function isRegisteredComponent(name: string): boolean {
  const canonical = resolveComponentAlias(name)
  return _definitionMap.has(canonical)
}

/**
 * Get all canonical component names.
 */
export function getAllComponentNames(): string[] {
  return COMPONENT_REGISTRY.map((def) => def.name)
}

/**
 * Reserved names — component names that conflict with HTML tags or
 * framework builtins (e.g. Element Plus). Used by the editor to add
 * a prefix when registering global components.
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
