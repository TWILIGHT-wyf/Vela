<template>
  <div class="pivot-wrapper">
    <vPivot v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vPivot } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.pivot-wrapper {
  width: 100%;
  height: 100%;
}
</style>
