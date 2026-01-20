import type { Ref } from 'vue'
import type { Router } from 'vue-router'
import type { Component } from '@vela/core/types/components'

export interface Page {
  id: string
  name: string
  route?: string
  path?: string
  // Add other properties if needed
}

export interface RuntimeContext {
  components: Ref<Component[]>
  pages: Ref<Page[]>
  isProjectMode: Ref<boolean>
  router: Router

  // Hooks
  subscribeComponentEvent: (
    handler: (payload: { componentId: string; eventType: string; actions: any[] }) => void,
  ) => void
}

export type RuntimePlugin = (context: RuntimeContext) => void
