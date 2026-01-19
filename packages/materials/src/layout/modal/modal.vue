<template>
  <div class="modal-wrapper">
    <vModal v-bind="$attrs">
      <slot />
    </vModal>
  </div>
</template>

<script setup lang="ts">
import { vModal } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.modal-wrapper {
  width: 100%;
  height: 100%;
}
</style>
