import { NodeSchema } from './schema'
import { ApiSchema, VariableSchema } from './data'

export interface PageConfig {
  layout: 'free' | 'flow'
  theme?: string
  width?: number
  height?: number
  [key: string]: unknown
}

/**
 * 页面定义
 */
export interface PageSchema {
  id: string
  name: string
  path: string
  title?: string
  // 关联的布局ID
  layoutId?: string
  config?: PageConfig
  // 页面状态定义
  state?: VariableSchema[]
  // 页面API定义
  apis?: ApiSchema[]
  // 页面生命周期
  lifecycle?: {
    onLoad?: string // Action ID
    onUnload?: string // Action ID
  }
  // 页面组件树 (根节点通常是 Page)
  children: NodeSchema
}

/**
 * 布局定义
 */
export interface LayoutSchema {
  id: string
  name: string
  description?: string
  // 布局组件树 (根节点，包含 RouterView 插槽)
  children: NodeSchema
  // 该布局下的页面列表
  pages: PageSchema[]
}
