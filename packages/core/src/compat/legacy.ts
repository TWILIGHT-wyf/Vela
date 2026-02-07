/**
 * 遗留类型定义
 *
 * 这些类型已被标记为废弃，仅保留用于向后兼容
 * 新代码不应使用这些类型
 *
 * 迁移指南：
 * - LayoutMode → 使用 NodeStyle.display 控制布局
 * - DataBinding → 使用 Expression 进行数据绑定
 * - DataSourceConfig → 使用 PageSchema.apis 定义数据源
 * - JSExpression → 使用 Expression (在 expression.ts 中)
 * - Component/EventAction → 使用 NodeSchema/ActionSchema (在 components.ts 中)
 */

// ============================================================================
// 布局与数据绑定 (从 schema.ts 迁移)
// ============================================================================

/**
 * 布局模式
 * @deprecated 布局应通过 style.display 控制
 */
export type LayoutMode = 'free' | 'flex' | 'grid' | 'flow'

/**
 * 数据绑定配置
 * @deprecated 使用 Expression 替代组件间直接绑定
 */
export interface DataBinding {
  sourceId: string
  sourcePath: string
  targetPath: string
  transformer?: string
  transformerType?: 'expression' | 'template'
}

/**
 * 数据源配置
 * @deprecated 数据获取应在页面级 apis 中定义
 */
export interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  interval?: number
  dataPath?: string
}
