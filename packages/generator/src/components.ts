/**
 * JS 表达式容器
 * 用于区分静态值和动态绑定值
 */
export interface JSExpression {
  type: 'JSExpression'
  value: string
}

/**
 * 循环配置 (v-for)
 */
export interface LoopConfig {
  /** 数据源 (数组或 JSExpression) */
  data: unknown[] | JSExpression
  /** 迭代项变量名 (默认 'item') */
  itemArg?: string
  /** 索引变量名 (默认 'index') */
  indexArg?: string
}

/**
 * 插槽配置
 */
export interface SlotConfig {
  /** 插槽名称 (默认 'default') */
  name: string
  /** 作用域插槽参数 */
  slotProps?: string[]
  /** 插槽内容组件 */
  children?: Component[]
}

/**
 * Component type for code generation
 * This is the runtime representation with position/size
 * for generating Vue code from the editor's component store
 */
export interface Component {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation?: number
  zindex?: number
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  events?: {
    click?: ActionConfig[]
    hover?: ActionConfig[]
    doubleClick?: ActionConfig[]
    [key: string]: ActionConfig[] | undefined
  }
  groupId?: string
  animation?: {
    class?: string
    trigger?: 'load' | 'hover' | 'click'
    duration?: number
    delay?: number
    iterationCount?: number | string
    timingFunction?: string
  }
  dataBindings?: DataBinding[]
  dataSource?: DataSourceConfig

  // === 新增：动态指令支持 ===
  /** 条件渲染 (v-if) */
  condition?: boolean | string | JSExpression
  /** 显示/隐藏 (v-show) */
  visible?: boolean | string | JSExpression
  /** 循环渲染 (v-for) */
  loop?: LoopConfig
  /** 插槽名称 (属于父组件的哪个插槽) */
  slotName?: string
  /** 作用域插槽参数名 */
  slotScope?: string
  /** 命名插槽配置 */
  slots?: SlotConfig[]
}

export interface ActionConfig {
  id: string
  type: string
  targetId?: string
  delay?: number
  [key: string]: unknown
}

export interface DataBinding {
  sourceId: string
  sourcePath: string
  targetPath: string
  transformer?: {
    type: 'expression' | 'template'
    expression?: string
    template?: string
  }
}

export interface DataSourceConfig {
  enabled?: boolean
  type?: 'api' | 'static'
  url?: string
  method?: string
  interval?: number
  data?: unknown
}
