<template>
  <div class="tree-node-wrapper">
    <div
      class="tree-node-content"
      :class="{ 'is-active': activeId === node.id }"
      :style="{ paddingLeft: paddingLeft + 'px' }"
    >
      <!-- 图标区 -->
      <div class="node-icon">
        <el-icon v-if="node.type === 'folder'" class="arrow-icon">
          <ArrowDown v-if="node.expanded" />
          <ArrowRight v-else />
        </el-icon>
        <span v-else class="spacer"></span>

        <el-icon class="type-icon" :class="node.type">
          <Folder v-if="node.type === 'folder'" />
          <Document v-else />
        </el-icon>
      </div>

      <!-- 文本区 -->
      <div class="node-text" @click="handleClick">
        <div class="name-row">
          <!-- 编辑模式 -->
          <el-input
            v-if="isEditing"
            ref="nameInputRef"
            v-model="editName"
            size="small"
            @blur="handleNameBlur"
            @keyup.enter="handleNameConfirm"
            @keyup.escape="cancelEdit"
            class="edit-input"
            maxlength="30"
            show-word-limit
          />
          <!-- 显示模式 -->
          <span v-else class="name">{{ node.name }}</span>
          <el-tag v-if="node.isHome" size="small" type="info" effect="plain" class="home-tag"
            >首页</el-tag
          >
        </div>
        <div class="route-row">
          <!-- 编辑模式 -->
          <el-input
            v-if="isEditing"
            v-model="editRoute"
            size="small"
            @blur="handleRouteBlur"
            @keyup.enter="handleRouteConfirm"
            @keyup.escape="cancelEdit"
            class="edit-input route-edit-input"
            :class="{ 'is-error': routeError }"
            placeholder="/page-route"
            maxlength="50"
          />
          <!-- 显示模式 -->
          <span v-else>{{ node.path }}</span>
          <span v-if="isEditing && routeError" class="route-error">{{ routeError }}</span>
        </div>
      </div>

      <!-- 操作区 (Hover显示) -->
      <div class="node-actions" @click.stop>
        <el-tooltip v-if="!isEditing" content="编辑" placement="top" :show-after="500">
          <el-icon class="action-icon" @click="startEdit"><Edit /></el-icon>
        </el-tooltip>
        <el-tooltip v-if="isEditing" content="确认" placement="top" :show-after="500">
          <el-icon class="action-icon confirm" @click="confirmEdit"><Check /></el-icon>
        </el-tooltip>
        <el-tooltip v-if="isEditing" content="取消" placement="top" :show-after="500">
          <el-icon class="action-icon cancel" @click="cancelEdit"><Close /></el-icon>
        </el-tooltip>
        <el-tooltip
          v-if="node.path && !isEditing"
          content="复制路由"
          placement="top"
          :show-after="500"
        >
          <el-icon class="action-icon" @click="$emit('copy-route', node.path!)"
            ><CopyDocument
          /></el-icon>
        </el-tooltip>
        <el-tooltip v-if="!isEditing" content="删除" placement="top" :show-after="500">
          <el-icon class="action-icon delete" @click="$emit('delete', node.id)"><Delete /></el-icon>
        </el-tooltip>
      </div>
    </div>

    <!-- 递归渲染子节点 -->
    <div v-if="node.type === 'folder' && node.expanded">
      <PageTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-id="activeId"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @delete="$emit('delete', $event)"
        @copy-route="$emit('copy-route', $event)"
        @edit="$emit('edit', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import {
  ArrowRight,
  ArrowDown,
  Folder,
  Document,
  Delete,
  CopyDocument,
  Edit,
  Check,
  Close,
} from '@element-plus/icons-vue'

defineOptions({
  name: 'PageTreeNode',
})

// 本地类型定义
interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'page'
  path?: string
  expanded?: boolean
  isHome?: boolean
  children?: TreeNode[]
}

interface TreeNodeProps {
  node: TreeNode
  activeId?: string
  depth?: number
}

const props = withDefaults(defineProps<TreeNodeProps>(), {
  activeId: '',
  depth: 0,
})

const emit = defineEmits<{
  toggle: [id: string]
  select: [id: string]
  delete: [id: string]
  'copy-route': [path: string]
  edit: [data: { id: string; name: string; route?: string }]
}>()

const paddingLeft = computed(() => props.depth * 16 + 8)

// 编辑状态
const isEditing = ref(false)
const editName = ref('')
const editRoute = ref('')
const nameInputRef = ref()
const routeError = ref('')

// 路由验证函数
function validateRoute(route: string): string {
  if (!route) return ''

  // 必须以 '/' 开头
  if (!route.startsWith('/')) {
    return '路由必须以 / 开头'
  }

  // 不能包含中文字符
  const chineseRegex = /[\u4e00-\u9fff]/
  if (chineseRegex.test(route)) {
    return '路由不能包含中文字符'
  }

  // 只允许字母、数字、连字符、下划线、斜杠
  const validRouteRegex = /^\/[a-zA-Z0-9\-_\/]+$/
  if (!validRouteRegex.test(route)) {
    return '路由格式无效，只能包含字母、数字、连字符、下划线和斜杠'
  }

  return ''
}

function startEdit() {
  isEditing.value = true
  editName.value = props.node.name
  editRoute.value = props.node.path || ''
  routeError.value = ''

  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
  editRoute.value = ''
  routeError.value = ''
}

function confirmEdit() {
  const name = editName.value.trim()
  const route = editRoute.value.trim()

  if (!name) {
    return
  }

  const routeValidation = validateRoute(route)
  if (routeValidation) {
    routeError.value = routeValidation
    return
  }

  emit('edit', {
    id: props.node.id,
    name,
    route: route || undefined,
  })

  isEditing.value = false
}

function handleNameBlur() {
  // 延迟处理，让确认按钮有机会触发
  setTimeout(() => {
    if (isEditing.value) {
      handleNameConfirm()
    }
  }, 100)
}

function handleNameConfirm() {
  if (editName.value.trim()) {
    confirmEdit()
  }
}

function handleRouteBlur() {
  // 延迟处理，让确认按钮有机会触发
  setTimeout(() => {
    if (isEditing.value) {
      handleRouteConfirm()
    }
  }, 100)
}

function handleRouteConfirm() {
  const routeValidation = validateRoute(editRoute.value.trim())
  if (routeValidation) {
    routeError.value = routeValidation
    return
  }
  confirmEdit()
}

function handleClick() {
  if (isEditing.value) return

  if (props.node.type === 'folder') {
    emit('toggle', props.node.id)
  } else {
    emit('select', props.node.id)
  }
}
</script>

<style scoped>
.tree-node-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  position: relative;
  background: transparent;
}

.tree-node-content:hover {
  background-color: rgba(66, 133, 244, 0.06);
}

.tree-node-content.is-active {
  background: linear-gradient(135deg, rgba(66, 133, 244, 0.12), rgba(66, 133, 244, 0.06));
  color: var(--el-color-primary);
}

.node-icon {
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: var(--el-text-color-secondary);
}

.tree-node-content.is-active .node-icon {
  color: var(--el-color-primary);
}

.arrow-icon {
  font-size: 10px;
  margin-right: 6px;
  width: 12px;
}

.spacer {
  width: 18px;
}

.type-icon {
  font-size: 16px;
}

.node-text {
  flex: 1;
  overflow: hidden;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

.tree-node-content.is-active .name {
  color: var(--el-color-primary);
  font-weight: 600;
}

.home-tag {
  height: 18px;
  padding: 0 6px;
  font-size: 10px;
  border-radius: 4px;
}

.route-row {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node-content.is-active .route-row {
  color: var(--el-color-primary-light-5);
}

.route-row span {
  flex: 1;
}

/* 编辑输入框样式 */
.edit-input {
  font-size: 12px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.edit-input :deep(.el-input__wrapper) {
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: none;
}

.route-edit-input {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

.route-edit-input.is-error :deep(.el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger);
}

.route-error {
  font-size: 10px;
  color: var(--el-color-danger);
  white-space: nowrap;
}

.node-actions {
  display: none;
  align-items: center;
  gap: 2px;
}

.tree-node-content:hover .node-actions,
.tree-node-content.is-active .node-actions {
  display: flex;
}

.action-icon {
  font-size: 14px;
  padding: 6px;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}

.action-icon:hover {
  background-color: var(--el-fill-color);
  color: var(--el-color-primary);
}

.action-icon.confirm:hover {
  background-color: rgba(25, 190, 107, 0.1);
  color: var(--el-color-success);
}

.action-icon.cancel:hover {
  background-color: rgba(245, 108, 108, 0.1);
  color: var(--el-color-danger);
}

.action-icon.delete:hover {
  background-color: rgba(245, 108, 108, 0.1);
  color: var(--el-color-danger);
}
</style>
