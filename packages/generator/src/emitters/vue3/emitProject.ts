import type { IRNode, IRPage, IRProject } from '../../pipeline/ir/ir'
import { createDiagnostic, type CompileDiagnostic } from '../../pipeline/validate/diagnostics'

export interface VueEmitterOptions {
  language: 'ts' | 'js'
  lint: boolean
}

export interface VueEmitterResult {
  files: Array<{ path: string; content: string }>
  diagnostics: CompileDiagnostic[]
}

interface VuePageDescriptor {
  page: IRPage
  componentName: string
  fileName: string
  routePath?: string
  source: string
}

interface ExpressionLike {
  type: string
  value: string
  mock?: unknown
}

const WRAPPER_COMPONENTS = new Set(['page', 'fragment', 'layout', 'dialog'])

const HTML_TAGS = new Set([
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

const CSS_UNITLESS_PROPERTIES = new Set([
  'fontWeight',
  'lineHeight',
  'opacity',
  'order',
  'zIndex',
  'flexGrow',
  'flexShrink',
  'zoom',
])

const VUE_COMPONENT_MAP: Record<string, string> = {
  lineChart: 'lineChart',
  barChart: 'barChart',
  pieChart: 'pieChart',
  doughnutChart: 'doughnutChart',
  scatterChart: 'scatterChart',
  radarChart: 'radarChart',
  gaugeChart: 'gaugeChart',
  funnelChart: 'funnelChart',
  sankeyChart: 'sankeyChart',
  Text: 'vText',
  box: 'vBox',
  stat: 'vStat',
  countUp: 'vCountUp',
  progress: 'vProgress',
  badge: 'vBadge',
  table: 'vTable',
  list: 'vList',
  timeline: 'vTimeline',
  cardGrid: 'vCardGrid',
  pivot: 'vPivot',
  select: 'vSelect',
  multiSelect: 'vMultiSelect',
  dateRange: 'vDateRange',
  searchBox: 'vSearchBox',
  slider: 'vSlider',
  switch: 'vSwitch',
  checkboxGroup: 'vCheckboxGroup',
  buttonGroup: 'vButtonGroup',
  row: 'vRow',
  col: 'vCol',
  flex: 'vFlex',
  grid: 'vGrid',
  modal: 'vModal',
  panel: 'vPanel',
  tabs: 'vTabs',
  Container: 'vContainer',
  image: 'vImage',
  video: 'vVideo',
  markdown: 'vMarkdown',
  html: 'vHtml',
  iframe: 'vIframe',
  Group: 'vGroup',
  map: 'vMap',
  marker: 'vMarker',
  heatLayer: 'vHeatLayer',
  geoJsonLayer: 'vGeoJsonLayer',
  clusterLayer: 'vClusterLayer',
  tileLayer: 'vTileLayer',
  vectorLayer: 'vVectorLayer',
  legend: 'vLegend',
  scale: 'vScale',
  layers: 'vLayers',
  scripting: 'vScripting',
  state: 'vState',
  trigger: 'vTrigger',
}

const VUE_LIBRARY_COMPONENTS = new Set(Object.values(VUE_COMPONENT_MAP))

function toPascalCase(value: string): string {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('')

  return normalized || 'Page'
}

function toKebabCase(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'page'
  )
}

function sanitizeProjectName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'vela-project'
  )
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeTemplateLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
}

function wrapVueExpression(expression: string): string {
  const escaped = expression.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')
  return `'${escaped}'`
}

function isExpressionLike(value: unknown): value is ExpressionLike {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.type === 'string' && typeof record.value === 'string'
}

function normalizeAlias(value: string | undefined, fallback: string): string {
  const normalized = (value || fallback).replace(/[^a-zA-Z0-9_$]/g, '_')
  if (/^[0-9]/.test(normalized)) {
    return `_${normalized}`
  }
  return normalized || fallback
}

function toKebabStyleKey(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function normalizeCssValue(property: string, value: string | number): string {
  if (typeof value === 'string') {
    return value
  }
  if (CSS_UNITLESS_PROPERTIES.has(property)) {
    return String(value)
  }
  return `${value}px`
}

function resolveVueTag(component: string): string {
  const normalized = component.trim()
  if (!normalized) {
    return 'div'
  }

  const lower = normalized.toLowerCase()
  if (WRAPPER_COMPONENTS.has(lower)) {
    return 'div'
  }
  if (HTML_TAGS.has(lower)) {
    return lower
  }

  return VUE_COMPONENT_MAP[normalized] || normalized
}

function collectVueImports(node: IRNode, collector: Set<string>): void {
  const tag = resolveVueTag(node.component)
  if (VUE_LIBRARY_COMPONENTS.has(tag)) {
    collector.add(tag)
  }

  for (const child of node.children) {
    collectVueImports(child, collector)
  }
  for (const slotChildren of Object.values(node.slots)) {
    for (const child of slotChildren) {
      collectVueImports(child, collector)
    }
  }
}

function hasNodeEvents(node: IRNode): boolean {
  if (node.events && Object.values(node.events).some((actions) => actions.length > 0)) {
    return true
  }
  for (const child of node.children) {
    if (hasNodeEvents(child)) {
      return true
    }
  }
  for (const slotChildren of Object.values(node.slots)) {
    for (const child of slotChildren) {
      if (hasNodeEvents(child)) {
        return true
      }
    }
  }
  return false
}

function collectNodeRuntimeMaps(root: IRNode | undefined): {
  nodeEvents: Record<string, Record<string, unknown[]>>
  nodeActions: Record<string, unknown[]>
} {
  const nodeEvents: Record<string, Record<string, unknown[]>> = {}
  const nodeActions: Record<string, unknown[]> = {}

  if (!root) {
    return { nodeEvents, nodeActions }
  }

  const walk = (node: IRNode): void => {
    if (node.events && Object.keys(node.events).length > 0) {
      const eventMap: Record<string, unknown[]> = {}
      for (const [eventName, actions] of Object.entries(node.events)) {
        eventMap[eventName] = Array.isArray(actions) ? (actions as unknown[]) : []
      }
      nodeEvents[node.id] = eventMap
    }

    if (Array.isArray(node.actions) && node.actions.length > 0) {
      nodeActions[node.id] = node.actions as unknown[]
    }

    for (const child of node.children) {
      walk(child)
    }

    for (const slotChildren of Object.values(node.slots)) {
      for (const child of slotChildren) {
        walk(child)
      }
    }
  }

  walk(root)

  return { nodeEvents, nodeActions }
}

function buildNodeStyle(node: IRNode): Record<string, string | number> {
  const style: Record<string, string | number> = {}
  const rawStyle = node.style as Record<string, unknown> | undefined

  if (rawStyle) {
    for (const [key, value] of Object.entries(rawStyle)) {
      if (typeof value === 'string' || typeof value === 'number') {
        style[key] = value
      }
    }
  }

  if (node.layout.mode === 'free') {
    style.position = 'absolute'
    style.left = `${node.layout.x}px`
    style.top = `${node.layout.y}px`
    if (style.width === undefined && node.layout.width !== undefined) {
      style.width = node.layout.width
    }
    if (style.height === undefined && node.layout.height !== undefined) {
      style.height = node.layout.height
    }
    if (style.zIndex === undefined) {
      style.zIndex = node.layout.zIndex
    }
  } else {
    if (style.width === undefined && node.layout.width !== undefined) {
      style.width = node.layout.width
    }
    if (style.height === undefined && node.layout.height !== undefined) {
      style.height = node.layout.height
    }
    if (style.order === undefined && node.layout.order !== undefined) {
      style.order = node.layout.order
    }
  }

  if (node.layout.rotate !== 0) {
    const existingTransform = typeof style.transform === 'string' ? style.transform : ''
    if (existingTransform.includes('rotate(')) {
      style.transform = existingTransform
    } else if (existingTransform) {
      style.transform = `${existingTransform} rotate(${node.layout.rotate}deg)`
    } else {
      style.transform = `rotate(${node.layout.rotate}deg)`
    }
  }

  return style
}

function toVueStyleAttribute(node: IRNode): string {
  const style = buildNodeStyle(node)
  const entries: string[] = []

  for (const [property, value] of Object.entries(style)) {
    if (value === '' || value === undefined) {
      continue
    }
    entries.push(`${toKebabStyleKey(property)}:${normalizeCssValue(property, value)}`)
  }

  return entries.join(';')
}

function toVueRenderIfDirective(
  renderIf: IRNode['renderIf'],
  diagnostics: CompileDiagnostic[],
  pageId: string,
  nodeId: string,
): string | undefined {
  if (renderIf === undefined) {
    return undefined
  }

  if (typeof renderIf === 'boolean') {
    return renderIf ? undefined : `v-if=${wrapVueExpression('false')}`
  }

  if (isExpressionLike(renderIf)) {
    if (renderIf.type === 'template') {
      return `v-if=${wrapVueExpression(`\`${escapeTemplateLiteral(renderIf.value)}\``)}`
    }
    return `v-if=${wrapVueExpression(renderIf.value)}`
  }

  diagnostics.push(
    createDiagnostic(
      'warning',
      'NODE_RENDER_IF_UNSUPPORTED',
      `Node "${nodeId}" has unsupported renderIf value and will always render`,
      `pages.${pageId}.nodes.${nodeId}.renderIf`,
    ),
  )
  return undefined
}

function toVueRepeatDirectives(
  repeat: IRNode['repeat'],
  diagnostics: CompileDiagnostic[],
  pageId: string,
  nodeId: string,
): string[] {
  if (!repeat) {
    return []
  }

  let iterableExpression: string | undefined
  if (Array.isArray(repeat.source)) {
    iterableExpression = JSON.stringify(repeat.source)
  } else if (isExpressionLike(repeat.source)) {
    if (repeat.source.type === 'template') {
      if (Array.isArray(repeat.source.mock)) {
        iterableExpression = JSON.stringify(repeat.source.mock)
      } else {
        diagnostics.push(
          createDiagnostic(
            'warning',
            'NODE_REPEAT_TEMPLATE_SOURCE_UNSUPPORTED',
            `Node "${nodeId}" repeat template source has no array mock value`,
            `pages.${pageId}.nodes.${nodeId}.repeat.source`,
          ),
        )
      }
    } else {
      iterableExpression = repeat.source.value
    }
  }

  if (!iterableExpression) {
    diagnostics.push(
      createDiagnostic(
        'warning',
        'NODE_REPEAT_SOURCE_UNSUPPORTED',
        `Node "${nodeId}" repeat source is unsupported and will be ignored`,
        `pages.${pageId}.nodes.${nodeId}.repeat.source`,
      ),
    )
    return []
  }

  const itemAlias = normalizeAlias(repeat.itemAlias, 'item')
  const indexAlias = normalizeAlias(repeat.indexAlias, 'index')
  const keyExpression = repeat.itemKey ? `${itemAlias}.${repeat.itemKey}` : indexAlias

  return [
    `v-for=${wrapVueExpression(`(${itemAlias}, ${indexAlias}) in ${iterableExpression}`)}`,
    `:key=${wrapVueExpression(keyExpression)}`,
  ]
}

function toVuePropAttributes(
  props: IRNode['props'],
  diagnostics: CompileDiagnostic[],
  pageId: string,
  nodeId: string,
): string[] {
  if (!props || typeof props !== 'object') {
    return []
  }

  const attributes: string[] = []
  for (const [name, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined) {
      continue
    }

    if (isExpressionLike(value)) {
      if (value.type === 'template') {
        attributes.push(
          `:${name}=${wrapVueExpression(`\`${escapeTemplateLiteral(value.value)}\``)}`,
        )
      } else {
        attributes.push(`:${name}=${wrapVueExpression(value.value)}`)
      }
      continue
    }

    if (typeof value === 'string') {
      attributes.push(`${name}="${escapeHtmlAttribute(value)}"`)
      continue
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      attributes.push(`:${name}=${wrapVueExpression(String(value))}`)
      continue
    }

    const serialized = JSON.stringify(value)
    if (serialized === undefined) {
      diagnostics.push(
        createDiagnostic(
          'warning',
          'NODE_PROP_UNSERIALIZABLE',
          `Node "${nodeId}" prop "${name}" is not serializable and is skipped`,
          `pages.${pageId}.nodes.${nodeId}.props.${name}`,
        ),
      )
      continue
    }

    attributes.push(`:${name}=${wrapVueExpression(serialized)}`)
  }

  return attributes
}

function toVueEventAttributes(events: IRNode['events'], nodeId: string): string[] {
  if (!events) {
    return []
  }

  const attributes: string[] = []
  for (const [eventName, actions] of Object.entries(events)) {
    if (actions.length === 0) {
      continue
    }
    const handlerExpression = `onNodeEvent(${JSON.stringify(nodeId)}, ${JSON.stringify(eventName)})`
    attributes.push(`@${eventName}=${wrapVueExpression(handlerExpression)}`)
  }

  return attributes
}

function renderVueNode(
  node: IRNode,
  diagnostics: CompileDiagnostic[],
  pageId: string,
  indent: number,
): string {
  const indentText = ' '.repeat(indent)
  const tag = resolveVueTag(node.component)
  const attributes: string[] = []

  const renderIfDirective = toVueRenderIfDirective(node.renderIf, diagnostics, pageId, node.id)
  if (renderIfDirective) {
    attributes.push(renderIfDirective)
  }
  attributes.push(...toVueRepeatDirectives(node.repeat, diagnostics, pageId, node.id))
  attributes.push(`data-node-id="${escapeHtmlAttribute(node.id)}"`)

  const styleAttribute = toVueStyleAttribute(node)
  if (styleAttribute) {
    attributes.push(`style="${escapeHtmlAttribute(styleAttribute)}"`)
  }

  attributes.push(...toVuePropAttributes(node.props, diagnostics, pageId, node.id))
  attributes.push(...toVueEventAttributes(node.events, node.id))

  const childrenBlocks: string[] = []
  for (const child of node.children) {
    childrenBlocks.push(renderVueNode(child, diagnostics, pageId, indent + 2))
  }

  for (const [slotName, slotChildren] of Object.entries(node.slots)) {
    if (slotChildren.length === 0) {
      continue
    }
    const slotLines: string[] = [`${indentText}  <template #${slotName}>`]
    for (const child of slotChildren) {
      slotLines.push(renderVueNode(child, diagnostics, pageId, indent + 4))
    }
    slotLines.push(`${indentText}  </template>`)
    childrenBlocks.push(slotLines.join('\n'))
  }

  const attributeLines = attributes.map((attribute) => `${indentText}  ${attribute}`).join('\n')

  if (childrenBlocks.length === 0) {
    return `${indentText}<${tag}\n${attributeLines}\n${indentText}/>`
  }

  return `${indentText}<${tag}\n${attributeLines}\n${indentText}>\n${childrenBlocks.join('\n')}\n${indentText}</${tag}>`
}

function buildVuePageSource(
  descriptor: VuePageDescriptor,
  project: IRProject,
  language: VueEmitterOptions['language'],
  diagnostics: CompileDiagnostic[],
): string {
  const imports = new Set<string>()
  const hasEvents = descriptor.page.root ? hasNodeEvents(descriptor.page.root) : false
  const runtimeMaps = collectNodeRuntimeMaps(descriptor.page.root)
  const pageActions = descriptor.page.raw.actions ?? []
  const projectActions = project.raw.logic?.actions ?? []
  const projectApis = project.raw.apis?.definitions ?? []

  if (descriptor.page.root) {
    collectVueImports(descriptor.page.root, imports)
  }

  const body = descriptor.page.root
    ? renderVueNode(descriptor.page.root, diagnostics, descriptor.page.id, 4)
    : '    <div class="empty-page">No root node is defined for this page.</div>'

  const scriptLines: string[] = []
  if (imports.size > 0) {
    scriptLines.push(`import { ${Array.from(imports).sort().join(', ')} } from '@vela/ui'`)
  }
  if (hasEvents) {
    scriptLines.push("import { useRouter } from 'vue-router'")
    scriptLines.push("import { createActionExecutor } from '../runtime/actionExecutor'")
    scriptLines.push('')
    scriptLines.push(`const nodeEvents = ${JSON.stringify(runtimeMaps.nodeEvents, null, 2)}`)
    scriptLines.push(`const nodeActions = ${JSON.stringify(runtimeMaps.nodeActions, null, 2)}`)
    scriptLines.push(`const pageActions = ${JSON.stringify(pageActions, null, 2)}`)
    scriptLines.push(`const projectActions = ${JSON.stringify(projectActions, null, 2)}`)
    scriptLines.push(`const projectApis = ${JSON.stringify(projectApis, null, 2)}`)
    scriptLines.push('')
    scriptLines.push('const router = useRouter()')
    scriptLines.push('const { onNodeEvent } = createActionExecutor({')
    scriptLines.push(`  pageId: ${JSON.stringify(descriptor.page.id)},`)
    scriptLines.push('  nodeEvents,')
    scriptLines.push('  nodeActions,')
    scriptLines.push('  pageActions,')
    scriptLines.push('  projectActions,')
    scriptLines.push('  projectApis,')
    scriptLines.push('  router,')
    scriptLines.push('})')
  }

  const scriptBlock =
    scriptLines.length > 0
      ? `<script setup lang="${language}">
${scriptLines.join('\n')}
</script>
`
      : ''

  return `<template>
  <div class="generated-page">
${body}
  </div>
</template>

${scriptBlock}<style scoped>
.generated-page {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.empty-page {
  min-height: 200px;
  display: grid;
  place-items: center;
  color: #6b7280;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}
</style>
`
}

function normalizeRoutePath(path: string | undefined, fallbackName: string, index: number): string {
  if (path && path.trim()) {
    return ensureLeadingSlash(path.trim())
  }
  return `/${toKebabCase(fallbackName || `page-${index + 1}`)}`
}

function createPageDescriptors(
  project: IRProject,
  options: VueEmitterOptions,
  diagnostics: CompileDiagnostic[],
): VuePageDescriptor[] {
  const usedNames = new Set<string>()
  const descriptors: VuePageDescriptor[] = []

  project.pages.forEach((page, index) => {
    const baseName = toPascalCase(page.name || `Page${index + 1}`)
    let componentName = baseName
    let suffix = 1
    while (usedNames.has(componentName)) {
      suffix += 1
      componentName = `${baseName}${suffix}`
    }
    usedNames.add(componentName)

    const descriptor: VuePageDescriptor = {
      page,
      componentName,
      fileName: `${componentName}.vue`,
      routePath: page.type === 'page' ? normalizeRoutePath(page.path, page.name, index) : undefined,
      source: '',
    }
    descriptor.source = buildVuePageSource(descriptor, project, options.language, diagnostics)
    descriptors.push(descriptor)
  })

  return descriptors
}

function createActionExecutorRuntime(language: VueEmitterOptions['language']): string {
  const tsNoCheck = language === 'ts' ? '// @ts-nocheck\n' : ''

  return `${tsNoCheck}function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isExpressionLike(value) {
  return isRecord(value) && typeof value.type === 'string' && typeof value.value === 'string'
}

function isInlineAction(value) {
  return isRecord(value) && value.type === 'inline' && typeof value.code === 'string'
}

function isRefAction(value) {
  return isRecord(value) && value.type === 'ref' && typeof value.id === 'string'
}

function isPromiseLike(value) {
  return isRecord(value) && typeof value.then === 'function'
}

function toStringValue(value, fallback = '') {
  if (typeof value === 'string') {
    return value
  }
  if (value === undefined || value === null) {
    return fallback
  }
  return String(value)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveExpression(input, scope) {
  if (!isExpressionLike(input)) {
    return input
  }

  if (input.mock !== undefined) {
    return input.mock
  }

  try {
    const keys = Object.keys(scope)
    const values = keys.map((key) => scope[key])
    const source = String(input.value || '')
    if (input.type === 'template') {
      return source
    }
    const body = 'return (' + source + ')'
    const evaluator = new Function(...keys, body)
    return evaluator(...values)
  } catch (error) {
    console.warn('[GeneratedAction] expression evaluation failed', error)
    return undefined
  }
}

function resolveValue(input, scope) {
  if (isExpressionLike(input)) {
    return resolveExpression(input, scope)
  }
  if (Array.isArray(input)) {
    return input.map((item) => resolveValue(item, scope))
  }
  if (isRecord(input)) {
    const output = {}
    for (const [key, value] of Object.entries(input)) {
      output[key] = resolveValue(value, scope)
    }
    return output
  }
  return input
}

function setByPath(target, path, value, merge) {
  if (!isRecord(target) || !path) {
    return
  }

  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return
  }

  let current = target
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    if (!isRecord(current[segment])) {
      current[segment] = {}
    }
    current = current[segment]
  }

  const lastSegment = segments[segments.length - 1]
  if (merge && isRecord(current[lastSegment]) && isRecord(value)) {
    current[lastSegment] = {
      ...current[lastSegment],
      ...value,
    }
    return
  }

  current[lastSegment] = value
}

function findActionById(actions, actionId) {
  for (const action of asArray(actions)) {
    if (isRecord(action) && typeof action.id === 'string' && action.id === actionId) {
      return action
    }
  }
  return null
}

function resolveNodeActions(options, nodeId) {
  if (!isRecord(options.nodeActions)) {
    return []
  }
  return asArray(options.nodeActions[nodeId])
}

function resolveActionReference(actionRef, nodeId, options) {
  if (typeof actionRef === 'string') {
    return (
      findActionById(resolveNodeActions(options, nodeId), actionRef) ||
      findActionById(options.pageActions, actionRef) ||
      findActionById(options.projectActions, actionRef)
    )
  }

  if (!isRefAction(actionRef)) {
    return null
  }

  const scope = typeof actionRef.scope === 'string' ? actionRef.scope : 'global'
  if (scope === 'node') {
    const targetNodeId = toStringValue(actionRef.nodeId, nodeId)
    return findActionById(resolveNodeActions(options, targetNodeId), actionRef.id)
  }

  if (scope === 'page') {
    if (actionRef.pageId && actionRef.pageId !== options.pageId) {
      return null
    }
    return findActionById(options.pageActions, actionRef.id)
  }

  return findActionById(options.projectActions, actionRef.id)
}

function resolveApiDefinition(options, apiId) {
  if (!apiId) {
    return null
  }
  for (const api of asArray(options.projectApis)) {
    if (isRecord(api) && typeof api.id === 'string' && api.id === apiId) {
      return api
    }
  }
  return null
}

async function executeBuiltInAction(action, scope, options, runtimeState, nodeId) {
  const actionType = toStringValue(action.type)
  const payload = isRecord(action.payload) ? action.payload : {}

  switch (actionType) {
    case 'setState': {
      const path = toStringValue(payload.path || action.path)
      if (!path) {
        break
      }
      const rawValue = payload.value !== undefined ? payload.value : action.value
      const nextValue = resolveValue(rawValue, scope)
      setByPath(runtimeState, path, nextValue, Boolean(payload.merge))
      break
    }
    case 'navigate': {
      const rawPath = resolveValue(payload.path !== undefined ? payload.path : action.path, scope)
      const targetPath = toStringValue(rawPath)
      if (!targetPath) {
        break
      }
      const mode = toStringValue(payload.mode, 'push')
      if (options.router && mode === 'replace' && typeof options.router.replace === 'function') {
        await Promise.resolve(options.router.replace(targetPath))
        break
      }
      if (options.router && typeof options.router.push === 'function') {
        await Promise.resolve(options.router.push(targetPath))
        break
      }
      if (typeof window !== 'undefined' && window.history) {
        if (mode === 'replace') {
          window.history.replaceState({}, '', targetPath)
        } else {
          window.history.pushState({}, '', targetPath)
        }
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
      break
    }
    case 'openUrl': {
      const rawUrl = resolveValue(payload.url !== undefined ? payload.url : action.url, scope)
      const targetUrl = toStringValue(rawUrl)
      if (!targetUrl || typeof window === 'undefined' || typeof window.open !== 'function') {
        break
      }
      const target = toStringValue(payload.target, '_blank')
      const features = toStringValue(payload.features, '')
      window.open(targetUrl, target, features)
      break
    }
    case 'showToast': {
      const rawMessage = resolveValue(payload.message !== undefined ? payload.message : action.message, scope)
      const message = toStringValue(rawMessage)
      if (!message) {
        break
      }
      const toastType = toStringValue(payload.type, 'info')
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('vela:toast', {
            detail: {
              message,
              type: toastType,
              duration: payload.duration,
            },
          }),
        )
      }
      console.info('[GeneratedToast]', toastType, message)
      break
    }
    case 'showDialog': {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('vela:dialog:open', {
            detail: {
              dialogId: payload.dialogId,
              title: resolveValue(payload.title, scope),
              content: resolveValue(payload.content, scope),
              data: resolveValue(payload.data, scope),
            },
          }),
        )
      }
      break
    }
    case 'closeDialog': {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('vela:dialog:close', {
            detail: {
              dialogId: payload.dialogId,
              result: resolveValue(payload.result, scope),
            },
          }),
        )
      }
      break
    }
    case 'emit': {
      const eventName = toStringValue(payload.event)
      if (!eventName || typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') {
        break
      }
      const eventData = resolveValue(payload.data, scope)
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }))
      break
    }
    case 'runScript': {
      const code = toStringValue(payload.code !== undefined ? payload.code : action.code)
      if (!code) {
        break
      }
      try {
        const runner = new Function('context', code)
        const result = runner(scope)
        if (isPromiseLike(result)) {
          await result
        }
      } catch (error) {
        console.error('[GeneratedAction] runScript failed', error)
        throw error
      }
      break
    }
    case 'callMethod': {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('vela:call-method', {
            detail: {
              targetRef: payload.targetRef,
              method: payload.method,
              args: resolveValue(payload.args, scope),
            },
          }),
        )
      }
      break
    }
    case 'callApi': {
      if (typeof fetch !== 'function') {
        break
      }
      const apiId = toStringValue(payload.apiId)
      const apiDefinition = resolveApiDefinition(options, apiId)
      const endpointInput = payload.url !== undefined ? payload.url : apiDefinition && apiDefinition.url ? apiDefinition.url : apiId
      const endpoint = toStringValue(resolveValue(endpointInput, scope))
      if (!endpoint) {
        break
      }
      const method = toStringValue(payload.method || (apiDefinition && apiDefinition.method), 'GET').toUpperCase()
      const requestBody = resolveValue(payload.body, scope)
      const requestInit = { method }
      if (requestBody !== undefined && method !== 'GET' && method !== 'HEAD') {
        requestInit.headers = {
          'Content-Type': 'application/json',
        }
        requestInit.body = JSON.stringify(requestBody)
      }
      const response = await fetch(endpoint, requestInit)
      const contentType = response.headers.get('content-type') || ''
      const result = contentType.includes('application/json')
        ? await response.json()
        : await response.text()
      const resultPath = toStringValue(payload.resultPath)
      if (resultPath) {
        setByPath(runtimeState, resultPath, result, false)
      }
      break
    }
    default: {
      console.warn('[GeneratedAction] unsupported action type', actionType, action)
      break
    }
  }

  if (action.next !== undefined) {
    await executeAction(action.next, scope, options, runtimeState, nodeId)
  }
}

async function executeInlineAction(action, scope) {
  try {
    const runner = new Function('context', action.code)
    const result = runner(scope)
    if (isPromiseLike(result)) {
      await result
    }
  } catch (error) {
    console.error('[GeneratedAction] inline action failed', error)
  }
}

function toActionArray(callbackRef) {
  if (callbackRef === undefined || callbackRef === null) {
    return []
  }
  return Array.isArray(callbackRef) ? callbackRef : [callbackRef]
}

async function executeActionCallback(callbackRef, scope, options, runtimeState, nodeId) {
  const callbacks = toActionArray(callbackRef)
  for (const callbackAction of callbacks) {
    await executeAction(callbackAction, scope, options, runtimeState, nodeId)
  }
}

function getRuntimeMeta(runtimeState) {
  if (!isRecord(runtimeState.__actionRuntimeMeta)) {
    runtimeState.__actionRuntimeMeta = {
      throttleMap: {},
      debounceMap: {},
    }
  }
  return runtimeState.__actionRuntimeMeta
}

function resolveActionKey(action, nodeId) {
  const actionId = isRecord(action) && typeof action.id === 'string' && action.id
    ? action.id
    : 'anonymous'
  return nodeId + ':' + actionId
}

function shouldSkipByThrottle(action, actionKey, runtimeMeta) {
  const throttleMs = Number(action.throttle)
  if (!Number.isFinite(throttleMs) || throttleMs <= 0) {
    return false
  }
  if (!isRecord(runtimeMeta.throttleMap)) {
    runtimeMeta.throttleMap = {}
  }
  const now = Date.now()
  const lastTime = Number(runtimeMeta.throttleMap[actionKey] || 0)
  if (now - lastTime < throttleMs) {
    return true
  }
  runtimeMeta.throttleMap[actionKey] = now
  return false
}

function scheduleDebouncedAction(actionKey, debounceMs, runtimeMeta, task) {
  if (!isRecord(runtimeMeta.debounceMap)) {
    runtimeMeta.debounceMap = {}
  }
  const debounceMap = runtimeMeta.debounceMap

  return new Promise((resolve, reject) => {
    const pending = debounceMap[actionKey]
    if (pending && pending.timerId !== undefined) {
      clearTimeout(pending.timerId)
      if (typeof pending.resolve === 'function') {
        pending.resolve()
      }
    }

    let settled = false
    const safeResolve = () => {
      if (!settled) {
        settled = true
        resolve(undefined)
      }
    }
    const safeReject = (error) => {
      if (!settled) {
        settled = true
        reject(error)
      }
    }

    const timerId = setTimeout(async () => {
      delete debounceMap[actionKey]
      try {
        await task()
        safeResolve()
      } catch (error) {
        safeReject(error)
      }
    }, debounceMs)

    debounceMap[actionKey] = {
      timerId,
      resolve: safeResolve,
    }
  })
}

function shouldExecuteByConfirm(action, scope) {
  const confirmConfig = isRecord(action.confirm) ? action.confirm : null
  if (!confirmConfig) {
    return true
  }

  const defaultMessage = 'Do you want to execute this action?'
  const messageValue = resolveValue(
    confirmConfig.message !== undefined ? confirmConfig.message : defaultMessage,
    scope,
  )
  const message = toStringValue(messageValue, defaultMessage)

  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return Boolean(window.confirm(message))
  }

  return true
}

async function executeResolvedAction(action, scope, options, runtimeState, nodeId) {
  if (action.condition !== undefined) {
    const condition = resolveValue(action.condition, scope)
    if (!condition) {
      return
    }
  }

  if (!shouldExecuteByConfirm(action, scope)) {
    return
  }

  const delayMs = Number(action.delay)
  if (Number.isFinite(delayMs) && delayMs > 0) {
    await wait(delayMs)
  }

  const runtimeMeta = getRuntimeMeta(runtimeState)
  const actionKey = resolveActionKey(action, nodeId)

  if (shouldSkipByThrottle(action, actionKey, runtimeMeta)) {
    return
  }

  const runWithHandlers = async () => {
    await executeActionCallback(action.handlers && action.handlers.loading, scope, options, runtimeState, nodeId)

    let actionError
    try {
      await executeBuiltInAction(action, scope, options, runtimeState, nodeId)
      await executeActionCallback(action.handlers && action.handlers.success, scope, options, runtimeState, nodeId)
    } catch (error) {
      actionError = error
      await executeActionCallback(action.handlers && action.handlers.fail, scope, options, runtimeState, nodeId)
    } finally {
      await executeActionCallback(action.handlers && action.handlers.complete, scope, options, runtimeState, nodeId)
    }

    if (actionError) {
      console.error('[GeneratedAction] action failed', actionError)
    }
  }

  const debounceMs = Number(action.debounce)
  if (Number.isFinite(debounceMs) && debounceMs > 0) {
    await scheduleDebouncedAction(actionKey, debounceMs, runtimeMeta, runWithHandlers)
    return
  }

  await runWithHandlers()
}

async function executeAction(actionLike, scope, options, runtimeState, nodeId) {
  if (actionLike === undefined || actionLike === null) {
    return
  }

  if (isInlineAction(actionLike)) {
    await executeInlineAction(actionLike, scope)
    return
  }

  const action = isRefAction(actionLike) || typeof actionLike === 'string'
    ? resolveActionReference(actionLike, nodeId, options)
    : isRecord(actionLike)
      ? actionLike
      : null

  if (!action) {
    return
  }

  await executeResolvedAction(action, scope, options, runtimeState, nodeId)
}

export function createActionExecutor(options) {
  const runtimeState = {}

  async function onNodeEvent(nodeId, eventName, event) {
    if (!nodeId || !eventName) {
      return
    }
    const nodeEventMap = isRecord(options.nodeEvents) ? options.nodeEvents[nodeId] : undefined
    const actionList = isRecord(nodeEventMap) ? asArray(nodeEventMap[eventName]) : []
    if (actionList.length === 0) {
      return
    }

    const scope = {
      state: runtimeState,
      nodeId,
      pageId: options.pageId,
      eventName,
      event,
      timestamp: Date.now(),
      window: typeof window !== 'undefined' ? window : undefined,
    }

    for (const actionLike of actionList) {
      await executeAction(actionLike, scope, options, runtimeState, nodeId)
    }
  }

  return {
    onNodeEvent,
    runtimeState,
  }
}
`
}

function createIndexHtml(projectName: string, language: VueEmitterOptions['language']): string {
  const entryExt = language === 'ts' ? 'ts' : 'js'
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${entryExt}"></script>
  </body>
</html>
`
}

function createPackageJson(projectName: string, options: VueEmitterOptions): string {
  const dependencies: Record<string, string> = {
    vue: '^3.5.22',
    'vue-router': '^4.6.3',
    pinia: '^2.3.1',
    'element-plus': '^2.13.1',
    '@vela/ui': '^1.0.0',
  }

  const devDependencies: Record<string, string> = {
    vite: '^5.4.0',
    '@vitejs/plugin-vue': '^5.2.4',
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: options.language === 'ts' ? 'vue-tsc --noEmit && vite build' : 'vite build',
    preview: 'vite preview',
  }

  if (options.language === 'ts') {
    devDependencies.typescript = '^5.9.0'
    devDependencies['vue-tsc'] = '^2.2.12'
    scripts['type-check'] = 'vue-tsc --noEmit'
  }

  if (options.lint) {
    devDependencies.eslint = '^9.0.0'
    devDependencies['@eslint/js'] = '^9.0.0'
    devDependencies['eslint-plugin-vue'] = '^10.0.0'
    devDependencies.prettier = '^3.0.0'
    scripts.lint = 'eslint .'
    scripts.format = 'prettier --write .'
  }

  return `${JSON.stringify(
    {
      name: sanitizeProjectName(projectName),
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts,
      dependencies,
      devDependencies,
    },
    null,
    2,
  )}\n`
}

function createViteConfig(): string {
  return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
`
}

function createMainEntry(language: VueEmitterOptions['language']): string {
  const typed = language === 'ts'
  const appType = typed ? 'const app = createApp(App)' : 'const app = createApp(App)'

  return `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@vela/ui/dist/style.css'
import App from './App.vue'
import router from './router'
import './styles/global.css'

${appType}
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
`
}

function createRouterFile(descriptors: VuePageDescriptor[]): string {
  const routeDescriptors = descriptors.filter((descriptor) => descriptor.routePath)
  const imports = routeDescriptors
    .map(
      (descriptor) => `import ${descriptor.componentName} from '../pages/${descriptor.fileName}'`,
    )
    .join('\n')

  const hasRootRoute = routeDescriptors.some((descriptor) => descriptor.routePath === '/')
  const firstRoute = routeDescriptors[0]?.routePath

  const routeLines = routeDescriptors
    .map(
      (descriptor) =>
        `  { path: '${descriptor.routePath}', name: '${descriptor.componentName}', component: ${descriptor.componentName} },`,
    )
    .join('\n')

  const fallbackRoute =
    routeDescriptors.length === 0
      ? `  {
    path: '/:pathMatch(.*)*',
    name: 'NoRoutePage',
    component: { template: '<div style="padding:24px;color:#6b7280;">No route pages are defined.</div>' },
  },`
      : ''

  const redirectRoute =
    routeDescriptors.length > 0 && !hasRootRoute && firstRoute
      ? `  { path: '/', redirect: '${firstRoute}' },\n`
      : ''

  return `${imports ? `${imports}\n\n` : ''}import { createRouter, createWebHistory } from 'vue-router'

const routes = [
${redirectRoute}${routeLines}${routeLines && fallbackRoute ? '\n' : ''}${fallbackRoute}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
`
}

function createAppFile(): string {
  return `<template>
  <router-view />
</template>
`
}

function createGlobalStyles(): string {
  return `* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
  background: #f8fafc;
}
`
}

function createTsConfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        jsx: 'preserve',
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        lib: ['ESNext', 'DOM'],
        skipLibCheck: true,
        types: ['vite/client'],
      },
      include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.vue'],
    },
    null,
    2,
  )}\n`
}

function createEnvDts(): string {
  return '/// <reference types="vite/client" />\n'
}

function createEslintConfig(options: VueEmitterOptions): string {
  if (options.language === 'ts') {
    return `import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]
`
  }

  return `import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]
`
}

function createPrettierConfig(): string {
  return `${JSON.stringify(
    {
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
    },
    null,
    2,
  )}\n`
}

export function emitVueProject(project: IRProject, options: VueEmitterOptions): VueEmitterResult {
  const diagnostics: CompileDiagnostic[] = []
  const descriptors = createPageDescriptors(project, options, diagnostics)
  const routePages = descriptors.filter((descriptor) => descriptor.routePath)

  if (routePages.length === 0) {
    diagnostics.push(
      createDiagnostic(
        'warning',
        'ROUTE_PAGE_MISSING',
        'Project has no pages of type "page". Router will render a fallback route only.',
        'pages',
      ),
    )
  }

  const scriptExt = options.language === 'ts' ? 'ts' : 'js'
  const files: Array<{ path: string; content: string }> = [
    { path: 'index.html', content: createIndexHtml(project.name, options.language) },
    { path: 'package.json', content: createPackageJson(project.name, options) },
    { path: `vite.config.${scriptExt}`, content: createViteConfig() },
    { path: `src/main.${scriptExt}`, content: createMainEntry(options.language) },
    { path: `src/router/index.${scriptExt}`, content: createRouterFile(descriptors) },
    {
      path: `src/runtime/actionExecutor.${scriptExt}`,
      content: createActionExecutorRuntime(options.language),
    },
    { path: 'src/App.vue', content: createAppFile() },
    { path: 'src/styles/global.css', content: createGlobalStyles() },
  ]

  if (options.language === 'ts') {
    files.push(
      { path: 'tsconfig.json', content: createTsConfig() },
      { path: 'src/env.d.ts', content: createEnvDts() },
    )
  }

  if (options.lint) {
    files.push(
      { path: 'eslint.config.js', content: createEslintConfig(options) },
      { path: '.prettierrc', content: createPrettierConfig() },
    )
  }

  for (const descriptor of descriptors) {
    files.push({
      path: `src/pages/${descriptor.fileName}`,
      content: descriptor.source,
    })
  }

  return { files, diagnostics }
}
