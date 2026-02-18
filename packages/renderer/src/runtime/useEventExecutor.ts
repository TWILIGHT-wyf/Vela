import { type Ref, type ComputedRef, onUnmounted } from 'vue'
import { type Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { AnyActionSchema, NodeSchema } from '@vela/core'
import type { Page } from '../types'

type UnknownRecord = Record<string, unknown>

interface RuntimePage extends Page {
  actions?: AnyActionSchema[]
}

interface ActionRecord extends UnknownRecord {
  id?: string
  type: string
}

interface RefActionRecord extends UnknownRecord {
  type: 'ref'
  id: string
  scope?: 'global' | 'page' | 'node'
  pageId?: string
  nodeId?: string
}

interface InlineActionRecord extends UnknownRecord {
  type: 'inline'
  code: string
}

export interface EventExecutorContext {
  components: Ref<NodeSchema[]> | ComputedRef<NodeSchema[]>
  pages: Ref<Page[]> | ComputedRef<Page[]>
  isProjectMode: Ref<boolean> | ComputedRef<boolean>
  router: Router
  onNavigate?: (pageId: string) => void
}

const HIGHLIGHT_CLASS = 'editor-highlight-active'
const HIGHLIGHT_DURATION = 2000
const STYLE_ID = 'editor-event-executor-styles'

const HIGHLIGHT_STYLES = `
  @keyframes editor-highlight-pulse {
    0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7); }
    50% { box-shadow: 0 0 0 12px rgba(64, 158, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
  }

  @keyframes editor-highlight-border {
    0%, 100% { border-color: rgba(64, 158, 255, 0.8); }
    50% { border-color: rgba(64, 158, 255, 0.3); }
  }

  .${HIGHLIGHT_CLASS} {
    position: relative;
    animation: editor-highlight-pulse 1s ease-in-out infinite;
    outline: 3px solid rgba(64, 158, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
    z-index: 9999;
  }

  .${HIGHLIGHT_CLASS}::before {
    content: '';
    position: absolute;
    inset: -6px;
    border: 2px dashed rgba(64, 158, 255, 0.6);
    border-radius: 8px;
    animation: editor-highlight-border 1s ease-in-out infinite;
    pointer-events: none;
  }
`

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function isActionRecord(value: unknown): value is ActionRecord {
  return isRecord(value) && typeof value.type === 'string'
}

function isRefAction(value: unknown): value is RefActionRecord {
  return isRecord(value) && value.type === 'ref' && typeof value.id === 'string'
}

function isInlineAction(value: unknown): value is InlineActionRecord {
  return isRecord(value) && value.type === 'inline' && typeof value.code === 'string'
}

function isExpressionLike(
  value: unknown,
): value is { type: string; value: string; mock?: unknown } {
  return isRecord(value) && typeof value.type === 'string' && typeof value.value === 'string'
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return fallback
  return String(value)
}

function normalizeActionType(type: string): string {
  const normalized = type.trim()
  switch (normalized) {
    case 'alert':
      return 'showToast'
    case 'show-tooltip':
      return 'showToast'
    case 'customScript':
    case 'custom-script':
      return 'runScript'
    case 'updateState':
      return 'setState'
    case 'navigate-page':
      return 'navigate'
    default:
      return normalized
  }
}

function resolveExpression(
  input: { value: string; mock?: unknown },
  scope: UnknownRecord,
): unknown {
  if (input.mock !== undefined) {
    return input.mock
  }

  try {
    const keys = Object.keys(scope)
    const values = keys.map((key) => scope[key])
    const evaluator = new Function(...keys, `return (${input.value})`)
    return evaluator(...values)
  } catch (error) {
    console.warn('[RuntimeEventExecutor] expression evaluation failed', error)
    return undefined
  }
}

function resolveValue(input: unknown, scope: UnknownRecord): unknown {
  if (isExpressionLike(input)) {
    return resolveExpression(input, scope)
  }
  if (Array.isArray(input)) {
    return input.map((item) => resolveValue(item, scope))
  }
  if (isRecord(input)) {
    const output: UnknownRecord = {}
    for (const [key, value] of Object.entries(input)) {
      output[key] = resolveValue(value, scope)
    }
    return output
  }
  return input
}

function setByPath(target: unknown, path: string, value: unknown, merge: boolean): void {
  if (!isRecord(target)) {
    return
  }

  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (segments.length === 0) {
    return
  }

  let current: UnknownRecord = target
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    if (!isRecord(current[segment])) {
      current[segment] = {}
    }
    current = current[segment] as UnknownRecord
  }

  const lastSegment = segments[segments.length - 1]
  if (merge && isRecord(current[lastSegment]) && isRecord(value)) {
    current[lastSegment] = {
      ...(current[lastSegment] as UnknownRecord),
      ...value,
    }
    return
  }

  current[lastSegment] = value
}

function injectHighlightStyles(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(STYLE_ID)) return

  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = HIGHLIGHT_STYLES
  document.head.appendChild(styleEl)
}

function removeHighlightStyles(): void {
  if (typeof document === 'undefined') {
    return
  }
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }
}

function getNodeElement(componentId: string): HTMLElement | null {
  if (!componentId || typeof document === 'undefined') return null

  const selectors = [
    `[data-component-id="${componentId}"]`,
    `[data-id="${componentId}"]`,
    `[data-node-id="${componentId}"]`,
    `#${componentId}`,
  ]

  for (const selector of selectors) {
    try {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    } catch {
      // ignore invalid selector
    }
  }
  return null
}

function executeScript(code: string, scope: UnknownRecord): Promise<void> {
  try {
    const runner = new Function('context', code)
    const result = runner(scope) as unknown
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      return Promise.resolve(result as PromiseLike<unknown>).then(() => undefined)
    }
    return Promise.resolve()
  } catch (error) {
    console.warn('[RuntimeEventExecutor] script execution failed', error)
    return Promise.resolve()
  }
}

function findActionById(actions: unknown[], actionId: string): ActionRecord | null {
  for (const action of actions) {
    if (isActionRecord(action) && typeof action.id === 'string' && action.id === actionId) {
      return action
    }
  }
  return null
}

function extractPayload(action: ActionRecord): UnknownRecord {
  return isRecord(action.payload) ? (action.payload as UnknownRecord) : {}
}

export function useEventExecutor(context: EventExecutorContext) {
  const { components, pages, isProjectMode, router, onNavigate } = context

  const highlightTimers = new Map<string, number>()
  const runtimeState: UnknownRecord = {}

  injectHighlightStyles()

  onUnmounted(() => {
    highlightTimers.forEach((timer) => clearTimeout(timer))
    highlightTimers.clear()
    removeHighlightStyles()
  })

  function findComponentById(componentId: string): NodeSchema | undefined {
    return components.value.find((component) => component.id === componentId)
  }

  function resolveNodeActions(nodeId: string): unknown[] {
    return asArray<unknown>(findComponentById(nodeId)?.actions)
  }

  function resolvePageActions(pageId?: string): unknown[] {
    const runtimePages = pages.value as RuntimePage[]
    if (pageId) {
      const page = runtimePages.find((item) => item.id === pageId)
      return asArray<unknown>(page?.actions)
    }
    return runtimePages.flatMap((item) => asArray<unknown>(item.actions))
  }

  function resolveActionReference(
    actionRef: string | RefActionRecord,
    nodeId: string,
  ): ActionRecord | null {
    if (typeof actionRef === 'string') {
      return (
        findActionById(resolveNodeActions(nodeId), actionRef) ||
        findActionById(resolvePageActions(), actionRef)
      )
    }

    const scope = actionRef.scope || 'global'
    if (scope === 'node') {
      const targetNodeId = toStringValue(actionRef.nodeId, nodeId)
      return findActionById(resolveNodeActions(targetNodeId), actionRef.id)
    }
    if (scope === 'page') {
      return findActionById(resolvePageActions(actionRef.pageId), actionRef.id)
    }

    return findActionById(resolvePageActions(), actionRef.id)
  }

  function resolveActionInput(
    actionLike: unknown,
    nodeId: string,
  ): ActionRecord | InlineActionRecord | null {
    if (typeof actionLike === 'string' || isRefAction(actionLike)) {
      return resolveActionReference(actionLike, nodeId)
    }
    if (isInlineAction(actionLike)) {
      return actionLike
    }
    if (isActionRecord(actionLike)) {
      return actionLike
    }
    return null
  }

  function createScope(sourceNode?: NodeSchema, event?: Event): UnknownRecord {
    return {
      state: runtimeState,
      component: sourceNode,
      components: components.value,
      pages: pages.value,
      event,
      timestamp: Date.now(),
      window: typeof window !== 'undefined' ? window : undefined,
    }
  }

  async function executeActionLike(
    actionLike: unknown,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
  ): Promise<void> {
    const resolved = resolveActionInput(actionLike, nodeId)
    if (!resolved) {
      return
    }
    await executeResolvedAction(resolved, sourceNode, nodeId, event)
  }

  async function executeResolvedAction(
    action: ActionRecord | InlineActionRecord,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
  ): Promise<void> {
    if (isInlineAction(action)) {
      await executeScript(action.code, createScope(sourceNode, event))
      return
    }

    const delay = Number(action.delay)
    if (Number.isFinite(delay) && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const actionType = normalizeActionType(action.type)

    switch (actionType) {
      case 'setState':
        handleSetState(action, sourceNode, event)
        break
      case 'navigate':
        await handleNavigate(action)
        break
      case 'openUrl':
        handleOpenUrl(action, sourceNode, event)
        break
      case 'showToast':
        handleShowToast(action, sourceNode, event)
        break
      case 'runScript':
        await handleRunScript(action, sourceNode, event)
        break
      case 'callApi':
        await handleCallApi(action, sourceNode, event)
        break
      case 'emit':
        handleEmit(action, sourceNode, event)
        break
      case 'showDialog':
        dispatchRuntimeEvent('vela:dialog:open', {
          dialogId: extractPayload(action).dialogId,
          title: resolveValue(extractPayload(action).title, createScope(sourceNode, event)),
          content: resolveValue(extractPayload(action).content, createScope(sourceNode, event)),
          data: resolveValue(extractPayload(action).data, createScope(sourceNode, event)),
        })
        break
      case 'closeDialog':
        dispatchRuntimeEvent('vela:dialog:close', {
          dialogId: extractPayload(action).dialogId,
          result: resolveValue(extractPayload(action).result, createScope(sourceNode, event)),
        })
        break
      case 'callMethod':
        dispatchRuntimeEvent('vela:call-method', {
          targetRef: extractPayload(action).targetRef,
          method: extractPayload(action).method,
          args: resolveValue(extractPayload(action).args, createScope(sourceNode, event)),
        })
        break
      case 'toggle-visibility':
        handleToggleVisibility(action)
        break
      case 'scroll-to':
        handleScrollTo(action)
        break
      case 'fullscreen':
        handleFullscreen(action)
        break
      case 'play-animation':
        handlePlayAnimation(action)
        break
      case 'highlight':
        handleHighlight(action)
        break
      case 'refresh-data':
        handleRefreshData(action, sourceNode)
        break
      default:
        console.warn('[RuntimeEventExecutor] unsupported action type:', action.type)
    }

    if (action.next !== undefined) {
      await executeActionLike(action.next, sourceNode, nodeId, event)
    }
  }

  function getTargetNode(action: ActionRecord, sourceNode?: NodeSchema): NodeSchema | undefined {
    const payload = extractPayload(action)
    const targetId = toStringValue(payload.targetId ?? action.targetId, sourceNode?.id || '')
    if (!targetId) {
      return sourceNode
    }
    return findComponentById(targetId) || sourceNode
  }

  function handleSetState(action: ActionRecord, sourceNode?: NodeSchema, event?: Event): void {
    const payload = extractPayload(action)
    const path = toStringValue(payload.path ?? action.path ?? payload.stateName, '')
    if (!path) {
      return
    }

    const scope = createScope(sourceNode, event)
    const rawValue = payload.value !== undefined ? payload.value : action.value
    const resolvedValue = resolveValue(rawValue, scope)
    const merge = Boolean(payload.merge)
    const target = getTargetNode(action, sourceNode)

    const writesToNode =
      path.startsWith('props.') ||
      path.startsWith('style.') ||
      path.startsWith('state.') ||
      path.startsWith('dataSource.')

    if (writesToNode && target) {
      setByPath(target, path, resolvedValue, merge)
      return
    }

    setByPath(runtimeState, path, resolvedValue, merge)
  }

  async function handleNavigate(action: ActionRecord): Promise<void> {
    const payload = extractPayload(action)
    const pageId = toStringValue(payload.pageId ?? action.pageId ?? action.targetId, '')
    if (pageId && isProjectMode.value) {
      navigateToPage(pageId)
      return
    }

    const scope = createScope()
    const rawPath = payload.path !== undefined ? payload.path : (action.path ?? action.content)
    const resolvedPath = toStringValue(resolveValue(rawPath, scope), '')
    if (!resolvedPath) {
      return
    }

    const byIdOrName = pages.value.find(
      (page) =>
        page.id === resolvedPath || page.route === resolvedPath || page.name === resolvedPath,
    )
    if (byIdOrName && isProjectMode.value) {
      navigateToPage(byIdOrName.id)
      return
    }

    if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) {
      window.open(resolvedPath, '_blank')
      return
    }

    if (resolvedPath.startsWith('/')) {
      const mode = toStringValue(payload.mode, 'push')
      if (mode === 'replace') {
        await Promise.resolve(router.replace(resolvedPath))
      } else {
        await Promise.resolve(router.push(resolvedPath))
      }
      return
    }

    const routePage = pages.value.find((page) => page.route === `/${resolvedPath}`)
    if (routePage && isProjectMode.value) {
      navigateToPage(routePage.id)
      return
    }

    window.open(resolvedPath, '_blank')
  }

  function handleOpenUrl(action: ActionRecord, sourceNode?: NodeSchema, event?: Event): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event)
    const rawUrl = payload.url !== undefined ? payload.url : (action.url ?? action.content)
    const url = toStringValue(resolveValue(rawUrl, scope), '')
    if (!url) {
      return
    }

    const target =
      toStringValue(payload.target, '') || (Boolean(action.openInNewTab) ? '_blank' : '_self')
    if (target === '_self') {
      window.location.href = url
      return
    }

    const features = toStringValue(payload.features, '')
    window.open(url, target || '_blank', features)
  }

  function handleShowToast(action: ActionRecord, sourceNode?: NodeSchema, event?: Event): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event)
    const rawMessage =
      payload.message !== undefined ? payload.message : (action.message ?? action.content)
    const message = toStringValue(resolveValue(rawMessage, scope), '提示消息')
    const type = toStringValue(payload.type ?? action.messageType, 'info') as
      | 'success'
      | 'warning'
      | 'error'
      | 'info'

    switch (type) {
      case 'success':
        ElMessage.success(message)
        break
      case 'warning':
        ElMessage.warning(message)
        break
      case 'error':
        ElMessage.error(message)
        break
      default:
        ElMessage.info(message)
        break
    }
  }

  async function handleRunScript(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
  ): Promise<void> {
    const payload = extractPayload(action)
    const rawCode =
      payload.code !== undefined ? payload.code : (action.code ?? action.script ?? action.content)
    const code = toStringValue(rawCode, '')
    if (!code) {
      return
    }
    await executeScript(code, createScope(sourceNode, event))
  }

  async function handleCallApi(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
  ): Promise<void> {
    if (typeof fetch !== 'function') {
      return
    }

    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event)
    const endpointInput = payload.url !== undefined ? payload.url : (payload.apiId ?? action.url)
    const endpoint = toStringValue(resolveValue(endpointInput, scope), '')
    if (!endpoint) {
      return
    }

    const method = toStringValue(payload.method, 'GET').toUpperCase()
    const requestBody = resolveValue(payload.body, scope)
    const requestInit: RequestInit = { method }

    if (requestBody !== undefined && method !== 'GET' && method !== 'HEAD') {
      requestInit.headers = {
        'Content-Type': 'application/json',
      }
      requestInit.body = JSON.stringify(requestBody)
    }

    try {
      const response = await fetch(endpoint, requestInit)
      const contentType = response.headers.get('content-type') || ''
      const result = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

      const resultPath = toStringValue(payload.resultPath, '')
      if (resultPath) {
        setByPath(runtimeState, resultPath, result, false)
      }
    } catch (error) {
      console.warn('[RuntimeEventExecutor] callApi failed:', error)
    }
  }

  function handleEmit(action: ActionRecord, sourceNode?: NodeSchema, event?: Event): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event)
    const eventName = toStringValue(payload.event ?? action.eventName, '')
    if (!eventName || typeof window === 'undefined') {
      return
    }

    const detail = resolveValue(payload.data, scope)
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  function handleToggleVisibility(action: ActionRecord): void {
    const targetId = toStringValue(action.targetId, '')
    if (!targetId) {
      return
    }
    const target = findComponentById(targetId)
    if (!target) {
      return
    }
    if (!target.style) {
      target.style = {}
    }

    const style = target.style as UnknownRecord
    const currentVisible = style.visible !== false
    style.visible = !currentVisible
  }

  function handleScrollTo(action: ActionRecord): void {
    const targetId = toStringValue(action.targetId, '')
    if (!targetId) {
      return
    }
    const element = getNodeElement(targetId)
    if (!element) {
      return
    }

    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    } catch {
      element.scrollIntoView(true)
    }
  }

  function handleFullscreen(action: ActionRecord): void {
    if (typeof document === 'undefined') {
      return
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
      return
    }

    let targetElement: Element = document.documentElement
    const targetId = toStringValue(action.targetId, '')
    if (targetId) {
      const componentElement = getNodeElement(targetId)
      if (componentElement) {
        targetElement = componentElement
      }
    }

    targetElement.requestFullscreen().catch(() => {
      ElMessage.warning('无法进入全屏')
    })
  }

  function handlePlayAnimation(action: ActionRecord): void {
    const targetId = toStringValue(action.targetId, '')
    if (!targetId) {
      return
    }

    const target = findComponentById(targetId)
    const element = getNodeElement(targetId)
    if (!target || !element) {
      return
    }

    const animationName = toStringValue(target.animation?.name, 'fadeIn')
    const duration =
      typeof target.animation?.duration === 'number' ? target.animation.duration : 1000

    element.classList.forEach((className) => {
      if (className.startsWith('animate__')) {
        element.classList.remove(className)
      }
    })

    void element.offsetWidth
    element.classList.add('animate__animated', `animate__${animationName}`)
    element.style.setProperty('--animate-duration', `${duration}ms`)

    const onAnimationEnd = () => {
      element.classList.remove('animate__animated', `animate__${animationName}`)
      element.removeEventListener('animationend', onAnimationEnd)
    }
    element.addEventListener('animationend', onAnimationEnd, { once: true })
  }

  function handleHighlight(action: ActionRecord): void {
    const targetId = toStringValue(action.targetId, '')
    if (!targetId) {
      return
    }
    const element = getNodeElement(targetId)
    if (!element) {
      return
    }

    const existingTimer = highlightTimers.get(targetId)
    if (existingTimer) {
      clearTimeout(existingTimer)
      element.classList.remove(HIGHLIGHT_CLASS)
    }

    element.classList.add(HIGHLIGHT_CLASS)

    const duration = Number(action.duration)
    const ttl = Number.isFinite(duration) && duration > 0 ? duration : HIGHLIGHT_DURATION
    const timer = window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS)
      highlightTimers.delete(targetId)
    }, ttl)

    highlightTimers.set(targetId, timer)
  }

  function handleRefreshData(action: ActionRecord, sourceNode?: NodeSchema): void {
    const targetId = toStringValue(action.targetId, sourceNode?.id || '')
    if (!targetId) {
      return
    }
    const target = findComponentById(targetId)
    if (!target?.dataSource) {
      return
    }
    const element = getNodeElement(targetId)
    if (element) {
      element.dispatchEvent(new CustomEvent('data-refresh', { bubbles: true }))
    }
  }

  function dispatchRuntimeEvent(eventName: string, detail: UnknownRecord): void {
    if (typeof window === 'undefined') {
      return
    }
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  function navigateToPage(pageId: string): void {
    if (onNavigate) {
      onNavigate(pageId)
      return
    }
    const currentQuery = router.currentRoute.value.query
    router.replace({ query: { ...currentQuery, pageId } })
  }

  async function handleComponentEvent(payload: {
    componentId: string
    eventType: string
    actions: unknown[]
    event?: Event
  }): Promise<void> {
    const sourceNode = findComponentById(payload.componentId)
    for (const actionLike of payload.actions) {
      await executeActionLike(actionLike, sourceNode, payload.componentId, payload.event)
    }
  }

  async function executeAction(actionLike: unknown, sourceNode?: NodeSchema): Promise<void> {
    const fallbackNodeId =
      (isRecord(actionLike) && typeof actionLike.targetId === 'string' && actionLike.targetId) ||
      sourceNode?.id ||
      ''
    await executeActionLike(actionLike, sourceNode, fallbackNodeId)
  }

  return {
    handleComponentEvent,
    executeAction,
    runtimeState,
  }
}
