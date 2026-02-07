// API 服务层类型定义（前端与后端交互）
// 注意：这里只定义 API 交互格式，完整业务类型请查看 @/types/page.ts

// 导出建议相关类型
export type {
  SuggestionRequest,
  SuggestionResult,
  SuggestionDiff,
  DiffItem,
  WhitelistConfig,
  SuggestionItem,
  AuditRecord,
  SuggestionStatus,
} from './suggestion'

// 导出项目相关类型 (re-export from @vela/core)
export type { ProjectSchema as Project, PageSchema as ProjectPage } from '@vela/core'

// Server-side project types for API communication
export interface ServerProject {
  _id: string
  name: string
  description?: string
  schema: import('@vela/core').ProjectSchema
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  name: string
  description?: string
  schema: import('@vela/core').ProjectSchema
}

export interface CanvasSettings {
  width: number
  height: number
  backgroundColor?: string
  gridEnabled?: boolean
  snapEnabled?: boolean
}
