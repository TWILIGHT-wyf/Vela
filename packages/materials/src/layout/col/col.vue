<template>
  <div class="col-wrapper">
    <vCol v-bind="$attrs">
      <slot />
    </vCol>
  </div>
</template>

<script setup lang="ts">
import { vCol } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.col-wrapper {
  width: 100%;
  height: 100%;
}
</style>
