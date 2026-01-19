<template>
  <transition name="fade">
    <ul v-if="visible" class="ctx-menu" :style="menuStyle" @mousedown.stop>
      <!-- 空白区域只显示粘贴 -->
      <template v-if="!targetId">
        <li class="ctx-item" @click="emitAction('paste')" :class="{ disabled: !canPaste }">粘贴</li>
      </template>
      <!-- 组件上显示完整菜单 -->
      <template v-else>
        <li class="ctx-item" @click="emitAction('cut')">
          剪切{{ selectedCount > 1 ? ` (${selectedCount})` : '' }}
        </li>
        <li class="ctx-item" @click="emitAction('copy')">
          复制{{ selectedCount > 1 ? ` (${selectedCount})` : '' }}
        </li>
        <li class="ctx-item" @click="emitAction('paste')" :class="{ disabled: !canPaste }">粘贴</li>
        <li class="ctx-item" @click="emitAction('delete')">
          删除{{ selectedCount > 1 ? ` (${selectedCount})` : '' }}
        </li>
        <li class="ctx-item" @click="emitAction('bringForward')">上移一层</li>
        <li class="ctx-item" @click="emitAction('sendBackward')">下移一层</li>
        <li class="ctx-item" @click="emitAction('bringToFront')">置顶</li>
        <li class="ctx-item" @click="emitAction('sendToBack')">置底</li>
        <li v-if="canGroup" class="ctx-item" @click="emitAction('group')">组合</li>
        <li v-if="canUngroup" class="ctx-item" @click="emitAction('ungroup')">取消组合</li>
      </template>
    </ul>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'

interface Props {
  x: number
  y: number
  visible: boolean
  targetId?: string
}
const props = defineProps<Props>()

const compStore = useComponent()
const { selectedIds, rootNode, canPaste } = storeToRefs(compStore)

const selectedCount = computed(() => selectedIds.value.length)

// TODO: Implement group/ungroup support in new store
const canGroup = computed(() => {
  return selectedCount.value >= 2
})

const canUngroup = computed(() => {
  if (selectedCount.value !== 1 || !props.targetId || !rootNode.value) return false
  // Find node in tree
  const node = compStore.findNodeById(rootNode.value, props.targetId)
  // Check if it's a container type that could be ungrouped
  return node?.componentName === 'Container' && node.children && node.children.length > 0
})

const emit = defineEmits<{
  (e: 'action', action: string): void
}>()

const menuStyle = computed(() => ({
  left: props.x + 'px',
  top: props.y + 'px',
}))

function emitAction(action: string) {
  emit('action', action)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.ctx-menu {
  position: absolute;
  z-index: 1000;
  min-width: 160px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  user-select: none;
}
.ctx-item {
  padding: 6px 14px;
  cursor: pointer;
  line-height: 18px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ctx-item:hover {
  background: #f5f7fa;
}
.ctx-item:active {
  background: #e6f1ff;
}
.ctx-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}
.ctx-divider {
  height: 1px;
  background: #ebeef5;
  margin: 4px 0;
}
.ctx-header {
  font-weight: 600;
  font-size: 12px;
  color: #606266;
  cursor: default;
}
</style>
