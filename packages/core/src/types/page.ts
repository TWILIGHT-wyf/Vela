import type { NodeSchema } from './schema'

/**
 * Page template for predefined layouts
 */
export interface PageTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: 'dashboard' | 'gis' | 'form' | 'chart' | 'other'
  /**
   * 模板包含的组件树
   * 使用 NodeSchema 替代旧的 Component
   */
  children: NodeSchema[]
}
