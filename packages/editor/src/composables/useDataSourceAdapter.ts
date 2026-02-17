import { computed, type Ref } from 'vue'
import type { NodeSchema } from '@vela/core'
import type { PropValue } from '@vela/core/types/expression'
import { useComponentDataSource } from '@vela/renderer'
import { useComponent } from '@/stores/component'

function parseOption(option: unknown): PropValue | undefined {
  if (!option) return undefined
  if (typeof option === 'string') {
    try {
      return JSON.parse(option) as Record<string, PropValue>
    } catch {
      return undefined
    }
  }
  return option as PropValue
}

/**
 * Editor-side shell around renderer data-source adaptation.
 * Runtime mapping lives in @vela/renderer; editor only keeps
 * local reactivity subscription and option normalization.
 */
export function useDataSourceAdapter(node: Ref<NodeSchema>) {
  const componentStore = useComponent()
  const { dataSourceProps, remoteData, loading, error } = useComponentDataSource(node)

  const resolvedProps = computed(() => {
    // Subscribe version to refresh canvas props on setter updates.
    void componentStore.styleVersion[node.value.id]

    const baseProps: Record<string, unknown> = { ...(node.value.props || {}) }
    if (baseProps.option !== undefined) {
      baseProps.option = parseOption(baseProps.option)
    }

    return { ...baseProps, ...dataSourceProps.value }
  })

  return {
    resolvedProps,
    loading,
    error,
    remoteData,
  }
}
