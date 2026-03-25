import type { RuntimeContext, RuntimePlugin } from '../types'
import { useDataBindingEngine } from './useDataBindingEngine'
import { useEventExecutor } from './useEventExecutor'

/**
 * Data binding runtime plugin.
 */
export const DataBindingPlugin: RuntimePlugin = (context: RuntimeContext) => {
  const engine = useDataBindingEngine(context.components)
  engine.start()

  return () => {
    engine.stop()
  }
}

/**
 * Event executor runtime plugin.
 */
export const EventExecutorPlugin: RuntimePlugin = (context: RuntimeContext) => {
  const { handleComponentEvent } = useEventExecutor({
    components: context.components,
    pages: context.pages,
    state: context.state,
    isProjectMode: context.isProjectMode,
    router: context.router,
    onNavigate: context.onNavigate,
  })

  const unsubscribe = context.subscribeComponentEvent((payload) => {
    void handleComponentEvent({
      componentId: payload.componentId,
      eventType: payload.eventType,
      actions: payload.actions,
      event: payload.event,
      runtimeState: payload.runtimeState,
    })
  })

  return () => {
    unsubscribe()
  }
}
