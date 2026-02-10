<template>
  <div class="upload-container" :style="containerStyle">
    <el-upload
      :action="action"
      :multiple="multiple"
      :limit="limit"
      :disabled="disabled"
      :accept="accept"
      :auto-upload="autoUpload"
      :list-type="listType"
      :file-list="fileList"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :on-exceed="handleExceed"
    >
      <el-button :disabled="disabled" type="primary">{{ buttonText }}</el-button>
      <template #tip>
        <div v-if="tip" class="el-upload__tip">{{ tip }}</div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElUpload, ElButton, ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles, UploadUserFile } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    action?: string
    multiple?: boolean
    limit?: number
    disabled?: boolean
    accept?: string
    autoUpload?: boolean
    listType?: 'text' | 'picture' | 'picture-card'
    buttonText?: string
    tip?: string
    padding?: number
    backgroundColor?: string
  }>(),
  {
    modelValue: () => [],
    action: '#',
    multiple: false,
    limit: 3,
    disabled: false,
    accept: '',
    autoUpload: false,
    listType: 'text',
    buttonText: '点击上传',
    tip: '',
    padding: 8,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
}>()

const fileList = ref<UploadUserFile[]>([])

watch(
  () => props.modelValue,
  (newVal) => {
    fileList.value = (newVal || []).map((url, index) => ({
      name: `file-${index + 1}`,
      url,
    }))
  },
  { immediate: true },
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

function emitFiles(files: UploadFiles) {
  const urls = files.map((f) => f.url || '').filter((u) => !!u)
  emit('update:modelValue', urls)
  emit('change', urls)
}

function handleFileChange(_file: UploadFile, files: UploadFiles) {
  emitFiles(files)
}

function handleFileRemove(_file: UploadFile, files: UploadFiles) {
  emitFiles(files)
}

function handleExceed() {
  ElMessage.warning(`最多上传 ${props.limit} 个文件`)
}
</script>

<style scoped>
.upload-container {
  box-sizing: border-box;
}
</style>
