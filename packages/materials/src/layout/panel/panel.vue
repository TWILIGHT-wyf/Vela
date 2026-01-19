<template>
  <div class="panel-wrapper">
    <vPanel v-bind="$attrs">
      <slot />
    </vPanel>
  </div>
</template>

<script setup lang="ts">
import { vPanel } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.panel-wrapper {
  width: 100%;
  height: 100%;
}
</style>
