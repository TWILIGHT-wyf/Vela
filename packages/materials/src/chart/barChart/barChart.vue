<template>
  <div class="chart-wrapper">
    <barChart v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { barChart } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
}
</style>
