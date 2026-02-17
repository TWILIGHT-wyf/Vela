import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useComponent } from '@/stores/component'
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

/**
 * 深拷贝事件对象（安全处理 Vue 响应式代理）
 */
function cloneEvents(events: Record<string, NodeEventAction[]>): Record<string, unknown[]> {
  return JSON.parse(JSON.stringify(events))
}

export function useEventConfiguration() {
  const componentStore = useComponent()
  const { selectedNode } = storeToRefs(componentStore)

  /**
   * 通过命令系统更新事件（支持撤销/重做）
   */
  function commitEvents(updater: (events: Record<string, NodeEventAction[]>) => void) {
    const node = selectedNode.value
    if (!node) return
    // 拷贝当前事件配置
    const events = node.events ? cloneEvents(node.events) : {}
    updater(events as Record<string, NodeEventAction[]>)
    componentStore.updateEvents(node.id, events)
  }

  const clickActions = computed<EditableAction[]>({
    get: () => {
      return toEditableActions(selectedNode.value?.events?.click)
    },
    set: (value: EditableAction[]) => {
      commitEvents((events) => {
        events.click = value as NodeEventAction[]
      })
    },
  })

  const hoverActions = computed<EditableAction[]>({
    get: () => {
      return toEditableActions(selectedNode.value?.events?.hover)
    },
    set: (value: EditableAction[]) => {
      commitEvents((events) => {
        events.hover = value as NodeEventAction[]
      })
    },
  })

  function addClickAction() {
    commitEvents((events) => {
      if (!events.click) events.click = []
      events.click.push({
        id: nanoid(),
        type: '',
      } as NodeEventAction)
    })
  }

  function removeClickAction(index: number) {
    commitEvents((events) => {
      if (!events.click) return
      events.click.splice(index, 1)
    })
  }

  function addHoverAction() {
    commitEvents((events) => {
      if (!events.hover) events.hover = []
      events.hover.push({
        id: nanoid(),
        type: '',
      } as NodeEventAction)
    })
  }

  function removeHoverAction(index: number) {
    commitEvents((events) => {
      if (!events.hover) return
      events.hover.splice(index, 1)
    })
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
