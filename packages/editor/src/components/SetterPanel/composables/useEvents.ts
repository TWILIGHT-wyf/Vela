import { computed } from 'vue'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import type { ActionSchema } from '@vela/core/types/action'
import { isNodeEventActionLinkRef, type NodeEventAction } from '@vela/core/types/schema'

type EditableAction = ActionSchema<string> & {
  content?: string
  blank?: boolean
  stateName?: string
}

function toEditableActions(actions?: NodeEventAction[]): EditableAction[] {
  if (!actions) return []
  return actions.filter((action): action is EditableAction => !isNodeEventActionLinkRef(action))
}

function mergeEditableActions(
  existing: NodeEventAction[] | undefined,
  editableActions: EditableAction[],
): NodeEventAction[] {
  if (!existing || existing.length === 0) {
    return editableActions as NodeEventAction[]
  }

  const queue = [...editableActions]
  const merged: NodeEventAction[] = []

  for (const action of existing) {
    if (isNodeEventActionLinkRef(action)) {
      merged.push(action)
      continue
    }

    const next = queue.shift()
    if (next) {
      merged.push(next as NodeEventAction)
    }
  }

  for (const action of queue) {
    merged.push(action as NodeEventAction)
  }

  return merged
}

export function useEventConfiguration() {
  const componentStore = useComponent()
  const { selectedNode } = storeToRefs(componentStore)

  function commitEventActions(type: 'click' | 'hover', editableActions: EditableAction[]) {
    const node = selectedNode.value
    if (!node) return

    const existing = node.events?.[type]
    const merged = mergeEditableActions(existing, editableActions)
    const nextEvents = {
      ...(node.events || {}),
      [type]: merged,
    }

    componentStore.updateEvents(node.id, nextEvents as Record<string, unknown[]>)
  }

  const clickActions = computed<EditableAction[]>({
    get: () => {
      return toEditableActions(selectedNode.value?.events?.click)
    },
    set: (value: EditableAction[]) => {
      commitEventActions('click', value)
    },
  })

  const hoverActions = computed<EditableAction[]>({
    get: () => {
      return toEditableActions(selectedNode.value?.events?.hover)
    },
    set: (value: EditableAction[]) => {
      commitEventActions('hover', value)
    },
  })

  function addClickAction() {
    const next = [...clickActions.value]
    next.push({
      id: nanoid(),
      type: 'alert',
    } as EditableAction)
    commitEventActions('click', next)
  }

  function removeClickAction(index: number) {
    const next = [...clickActions.value]
    if (index < 0 || index >= next.length) return
    next.splice(index, 1)
    commitEventActions('click', next)
  }

  function addHoverAction() {
    const next = [...hoverActions.value]
    next.push({
      id: nanoid(),
      type: 'alert',
    } as EditableAction)
    commitEventActions('hover', next)
  }

  function removeHoverAction(index: number) {
    const next = [...hoverActions.value]
    if (index < 0 || index >= next.length) return
    next.splice(index, 1)
    commitEventActions('hover', next)
  }

  return {
    clickActions,
    hoverActions,
    addClickAction,
    removeClickAction,
    addHoverAction,
    removeHoverAction,
  }
}
