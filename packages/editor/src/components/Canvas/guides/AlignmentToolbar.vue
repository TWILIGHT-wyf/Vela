<template>
  <div v-if="visible" class="alignment-toolbar" :style="toolbarStyle">
    <button
      v-for="action in actions"
      :key="action.id"
      class="align-btn"
      :title="action.title"
      @mousedown.stop.prevent="action.handler"
    >
      {{ action.icon }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'

const componentStore = useComponent()
const { selectedIds, selectedNodes, rootNode } = storeToRefs(componentStore)
const { updateGeometry } = componentStore

const visible = computed(() => {
  if (selectedIds.value.length < 2) return false
  if (rootNode.value?.container?.mode !== 'free') return false
  return true
})

interface NodeGeom {
  id: string
  x: number
  y: number
  w: number
  h: number
}

const getGeometries = (): NodeGeom[] => {
  return selectedNodes.value.map((node) => {
    const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
    const style = node.style || {}
    return {
      id: node.id,
      x: Number(geometry?.x ?? 0),
      y: Number(geometry?.y ?? 0),
      w: Number(geometry?.width ?? style.width ?? 100) || 100,
      h: Number(geometry?.height ?? style.height ?? 100) || 100,
    }
  })
}

const boundingBox = computed(() => {
  const geoms = getGeometries()
  if (geoms.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const g of geoms) {
    minX = Math.min(minX, g.x)
    minY = Math.min(minY, g.y)
    maxX = Math.max(maxX, g.x + g.w)
    maxY = Math.max(maxY, g.y + g.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
})

const toolbarStyle = computed(() => {
  const bb = boundingBox.value
  return {
    position: 'absolute' as const,
    left: `${bb.x}px`,
    top: `${bb.y - 36}px`,
    zIndex: 10000,
    pointerEvents: 'all' as const,
  }
})

const alignLeft = () => {
  const geoms = getGeometries()
  const minX = Math.min(...geoms.map((g) => g.x))
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', x: minX })
  })
}

const alignCenterH = () => {
  const geoms = getGeometries()
  const bb = boundingBox.value
  const centerX = bb.x + bb.w / 2
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', x: Math.round(centerX - g.w / 2) })
  })
}

const alignRight = () => {
  const geoms = getGeometries()
  const maxRight = Math.max(...geoms.map((g) => g.x + g.w))
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', x: maxRight - g.w })
  })
}

const alignTop = () => {
  const geoms = getGeometries()
  const minY = Math.min(...geoms.map((g) => g.y))
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', y: minY })
  })
}

const alignCenterV = () => {
  const geoms = getGeometries()
  const bb = boundingBox.value
  const centerY = bb.y + bb.h / 2
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', y: Math.round(centerY - g.h / 2) })
  })
}

const alignBottom = () => {
  const geoms = getGeometries()
  const maxBottom = Math.max(...geoms.map((g) => g.y + g.h))
  geoms.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', y: maxBottom - g.h })
  })
}

const distributeH = () => {
  const geoms = getGeometries()
  if (geoms.length < 3) return
  const sorted = [...geoms].sort((a, b) => a.x - b.x)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpace = last.x + last.w - first.x
  const totalWidth = sorted.reduce((sum, g) => sum + g.w, 0)
  const gap = (totalSpace - totalWidth) / (sorted.length - 1)
  let currentX = first.x
  sorted.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', x: Math.round(currentX) })
    currentX += g.w + gap
  })
}

const distributeV = () => {
  const geoms = getGeometries()
  if (geoms.length < 3) return
  const sorted = [...geoms].sort((a, b) => a.y - b.y)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpace = last.y + last.h - first.y
  const totalHeight = sorted.reduce((sum, g) => sum + g.h, 0)
  const gap = (totalSpace - totalHeight) / (sorted.length - 1)
  let currentY = first.y
  sorted.forEach((g) => {
    updateGeometry(g.id, { mode: 'free', y: Math.round(currentY) })
    currentY += g.h + gap
  })
}

const actions = [
  { id: 'align-left', title: 'Align Left', icon: '⫷', handler: alignLeft },
  { id: 'align-center-h', title: 'Align Center Horizontal', icon: '⫿', handler: alignCenterH },
  { id: 'align-right', title: 'Align Right', icon: '⫸', handler: alignRight },
  { id: 'align-top', title: 'Align Top', icon: '⊤', handler: alignTop },
  { id: 'align-center-v', title: 'Align Center Vertical', icon: '⊟', handler: alignCenterV },
  { id: 'align-bottom', title: 'Align Bottom', icon: '⊥', handler: alignBottom },
  { id: 'distribute-h', title: 'Distribute Horizontal', icon: '⇔', handler: distributeH },
  { id: 'distribute-v', title: 'Distribute Vertical', icon: '⇕', handler: distributeV },
]
</script>

<style scoped>
.alignment-toolbar {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.align-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  padding: 0;
  line-height: 1;
}

.align-btn:hover {
  background: #e5e7eb;
}

.align-btn:active {
  background: #d1d5db;
}
</style>
