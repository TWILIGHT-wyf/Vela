<template>
  <BaseGroup v-bind="groupProps" :show-placeholder="!hasChildren">
    <!-- 渲染子组件 -->
    <div v-if="hasChildren" class="children-container">
      <!-- 子组件使用绝对定位，相对于组合容器 -->
      <div
        v-for="childId in comp?.children"
        :key="childId"
        class="child-item"
        :style="getChildItemStyle(childId)"
      >
        <component
          :is="getComponentByType(getChildComponent(childId)?.type || '')"
          :id="childId"
          :style="{ width: '100%', height: '100%' }"
        />
      </div>
    </div>
  </BaseGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { componentRegistry } from '@vela/materials/registry'
import { vGroup as BaseGroup } from '@vela/ui'

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 子组件相关
const hasChildren = computed(() => {
  return comp.value?.children && comp.value.children.length > 0
})

const getChildComponent = (childId: string) => {
  return componentStore.value.find((c) => c.id === childId)
}

const getComponentByType = (type: string) => {
  return componentRegistry[type] || 'div'
}

// Group 属性
const groupProps = computed(() => {
  const s = comp.value?.style || {}
  return {
    opacity: Number(s.opacity ?? 1),
    visible: comp.value?.style?.visible !== false,
    rotation: Number(comp.value?.rotation || 0),
    borderRadius: Number(s.borderRadius || 0),
    backgroundColor: String(s.backgroundColor || 'transparent'),
    border: String(s.border || 'none'),
    placeholder: '组合',
  }
})

// 子组件项样式 - 使用相对于组合的绝对定位
const getChildItemStyle = (childId: string): CSSProperties => {
  const child = getChildComponent(childId)
  const parentComp = comp.value

  if (!child || !parentComp) return {}

  // 计算子组件相对于组合的位置
  const relativeX = child.position.x - parentComp.position.x
  const relativeY = child.position.y - parentComp.position.y

  return {
    position: 'absolute',
    left: `${relativeX}px`,
    top: `${relativeY}px`,
    width: `${child.size.width}px`,
    height: `${child.size.height}px`,
    transform: `rotate(${child.rotation || 0}deg)`,
    zIndex: child.zindex || 0,
  }
}
</script>

<style scoped>
.children-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.child-item {
  pointer-events: auto;
}
</style>
