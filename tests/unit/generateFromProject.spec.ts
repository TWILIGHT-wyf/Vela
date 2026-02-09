import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProjectSchema } from '@vela/core'
import { emitReactProject } from '../../packages/generator/src/emitters/react/emitProject'
import { emitVueProject } from '../../packages/generator/src/emitters/vue3/emitProject'
import type { IRNode, IRPage, IRProject } from '../../packages/generator/src/pipeline/ir/ir'

function createProjectFixture(): IRProject {
  const rawProject: ProjectSchema = {
    id: 'proj_generate',
    version: '2.0.0',
    name: 'Generate Smoke',
    config: {
      target: 'pc',
    },
    logic: {
      actions: [
        {
          id: 'goAbout',
          type: 'navigate',
          payload: {
            path: '/about',
          },
        },
      ],
    },
    pages: [
      {
        id: 'home',
        type: 'page',
        name: 'Home',
        path: '/home',
        actions: [
          {
            id: 'pageToast',
            type: 'showToast',
            payload: {
              message: 'from-page',
            },
          },
        ],
        children: {
          id: 'home_root',
          component: 'Page',
          children: [],
        },
      },
      {
        id: 'about',
        type: 'page',
        name: 'About',
        path: '/about',
        children: {
          id: 'about_root',
          component: 'Page',
          children: [],
        },
      },
      {
        id: 'frag_1',
        type: 'fragment',
        name: 'SharedFragment',
        children: {
          id: 'frag_root',
          component: 'Fragment',
          children: [],
        },
      },
    ],
  }

  const nodeLayout = {
    mode: 'flow' as const,
    childMode: 'flow' as const,
    x: 0,
    y: 0,
    zIndex: 0,
    rotate: 0,
  }

  const ctaNode: IRNode = {
    id: 'cta_btn',
    component: 'button',
    layout: nodeLayout,
    props: {
      text: 'Go',
    },
    events: {
      click: ['nodeToast', 'pageToast', 'goAbout'],
    },
    actions: [
      {
        id: 'nodeToast',
        type: 'showToast',
        payload: {
          message: 'from-node',
        },
      },
    ],
    children: [],
    slots: {},
  }

  const homeRoot: IRNode = {
    id: 'home_root',
    component: 'Page',
    layout: nodeLayout,
    children: [ctaNode],
    slots: {},
  }

  const aboutRoot: IRNode = {
    id: 'about_root',
    component: 'Page',
    layout: nodeLayout,
    children: [],
    slots: {},
  }

  const fragmentRoot: IRNode = {
    id: 'frag_root',
    component: 'Fragment',
    layout: nodeLayout,
    children: [],
    slots: {},
  }

  const pages: IRPage[] = [
    {
      id: 'home',
      type: 'page',
      name: 'Home',
      path: '/home',
      defaultLayoutMode: 'flow',
      raw: rawProject.pages[0],
      root: homeRoot,
    },
    {
      id: 'about',
      type: 'page',
      name: 'About',
      path: '/about',
      defaultLayoutMode: 'flow',
      raw: rawProject.pages[1],
      root: aboutRoot,
    },
    {
      id: 'frag_1',
      type: 'fragment',
      name: 'SharedFragment',
      defaultLayoutMode: 'flow',
      raw: rawProject.pages[2],
      root: fragmentRoot,
    },
  ]

  return {
    id: rawProject.id,
    name: rawProject.name,
    config: rawProject.config,
    pages,
    raw: rawProject,
  }
}

function getFileContent(files: Array<{ path: string; content: string }>, path: string): string {
  const file = files.find((item) => item.path === path)
  if (!file) {
    throw new Error(`Missing generated file: ${path}`)
  }
  return file.content
}

function loadActionExecutorFactory(source: string): (options: Record<string, unknown>) => {
  onNodeEvent: (nodeId: string, eventName: string, event?: unknown) => Promise<void>
  runtimeState: Record<string, unknown>
} {
  const executableSource = source.replace(
    'export function createActionExecutor(options)',
    'function createActionExecutor(options)',
  )

  const factory = new Function(`${executableSource}\nreturn createActionExecutor`)
  return factory() as (options: Record<string, unknown>) => {
    onNodeEvent: (nodeId: string, eventName: string, event?: unknown) => Promise<void>
    runtimeState: Record<string, unknown>
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('generator emitters', () => {
  it('Vue emitter: 按 page 类型生成路由，并接入动作执行器运行时', () => {
    const result = emitVueProject(createProjectFixture(), {
      language: 'ts',
      lint: false,
    })

    const routerSource = getFileContent(result.files, 'src/router/index.ts')
    expect(routerSource).toContain("path: '/home'")
    expect(routerSource).toContain("path: '/about'")
    expect(routerSource).not.toContain('SharedFragment')

    const runtimeSource = getFileContent(result.files, 'src/runtime/actionExecutor.ts')
    expect(runtimeSource).toContain('export function createActionExecutor(options)')

    const homePageSource = getFileContent(result.files, 'src/pages/Home.vue')
    expect(homePageSource).toContain('createActionExecutor')
    expect(homePageSource).toContain('const nodeEvents =')
    expect(homePageSource).toContain('goAbout')
    expect(homePageSource).not.toContain('[GeneratedEvent]')
  })

  it('React emitter: 按 page 类型生成路由，并接入动作执行器运行时', () => {
    const result = emitReactProject(createProjectFixture(), {
      typescript: true,
      cssModules: true,
      router: 'react-router',
      stateManagement: 'zustand',
    })

    const appSource = getFileContent(result.files, 'src/App.tsx')
    expect(appSource).toContain('path="/home"')
    expect(appSource).toContain('path="/about"')
    expect(appSource).not.toContain('SharedFragment')

    const runtimeSource = getFileContent(result.files, 'src/runtime/actionExecutor.ts')
    expect(runtimeSource).toContain('export function createActionExecutor(options)')

    const homePageSource = getFileContent(result.files, 'src/pages/Home.tsx')
    expect(homePageSource).toContain('createActionExecutor')
    expect(homePageSource).toContain('const nodeEvents =')
    expect(homePageSource).toContain('void actionExecutor.onNodeEvent')
    expect(homePageSource).not.toContain('[GeneratedEvent]')
  })

  it('Vue emitter: flow/free 布局映射应保留 LengthValue 单位', () => {
    const project = createProjectFixture()
    const homePage = project.pages.find((page) => page.id === 'home')
    if (!homePage?.root) {
      throw new Error('Missing home root node')
    }

    homePage.root.layout = {
      ...homePage.root.layout,
      mode: 'flow',
      width: '100%',
      height: 'calc(100vh - 48px)',
    }

    const result = emitVueProject(project, {
      language: 'ts',
      lint: false,
    })

    const homePageSource = getFileContent(result.files, 'src/pages/Home.vue')
    expect(homePageSource).toContain('width:100%')
    expect(homePageSource).toContain('height:calc(100vh - 48px)')
    expect(homePageSource).not.toContain('width:100px')
    expect(homePageSource).not.toContain('height:calc(100vh - 48px)px')
  })

  it('Vue actionExecutor: 支持 confirm/throttle/debounce/handlers', async () => {
    const result = emitVueProject(createProjectFixture(), {
      language: 'js',
      lint: false,
    })
    const runtimeSource = getFileContent(result.files, 'src/runtime/actionExecutor.js')
    const createActionExecutor = loadActionExecutorFactory(runtimeSource)

    const executor = createActionExecutor({
      pageId: 'home',
      nodeEvents: {
        node_1: {
          click: ['confirmAction'],
          throttleEvent: ['throttleAction'],
          debounceEvent: ['debounceAction'],
          successEvent: ['handlerAction'],
          failEvent: ['errorAction'],
        },
      },
      nodeActions: {},
      pageActions: [
        {
          id: 'confirmAction',
          type: 'setState',
          payload: {
            path: 'confirmHit',
            value: true,
          },
          confirm: {
            message: 'need-confirm',
          },
        },
        {
          id: 'throttleAction',
          type: 'runScript',
          payload: {
            code: 'context.state.throttleHit = (context.state.throttleHit || 0) + 1',
          },
          throttle: 100,
        },
        {
          id: 'debounceAction',
          type: 'runScript',
          payload: {
            code: 'context.state.debounceHit = (context.state.debounceHit || 0) + 1',
          },
          debounce: 50,
        },
        {
          id: 'handlerAction',
          type: 'setState',
          payload: {
            path: 'successValue',
            value: 1,
          },
          handlers: {
            loading: ['loadingHook'],
            success: ['successHook'],
            complete: ['completeHook'],
          },
        },
        {
          id: 'errorAction',
          type: 'runScript',
          payload: {
            code: "throw new Error('boom')",
          },
          handlers: {
            fail: ['failHook'],
            complete: ['completeHook'],
          },
        },
        {
          id: 'loadingHook',
          type: 'runScript',
          payload: {
            code: 'context.state.loadingHit = (context.state.loadingHit || 0) + 1',
          },
        },
        {
          id: 'successHook',
          type: 'runScript',
          payload: {
            code: 'context.state.successHookHit = (context.state.successHookHit || 0) + 1',
          },
        },
        {
          id: 'failHook',
          type: 'runScript',
          payload: {
            code: 'context.state.failHookHit = (context.state.failHookHit || 0) + 1',
          },
        },
        {
          id: 'completeHook',
          type: 'runScript',
          payload: {
            code: 'context.state.completeHookHit = (context.state.completeHookHit || 0) + 1',
          },
        },
      ],
      projectActions: [],
      projectApis: [],
      router: {
        push: vi.fn(),
        replace: vi.fn(),
      },
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await executor.onNodeEvent('node_1', 'click')
    expect(executor.runtimeState.confirmHit).toBeUndefined()

    await executor.onNodeEvent('node_1', 'throttleEvent')
    await executor.onNodeEvent('node_1', 'throttleEvent')
    expect(executor.runtimeState.throttleHit).toBe(1)

    vi.useFakeTimers()
    const debounceFirst = executor.onNodeEvent('node_1', 'debounceEvent')
    const debounceSecond = executor.onNodeEvent('node_1', 'debounceEvent')
    await vi.advanceTimersByTimeAsync(60)
    await Promise.all([debounceFirst, debounceSecond])
    expect(executor.runtimeState.debounceHit).toBe(1)

    await executor.onNodeEvent('node_1', 'successEvent')
    expect(executor.runtimeState.successValue).toBe(1)
    expect(executor.runtimeState.loadingHit).toBe(1)
    expect(executor.runtimeState.successHookHit).toBe(1)
    expect(executor.runtimeState.completeHookHit).toBe(1)

    await executor.onNodeEvent('node_1', 'failEvent')
    expect(executor.runtimeState.failHookHit).toBe(1)
    expect(executor.runtimeState.completeHookHit).toBe(2)
  })
})
