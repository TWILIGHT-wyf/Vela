import type { NodeGeometry, NodeSchema, NodeStyle } from '@vela/core'
import type { Command, CommandType } from './types'

/**
 * Store 获取函数类型
 * 使用函数而非直接引用，避免循环依赖和确保获取最新实例
 */
export interface ComponentStoreAccessor {
  findNodeById(node: NodeSchema | null, id: string): NodeSchema | null
  getNodeIndex(id: string): number
  getParentId(id: string): string | null
  addComponentRaw(parentId: string | null, component: NodeSchema, index?: number): string
  deleteComponentRaw(id: string): void
  moveComponentRaw(id: string, newParentId: string, newIndex: number): void
  updateStyleRaw(id: string, style: Partial<NodeStyle>): void
  updatePropsRaw(id: string, props: Record<string, unknown>): void
  updateDataSourceRaw(id: string, dataSource: Record<string, unknown>): void
  updateGeometryRaw(id: string, geometry: Partial<NodeGeometry>): void
  updateChildLayoutRaw(id: string, childLayout: 'free' | 'flow' | undefined): void
}

// Store accessor 将在初始化时设置
let storeAccessor: ComponentStoreAccessor | null = null

/**
 * 设置 store accessor
 * 应在 component store 初始化后调用
 */
export function setStoreAccessor(accessor: ComponentStoreAccessor) {
  storeAccessor = accessor
}

/**
 * 获取 store accessor
 */
function getStore(): ComponentStoreAccessor {
  if (!storeAccessor) {
    throw new Error('[Commands] Store accessor not initialized. Call setStoreAccessor first.')
  }
  return storeAccessor
}

/**
 * 添加组件命令
 */
export class AddComponentCommand implements Command {
  readonly type: CommandType = 'add-component'
  readonly description: string

  private parentId: string | null
  private component: NodeSchema
  private index?: number
  private addedId?: string

  constructor(parentId: string | null, component: NodeSchema, index?: number) {
    this.parentId = parentId
    this.component = structuredClone(component)
    this.index = index
    this.description = `Add ${component.component}`
  }

  execute(): void {
    const store = getStore()
    this.addedId = store.addComponentRaw(this.parentId, this.component, this.index)
  }

  undo(): void {
    const store = getStore()
    if (this.addedId) {
      store.deleteComponentRaw(this.addedId)
    }
  }

  redo(): void {
    this.execute()
  }

  /** 获取添加的组件 ID */
  getAddedId(): string | undefined {
    return this.addedId
  }
}

/**
 * 删除组件命令
 */
export class DeleteComponentCommand implements Command {
  readonly type: CommandType = 'delete-component'
  readonly description: string

  private id: string
  private deletedNode?: NodeSchema
  private parentId?: string | null
  private index?: number

  constructor(id: string) {
    this.id = id
    this.description = `Delete component ${id}`
  }

  execute(): void {
    const store = getStore()

    // 保存删除前的状态用于 undo
    const node = store.findNodeById(null, this.id)
    this.deletedNode = node ? structuredClone(node) : undefined
    this.parentId = store.getParentId(this.id)
    this.index = store.getNodeIndex(this.id)

    store.deleteComponentRaw(this.id)
  }

  undo(): void {
    const store = getStore()
    if (this.deletedNode && this.parentId !== undefined) {
      store.addComponentRaw(this.parentId, this.deletedNode, this.index)
    }
  }

  redo(): void {
    const store = getStore()
    store.deleteComponentRaw(this.id)
  }
}

/**
 * 移动组件命令
 */
export class MoveComponentCommand implements Command {
  readonly type: CommandType = 'move-component'
  readonly description: string

  private id: string
  private newParentId: string
  private newIndex: number
  private oldParentId?: string | null
  private oldIndex?: number

  constructor(id: string, newParentId: string, newIndex: number) {
    this.id = id
    this.newParentId = newParentId
    this.newIndex = newIndex
    this.description = `Move component ${id}`
  }

  execute(): void {
    const store = getStore()

    // 保存旧位置
    this.oldParentId = store.getParentId(this.id)
    this.oldIndex = store.getNodeIndex(this.id)

    store.moveComponentRaw(this.id, this.newParentId, this.newIndex)
  }

  undo(): void {
    const store = getStore()
    if (this.oldParentId !== undefined && this.oldIndex !== undefined) {
      store.moveComponentRaw(this.id, this.oldParentId!, this.oldIndex)
    }
  }

  redo(): void {
    const store = getStore()
    store.moveComponentRaw(this.id, this.newParentId, this.newIndex)
  }
}

/**
 * 更新样式命令
 */
export class UpdateStyleCommand implements Command {
  readonly type: CommandType = 'update-style'
  readonly description: string

  private id: string
  private newStyle: Partial<NodeStyle>
  private oldStyle?: Partial<NodeStyle>
  private timestamp: number

  constructor(id: string, newStyle: Partial<NodeStyle>) {
    this.id = id
    this.newStyle = structuredClone(newStyle)
    this.timestamp = Date.now()
    this.description = `Update style of ${id}`
  }

  execute(): void {
    const store = getStore()
    const node = store.findNodeById(null, this.id)

    // 保存旧值
    if (node) {
      this.oldStyle = {}
      for (const key of Object.keys(this.newStyle)) {
        this.oldStyle[key as keyof NodeStyle] = node.style?.[key as keyof NodeStyle]
      }
    }

    store.updateStyleRaw(this.id, this.newStyle)
  }

  undo(): void {
    const store = getStore()
    if (this.oldStyle) {
      store.updateStyleRaw(this.id, this.oldStyle)
    }
  }

  redo(): void {
    const store = getStore()
    store.updateStyleRaw(this.id, this.newStyle)
  }

  /**
   * 检查是否可以与另一个命令合并
   * 连续的同一组件样式更新可以合并（300ms 内）
   */
  canMerge(other: Command): boolean {
    if (other.type !== 'update-style') return false
    const otherCmd = other as UpdateStyleCommand
    // 同一组件，300ms 内的连续更新可以合并
    return otherCmd.id === this.id && this.timestamp - otherCmd.timestamp < 300
  }

  /**
   * 合并另一个命令
   */
  merge(other: Command): Command {
    const otherCmd = other as UpdateStyleCommand
    const merged = new UpdateStyleCommand(this.id, {
      ...otherCmd.newStyle,
      ...this.newStyle,
    })
    // 保留最早的 oldStyle
    merged.oldStyle = otherCmd.oldStyle
    return merged
  }
}

/**
 * 更新属性命令
 */
export class UpdatePropsCommand implements Command {
  readonly type: CommandType = 'update-props'
  readonly description: string

  private id: string
  private newProps: Record<string, unknown>
  private oldProps?: Record<string, unknown>
  private timestamp: number

  constructor(id: string, newProps: Record<string, unknown>) {
    this.id = id
    this.newProps = structuredClone(newProps)
    this.timestamp = Date.now()
    this.description = `Update props of ${id}`
  }

  execute(): void {
    const store = getStore()
    const node = store.findNodeById(null, this.id)

    // 保存旧值
    if (node) {
      this.oldProps = {}
      for (const key of Object.keys(this.newProps)) {
        this.oldProps[key] = node.props?.[key]
      }
    }

    store.updatePropsRaw(this.id, this.newProps)
  }

  undo(): void {
    const store = getStore()
    if (this.oldProps) {
      store.updatePropsRaw(this.id, this.oldProps)
    }
  }

  redo(): void {
    const store = getStore()
    store.updatePropsRaw(this.id, this.newProps)
  }

  canMerge(other: Command): boolean {
    if (other.type !== 'update-props') return false
    const otherCmd = other as UpdatePropsCommand
    return otherCmd.id === this.id && this.timestamp - otherCmd.timestamp < 300
  }

  merge(other: Command): Command {
    const otherCmd = other as UpdatePropsCommand
    const merged = new UpdatePropsCommand(this.id, {
      ...otherCmd.newProps,
      ...this.newProps,
    })
    merged.oldProps = otherCmd.oldProps
    return merged
  }
}

/**
 * 更新数据源命令
 */
export class UpdateDataSourceCommand implements Command {
  readonly type: CommandType = 'update-data-source'
  readonly description: string

  private id: string
  private newDataSource: Record<string, unknown>
  private oldDataSource?: Record<string, unknown>

  constructor(id: string, newDataSource: Record<string, unknown>) {
    this.id = id
    this.newDataSource = structuredClone(newDataSource)
    this.description = `Update data source of ${id}`
  }

  execute(): void {
    const store = getStore()
    const node = store.findNodeById(null, this.id)

    // 保存旧值
    if (node) {
      this.oldDataSource = {}
      for (const key of Object.keys(this.newDataSource)) {
        this.oldDataSource[key] = node.dataSource?.[key as keyof typeof node.dataSource]
      }
    }

    store.updateDataSourceRaw(this.id, this.newDataSource)
  }

  undo(): void {
    const store = getStore()
    if (this.oldDataSource) {
      store.updateDataSourceRaw(this.id, this.oldDataSource)
    }
  }

  redo(): void {
    const store = getStore()
    store.updateDataSourceRaw(this.id, this.newDataSource)
  }
}

/**
 * 更新画布布局命令
 * 用于自由定位模式下的 x/y/rotate 等变更
 */
export class UpdateGeometryCommand implements Command {
  readonly type: CommandType = 'update-geometry'
  readonly description: string

  private id: string
  private newGeometry: Partial<NodeGeometry>
  private oldGeometry?: Partial<NodeGeometry>
  private timestamp: number

  constructor(id: string, newGeometry: Partial<NodeGeometry>) {
    this.id = id
    this.newGeometry = structuredClone(newGeometry)
    this.timestamp = Date.now()
    this.description = `Update geometry of ${id}`
  }

  execute(): void {
    const store = getStore()
    const node = store.findNodeById(null, this.id)

    // 保存旧值
    if (node) {
      this.oldGeometry = node.geometry ? structuredClone(node.geometry) : undefined
    }

    store.updateGeometryRaw(this.id, this.newGeometry)
  }

  undo(): void {
    const store = getStore()
    if (this.oldGeometry) {
      store.updateGeometryRaw(this.id, this.oldGeometry)
    }
  }

  redo(): void {
    const store = getStore()
    store.updateGeometryRaw(this.id, this.newGeometry)
  }

  /**
   * 检查是否可以与另一个命令合并
   * 连续的同一组件布局更新可以合并（300ms 内，用于拖拽）
   */
  canMerge(other: Command): boolean {
    if (other.type !== 'update-geometry') return false
    const otherCmd = other as UpdateGeometryCommand
    return otherCmd.id === this.id && this.timestamp - otherCmd.timestamp < 300
  }

  /**
   * 合并另一个命令
   */
  merge(other: Command): Command {
    const otherCmd = other as UpdateGeometryCommand
    const merged = new UpdateGeometryCommand(this.id, {
      ...otherCmd.newGeometry,
      ...this.newGeometry,
    })
    // 保留最早的 oldGeometry
    merged.oldGeometry = otherCmd.oldGeometry
    return merged
  }
}

/**
 * 更新子节点布局模式命令
 */
export class UpdateChildLayoutCommand implements Command {
  readonly type: CommandType = 'update-container-layout'
  readonly description: string

  private id: string
  private newChildLayout: 'free' | 'flow' | undefined
  private oldChildLayout?: 'free' | 'flow'

  constructor(id: string, childLayout: 'free' | 'flow' | undefined) {
    this.id = id
    this.newChildLayout = childLayout
    this.description = `Update container layout of ${id}`
  }

  execute(): void {
    const store = getStore()
    const node = store.findNodeById(null, this.id)

    if (node) {
      this.oldChildLayout = node.container?.mode
    }

    store.updateChildLayoutRaw(this.id, this.newChildLayout)
  }

  undo(): void {
    const store = getStore()
    store.updateChildLayoutRaw(this.id, this.oldChildLayout)
  }

  redo(): void {
    const store = getStore()
    store.updateChildLayoutRaw(this.id, this.newChildLayout)
  }
}

/**
 * 批量命令
 * 将多个命令作为一个原子操作执行
 */
export class BatchCommand implements Command {
  readonly type: CommandType = 'batch'
  readonly description: string

  private commands: Command[]

  constructor(commands: Command[], description?: string) {
    this.commands = commands
    this.description = description || `Batch (${commands.length} operations)`
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute()
    }
  }

  undo(): void {
    // 逆序撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }

  redo(): void {
    for (const cmd of this.commands) {
      cmd.redo()
    }
  }
}
