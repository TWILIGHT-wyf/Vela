import { type Ref, type ComputedRef, onUnmounted } from 'vue'
import { type Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createSandboxProxy,
  evaluate as evaluateSandboxExpression,
  ACTION_TARGET_DATA_ATTRIBUTES,
  ACTION_CONFIRM_DEFAULT_MESSAGE,
  type AnyActionSchema,
  type NodeSchema,
  validateCode,
} from '@vela/core'
import type { Page } from './types'

type UnknownRecord = Record<string, unknown>

interface RuntimePage extends Page {
  actions?: AnyActionSchema[]
}

interface ActionRecord extends UnknownRecord {
  id?: string
  type: string
}

interface RuntimeMetaRecord extends UnknownRecord {
  throttleMap: Record<string, number>
  debounceMap: Record<string, { timerId: ReturnType<typeof setTimeout>; resolve?: () => void }>
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

interface DialogCloseDetail extends UnknownRecord {
  dialogId?: string
  result?: unknown
  data?: unknown
}

export interface EventExecutorContext {
  components: Ref<NodeSchema[]> | ComputedRef<NodeSchema[]>
  pages: Ref<Page[]> | ComputedRef<Page[]>
  state: Ref<Record<string, unknown>> | ComputedRef<Record<string, unknown>>
  isProjectMode: Ref<boolean> | ComputedRef<boolean>
  router: Router
  onNavigate?: (pageId: string) => void
}

const HIGHLIGHT_CLASS = 'editor-highlight-active'
const HIGHLIGHT_DURATION = 2000
const STYLE_ID = 'editor-event-executor-styles'
const SCRIPT_TIMEOUT = 2000

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

function resolveExpression(
  input: { value: string; mock?: unknown },
  scope: UnknownRecord,
): unknown {
  if (input.mock !== undefined) {
    return input.mock
  }

  return evaluateSandboxExpression(input.value, scope)
}

function resolveTemplateExpression(expression: string, scope: UnknownRecord): unknown {
  try {
    return evaluateSandboxExpression(expression, scope)
  } catch (error) {
    console.warn('[RuntimeEventExecutor] template expression failed', expression, error)
    return ''
  }
}

function resolveTemplateString(input: string, scope: UnknownRecord): unknown {
  const exactMatch = input.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/)
  if (exactMatch) {
    return resolveTemplateExpression(exactMatch[1], scope)
  }

  return input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expression: string) => {
    const value = resolveTemplateExpression(expression, scope)
    if (value === undefined || value === null) {
      return ''
    }
    if (typeof value === 'string') {
      return value
    }
    return JSON.stringify(value)
  })
}

function resolveValue(input: unknown, scope: UnknownRecord): unknown {
  if (isExpressionLike(input)) {
    return resolveExpression(input, scope)
  }
  if (typeof input === 'string' && input.includes('{{')) {
    return resolveTemplateString(input, scope)
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

  const selectors = ACTION_TARGET_DATA_ATTRIBUTES.map(
    (attr) => `[${attr}="${componentId}"]`,
  ).concat(`#${componentId}`)

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

function executeScript(
  code: string,
  scope: UnknownRecord,
  options: { throwOnError?: boolean } = {},
): Promise<void> {
  const throwOnError = options.throwOnError === true

  if (!validateCode(code)) {
    console.warn('[RuntimeEventExecutor] blocked unsafe script')
    if (throwOnError) {
      return Promise.reject(new Error('Unsafe script is blocked'))
    }
    return Promise.resolve()
  }

  try {
    const scriptScope: UnknownRecord = { ...scope }
    scriptScope.context = scriptScope
    const sandbox = createSandboxProxy(scriptScope)
    const runner = new Function(
      'sandbox',
      `with (sandbox) { return (async () => { ${code}\n })(); }`,
    )
    const result = runner(sandbox) as unknown
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      const promise = Promise.resolve(result as PromiseLike<unknown>).then(() => undefined)
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeoutPromise = new Promise<void>((resolve, reject) => {
        timer = setTimeout(() => {
          console.warn('[RuntimeEventExecutor] script execution timed out')
          if (throwOnError) {
            reject(new Error('Script execution timed out'))
            return
          }
          resolve()
        }, SCRIPT_TIMEOUT)
      })
      return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timer) {
          clearTimeout(timer)
        }
      })
    }
    return Promise.resolve()
  } catch (error) {
    console.warn('[RuntimeEventExecutor] script execution failed', error)
    if (throwOnError) {
      return Promise.reject(error)
    }
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cloneValue<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

export function useEventExecutor(context: EventExecutorContext) {
  const { components, pages, state, isProjectMode, router, onNavigate } = context

  const highlightTimers = new Map<string, number>()

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

  function resolveRuntimeState(runtimeStateOverride?: UnknownRecord): UnknownRecord {
    return runtimeStateOverride || (state.value as UnknownRecord)
  }

  function createScope(
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): UnknownRecord {
    return {
      state: resolveRuntimeState(runtimeStateOverride),
      component: sourceNode,
      components: components.value,
      pages: pages.value,
      event,
      timestamp: Date.now(),
    }
  }

  function waitForDialogClose(dialogId: string): Promise<DialogCloseDetail> {
    if (!dialogId || typeof window === 'undefined') {
      return Promise.resolve({ dialogId })
    }

    return new Promise((resolve) => {
      const handler = (event: Event) => {
        const detail = ((event as CustomEvent<DialogCloseDetail>).detail || {}) as DialogCloseDetail
        if (toStringValue(detail.dialogId, '') !== dialogId) {
          return
        }
        window.removeEventListener('vela:dialog:closed', handler as EventListener)
        resolve(detail)
      }

      window.addEventListener('vela:dialog:closed', handler as EventListener)
    })
  }

  async function executeActionLike(
    actionLike: unknown,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const resolved = resolveActionInput(actionLike, nodeId)
    if (!resolved) {
      return
    }
    await executeResolvedAction(resolved, sourceNode, nodeId, event, runtimeStateOverride)
  }

  function toActionArray(value: unknown): unknown[] {
    if (value === undefined || value === null) {
      return []
    }
    return Array.isArray(value) ? value : [value]
  }

  async function executeActionCallbacks(
    callbackRef: unknown,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const callbackActions = toActionArray(callbackRef)
    for (const callbackAction of callbackActions) {
      await executeActionLike(callbackAction, sourceNode, nodeId, event, runtimeStateOverride)
    }
  }

  function getRuntimeMeta(runtimeStateOverride?: UnknownRecord): RuntimeMetaRecord {
    const runtimeState = resolveRuntimeState(runtimeStateOverride)
    if (!isRecord(runtimeState.__actionRuntimeMeta)) {
      runtimeState.__actionRuntimeMeta = {
        throttleMap: {},
        debounceMap: {},
      }
    }
    return runtimeState.__actionRuntimeMeta as RuntimeMetaRecord
  }

  function resolveActionKey(action: ActionRecord, nodeId: string): string {
    const actionId = typeof action.id === 'string' && action.id ? action.id : 'anonymous'
    return `${nodeId}:${actionId}`
  }

  function shouldSkipByThrottle(
    action: ActionRecord,
    actionKey: string,
    runtimeMeta: RuntimeMetaRecord,
  ): boolean {
    const throttleMs = Number(action.throttle)
    if (!Number.isFinite(throttleMs) || throttleMs <= 0) {
      return false
    }

    const now = Date.now()
    const lastTime = Number(runtimeMeta.throttleMap[actionKey] || 0)
    if (now - lastTime < throttleMs) {
      return true
    }

    runtimeMeta.throttleMap[actionKey] = now
    return false
  }

  function scheduleDebouncedAction(
    actionKey: string,
    debounceMs: number,
    runtimeMeta: RuntimeMetaRecord,
    task: () => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pending = runtimeMeta.debounceMap[actionKey]
      if (pending?.timerId !== undefined) {
        clearTimeout(pending.timerId)
        pending.resolve?.()
      }

      let settled = false
      const safeResolve = () => {
        if (!settled) {
          settled = true
          resolve()
        }
      }
      const safeReject = (error: unknown) => {
        if (!settled) {
          settled = true
          reject(error)
        }
      }

      const timerId = setTimeout(async () => {
        delete runtimeMeta.debounceMap[actionKey]
        try {
          await task()
          safeResolve()
        } catch (error) {
          safeReject(error)
        }
      }, debounceMs)

      runtimeMeta.debounceMap[actionKey] = {
        timerId,
        resolve: safeResolve,
      }
    })
  }

  function shouldExecuteByConfirm(action: ActionRecord, scope: UnknownRecord): boolean {
    const confirmConfig = isRecord(action.confirm) ? action.confirm : null
    if (!confirmConfig) {
      return true
    }

    const defaultMessage = ACTION_CONFIRM_DEFAULT_MESSAGE
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

  async function executeBuiltInAction(
    action: ActionRecord,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const actionType = toStringValue(action.type).trim()
    if (!actionType) {
      return
    }

    switch (actionType) {
      case 'setState':
        handleSetState(action, sourceNode, event, runtimeStateOverride)
        break
      case 'navigate':
        await handleNavigate(action, runtimeStateOverride)
        break
      case 'openUrl':
        handleOpenUrl(action, sourceNode, event, runtimeStateOverride)
        break
      case 'showToast':
        handleShowToast(action, sourceNode, event, runtimeStateOverride)
        break
      case 'runScript':
        await handleRunScript(action, sourceNode, event, runtimeStateOverride)
        break
      case 'callApi':
        await handleCallApi(action, sourceNode, event, runtimeStateOverride)
        break
      case 'emit':
        handleEmit(action, sourceNode, event, runtimeStateOverride)
        break
      case 'showDialog':
        await handleShowDialog(action, sourceNode, nodeId, event, runtimeStateOverride)
        break
      case 'closeDialog':
        dispatchRuntimeEvent('vela:dialog:close', {
          dialogId: resolveValue(
            extractPayload(action).dialogId,
            createScope(sourceNode, event, runtimeStateOverride),
          ),
          result: resolveValue(
            extractPayload(action).result,
            createScope(sourceNode, event, runtimeStateOverride),
          ),
        })
        break
      case 'callMethod':
        dispatchRuntimeEvent('vela:call-method', {
          targetRef: extractPayload(action).targetRef,
          method: extractPayload(action).method,
          args: resolveValue(
            extractPayload(action).args,
            createScope(sourceNode, event, runtimeStateOverride),
          ),
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
      await executeActionLike(action.next, sourceNode, nodeId, event, runtimeStateOverride)
    }
  }

  async function executeResolvedAction(
    action: ActionRecord | InlineActionRecord,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    if (isInlineAction(action)) {
      await executeScript(action.code, createScope(sourceNode, event, runtimeStateOverride))
      return
    }

    const scope = createScope(sourceNode, event, runtimeStateOverride)
    if (action.condition !== undefined && !resolveValue(action.condition, scope)) {
      return
    }

    if (!shouldExecuteByConfirm(action, scope)) {
      return
    }

    const delayMs = Number(action.delay)
    if (Number.isFinite(delayMs) && delayMs > 0) {
      await wait(delayMs)
    }

    const runtimeMeta = getRuntimeMeta(runtimeStateOverride)
    const actionKey = resolveActionKey(action, nodeId)
    if (shouldSkipByThrottle(action, actionKey, runtimeMeta)) {
      return
    }

    const handlers = isRecord(action.handlers) ? action.handlers : {}
    const runWithHandlers = async () => {
      await executeActionCallbacks(
        handlers.loading,
        sourceNode,
        nodeId,
        event,
        runtimeStateOverride,
      )

      let actionError: unknown
      try {
        await executeBuiltInAction(action, sourceNode, nodeId, event, runtimeStateOverride)
        await executeActionCallbacks(
          handlers.success,
          sourceNode,
          nodeId,
          event,
          runtimeStateOverride,
        )
      } catch (error) {
        actionError = error
        await executeActionCallbacks(handlers.fail, sourceNode, nodeId, event, runtimeStateOverride)
      } finally {
        await executeActionCallbacks(
          handlers.complete,
          sourceNode,
          nodeId,
          event,
          runtimeStateOverride,
        )
      }

      if (actionError) {
        console.error('[RuntimeEventExecutor] action failed', actionError)
      }
    }

    const debounceMs = Number(action.debounce)
    if (Number.isFinite(debounceMs) && debounceMs > 0) {
      await scheduleDebouncedAction(actionKey, debounceMs, runtimeMeta, runWithHandlers)
      return
    }

    await runWithHandlers()
  }

  function getTargetNode(action: ActionRecord, sourceNode?: NodeSchema): NodeSchema | undefined {
    const payload = extractPayload(action)
    const targetId = toStringValue(payload.targetId ?? action.targetId, sourceNode?.id || '')
    if (!targetId) {
      return sourceNode
    }
    return findComponentById(targetId) || sourceNode
  }

  function handleSetState(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): void {
    const payload = extractPayload(action)
    const path = toStringValue(payload.path ?? action.path ?? payload.stateName, '')
    if (!path) {
      return
    }

    const scope = createScope(sourceNode, event, runtimeStateOverride)
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

    setByPath(resolveRuntimeState(runtimeStateOverride), path, resolvedValue, merge)
  }

  async function handleShowDialog(
    action: ActionRecord,
    sourceNode: NodeSchema | undefined,
    nodeId: string,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event, runtimeStateOverride)
    const dialogId = toStringValue(resolveValue(payload.dialogId, scope), '')
    const dialogData = resolveValue(payload.data, scope)

    dispatchRuntimeEvent('vela:dialog:open', {
      dialogId,
      title: resolveValue(payload.title, scope),
      content: resolveValue(payload.content, scope),
      data: dialogData,
    })

    const resultPath = toStringValue(payload.resultPath, '')
    const shouldWaitForClose =
      Boolean(payload.waitForClose) || Boolean(resultPath) || payload.onClose !== undefined

    if (!dialogId || !shouldWaitForClose) {
      return
    }

    const detail = await waitForDialogClose(dialogId)
    const runtimeState = resolveRuntimeState(runtimeStateOverride)
    const clonedResult = cloneValue(detail.result)

    setByPath(runtimeState, 'dialogResult', { dialogId, result: clonedResult }, false)
    setByPath(runtimeState, `dialogResults.${dialogId}`, clonedResult, false)

    if (resultPath) {
      setByPath(runtimeState, resultPath, clonedResult, false)
    }

    if (payload.onClose !== undefined) {
      await executeActionCallbacks(payload.onClose, sourceNode, nodeId, event, runtimeStateOverride)
    }
  }

  async function handleNavigate(
    action: ActionRecord,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const payload = extractPayload(action)
    const pageId = toStringValue(payload.pageId ?? action.pageId ?? action.targetId, '')
    if (pageId && isProjectMode.value) {
      navigateToPage(pageId)
      return
    }

    const scope = createScope(undefined, undefined, runtimeStateOverride)
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

  function handleOpenUrl(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event, runtimeStateOverride)
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

  function handleShowToast(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event, runtimeStateOverride)
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
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    const payload = extractPayload(action)
    const rawCode =
      payload.code !== undefined ? payload.code : (action.code ?? action.script ?? action.content)
    const code = toStringValue(rawCode, '')
    if (!code) {
      return
    }
    await executeScript(code, createScope(sourceNode, event, runtimeStateOverride), {
      throwOnError: true,
    })
  }

  async function handleCallApi(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): Promise<void> {
    if (typeof fetch !== 'function') {
      return
    }

    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event, runtimeStateOverride)
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
        setByPath(resolveRuntimeState(runtimeStateOverride), resultPath, result, false)
      }
    } catch (error) {
      console.warn('[RuntimeEventExecutor] callApi failed:', error)
      throw error
    }
  }

  function handleEmit(
    action: ActionRecord,
    sourceNode?: NodeSchema,
    event?: Event,
    runtimeStateOverride?: UnknownRecord,
  ): void {
    const payload = extractPayload(action)
    const scope = createScope(sourceNode, event, runtimeStateOverride)
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
    runtimeState?: Record<string, unknown>
  }): Promise<void> {
    const sourceNode = findComponentById(payload.componentId)
    for (const actionLike of payload.actions) {
      await executeActionLike(
        actionLike,
        sourceNode,
        payload.componentId,
        payload.event,
        payload.runtimeState,
      )
    }
  }

  async function executeAction(
    actionLike: unknown,
    sourceNode?: NodeSchema,
    runtimeStateOverride?: Record<string, unknown>,
  ): Promise<void> {
    const fallbackNodeId =
      (isRecord(actionLike) && typeof actionLike.targetId === 'string' && actionLike.targetId) ||
      sourceNode?.id ||
      ''
    await executeActionLike(actionLike, sourceNode, fallbackNodeId, undefined, runtimeStateOverride)
  }

  return {
    handleComponentEvent,
    executeAction,
    runtimeState: state,
  }
}
