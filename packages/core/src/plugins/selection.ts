import { Plugin, PluginContext } from '../runtime/plugin'
import type { Operation } from '../runtime/operation'
import { TypedEmitter } from '../utils/events'

export interface SelectionEvents {
  change: string[] // selected ids
  [key: string]: unknown
}

export class SelectionPlugin extends TypedEmitter<SelectionEvents> implements Plugin {
  name = 'selection'
  private selectedIds = new Set<string>()
  private ctx!: PluginContext
  private opHandler: ((op: Operation) => void) | null = null

  init(ctx: PluginContext) {
    this.ctx = ctx

    // 监听操作：如果被选中的节点被删除了，自动取消选中
    this.opHandler = (op) => {
      if (op.type === 'delete') {
        if (this.selectedIds.has(op.nodeId)) {
          this.deselect(op.nodeId)
        }
      }
    }
    ctx.onOp(this.opHandler)
  }

  destroy() {
    this.selectedIds.clear()
    this.clear() // TypedEmitter.clear()
    this.opHandler = null
  }

  select(id: string) {
    this.selectedIds.clear()
    this.selectedIds.add(id)
    this.emitChange()
  }

  multiSelect(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id)
    } else {
      this.selectedIds.add(id)
    }
    this.emitChange()
  }

  deselect(id?: string) {
    if (id) {
      this.selectedIds.delete(id)
    } else {
      this.selectedIds.clear()
    }
    this.emitChange()
  }

  get selection() {
    return Array.from(this.selectedIds)
  }

  private emitChange() {
    this.emit('change', this.selection)
  }
}
