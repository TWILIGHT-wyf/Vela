<template>
  <div class="progress-wrapper">
    <vProgress v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vProgress } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.progress-wrapper {
  width: 100%;
  height: 100%;
}
</style>
