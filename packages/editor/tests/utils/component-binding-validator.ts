/**
 * 组件双向绑定验证工具
 *
 * 用于验证新组件是否正确支持画布与属性面板的双向绑定。
 *
 * @example
 * ```ts
 * import { ComponentBindingValidator } from './utils/component-binding-validator'
 *
 * const validator = new ComponentBindingValidator()
 *
 * // 验证单个组件
 * const result = validator.validate({
 *   componentName: 'MyButton',
 *   initialProps: { text: '按钮' },
 *   propsToTest: ['text', 'type', 'disabled']
 * })
 *
 * if (!result.success) {
 *   console.error('验证失败:', result.errors)
 * }
 * ```
 */

import { createPinia, setActivePinia } from 'pinia'
import type { NodeSchema } from '@vela/core'

// 动态导入以支持在非测试环境中使用
let useComponent: () => ReturnType<typeof import('../src/stores/component').useComponent>

/**
 * 验证配置
 */
export interface ValidatorConfig {
  /** 组件名称 */
  componentName: string
  /** 初始 props */
  initialProps?: Record<string, unknown>
  /** 初始 style */
  initialStyle?: Record<string, unknown>
  /** 要测试的 props 列表 */
  propsToTest?: string[]
  /** 要测试的 style 列表 */
  stylesToTest?: string[]
  /** 自定义 props 测试值 */
  propsTestValues?: Record<string, { oldValue: unknown; newValue: unknown }>
  /** 自定义 style 测试值 */
  styleTestValues?: Record<string, { oldValue: unknown; newValue: unknown }>
}

/**
 * 验证结果
 */
export interface ValidatorResult {
  /** 是否全部通过 */
  success: boolean
  /** 组件名称 */
  componentName: string
  /** 通过的测试项 */
  passed: string[]
  /** 失败的测试项及原因 */
  errors: Array<{ test: string; reason: string }>
  /** 详细测试报告 */
  report: string
}

/**
 * 默认测试值映射
 */
const DEFAULT_TEST_VALUES: Record<string, { oldValue: unknown; newValue: unknown }> = {
  // 字符串类型
  text: { oldValue: '默认文本', newValue: '新文本' },
  title: { oldValue: '默认标题', newValue: '新标题' },
  content: { oldValue: '默认内容', newValue: '新内容' },
  placeholder: { oldValue: '', newValue: '请输入...' },
  label: { oldValue: '标签', newValue: '新标签' },

  // 数值类型
  width: { oldValue: 100, newValue: 200 },
  height: { oldValue: 100, newValue: 150 },
  fontSize: { oldValue: 14, newValue: 18 },
  value: { oldValue: 0, newValue: 100 },
  min: { oldValue: 0, newValue: 10 },
  max: { oldValue: 100, newValue: 200 },

  // 布尔类型
  disabled: { oldValue: false, newValue: true },
  loading: { oldValue: false, newValue: true },
  visible: { oldValue: true, newValue: false },
  readonly: { oldValue: false, newValue: true },

  // 颜色类型
  color: { oldValue: '#333333', newValue: '#ff0000' },
  backgroundColor: { oldValue: '#ffffff', newValue: '#f0f0f0' },
  borderColor: { oldValue: '#dddddd', newValue: '#000000' },

  // 选择类型
  type: { oldValue: 'default', newValue: 'primary' },
  size: { oldValue: 'default', newValue: 'large' },
  align: { oldValue: 'left', newValue: 'center' },

  // 位置类型
  x: { oldValue: 0, newValue: 100 },
  y: { oldValue: 0, newValue: 100 },
  zIndex: { oldValue: 0, newValue: 10 },
}

/**
 * 组件双向绑定验证器
 */
export class ComponentBindingValidator {
  private pinia: ReturnType<typeof createPinia> | null = null
  private componentStore: ReturnType<typeof useComponent> | null = null

  /**
   * 初始化验证器
   */
  async init(): Promise<void> {
    // 动态导入 store
    const storeModule = await import('../src/stores/component')
    useComponent = storeModule.useComponent

    this.pinia = createPinia()
    setActivePinia(this.pinia)
    this.componentStore = useComponent()
  }

  /**
   * 验证组件的双向绑定功能
   */
  async validate(config: ValidatorConfig): Promise<ValidatorResult> {
    if (!this.componentStore) {
      await this.init()
    }

    const result: ValidatorResult = {
      success: true,
      componentName: config.componentName,
      passed: [],
      errors: [],
      report: '',
    }

    const store = this.componentStore!

    // 创建测试节点
    const testNode: NodeSchema = {
      id: `test-${config.componentName}-${Date.now()}`,
      componentName: config.componentName,
      props: { ...config.initialProps },
      style: {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        ...config.initialStyle,
      },
    }

    const rootNode: NodeSchema = {
      id: 'root',
      componentName: 'Container',
      props: {},
      style: { width: 1920, height: 1080 },
      children: [testNode],
    }

    // 加载测试树
    store.loadTree(rootNode)

    // 测试 props 更新
    if (config.propsToTest && config.propsToTest.length > 0) {
      for (const propName of config.propsToTest) {
        const testValue = config.propsTestValues?.[propName] || DEFAULT_TEST_VALUES[propName]

        if (!testValue) {
          result.errors.push({
            test: `props.${propName}`,
            reason: `没有找到测试值，请在 propsTestValues 中提供`,
          })
          continue
        }

        const testResult = this.testPropUpdate(store, testNode.id, propName, testValue.newValue)
        if (testResult.success) {
          result.passed.push(`props.${propName}`)
        } else {
          result.errors.push({ test: `props.${propName}`, reason: testResult.reason })
        }
      }
    }

    // 测试 style 更新
    if (config.stylesToTest && config.stylesToTest.length > 0) {
      for (const styleName of config.stylesToTest) {
        const testValue = config.styleTestValues?.[styleName] || DEFAULT_TEST_VALUES[styleName]

        if (!testValue) {
          result.errors.push({
            test: `style.${styleName}`,
            reason: `没有找到测试值，请在 styleTestValues 中提供`,
          })
          continue
        }

        const testResult = this.testStyleUpdate(store, testNode.id, styleName, testValue.newValue)
        if (testResult.success) {
          result.passed.push(`style.${styleName}`)
        } else {
          result.errors.push({ test: `style.${styleName}`, reason: testResult.reason })
        }
      }
    }

    // 测试 createPropRef
    const refTestResult = this.testCreatePropRef(store, testNode.id)
    if (refTestResult.success) {
      result.passed.push('createPropRef')
    } else {
      result.errors.push({ test: 'createPropRef', reason: refTestResult.reason })
    }

    // 测试 createStyleRef
    const styleRefTestResult = this.testCreateStyleRef(store, testNode.id)
    if (styleRefTestResult.success) {
      result.passed.push('createStyleRef')
    } else {
      result.errors.push({ test: 'createStyleRef', reason: styleRefTestResult.reason })
    }

    // 生成报告
    result.success = result.errors.length === 0
    result.report = this.generateReport(result)

    return result
  }

  /**
   * 测试 props 更新
   */
  private testPropUpdate(
    store: ReturnType<typeof useComponent>,
    nodeId: string,
    propName: string,
    newValue: unknown,
  ): { success: boolean; reason: string } {
    try {
      const initialVersion = store.styleVersion[nodeId] || 0

      store.updateProps(nodeId, { [propName]: newValue })

      const node = store.findNodeById(null, nodeId)

      // 检查 props 是否更新
      if (node?.props?.[propName] !== newValue) {
        return {
          success: false,
          reason: `props 更新失败: 期望 ${JSON.stringify(newValue)}, 实际 ${JSON.stringify(node?.props?.[propName])}`,
        }
      }

      // 检查 styleVersion 是否递增
      const newVersion = store.styleVersion[nodeId] || 0
      if (newVersion !== initialVersion + 1) {
        return {
          success: false,
          reason: `styleVersion 未递增: 期望 ${initialVersion + 1}, 实际 ${newVersion}`,
        }
      }

      return { success: true, reason: '' }
    } catch (e) {
      return { success: false, reason: `异常: ${e}` }
    }
  }

  /**
   * 测试 style 更新
   */
  private testStyleUpdate(
    store: ReturnType<typeof useComponent>,
    nodeId: string,
    styleName: string,
    newValue: unknown,
  ): { success: boolean; reason: string } {
    try {
      const initialVersion = store.styleVersion[nodeId] || 0

      store.updateStyle(nodeId, { [styleName]: newValue })

      const node = store.findNodeById(null, nodeId)

      // 检查 style 是否更新
      const actualValue = node?.style?.[styleName as keyof typeof node.style]
      if (actualValue !== newValue) {
        return {
          success: false,
          reason: `style 更新失败: 期望 ${JSON.stringify(newValue)}, 实际 ${JSON.stringify(actualValue)}`,
        }
      }

      // 检查 styleVersion 是否递增
      const newVersion = store.styleVersion[nodeId] || 0
      if (newVersion !== initialVersion + 1) {
        return {
          success: false,
          reason: `styleVersion 未递增: 期望 ${initialVersion + 1}, 实际 ${newVersion}`,
        }
      }

      return { success: true, reason: '' }
    } catch (e) {
      return { success: false, reason: `异常: ${e}` }
    }
  }

  /**
   * 测试 createPropRef
   */
  private testCreatePropRef(
    store: ReturnType<typeof useComponent>,
    nodeId: string,
  ): { success: boolean; reason: string } {
    try {
      const testPropName = '__test_prop__'
      const testValue = 'test_value'

      const propRef = store.createPropRef<string>(nodeId, testPropName, '')

      // 测试写入
      propRef.value = testValue

      // 测试读取
      const node = store.findNodeById(null, nodeId)
      if (node?.props?.[testPropName] !== testValue) {
        return {
          success: false,
          reason: `createPropRef 写入失败`,
        }
      }

      if (propRef.value !== testValue) {
        return {
          success: false,
          reason: `createPropRef 读取失败`,
        }
      }

      return { success: true, reason: '' }
    } catch (e) {
      return { success: false, reason: `异常: ${e}` }
    }
  }

  /**
   * 测试 createStyleRef
   */
  private testCreateStyleRef(
    store: ReturnType<typeof useComponent>,
    nodeId: string,
  ): { success: boolean; reason: string } {
    try {
      const testStyleName = 'opacity'
      const testValue = '0.5'

      const styleRef = store.createStyleRef<string>(nodeId, testStyleName, '1')

      // 测试写入
      styleRef.value = testValue

      // 测试读取
      const node = store.findNodeById(null, nodeId)
      if (node?.style?.opacity !== testValue) {
        return {
          success: false,
          reason: `createStyleRef 写入失败`,
        }
      }

      if (styleRef.value !== testValue) {
        return {
          success: false,
          reason: `createStyleRef 读取失败`,
        }
      }

      return { success: true, reason: '' }
    } catch (e) {
      return { success: false, reason: `异常: ${e}` }
    }
  }

  /**
   * 生成测试报告
   */
  private generateReport(result: ValidatorResult): string {
    const lines: string[] = [
      ``,
      `========================================`,
      `  组件双向绑定验证报告`,
      `========================================`,
      ``,
      `组件名称: ${result.componentName}`,
      `验证结果: ${result.success ? '✅ 全部通过' : '❌ 存在失败'}`,
      ``,
      `通过项 (${result.passed.length}):`,
    ]

    for (const item of result.passed) {
      lines.push(`  ✓ ${item}`)
    }

    if (result.errors.length > 0) {
      lines.push(``)
      lines.push(`失败项 (${result.errors.length}):`)
      for (const error of result.errors) {
        lines.push(`  ✗ ${error.test}`)
        lines.push(`    原因: ${error.reason}`)
      }
    }

    lines.push(``)
    lines.push(`========================================`)
    lines.push(``)

    return lines.join('\n')
  }

  /**
   * 批量验证多个组件
   */
  async validateAll(configs: ValidatorConfig[]): Promise<ValidatorResult[]> {
    const results: ValidatorResult[] = []

    for (const config of configs) {
      // 每个组件使用新的 pinia 实例
      this.pinia = createPinia()
      setActivePinia(this.pinia)
      this.componentStore = useComponent()

      const result = await this.validate(config)
      results.push(result)
    }

    return results
  }

  /**
   * 打印验证报告到控制台
   */
  printReport(result: ValidatorResult): void {
    console.log(result.report)
  }
}

/**
 * 快速验证函数
 *
 * @example
 * ```ts
 * const result = await quickValidate('MyButton', {
 *   text: '按钮',
 *   type: 'primary'
 * }, ['text', 'type', 'disabled'])
 *
 * console.log(result.report)
 * ```
 */
export async function quickValidate(
  componentName: string,
  initialProps: Record<string, unknown>,
  propsToTest: string[],
  stylesToTest: string[] = ['width', 'height', 'backgroundColor'],
): Promise<ValidatorResult> {
  const validator = new ComponentBindingValidator()
  return validator.validate({
    componentName,
    initialProps,
    propsToTest,
    stylesToTest,
  })
}

export default ComponentBindingValidator