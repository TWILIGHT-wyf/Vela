<template>
  <!-- 遍历渲染节点列表 -->
  <NodeWrapper
    v-for="node in nodes"
    :key="node.id"
    :node="node"
    :layoutMode="layoutMode"
    :selected="isSelected(node.id)"
    @select="emit('select', $event)"
  >
    <UnifiedComponent :node="node">
      <!-- 递归渲染子节点 -->
      <UnifiedRenderer
        v-if="node.children && node.children.length"
        :nodes="node.children"
        :layoutMode="getChildLayoutMode(node)"
        :selectedId="selectedId"
        @select="emit('select', $event)"
      />
    </UnifiedComponent>
  </NodeWrapper>
</template>

<script setup lang="ts">
import NodeWrapper from './NodeWrapper.vue'
import UnifiedComponent from './UnifiedComponent.vue'
import type { NodeSchema } from '@vela/core'

const props = withDefaults(
  defineProps<{
    nodes: NodeSchema[]
    layoutMode: 'free' | 'flow'
    selectedId?: string // 选中节点的 ID
  }>(),
  {
    nodes: () => [],
    layoutMode: 'free',
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isSelected = (id: string) => props.selectedId === id

const getChildLayoutMode = (node: NodeSchema): 'free' | 'flow' => {
  // 根据组件类型决定子节点的布局模式
  // GridBox, FlexContainer 等强制子节点为流式
  if (['GridBox', 'FlexRow', 'FlexCol'].includes(node.componentName)) {
    return 'flow'
  }

  // Group 或特殊容器可能支持内部自由布局
  if (node.componentName === 'FreeContainer') {
    return 'free'
  }

  // 默认继承当前模式？或者默认为 Flow？
  // 绝大多数嵌套容器内部都是流式
  return 'flow'
}
</script>
