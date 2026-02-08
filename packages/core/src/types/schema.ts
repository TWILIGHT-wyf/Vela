import type { PropValue, ValueOrExpression } from './expression'
import {
  extractActionIds,
  validateActionLinkRef,
  type ActionLinkRef,
  type ActionRefValidationIssue,
  type AnyActionSchema,
} from './action'
import type { VariableSchema } from './data'
import type { LayoutMode, NodeContainerLayout, NodeGeometry } from './layout'

// 重新导出 Expression 类型
export type { Expression, ValueOrExpression } from './expression'

// ============================================================================
// 渲染控制
// ============================================================================

/**
 * 列表渲染配置
 * 框架无关的循环渲染描述
 *
 * @example
 * // 表达式数据源
 * { source: { type: 'expression', value: 'state.users' }, itemAlias: 'user', indexAlias: 'i' }
 *
 * // 静态数组
 * { source: ['A', 'B', 'C'], itemAlias: 'item' }
 *
 * // → Vue: v-for="(user, i) in state.users"
 * // → React: state.users.map((user, i) => ...)
 */
export interface RepeatConfig {
  /** 数据源 (表达式或静态数组) */
  source: ValueOrExpression<unknown[]>
  /** 唯一键字段 (用于优化渲染) */
  itemKey?: string
  /** 迭代项变量名，默认 'item' */
  itemAlias?: string
  /** 索引变量名，默认 'index' */
  indexAlias?: string
}

// ============================================================================
// 动画配置
// ============================================================================

/**
 * 动画触发方式
 */
export type AnimationTrigger = 'init' | 'hover' | 'click' | 'visible'

/**
 * 动画配置
 */
export interface AnimationConfig {
  /** 动画名称 (CSS animation-name 或预设名) */
  name: string
  /** CSS 类名 */
  className?: string
  /** 持续时间 (ms) */
  duration?: number
  /** 延迟时间 (ms) */
  delay?: number
  /** 迭代次数 ('infinite' 或数字) */
  iterations?: number | 'infinite'
  /** 缓动函数 */
  easing?: string
  /** 触发方式 */
  trigger?: AnimationTrigger
}

// ============================================================================
// 节点样式 (框架无关，纯 CSS)
// ============================================================================

/**
 * 节点样式
 * 框架无关的 CSS 样式描述
 * 注：编辑器中的坐标/旋转/锁定等信息统一放在 geometry 字段
 */
export interface NodeStyle {
  // === 尺寸 ===
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string

  // === CSS 定位 ===
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number

  // === 变换 ===
  transform?: string
  transformOrigin?: string

  // === 布局 (Flex) ===
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around'
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string

  // === 布局 (Flex Item) ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | string
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  order?: number

  // === 布局 (Grid) ===
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridColumn?: string
  gridRow?: string

  // === 间距 ===
  margin?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  padding?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string

  // === 视觉 ===
  color?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  opacity?: number
  visibility?: 'visible' | 'hidden'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'

  // === 边框 ===
  border?: string
  borderWidth?: number | string
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'
  borderColor?: string
  borderRadius?: number | string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string

  // === 阴影 ===
  boxShadow?: string
  textShadow?: string

  // === 文字 ===
  fontSize?: number | string
  fontWeight?: number | string
  fontFamily?: string
  fontStyle?: 'normal' | 'italic' | 'oblique'
  lineHeight?: number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  letterSpacing?: number | string
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word'

  // === 交互 ===
  cursor?: string
  pointerEvents?: 'auto' | 'none'
  userSelect?: 'auto' | 'none' | 'text' | 'all'

  // === 过渡 ===
  transition?: string

  // === 扩展 ===
  [key: string]: unknown
}

// ============================================================================
// 节点协议 (框架无关)
// ============================================================================

/**
 * 事件动作项
 * - AnyActionSchema: 事件中直接声明动作
 * - ActionLinkRef: 引用已注册动作 (global/page/node)
 */
export type NodeEventAction = AnyActionSchema | ActionLinkRef

/**
 * 判断节点事件动作项是否为动作引用
 */
export function isNodeEventActionLinkRef(action: NodeEventAction): action is ActionLinkRef {
  if (typeof action === 'string') {
    return true
  }
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    action.type === 'ref'
  )
}

/**
 * 节点动作引用校验错误
 */
export interface NodeActionRefValidationIssue extends ActionRefValidationIssue {
  nodeId: string
  eventName: string
  actionIndex: number
}

/**
 * 节点动作引用校验上下文
 */
export interface NodeActionRefValidationContext {
  globalActionIds?: Iterable<string>
  pageActionIds?: Iterable<string>
}

/**
 * 节点协议 - 框架无关的组件实例描述
 *
 * 设计原则：
 * 1. 框架无关：不使用 Vue/React 特有术语
 * 2. 声明式：描述"是什么"而非"怎么做"
 * 3. 可转换：能被 Generator 转换为任意框架代码
 *
 * @example
 * // 一个按钮组件
 * {
 *   id: 'btn_1',
 *   component: 'Button',
 *   props: {
 *     label: { $expr: 'state.buttonText' },
 *     disabled: false
 *   },
 *   renderIf: { $expr: 'state.showButton' },
 *   events: {
 *     click: [{ type: 'updateState', payload: { count: { $expr: 'state.count + 1' } } }]
 *   }
 * }
 */
export interface NodeSchema<P = Record<string, PropValue>> {
  /** 节点唯一标识 */
  id: string

  /**
   * 组件标识
   * 映射到物料注册表中的组件
   */
  component?: string

  /**
   * 兼容旧字段
   * @deprecated Use component instead
   */
  componentName?: string

  /** 节点显示名称 (编辑器中显示) */
  title?: string

  // ========== 属性 ==========
  /**
   * 组件属性
   * 支持字面量或表达式绑定
   */
  props?: P

  /**
   * 组件数据源配置
   * 运行时可用于自动拉取并回填 props/state
   */
  dataSource?: Record<string, unknown>

  // ========== 布局 ==========
  /**
   * 编辑器画布几何信息
   * - free: 使用 x/y/zIndex/rotate 等绝对定位参数
   * - flow: 使用顺序与尺寸约束参数
   */
  geometry?: NodeGeometry

  // ========== 样式 ==========
  /** 节点样式 (纯 CSS) */
  style?: NodeStyle

  // ========== 子节点 ==========
  /** 子节点列表 */
  children?: NodeSchema[]

  // ========== 局部状态 ==========
  /**
   * 组件局部状态
   * 用于不需要共享的内部 UI 状态
   */
  state?: VariableSchema[]

  // ========== 渲染控制 ==========
  /**
   * 条件渲染
   * 当值为 falsy 时不渲染该节点
   * 支持静态布尔值或表达式
   *
   * Vue: v-if
   * React: {condition && <Component />}
   */
  renderIf?: ValueOrExpression<boolean>

  /**
   * 列表渲染
   * 根据数据源重复渲染该节点
   *
   * Vue: v-for
   * React: array.map()
   */
  repeat?: RepeatConfig

  // ========== 事件 ==========
  /**
   * 事件绑定
   * key 为事件名 (click, change, input 等)
   * value 为触发的动作列表
   */
  events?: Record<string, NodeEventAction[]>

  /**
   * 节点局部动作定义
   * 可通过 ActionLinkRef(scope: 'node') 复用
   */
  actions?: AnyActionSchema[]

  // ========== 插槽 ==========
  /**
   * 所属插槽名称
   * 指定该节点渲染到父组件的哪个插槽
   */
  slot?: string

  /**
   * 作用域插槽参数名
   * 接收父组件传递的插槽数据
   */
  slotProps?: string

  /**
   * 命名插槽内容
   * 用于容器组件定义多个插槽区域的内容
   * key 为插槽名，value 为该插槽的子节点列表
   *
   * @example
   * {
   *   component: 'Card',
   *   slots: {
   *     header: [{ component: 'Text', props: { text: '标题' } }],
   *     footer: [{ component: 'Button', props: { label: '确定' } }]
   *   }
   * }
   */
  slots?: Record<string, NodeSchema[]>

  // ========== 动画 ==========
  /** 动画配置 */
  animation?: AnimationConfig

  // ========== 容器布局 ==========
  /**
   * 容器对子节点的布局配置（仅容器组件有意义）
   * 省略时继承父容器模式，根容器默认 flow
   */
  container?: NodeContainerLayout

  // ========== 响应式 ==========
  /**
   * 不同断点下的样式覆盖
   * key 为断点名称（匹配 PageCanvasConfig.breakpoints 中的 key）
   * value 为需要覆盖的样式属性（与 style 浅合并）
   *
   * @example
   * {
   *   style: { width: '25%', display: 'flex' },
   *   responsive: {
   *     tablet: { width: '50%' },
   *     mobile: { width: '100%', flexDirection: 'column' }
   *   }
   * }
   */
  responsive?: Record<string, Partial<NodeStyle>>

  // ========== 引用 ==========
  /**
   * 组件引用名
   * 用于在代码中获取组件实例
   *
   * Vue: ref="xxx"
   * React: useRef()
   */
  ref?: string
}

/**
 * 获取节点组件标识（兼容 component/componentName）
 */
export function getNodeComponent(node: Pick<NodeSchema, 'component' | 'componentName'>): string {
  return node.component || node.componentName || ''
}

/**
 * @deprecated Use getNodeComponent instead
 */
export function getNodeComponentName(node: Pick<NodeSchema, 'component' | 'componentName'>): string {
  return getNodeComponent(node)
}

/**
 * 获取容器布局模式
 */
export function getNodeContainerMode(node: Pick<NodeSchema, 'container'>): LayoutMode | undefined {
  return node.container?.mode
}

/**
 * @deprecated Use getNodeContainerMode instead
 */
export function getNodeLayoutMode(node: Pick<NodeSchema, 'container'>): LayoutMode | undefined {
  return getNodeContainerMode(node)
}

/**
 * 收集节点树内每个节点定义的动作 ID
 */
export function collectNodeActionIdMap(
  root?: NodeSchema
): Record<string, Set<string>> {
  const idMap: Record<string, Set<string>> = {}
  if (!root) {
    return idMap
  }

  const walk = (node: NodeSchema): void => {
    idMap[node.id] = extractActionIds(node.actions)

    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }

    if (node.slots) {
      for (const slotChildren of Object.values(node.slots)) {
        for (const child of slotChildren) {
          walk(child)
        }
      }
    }
  }

  walk(root)
  return idMap
}

/**
 * 校验节点树中事件动作引用是否合法
 */
export function validateNodeEventActionRefs(
  root: NodeSchema | undefined,
  context: NodeActionRefValidationContext = {}
): NodeActionRefValidationIssue[] {
  if (!root) {
    return []
  }

  const issues: NodeActionRefValidationIssue[] = []
  const nodeActionIdMap = collectNodeActionIdMap(root)

  const walk = (node: NodeSchema): void => {
    if (node.events) {
      for (const [eventName, actions] of Object.entries(node.events)) {
        actions.forEach((action, actionIndex) => {
          if (!isNodeEventActionLinkRef(action)) {
            return
          }

          const validationIssues = validateActionLinkRef(action, {
            globalActionIds: context.globalActionIds,
            pageActionIds: context.pageActionIds,
            nodeActionIds: nodeActionIdMap[node.id],
          })

          validationIssues.forEach((issue) => {
            issues.push({
              ...issue,
              nodeId: node.id,
              eventName,
              actionIndex,
            })
          })
        })
      }
    }

    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }

    if (node.slots) {
      for (const slotChildren of Object.values(node.slots)) {
        for (const child of slotChildren) {
          walk(child)
        }
      }
    }
  }

  walk(root)
  return issues
}
