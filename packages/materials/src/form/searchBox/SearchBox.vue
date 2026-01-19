<template>
  <div class="search-box-wrapper">
    <vSearchBox v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vSearchBox } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.search-box-wrapper {
  width: 100%;
  height: 100%;
}
</style>
