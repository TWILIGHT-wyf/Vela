import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Command } from './commands/types'

/**
 * 历史记录管理 Store（命令模式）
 *
 * 实现基于命令的撤销/重做功能
 * - 相比快照模式，内存占用更小
 * - 支持命令合并（如连续拖拽）
 * - 更精确的操作粒度
 */
export const useHistoryStore = defineStore('history', () => {
  // ========== State ==========

  /** 撤销栈 */
  const undoStack = ref<Command[]>([])

  /** 重做栈 */
  const redoStack = ref<Command[]>([])

  /** 最大历史记录数 */
  const MAX_HISTORY = 50

  /** 是否正在执行撤销/重做（防止递归） */
  const isExecuting = ref(false)

  /** 是否暂停记录（用于批量操作） */
  const isPaused = ref(false)

  // ========== Getters ==========

  /** 是否可以撤销 */
  const canUndo = computed(() => undoStack.value.length > 0)

  /** 是否可以重做 */
  const canRedo = computed(() => redoStack.value.length > 0)

  /** 撤销栈长度 */
  const undoCount = computed(() => undoStack.value.length)

  /** 重做栈长度 */
  const redoCount = computed(() => redoStack.value.length)

  // ========== Actions ==========

  /**
   * 执行命令并记录到历史
   * @param command 要执行的命令
   * @param skipMerge 是否跳过合并检查
   */
  function executeCommand(command: Command, skipMerge = false): void {
    if (isPaused.value) {
      // 暂停时直接执行，不记录
      command.execute()
      return
    }

    // 执行命令
    command.execute()

    // 检查是否可以与上一个命令合并
    if (!skipMerge && undoStack.value.length > 0) {
      const lastCmd = undoStack.value[undoStack.value.length - 1]
      if (command.canMerge && command.canMerge(lastCmd)) {
        // 合并命令
        undoStack.value.pop()
        const mergedCmd = command.merge!(lastCmd)
        undoStack.value.push(mergedCmd)
        console.log(`[History] Merged command: ${command.type}`)
        return
      }
    }

    // 添加到撤销栈
    undoStack.value.push(command)

    // 清空重做栈（新操作会使重做历史失效）
    redoStack.value = []

    // 限制历史长度
    while (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }

    console.log(`[History] Executed: ${command.type}, stack size: ${undoStack.value.length}`)
  }

  /**
   * 撤销上一个命令
   */
  function undo(): void {
    if (!canUndo.value || isExecuting.value) return

    isExecuting.value = true

    try {
      const command = undoStack.value.pop()
      if (command) {
        command.undo()
        redoStack.value.push(command)
        console.log(`[History] Undo: ${command.type}`)
      }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 重做上一个撤销的命令
   */
  function redo(): void {
    if (!canRedo.value || isExecuting.value) return

    isExecuting.value = true

    try {
      const command = redoStack.value.pop()
      if (command) {
        command.redo()
        undoStack.value.push(command)
        console.log(`[History] Redo: ${command.type}`)
      }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 清空所有历史记录
   */
  function clear(): void {
    undoStack.value = []
    redoStack.value = []
    console.log('[History] Cleared')
  }

  /**
   * 暂停历史记录
   * 用于批量操作时避免记录中间状态
   */
  function pause(): void {
    isPaused.value = true
  }

  /**
   * 恢复历史记录
   */
  function resume(): void {
    isPaused.value = false
  }

  /**
   * 在暂停状态下执行一组操作
   * @param fn 要执行的函数
   */
  function withoutHistory<T>(fn: () => T): T {
    pause()
    try {
      return fn()
    } finally {
      resume()
    }
  }

  /**
   * 获取历史记录摘要（用于调试）
   */
  function getDebugInfo(): { undo: string[]; redo: string[] } {
    return {
      undo: undoStack.value.map((cmd) => `${cmd.type}: ${cmd.description || ''}`),
      redo: redoStack.value.map((cmd) => `${cmd.type}: ${cmd.description || ''}`),
    }
  }

  // ========== 向后兼容 API ==========

  /**
   * @deprecated Use executeCommand instead
   * 保留用于向后兼容，现在是空操作
   */
  function init(): void {
    console.log('[History] Initialized (command mode)')
  }

  /**
   * @deprecated Use executeCommand instead
   * 保留用于向后兼容，现在是空操作
   */
  function commit(): void {
    // 命令模式下不需要手动提交
    console.log('[History] commit() is deprecated in command mode')
  }

  return {
    // State
    undoStack,
    redoStack,
    isExecuting,
    isPaused,

    // Getters
    canUndo,
    canRedo,
    undoCount,
    redoCount,

    // Actions
    executeCommand,
    undo,
    redo,
    clear,
    pause,
    resume,
    withoutHistory,
    getDebugInfo,

    // Compatibility
    init,
    commit,
  }
})
