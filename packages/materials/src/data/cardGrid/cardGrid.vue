<template>
  <div class="card-grid-wrapper">
    <vCardGrid v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vCardGrid } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.card-grid-wrapper {
  width: 100%;
  height: 100%;
}
</style>
