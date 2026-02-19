// 集中存放与 store / 状态管理 相关的接口类型
import type { Ref } from 'vue'

export interface ZOrderApi {
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
}

export interface GroupingApi {
  groupComponents: (ids: string[]) => void
  ungroupComponents: (groupId: string) => void
}

export interface ClipboardApi<C> {
  clipboard: Ref<C[] | unknown>
  copy: (id: string) => void
  cut: (id: string) => void
  copyMultiple: (ids: string[]) => void
  cutMultiple: (ids: string[]) => void
  paste: (position: { x: number; y: number }) => void
}

export interface HistoryApi {
  commit: (force?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  commitDebounced: () => void
  commitThrottled: () => void
  init: () => void
}
