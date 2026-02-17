import { ref, reactive, computed, type Ref } from 'vue'
import { getNodeComponent, type NodeSchema } from '@vela/core'

/**
 * 组件检查器状态
 */
export interface InspectorState {
  enabled: boolean
  selectedNodeId: string | null
  hoveredNodeId: string | null
  highlightEnabled: boolean
  showDataBindings: boolean
  showEvents: boolean
}

/**
 * 组件信息
 */
export interface ComponentInfo {
  id: string
  componentName: string
  props: Record<string, unknown>
  style: Record<string, unknown>
  dataBindings: unknown[]
  events: Record<string, unknown[]>
  children: number
  depth: number
  path: string[]
}

/**
 * 创建组件检查器
 */
export function createInspector() {
  const state = reactive<InspectorState>({
    enabled: false,
    selectedNodeId: null,
    hoveredNodeId: null,
    highlightEnabled: true,
    showDataBindings: true,
    showEvents: true,
  })

  // 组件树引用
  let rootNode: Ref<NodeSchema | null> = ref(null)

  // 组件索引
  const nodeIndex = new Map<string, NodeSchema>()
  const parentIndex = new Map<string, string>()
  const depthIndex = new Map<string, number>()

  function resolveComponentName(node: NodeSchema): string {
    return getNodeComponent(node) || 'Unknown'
  }

  function getLegacyDataBindings(node: NodeSchema): unknown[] {
    const dataBindings = (node as NodeSchema & { dataBindings?: unknown[] }).dataBindings
    return Array.isArray(dataBindings) ? dataBindings : []
  }

  /**
   * 初始化检查器
   */
  function init(root: Ref<NodeSchema | null>) {
    rootNode = root
    rebuildIndex()
  }

  /**
   * 重建索引
   */
  function rebuildIndex() {
    nodeIndex.clear()
    parentIndex.clear()
    depthIndex.clear()

    if (!rootNode.value) return

    function traverse(node: NodeSchema, parentId: string | null, depth: number) {
      nodeIndex.set(node.id, node)
      depthIndex.set(node.id, depth)
      if (parentId) {
        parentIndex.set(node.id, parentId)
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child, node.id, depth + 1)
        }
      }
    }

    traverse(rootNode.value, null, 0)
  }

  /**
   * 启用检查器
   */
  function enable() {
    state.enabled = true
    rebuildIndex()
    console.log('[DevTools] Inspector enabled')
  }

  /**
   * 禁用检查器
   */
  function disable() {
    state.enabled = false
    state.selectedNodeId = null
    state.hoveredNodeId = null
    console.log('[DevTools] Inspector disabled')
  }

  /**
   * 切换检查器
   */
  function toggle() {
    if (state.enabled) {
      disable()
    } else {
      enable()
    }
  }

  /**
   * 选中组件
   */
  function selectNode(id: string | null) {
    state.selectedNodeId = id
    if (id) {
      console.log('[DevTools] Selected:', getComponentInfo(id))
    }
  }

  /**
   * 悬停组件
   */
  function hoverNode(id: string | null) {
    state.hoveredNodeId = id
  }

  /**
   * 获取组件路径
   */
  function getNodePath(id: string): string[] {
    const path: string[] = []
    let currentId: string | undefined = id

    while (currentId) {
      const node = nodeIndex.get(currentId)
      if (node) {
        path.unshift(resolveComponentName(node))
      }
      currentId = parentIndex.get(currentId)
    }

    return path
  }

  /**
   * 获取组件详细信息
   */
  function getComponentInfo(id: string): ComponentInfo | null {
    const node = nodeIndex.get(id)
    if (!node) return null

    return {
      id: node.id,
      componentName: resolveComponentName(node),
      props: node.props || {},
      style: node.style || {},
      dataBindings: getLegacyDataBindings(node),
      events: node.events || {},
      children: node.children?.length || 0,
      depth: depthIndex.get(id) || 0,
      path: getNodePath(id),
    }
  }

  /**
   * 获取选中组件信息
   */
  const selectedInfo = computed(() => {
    if (!state.selectedNodeId) return null
    return getComponentInfo(state.selectedNodeId)
  })

  /**
   * 获取组件树结构
   */
  function getTreeStructure(): object | null {
    if (!rootNode.value) return null

    function buildTree(node: NodeSchema): object {
      return {
        id: node.id,
        name: resolveComponentName(node),
        children: node.children?.map(buildTree) || [],
      }
    }

    return buildTree(rootNode.value)
  }

  /**
   * 搜索组件
   */
  function searchNodes(query: string): ComponentInfo[] {
    const results: ComponentInfo[] = []
    const lowerQuery = query.toLowerCase()

    nodeIndex.forEach((node, id) => {
      const componentName = resolveComponentName(node)
      if (
        componentName.toLowerCase().includes(lowerQuery) ||
        id.toLowerCase().includes(lowerQuery)
      ) {
        const info = getComponentInfo(id)
        if (info) results.push(info)
      }
    })

    return results
  }

  /**
   * 导出组件树为 JSON
   */
  function exportTree(): string {
    return JSON.stringify(rootNode.value, null, 2)
  }

  /**
   * 获取统计信息
   */
  function getStats() {
    const componentCounts = new Map<string, number>()

    nodeIndex.forEach((node) => {
      const componentName = resolveComponentName(node)
      const count = componentCounts.get(componentName) || 0
      componentCounts.set(componentName, count + 1)
    })

    return {
      totalNodes: nodeIndex.size,
      maxDepth: Math.max(...Array.from(depthIndex.values()), 0),
      componentCounts: Object.fromEntries(componentCounts),
    }
  }

  return {
    state,
    init,
    enable,
    disable,
    toggle,
    selectNode,
    hoverNode,
    getComponentInfo,
    selectedInfo,
    getTreeStructure,
    searchNodes,
    exportTree,
    getStats,
    rebuildIndex,
  }
}

/**
 * 全局检查器实例
 */
export const inspector = createInspector()
