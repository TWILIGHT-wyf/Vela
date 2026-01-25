import { PageSchema } from './page'

/**
 * 项目配置协议
 */
export interface ProjectSchema {
  version: string
  name: string
  description?: string
  config: {
    layout: 'mobile' | 'pc'
    theme: string
  }
  // 多页面定义
  pages: PageSchema[]
}
