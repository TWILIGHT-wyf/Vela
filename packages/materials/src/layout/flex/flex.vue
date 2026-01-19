<template>
  <div class="flex-wrapper">
    <vFlex v-bind="$attrs">
      <slot />
    </vFlex>
  </div>
</template>

<script setup lang="ts">
import { vFlex } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.flex-wrapper {
  width: 100%;
  height: 100%;
}
</style>
