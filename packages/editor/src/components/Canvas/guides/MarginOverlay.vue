<template>
  <div v-if="visible" class="margin-overlay">
    <div v-for="rect in marginRects" :key="rect.side" class="margin-rect" :style="rect.style" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'

interface MarginRectData {
  side: string
  style: Record<string, string>
}

const componentStore = useComponent()
const { selectedId, hoveredId } = storeToRefs(componentStore)
const uiStore = useUIStore()
const { canvasScale } = storeToRefs(uiStore)

const marginRects = ref<MarginRectData[]>([])

const targetId = computed(() => selectedId.value || hoveredId.value)

const visible = computed(() => {
  if (!targetId.value) return false
  return marginRects.value.length > 0
})

let animFrameId = 0

const computeMarginRects = () => {
  const id = targetId.value
  if (!id) {
    marginRects.value = []
    return
  }

  const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null
  if (!el) {
    marginRects.value = []
    return
  }

  const computed = getComputedStyle(el)
  const mt = parseFloat(computed.marginTop) || 0
  const mr = parseFloat(computed.marginRight) || 0
  const mb = parseFloat(computed.marginBottom) || 0
  const ml = parseFloat(computed.marginLeft) || 0

  if (mt === 0 && mr === 0 && mb === 0 && ml === 0) {
    marginRects.value = []
    return
  }

  // Get element position relative to the simulation-page container
  const page = el.closest('.simulation-page') as HTMLElement | null
  if (!page) {
    marginRects.value = []
    return
  }

  const pageRect = page.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const scale = Math.max(canvasScale.value || 1, 0.0001)

  const x = (elRect.left - pageRect.left) / scale
  const y = (elRect.top - pageRect.top) / scale
  const w = elRect.width / scale
  const h = elRect.height / scale

  const color = 'rgba(251, 191, 36, 0.2)'
  const borderColor = 'rgba(251, 191, 36, 0.6)'

  const rects: MarginRectData[] = []

  if (mt !== 0) {
    const absTop = Math.abs(mt)
    const top = mt > 0 ? y - mt : y
    rects.push({
      side: 'top',
      style: {
        position: 'absolute',
        left: `${x}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${absTop}px`,
        background: color,
        border: `1px solid ${borderColor}`,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      },
    })
  }

  if (mr !== 0) {
    const absRight = Math.abs(mr)
    const left = mr > 0 ? x + w : x + w - absRight
    rects.push({
      side: 'right',
      style: {
        position: 'absolute',
        left: `${left}px`,
        top: `${y}px`,
        width: `${absRight}px`,
        height: `${h}px`,
        background: color,
        border: `1px solid ${borderColor}`,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      },
    })
  }

  if (mb !== 0) {
    const absBottom = Math.abs(mb)
    const top = mb > 0 ? y + h : y + h - absBottom
    rects.push({
      side: 'bottom',
      style: {
        position: 'absolute',
        left: `${x}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${absBottom}px`,
        background: color,
        border: `1px solid ${borderColor}`,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      },
    })
  }

  if (ml !== 0) {
    const absLeft = Math.abs(ml)
    const left = ml > 0 ? x - ml : x
    rects.push({
      side: 'left',
      style: {
        position: 'absolute',
        left: `${left}px`,
        top: `${y}px`,
        width: `${absLeft}px`,
        height: `${h}px`,
        background: color,
        border: `1px solid ${borderColor}`,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      },
    })
  }

  marginRects.value = rects
}

watch(
  targetId,
  () => {
    cancelAnimationFrame(animFrameId)
    animFrameId = requestAnimationFrame(computeMarginRects)
  },
  { immediate: true },
)

// Re-compute when style changes (via styleVersion)
watch(
  () => {
    const id = targetId.value
    if (!id) return 0
    return componentStore.styleVersion[id] ?? 0
  },
  () => {
    cancelAnimationFrame(animFrameId)
    animFrameId = requestAnimationFrame(computeMarginRects)
  },
)

watch(canvasScale, () => {
  cancelAnimationFrame(animFrameId)
  animFrameId = requestAnimationFrame(computeMarginRects)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.margin-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
</style>
