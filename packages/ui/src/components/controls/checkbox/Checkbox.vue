<template>
  <div class="checkbox-container" :style="containerStyle">
    <el-checkbox
      v-model="internalValue"
      :disabled="disabled"
      :size="size"
      :indeterminate="indeterminate"
      :true-label="trueValue"
      :false-label="falseValue"
      @change="handleChange"
    >
      {{ label }}
    </el-checkbox>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElCheckbox } from 'element-plus'

type CheckboxValue = boolean | string | number

const props = withDefaults(
  defineProps<{
    modelValue?: CheckboxValue
    defaultValue?: CheckboxValue
    label?: string
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    indeterminate?: boolean
    trueValue?: CheckboxValue
    falseValue?: CheckboxValue
    padding?: number
    backgroundColor?: string
  }>(),
  {
    modelValue: false,
    defaultValue: false,
    label: '复选框',
    disabled: false,
    size: 'default',
    indeterminate: false,
    trueValue: true,
    falseValue: false,
    padding: 8,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: CheckboxValue]
  change: [value: CheckboxValue]
}>()

const internalValue = ref<CheckboxValue>(props.modelValue ?? props.defaultValue)

watch(
  () => [props.modelValue, props.defaultValue],
  ([modelValue, defaultValue]) => {
    internalValue.value = (modelValue ?? defaultValue) as CheckboxValue
  },
)

const containerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
  boxSizing: 'border-box',
}))

function handleChange(value: CheckboxValue) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.checkbox-container {
  box-sizing: border-box;
}
</style>
