<template>
  <div class="timeline-wrapper">
    <vTimeline v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vTimeline } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.timeline-wrapper {
  width: 100%;
  height: 100%;
}
</style>
