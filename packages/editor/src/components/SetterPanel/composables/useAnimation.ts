import { ref, computed, nextTick } from 'vue'
import { useComponent } from '@/stores/component'

export interface AnimationOption {
  name: string
  label: string
  className: string
  duration?: number
  desc?: string
}

export const animations: AnimationOption[] = [
  { name: 'fade', label: '淡入', className: 'anim-fade', desc: '元素由透明到不透明' },
  { name: 'zoom', label: '缩放', className: 'anim-zoom', desc: '由小到大缩放进入' },
  { name: 'slide-left', label: '左滑入', className: 'anim-slide-left', desc: '从右向左滑入' },
  { name: 'slide-up', label: '上移入', className: 'anim-slide-up', desc: '从下向上滑入' },
  { name: 'bounce', label: '弹跳', className: 'anim-bounce', desc: '带弹性进入' },
  { name: 'rotate', label: '旋转', className: 'anim-rotate', desc: '旋转出现' },
]

export function useAnimationPreview() {
  const currentClass = ref<string | null>(null)
  const replayKey = ref(0)

  function triggerPreview(cls: string) {
    currentClass.value = null
    nextTick(() => {
      currentClass.value = cls
      replayKey.value++
    })
  }

  function cancelPreview() {}

  const previewClass = computed(() => {
    return ['preview-target', currentClass.value].filter(Boolean)
  })

  return {
    currentClass,
    replayKey,
    triggerPreview,
    cancelPreview,
    previewClass,
  }
}

export function useAnimationSelection() {
  const store = useComponent()

  const currentAnimation = computed(() => {
    return store.selectedNode?.animation
  })

  function selectAnimation(a: { name: string; className: string }) {
    const node = store.selectedNode
    if (!node) return

    const baseConfig = node.animation || {
      duration: 800,
      delay: 0,
      iterations: 1,
      easing: 'ease',
      trigger: 'init' as const,
    }

    node.animation = {
      ...baseConfig,
      name: a.name,
      className: a.className,
    }

    store.syncToProjectStore()
  }

  return {
    currentAnimation,
    selectAnimation,
  }
}
