<template>
  <div class="radio-group-container" :style="containerStyle">
    <el-radio-group
      v-model="internalValue"
      :size="size"
      :disabled="disabled"
      :style="groupStyle"
      @change="handleChange"
    >
      <component
        :is="optionType === 'button' ? 'el-radio-button' : 'el-radio'"
        v-for="option in displayOptions"
        :key="String(option.value)"
        :label="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </component>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElRadioGroup } from 'element-plus'

interface RadioOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean
    defaultValue?: string | number | boolean
    options?: RadioOption[]
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    direction?: 'horizontal' | 'vertical'
    gap?: number
    optionType?: 'default' | 'button'
    padding?: number
    backgroundColor?: string
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    options: () => [],
    disabled: false,
    size: 'default',
    direction: 'horizontal',
    gap: 12,
    optionType: 'default',
    padding: 8,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean | undefined]
  change: [value: string | number | boolean | undefined]
}>()

const defaultOptions: RadioOption[] = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
]

const displayOptions = computed(() => (props.options.length > 0 ? props.options : defaultOptions))

const internalValue = ref<string | number | boolean | undefined>(
  props.modelValue ?? props.defaultValue,
)

watch(
  () => [props.modelValue, props.defaultValue],
  ([modelValue, defaultValue]) => {
    internalValue.value = modelValue ?? defaultValue
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

const groupStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: props.direction === 'vertical' ? 'column' : 'row',
  gap: `${props.gap}px`,
}))

function handleChange(value: string | number | boolean | undefined) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.radio-group-container {
  box-sizing: border-box;
}
</style>
