<template>
  <div class="text-wrapper">
    <vText v-bind="$attrs">
      <slot />
    </vText>
  </div>
</template>

<script setup lang="ts">
import { vText } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.text-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
