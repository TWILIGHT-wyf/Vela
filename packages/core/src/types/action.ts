import { JSExpression } from './expression'

/**
 * 动作类型枚举
 */
export type BuiltInActionType =
  | 'setState' // 修改变量/状态
  | 'openUrl' // 打开链接
  | 'ajax' // 发送请求
  | 'showToast' // 提示消息
  | 'dialog' // 打开弹窗
  | 'component' // 调用组件方法
  | 'script' // 执行自定义 JS 代码块
  | 'navigate' // 路由跳转
  | 'visibility' // (Legacy)
  | 'alert' // (Legacy)

/**
 * 通用动作结构 (Action Protocol)
 */
export interface ActionSchema {
  id: string
  type: BuiltInActionType | string // 允许扩展
  name?: string // 显示名称

  /**
   * 动作参数 (静态参数)
   * 替代具体的 url, method 等散乱字段
   */
  payload?: Record<string, unknown>

  /** ===== 流程控制 (Flow Control) ===== */

  /** 下一个动作 ID (串行) */
  next?: string

  /** 异步回调分支 */
  handlers?: {
    success?: string
    fail?: string
  }

  /** 执行条件 */
  condition?: string | boolean | JSExpression

  /** ===== Legacy 兼容字段 (将被 payload 替代) ===== */
  targetId?: string
  url?: string
  path?: string
  value?: unknown
  args?: unknown[]
  content?: string
  delay?: number
  message?: string
  blank?: boolean
}

// 导出旧的接口名以兼容现有代码，但指向 ActionSchema
export type BaseAction = ActionSchema
