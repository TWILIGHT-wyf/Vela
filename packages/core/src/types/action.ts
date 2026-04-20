import type { Expression, ValueOrExpression } from './expression'

// ============================================================================
// 动作类型
// ============================================================================

/**
 * 内置动作类型
 */
export type BuiltInActionType =
  | 'setState' // 修改状态
  | 'callApi' // 调用 API
  | 'navigate' // 路由跳转
  | 'openUrl' // 打开链接
  | 'showToast' // 显示提示
  | 'showDialog' // 显示弹窗
  | 'closeDialog' // 关闭弹窗
  | 'callMethod' // 调用组件方法
  | 'runScript' // 执行脚本
  | 'emit' // 触发事件

// ============================================================================
// 类型化 Payload
// ============================================================================

/**
 * setState 动作参数
 */
export interface SetStatePayload {
  /** 状态路径 (支持点号路径，如 'user.profile.name') */
  path: string
  /** 新值 (支持表达式) */
  value: unknown | Expression
  /** 合并模式 (对象类型) */
  merge?: boolean
}

/**
 * callApi 动作参数
 */
export interface CallApiPayload {
  /** API 定义 ID */
  apiId: string
  /** 覆盖请求参数 */
  params?: Record<string, unknown | Expression>
  /** 覆盖请求体 */
  body?: Record<string, unknown | Expression>
  /** 响应数据存储路径 */
  resultPath?: string
}

/**
 * navigate 动作参数
 */
export interface NavigatePayload {
  /** 目标路径 */
  path: string | Expression
  /** 路由参数 */
  params?: Record<string, unknown | Expression>
  /** 查询参数 */
  query?: Record<string, unknown | Expression>
  /** 导航模式 */
  mode?: 'push' | 'replace'
}

/**
 * openUrl 动作参数
 */
export interface OpenUrlPayload {
  /** 目标 URL */
  url: string | Expression
  /** 打开方式 */
  target?: '_blank' | '_self' | '_parent' | '_top'
  /** 窗口特性 (target 为 _blank 时有效) */
  features?: string
}

/**
 * showToast 动作参数
 */
export interface ShowToastPayload {
  /** 提示内容 */
  message: string | Expression
  /** 提示类型 */
  type?: 'success' | 'error' | 'warning' | 'info'
  /** 显示时长 (ms) */
  duration?: number
  /** 位置 */
  position?: 'top' | 'middle' | 'bottom'
}

/**
 * showDialog 动作参数
 */
export interface ShowDialogPayload {
  /** 弹窗 ID 或组件名 */
  dialogId: string
  /** 弹窗标题 */
  title?: string | Expression
  /** 弹窗内容 */
  content?: string | Expression
  /** 传递给弹窗的数据 */
  data?: Record<string, unknown | Expression>
  /** 弹窗关闭后的结果写回路径 */
  resultPath?: string
  /** 是否等待弹窗关闭后再继续后续动作 */
  waitForClose?: boolean
  /** 弹窗关闭后的回调动作 */
  onClose?: ActionCallbackRef
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
}

/**
 * closeDialog 动作参数
 */
export interface CloseDialogPayload {
  /** 弹窗 ID (不传则关闭当前弹窗) */
  dialogId?: string
  /** 关闭时返回的数据 */
  result?: unknown | Expression
}

/**
 * callMethod 动作参数
 */
export interface CallMethodPayload {
  /** 目标组件 ref */
  targetRef: string
  /** 方法名 */
  method: string
  /** 方法参数 */
  args?: Array<unknown | Expression>
}

/**
 * runScript 动作参数
 */
export interface RunScriptPayload {
  /** 脚本代码 */
  code: string
  /** 是否异步执行 */
  async?: boolean
}

/**
 * emit 动作参数
 */
export interface EmitPayload {
  /** 事件名 */
  event: string
  /** 事件数据 */
  data?: unknown | Expression
}

/**
 * Payload 类型映射
 */
export interface ActionPayloadMap {
  setState: SetStatePayload
  callApi: CallApiPayload
  navigate: NavigatePayload
  openUrl: OpenUrlPayload
  showToast: ShowToastPayload
  showDialog: ShowDialogPayload
  closeDialog: CloseDialogPayload
  callMethod: CallMethodPayload
  runScript: RunScriptPayload
  emit: EmitPayload
}

// ============================================================================
// 动作引用
// ============================================================================

/**
 * 动作引用作用域
 * - global: 引用项目级 actions
 * - page: 引用指定页面 actions
 * - node: 引用节点局部 actions
 */
export type ActionRefScope = 'global' | 'page' | 'node'

/**
 * 全局动作引用
 */
export interface GlobalScopedActionRef {
  type: 'ref'
  /** 动作 ID */
  id: string
  /** 引用作用域，默认 global */
  scope?: 'global'
}

/**
 * 页面动作引用
 */
export interface PageScopedActionRef {
  type: 'ref'
  /** 动作 ID */
  id: string
  /** 引用作用域 */
  scope: 'page'
  /** 页面 ID */
  pageId: string
}

/**
 * 节点动作引用
 */
export interface NodeScopedActionRef {
  type: 'ref'
  /** 动作 ID */
  id: string
  /** 引用作用域 */
  scope: 'node'
  /** 节点 ID */
  nodeId: string
}

/**
 * 具名动作引用
 * 用于避免仅用字符串时的作用域歧义
 */
export type ScopedActionRef = GlobalScopedActionRef | PageScopedActionRef | NodeScopedActionRef

/**
 * 内联动作代码 (用于生命周期或回调)
 */
export interface InlineActionCode {
  type: 'inline'
  code: string
  language?: 'js' | 'ts'
}

/**
 * 动作引用
 * - string: Action ID
 * - ScopedActionRef: 带作用域的 Action ID
 * - InlineActionCode: 内联动作代码
 */
export type ActionRef = string | ScopedActionRef | InlineActionCode

/**
 * 动作链路引用
 * 仅支持具名动作，不支持内联代码
 */
export type ActionLinkRef = string | ScopedActionRef

/**
 * 回调动作引用
 * 支持单个动作或动作列表
 */
export type ActionCallbackRef = ActionRef | ActionRef[]

// ============================================================================
// 流程控制配置
// ============================================================================

/**
 * 确认弹窗配置
 */
export interface ConfirmConfig {
  /** 确认标题 */
  title?: string
  /** 确认内容 */
  message: string | Expression
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 确认类型 (影响样式) */
  type?: 'info' | 'warning' | 'danger'
}

/**
 * 动作回调处理
 */
export interface ActionHandlers {
  /** 成功时执行的动作 */
  success?: ActionCallbackRef
  /** 失败时执行的动作 */
  fail?: ActionCallbackRef
  /** 加载中执行的动作 (用于显示 loading 状态) */
  loading?: ActionCallbackRef
  /** 完成时执行的动作 (无论成功失败) */
  complete?: ActionCallbackRef
}

// ============================================================================
// 动作定义
// ============================================================================

/**
 * 动作定义
 * 框架无关的用户交互行为描述
 */
export interface ActionSchema<T extends BuiltInActionType | string = string> {
  /** 动作唯一标识 */
  id: string
  /** 动作类型 */
  type: T
  /** 动作显示名称 */
  name?: string
  /** 动作说明 */
  description?: string
  /** 动作分组 (便于管理) */
  group?: string

  /**
   * 动作参数
   * 内置类型使用对应的类型化 Payload
   * 自定义类型使用 Record<string, unknown>
   */
  payload?: T extends BuiltInActionType ? ActionPayloadMap[T] : Record<string, unknown>

  // ========== 流程控制 ==========

  /** 下一个动作引用 (顺序执行) */
  next?: ActionLinkRef

  /** 异步回调 */
  handlers?: ActionHandlers

  /** 执行条件 (表达式为 truthy 时执行) */
  condition?: ValueOrExpression<boolean>

  /** 延迟执行 (ms) */
  delay?: number

  /**
   * 防抖配置 (ms)
   * 连续触发只执行最后一次
   */
  debounce?: number

  /**
   * 节流配置 (ms)
   * 指定时间内只执行一次
   */
  throttle?: number

  /**
   * 确认配置
   * 执行前弹出确认框
   */
  confirm?: ConfirmConfig

  /**
   * 调试日志
   * 开发环境下输出执行信息
   */
  log?: boolean

  // ========== 兼容旧版本 ==========
  /** @deprecated Use payload.targetRef instead */
  targetId?: string
  /** @deprecated Use payload.url instead */
  url?: string
  /** @deprecated Use payload.path instead */
  path?: string
  /** @deprecated Use payload.value instead */
  value?: unknown
  /** @deprecated Use payload.args instead */
  args?: unknown[]
  /** @deprecated Use payload.message instead */
  message?: string
}

/**
 * 内置动作定义联合类型
 * 可获得 payload 的类型推导
 */
export type BuiltInActionSchema = {
  [K in BuiltInActionType]: ActionSchema<K>
}[BuiltInActionType]

/**
 * 任意动作定义
 */
export type AnyActionSchema = BuiltInActionSchema | ActionSchema

/**
 * 动作引用校验错误码
 */
export type ActionRefValidationCode =
  | 'missing-global-action'
  | 'missing-page-action'
  | 'missing-node-action'
  | 'unresolved-action'

/**
 * 动作引用校验结果
 */
export interface ActionRefValidationIssue {
  code: ActionRefValidationCode
  ref: ActionLinkRef
  message: string
}

/**
 * 动作引用校验上下文
 */
export interface ActionRefValidationContext {
  globalActionIds?: Iterable<string>
  pageActionIds?: Iterable<string>
  nodeActionIds?: Iterable<string>
}

function toIdSet(ids?: Iterable<string>): Set<string> {
  return ids ? new Set(ids) : new Set<string>()
}

/**
 * 提取动作 ID 集合
 */
export function extractActionIds(actions?: AnyActionSchema[]): Set<string> {
  if (!actions || actions.length === 0) {
    return new Set<string>()
  }
  return new Set(actions.map((action) => action.id))
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 setState 动作
 */
export function createSetStateAction(
  id: string,
  path: string,
  value: unknown | Expression,
): ActionSchema<'setState'> {
  return {
    id,
    type: 'setState',
    payload: { path, value },
  }
}

/**
 * 创建 callApi 动作
 */
export function createCallApiAction(
  id: string,
  apiId: string,
  options?: Partial<Omit<CallApiPayload, 'apiId'>>,
): ActionSchema<'callApi'> {
  return {
    id,
    type: 'callApi',
    payload: { apiId, ...options },
  }
}

/**
 * 创建 navigate 动作
 */
export function createNavigateAction(
  id: string,
  path: string,
  options?: Partial<Omit<NavigatePayload, 'path'>>,
): ActionSchema<'navigate'> {
  return {
    id,
    type: 'navigate',
    payload: { path, ...options },
  }
}

/**
 * 创建 showToast 动作
 */
export function createShowToastAction(
  id: string,
  message: string | Expression,
  type: ShowToastPayload['type'] = 'info',
): ActionSchema<'showToast'> {
  return {
    id,
    type: 'showToast',
    payload: { message, type },
  }
}

/**
 * 创建 showDialog 动作
 */
export function createShowDialogAction(
  id: string,
  dialogId: string,
  options?: Partial<Omit<ShowDialogPayload, 'dialogId'>>,
): ActionSchema<'showDialog'> {
  return {
    id,
    type: 'showDialog',
    payload: { dialogId, ...options },
  }
}

/**
 * 创建 openUrl 动作
 */
export function createOpenUrlAction(
  id: string,
  url: string | Expression,
  options?: Partial<Omit<OpenUrlPayload, 'url'>>,
): ActionSchema<'openUrl'> {
  return {
    id,
    type: 'openUrl',
    payload: { url, ...options },
  }
}

/**
 * 创建 closeDialog 动作
 */
export function createCloseDialogAction(
  id: string,
  options?: CloseDialogPayload,
): ActionSchema<'closeDialog'> {
  return {
    id,
    type: 'closeDialog',
    payload: options,
  }
}

/**
 * 创建 callMethod 动作
 */
export function createCallMethodAction(
  id: string,
  targetRef: string,
  method: string,
  args?: Array<unknown | Expression>,
): ActionSchema<'callMethod'> {
  return {
    id,
    type: 'callMethod',
    payload: { targetRef, method, args },
  }
}

/**
 * 创建 runScript 动作
 */
export function createRunScriptAction(
  id: string,
  code: string,
  async: boolean = false,
): ActionSchema<'runScript'> {
  return {
    id,
    type: 'runScript',
    payload: { code, async },
  }
}

/**
 * 创建 emit 动作
 */
export function createEmitAction(
  id: string,
  event: string,
  data?: unknown | Expression,
): ActionSchema<'emit'> {
  return {
    id,
    type: 'emit',
    payload: { event, data },
  }
}

/**
 * 创建具名动作引用
 */
export function createActionRef(id: string): GlobalScopedActionRef
export function createActionRef(id: string, scope: 'global'): GlobalScopedActionRef
export function createActionRef(id: string, scope: 'page', pageId: string): PageScopedActionRef
export function createActionRef(id: string, scope: 'node', nodeId: string): NodeScopedActionRef
export function createActionRef(
  id: string,
  scope: ActionRefScope = 'global',
  scopeId?: string,
): ScopedActionRef {
  if (scope === 'page') {
    if (!scopeId) {
      throw new Error('page scope requires pageId')
    }
    return { type: 'ref', id, scope, pageId: scopeId }
  }
  if (scope === 'node') {
    if (!scopeId) {
      throw new Error('node scope requires nodeId')
    }
    return { type: 'ref', id, scope, nodeId: scopeId }
  }
  return { type: 'ref', id, scope: 'global' }
}

/**
 * 创建内联动作代码
 */
export function createInlineAction(
  code: string,
  language: InlineActionCode['language'] = 'js',
): InlineActionCode {
  return { type: 'inline', code, language }
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 检查是否为内置动作类型
 */
export function isBuiltInAction(action: ActionSchema): action is ActionSchema<BuiltInActionType> {
  const builtInTypes: BuiltInActionType[] = [
    'setState',
    'callApi',
    'navigate',
    'openUrl',
    'showToast',
    'showDialog',
    'closeDialog',
    'callMethod',
    'runScript',
    'emit',
  ]
  return builtInTypes.includes(action.type as BuiltInActionType)
}

/**
 * 检查是否为内联动作引用
 */
export function isInlineActionRef(ref: ActionRef): ref is InlineActionCode {
  return typeof ref === 'object' && ref !== null && ref.type === 'inline'
}

/**
 * 检查是否为具名作用域动作引用
 */
export function isScopedActionRef(ref: ActionRef): ref is ScopedActionRef {
  return typeof ref === 'object' && ref !== null && ref.type === 'ref'
}

/**
 * 检查 ActionRef 是否可用于链路引用
 * 链路引用不支持 inline 代码
 */
export function isActionLinkRef(ref: ActionRef): ref is ActionLinkRef {
  return typeof ref === 'string' || isScopedActionRef(ref)
}

/**
 * 检查是否为页面作用域动作引用
 */
export function isPageScopedActionRef(ref: ActionRef): ref is PageScopedActionRef {
  return isScopedActionRef(ref) && ref.scope === 'page'
}

/**
 * 检查是否为节点作用域动作引用
 */
export function isNodeScopedActionRef(ref: ActionRef): ref is NodeScopedActionRef {
  return isScopedActionRef(ref) && ref.scope === 'node'
}

/**
 * 获取动作引用 ID
 */
export function getActionRefId(ref: ActionLinkRef): string {
  return typeof ref === 'string' ? ref : ref.id
}

/**
 * 校验动作引用是否可解析
 * - string 引用按 node -> page -> global 顺序尝试解析
 * - scoped 引用按 scope 严格解析
 */
export function validateActionLinkRef(
  ref: ActionLinkRef,
  context: ActionRefValidationContext = {},
): ActionRefValidationIssue[] {
  const globalActionIds = toIdSet(context.globalActionIds)
  const pageActionIds = toIdSet(context.pageActionIds)
  const nodeActionIds = toIdSet(context.nodeActionIds)

  if (typeof ref === 'string') {
    if (globalActionIds.size === 0 && pageActionIds.size === 0 && nodeActionIds.size === 0) {
      return []
    }
    if (nodeActionIds.has(ref) || pageActionIds.has(ref) || globalActionIds.has(ref)) {
      return []
    }
    return [
      {
        code: 'unresolved-action',
        ref,
        message: `Cannot resolve action reference "${ref}" from node/page/global scopes`,
      },
    ]
  }

  const actionId = ref.id

  if (ref.scope === 'page') {
    if (pageActionIds.size > 0 && pageActionIds.has(actionId)) {
      return []
    }
    return [
      {
        code: 'missing-page-action',
        ref,
        message: `Page action "${actionId}" is not defined`,
      },
    ]
  }

  if (ref.scope === 'node') {
    if (nodeActionIds.size > 0 && nodeActionIds.has(actionId)) {
      return []
    }
    return [
      {
        code: 'missing-node-action',
        ref,
        message: `Node action "${actionId}" is not defined`,
      },
    ]
  }

  if (globalActionIds.size > 0 && globalActionIds.has(actionId)) {
    return []
  }
  if (globalActionIds.size === 0) {
    return []
  }
  return [
    {
      code: 'missing-global-action',
      ref,
      message: `Global action "${actionId}" is not defined`,
    },
  ]
}

/**
 * 批量校验动作引用
 */
export function validateActionLinkRefs(
  refs: ActionLinkRef[],
  context: ActionRefValidationContext = {},
): ActionRefValidationIssue[] {
  const issues: ActionRefValidationIssue[] = []
  for (const ref of refs) {
    issues.push(...validateActionLinkRef(ref, context))
  }
  return issues
}

// ============================================================================
// 兼容旧版本
// ============================================================================

/** @deprecated Use ActionSchema instead */
export type BaseAction = ActionSchema
