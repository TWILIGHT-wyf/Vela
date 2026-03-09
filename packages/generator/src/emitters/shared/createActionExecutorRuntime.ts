import { ACTION_TARGET_DATA_ATTRIBUTES, ACTION_CONFIRM_DEFAULT_MESSAGE } from '@vela/core/contracts'

export interface ActionExecutorRuntimeOptions {
  typescript: boolean
}

export function createActionExecutorRuntimeSource(options: ActionExecutorRuntimeOptions): string {
  const tsNoCheck = options.typescript ? '// @ts-nocheck\n' : ''
  const actionTargetDataAttributes = JSON.stringify(ACTION_TARGET_DATA_ATTRIBUTES, null, 2)
  const actionConfirmDefaultMessage = JSON.stringify(ACTION_CONFIRM_DEFAULT_MESSAGE)

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

const ACTION_TARGET_DATA_ATTRIBUTES = ${actionTargetDataAttributes}
const ACTION_CONFIRM_DEFAULT_MESSAGE = ${actionConfirmDefaultMessage}

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

function getTargetElementById(targetId) {
  if (!targetId || typeof document === 'undefined') {
    return null
  }
  const selectors = ACTION_TARGET_DATA_ATTRIBUTES
    .map((attr) => '[' + attr + '="' + targetId + '"]')
    .concat('#' + targetId)
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector)
      if (element) {
        return element
      }
    } catch {
      // ignore invalid selector
    }
  }
  return null
}

function ensureHighlightStyles() {
  if (typeof document === 'undefined') {
    return
  }
  const styleId = 'vela-generated-highlight-style'
  if (document.getElementById(styleId)) {
    return
  }
  const styleEl = document.createElement('style')
  styleEl.id = styleId
  styleEl.textContent = '.vela-generated-highlight{outline:3px solid rgba(64,158,255,.85);outline-offset:2px;border-radius:4px;box-shadow:0 0 0 8px rgba(64,158,255,.2)}'
  document.head.appendChild(styleEl)
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
  const actionType = toStringValue(action.type).trim()
  if (!actionType) {
    return
  }
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
      const rawPath = resolveValue(
        payload.path !== undefined ? payload.path : action.path !== undefined ? action.path : action.content,
        scope,
      )
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
      const rawUrl = resolveValue(
        payload.url !== undefined ? payload.url : action.url !== undefined ? action.url : action.content,
        scope,
      )
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
      const rawMessage = resolveValue(
        payload.message !== undefined
          ? payload.message
          : action.message !== undefined
            ? action.message
            : action.content,
        scope,
      )
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
      const eventName = toStringValue(payload.event !== undefined ? payload.event : action.eventName)
      if (!eventName || typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') {
        break
      }
      const eventData = resolveValue(payload.data, scope)
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }))
      break
    }
    case 'runScript': {
      const code = toStringValue(
        payload.code !== undefined
          ? payload.code
          : action.code !== undefined
            ? action.code
            : action.script !== undefined
              ? action.script
              : action.content,
      )
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
    case 'toggle-visibility': {
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId)
      if (!target) {
        break
      }
      const nextHidden = target.style.display !== 'none'
      target.style.display = nextHidden ? 'none' : ''
      break
    }
    case 'scroll-to': {
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId)
      if (!target) {
        break
      }
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      } catch {
        target.scrollIntoView(true)
      }
      break
    }
    case 'fullscreen': {
      if (typeof document === 'undefined') {
        break
      }
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        await Promise.resolve(document.exitFullscreen())
        break
      }
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId) || document.documentElement
      if (target && typeof target.requestFullscreen === 'function') {
        await Promise.resolve(target.requestFullscreen())
      }
      break
    }
    case 'play-animation': {
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId)
      if (!target) {
        break
      }
      const animationName = toStringValue(payload.animationName, 'fadeIn')
      const duration = Number(payload.duration)
      const durationMs = Number.isFinite(duration) && duration > 0 ? duration : 1000
      target.classList.remove('animate__animated', 'animate__' + animationName)
      void target.offsetWidth
      target.classList.add('animate__animated', 'animate__' + animationName)
      target.style.setProperty('--animate-duration', String(durationMs) + 'ms')
      break
    }
    case 'highlight': {
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId)
      if (!target) {
        break
      }
      ensureHighlightStyles()
      target.classList.add('vela-generated-highlight')
      const duration = Number(payload.duration !== undefined ? payload.duration : action.duration)
      const ttl = Number.isFinite(duration) && duration > 0 ? duration : 2000
      setTimeout(() => {
        target.classList.remove('vela-generated-highlight')
      }, ttl)
      break
    }
    case 'refresh-data': {
      const targetId = toStringValue(payload.targetId !== undefined ? payload.targetId : action.targetId)
      const target = getTargetElementById(targetId)
      if (!target) {
        break
      }
      target.dispatchEvent(new CustomEvent('data-refresh', { bubbles: true }))
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
