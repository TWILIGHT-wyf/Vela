/**
 * Stores 统一导出
 */
export { useProjectStore } from './project'
export { useComponent } from './component/index'
export type {
  ComponentIndexContext,
  ComponentSelectionContext,
  ComponentStyleContext,
  ComponentTreeContext,
  ComponentClipboardContext,
} from './component/index'
export { useHistoryStore } from './history'
export { useUIStore } from './ui'
export { useSuggestion } from './suggestion'
export { useCommands } from './commands'

export type { SaveStatus } from './project'
export type {
  Command,
  CommandType,
  UpdatePropCommand,
  UpdateStyleCommand,
  UpdatePositionCommand,
  UpdateSizeCommand,
  UpdateRotationCommand,
  UpdateAnimationCommand,
  AddComponentCommand,
  DeleteComponentCommand,
  MoveComponentCommand,
} from './commands'
