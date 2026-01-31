/**
 * IR (Intermediate Representation) - 框架无关的中间表示
 * 用于在 Schema 和目标框架代码之间进行转换
 */

// ============================================================
// 基础类型
// ============================================================

/**
 * 框架无关的 CSS 样式类型
 * 使用 Record 类型避免依赖任何框架
 */
export type CSSStyleProperties = Record<string, string | number | undefined>

/**
 * JS 表达式
 */
export interface IRExpression {
  type: 'expression'
  value: string
}

/**
 * 静态值或动态表达式
 */
export type IRValue = string | number | boolean | null | undefined | IRExpression

// ============================================================
// 属性 (Props)
// ============================================================

/**
 * 组件属性
 */
export interface IRProp {
  /** 属性名 */
  name: string
  /** 属性值 */
  value: unknown
  /** 是否动态绑定 (Vue: :prop, React: {expr}) */
  isDynamic: boolean
  /** 动态表达式 (当 isDynamic=true 时使用) */
  expression?: string
}

// ============================================================
// 指令 (Directives)
// ============================================================

/**
 * 指令类型
 */
export type IRDirectiveType = 'if' | 'else-if' | 'else' | 'show' | 'for' | 'model' | 'custom'

/**
 * 条件指令 (v-if / v-else-if / v-else)
 */
export interface IRConditionDirective {
  type: 'if' | 'else-if' | 'else'
  condition?: string // v-else 不需要条件
}

/**
 * 显示指令 (v-show)
 */
export interface IRShowDirective {
  type: 'show'
  condition: string
}

/**
 * 循环指令 (v-for)
 */
export interface IRForDirective {
  type: 'for'
  /** 数据源表达式 */
  iterable: string
  /** 迭代项变量名 */
  itemName: string
  /** 索引变量名 */
  indexName: string
  /** key 表达式 */
  keyExpr?: string
}

/**
 * 双向绑定指令 (v-model)
 */
export interface IRModelDirective {
  type: 'model'
  /** 绑定的数据路径 */
  value: string
  /** 修饰符 (.lazy, .number, .trim) */
  modifiers?: string[]
}

/**
 * 自定义指令
 */
export interface IRCustomDirective {
  type: 'custom'
  /** 指令名 (不含 v- 前缀) */
  name: string
  /** 指令值 */
  value?: string
  /** 参数 (v-directive:arg) */
  arg?: string
  /** 修饰符 */
  modifiers?: string[]
}

export type IRDirective =
  | IRConditionDirective
  | IRShowDirective
  | IRForDirective
  | IRModelDirective
  | IRCustomDirective

// ============================================================
// 事件 (Events)
// ============================================================

/**
 * 事件修饰符
 */
export type IREventModifier =
  | 'stop'
  | 'prevent'
  | 'capture'
  | 'self'
  | 'once'
  | 'passive'

/**
 * 事件绑定
 */
export interface IREvent {
  /** 事件名 (click, mouseenter, etc.) */
  name: string
  /** 处理函数名或表达式 */
  handler: string
  /** 修饰符 */
  modifiers?: IREventModifier[]
  /** 是否是内联表达式 (而非函数引用) */
  isInline?: boolean
}

// ============================================================
// 插槽 (Slots)
// ============================================================

/**
 * 插槽定义
 */
export interface IRSlot {
  /** 插槽名 (default, header, footer, etc.) */
  name: string
  /** 作用域插槽参数 */
  slotProps?: string[]
  /** 插槽内容 */
  children: IRNode[]
}

// ============================================================
// 节点 (Node)
// ============================================================

/**
 * IR 节点 - 框架无关的组件描述
 */
export interface IRNode {
  /** 节点 ID */
  id: string
  /** 组件类型 (Text, Button, Container, etc.) */
  type: string
  /** 是否是原生 HTML 元素 */
  isNative?: boolean
  /** 属性列表 */
  props: IRProp[]
  /** 子节点 */
  children: IRNode[]
  /** 指令列表 */
  directives: IRDirective[]
  /** 事件列表 */
  events: IREvent[]
  /** 插槽列表 */
  slots: IRSlot[]
  /** 内联样式 */
  style: CSSStyleProperties
  /** CSS 类名 */
  classes: string[]
  /** 文本内容 (用于纯文本节点) */
  textContent?: string
  /** 原始 Schema 引用 (用于调试) */
  _raw?: unknown
}

// ============================================================
// 脚本 (Script)
// ============================================================

/**
 * 导入声明
 */
export interface IRImport {
  /** 导入的标识符 */
  specifiers: Array<{
    type: 'default' | 'named' | 'namespace'
    imported: string // 原始名称
    local: string // 本地名称
  }>
  /** 模块路径 */
  source: string
}

/**
 * 变量声明
 */
export interface IRVariable {
  /** 变量名 */
  name: string
  /** 声明类型 (const, let, var) */
  kind: 'const' | 'let' | 'var'
  /** 初始值表达式 */
  init?: string
  /** 类型注解 (TypeScript) */
  typeAnnotation?: string
}

/**
 * 函数声明
 */
export interface IRFunction {
  /** 函数名 */
  name: string
  /** 参数列表 */
  params: Array<{
    name: string
    type?: string
    defaultValue?: string
  }>
  /** 函数体 (代码字符串) */
  body: string
  /** 返回类型 */
  returnType?: string
  /** 是否异步 */
  async?: boolean
}

/**
 * 生命周期钩子
 */
export interface IRLifecycleHook {
  /** 钩子名称 (onMounted, useEffect, etc.) */
  name: string
  /** 回调函数体 */
  body: string
  /** 依赖数组 (React useEffect) */
  deps?: string[]
}

/**
 * 脚本上下文
 */
export interface IRScriptContext {
  /** 导入声明 */
  imports: IRImport[]
  /** 变量声明 */
  variables: IRVariable[]
  /** 函数声明 */
  functions: IRFunction[]
  /** 生命周期钩子 */
  lifecycles: IRLifecycleHook[]
  /** 响应式状态 (Vue: ref/reactive, React: useState) */
  reactiveState: Array<{
    name: string
    initialValue: unknown
    type: 'ref' | 'reactive' | 'state' // Vue ref, Vue reactive, React useState
  }>
  /** 计算属性 (Vue: computed, React: useMemo) */
  computedProps: Array<{
    name: string
    getter: string
    deps?: string[] // React useMemo 依赖
  }>
  /** 监听器 (Vue: watch, React: useEffect) */
  watchers: Array<{
    sources: string[] // 监听源
    callback: string // 回调函数体
    options?: {
      immediate?: boolean
      deep?: boolean
    }
  }>
}

// ============================================================
// 样式 (Style)
// ============================================================

/**
 * 样式规则
 */
export interface IRStyleRule {
  /** 选择器 */
  selector: string
  /** 样式声明 */
  declarations: Record<string, string>
}

/**
 * 关键帧动画
 */
export interface IRKeyframes {
  /** 动画名称 */
  name: string
  /** 关键帧列表 */
  frames: Array<{
    selector: string // 0%, 50%, 100%, from, to
    declarations: Record<string, string>
  }>
}

/**
 * 样式上下文
 */
export interface IRStyleContext {
  /** 是否使用 scoped */
  scoped: boolean
  /** 预处理器 (css, scss, less) */
  lang?: 'css' | 'scss' | 'less'
  /** 样式规则 */
  rules: IRStyleRule[]
  /** 关键帧动画 */
  keyframes: IRKeyframes[]
  /** 全局样式 */
  global?: IRStyleRule[]
}

// ============================================================
// 组件定义 (Component)
// ============================================================

/**
 * IR 组件定义 - 一个完整的组件文件
 */
export interface IRComponent {
  /** 组件名称 */
  name: string
  /** 模板/渲染函数中的节点树 */
  template: IRNode[]
  /** 脚本上下文 */
  script: IRScriptContext
  /** 样式上下文 */
  style: IRStyleContext
  /** 组件 props 定义 */
  propsDefinition?: Array<{
    name: string
    type: string
    required?: boolean
    default?: unknown
  }>
  /** 组件 emits 定义 */
  emitsDefinition?: string[]
}

// ============================================================
// 页面和项目
// ============================================================

/**
 * IR 页面定义
 */
export interface IRPage {
  /** 页面 ID */
  id: string
  /** 页面名称 */
  name: string
  /** 路由路径 */
  route: string
  /** 组件定义 */
  component: IRComponent
}

/**
 * IR 项目定义
 */
export interface IRProject {
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 页面列表 */
  pages: IRPage[]
  /** 全局配置 */
  config?: {
    /** 目标框架 */
    framework: 'vue3' | 'react' | 'svelte'
    /** 是否使用 TypeScript */
    typescript: boolean
    /** UI 组件库 */
    uiLibrary?: string
    /** 路由模式 */
    routerMode?: 'hash' | 'history'
  }
}
