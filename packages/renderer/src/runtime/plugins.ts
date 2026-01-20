import { onMounted, onBeforeUnmount } from 'vue'
import type { RuntimePlugin, RuntimeContext } from '../types'
import { useDataBindingEngine } from './useDataBindingEngine'
import { useEventExecutor } from './useEventExecutor'

/**
 * 数据联动插件
 */
export const DataBindingPlugin: RuntimePlugin = (context: RuntimeContext) => {
  const engine = useDataBindingEngine(context.components)

  onMounted(() => {
    engine.start()
  })

  onBeforeUnmount(() => {
    engine.stop()
  })
}

/**
 * 事件执行器插件
 */
export const EventExecutorPlugin: RuntimePlugin = (context: RuntimeContext) => {
  const { handleComponentEvent } = useEventExecutor({
    components: context.components,
    pages: context.pages,
    isProjectMode: context.isProjectMode,
    router: context.router,
    // 如果需要自定义 navigate，可以在这里处理，或者让 useEventExecutor 默认处理
  })

  // 订阅组件事件
  context.subscribeComponentEvent((payload) => {
    handleComponentEvent(payload)
  })
}
