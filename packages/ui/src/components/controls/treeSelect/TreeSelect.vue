<template>
  <div class="tree-select-container" :style="containerStyle">
    <el-tree-select
      v-model="internalValue"
      :data="displayOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :check-strictly="checkStrictly"
      :multiple="multiple"
      :show-checkbox="multiple"
      :size="size"
      :style="selectStyle"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElTreeSelect } from 'element-plus'

interface TreeOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: TreeOption[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | Array<string | number>
    options?: TreeOption[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    checkStrictly?: boolean
    size?: 'large' | 'default' | 'small'
    padding?: number
    backgroundColor?: string
    selectWidth?: number
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    multiple: false,
    checkStrictly: false,
    size: 'default',
    padding: 8,
    backgroundColor: 'transparent',
    selectWidth: 100,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | Array<string | number> | undefined]
  change: [value: string | number | Array<string | number> | undefined]
}>()

const defaultOptions: TreeOption[] = [
  {
    label: '一级 1',
    value: '1',
    children: [
      { label: '二级 1-1', value: '1-1' },
      { label: '二级 1-2', value: '1-2' },
    ],
  },
]

const displayOptions = computed(() => (props.options.length > 0 ? props.options : defaultOptions))

const internalValue = ref<string | number | Array<string | number> | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal
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

const selectStyle = computed<CSSProperties>(() => ({
  width: `${props.selectWidth}%`,
}))

function handleChange(value: string | number | Array<string | number> | undefined) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.tree-select-container {
  box-sizing: border-box;
}
</style>
