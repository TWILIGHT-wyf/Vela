<template>
  <div class="badge-wrapper">
    <vBadge v-bind="$attrs">
      <slot />
    </vBadge>
  </div>
</template>

<script setup lang="ts">
import { vBadge } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.badge-wrapper {
  width: 100%;
  height: 100%;
}
</style>
