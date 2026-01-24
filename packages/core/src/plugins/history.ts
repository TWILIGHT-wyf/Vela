import { Plugin, PluginContext } from '../types/plugin'
import { HistoryManager, HistoryOptions } from '../model/history'

export class HistoryPlugin implements Plugin {
  name = 'history'
  private manager: HistoryManager | null = null
  private options: HistoryOptions

  constructor(options: HistoryOptions = {}) {
    this.options = options
  }

  init(ctx: PluginContext) {
    // 实例化现有的 Manager
    this.manager = new HistoryManager(ctx.model, this.options)
  }

  destroy() {
    this.manager?.dispose()
    this.manager = null
  }

  // 代理方法
  undo() {
    this.manager?.undo()
  }
  redo() {
    this.manager?.redo()
  }
  canUndo() {
    return this.manager?.canUndo() ?? false
  }
  canRedo() {
    return this.manager?.canRedo() ?? false
  }
}
