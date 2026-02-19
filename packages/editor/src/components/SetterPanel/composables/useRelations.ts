import { computed, ref } from 'vue'
import type { NodeSchema } from '@vela/core'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'

interface TreeNodeData {
  id: string
  label: string
  type: string
  children: TreeNodeData[]
}

export function useComponentHierarchy() {
  const componentStore = useComponent()
  const { rootNode } = storeToRefs(componentStore)

  const childrenComponents = computed(() => {
    const selectedId = componentStore.selectedId
    if (!selectedId || !rootNode.value) return []

    const findChildren = (node: NodeSchema, targetId: string): NodeSchema[] => {
      if (node.id === targetId) {
        return node.children || []
      }
      if (node.children) {
        for (const child of node.children) {
          const result = findChildren(child, targetId)
          if (result.length > 0) return result
        }
      }
      return []
    }

    return findChildren(rootNode.value, selectedId)
  })

  const groupComponent = computed(() => {
    return null
  })

  const availableChildren = computed(() => {
    return []
  })

  function addChildToComponent() {}

  function removeFromGroup() {}

  function selectComponentById(id: string) {
    componentStore.selectComponent(id)
  }

  return {
    childrenComponents,
    groupComponent,
    availableChildren,
    addChildToComponent,
    removeFromGroup,
    selectComponentById,
  }
}

export function useDialogState() {
  const showAddChildDialog = ref(false)
  const selectedChildId = ref('')

  function closeAddChildDialog() {
    showAddChildDialog.value = false
    selectedChildId.value = ''
  }

  return {
    showAddChildDialog,
    selectedChildId,
    closeAddChildDialog,
  }
}

export function useTreeOperations() {
  const componentStore = useComponent()
  const { rootNode } = storeToRefs(componentStore)

  const treeData = computed(() => {
    if (!rootNode.value) return []

    const buildTree = (node: NodeSchema): TreeNodeData => ({
      id: node.id,
      label: node.component || node.componentName || '',
      type: node.component || node.componentName || '',
      children: node.children?.map(buildTree) || [],
    })

    return [buildTree(rootNode.value)]
  })

  function handleNodeClick(data: { id: string }) {
    componentStore.selectComponent(data.id)
  }

  function getAllNodeKeys(nodes: TreeNodeData[]): string[] {
    const keys: string[] = []
    nodes.forEach((node) => {
      keys.push(node.id)
      if (node.children) {
        keys.push(...getAllNodeKeys(node.children))
      }
    })
    return keys
  }

  function removeParentFromTree() {}

  function allowDrop() {
    return true
  }

  function allowDrag() {
    return true
  }

  function handleNodeDrop() {}

  return {
    treeData,
    handleNodeClick,
    getAllNodeKeys,
    removeParentFromTree,
    allowDrop,
    allowDrag,
    handleNodeDrop,
  }
}

export function useLayoutConfig() {
  const componentStore = useComponent()
  const { selectedNode } = storeToRefs(componentStore)

  const isContainer = computed(() => {
    return selectedNode.value?.children && selectedNode.value.children.length > 0
  })

  const layoutMode = computed({
    get: () => selectedNode.value?.style?.display || 'block',
    set: (val) => {
      if (!selectedNode.value?.style) return
      selectedNode.value.style.display = val
      componentStore.syncToProjectStore()
    },
  })

  const layoutGap = computed({
    get: () => selectedNode.value?.style?.gap || 8,
    set: (val) => {
      if (!selectedNode.value?.style) return
      selectedNode.value.style.gap = val
      componentStore.syncToProjectStore()
    },
  })

  const layoutColumns = computed({
    get: () => selectedNode.value?.style?.gridTemplateColumns || 'auto',
    set: (val) => {
      if (!selectedNode.value?.style) return
      selectedNode.value.style.gridTemplateColumns = val
      componentStore.syncToProjectStore()
    },
  })

  const layoutAlign = computed({
    get: () => selectedNode.value?.style?.alignItems || 'flex-start',
    set: (val) => {
      if (!selectedNode.value?.style) return
      selectedNode.value.style.alignItems = val
      componentStore.syncToProjectStore()
    },
  })

  const layoutPadding = computed({
    get: () => selectedNode.value?.style?.padding || 0,
    set: (val) => {
      if (!selectedNode.value?.style) return
      selectedNode.value.style.padding = val
      componentStore.syncToProjectStore()
    },
  })

  return {
    isContainer,
    layoutMode,
    layoutGap,
    layoutColumns,
    layoutAlign,
    layoutPadding,
  }
}
