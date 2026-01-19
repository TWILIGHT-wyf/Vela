<template>
  <div class="stat-wrapper">
    <vStat v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vStat } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.stat-wrapper {
  width: 100%;
  height: 100%;
}
</style>
