import { computed } from 'vue'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import type { ActionSchema } from '@vela/core/types/action'
import type { NodeEventAction } from '@vela/core/types/schema'

export type SupportedEventName = 'click' | 'hover' | 'doubleClick'

const SUPPORTED_EVENT_NAMES: SupportedEventName[] = ['click', 'hover', 'doubleClick']

function cloneEvents(
  events: Record<string, NodeEventAction[]> | undefined,
): Record<string, NodeEventAction[]> {
  if (!events) return {}
  return JSON.parse(JSON.stringify(events))
}

function toEventActions(actions: NodeEventAction[] | undefined): NodeEventAction[] {
  return Array.isArray(actions) ? actions : []
}

function createDefaultAction(): ActionSchema<string> {
  return {
    id: nanoid(),
    type: 'showToast',
    payload: {
      message: '提示消息',
      type: 'info',
    },
  }
}

export function useEventConfiguration() {
  const componentStore = useComponent()
  const { selectedNode } = storeToRefs(componentStore)

  function commitEvents(updater: (events: Record<string, NodeEventAction[]>) => void) {
    const node = selectedNode.value
    if (!node) return

    const events = cloneEvents(node.events as Record<string, NodeEventAction[]> | undefined)
    updater(events)
    componentStore.updateEvents(node.id, events as Record<string, unknown[]>)
  }

  function getActions(eventName: SupportedEventName): NodeEventAction[] {
    return toEventActions(selectedNode.value?.events?.[eventName])
  }

  function setActions(eventName: SupportedEventName, actions: NodeEventAction[]) {
    commitEvents((events) => {
      if (!actions.length) {
        delete events[eventName]
        return
      }
      events[eventName] = actions
    })
  }

  function addAction(eventName: SupportedEventName, action?: NodeEventAction) {
    const next = [...getActions(eventName), action ?? createDefaultAction()]
    setActions(eventName, next)
  }

  function removeAction(eventName: SupportedEventName, index: number) {
    const next = [...getActions(eventName)]
    if (index < 0 || index >= next.length) return
    next.splice(index, 1)
    setActions(eventName, next)
  }

  function updateAction(eventName: SupportedEventName, index: number, action: NodeEventAction) {
    const next = [...getActions(eventName)]
    if (index < 0 || index >= next.length) return
    next[index] = action
    setActions(eventName, next)
  }

  const clickActions = computed<NodeEventAction[]>({
    get: () => getActions('click'),
    set: (actions) => setActions('click', actions),
  })

  const hoverActions = computed<NodeEventAction[]>({
    get: () => getActions('hover'),
    set: (actions) => setActions('hover', actions),
  })

  const doubleClickActions = computed<NodeEventAction[]>({
    get: () => getActions('doubleClick'),
    set: (actions) => setActions('doubleClick', actions),
  })

  return {
    eventNames: SUPPORTED_EVENT_NAMES,
    clickActions,
    hoverActions,
    doubleClickActions,
    addAction,
    removeAction,
    updateAction,
  }
}
