<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="closeOnClickModal"
    :show-close="closable"
    :append-to-body="true"
    @close="handleClose"
  >
    <div class="v-modal-body" :style="bodyStyle">
      <slot>
        <span v-if="content">{{ content }}</span>
      </slot>
    </div>
    <template #footer v-if="showFooter">
      <slot name="footer">
        <span class="v-modal-footer">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button type="primary" @click="handleConfirm">{{ confirmText }}</el-button>
        </span>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElDialog, ElButton } from 'element-plus'

// 定义纯 UI Props
const props = defineProps<{
  // Dialog 配置
  visible?: boolean
  title?: string
  width?: string | number
  fullscreen?: boolean
  closeOnClickModal?: boolean
  closable?: boolean
  showFooter?: boolean

  // 内容
  content?: string

  // 按钮文本
  cancelText?: string
  confirmText?: string

  // 样式
  backgroundColor?: string
  textColor?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

// 对话框可见性
const dialogVisible = ref(props.visible ?? false)

// 监听外部 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal ?? false
  },
)

// 同步内部状态到外部
watch(
  () => dialogVisible.value,
  (newVal) => {
    emit('update:visible', newVal)
  },
)

// 关闭处理
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 取消处理
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 确认处理
const handleConfirm = () => {
  emit('confirm')
}

// 内容样式
const bodyStyle = computed<CSSProperties>(() => {
  return {
    backgroundColor: props.backgroundColor ?? '#ffffff',
    color: props.textColor ?? '#333333',
  }
})
</script>

<style scoped>
.v-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.v-modal-body {
  box-sizing: border-box;
}
</style>
