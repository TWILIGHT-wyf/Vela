/**
 * Command Pattern for Unified Data Updates
 *
 * This module provides a centralized command execution system that:
 * 1. Records history before every update
 * 2. Validates changes
 * 3. Provides undo/redo support
 *
 * Usage:
 * ```typescript
 * const { executeCommand } = useCommands()
 * executeCommand({
 *   type: 'update-prop',
 *   id: 'component-1',
 *   path: 'props.text',
 *   value: 'new text',
 * })
 * ```
 */

import { useHistoryStore } from './history'
import { useComponent } from './component'
import { getPropSchema } from '@vela/core/validation'
import { ElMessage } from 'element-plus'
import type { NodeSchema, AnimationConfig } from '@vela/core'
import type { NodeGeometry } from '@vela/core/types'

// ========== Command Types ==========

export type CommandType =
  | 'update-prop'
  | 'update-style'
  | 'update-geometry'
  | 'update-animation'
  | 'add-component'
  | 'delete-component'
  | 'move-component'

export interface BaseCommand {
  type: CommandType
  id?: string
  parentId?: string | null
  index?: number
  timestamp: number
}

export interface UpdatePropCommand extends BaseCommand {
  type: 'update-prop'
  id: string
  path: string
  value: unknown
}

export interface UpdateStyleCommand extends BaseCommand {
  type: 'update-style'
  id: string
  path: string
  value: unknown
}

export interface UpdateGeometryCommand extends BaseCommand {
  type: 'update-geometry'
  id: string
  geometry: Partial<NodeGeometry>
}

export interface UpdateAnimationCommand extends BaseCommand {
  type: 'update-animation'
  id: string
  animation: AnimationConfig
}

export interface AddComponentCommand extends BaseCommand {
  type: 'add-component'
  parentId: string | null
  component: NodeSchema
  index?: number
}

export interface DeleteComponentCommand extends BaseCommand {
  type: 'delete-component'
  id: string
}

export interface MoveComponentCommand extends BaseCommand {
  type: 'move-component'
  id: string
  newParentId: string
  newIndex: number
}

export type Command =
  | UpdatePropCommand
  | UpdateStyleCommand
  | UpdateGeometryCommand
  | UpdateAnimationCommand
  | AddComponentCommand
  | DeleteComponentCommand
  | MoveComponentCommand

// ========== Validation Utilities ==========

/**
 * Validate a component ID exists in tree
 */
function validateComponentId(componentStore: ReturnType<typeof useComponent>, id: string): boolean {
  if (!componentStore.rootNode) {
    console.warn('[Commands] Root node is null')
    return false
  }

  const node = componentStore.findNodeById(componentStore.rootNode, id)
  if (!node) {
    console.warn(`[Commands] Component not found: ${id}`)
    return false
  }

  return true
}

/**
 * Validate a parent ID exists
 */
function validateParentId(
  componentStore: ReturnType<typeof useComponent>,
  parentId: string | null,
): boolean {
  if (parentId === null) return true

  if (!componentStore.rootNode) {
    console.warn('[Commands] Root node is null')
    return false
  }

  const node = componentStore.findNodeById(componentStore.rootNode, parentId)
  if (!node) {
    console.warn(`[Commands] Parent not found: ${parentId}`)
    return false
  }

  return true
}

// ========== Command Executors ==========

/**
 * Execute update-property command
 */
function executeUpdateProp(
  command: UpdatePropCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false

  const node = componentStore.findNodeById(componentStore.rootNode!, command.id)
  if (!node) return false

  // Validation: Check Zod schema if registered
  const componentName = node.component || node.componentName
  if (componentName) {
    const schema = getPropSchema(componentName, command.path)
    if (schema) {
      const result = schema.safeParse(command.value)
      if (!result.success) {
        console.warn(
          `[Commands] Validation failed for ${componentName}.${command.path}:`,
          result.error,
        )
        const msg = result.error.errors[0]?.message || 'Validation failed'
        ElMessage.warning(`Invalid value: ${msg}`)
        return false
      }
    }
  }

  if (!node.props) {
    node.props = {}
  }

  // Support nested path like "dataSource.config.url"
  if (command.path.includes('.')) {
    const parts = command.path.split('.')
    let current: Record<string, unknown> = node.props
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = command.value as any
  } else {
    node.props[command.path] = command.value as any
  }

  console.log(`[Commands] Updated prop ${command.path} for component ${command.id}`)
  return true
}

/**
 * Execute update-style command
 */
function executeUpdateStyle(
  command: UpdateStyleCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false

  const node = componentStore.findNodeById(componentStore.rootNode!, command.id)
  if (!node) return false

  // Validation: Check Zod schema if registered
  const componentName = node.component || node.componentName
  if (componentName) {
    if (!command.path.includes('.')) {
      const schema = getPropSchema(componentName, command.path)
      if (schema) {
        const result = schema.safeParse(command.value)
        if (!result.success) {
          console.warn(
            `[Commands] Validation failed for ${componentName}.${command.path}:`,
            result.error,
          )
          const msg = result.error.errors[0]?.message || 'Validation failed'
          ElMessage.warning(`属性校验失败: ${msg}`)
          return false
        }
      }
    }
  }

  if (!node.style) {
    node.style = {}
  }

  node.style[command.path] = command.value as any

  console.log(`[Commands] Updated style ${command.path} for component ${command.id}`)
  return true
}

/**
 * Execute update-geometry command
 */
function executeUpdateGeometry(
  command: UpdateGeometryCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false

  const node = componentStore.findNodeById(componentStore.rootNode!, command.id)
  if (!node) return false

  node.geometry = {
    ...(node.geometry || { mode: 'free' }),
    ...command.geometry,
  } as NodeGeometry

  console.log(`[Commands] Updated geometry for component ${command.id}`)
  return true
}

/**
 * Execute update-animation command
 */
function executeUpdateAnimation(
  command: UpdateAnimationCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false

  const node = componentStore.findNodeById(componentStore.rootNode!, command.id)
  if (!node) return false

  node.animation = command.animation

  console.log(`[Commands] Updated animation for component ${command.id}`)
  return true
}

/**
 * Execute add-component command
 */
function executeAddComponent(
  command: AddComponentCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateParentId(componentStore, command.parentId)) return false

  const newId = componentStore.addComponent(command.parentId, command.component, command.index)

  if (newId) {
    console.log(`[Commands] Added component ${newId}`)
    return true
  }

  console.error('[Commands] Failed to add component')
  return false
}

/**
 * Execute delete-component command
 */
function executeDeleteComponent(
  command: DeleteComponentCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false

  componentStore.deleteComponent(command.id)

  console.log(`[Commands] Deleted component ${command.id}`)
  return true
}

/**
 * Execute move-component command
 */
function executeMoveComponent(
  command: MoveComponentCommand,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  if (!validateComponentId(componentStore, command.id)) return false
  if (!validateParentId(componentStore, command.newParentId)) return false

  componentStore.moveComponent(command.id, command.newParentId, command.newIndex)

  console.log(`[Commands] Moved component ${command.id}`)
  return true
}

/**
 * Main command dispatcher
 */
function executeCommand(
  command: Command,
  componentStore: ReturnType<typeof useComponent>,
): boolean {
  switch (command.type) {
    case 'update-prop':
      return executeUpdateProp(command as UpdatePropCommand, componentStore)
    case 'update-style':
      return executeUpdateStyle(command as UpdateStyleCommand, componentStore)
    case 'update-geometry':
      return executeUpdateGeometry(command as UpdateGeometryCommand, componentStore)
    case 'update-animation':
      return executeUpdateAnimation(command as UpdateAnimationCommand, componentStore)
    case 'add-component':
      return executeAddComponent(command as AddComponentCommand, componentStore)
    case 'delete-component':
      return executeDeleteComponent(command as DeleteComponentCommand, componentStore)
    case 'move-component':
      return executeMoveComponent(command as MoveComponentCommand, componentStore)
    default:
      console.warn(`[Commands] Unknown command type: ${(command as Command).type}`)
      return false
  }
}

// ========== Hook ==========

/**
 * Composable for executing commands with history tracking
 */
export function useCommands() {
  const historyStore = useHistoryStore()
  const componentStore = useComponent()

  /**
   * Execute a command and record history
   */
  function executeCommandWithHistory(command: Command): boolean {
    // Commit current state to history before applying command
    historyStore.commit()

    // Execute of command
    const success = executeCommand(command, componentStore)

    if (!success) {
      // Rollback history if command failed
      historyStore.undo()
      console.error('[Commands] Command execution failed, rolled back')
    }

    return success
  }

  /**
   * Execute multiple commands as a single transaction
   */
  function executeBatch(commands: Command[]): boolean {
    // Commit current state to history
    historyStore.commit()

    // Execute all commands
    const results = commands.map((cmd) => executeCommand(cmd, componentStore))

    const allSuccess = results.every((r) => r)

    if (!allSuccess) {
      // Rollback if any command failed
      historyStore.undo()
      console.error('[Commands] Batch execution failed, rolled back')
    }

    return allSuccess
  }

  return {
    executeCommand: executeCommandWithHistory,
    executeBatch,
  }
}
