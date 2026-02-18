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
    onNavigate: context.onNavigate,
  })

  // 订阅组件事件
  context.subscribeComponentEvent((payload) => {
    handleComponentEvent({
      componentId: payload.componentId,
      eventType: payload.eventType,
      actions: payload.actions,
      event: payload.event,
    })
  })
}
