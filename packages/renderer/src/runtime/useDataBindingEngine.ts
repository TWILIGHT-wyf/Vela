import { watch, type Ref, type WatchStopHandle, type ComputedRef } from 'vue'
import { get, isEqual } from 'lodash-es'
import type { NodeSchema, DataBinding } from '@vela/core'

export interface DataBindingEngine {
  start: () => void
  stop: () => void
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

/**
 * 归一化组件的数据绑定配置
 */
function normalizeBindings(node: NodeSchema): DataBinding[] {
  return Array.isArray(node.dataBindings) ? node.dataBindings : []
}

/**
 * 数据联动引擎
 *
 * 核心特性：
 * 1. 使用 lodash get 安全处理深层属性路径
 * 2. 使用 Map 索引优化查找性能 O(1)
 * 3. 使用锁机制防止循环绑定导致的无限更新
 * 4. 支持数据转换器（表达式/模板）
 * 5. 精确路径监听，避免不必要的 deep watch
 */
export function useDataBindingEngine(
  components: Ref<NodeSchema[]> | ComputedRef<NodeSchema[]>,
): DataBindingEngine {
  let stops: WatchStopHandle[] = []
  // 更新锁：防止 A→B→A 循环绑定导致无限递归
  const updateLocks = new Set<string>()
  let enabled = true

  function stop() {
    for (const stopFn of stops) stopFn()
    stops = []
    updateLocks.clear()
  }

  function setEnabled(value: boolean) {
    enabled = value
  }

  function start() {
    stop()

    const comps = components.value
    if (!Array.isArray(comps) || comps.length === 0) return

    // 使用 Map 建立组件索引，O(1) 查找复杂度
    const compById = new Map(comps.map((c) => [c.id, c] as const))

    for (const target of comps) {
      const bindings = normalizeBindings(target)
      if (bindings.length === 0) continue

      for (const binding of bindings) {
        if (!binding?.sourceId || !binding.sourcePath || !binding.targetPath) {
          continue
        }

        // 自环保护：同组件同路径跳过
        if (
          binding.sourceId === target.id &&
          (binding.sourcePath === binding.targetPath ||
            binding.targetPath.startsWith(`${binding.sourcePath}.`) ||
            binding.sourcePath.startsWith(`${binding.targetPath}.`))
        ) {
          continue
        }

        const source = compById.get(binding.sourceId)
        if (!source) continue

        /**
         * 核心更新函数：读取源值 → 转换 → 写入目标
         */
        const doUpdate = (sourceValue: unknown) => {
          if (!enabled) return

          const lockKey = `${target.id}:${binding.targetPath}`
          if (updateLocks.has(lockKey)) return

          const latestTarget = compById.get(target.id)
          if (!latestTarget) return

          try {
            updateLocks.add(lockKey)

            // 执行数据转换器
            let finalValue = sourceValue
            if (binding.transformer) {
              try {
                if (binding.transformerType === 'template') {
                  finalValue = binding.transformer.replace(/\$\{value\}/g, String(sourceValue))
                } else {
                  const code = binding.transformer.trim()
                  const fn = code.startsWith('return ')
                    ? new Function('value', code)
                    : new Function('value', `return ${code}`)
                  finalValue = fn(sourceValue)
                }
              } catch (error) {
                console.warn('[数据联动] 转换器执行失败:', error)
              }
            }

            // 智能类型转换：目标是 props.text 时确保值为字符串
            if (binding.targetPath === 'props.text' && typeof finalValue !== 'string') {
              finalValue = String(finalValue)
            }

            const currentValue = get(latestTarget, binding.targetPath)
            if (isEqual(currentValue, finalValue)) return

            // 直接属性赋值触发 Vue 响应式
            const pathParts = binding.targetPath.split('.')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let obj: Record<string, any> = latestTarget as Record<string, any>

            for (let i = 0; i < pathParts.length - 1; i++) {
              const key = pathParts[i] as string
              if (!obj[key] || typeof obj[key] !== 'object') {
                obj[key] = {}
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              obj = obj[key] as Record<string, any>
            }

            const lastKey = pathParts[pathParts.length - 1] as string
            obj[lastKey] = finalValue
          } finally {
            setTimeout(() => updateLocks.delete(lockKey), 0)
          }
        }

        const stopWatch = watch(
          () => {
            const sourceComp = compById.get(binding.sourceId)
            if (!sourceComp) return undefined
            return get(sourceComp, binding.sourcePath)
          },
          (newValue) => doUpdate(newValue),
          { deep: true, immediate: true },
        )

        stops.push(stopWatch)
      }
    }
  }

  // 监听组件数组引用变化，自动重建引擎
  watch(components, () => start(), { deep: false })

  return { start, stop, isEnabled: enabled, setEnabled }
}
