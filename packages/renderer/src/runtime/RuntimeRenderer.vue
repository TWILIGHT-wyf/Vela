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

    <div
      v-for="dialog in activeDialogs"
      :key="dialog.dialogId"
      class="dialog-overlay"
      :class="{ 'dialog-overlay--maskless': dialog.mask === false }"
      @click="handleDialogMaskClick(dialog)"
    >
      <div
        class="dialog-panel"
        :style="getDialogPanelStyle(dialog)"
        @click.stop
      >
        <div v-if="dialog.showHeader" class="dialog-header">
          <div class="dialog-title">{{ dialog.title }}</div>
          <button
            v-if="dialog.closable"
            type="button"
            class="dialog-close"
            @click="closeDialog(dialog.dialogId)"
          >
            ×
          </button>
        </div>

        <div class="dialog-body">
          <p v-if="dialog.content" class="dialog-description">{{ dialog.content }}</p>

          <RuntimeComponent
            v-if="dialog.rootNode"
            :node="dialog.rootNode"
            :mode="mode"
            @trigger-event="handleComponentEvent"
            @update-prop="handleUpdateProp"
          />

          <div v-else class="dialog-empty">当前弹窗页暂无内容</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide, onMounted, onBeforeUnmount, type Ref } from 'vue'
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

interface DialogRuntimeEventDetail {
  dialogId?: string
  title?: unknown
  content?: unknown
  data?: unknown
  result?: unknown
}

interface ActiveDialogEntry {
  dialogId: string
  title: string
  content: string
  rootNode: NodeSchema | null
  mask: boolean
  maskClosable: boolean
  closable: boolean
  width?: number | string
  height?: number | string
  showHeader: boolean
  data?: unknown
}

const router = useRouter()
const stageRef = ref<HTMLDivElement | null>(null)

// ========== Local State ==========
// Local reactive copy of the tree for mutation (data binding)
const localRootNode = ref<NodeSchema | null>(null)
const activeDialogs = ref<ActiveDialogEntry[]>([])

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

const dialogPageMap = computed(() => {
  const pageMap = new Map<string, Page>()
  for (const page of props.pages) {
    if (page.type === 'dialog') {
      pageMap.set(page.id, page)
    }
  }
  return pageMap
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

  for (const dialog of activeDialogs.value) {
    if (dialog.rootNode) {
      traverse(dialog.rootNode)
    }
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
  removeDialogListeners()
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

watch(
  () => props.pages,
  () => {
    activeDialogs.value = activeDialogs.value
      .map((dialog) => buildActiveDialog(dialog.dialogId, dialog))
      .filter((dialog): dialog is ActiveDialogEntry => dialog !== null)
  },
  { deep: false },
)

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return fallback
  return String(value)
}

function buildActiveDialog(
  dialogId: string,
  detail: Partial<DialogRuntimeEventDetail> = {},
): ActiveDialogEntry | null {
  const page = dialogPageMap.value.get(dialogId)
  if (!page) {
    console.warn(`[RuntimeRenderer] dialog page "${dialogId}" not found`)
    return null
  }

  const dialogConfig = page.dialogConfig || {}
  const title = toStringValue(detail.title, page.title || page.name || '弹窗')
  const content = toStringValue(detail.content, '')

  return {
    dialogId,
    title,
    content,
    rootNode: page.children ? cloneNode(page.children) : null,
    mask: dialogConfig.mask !== false,
    maskClosable: dialogConfig.maskClosable !== false,
    closable: dialogConfig.closable !== false,
    width: dialogConfig.width,
    height: dialogConfig.height,
    showHeader: Boolean(title) || dialogConfig.closable !== false,
    data: detail.data,
  }
}

function openDialog(detail: DialogRuntimeEventDetail) {
  const dialogId = toStringValue(detail.dialogId, '')
  if (!dialogId) {
    return
  }

  const nextDialog = buildActiveDialog(dialogId, detail)
  if (!nextDialog) {
    return
  }

  const currentIndex = activeDialogs.value.findIndex((item) => item.dialogId === dialogId)
  if (currentIndex >= 0) {
    activeDialogs.value.splice(currentIndex, 1, nextDialog)
    return
  }

  activeDialogs.value.push(nextDialog)
}

function closeDialog(dialogId?: string) {
  if (!dialogId) {
    activeDialogs.value = activeDialogs.value.slice(0, -1)
    return
  }

  activeDialogs.value = activeDialogs.value.filter((item) => item.dialogId !== dialogId)
}

function handleDialogOpen(event: Event) {
  const detail = (event as CustomEvent<DialogRuntimeEventDetail>).detail || {}
  openDialog(detail)
}

function handleDialogClose(event: Event) {
  const detail = (event as CustomEvent<DialogRuntimeEventDetail>).detail || {}
  closeDialog(toStringValue(detail.dialogId, ''))
}

function registerDialogListeners() {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('vela:dialog:open', handleDialogOpen as EventListener)
  window.addEventListener('vela:dialog:close', handleDialogClose as EventListener)
}

function removeDialogListeners() {
  if (typeof window === 'undefined') {
    return
  }

  window.removeEventListener('vela:dialog:open', handleDialogOpen as EventListener)
  window.removeEventListener('vela:dialog:close', handleDialogClose as EventListener)
}

function getDialogPanelStyle(dialog: ActiveDialogEntry): Record<string, string> {
  const style: Record<string, string> = {}

  if (dialog.width !== undefined && dialog.width !== null && dialog.width !== '') {
    style.width = typeof dialog.width === 'number' ? `${dialog.width}px` : String(dialog.width)
  } else {
    style.width = '520px'
  }

  if (dialog.height !== undefined && dialog.height !== null && dialog.height !== '') {
    style.height = typeof dialog.height === 'number' ? `${dialog.height}px` : String(dialog.height)
  }

  return style
}

function handleDialogMaskClick(dialog: ActiveDialogEntry) {
  if (dialog.mask === false || dialog.maskClosable === false) {
    return
  }
  closeDialog(dialog.dialogId)
}

onMounted(() => {
  registerDialogListeners()
})

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

.dialog-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
  z-index: 2000;
}

.dialog-overlay--maskless {
  background: transparent;
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  max-width: min(92vw, 960px);
  max-height: calc(100% - 48px);
  min-width: 360px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.dialog-close {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.dialog-close:hover {
  color: #111827;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px;
}

.dialog-description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.dialog-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #9ca3af;
  font-size: 14px;
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
