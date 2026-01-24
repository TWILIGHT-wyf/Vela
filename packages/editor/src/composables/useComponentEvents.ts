import { inject, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import type { ActionSchema } from '@vela/core/types/action'
import type { NodeSchema } from '@vela/core/types/schema'

const ComponentEventsKey = Symbol('ComponentEvents') as unknown as import('vue').InjectionKey<{
  emitComponentEvent: (componentId: string, eventName: string, params?: unknown) => void
  executeAction: (action: ActionSchema, sourceComponent?: NodeSchema) => Promise<void>
}>

export function provideComponentEvents() {
  const componentStore = useComponent()
  const { rootNode } = storeToRefs(componentStore)

  async function executeAction(action: ActionSchema, sourceComponent?: NodeSchema): Promise<void> {
    console.log('[ComponentEvents] Executing action:', action.type)

    switch (action.type) {
      case 'alert':
        if ('message' in action) {
          alert(action.message)
        }
        break
      case 'openUrl':
        if ('url' in action) {
          const url = action.url || ''
          if (action.blank) {
            window.open(url, '_blank')
          } else {
            window.location.href = url
          }
        }
        break
      case 'navigate':
        if ('path' in action) {
          window.location.hash = action.path || ''
        }
        break
      case 'updateState':
        if ('stateName' in action && 'value' in action) {
          // @ts-ignore
          console.log('Update state:', action.stateName, action.value)
        }
        break
      case 'customScript':
        if ('content' in action) {
          try {
            const fn = new Function('component', 'rootNode', action.content || '')
            fn(sourceComponent, rootNode?.value ?? null)
          } catch (error) {
            console.error('Error executing custom script:', error)
          }
        }
        break
    }
  }

  function emitComponentEvent(componentId: string, eventName: string, params?: unknown) {
    console.log('[ComponentEvents] Emitting event:', componentId, eventName, params)
  }

  const context = {
    emitComponentEvent,
    executeAction,
  }

  inject(ComponentEventsKey, context, true)
}

export function useComponentEvents() {
  const context = inject(ComponentEventsKey)
  if (!context) {
    throw new Error(
      'useComponentEvents must be used within a component that provides ComponentEventsKey',
    )
  }
  return context
}

export function useComponentEventHandlers(componentId: string) {
  const eventContext = useComponentEvents()
  const componentStore = useComponent()
  const { rootNode } = storeToRefs(componentStore)

  const component = computed(() => {
    function findNodeById(node: NodeSchema | null, id: string): NodeSchema | null {
      if (!node) return null
      if (node.id === id) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNodeById(child, id)
          if (found) return found
        }
      }
      return null
    }
    return findNodeById(rootNode.value, componentId)
  })

  async function handleClick() {
    const comp = component.value
    if (!comp?.events?.click) return

    for (const action of comp.events.click) {
      await eventContext.executeAction(action, comp)
    }
  }

  async function handleMouseEnter() {
    const comp = component.value
    if (!comp?.events?.mouseenter) return

    for (const action of comp.events.mouseenter) {
      await eventContext.executeAction(action, comp)
    }
  }

  async function handleDoubleClick() {
    const comp = component.value
    if (!comp?.events?.dblclick) return

    for (const action of comp.events.dblclick) {
      await eventContext.executeAction(action, comp)
    }
  }

  async function emitCustomEvent(eventName: string) {
    const comp = component.value
    if (!comp?.events?.[eventName]) return

    for (const action of comp.events[eventName]) {
      await eventContext.executeAction(action, comp)
    }
  }

  function onEvent(eventName: string, handler: (params?: unknown) => void) {
    console.log('[ComponentEventHandlers] Registering listener:', componentId, eventName, handler)
  }

  function offEvent(eventName: string) {
    console.log('[ComponentEventHandlers] Unregistering listener:', componentId, eventName)
  }

  return {
    component,
    handleClick,
    handleMouseEnter,
    handleDoubleClick,
    emitCustomEvent,
    onEvent,
    offEvent,
  }
}
