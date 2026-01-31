/**
 * Schema 到 IR 的转换器
 * 将 Component/NodeSchema 转换为框架无关的中间表示
 */

import type { Component, JSExpression } from '../components'
import type {
  IRNode,
  IRProp,
  IRDirective,
  IREvent,
  IRSlot,
  IRScriptContext,
  IRStyleContext,
  IRComponent,
  IRImport,
  IRVariable,
  IRFunction,
  IRLifecycleHook,
  CSSStyleProperties,
} from '../types/ir'

// ============================================================
// 辅助函数
// ============================================================

/**
 * 判断是否为 JSExpression
 */
function isJSExpression(value: unknown): value is JSExpression {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as JSExpression).type === 'JSExpression'
  )
}

/**
 * 编译表达式为字符串
 */
function compileExpression(
  expr: boolean | string | number | JSExpression | undefined | null
): string {
  if (expr === undefined || expr === null) return ''
  if (typeof expr === 'boolean') return String(expr)
  if (typeof expr === 'number') return String(expr)
  if (typeof expr === 'string') return expr
  if (isJSExpression(expr)) return expr.value
  return String(expr)
}

/**
 * 判断值是否需要动态绑定
 */
function isDynamicValue(value: unknown): boolean {
  if (isJSExpression(value)) return true
  if (typeof value === 'object' && value !== null) return true
  if (Array.isArray(value)) return true
  return false
}

/**
 * 将驼峰命名转换为 kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

// ============================================================
// 转换函数
// ============================================================

/**
 * 转换组件属性为 IR 属性列表
 */
function transformProps(props: Record<string, unknown> | undefined): IRProp[] {
  if (!props) return []

  const result: IRProp[] = []
  const skipProps = ['style', 'class', 'id', 'ref', 'key']

  for (const [name, value] of Object.entries(props)) {
    if (skipProps.includes(name)) continue
    if (value === undefined || value === null) continue

    const isDynamic = isDynamicValue(value)
    const expression = isDynamic
      ? isJSExpression(value)
        ? value.value
        : JSON.stringify(value)
      : undefined

    result.push({
      name,
      value: isDynamic ? undefined : value,
      isDynamic,
      expression,
    })
  }

  return result
}

/**
 * 转换样式为 CSSStyleProperties
 */
function transformStyle(comp: Component): CSSStyleProperties {
  const style: CSSStyleProperties = {}

  // 位置和尺寸
  if (comp.position) {
    style.position = 'absolute'
    style.left = `${comp.position.x}px`
    style.top = `${comp.position.y}px`
  }

  if (comp.size) {
    style.width = `${comp.size.width}px`
    style.height = `${comp.size.height}px`
  }

  if (comp.rotation) {
    style.transform = `rotate(${comp.rotation}deg)`
  }

  if (comp.zindex !== undefined) {
    style.zIndex = comp.zindex
  }

  // 合并组件自定义样式
  if (comp.style) {
    for (const [key, value] of Object.entries(comp.style)) {
      if (value !== undefined && value !== null) {
        // 转换特殊属性
        if (key === 'fontSize' && typeof value === 'number') {
          style[key] = `${value}px`
        } else if (key === 'opacity' && typeof value === 'number') {
          style[key] = value / 100
        } else if (key === 'borderRadius' && typeof value === 'number') {
          style[key] = `${value}px`
        } else if (key === 'padding' && typeof value === 'number') {
          style[key] = `${value}px`
        } else {
          style[key] = value as string | number
        }
      }
    }
  }

  // 动画样式
  if (comp.animation?.class) {
    style.animationDuration = `${comp.animation.duration || 0.7}s`
    style.animationDelay = `${comp.animation.delay || 0}s`
    style.animationIterationCount = comp.animation.iterationCount || 1
    style.animationTimingFunction = comp.animation.timingFunction || 'ease'
  }

  return style
}

/**
 * 转换指令
 */
function transformDirectives(comp: Component): IRDirective[] {
  const directives: IRDirective[] = []

  // v-if
  if (comp.condition !== undefined) {
    const condition = compileExpression(comp.condition)
    if (condition && condition !== 'true') {
      directives.push({
        type: 'if',
        condition,
      })
    }
  }

  // v-show
  if (comp.visible !== undefined) {
    const visible = compileExpression(comp.visible)
    if (visible && visible !== 'true') {
      directives.push({
        type: 'show',
        condition: visible,
      })
    }
  }

  // v-for
  if (comp.loop) {
    const { data, itemArg = 'item', indexArg = 'index' } = comp.loop

    let iterable: string
    if (Array.isArray(data)) {
      iterable = JSON.stringify(data)
    } else if (isJSExpression(data)) {
      iterable = data.value
    } else if (typeof data === 'string') {
      iterable = data
    } else {
      iterable = '[]'
    }

    directives.push({
      type: 'for',
      iterable,
      itemName: itemArg,
      indexName: indexArg,
      keyExpr: indexArg,
    })
  }

  return directives
}

/**
 * 转换事件
 */
function transformEvents(comp: Component): IREvent[] {
  const events: IREvent[] = []

  if (!comp.events) return events

  // Click 事件
  if (comp.events.click && comp.events.click.length > 0) {
    events.push({
      name: 'click',
      handler: `handleEvent_${comp.id}_click`,
      modifiers: [],
    })
  }

  // Hover 事件
  if (comp.events.hover && comp.events.hover.length > 0) {
    events.push({
      name: 'mouseenter',
      handler: `handleEvent_${comp.id}_hover`,
      modifiers: [],
    })
  }

  // DoubleClick 事件
  if (comp.events.doubleClick && comp.events.doubleClick.length > 0) {
    events.push({
      name: 'dblclick',
      handler: `handleEvent_${comp.id}_doubleclick`,
      modifiers: [],
    })
  }

  // 动画事件
  if (comp.animation?.class) {
    const trigger = comp.animation.trigger || 'load'

    if (trigger === 'hover') {
      events.push(
        {
          name: 'mouseenter',
          handler: `playAnimation_${comp.id}`,
          modifiers: [],
        },
        {
          name: 'mouseleave',
          handler: `resetAnimation_${comp.id}`,
          modifiers: [],
        }
      )
    } else if (trigger === 'click') {
      events.push({
        name: 'click',
        handler: `playAnimation_${comp.id}`,
        modifiers: ['capture'],
      })
    }
  }

  return events
}

/**
 * 转换 CSS 类名
 */
function transformClasses(comp: Component): string[] {
  const classes: string[] = []

  if (comp.animation?.class) {
    const trigger = comp.animation.trigger || 'load'
    if (trigger === 'load') {
      classes.push('animated', comp.animation.class)
    }
    // hover/click 的动画类由动态绑定控制
  }

  return classes
}

/**
 * 转换插槽
 */
function transformSlots(
  comp: Component,
  allComponents: Component[]
): IRSlot[] {
  const slots: IRSlot[] = []

  if (comp.slots) {
    for (const slot of comp.slots) {
      const children = slot.children
        ? slot.children.map((child) => transformNode(child, allComponents))
        : []

      slots.push({
        name: slot.name,
        slotProps: slot.slotProps,
        children,
      })
    }
  }

  return slots
}

/**
 * 转换单个节点
 */
export function transformNode(
  comp: Component,
  allComponents: Component[]
): IRNode {
  // 获取子组件
  const children = allComponents
    .filter((c) => c.groupId === comp.id)
    .map((child) => transformNode(child, allComponents))

  // 处理文本内容
  let textContent: string | undefined
  if (comp.type === 'Text' && comp.props?.text) {
    textContent = String(comp.props.text)
  }

  return {
    id: comp.id,
    type: comp.type,
    isNative: ['div', 'span', 'button', 'input', 'img', 'video'].includes(
      comp.type.toLowerCase()
    ),
    props: transformProps(comp.props),
    children,
    directives: transformDirectives(comp),
    events: transformEvents(comp),
    slots: transformSlots(comp, allComponents),
    style: transformStyle(comp),
    classes: transformClasses(comp),
    textContent,
    _raw: comp,
  }
}

/**
 * 转换组件列表为 IR 节点树
 */
export function transformNodes(components: Component[]): IRNode[] {
  // 获取顶级组件 (没有 groupId 的)
  const topLevel = components.filter((c) => !c.groupId)
  return topLevel.map((comp) => transformNode(comp, components))
}

// ============================================================
// 脚本上下文生成
// ============================================================

/**
 * 收集组件所需的导入
 */
function collectImports(components: Component[]): IRImport[] {
  const imports: IRImport[] = []

  // Vue 核心导入
  imports.push({
    specifiers: [
      { type: 'named', imported: 'ref', local: 'ref' },
      { type: 'named', imported: 'reactive', local: 'reactive' },
      { type: 'named', imported: 'computed', local: 'computed' },
      { type: 'named', imported: 'onMounted', local: 'onMounted' },
      { type: 'named', imported: 'onBeforeUnmount', local: 'onBeforeUnmount' },
      { type: 'named', imported: 'nextTick', local: 'nextTick' },
    ],
    source: 'vue',
  })

  // Vue Router
  imports.push({
    specifiers: [{ type: 'named', imported: 'useRouter', local: 'useRouter' }],
    source: 'vue-router',
  })

  // 运行时库
  imports.push({
    specifiers: [
      { type: 'named', imported: 'useEventExecutor', local: 'useEventExecutor' },
    ],
    source: '@/runtime/useEventExecutor',
  })

  // 数据绑定引擎
  const hasDataBindings = components.some(
    (c) => c.dataBindings && c.dataBindings.length > 0
  )
  if (hasDataBindings) {
    imports.push({
      specifiers: [
        {
          type: 'named',
          imported: 'useDataBindingEngine',
          local: 'useDataBindingEngine',
        },
      ],
      source: '@/runtime/useDataBindingEngine',
    })
  }

  // 数据源
  const hasDataSource = components.some((c) => c.dataSource?.enabled)
  if (hasDataSource) {
    imports.push({
      specifiers: [
        { type: 'named', imported: 'useDataSource', local: 'useDataSource' },
      ],
      source: '@/datasource/useDataSource',
    })
  }

  // 组件库导入
  const componentNames = new Set<string>()
  const COMPONENT_NAME_MAP: Record<string, string> = {
    Text: 'vText',
    box: 'vBox',
    stat: 'vStat',
    countUp: 'vCountUp',
    progress: 'vProgress',
    table: 'vTable',
    list: 'vList',
    select: 'vSelect',
    row: 'vRow',
    col: 'vCol',
    flex: 'vFlex',
    grid: 'vGrid',
    modal: 'vModal',
    panel: 'vPanel',
    tabs: 'vTabs',
    image: 'vImage',
    video: 'vVideo',
    Group: 'vGroup',
    map: 'vMap',
    // 添加更多映射...
  }

  for (const comp of components) {
    const mappedName = COMPONENT_NAME_MAP[comp.type]
    if (mappedName) {
      componentNames.add(mappedName)
    }
  }

  if (componentNames.size > 0) {
    imports.push({
      specifiers: Array.from(componentNames).map((name) => ({
        type: 'named' as const,
        imported: name,
        local: name,
      })),
      source: '@vela/ui',
    })
  }

  return imports
}

/**
 * 生成变量声明
 */
function generateVariables(components: Component[]): IRVariable[] {
  const variables: IRVariable[] = []

  // 组件 refs
  variables.push({
    name: 'componentRefs',
    kind: 'const',
    init: 'ref<Record<string, Element | ComponentPublicInstance | null>>({})',
    typeAnnotation: 'Ref<Record<string, Element | ComponentPublicInstance | null>>',
  })

  // 组件数据
  variables.push({
    name: 'componentsData',
    kind: 'const',
    init: `reactive(${JSON.stringify(
      components.map((c) => ({
        id: c.id,
        props: c.props || {},
        style: c.style || {},
        dataBindings: c.dataBindings || [],
      })),
      null,
      2
    )})`,
  })

  // 组件索引 Map
  variables.push({
    name: 'compById',
    kind: 'const',
    init: 'new Map(componentsData.map((c) => [c.id, c] as const))',
  })

  // Router
  variables.push({
    name: 'router',
    kind: 'const',
    init: 'useRouter()',
  })

  // 事件执行器
  variables.push({
    name: '{ executeAction }',
    kind: 'const',
    init: `useEventExecutor({
  components: ref(componentsData),
  pages: ref([]),
  isProjectMode: ref(false),
  router,
})`,
  })

  // 动画状态
  for (const comp of components) {
    if (comp.animation?.class) {
      const trigger = comp.animation.trigger || 'load'
      if (trigger === 'hover' || trigger === 'click') {
        variables.push({
          name: `animationPlaying_${comp.id}`,
          kind: 'const',
          init: 'ref(false)',
        })

        variables.push({
          name: `animationStyles_${comp.id}`,
          kind: 'const',
          init: `ref({
  animationDuration: '${comp.animation.duration || 0.7}s',
  animationDelay: '${comp.animation.delay || 0}s',
  animationIterationCount: '${comp.animation.iterationCount || 1}',
  animationTimingFunction: '${comp.animation.timingFunction || 'ease'}',
})`,
        })
      }
    }
  }

  // 数据源
  for (const comp of components) {
    if (comp.dataSource?.enabled) {
      variables.push({
        name: `dsConfig_${comp.id}`,
        kind: 'const',
        init: `ref(${JSON.stringify(comp.dataSource, null, 2)})`,
      })

      variables.push({
        name: `{ data: data_${comp.id}, loading: loading_${comp.id}, error: error_${comp.id}, refetch: refetch_${comp.id} }`,
        kind: 'const',
        init: `useDataSource(dsConfig_${comp.id})`,
      })
    }
  }

  return variables
}

/**
 * 生成函数声明
 */
function generateFunctions(components: Component[]): IRFunction[] {
  const functions: IRFunction[] = []

  // setComponentRef 辅助函数
  functions.push({
    name: 'setComponentRef',
    params: [{ name: 'id', type: 'string' }],
    body: `return (el: Element | ComponentPublicInstance | null) => {
  if (el) componentRefs.value[id] = el
}`,
    returnType: '(el: Element | ComponentPublicInstance | null) => void',
  })

  // 动画处理函数
  for (const comp of components) {
    if (comp.animation?.class) {
      const trigger = comp.animation.trigger || 'load'

      if (trigger === 'hover') {
        functions.push({
          name: `playAnimation_${comp.id}`,
          params: [],
          body: `animationPlaying_${comp.id}.value = true
nextTick(() => {
  const ref = componentRefs.value['${comp.id}']
  if (ref) {
    const el = (ref as any).$el || ref as HTMLElement
    el.style.animation = 'none'
    setTimeout(() => { el.style.animation = '' }, 10)
  }
})`,
        })

        functions.push({
          name: `resetAnimation_${comp.id}`,
          params: [],
          body: `const ref = componentRefs.value['${comp.id}']
if (ref) {
  const el = (ref as any).$el || ref as HTMLElement
  animationPlaying_${comp.id}.value = false
  el.style.animation = 'none'
  setTimeout(() => { el.style.animation = '' }, 10)
}`,
        })
      } else if (trigger === 'click') {
        functions.push({
          name: `playAnimation_${comp.id}`,
          params: [],
          body: `animationPlaying_${comp.id}.value = true
nextTick(() => {
  const ref = componentRefs.value['${comp.id}']
  if (ref) {
    const el = (ref as any).$el || ref as HTMLElement
    el.style.animation = 'none'
    setTimeout(() => { el.style.animation = '' }, 10)
  }
})`,
        })
      }
    }
  }

  // 事件处理函数
  for (const comp of components) {
    if (comp.events) {
      const eventTypes = ['click', 'hover', 'doubleClick'] as const

      for (const eventType of eventTypes) {
        const actions = comp.events[eventType]
        if (actions && actions.length > 0) {
          const isAsync = actions.some((a) => a.delay && a.delay > 0)
          const handlerName =
            eventType === 'doubleClick'
              ? `handleEvent_${comp.id}_doubleclick`
              : `handleEvent_${comp.id}_${eventType}`

          let body = '// 代理调用运行时执行器\n'
          for (const action of actions) {
            body += `${isAsync ? 'await ' : ''}executeAction(${JSON.stringify(action)})\n`
          }

          functions.push({
            name: handlerName,
            params: [],
            body,
            async: isAsync,
          })
        }
      }
    }
  }

  return functions
}

/**
 * 生成生命周期钩子
 */
function generateLifecycles(components: Component[]): IRLifecycleHook[] {
  const lifecycles: IRLifecycleHook[] = []

  const hasDataBindings = components.some(
    (c) => c.dataBindings && c.dataBindings.length > 0
  )

  // onMounted
  let mountedBody = 'nextTick(() => {\n'

  // 数据绑定引擎启动
  if (hasDataBindings) {
    mountedBody = `const bindingEngine = useDataBindingEngine(ref(componentsData))
bindingEngine.start()

${mountedBody}`
  }

  // 触发 load 动画
  for (const comp of components) {
    if (comp.animation?.trigger === 'load') {
      mountedBody += `  // 触发组件 ${comp.id} 的动画\n`
    }
  }

  mountedBody += '})'

  lifecycles.push({
    name: 'onMounted',
    body: mountedBody,
  })

  // onBeforeUnmount (如果有数据绑定)
  if (hasDataBindings) {
    lifecycles.push({
      name: 'onBeforeUnmount',
      body: '// bindingEngine.stop()',
    })
  }

  return lifecycles
}

/**
 * 生成脚本上下文
 */
export function generateScriptContext(components: Component[]): IRScriptContext {
  return {
    imports: collectImports(components),
    variables: generateVariables(components),
    functions: generateFunctions(components),
    lifecycles: generateLifecycles(components),
    reactiveState: [],
    computedProps: [],
    watchers: [],
  }
}

// ============================================================
// 样式上下文生成
// ============================================================

/**
 * 生成样式上下文
 */
export function generateStyleContext(): IRStyleContext {
  return {
    scoped: true,
    lang: 'css',
    rules: [
      {
        selector: '.runtime-container',
        declarations: {
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          'background-color': '#f5f5f5',
        },
      },
      {
        selector: '.animated',
        declarations: {
          'animation-fill-mode': 'both',
        },
      },
    ],
    keyframes: [
      {
        name: 'fadeIn',
        frames: [
          { selector: 'from', declarations: { opacity: '0' } },
          { selector: 'to', declarations: { opacity: '1' } },
        ],
      },
      {
        name: 'zoomIn',
        frames: [
          {
            selector: '0%',
            declarations: { transform: 'scale(0.3)', opacity: '0' },
          },
          { selector: '60%', declarations: { opacity: '1' } },
          { selector: '100%', declarations: { transform: 'scale(1)' } },
        ],
      },
      {
        name: 'slideLeft',
        frames: [
          {
            selector: '0%',
            declarations: { transform: 'translateX(40px)', opacity: '0' },
          },
          {
            selector: '100%',
            declarations: { transform: 'translateX(0)', opacity: '1' },
          },
        ],
      },
      {
        name: 'slideUp',
        frames: [
          {
            selector: '0%',
            declarations: { transform: 'translateY(40px)', opacity: '0' },
          },
          {
            selector: '100%',
            declarations: { transform: 'translateY(0)', opacity: '1' },
          },
        ],
      },
    ],
  }
}

// ============================================================
// 主转换函数
// ============================================================

/**
 * 将组件列表转换为完整的 IR 组件定义
 */
export function transformToIRComponent(
  components: Component[],
  name: string = 'Page'
): IRComponent {
  return {
    name,
    template: transformNodes(components),
    script: generateScriptContext(components),
    style: generateStyleContext(),
  }
}
