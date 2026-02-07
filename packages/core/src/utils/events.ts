type Handler<T = unknown> = (event: T) => void

export class TypedEmitter<Events extends { [K: string]: unknown }> {
  private handlers: Map<keyof Events, Set<Handler<unknown>>> = new Map()

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler as Handler<unknown>)
  }

  /**
   * 只监听一次，触发后自动移除
   */
  once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void {
    const onceHandler: Handler<Events[Key]> = (event: Events[Key]) => {
      this.off(type, onceHandler)
      handler(event)
    }
    this.on(type, onceHandler)
  }

  off<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler as Handler<unknown>)
    }
  }

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      // 创建副本以避免在迭代时修改（once 会在回调中移除自身）
      const handlersCopy = [...handlers]
      handlersCopy.forEach((handler) => handler(event))
    }
  }

  /**
   * 检查是否有指定事件的监听器
   */
  hasListeners<Key extends keyof Events>(type: Key): boolean {
    const handlers = this.handlers.get(type)
    return handlers !== undefined && handlers.size > 0
  }

  clear(): void {
    this.handlers.clear()
  }
}
