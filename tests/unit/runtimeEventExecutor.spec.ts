import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { NodeSchema } from '@vela/core'
import type { Router } from 'vue-router'
import { useEventExecutor } from '../../packages/renderer/src/runtime/useEventExecutor'

interface ExecutorHarness {
  handleComponentEvent: (payload: {
    componentId: string
    eventType: string
    actions: unknown[]
    event?: Event
  }) => Promise<void>
  runtimeState: Record<string, unknown>
}

function createNode(actions: unknown[]): NodeSchema {
  return {
    id: 'node_1',
    component: 'Text',
    children: [],
    actions,
  } as unknown as NodeSchema
}

function mountExecutorHarness(nodeActions: unknown[]) {
  const componentsRef: Ref<NodeSchema[]> = ref([createNode(nodeActions)])
  const pagesRef = ref([])
  const isProjectMode = ref(false)
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: ref({ query: {} }),
  } as unknown as Router

  const Harness = defineComponent({
    setup(_props, { expose }) {
      const executor = useEventExecutor({
        components: componentsRef,
        pages: pagesRef,
        isProjectMode,
        router,
      })
      expose(executor)
      return () => h('div')
    },
  })

  const wrapper = mount(Harness)
  return {
    wrapper,
    router,
    executor: wrapper.vm as unknown as ExecutorHarness,
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('runtime useEventExecutor parity', () => {
  it('supports condition + confirm guards', async () => {
    const { wrapper, executor } = mountExecutorHarness([
      {
        id: 'skipByCondition',
        type: 'setState',
        path: 'conditionHit',
        value: true,
        condition: false,
      },
      {
        id: 'skipByConfirm',
        type: 'setState',
        path: 'confirmHit',
        value: true,
        confirm: {
          message: 'need-confirm',
        },
      },
      {
        id: 'confirmPass',
        type: 'setState',
        path: 'confirmPass',
        value: true,
        confirm: {
          message: 'need-confirm',
        },
      },
    ])

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['skipByCondition', 'skipByConfirm'],
    })
    expect(executor.runtimeState.conditionHit).toBeUndefined()
    expect(executor.runtimeState.confirmHit).toBeUndefined()

    confirmSpy.mockReturnValue(true)
    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['confirmPass'],
    })
    expect(executor.runtimeState.confirmPass).toBe(true)
    wrapper.unmount()
  })

  it('supports throttle + debounce controls', async () => {
    vi.useFakeTimers()
    const { wrapper, executor } = mountExecutorHarness([
      {
        id: 'throttleAction',
        type: 'runScript',
        payload: {
          code: 'state.throttleHit = (state.throttleHit || 0) + 1',
        },
        throttle: 100,
      },
      {
        id: 'debounceAction',
        type: 'runScript',
        payload: {
          code: 'state.debounceHit = (state.debounceHit || 0) + 1',
        },
        debounce: 50,
      },
    ])

    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['throttleAction'],
    })
    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['throttleAction'],
    })
    expect(executor.runtimeState.throttleHit).toBe(1)

    const debounceFirst = executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'input',
      actions: ['debounceAction'],
    })
    const debounceSecond = executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'input',
      actions: ['debounceAction'],
    })
    await vi.advanceTimersByTimeAsync(60)
    await Promise.all([debounceFirst, debounceSecond])
    expect(executor.runtimeState.debounceHit).toBe(1)
    wrapper.unmount()
  })

  it('supports loading/success/fail/complete handlers', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { wrapper, executor } = mountExecutorHarness([
      {
        id: 'successAction',
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
        id: 'failAction',
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
          code: 'state.loadingHit = (state.loadingHit || 0) + 1',
        },
      },
      {
        id: 'successHook',
        type: 'runScript',
        payload: {
          code: 'state.successHit = (state.successHit || 0) + 1',
        },
      },
      {
        id: 'failHook',
        type: 'runScript',
        payload: {
          code: 'state.failHit = (state.failHit || 0) + 1',
        },
      },
      {
        id: 'completeHook',
        type: 'runScript',
        payload: {
          code: 'state.completeHit = (state.completeHit || 0) + 1',
        },
      },
    ])

    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['successAction'],
    })
    expect(executor.runtimeState.successValue).toBe(1)
    expect(executor.runtimeState.loadingHit).toBe(1)
    expect(executor.runtimeState.successHit).toBe(1)
    expect(executor.runtimeState.completeHit).toBe(1)

    await executor.handleComponentEvent({
      componentId: 'node_1',
      eventType: 'click',
      actions: ['failAction'],
    })
    expect(executor.runtimeState.failHit).toBe(1)
    expect(executor.runtimeState.completeHit).toBe(2)
    expect(errorSpy).toHaveBeenCalled()
    wrapper.unmount()
  })
})
