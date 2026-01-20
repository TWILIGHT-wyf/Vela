<template>
  <div class="json-setter">
    <el-input
      v-model="localValue"
      type="textarea"
      :rows="rows"
      placeholder="请输入 JSON"
      @blur="handleBlur"
    />
    <div v-if="error" class="json-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: unknown
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const localValue = ref('')
const error = ref('')

watch(
  () => props.modelValue,
  (val) => {
    if (val === undefined || val === null) {
      localValue.value = ''
      return
    }
    if (typeof val === 'string') {
      localValue.value = val
      return
    }
    try {
      localValue.value = JSON.stringify(val, null, 2)
    } catch (e) {
      localValue.value = String(val)
    }
  },
  { immediate: true },
)

const handleBlur = () => {
  const val = localValue.value.trim()
  if (!val) {
    emit('update:modelValue', undefined)
    error.value = ''
    return
  }

  try {
    // 尝试解析 JSON
    // 如果输入不是 JSON 格式（如普通字符串），则保留原值（或者视需求而定）
    // 这里假设 JsonSetter 总是期望合法的 JSON（对象或数组）
    // 如果是简单字符串，JSON.parse 会成功（如 "abc" -> 报错，但 "\"abc\"" -> "abc"）
    // 但用户通常输入 { ... } 或 [ ... ]

    // 为了支持非引号包裹的字符串（如果需要），可以做一些宽松处理，但为了严谨，要求标准 JSON
    const parsed = JSON.parse(val)
    emit('update:modelValue', parsed)
    error.value = ''
  } catch (e) {
    error.value = '无效的 JSON 格式'
    // 不触发 update，保持原值，或者触发 null?
    // 保持原值会导致 props 不更新，但 UI 显示错误，这是合理的
  }
}
</script>

<style scoped>
.json-setter {
  width: 100%;
}
.json-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 4px;
}
</style>
