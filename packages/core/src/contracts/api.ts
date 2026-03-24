/**
 * 服务端通信相关类型
 */

import type { ProjectSchema } from '../types/project'

/**
 * 服务端项目结构
 */
export interface ServerProject {
  _id: string
  name: string
  description?: string
  schema: ProjectSchema
  createdAt: string
  updatedAt: string
}

/**
 * 项目创建/更新入参
 */
export interface ProjectInput {
  name: string
  description?: string
  schema: ProjectSchema
}

/**
 * 画布设置
 */
export interface CanvasSettings {
  width: number
  height: number
  backgroundColor?: string
  gridEnabled?: boolean
  snapEnabled?: boolean
}
