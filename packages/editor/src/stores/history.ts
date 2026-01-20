import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { NodeSchema } from '@vela/core'
import { cloneDeep, debounce } from 'lodash-es'
import { useComponent } from './component'

/**
 * 历史记录管理 Store
 * 实现撤销/重做功能 (Snapshot模式)
 */
export const useHistoryStore = defineStore('history', () => {
  const componentStore = useComponent()

  // ========== State ==========

  const stack = ref<NodeSchema[]>([])
  const pointer = ref(-1)
  const MAX_HISTORY = 30

  // 锁：当正在撤销/重做时，不应记录新的历史
  const isLocked = ref(false)

  // ========== Getters ==========

  const canUndo = computed(() => pointer.value > 0)
  const canRedo = computed(() => pointer.value < stack.value.length - 1)

  // ========== Actions ==========

  /**
   * 记录新快照
   * @param state 新的状态树
   */
  function pushState(state: NodeSchema) {
    if (isLocked.value) return

    // 如果指针不在末尾，丢弃后面的记录 (分叉历史)
    if (pointer.value < stack.value.length - 1) {
      stack.value = stack.value.slice(0, pointer.value + 1)
    }

    stack.value.push(cloneDeep(state))
    pointer.value++

    // 限制历史记录数量
    if (stack.value.length > MAX_HISTORY) {
      stack.value.shift()
      pointer.value--
    }

    console.log(`[History] Pushed state, pointer: ${pointer.value}`)
  }

  // 防抖的记录函数，避免拖拽时频繁记录
  const debouncedPush = debounce((state: NodeSchema) => {
    if (state) pushState(state)
  }, 500)

  /**
   * 初始化历史记录 (通常在页面加载完成后调用)
   */
  function init() {
    // 停止之前的 watch（如果有）
    // 注意：Pinia setup store 中难以直接停止 watch，除非保存 unwatch 函数
    // 这里简单处理：通过 isLocked 配合

    if (componentStore.rootNode) {
      stack.value = [cloneDeep(componentStore.rootNode)]
      pointer.value = 0
    } else {
      stack.value = []
      pointer.value = -1
    }

    isLocked.value = false
    console.log('[History] Initialized')

    // 启动监听
    // deep: true 监听整棵树的变化
    watch(
      () => componentStore.rootNode,
      (newVal) => {
        if (!isLocked.value && newVal) {
          debouncedPush(newVal)
        }
      },
      { deep: true },
    )
  }

  /**
   * 撤销
   */
  function undo() {
    if (!canUndo.value) return

    // 加锁，防止 setTree 触发 pushState
    isLocked.value = true

    pointer.value--
    const prevState = stack.value[pointer.value]

    // 恢复状态
    if (prevState) {
      componentStore.setTree(cloneDeep(prevState))
    }

    // 恢复完成后解锁 (使用 setTimeout 确保 watch 已执行完毕)
    setTimeout(() => {
      isLocked.value = false
    }, 100) // 稍微增加延迟以确保安全

    console.log(`[History] Undo to: ${pointer.value}`)
  }

  /**
   * 重做
   */
  function redo() {
    if (!canRedo.value) return

    isLocked.value = true

    pointer.value++
    const nextState = stack.value[pointer.value]

    if (nextState) {
      componentStore.setTree(cloneDeep(nextState))
    }

    setTimeout(() => {
      isLocked.value = false
    }, 100)

    console.log(`[History] Redo to: ${pointer.value}`)
  }

  return {
    stack,
    pointer,
    canUndo,
    canRedo,
    init,
    undo,
    redo,
  }
})
