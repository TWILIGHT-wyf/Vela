import {
  ensurePageRoot,
  getActionPayload,
  getNodeRenderIf,
  getNodeRepeat,
  getNodeSlot,
  normalizeProjectSchema,
  type ActionSchema,
  type ProjectSchema,
} from '@vela/core'

describe('normalizeProjectSchema', () => {
  it('normalizes legacy project fields into current protocol fields', () => {
    const project = {
      id: 'project_1',
      version: '2.0.0',
      name: 'Legacy Project',
      config: { target: 'pc' },
      globalState: [{ key: 'keyword', type: 'string', source: 'manual', defaultValue: '' }],
      globalApis: [{ id: 'api_1', name: 'fetchUsers', method: 'GET', url: '/api/users' }],
      pages: [
        {
          id: 'page_1',
          type: 'page',
          name: 'Home',
          path: '/',
          children: {
            id: 'page_1_root',
            componentName: 'Page',
            condition: true,
            loop: {
              data: [{ id: 1 }],
              itemArg: 'item',
              indexArg: 'index',
            },
            slotName: 'default',
            animation: {
              name: 'fadeIn',
              class: 'legacy-fade',
            },
            children: [],
            actions: [
              {
                id: 'action_1',
                type: 'setState',
                path: 'keyword',
                value: 'hello',
              } satisfies ActionSchema,
            ],
          },
        },
      ],
    } as ProjectSchema

    const normalized = normalizeProjectSchema(project)
    const root = ensurePageRoot(normalized.pages[0])
    const action = root.actions?.[0] as ActionSchema

    expect(normalized.data?.globalState).toEqual(project.globalState)
    expect(normalized.apis?.definitions).toEqual(project.globalApis)
    expect(root.component).toBe('Page')
    expect(root.componentName).toBe('Page')
    expect(getActionPayload(action)).toEqual({
      path: 'keyword',
      value: 'hello',
    })
    expect(getNodeRenderIf(root)).toBe(true)
    expect(getNodeRepeat(root)).toEqual({
      source: [{ id: 1 }],
      itemAlias: 'item',
      indexAlias: 'index',
    })
    expect(getNodeSlot(root)).toBe('default')
    expect(root.animation?.className).toBe('legacy-fade')
    expect(action.path).toBe('keyword')
  })

  it('creates a stable page root when children is missing', () => {
    const project = {
      id: 'project_2',
      version: '2.0.0',
      name: 'No Root',
      config: { target: 'pc' },
      pages: [{ id: 'page_2', type: 'dialog', name: 'Dialog' }],
    } as ProjectSchema

    const normalized = normalizeProjectSchema(project)
    const root = ensurePageRoot(normalized.pages[0])

    expect(root.id).toBe('page_2_root')
    expect(root.component).toBe('Dialog')
    expect(root.children).toEqual([])
  })
})
