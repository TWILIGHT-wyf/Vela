import type { NodeSchema } from '@vela/core/types/schema'

/**
 * AI 建议面板类型定义
 * V2.0: Uses NodeSchema instead of legacy Component type
 */

/**
 * 建议请求
 */
export interface SuggestionRequest {
  /** 用户自然语言意图 */
  prompt: string
  /** 当前画布上下文 */
  context: {
    /** 现有组件树 */
    components: NodeSchema[]
    /** 画布尺寸 */
    canvasSize: { width: number; height: number }
    /** 主题 */
    theme?: string
    /** 其他上下文信息 */
    [key: string]: unknown
  }
  /** 请求时间戳 */
  timestamp: number
}

/**
 * 差异项类型
 */
export type DiffActionType = 'add' | 'modify' | 'delete'

/**
 * 差异项
 */
export interface DiffItem {
  /** 差异类型 */
  action: DiffActionType
  /** 目标组件 ID（新增时为空） */
  componentId?: string
  /** 组件类型 */
  componentType: string
  /** 变更路径（如 'props.title', 'style.width'） */
  path?: string
  /** 旧值（修改/删除时） */
  oldValue?: unknown
  /** 新值（新增/修改时） */
  newValue?: unknown
  /** 完整的新组件数据（新增时） */
  component?: Partial<NodeSchema>
  /** 描述 */
  description: string
}

/**
 * 建议结果
 */
export interface SuggestionResult {
  /** 建议 ID */
  id: string
  /** 原始请求 */
  request: SuggestionRequest
  /** 差异列表 */
  diffs: DiffItem[]
  /** 建议摘要 */
  summary: string
  /** 置信度 (0-1) */
  confidence: number
  /** Agent 版本 */
  agentVersion: string
  /** 生成时间 */
  timestamp: number
  /** 是否通过校验 */
  validated: boolean
  /** 校验错误（如果有） */
  validationErrors?: string[]
}

/**
 * 审计记录
 */
export interface AuditRecord {
  /** 记录 ID */
  id: string
  /** 建议 ID */
  suggestionId: string
  /** 用户 prompt */
  prompt: string
  /** 执行动作 */
  action: 'accepted' | 'rejected' | 'partial' | 'rollback'
  /** 应用的差异项（部分接受时） */
  appliedDiffs?: string[]
  /** Agent 版本 */
  agentVersion: string
  /** 变更摘要 */
  changeSummary: string
  /** 执行前快照（组件树） */
  beforeSnapshot: NodeSchema[]
  /** 执行后快照 */
  afterSnapshot?: NodeSchema[]
  /** 时间戳 */
  timestamp: number
  /** 用户备注 */
  note?: string
}

/**
 * 白名单配置
 */
export interface WhitelistConfig {
  /** 允许的组件类型 */
  allowedComponents: string[]
  /** 允许的属性前缀 */
  allowedPropPrefixes: string[]
  /** 禁止的属性（黑名单） */
  forbiddenProps: string[]
  /** 允许的数据源类型 */
  allowedDataSources: string[]
}

/**
 * 建议状态
 */
export type SuggestionStatus = 'pending' | 'previewing' | 'accepted' | 'rejected'

/**
 * 建议项（UI 层）
 */
export interface SuggestionItem {
  result: SuggestionResult
  status: SuggestionStatus
  createdAt: number
}
