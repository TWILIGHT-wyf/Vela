import { onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'

export function useEditorShortcuts(
  options: {
    enableDelete?: boolean
    enableClipboard?: boolean
    enableSelectAll?: boolean
    closeMenu?: () => void
  } = {},
) {
  const compStore = useComponent()
  const { rootNode, selectedId, selectedIds } = storeToRefs(compStore)
  const {
    deleteComponent,
    deleteComponents,
    copySelectedNodes,
    cutSelectedNodes,
    pasteNodes,
    selectComponents,
    clearSelection,
  } = compStore

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    // Delete - 删除选中组件
    if ((options.enableDelete ?? true) && (e.key === 'Delete' || e.key === 'Backspace')) {
      if (selectedId.value) {
        e.preventDefault()
        deleteComponent(selectedId.value)
      } else if (selectedIds.value.length > 0) {
        e.preventDefault()
        deleteComponents([...selectedIds.value])
      }
      return
    }

    // Ctrl+C - 复制
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'c') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        copySelectedNodes()
      }
      return
    }

    // Ctrl+X - 剪切
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'x') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        cutSelectedNodes()
      }
      return
    }

    // Ctrl+V - 粘贴
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'v') {
      e.preventDefault()
      pasteNodes()
      return
    }

    // Ctrl+A - 全选 (选中所有顶层组件)
    if ((options.enableSelectAll ?? true) && ctrlKey && e.key === 'a') {
      if (rootNode.value?.children && rootNode.value.children.length > 0) {
        e.preventDefault()
        const allIds = rootNode.value.children.map((n) => n.id)
        selectComponents(allIds)
      }
      return
    }

    // Escape - 取消选中 / 关闭菜单
    if (e.key === 'Escape') {
      if (options.closeMenu) {
        options.closeMenu()
      } else {
        clearSelection()
      }
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
