<template>
  <component :is="componentType" :id="node.id" v-bind="componentProps">
    <!-- 透传插槽内容 (通常是递归渲染的子节点) -->
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getComponent, hasComponent } from '@vela/materials'
import type { NodeSchema } from '@vela/core'

const props = defineProps<{
  node: NodeSchema
}>()

// 1. 组件解析
const componentType = computed(() => {
  const name = props.node.componentName

  // V2 架构：优先从 Registry 获取 (BaseButton, KpiCard)
  if (hasComponent(name)) {
    return getComponent(name)
  }

  // 回退逻辑 (Group, Text 等可能还没有 Material)
  return 'div'
})

// 2. 属性处理
const componentProps = computed(() => {
  // V2 架构：直接透传 props 对象
  // Core V2 协议保证了 props 结构已经符合 Config Object 模式
  return props.node.props || {}
})
</script>
