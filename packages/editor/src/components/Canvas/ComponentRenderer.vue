<template>
  <template v-for="node in nodes" :key="node.id">
    <ComponentNode :node="node">
      <!-- Recursively render children -->
      <ComponentRenderer v-if="node.children && node.children.length" :nodes="node.children" />
    </ComponentNode>
  </template>
</template>

<script setup lang="ts">
import type { NodeSchema } from '@vela/core'
import ComponentNode from './ComponentNode.vue'

defineProps<{
  nodes: NodeSchema[]
}>()
</script>
