<template>
  <div class="table-wrapper">
    <vTable v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vTable } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  height: 100%;
}
</style>
