import { DataBindingPlugin, EventExecutorPlugin, type RuntimePlugin } from '@vela/renderer'

const runtimePlugins = Object.freeze([DataBindingPlugin, EventExecutorPlugin])

export function useRuntimePlugins(): RuntimePlugin[] {
  return [...runtimePlugins]
}
