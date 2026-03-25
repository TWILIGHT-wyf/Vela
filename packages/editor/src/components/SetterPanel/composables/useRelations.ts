import { computed, ref } from 'vue'
import type { NodeSchema } from '@vela/core'
import { getComponentDefinition, resolveComponentAlias } from '@vela/core/contracts'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'

interface TreeNodeData {
  id: string
  label: string
  type: string
  children: TreeNodeData[]
  isContainer: boolean
}

interface TreeNodeLike {
  data: TreeNodeData
}

type LayoutAlignValue = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'

type AllowDropType = 'prev' | 'inner' | 'next'
type DropType = 'before' | 'inner' | 'after'

function resolveNodeLabel(node: NodeSchema): string {
  const componentName = node.component || node.componentName || 'Unknown'
  const title =
    typeof node.props?.title === 'string'
      ? node.props.title
      : typeof node.props?.label === 'string'
        ? node.props.label
        : typeof node.props?.content === 'string'
          ? node.props.content
          : ''

  if (!title) return componentName
  const compactTitle = title.trim().slice(0, 20)
  return `${componentName} · ${compactTitle}`
}

function isContainerNode(node: NodeSchema | null | undefined): boolean {
  if (!node) return false
  if (node.component === 'Page') return true
  if (node.container?.mode === 'grid') return true

  const componentName = node.component || node.componentName
  if (!componentName) {
    return Array.isArray(node.children)
  }

  const definition = getComponentDefinition(resolveComponentAlias(componentName))
  return Boolean(definition?.isContainer || Array.isArray(node.children))
}

function buildTreeNode(node: NodeSchema): TreeNodeData {
  return {
    id: node.id,
    label: resolveNodeLabel(node),
    type: node.component || node.componentName || '',
    isContainer: isContainerNode(node),
    children: node.children?.map(buildTreeNode) || [],
  }
}

export function useComponentHierarchy() {
  const componentStore = useComponent()
  const { rootNode } = storeToRefs(componentStore)

  const childrenComponents = computed(() => {
    const selectedId = componentStore.selectedId
    if (!selectedId || !rootNode.value) return []

    const selectedNode = componentStore.findNodeById(rootNode.value, selectedId)
    return selectedNode?.children || []
  })

  const groupComponent = computed(() => componentStore.selectedNode)

  const availableChildren = computed(() => {
    if (!rootNode.value) return []
    return rootNode.value.children || []
  })

  function addChildToComponent() {
    return
  }

  function removeFromGroup() {
    return
  }

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
    return [buildTreeNode(rootNode.value)]
  })

  function handleNodeClick(data: { id: string }) {
    componentStore.selectComponent(data.id)
  }

  function getAllNodeKeys(nodes: TreeNodeData[]): string[] {
    const keys: string[] = []
    nodes.forEach((node) => {
      keys.push(node.id)
      if (node.children.length > 0) {
        keys.push(...getAllNodeKeys(node.children))
      }
    })
    return keys
  }

  function isDescendant(candidateId: string, ancestorId: string): boolean {
    let cursor = componentStore.getParentId(candidateId)
    while (cursor) {
      if (cursor === ancestorId) return true
      cursor = componentStore.getParentId(cursor)
    }
    return false
  }

  function allowDrop(
    draggingNode: TreeNodeLike,
    dropNode: TreeNodeLike,
    type: AllowDropType,
  ): boolean {
    const draggingId = draggingNode.data.id
    const targetId = dropNode.data.id

    if (!rootNode.value) return false
    if (draggingId === targetId) return false
    if (draggingId === rootNode.value.id) return false
    if (isDescendant(targetId, draggingId)) return false

    if (type === 'inner') {
      const targetNode = componentStore.findNodeById(rootNode.value, targetId)
      return isContainerNode(targetNode)
    }

    if (targetId === rootNode.value.id) {
      return false
    }

    return true
  }

  function allowDrag(node: TreeNodeLike): boolean {
    return rootNode.value ? node.data.id !== rootNode.value.id : false
  }

  function handleNodeDrop(
    draggingNode: TreeNodeLike,
    dropNode: TreeNodeLike,
    dropType: DropType,
  ) {
    if (!rootNode.value) return

    const draggingId = draggingNode.data.id
    const targetId = dropNode.data.id
    const targetNode = componentStore.findNodeById(rootNode.value, targetId)
    if (!targetNode) return

    let newParentId: string
    let newIndex: number

    if (dropType === 'inner') {
      newParentId = targetId
      newIndex = targetNode.children?.length || 0
    } else {
      const parentId = componentStore.getParentId(targetId)
      if (!parentId) return

      const parentNode = componentStore.findNodeById(rootNode.value, parentId)
      if (!parentNode?.children) return

      newParentId = parentId
      const targetIndex = parentNode.children.findIndex((child) => child.id === targetId)
      if (targetIndex < 0) return
      newIndex = dropType === 'before' ? targetIndex : targetIndex + 1

      if (componentStore.getParentId(draggingId) === newParentId) {
        const currentIndex = parentNode.children.findIndex((child) => child.id === draggingId)
        if (currentIndex >= 0 && currentIndex < newIndex) {
          newIndex -= 1
        }
      }
    }

    const currentParentId = componentStore.getParentId(draggingId)
    const currentIndex =
      currentParentId && componentStore.findNodeById(rootNode.value, currentParentId)?.children
        ? componentStore
            .findNodeById(rootNode.value, currentParentId)
            ?.children?.findIndex((child) => child.id === draggingId) ?? -1
        : -1

    if (currentParentId === newParentId && currentIndex === newIndex) {
      return
    }

    componentStore.moveComponent(draggingId, newParentId, newIndex)
    componentStore.selectComponent(draggingId)
  }

  return {
    treeData,
    handleNodeClick,
    getAllNodeKeys,
    allowDrop,
    allowDrag,
    handleNodeDrop,
  }
}

export function useLayoutConfig() {
  const componentStore = useComponent()
  const { selectedNode } = storeToRefs(componentStore)

  const isContainer = computed(() => isContainerNode(selectedNode.value))

  const layoutMode = computed({
    get: () => selectedNode.value?.style?.display || 'block',
    set: (val) => {
      if (!selectedNode.value) return
      componentStore.updateStyle(selectedNode.value.id, { display: val })
    },
  })

  const layoutGap = computed({
    get: () => Number(selectedNode.value?.style?.gap ?? 8),
    set: (val) => {
      if (!selectedNode.value) return
      componentStore.updateStyle(selectedNode.value.id, { gap: val })
    },
  })

  const layoutColumns = computed({
    get: () => String(selectedNode.value?.style?.gridTemplateColumns || 'auto'),
    set: (val) => {
      if (!selectedNode.value) return
      componentStore.updateStyle(selectedNode.value.id, { gridTemplateColumns: val })
    },
  })

  const layoutAlign = computed({
    get: () => String(selectedNode.value?.style?.alignItems || 'flex-start') as LayoutAlignValue,
    set: (val) => {
      if (!selectedNode.value) return
      componentStore.updateStyle(selectedNode.value.id, { alignItems: val })
    },
  })

  const layoutPadding = computed({
    get: () => Number(selectedNode.value?.style?.padding ?? 0),
    set: (val) => {
      if (!selectedNode.value) return
      componentStore.updateStyle(selectedNode.value.id, { padding: val })
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
