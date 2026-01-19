<template>
  <div class="row-wrapper">
    <vRow v-bind="$attrs">
      <slot />
    </vRow>
  </div>
</template>

<script setup lang="ts">
import { vRow } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.row-wrapper {
  width: 100%;
  height: 100%;
}
</style>
