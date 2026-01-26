<template>
  <el-color-picker
    :model-value="modelValue"
    @update:model-value="(val) => $emit('update:modelValue', val || '')"
    v-bind="$attrs"
    show-alpha
    style="width: 100%"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
