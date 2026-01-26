<template>
  <el-input
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    v-bind="$attrs"
    clearable
    style="width: 100%"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>
