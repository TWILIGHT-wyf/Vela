<template>
  <div :style="containerStyle">
    <el-checkbox-group
      v-model="internalValue"
      :size="size"
      :disabled="disabled"
      :min="min"
      :max="max"
      @change="handleChange"
    >
      <component
        :is="layout === 'button' ? 'el-checkbox-button' : 'el-checkbox'"
        v-for="option in displayOptions"
        :key="option.value"
        :label="option.value"
        :disabled="option.disabled"
        :border="showBorder && layout !== 'button'"
      >
        {{ option.label }}
      </component>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElCheckboxGroup, ElCheckbox, ElCheckboxButton } from 'element-plus'

// 选项接口
export interface CheckboxOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: (string | number)[]
    options?: CheckboxOption[]
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    min?: number
    max?: number
    layout?: 'default' | 'button'
    showBorder?: boolean
    direction?: 'horizontal' | 'vertical'
    gap?: number
    padding?: number
    backgroundColor?: string
    checkedColor?: string
    borderColor?: string
    textColor?: string
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    size: 'default',
    disabled: false,
    min: undefined,
    max: undefined,
    layout: 'default',
    showBorder: false,
    direction: 'horizontal',
    gap: 12,
    padding: 16,
    backgroundColor: 'transparent',
    checkedColor: '#409eff',
    borderColor: '#dcdfe6',
    textColor: '#606266',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  change: [value: (string | number)[]]
}>()

// 默认选项
const defaultOptions: CheckboxOption[] = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
  { label: '选项 C', value: 'c' },
]

// 显示的选项
const displayOptions = computed(() => {
  return props.options.length > 0 ? props.options : defaultOptions
})

// 内部值
const internalValue = ref<(string | number)[]>([...props.modelValue])

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = [...newVal]
  },
)

// 容器样式
const containerStyle = computed<CSSProperties>(
  () =>
    ({
      padding: `${props.padding}px`,
      backgroundColor: props.backgroundColor,
      display: 'flex',
      flexDirection: props.direction === 'vertical' ? 'column' : 'row',
      gap: `${props.gap}px`,
      '--el-checkbox-checked-bg-color': props.checkedColor,
      '--el-checkbox-checked-input-border-color': props.checkedColor,
      '--el-checkbox-input-border-color': props.borderColor,
      '--el-checkbox-text-color': props.textColor,
    }) as CSSProperties,
)

// 事件处理
const handleChange = (value: (string | number)[]) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: v-bind('containerStyle.flexDirection');
  gap: v-bind('containerStyle.gap');
}

:deep(.el-checkbox) {
  --el-checkbox-checked-bg-color: v-bind('containerStyle["--el-checkbox-checked-bg-color"]');
  --el-checkbox-checked-input-border-color: v-bind(
    'containerStyle["--el-checkbox-checked-input-border-color"]'
  );
  --el-checkbox-input-border-color: v-bind('containerStyle["--el-checkbox-input-border-color"]');
  --el-checkbox-text-color: v-bind('containerStyle["--el-checkbox-text-color"]');
}

:deep(.el-checkbox-button) {
  --el-checkbox-button-checked-bg-color: v-bind('containerStyle["--el-checkbox-checked-bg-color"]');
  --el-checkbox-button-checked-border-color: v-bind(
    'containerStyle["--el-checkbox-checked-input-border-color"]'
  );
}
</style>
