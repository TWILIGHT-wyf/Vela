<template>
  <div class="countup-wrapper">
    <vCountUp v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vCountUp } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.countup-wrapper {
  width: 100%;
  height: 100%;
}
</style>
