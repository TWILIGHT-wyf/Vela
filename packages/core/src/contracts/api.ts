/**
 * API types for server communication
 */

import type { ProjectSchema } from '../types/project'

/**
 * Server-side project representation
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
 * Project input for create/update operations
 */
export interface ProjectInput {
  name: string
  description?: string
  schema: ProjectSchema
}

/**
 * Canvas settings
 */
export interface CanvasSettings {
  width: number
  height: number
  backgroundColor?: string
  gridEnabled?: boolean
  snapEnabled?: boolean
}
