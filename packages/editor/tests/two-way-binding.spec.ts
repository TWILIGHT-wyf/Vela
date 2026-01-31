/**
 * 画布与属性配置面板双向绑定测试套件
 *
 * 这个测试套件用于验证组件的属性在以下场景中能正确同步：
 * 1. 通过 Store 更新 props/style 时，画布组件能响应更新
 * 2. 通过属性面板修改时，Store 能正确更新
 * 3. styleVersion 机制正常工作
 *
 * 当添加新组件时，只需要在 COMPONENT_TEST_CASES 中添加测试用例即可。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { NodeSchema } from '@vela/core'

// Store
import { useComponent } from '../src/stores/component'

// ==================== 测试配置 ====================

/**
 * 组件测试用例接口
 * 添加新组件时，只需要在 COMPONENT_TEST_CASES 中添加一个测试用例
 */
export interface ComponentTestCase {
  /** 组件名称 */
  componentName: string
  /** 组件显示名称（用于测试描述） */
  displayName: string
  /** 初始 props */
  initialProps: Record<string, unknown>
  /** 要测试的 props 更新 */
  propsUpdates: Array<{
    propName: string
    oldValue: unknown
    newValue: unknown
    description?: string
  }>
  /** 要测试的 style 更新 */
  styleUpdates?: Array<{
    styleName: string
    oldValue: unknown
    newValue: unknown
    description?: string
  }>
}

/**
 * 组件测试用例列表
 *
 * 添加新组件时，在这里添加测试用例
 */
export const COMPONENT_TEST_CASES: ComponentTestCase[] = [
  {
    componentName: 'BaseButton',
    displayName: '按钮',
    initialProps: {
      text: '按钮',
      type: 'primary',
      disabled: false,
    },
    propsUpdates: [
      { propName: 'text', oldValue: '按钮', newValue: '提交', description: '修改按钮文本' },
      { propName: 'type', oldValue: 'primary', newValue: 'danger', description: '修改按钮类型' },
      { propName: 'disabled', oldValue: false, newValue: true, description: '禁用按钮' },
    ],
    styleUpdates: [
      { styleName: 'width', oldValue: 100, newValue: 200, description: '修改宽度' },
      { styleName: 'backgroundColor', oldValue: undefined, newValue: '#ff0000', description: '修改背景色' },
    ],
  },
  {
    componentName: 'Text',
    displayName: '文本',
    initialProps: {
      content: 'Hello World',
      fontSize: 14,
      color: '#333333',
    },
    propsUpdates: [
      { propName: 'content', oldValue: 'Hello World', newValue: '你好世界', description: '修改文本内容' },
      { propName: 'fontSize', oldValue: 14, newValue: 24, description: '修改字体大小' },
      { propName: 'color', oldValue: '#333333', newValue: '#ff0000', description: '修改文字颜色' },
    ],
  },
  {
    componentName: 'KpiCard',
    displayName: 'KPI 卡片',
    initialProps: {
      header: { title: '总收入' },
      content: { value: 1000, prefix: '$' },
    },
    propsUpdates: [
      {
        propName: 'header',
        oldValue: { title: '总收入' },
        newValue: { title: '总支出' },
        description: '修改标题',
      },
      {
        propName: 'content',
        oldValue: { value: 1000, prefix: '$' },
        newValue: { value: 2000, prefix: '¥' },
        description: '修改数值和前缀',
      },
    ],
  },
  {
    componentName: 'Container',
    displayName: '容器',
    initialProps: {},
    propsUpdates: [],
    styleUpdates: [
      { styleName: 'width', oldValue: 200, newValue: 400, description: '修改容器宽度' },
      { styleName: 'height', oldValue: 200, newValue: 300, description: '修改容器高度' },
      { styleName: 'backgroundColor', oldValue: '#ffffff', newValue: '#f0f0f0', description: '修改背景色' },
    ],
  },
]

// ==================== 测试工具函数 ====================

/**
 * 创建测试用的 NodeSchema
 */
function createTestNode(testCase: ComponentTestCase, id = 'test-node-1'): NodeSchema {
  return {
    id,
    componentName: testCase.componentName,
    props: { ...testCase.initialProps },
    style: {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    },
  }
}

/**
 * 创建测试用的根节点（页面容器）
 */
function createTestRootNode(children: NodeSchema[] = []): NodeSchema {
  return {
    id: 'root',
    componentName: 'Container',
    props: {},
    style: {
      width: 1920,
      height: 1080,
    },
    children,
  }
}

/**
 * 初始化测试环境
 */
function setupTestEnvironment() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const componentStore = useComponent()

  return { componentStore, pinia }
}

// ==================== 核心测试套件 ====================

describe('画布与属性面板双向绑定', () => {
  describe('ComponentStore 核心功能', () => {
    let componentStore: ReturnType<typeof useComponent>

    beforeEach(() => {
      const env = setupTestEnvironment()
      componentStore = env.componentStore
    })

    it('应该正确初始化 styleVersion', () => {
      expect(componentStore.styleVersion).toBeDefined()
      expect(typeof componentStore.styleVersion).toBe('object')
    })

    it('updateProps 应该递增 styleVersion', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const initialVersion = componentStore.styleVersion[testNode.id] || 0

      componentStore.updateProps(testNode.id, { text: '新文本' })

      const newVersion = componentStore.styleVersion[testNode.id] || 0
      expect(newVersion).toBe(initialVersion + 1)
    })

    it('updateStyle 应该递增 styleVersion', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const initialVersion = componentStore.styleVersion[testNode.id] || 0

      componentStore.updateStyle(testNode.id, { width: 200 })

      const newVersion = componentStore.styleVersion[testNode.id] || 0
      expect(newVersion).toBe(initialVersion + 1)
    })

    it('updateProps 应该正确更新节点 props', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      componentStore.updateProps(testNode.id, { text: '新文本', type: 'danger' })

      const node = componentStore.findNodeById(null, testNode.id)
      expect(node?.props?.text).toBe('新文本')
      expect(node?.props?.type).toBe('danger')
    })

    it('updateStyle 应该正确更新节点 style', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      componentStore.updateStyle(testNode.id, { width: 200, backgroundColor: '#ff0000' })

      const node = componentStore.findNodeById(null, testNode.id)
      expect(node?.style?.width).toBe(200)
      expect(node?.style?.backgroundColor).toBe('#ff0000')
    })

    it('多次更新应该累积 styleVersion', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const initialVersion = componentStore.styleVersion[testNode.id] || 0

      componentStore.updateProps(testNode.id, { text: '文本1' })
      componentStore.updateProps(testNode.id, { text: '文本2' })
      componentStore.updateStyle(testNode.id, { width: 200 })

      const finalVersion = componentStore.styleVersion[testNode.id] || 0
      expect(finalVersion).toBe(initialVersion + 3)
    })

    it('不同节点的 styleVersion 应该独立', () => {
      const testNode1 = createTestNode(COMPONENT_TEST_CASES[0], 'node-1')
      const testNode2 = createTestNode(COMPONENT_TEST_CASES[0], 'node-2')
      const rootNode = createTestRootNode([testNode1, testNode2])

      componentStore.loadTree(rootNode)

      const initialVersion1 = componentStore.styleVersion['node-1'] || 0
      const initialVersion2 = componentStore.styleVersion['node-2'] || 0

      componentStore.updateProps('node-1', { text: '新文本' })

      expect(componentStore.styleVersion['node-1']).toBe(initialVersion1 + 1)
      expect(componentStore.styleVersion['node-2'] || 0).toBe(initialVersion2)
    })
  })

  describe('响应式工厂方法', () => {
    let componentStore: ReturnType<typeof useComponent>

    beforeEach(() => {
      const env = setupTestEnvironment()
      componentStore = env.componentStore
    })

    it('createPropRef 应该创建可读写的响应式引用', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const textRef = componentStore.createPropRef<string>(testNode.id, 'text', '默认值')

      // 读取
      expect(textRef.value).toBe('按钮')

      // 写入
      textRef.value = '新按钮'

      // 验证 store 已更新
      const node = componentStore.findNodeById(null, testNode.id)
      expect(node?.props?.text).toBe('新按钮')
    })

    it('createStyleRef 应该创建可读写的响应式引用', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const widthRef = componentStore.createStyleRef<number>(testNode.id, 'width', 0)

      // 读取
      expect(widthRef.value).toBe(100)

      // 写入
      widthRef.value = 200

      // 验证 store 已更新
      const node = componentStore.findNodeById(null, testNode.id)
      expect(node?.style?.width).toBe(200)
    })

    it('createPropRefs 应该批量创建响应式引用', () => {
      const testNode = createTestNode(COMPONENT_TEST_CASES[0])
      const rootNode = createTestRootNode([testNode])

      componentStore.loadTree(rootNode)

      const refs = componentStore.createPropRefs(testNode.id, [
        { name: 'text', defaultValue: '' },
        { name: 'type', defaultValue: 'default' },
      ])

      expect(refs.text.value).toBe('按钮')
      expect(refs.type.value).toBe('primary')
    })
  })

  // ==================== 动态组件测试 ====================

  describe.each(COMPONENT_TEST_CASES)('$displayName ($componentName) 双向绑定', (testCase) => {
    let componentStore: ReturnType<typeof useComponent>
    let testNode: NodeSchema

    beforeEach(() => {
      const env = setupTestEnvironment()
      componentStore = env.componentStore

      testNode = createTestNode(testCase)
      const rootNode = createTestRootNode([testNode])
      componentStore.loadTree(rootNode)
    })

    // Props 更新测试
    if (testCase.propsUpdates.length > 0) {
      describe('Props 更新', () => {
        it.each(testCase.propsUpdates)(
          '应该正确更新 $propName: $description',
          ({ propName, newValue }) => {
            const initialVersion = componentStore.styleVersion[testNode.id] || 0

            componentStore.updateProps(testNode.id, { [propName]: newValue })

            // 验证 props 已更新
            const node = componentStore.findNodeById(null, testNode.id)
            expect(node?.props?.[propName]).toEqual(newValue)

            // 验证 styleVersion 已递增
            expect(componentStore.styleVersion[testNode.id]).toBe(initialVersion + 1)
          },
        )
      })
    }

    // Style 更新测试
    if (testCase.styleUpdates && testCase.styleUpdates.length > 0) {
      describe('Style 更新', () => {
        it.each(testCase.styleUpdates!)(
          '应该正确更新 $styleName: $description',
          ({ styleName, newValue }) => {
            const initialVersion = componentStore.styleVersion[testNode.id] || 0

            componentStore.updateStyle(testNode.id, { [styleName]: newValue })

            // 验证 style 已更新
            const node = componentStore.findNodeById(null, testNode.id)
            expect(node?.style?.[styleName as keyof typeof node.style]).toEqual(newValue)

            // 验证 styleVersion 已递增
            expect(componentStore.styleVersion[testNode.id]).toBe(initialVersion + 1)
          },
        )
      })
    }

    it('连续更新多个属性应该正确累积 styleVersion', () => {
      const initialVersion = componentStore.styleVersion[testNode.id] || 0
      let updateCount = 0

      // 更新所有 props
      for (const update of testCase.propsUpdates) {
        componentStore.updateProps(testNode.id, { [update.propName]: update.newValue })
        updateCount++
      }

      // 更新所有 styles
      if (testCase.styleUpdates) {
        for (const update of testCase.styleUpdates) {
          componentStore.updateStyle(testNode.id, { [update.styleName]: update.newValue })
          updateCount++
        }
      }

      expect(componentStore.styleVersion[testNode.id]).toBe(initialVersion + updateCount)
    })
  })
})

// ==================== 导出测试工具 ====================

/**
 * 验证新组件的双向绑定功能
 *
 * 在添加新组件后，可以调用此函数快速验证：
 *
 * @example
 * ```ts
 * import { validateComponentBinding } from './two-way-binding.spec'
 *
 * // 验证新组件
 * validateComponentBinding({
 *   componentName: 'MyNewComponent',
 *   displayName: '我的新组件',
 *   initialProps: { title: '标题' },
 *   propsUpdates: [
 *     { propName: 'title', oldValue: '标题', newValue: '新标题' }
 *   ]
 * })
 * ```
 */
export function validateComponentBinding(testCase: ComponentTestCase): {
  success: boolean
  errors: string[]
} {
  const errors: string[] = []

  try {
    const pinia = createPinia()
    setActivePinia(pinia)

    const componentStore = useComponent()

    const testNode = createTestNode(testCase)
    const rootNode = createTestRootNode([testNode])
    componentStore.loadTree(rootNode)

    // 测试 props 更新
    for (const update of testCase.propsUpdates) {
      const initialVersion = componentStore.styleVersion[testNode.id] || 0

      componentStore.updateProps(testNode.id, { [update.propName]: update.newValue })

      const node = componentStore.findNodeById(null, testNode.id)
      if (node?.props?.[update.propName] !== update.newValue) {
        errors.push(`Props 更新失败: ${update.propName}`)
      }

      if (componentStore.styleVersion[testNode.id] !== initialVersion + 1) {
        errors.push(`styleVersion 未递增: ${update.propName}`)
      }
    }

    // 测试 style 更新
    if (testCase.styleUpdates) {
      for (const update of testCase.styleUpdates) {
        const initialVersion = componentStore.styleVersion[testNode.id] || 0

        componentStore.updateStyle(testNode.id, { [update.styleName]: update.newValue })

        const node = componentStore.findNodeById(null, testNode.id)
        if (node?.style?.[update.styleName as keyof typeof node.style] !== update.newValue) {
          errors.push(`Style 更新失败: ${update.styleName}`)
        }

        if (componentStore.styleVersion[testNode.id] !== initialVersion + 1) {
          errors.push(`styleVersion 未递增: ${update.styleName}`)
        }
      }
    }
  } catch (e) {
    errors.push(`测试执行失败: ${e}`)
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

/**
 * 快速添加新组件测试用例
 *
 * @example
 * ```ts
 * // 在测试文件中添加新组件
 * addComponentTestCase({
 *   componentName: 'MyChart',
 *   displayName: '图表组件',
 *   initialProps: { data: [] },
 *   propsUpdates: [
 *     { propName: 'data', oldValue: [], newValue: [1, 2, 3] }
 *   ]
 * })
 * ```
 */
export function addComponentTestCase(testCase: ComponentTestCase): void {
  COMPONENT_TEST_CASES.push(testCase)
}