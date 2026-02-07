import { TreeModel } from '../model/tree'
import { Operation } from './operation'

/**
 * 插件上下文
 * 插件可以通过上下文访问 Model 和注册钩子
 */
export interface PluginContext {
  model: TreeModel

  /**
   * 注册操作监听器
   */
  onOp(callback: (op: Operation) => void): void

  /**
   * 注册销毁回调
   */
  onDispose(callback: () => void): void
}

/**
 * 插件接口
 */
export interface Plugin {
  name: string
  init(context: PluginContext): void
  destroy?(): void
}
