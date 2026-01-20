<template>
  <div ref="stageRef" class="runtime-renderer">
    <!-- 空状态 -->
    <div v-if="topLevelComponents.length === 0" class="empty-state">
      <div class="empty-illustration">📄</div>
      <p class="empty-title">画布为空</p>
      <p class="empty-desc">当前页面暂无组件</p>
    </div>

    <!-- 渲染顶层组件 -->
    <RuntimeComponent
      v-for="comp in topLevelComponents"
      :key="comp.id"
      :component="comp"
      :allComponents="components"
      @trigger-event="handleComponentEvent"
      @update-prop="handleUpdateProp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { set } from 'lodash-es'
import RuntimeComponent from './RuntimeComponent.vue'
import type { Component } from '@vela/core/types/components'
import type { Page, RuntimePlugin, RuntimeContext } from '../types'

/**
 * 运行时渲染器
 *
 * 职责：
 * 1. 管理组件树的渲染
 * 2. 初始化并维护插件系统 (数据联动/事件执行)
 * 3. 处理组件事件并分发给插件
 */

const props = withDefaults(
  defineProps<{
    components: Component[]
    pages: Page[]
    isProjectMode: boolean
    mode?: 'edit' | 'simulation' | 'runtime'
    plugins?: RuntimePlugin[]
  }>(),
  {
    mode: 'runtime',
    plugins: () => [],
  },
)

const emit = defineEmits<{
  'navigate-page': [pageId: string]
  'select-component': [componentId: string]
}>()

const router = useRouter()
const stageRef = ref<HTMLDivElement | null>(null)

// 本地响应式组件数组
const localComponents = ref<Component[]>([])

// 插件事件订阅者
const componentEventSubscribers = new Set<(payload: any) => void>()

// 上下文构建
const context: RuntimeContext = {
  components: localComponents,
  pages: computed(() => props.pages),
  isProjectMode: computed(() => props.isProjectMode),
  router,
  subscribeComponentEvent: (handler) => {
    componentEventSubscribers.add(handler)
  },
}

// 初始化插件
props.plugins?.forEach((plugin) => plugin(context))

// 处理组件事件分发
function handleComponentEvent(payload: { componentId: string; eventType: string; actions: any[] }) {
  componentEventSubscribers.forEach((handler) => handler(payload))
}

// 只渲染顶层组件
const topLevelComponents = computed(() => {
  return localComponents.value.filter((c) => !c.groupId)
})

// 监听 props.components 变化并同步到本地
watch(
  () => props.components,
  (newComponents) => {
    localComponents.value = newComponents
    // console.log('[RuntimeRenderer] components synced, count:', newComponents.length)
  },
  { immediate: true },
)

// 处理属性更新
function handleUpdateProp(payload: { componentId: string; path: string; value: unknown }) {
  if (props.mode === 'edit') return

  const comp = localComponents.value.find((c) => c.id === payload.componentId)
  if (comp) {
    set(comp, payload.path, payload.value)
  }
}
</script>

<style scoped>
.runtime-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
}

/* 空状态 */
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
