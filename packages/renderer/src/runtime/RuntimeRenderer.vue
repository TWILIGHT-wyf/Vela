<template>
  <div ref="stageRef" class="runtime-renderer" :style="rendererStyle">
    <!-- Empty state -->
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-illustration">📄</div>
      <p class="empty-title">画布为空</p>
      <p class="empty-desc">当前页面暂无组件</p>
    </div>

    <!-- Render component tree -->
    <RuntimeComponent
      v-for="child in rootChildren"
      :key="child.id"
      :node="child"
      :mode="mode"
      @trigger-event="handleComponentEvent"
      @update-prop="handleUpdateProp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide, onBeforeUnmount, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { set } from 'lodash-es'
import type { NodeSchema } from '@vela/core'
import type { Page, RuntimePlugin, RuntimeContext, RuntimeMode } from './types'

/**
 * Runtime Renderer
 *
 * Entry point for rendering a NodeSchema tree in runtime/preview mode.
 * Supports both the new NodeSchema tree format and legacy flat Component array.
 *
 * Responsibilities:
 * 1. Manage component tree rendering
 * 2. Initialize and maintain plugin system (data binding, event execution)
 * 3. Handle component events and dispatch to plugins
 */

const props = withDefaults(
  defineProps<{
    /**
     * Root node of the component tree (NodeSchema format)
     * This is the primary input format
     */
    rootNode?: NodeSchema

    /**
     * Page configuration for multi-page support
     */
    pages?: Page[]

    /**
     * Whether running in project mode (multi-page) or single page
     */
    isProjectMode?: boolean

    /**
     * Operating mode
     * - 'runtime': Full interaction (default)
     * - 'editor': Read-only preview in editor
     * - 'preview': Full interaction with debug
     * - 'simulation': Simulation mode
     */
    mode?: RuntimeMode

    /**
     * Runtime plugins (event executor, data binding, etc.)
     */
    plugins?: RuntimePlugin[]

    /**
     * Canvas dimensions (optional, for sizing the renderer)
     */
    width?: number
    height?: number
    backgroundColor?: string
  }>(),
  {
    pages: () => [],
    isProjectMode: false,
    mode: 'runtime',
    plugins: () => [],
    width: undefined,
    height: undefined,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  'navigate-page': [pageId: string]
  'select-component': [componentId: string]
}>()

const router = useRouter()
const stageRef = ref<HTMLDivElement | null>(null)

// ========== Local State ==========
// Local reactive copy of the tree for mutation (data binding)
const localRootNode = ref<NodeSchema | null>(null)

// ========== Computed ==========
const hasContent = computed(() => {
  const node = localRootNode.value
  return node && node.children && node.children.length > 0
})

const rootChildren = computed(() => {
  return localRootNode.value?.children || []
})

const rendererStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.width) {
    style.width = `${props.width}px`
  }
  if (props.height) {
    style.height = `${props.height}px`
  }
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
  }

  return style
})

// ========== Plugin System ==========
const componentEventSubscribers = new Set<
  (payload: { componentId: string; eventType: string; actions: unknown[]; event?: Event }) => void
>()
const pluginCleanups: Array<() => void> = []

// Build node index for O(1) lookup
const nodeIndex = computed(() => {
  const index = new Map<string, NodeSchema>()

  function traverse(node: NodeSchema) {
    index.set(node.id, node)
    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  if (localRootNode.value) {
    traverse(localRootNode.value)
  }

  return index
})

// Runtime context for plugins
const context: RuntimeContext = {
  // Provide a ref to the flat component list for backward compatibility
  components: computed(() => {
    const nodes: NodeSchema[] = []
    nodeIndex.value.forEach((node) => nodes.push(node))
    return nodes
  }) as unknown as Ref<NodeSchema[]>,
  pages: computed(() => props.pages),
  isProjectMode: computed(() => props.isProjectMode),
  router,
  subscribeComponentEvent: (handler) => {
    componentEventSubscribers.add(handler)
    return () => {
      componentEventSubscribers.delete(handler)
    }
  },
  onNavigate: (pageId) => {
    emit('navigate-page', pageId)
  },
}

function cleanupPlugins(): void {
  while (pluginCleanups.length > 0) {
    const cleanup = pluginCleanups.pop()
    if (!cleanup) {
      continue
    }
    try {
      cleanup()
    } catch (error) {
      console.warn('[RuntimeRenderer] plugin cleanup failed', error)
    }
  }
}

function setupPlugins(plugins: RuntimePlugin[]): void {
  cleanupPlugins()

  for (const plugin of plugins) {
    const cleanup = plugin(context)
    if (typeof cleanup === 'function') {
      pluginCleanups.push(cleanup)
    }
  }
}

watch(
  () => props.plugins,
  (plugins) => {
    setupPlugins(plugins ?? [])
  },
  { immediate: true, deep: false },
)

onBeforeUnmount(() => {
  cleanupPlugins()
  componentEventSubscribers.clear()
})

// ========== Event Handling ==========
function handleComponentEvent(payload: {
  componentId: string
  eventType: string
  actions: unknown[]
  event?: Event
}) {
  // Dispatch to all subscribed plugins
  componentEventSubscribers.forEach((handler) => handler(payload))
}

function handleUpdateProp(payload: { componentId: string; path: string; value: unknown }) {
  if (props.mode === 'editor') return

  // Find the node and update it
  const node = nodeIndex.value.get(payload.componentId)
  if (node) {
    set(node, payload.path, payload.value)
  }
}

// ========== Sync Props to Local State ==========
watch(
  () => props.rootNode,
  (newRoot) => {
    if (newRoot) {
      // Deep clone to allow local mutations
      localRootNode.value = JSON.parse(JSON.stringify(newRoot))
    } else {
      localRootNode.value = null
    }
  },
  { immediate: true, deep: false },
)

// ========== Provide Context ==========
provide(
  'runtimeMode',
  computed(() => props.mode),
)
provide('nodeIndex', nodeIndex)
</script>

<style scoped>
.runtime-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  overflow: hidden;
}

/* Empty state */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted, #9ca3af);
  margin: 0;
}
</style>
