<template>
  <div class="cascader-container" :style="containerStyle">
    <el-cascader
      v-model="internalValue"
      :options="displayOptions"
      :props="cascaderProps"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :show-all-levels="showAllLevels"
      :size="size"
      :style="selectStyle"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElCascader } from 'element-plus'

interface CascaderOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: CascaderOption[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: Array<string | number>
    options?: CascaderOption[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    checkStrictly?: boolean
    showAllLevels?: boolean
    size?: 'large' | 'default' | 'small'
    padding?: number
    backgroundColor?: string
    selectWidth?: number
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    multiple: false,
    checkStrictly: false,
    showAllLevels: true,
    size: 'default',
    padding: 8,
    backgroundColor: 'transparent',
    selectWidth: 100,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number>]
  change: [value: Array<string | number>]
}>()

const defaultOptions: CascaderOption[] = [
  {
    label: '选项 1',
    value: '1',
    children: [
      { label: '子项 1-1', value: '1-1' },
      { label: '子项 1-2', value: '1-2' },
    ],
  },
]

const displayOptions = computed(() => (props.options.length > 0 ? props.options : defaultOptions))

const internalValue = ref<Array<string | number>>([...props.modelValue])

watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = [...newVal]
  },
)

const cascaderProps = computed(() => ({
  multiple: props.multiple,
  checkStrictly: props.checkStrictly,
}))

const containerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
  boxSizing: 'border-box',
}))

const selectStyle = computed<CSSProperties>(() => ({
  width: `${props.selectWidth}%`,
}))

function handleChange(value: Array<string | number>) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.cascader-container {
  box-sizing: border-box;
}
</style>
