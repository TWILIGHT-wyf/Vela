import type { IRNode, IRPage, IRProject } from '../../pipeline/ir/ir'
import { createDiagnostic, type CompileDiagnostic } from '../../pipeline/validate/diagnostics'
import { VUE_TAG_MAP, resolveVueComponentTag } from '@vela/core/contracts'
import { buildNodeStyleFromIR } from '../shared/buildStyle'
import { createActionExecutorRuntimeSource } from '../shared/createActionExecutorRuntime'

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

const VUE_LIBRARY_COMPONENTS = new Set(Object.values(VUE_TAG_MAP))

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

function buildVariableDefaultValue(variable: Record<string, unknown>): unknown {
  if (Object.prototype.hasOwnProperty.call(variable, 'defaultValue')) {
    return variable.defaultValue
  }

  switch (variable.type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object': {
      const output: Record<string, unknown> = {}
      const properties =
        variable.properties && typeof variable.properties === 'object'
          ? (variable.properties as Record<string, Record<string, unknown>>)
          : {}
      for (const [key, property] of Object.entries(properties)) {
        output[key] = buildVariableDefaultValue(property)
      }
      return output
    }
    default:
      return null
  }
}

function buildPageStateDefaults(page: IRPage): Record<string, unknown> {
  const pageState = Array.isArray(page.raw.state) ? page.raw.state : []
  const defaults: Record<string, unknown> = {}
  for (const variable of pageState) {
    if (!variable || typeof variable !== 'object' || typeof variable.key !== 'string') {
      continue
    }
    defaults[variable.key] = buildVariableDefaultValue(
      variable as unknown as Record<string, unknown>,
    )
  }
  return defaults
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

function collectVueImports(node: IRNode, collector: Set<string>): void {
  const tag = resolveVueComponentTag(node.component)
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

function toVueStyleAttribute(node: IRNode): string {
  const style = buildNodeStyleFromIR(node)
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
  const tag = resolveVueComponentTag(node.component)
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
  const pageApis = descriptor.page.raw.apis ?? []
  const projectActions = project.raw.logic?.actions ?? []
  const projectApis = project.raw.apis?.definitions ?? []
  const pageStateDefaults = buildPageStateDefaults(descriptor.page)
  const isDialogPage = descriptor.page.type === 'dialog'

  if (descriptor.page.root) {
    collectVueImports(descriptor.page.root, imports)
  }

  const body = descriptor.page.root
    ? renderVueNode(descriptor.page.root, diagnostics, descriptor.page.id, 4)
    : '    <div class="empty-page">No root node is defined for this page.</div>'

  const scriptLines: string[] = []
  const vueImports = new Set<string>(['reactive'])
  if (isDialogPage) {
    vueImports.add('computed')
  }
  scriptLines.push(`import { ${Array.from(vueImports).sort().join(', ')} } from 'vue'`)
  if (imports.size > 0) {
    scriptLines.push(`import { ${Array.from(imports).sort().join(', ')} } from '@vela/ui'`)
  }
  scriptLines.push('')
  if (isDialogPage) {
    scriptLines.push(
      language === 'ts'
        ? `const props = defineProps<{ dialogPayload?: Record<string, unknown> }>()`
        : `const props = defineProps({ dialogPayload: { type: Object, default: () => ({}) } })`,
    )
    scriptLines.push(
      `const initialState = computed(() => ({ ...${JSON.stringify(pageStateDefaults, null, 2)}, ...(props.dialogPayload || {}) }))`,
    )
    scriptLines.push('const state = reactive(initialState.value)')
  } else {
    scriptLines.push(`const initialState = ${JSON.stringify(pageStateDefaults, null, 2)}`)
    scriptLines.push('const state = reactive(initialState)')
  }
  if (hasEvents) {
    scriptLines.push("import { useRouter } from 'vue-router'")
    scriptLines.push("import { createActionExecutor } from '../runtime/actionExecutor'")
    scriptLines.push('')
    scriptLines.push(`const nodeEvents = ${JSON.stringify(runtimeMaps.nodeEvents, null, 2)}`)
    scriptLines.push(`const nodeActions = ${JSON.stringify(runtimeMaps.nodeActions, null, 2)}`)
    scriptLines.push(`const pageActions = ${JSON.stringify(pageActions, null, 2)}`)
    scriptLines.push(`const pageApis = ${JSON.stringify(pageApis, null, 2)}`)
    scriptLines.push(`const projectActions = ${JSON.stringify(projectActions, null, 2)}`)
    scriptLines.push(`const projectApis = ${JSON.stringify(projectApis, null, 2)}`)
    scriptLines.push('')
    scriptLines.push('const router = useRouter()')
    scriptLines.push('const { onNodeEvent } = createActionExecutor({')
    scriptLines.push(`  pageId: ${JSON.stringify(descriptor.page.id)},`)
    scriptLines.push('  nodeEvents,')
    scriptLines.push('  nodeActions,')
    scriptLines.push('  pageActions,')
    scriptLines.push('  pageApis,')
    scriptLines.push('  projectActions,')
    scriptLines.push('  projectApis,')
    scriptLines.push('  runtimeState: state,')
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
  return createActionExecutorRuntimeSource({
    typescript: language === 'ts',
  })
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

function createDialogHostFile(descriptors: VuePageDescriptor[]): string {
  const dialogDescriptors = descriptors.filter((descriptor) => descriptor.page.type === 'dialog')
  const imports = dialogDescriptors
    .map(
      (descriptor) => `import ${descriptor.componentName} from '../pages/${descriptor.fileName}'`,
    )
    .join('\n')

  const registryEntries = dialogDescriptors
    .map((descriptor) => {
      const dialogConfig =
        descriptor.page.raw.type === 'dialog' ? (descriptor.page.raw.dialogConfig ?? {}) : {}
      const dialogTitle = descriptor.page.raw.title || descriptor.page.name
      return `  ${JSON.stringify(descriptor.page.id)}: {
    component: ${descriptor.componentName},
    title: ${JSON.stringify(dialogTitle)},
    config: ${JSON.stringify(dialogConfig, null, 2)},
  },`
    })
    .join('\n')

  return `<template>
  <template v-for="entry in activeDialogs" :key="entry.requestId">
    <el-dialog
      v-model="entry.visible"
      :title="entry.title"
      :width="entry.width"
      :show-close="entry.closable"
      :modal="entry.mask"
      :close-on-click-modal="entry.maskClosable"
      :destroy-on-close="true"
      @close="handleDialogClose(entry)"
      @closed="handleDialogClosed(entry)"
    >
      <component :is="entry.component" :dialog-payload="entry.data" />
    </el-dialog>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
${imports}

type DialogRegistryEntry = {
  component: unknown
  title: string
  config: {
    width?: string | number
    height?: string | number
    closable?: boolean
    mask?: boolean
    maskClosable?: boolean
  }
}

type ActiveDialogEntry = {
  dialogId: string
  requestId: string
  title: string
  component: unknown
  data: Record<string, unknown>
  result: unknown
  visible: boolean
  width?: string | number
  height?: string | number
  closable: boolean
  mask: boolean
  maskClosable: boolean
}

const dialogRegistry: Record<string, DialogRegistryEntry> = {
${registryEntries}
}

const activeDialogs = ref<ActiveDialogEntry[]>([])

function removeDialog(requestId: string) {
  activeDialogs.value = activeDialogs.value.filter((entry) => entry.requestId !== requestId)
}

function openDialog(detail: Record<string, unknown>) {
  const dialogId = typeof detail.dialogId === 'string' ? detail.dialogId : ''
  if (!dialogId || !dialogRegistry[dialogId]) return

  const registryEntry = dialogRegistry[dialogId]
  const requestId =
    typeof detail.requestId === 'string' && detail.requestId ? detail.requestId : \`dlg_\${Date.now()}\`

  const existingEntry = activeDialogs.value.find((entry) => entry.requestId === requestId)
  if (existingEntry) {
    existingEntry.visible = true
    existingEntry.data = typeof detail.data === 'object' && detail.data !== null ? (detail.data as Record<string, unknown>) : {}
    existingEntry.result = undefined
    return
  }

  activeDialogs.value.push({
    dialogId,
    requestId,
    title: typeof detail.title === 'string' && detail.title ? detail.title : registryEntry.title,
    component: registryEntry.component,
    data: typeof detail.data === 'object' && detail.data !== null ? (detail.data as Record<string, unknown>) : {},
    result: undefined,
    visible: true,
    width: registryEntry.config.width,
    height: registryEntry.config.height,
    closable: registryEntry.config.closable !== false,
    mask: registryEntry.config.mask !== false,
    maskClosable: registryEntry.config.maskClosable !== false,
  })
}

function handleDialogClose(entry: ActiveDialogEntry) {
  entry.visible = false
}

function handleDialogClosed(entry: ActiveDialogEntry) {
  window.dispatchEvent(
    new CustomEvent('vela:dialog:closed', {
      detail: {
        dialogId: entry.dialogId,
        requestId: entry.requestId,
        data: entry.data,
        result: entry.result,
      },
    }),
  )
  removeDialog(entry.requestId)
}

function onDialogOpen(event: Event) {
  const customEvent = event as CustomEvent<Record<string, unknown>>
  openDialog(customEvent.detail || {})
}

function onDialogClose(event: Event) {
  const customEvent = event as CustomEvent<Record<string, unknown>>
  const detail = customEvent.detail || {}
  const dialogId = typeof detail.dialogId === 'string' ? detail.dialogId : ''
  const requestId = typeof detail.requestId === 'string' ? detail.requestId : ''
  const targetEntry = requestId
    ? activeDialogs.value.find((entry) => entry.requestId === requestId)
    : [...activeDialogs.value].reverse().find((entry) => entry.dialogId === dialogId)
  if (!targetEntry) return
  targetEntry.result = detail.result
  targetEntry.visible = false
}

if (typeof window !== 'undefined') {
  window.addEventListener('vela:dialog:open', onDialogOpen)
  window.addEventListener('vela:dialog:close', onDialogClose)
}
</script>
`
}

function createAppFile(hasDialogPages: boolean): string {
  if (!hasDialogPages) {
    return `<template>
  <router-view />
</template>
`
  }

  return `<template>
  <router-view />
  <DialogHost />
</template>

<script setup lang="ts">
import DialogHost from './components/DialogHost.vue'
</script>
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
  const hasDialogPages = descriptors.some((descriptor) => descriptor.page.type === 'dialog')

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
    { path: 'src/App.vue', content: createAppFile(hasDialogPages) },
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

  if (hasDialogPages) {
    files.push({
      path: 'src/components/DialogHost.vue',
      content: createDialogHostFile(descriptors),
    })
  }

  return { files, diagnostics }
}
