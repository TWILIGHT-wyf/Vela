<template>
  <el-switch
    :model-value="modelValue"
    @update:model-value="(val: boolean | string | number | null | undefined) => $emit('update:modelValue', Boolean(val))"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
