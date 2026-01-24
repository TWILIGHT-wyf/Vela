import { NodeSchema } from './schema'
import { ComponentImportSpec } from './material'

export type PropGenType =
  | 'literal' // 直接值: visible="true"
  | 'expression' // 绑定: :visible="state.isShow"
  | 'function' // 事件: @click="handleClick"
  | 'slot' // 插槽: <template #header>...</template>

/**
 * 代码生成时的属性覆盖配置
 * 有些属性在编辑器里是配置项，生成代码时可能需要特殊处理
 */
export interface CodeGenPropConfig {
  /**
   * 强制转换类型
   * 例如：schema 里是字符串，但生成代码时必须去掉引号作为变量使用
   */
  forceType?: PropGenType

  /**
   * 属性重命名
   * 编辑器里叫 'text'，代码里组件属性叫 'modelValue'
   */
  mappingName?: string

  /**
   * 是否忽略该属性
   * 例如 'x', 'y' 在流式布局生成代码时应该被忽略
   */
  ignore?: boolean
}

/**
 * 一个页面的抽象代码结构 (Intermediate Representation)
 */
export interface PageCodeStructure {
  // 1. 导入部分
  imports: ComponentImportSpec[]

  // 2. 状态定义 (对应 const state = reactive({...}))
  state: Record<string, any>

  // 3. 计算属性 (对应 const double = computed(...))
  computed: Record<string, string> // key: code body

  // 4. 方法定义 (对应 function handleClick() {...})
  methods: {
    name: string
    params: string[]
    body: string // 函数体代码
    isAsync?: boolean
  }[]

  // 5. 生命周期钩子
  hooks: {
    onMounted?: string[]
    onUnmounted?: string[]
  }

  // 6. 模板根节点 (指向转换后的 Template AST)
  templateRoot: NodeSchema
}
