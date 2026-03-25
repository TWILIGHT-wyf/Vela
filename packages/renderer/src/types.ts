import type { Ref, ComputedRef } from 'vue'
import type { Router } from 'vue-router'
import type { AnyActionSchema, DialogPage, NodeSchema, PageSchema } from '@vela/core'

export interface Page {
  id: string
  name: string
  type?: PageSchema['type']
  title?: string
  route?: string
  path?: string
  actions?: AnyActionSchema[]
  children?: NodeSchema
  dialogConfig?: DialogPage['dialogConfig']
}

/**
 * Runtime context provided to plugins
 */
export interface RuntimeContext {
  /**
   * Flat list of all components (for backward compatibility)
   * @deprecated Use nodeIndex for O(1) lookup
   */
  components: Ref<NodeSchema[]> | ComputedRef<NodeSchema[]>

  /**
   * Available pages
   */
  pages: Ref<Page[]> | ComputedRef<Page[]>

  /**
   * Whether running in multi-page project mode
   */
  isProjectMode: Ref<boolean> | ComputedRef<boolean>

  /**
   * Vue Router instance
   */
  router: Router

  /**
   * Subscribe to component events
   */
  subscribeComponentEvent: (
    handler: (payload: {
      componentId: string
      eventType: string
      actions: unknown[]
      event?: Event
    }) => void,
  ) => () => void

  /**
   * Optional page navigation callback for project-mode runtimes.
   * When provided, navigate actions should use this callback first.
   */
  onNavigate?: (pageId: string) => void
}

/**
 * Runtime plugin function type
 */
export type RuntimePlugin = (context: RuntimeContext) => void | (() => void)

/**
 * Operating mode for runtime components
 */
export type RuntimeMode = 'runtime' | 'editor' | 'preview' | 'simulation'
