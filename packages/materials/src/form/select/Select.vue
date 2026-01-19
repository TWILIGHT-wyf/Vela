<template>
  <div class="select-wrapper">
    <vSelect v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vSelect } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.select-wrapper {
  width: 100%;
  height: 100%;
}
</style>
