import type { IRPage, IRProject } from '../../pipeline/ir/ir'
import { createDiagnostic, type CompileDiagnostic } from '../../pipeline/validate/diagnostics'
import { REACT_TAG_MAP, WRAPPER_COMPONENTS, HTML_TAGS } from '@vela/core/contracts'

export interface ReactEmitterOptions {
  typescript: boolean
  cssModules: boolean
  router: 'react-router' | 'tanstack-router'
  stateManagement: 'zustand' | 'jotai' | 'redux' | 'none'
}

export interface ReactEmitterResult {
  files: Array<{ path: string; content: string }>
  diagnostics: CompileDiagnostic[]
}

interface ReactPageDescriptor {
  page: IRPage
  componentName: string
  fileName: string
  routePath?: string
  source: string
}

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
      .replace(/^-+|-+$/g, '') || 'vela-react-project'
  )
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeRoutePath(path: string | undefined, fallbackName: string, index: number): string {
  if (path && path.trim()) {
    return ensureLeadingSlash(path.trim())
  }
  return `/${toKebabCase(fallbackName || `page-${index + 1}`)}`
}

function collectNodeRuntimeMaps(root: IRPage['root']): {
  nodeEvents: Record<string, Record<string, unknown[]>>
  nodeActions: Record<string, unknown[]>
} {
  const nodeEvents: Record<string, Record<string, unknown[]>> = {}
  const nodeActions: Record<string, unknown[]> = {}

  if (!root) {
    return { nodeEvents, nodeActions }
  }

  const walk = (node: NonNullable<IRPage['root']>): void => {
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

function createPageSource(
  descriptor: ReactPageDescriptor,
  projectActions: unknown[],
  projectApis: unknown[],
  typescript: boolean,
): string {
  const header = typescript ? '// @ts-nocheck\n' : ''
  const rootLiteral = descriptor.page.root ? JSON.stringify(descriptor.page.root, null, 2) : 'null'
  const runtimeMaps = collectNodeRuntimeMaps(descriptor.page.root)
  const pageActions = descriptor.page.raw.actions ?? []

  return `${header}import { renderRuntimeNode } from '../runtime/nodeRenderer'
import { createActionExecutor } from '../runtime/actionExecutor'

const pageRoot = ${rootLiteral}
const nodeEvents = ${JSON.stringify(runtimeMaps.nodeEvents, null, 2)}
const nodeActions = ${JSON.stringify(runtimeMaps.nodeActions, null, 2)}
const pageActions = ${JSON.stringify(pageActions, null, 2)}
const projectActions = ${JSON.stringify(projectActions, null, 2)}
const projectApis = ${JSON.stringify(projectApis, null, 2)}
const actionExecutor = createActionExecutor({
  pageId: ${JSON.stringify(descriptor.page.id)},
  nodeEvents,
  nodeActions,
  pageActions,
  projectActions,
  projectApis,
})

export default function ${descriptor.componentName}() {
  const handleNodeEvent = (nodeId, eventName, event) => {
    void actionExecutor.onNodeEvent(nodeId, eventName, event)
  }

  return (
    <div className="generated-page">
      {pageRoot ? renderRuntimeNode(pageRoot, handleNodeEvent) : (
        <div className="empty-page">No root node is defined for this page.</div>
      )}
    </div>
  )
}
`
}

function createPageDescriptors(
  project: IRProject,
  options: ReactEmitterOptions,
): ReactPageDescriptor[] {
  const usedNames = new Set<string>()
  const extension = options.typescript ? 'tsx' : 'jsx'
  const descriptors: ReactPageDescriptor[] = []
  const projectActions = project.raw.logic?.actions ?? []
  const projectApis = project.raw.apis?.definitions ?? []

  project.pages.forEach((page, index) => {
    const baseName = toPascalCase(page.name || `Page${index + 1}`)
    let componentName = baseName
    let suffix = 1
    while (usedNames.has(componentName)) {
      suffix += 1
      componentName = `${baseName}${suffix}`
    }
    usedNames.add(componentName)

    const descriptor: ReactPageDescriptor = {
      page,
      componentName,
      fileName: `${componentName}.${extension}`,
      routePath: page.type === 'page' ? normalizeRoutePath(page.path, page.name, index) : undefined,
      source: '',
    }
    descriptor.source = createPageSource(
      descriptor,
      projectActions,
      projectApis,
      options.typescript,
    )
    descriptors.push(descriptor)
  })

  return descriptors
}

function createIndexHtml(projectName: string, extension: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${extension}"></script>
  </body>
</html>
`
}

function createPackageJson(projectName: string, options: ReactEmitterOptions): string {
  const dependencies: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    '@vela/ui-react': '^1.0.0',
  }

  if (options.router === 'react-router') {
    dependencies['react-router-dom'] = '^6.28.0'
  } else {
    dependencies['@tanstack/react-router'] = '^1.82.0'
  }

  if (options.stateManagement === 'zustand') {
    dependencies.zustand = '^5.0.2'
  } else if (options.stateManagement === 'jotai') {
    dependencies.jotai = '^2.10.3'
  } else if (options.stateManagement === 'redux') {
    dependencies['@reduxjs/toolkit'] = '^2.4.0'
    dependencies['react-redux'] = '^9.2.0'
  }

  const devDependencies: Record<string, string> = {
    vite: '^5.4.0',
    '@vitejs/plugin-react': '^4.3.4',
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: options.typescript ? 'tsc --noEmit && vite build' : 'vite build',
    preview: 'vite preview',
  }

  if (options.typescript) {
    devDependencies.typescript = '^5.9.0'
    devDependencies['@types/react'] = '^18.3.0'
    devDependencies['@types/react-dom'] = '^18.3.0'
    scripts['type-check'] = 'tsc --noEmit'
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
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`
}

function createMainEntry(options: ReactEmitterOptions): string {
  if (options.router === 'tanstack-router') {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')${options.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
`
  }

  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')${options.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
`
}

function createReactRouterApp(descriptors: ReactPageDescriptor[]): string {
  const routePages = descriptors.filter((descriptor) => descriptor.routePath)
  const imports = routePages
    .map(
      (descriptor) =>
        `import ${descriptor.componentName} from './pages/${descriptor.componentName}'`,
    )
    .join('\n')
  const hasRootRoute = routePages.some((descriptor) => descriptor.routePath === '/')
  const firstRoute = routePages[0]?.routePath
  const needsRedirect = routePages.length > 0 && !hasRootRoute && Boolean(firstRoute)

  const routes = routePages
    .map(
      (descriptor) =>
        `        <Route path="${descriptor.routePath}" element={<${descriptor.componentName} />} />`,
    )
    .join('\n')

  const fallbackRoute =
    routePages.length === 0
      ? '        <Route path="*" element={<div className="empty-page">No route pages are defined.</div>} />'
      : ''

  const redirectRoute =
    needsRedirect && firstRoute
      ? `\n        <Route path="/" element={<Navigate to="${firstRoute}" replace />} />`
      : ''

  return `import { Route, Routes${needsRedirect ? ', Navigate' : ''} } from 'react-router-dom'
${imports ? `${imports}\n` : ''}
export default function App() {
  return (
    <Routes>
${routes}${redirectRoute}${fallbackRoute ? `\n${fallbackRoute}` : ''}
    </Routes>
  )
}
`
}

function createTanStackRouterFile(descriptors: ReactPageDescriptor[]): string {
  const routePages = descriptors.filter((descriptor) => descriptor.routePath)

  if (routePages.length === 0) {
    return `import { createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const emptyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div className="empty-page">No route pages are defined.</div>,
})

const routeTree = rootRoute.addChildren([emptyRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
`
  }

  const imports = routePages
    .map(
      (descriptor) =>
        `import ${descriptor.componentName} from '../pages/${descriptor.componentName}'`,
    )
    .join('\n')

  const routeDeclares = routePages
    .map((descriptor) => {
      const routeName = `${descriptor.componentName}Route`
      return `const ${routeName} = createRoute({
  getParentRoute: () => rootRoute,
  path: '${descriptor.routePath}',
  component: ${descriptor.componentName},
})`
    })
    .join('\n\n')

  const routeVars = routePages.map((descriptor) => `${descriptor.componentName}Route`)
  const hasRootRoute = routePages.some((descriptor) => descriptor.routePath === '/')
  const firstRoute = routePages[0]?.routePath
  const needsRedirect = !hasRootRoute && Boolean(firstRoute)

  const indexRouteDeclare =
    needsRedirect && firstRoute
      ? `
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '${firstRoute}' })
  },
})`
      : ''

  const childList = needsRedirect
    ? ['indexRoute', ...routeVars].map((item) => `  ${item},`).join('\n')
    : routeVars.map((item) => `  ${item},`).join('\n')

  return `import { createRoute, createRootRoute, createRouter, Outlet${needsRedirect ? ', redirect' : ''} } from '@tanstack/react-router'
${imports}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

${routeDeclares}${indexRouteDeclare}

const routeTree = rootRoute.addChildren([
${childList}
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
`
}

function createNodeRendererRuntime(typescript: boolean): string {
  const tsNoCheck = typescript ? '// @ts-nocheck\n' : ''

  // Serialize maps from the unified registry so generated code stays in sync
  const wrapperArr = JSON.stringify([...WRAPPER_COMPONENTS])
  const htmlArr = JSON.stringify([...HTML_TAGS])
  const reactMapStr = JSON.stringify(REACT_TAG_MAP, null, 2)

  return `${tsNoCheck}import { createElement } from 'react'
import * as VelaUI from '@vela/ui-react'

const WRAPPER_COMPONENTS = new Set(${wrapperArr})
const HTML_TAGS = new Set(${htmlArr})
const REACT_COMPONENT_MAP = ${reactMapStr}

function isExpressionLike(value) {
  return Boolean(value) && typeof value === 'object' && typeof value.type === 'string' && typeof value.value === 'string'
}

function resolveComponentName(name) {
  if (!name || typeof name !== 'string') {
    return 'div'
  }
  const normalized = name.trim()
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
  return REACT_COMPONENT_MAP[normalized] || normalized
}

function resolveComponent(name) {
  const resolvedName = resolveComponentName(name)
  if (typeof resolvedName !== 'string') {
    return 'div'
  }
  if (HTML_TAGS.has(resolvedName)) {
    return resolvedName
  }
  return VelaUI[resolvedName] || 'div'
}

function toReactStyleKey(key) {
  if (!key || typeof key !== 'string') {
    return key
  }
  if (key.startsWith('--')) {
    return key
  }
  return key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

function buildNodeStyle(node) {
  const style = {}
  const rawStyle = node && node.style && typeof node.style === 'object' ? node.style : {}
  for (const [key, value] of Object.entries(rawStyle)) {
    if (typeof value === 'string' || typeof value === 'number') {
      style[toReactStyleKey(key)] = value
    }
  }

  if (!node || !node.layout) {
    return style
  }

  if (node.layout.mode === 'free') {
    style.position = 'absolute'
    style.left = node.layout.x || 0
    style.top = node.layout.y || 0
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

  if (node.layout.rotate && node.layout.rotate !== 0) {
    const existing = typeof style.transform === 'string' ? style.transform : ''
    if (existing.includes('rotate(')) {
      style.transform = existing
    } else if (existing) {
      style.transform = \`\${existing} rotate(\${node.layout.rotate}deg)\`
    } else {
      style.transform = \`rotate(\${node.layout.rotate}deg)\`
    }
  }

  return style
}

function resolvePropValue(value) {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (isExpressionLike(value)) {
    return value.mock
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolvePropValue(item))
  }
  if (typeof value === 'object') {
    const output = {}
    for (const [key, childValue] of Object.entries(value)) {
      const resolved = resolvePropValue(childValue)
      if (resolved !== undefined) {
        output[key] = resolved
      }
    }
    return output
  }
  return value
}

function resolveProps(rawProps) {
  const props = {}
  if (!rawProps || typeof rawProps !== 'object') {
    return props
  }
  for (const [key, value] of Object.entries(rawProps)) {
    if (key === 'style') {
      continue
    }
    const normalizedKey = key === 'class' ? 'className' : key === 'for' ? 'htmlFor' : key
    const resolved = resolvePropValue(value)
    if (resolved !== undefined) {
      props[normalizedKey] = resolved
    }
  }
  return props
}

function resolveRenderIf(renderIf) {
  if (renderIf === undefined) {
    return true
  }
  if (typeof renderIf === 'boolean') {
    return renderIf
  }
  if (typeof renderIf === 'string') {
    const normalized = renderIf.trim().toLowerCase()
    if (!normalized || normalized === 'false' || normalized === '0' || normalized === 'null' || normalized === 'undefined') {
      return false
    }
    return true
  }
  if (isExpressionLike(renderIf)) {
    if (typeof renderIf.mock === 'boolean') {
      return renderIf.mock
    }
    if (typeof renderIf.mock === 'number') {
      return renderIf.mock !== 0
    }
    if (typeof renderIf.mock === 'string') {
      return Boolean(renderIf.mock)
    }
    return true
  }
  return true
}

function resolveRepeatSource(repeat) {
  if (!repeat || repeat.source === undefined) {
    return null
  }
  if (Array.isArray(repeat.source)) {
    return repeat.source
  }
  if (isExpressionLike(repeat.source) && Array.isArray(repeat.source.mock)) {
    return repeat.source.mock
  }
  return null
}

function toReactEventName(eventName) {
  const map = {
    click: 'onClick',
    mouseenter: 'onMouseEnter',
    mouseleave: 'onMouseLeave',
    mouseover: 'onMouseOver',
    mouseout: 'onMouseOut',
    mousedown: 'onMouseDown',
    mouseup: 'onMouseUp',
    mousemove: 'onMouseMove',
    dblclick: 'onDoubleClick',
    change: 'onChange',
    input: 'onInput',
    submit: 'onSubmit',
    focus: 'onFocus',
    blur: 'onBlur',
    keydown: 'onKeyDown',
    keyup: 'onKeyUp',
    keypress: 'onKeyPress',
    scroll: 'onScroll',
    wheel: 'onWheel',
  }
  return map[String(eventName || '').toLowerCase()] || null
}

function resolveEventProps(events, nodeId, onNodeEvent) {
  const eventProps = {}
  if (!events || typeof events !== 'object') {
    return eventProps
  }

  for (const [eventName, actions] of Object.entries(events)) {
    if (!Array.isArray(actions) || actions.length === 0) {
      continue
    }
    const reactEventName = toReactEventName(eventName)
    if (!reactEventName) {
      continue
    }
    eventProps[reactEventName] = (event) => {
      if (typeof onNodeEvent === 'function') {
        onNodeEvent(nodeId, eventName, event)
      }
    }
  }

  return eventProps
}

function renderNodeElement(node, onNodeEvent, keyOverride) {
  const Component = resolveComponent(node.component)
  const style = buildNodeStyle(node)
  const props = resolveProps(node.props)
  const eventProps = resolveEventProps(node.events, node.id, onNodeEvent)
  const children = []

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const rendered = renderNodeInternal(child, onNodeEvent)
      if (rendered !== null && rendered !== undefined) {
        children.push(rendered)
      }
    }
  }

  if (node.slots && typeof node.slots === 'object') {
    for (const slotChildren of Object.values(node.slots)) {
      if (!Array.isArray(slotChildren)) {
        continue
      }
      for (const child of slotChildren) {
        const rendered = renderNodeInternal(child, onNodeEvent)
        if (rendered !== null && rendered !== undefined) {
          children.push(rendered)
        }
      }
    }
  }

  return createElement(
    Component,
    {
      ...props,
      ...eventProps,
      style,
      key: keyOverride || node.id,
      'data-node-id': node.id,
    },
    ...children,
  )
}

function renderNodeInternal(node, onNodeEvent) {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (!resolveRenderIf(node.renderIf)) {
    return null
  }

  const repeatSource = resolveRepeatSource(node.repeat)
  if (repeatSource && repeatSource.length > 0) {
    return repeatSource.map((_, index) => renderNodeElement(node, onNodeEvent, \`\${node.id}-\${index}\`))
  }

  return renderNodeElement(node, onNodeEvent)
}

export function renderRuntimeNode(node, onNodeEvent) {
  return renderNodeInternal(node, onNodeEvent)
}
`
}

function createActionExecutorRuntime(typescript: boolean): string {
  const tsNoCheck = typescript ? '// @ts-nocheck\n' : ''
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

function createGlobalStyles(): string {
  return `* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
  background: #f8fafc;
}

.generated-page {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.empty-page {
  margin: 24px;
  padding: 24px;
  color: #6b7280;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}
`
}

function createTsConfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        jsx: 'react-jsx',
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
      },
      include: ['src'],
    },
    null,
    2,
  )}\n`
}

function createViteEnvDts(): string {
  return '/// <reference types="vite/client" />\n'
}

export function emitReactProject(
  project: IRProject,
  options: ReactEmitterOptions,
): ReactEmitterResult {
  const diagnostics: CompileDiagnostic[] = []
  const descriptors = createPageDescriptors(project, options)
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

  const extension = options.typescript ? 'tsx' : 'jsx'
  const configExtension = options.typescript ? 'ts' : 'js'
  const files: Array<{ path: string; content: string }> = [
    { path: 'index.html', content: createIndexHtml(project.name, extension) },
    { path: 'package.json', content: createPackageJson(project.name, options) },
    { path: `vite.config.${configExtension}`, content: createViteConfig() },
    { path: `src/main.${extension}`, content: createMainEntry(options) },
    {
      path: `src/App.${extension}`,
      content:
        options.router === 'react-router'
          ? createReactRouterApp(descriptors)
          : 'export default function App() {\n  return null\n}\n',
    },
    {
      path: `src/runtime/nodeRenderer.${extension}`,
      content: createNodeRendererRuntime(options.typescript),
    },
    {
      path: `src/runtime/actionExecutor.${configExtension}`,
      content: createActionExecutorRuntime(options.typescript),
    },
    { path: 'src/index.css', content: createGlobalStyles() },
  ]

  if (options.router === 'tanstack-router') {
    files.push({
      path: `src/router/index.${extension}`,
      content: createTanStackRouterFile(descriptors),
    })
  }

  if (options.typescript) {
    files.push(
      { path: 'tsconfig.json', content: createTsConfig() },
      { path: 'src/vite-env.d.ts', content: createViteEnvDts() },
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
