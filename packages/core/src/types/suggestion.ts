/**
 * AI Suggestion types for the suggestion/assist feature
 * V2.0: Uses NodeSchema instead of legacy Component type
 */

import type { NodeSchema } from './schema'

/**
 * Request payload for generating suggestions
 */
export interface SuggestionRequest {
  prompt: string
  context: {
    components: NodeSchema[]
    canvasSize: {
      width: number
      height: number
    }
  }
  timestamp: number
}

/**
 * A single diff/change in the suggestion
 */
export interface SuggestionDiff {
  type: 'add' | 'modify' | 'delete'
  targetId?: string
  description: string
  before?: Partial<NodeSchema>
  after?: Partial<NodeSchema>
  newComponent?: NodeSchema
}

/**
 * Result of a suggestion generation
 */
export interface SuggestionResult {
  id: string
  request: SuggestionRequest
  diffs: SuggestionDiff[]
  explanation: string
  agentVersion: string
  confidence?: number
  generatedAt: number
  // Additional properties used by UI
  validated?: boolean
  summary?: string
  validationErrors?: string[]
}

/**
 * Status of a suggestion item
 */
export type SuggestionStatus = 'pending' | 'previewing' | 'accepted' | 'rejected'

/**
 * A suggestion item with status tracking
 */
export interface SuggestionItem {
  result: SuggestionResult
  status: SuggestionStatus
  createdAt: number
}

/**
 * Action type for audit records
 */
export type AuditAction = 'accepted' | 'partial' | 'rejected' | 'rollback'

/**
 * Audit record for tracking suggestion history
 */
export interface AuditRecord {
  id: string
  suggestionId: string
  prompt: string
  action: AuditAction
  appliedDiffs?: string[]
  agentVersion: string
  changeSummary: string
  beforeSnapshot: NodeSchema[]
  afterSnapshot?: NodeSchema[]
  timestamp: number
  note?: string
}

/**
 * Diff action type for DiffViewer component
 */
export type DiffActionType = 'add' | 'modify' | 'delete'

/**
 * Diff item for DiffViewer component
 */
export interface DiffItem {
  action: DiffActionType
  componentType: string
  componentId?: string
  description: string
  component?: NodeSchema
  path?: string
  oldValue?: unknown
  newValue?: unknown
}
