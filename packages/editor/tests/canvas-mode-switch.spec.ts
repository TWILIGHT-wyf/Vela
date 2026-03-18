import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { LayoutMode, ProjectSchema } from '@vela/core'
import { useProjectStore } from '../src/stores/project'
import { useComponent } from '../src/stores/component'
import { useUIStore } from '../src/stores/ui'

function createProjectSchema(): ProjectSchema {
  return {
    id: 'proj_test_canvas_mode',
    version: '2.0.0',
    name: 'Canvas Mode Test',
    config: { target: 'pc' },
    pages: [
      {
        id: 'page_home',
        type: 'page',
        name: 'Home',
        path: '/',
        config: { defaultLayoutMode: 'grid' },
        children: {
          id: 'root',
          component: 'Page',
          container: {
            mode: 'grid',
            columns: '1fr 1fr 1fr',
            rows: 'auto',
            gap: 8,
          },
          props: {},
          style: { width: '100%', height: '100%' },
          children: [],
        },
      },
    ],
  }
}

describe('canvas mode switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('centralized setCanvasMode keeps root container and page config in sync', () => {
    const projectStore = useProjectStore()
    projectStore.initProject(createProjectSchema())

    const componentStore = useComponent()
    const uiStore = useUIStore()

    expect(uiStore.canvasMode).toBe('grid')

    uiStore.setCanvasMode('free')

    expect(uiStore.canvasMode).toBe('free')
    expect(componentStore.rootNode?.container?.mode).toBe('free')
    expect(projectStore.currentPage?.config?.defaultLayoutMode).toBe('free')

    uiStore.setCanvasMode('grid')

    expect(uiStore.canvasMode).toBe('grid')
    expect(componentStore.rootNode?.container?.mode).toBe('grid')
    expect(projectStore.currentPage?.config?.defaultLayoutMode).toBe('grid')
  })

  it('normalizes flow request to grid at editor boundary', () => {
    const projectStore = useProjectStore()
    projectStore.initProject(createProjectSchema())

    const componentStore = useComponent()
    const uiStore = useUIStore()

    uiStore.setCanvasMode('free')
    expect(componentStore.rootNode?.container?.mode).toBe('free')

    uiStore.setCanvasMode('flow' as LayoutMode)

    expect(uiStore.canvasMode).toBe('grid')
    expect(componentStore.rootNode?.container?.mode).toBe('grid')
    expect(projectStore.currentPage?.config?.defaultLayoutMode).toBe('grid')
  })
})
