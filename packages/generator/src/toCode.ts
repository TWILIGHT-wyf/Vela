import type { Component, ActionConfig, JSExpression, LoopConfig } from './components'

/**
 * 组件类型到库导出名的映射
 * 图表组件保持 camelCase，其他组件使用 v 前缀
 */
const COMPONENT_NAME_MAP: Record<string, string> = {
  // 图表组件 (保持原名)
  lineChart: 'lineChart',
  'chart.bar': 'barChart',
  barChart: 'barChart',
  'chart.stackedBar': 'stackedBarChart',
  stackedBarChart: 'stackedBarChart',
  pieChart: 'pieChart',
  doughnutChart: 'doughnutChart',
  scatterChart: 'scatterChart',
  radarChart: 'radarChart',
  gaugeChart: 'gaugeChart',
  funnelChart: 'funnelChart',
  sankeyChart: 'sankeyChart',

  // KPI 组件
  Text: 'vText',
  box: 'vBox',
  stat: 'vStat',
  countUp: 'vCountUp',
  progress: 'vProgress',
  badge: 'vBadge',

  // 数据组件
  table: 'vTable',
  list: 'vList',
  timeline: 'vTimeline',
  cardGrid: 'vCardGrid',
  pivot: 'vPivot',

  // 控件组件
  select: 'vSelect',
  multiSelect: 'vMultiSelect',
  dateRange: 'vDateRange',
  searchBox: 'vSearchBox',
  slider: 'vSlider',
  switch: 'vSwitch',
  checkboxGroup: 'vCheckboxGroup',
  buttonGroup: 'vButtonGroup',

  // 布局组件
  row: 'vRow',
  col: 'vCol',
  flex: 'vFlex',
  grid: 'vGrid',
  modal: 'vModal',
  panel: 'vPanel',
  tabs: 'vTabs',

  // 媒体组件
  image: 'vImage',
  video: 'vVideo',

  // 内容组件
  markdown: 'vMarkdown',
  html: 'vHtml',
  iframe: 'vIframe',

  // 分组组件
  Group: 'vGroup',

  // 地图组件
  map: 'vMap',
  base: 'vMap',
  marker: 'vMarker',
  heat: 'vHeatLayer',
  heatLayer: 'vHeatLayer',
  geojson: 'vGeoJsonLayer',
  geoJsonLayer: 'vGeoJsonLayer',
  cluster: 'vClusterLayer',
  clusterLayer: 'vClusterLayer',
  tile: 'vTileLayer',
  tileLayer: 'vTileLayer',
  vector: 'vVectorLayer',
  vectorLayer: 'vVectorLayer',
  legend: 'vLegend',
  scale: 'vScale',
  layers: 'vLayers',

  // 高级组件
  scripting: 'vScripting',
  state: 'vState',
  trigger: 'vTrigger',
}

/**
 * 保留的 Props 属性，不需要在模板中绑定
 */
const RESERVED_PROPS = ['style', 'class', 'id', 'ref', 'key']

/**
 * 将componentStore转换为Vue代码
 */
export function generateVueCode(components: Component[]): string {
  const topLevelComponents = components.filter((c) => !c.groupId)

  const template = generateTemplate(topLevelComponents, components)
  const script = generateScript(components)
  const style = generateStyle()

  return `<template>
  <div class="runtime-container">
${template}
  </div>
</template>

${script}

${style}
`
}

/**
 * 生成模板代码
 */
function generateTemplate(
  topLevelComponents: Component[],
  allComponents: Component[],
  indent = 4,
): string {
  let html = ''

  for (const comp of topLevelComponents) {
    html += generateComponentTemplate(comp, allComponents, indent)
  }

  return html
}

/**
 * 编译 JSExpression 或字符串为模板表达式
 */
function compileExpression(expr: boolean | string | JSExpression | undefined): string {
  if (expr === undefined || expr === null) return ''
  if (typeof expr === 'boolean') return String(expr)
  if (typeof expr === 'string') return expr
  if (typeof expr === 'object' && expr.type === 'JSExpression') {
    return expr.value
  }
  return String(expr)
}

/**
 * 生成 v-if 指令
 */
function generateVIfDirective(comp: Component, indentStr: string): string {
  if (comp.condition === undefined) return ''

  const condition = compileExpression(comp.condition)
  if (!condition || condition === 'true') return ''
  if (condition === 'false') return `${indentStr}  v-if="false"\n`

  return `${indentStr}  v-if="${condition}"\n`
}

/**
 * 生成 v-show 指令
 */
function generateVShowDirective(comp: Component, indentStr: string): string {
  if (comp.visible === undefined) return ''

  const visible = compileExpression(comp.visible)
  if (!visible || visible === 'true') return ''
  if (visible === 'false') return `${indentStr}  v-show="false"\n`

  return `${indentStr}  v-show="${visible}"\n`
}

/**
 * 生成 v-for 指令
 */
function generateVForDirective(comp: Component, indentStr: string): string {
  if (!comp.loop) return ''

  const { data, itemArg = 'item', indexArg = 'index' } = comp.loop

  // 编译数据源表达式
  let dataExpr: string
  if (Array.isArray(data)) {
    // 静态数组 - 直接使用 JSON
    dataExpr = JSON.stringify(data)
  } else if (typeof data === 'object' && (data as JSExpression).type === 'JSExpression') {
    // JSExpression
    dataExpr = (data as JSExpression).value
  } else if (typeof data === 'string') {
    dataExpr = data
  } else {
    return ''
  }

  // 生成 v-for 和 :key
  let result = `${indentStr}  v-for="(${itemArg}, ${indexArg}) in ${dataExpr}"\n`
  result += `${indentStr}  :key="${indexArg}"\n`

  return result
}

/**
 * 生成单个组件的模板
 */
function generateComponentTemplate(
  comp: Component,
  allComponents: Component[],
  indent: number,
): string {
  const indentStr = ' '.repeat(indent)
  const style = generateComponentStyle(comp)
  const props = generateComponentProps(comp)
  const events = generateComponentEvents(comp)
  const children = allComponents.filter((c) => c.groupId === comp.id)
  const animationInfo = generateAnimationInfo(comp)

  // 处理组件名称映射
  const tagName = getComponentTagName(comp.type)

  let html = `${indentStr}<${tagName}\n`

  // === 新增：添加 v-if/v-show/v-for 指令 ===
  html += generateVIfDirective(comp, indentStr)
  html += generateVShowDirective(comp, indentStr)
  html += generateVForDirective(comp, indentStr)

  // 添加组件 ID 属性（用于事件执行器定位元素）
  // 如果有 v-for，ID 需要动态化
  if (comp.loop) {
    const { indexArg = 'index' } = comp.loop
    html += `${indentStr}  :id="\`${comp.id}-\${${indexArg}}\`"\n`
    html += `${indentStr}  :data-component-id="\`${comp.id}-\${${indexArg}}\`"\n`
  } else {
    html += `${indentStr}  :id="'${comp.id}'"\n`
    html += `${indentStr}  :data-component-id="'${comp.id}'"\n`
  }
  // 使用辅助函数设置 ref，避免模板中的类型问题
  html += `${indentStr}  :ref="setComponentRef('${comp.id}')"\n`

  // 添加动画相关class和事件（与 RuntimeComponent.vue 保持一致）
  if (animationInfo.class && 'trigger' in animationInfo) {
    // load 触发的动画直接添加 class，hover/click 通过动态绑定控制
    if (animationInfo.trigger === 'load') {
      html += `${indentStr}  :class="['animated', '${animationInfo.class}']"\n`
    } else {
      // hover/click 使用响应式变量控制动画播放
      html += `${indentStr}  :class="animationPlaying_${comp.id} ? ['animated', '${animationInfo.class}'] : []"\n`
    }

    // 根据trigger添加动画触发事件
    if (animationInfo.trigger === 'hover') {
      html += `${indentStr}  @mouseenter="playAnimation_${comp.id}"\n`
      html += `${indentStr}  @mouseleave="resetAnimation_${comp.id}"\n`
    } else if (animationInfo.trigger === 'click') {
      html += `${indentStr}  @click.capture="playAnimation_${comp.id}"\n`
    }

    // 添加style属性(包含动画配置) - 使用单引号
    html += `${indentStr}  :style='{...${style}, ...animationStyles_${comp.id}}'\n`
  } else {
    html += `${indentStr}  :style='${style}'\n`
  }

  // 添加props
  if (props) {
    html += props
  }

  // 添加业务事件
  if (events) {
    html += events
  }

  // 核心修改：处理嵌套关系和插槽
  const hasSlots = comp.slots && comp.slots.length > 0

  if (children.length > 0 || hasSlots) {
    html += `${indentStr}>\n` // 闭合开始标签 >

    // 生成命名插槽内容
    if (hasSlots) {
      for (const slot of comp.slots!) {
        html += generateSlotTemplate(slot, allComponents, indent + 2)
      }
    }

    // 递归渲染子组件
    children.forEach((child) => {
      html += generateComponentTemplate(child, allComponents, indent + 2)
    })

    html += `${indentStr}</${tagName}>\n` // 闭合标签
  } else if (comp.type === 'Text' && comp.props?.text) {
    html += `${indentStr}>\n`
    // 如果有 v-for，text 可能需要动态绑定
    if (comp.loop) {
      const textValue = comp.props.text
      if (typeof textValue === 'string' && textValue.includes('${')) {
        // 模板字符串形式
        html += `${indentStr}  {{ ${textValue.replace(/\$\{/g, '').replace(/\}/g, '')} }}\n`
      } else {
        html += `${indentStr}  {{ ${JSON.stringify(comp.props.text)} }}\n`
      }
    } else {
      html += `${indentStr}  {{ ${JSON.stringify(comp.props.text)} }}\n`
    }
    html += `${indentStr}</${tagName}>\n`
  } else {
    html += `${indentStr}/>\n` // 自闭合
  }

  return html
}

/**
 * 生成插槽模板
 */
function generateSlotTemplate(
  slot: { name: string; slotProps?: string[]; children?: Component[] },
  allComponents: Component[],
  indent: number,
): string {
  const indentStr = ' '.repeat(indent)
  const slotName = slot.name || 'default'

  // 作用域插槽参数
  const scopeAttr = slot.slotProps && slot.slotProps.length > 0
    ? `="{ ${slot.slotProps.join(', ')} }"`
    : ''

  let html = ''

  if (slotName === 'default' && !scopeAttr) {
    // 默认插槽不需要 template 包装
    if (slot.children) {
      for (const child of slot.children) {
        html += generateComponentTemplate(child, allComponents, indent)
      }
    }
  } else {
    // 命名插槽或作用域插槽需要 template 包装
    html += `${indentStr}<template #${slotName}${scopeAttr}>\n`
    if (slot.children) {
      for (const child of slot.children) {
        html += generateComponentTemplate(child, allComponents, indent + 2)
      }
    }
    html += `${indentStr}</template>\n`
  }

  return html
}

/**
 * 生成动画信息
 */
function generateAnimationInfo(comp: Component):
  | {
      class: string
      trigger: string
      duration: number
      delay: number
      iterationCount: number | string
      timingFunction: string
    }
  | { class: '' } {
  if (!comp.animation || !comp.animation.class) {
    return { class: '' }
  }
  return {
    class: comp.animation.class,
    trigger: comp.animation.trigger || 'load',
    duration: comp.animation.duration || 0.7,
    delay: comp.animation.delay || 0,
    iterationCount: comp.animation.iterationCount || 1,
    timingFunction: comp.animation.timingFunction || 'ease',
  }
}

/**
 * 获取组件标签名
 * 优先从映射表查找，否则返回原类型
 */
function getComponentTagName(type: string): string {
  return COMPONENT_NAME_MAP[type] || type
}

/**
 * 生成组件样式对象字符串（与 RuntimeComponent.vue 的 computedStyle 保持一致）
 */
function generateComponentStyle(comp: Component): string {
  const styleObj: Record<string, string | number> = {
    position: 'absolute',
    left: `${comp.position.x}px`,
    top: `${comp.position.y}px`,
    width: `${comp.size.width}px`,
    height: `${comp.size.height}px`,
    transform: `rotate(${comp.rotation || 0}deg)`,
    zIndex: comp.zindex || 0,
  }

  // Text组件特殊样式
  if (comp.type === 'Text' && comp.style) {
    if (comp.style.fontSize) styleObj.fontSize = `${comp.style.fontSize}px`
    if (comp.style.fontColor) styleObj.color = String(comp.style.fontColor)
    if (comp.style.fontWeight) styleObj.fontWeight = String(comp.style.fontWeight)
    if (comp.style.textAlign) styleObj.textAlign = String(comp.style.textAlign)
    if (comp.style.lineHeight) styleObj.lineHeight = String(comp.style.lineHeight)
    if (comp.style.letterSpacing) styleObj.letterSpacing = `${comp.style.letterSpacing}px`
  }

  // 通用样式属性（与 RuntimeComponent.vue 保持一致）
  if (comp.style) {
    // 透明度
    if (comp.style.opacity !== undefined) {
      styleObj.opacity = Number(comp.style.opacity) / 100
    }
    // 可见性处理 - 显式设置 display 以确保 toggle 正常工作
    if (comp.style.visible === false) {
      styleObj.display = 'none'
    } else if (comp.style.visible === true || comp.style.visible === undefined) {
      // 显式设置为空字符串，移除 display 限制
      // 在生成代码时不设置 display，让浏览器使用默认值
    }
    // 背景色
    if (comp.style.backgroundColor) {
      styleObj.backgroundColor = String(comp.style.backgroundColor)
    }
    // 圆角
    if (comp.style.borderRadius) {
      styleObj.borderRadius = `${comp.style.borderRadius}px`
    }
    // 边框
    if (comp.style.border) {
      styleObj.border = String(comp.style.border)
    }
    // 阴影
    if (comp.style.boxShadow) {
      styleObj.boxShadow = String(comp.style.boxShadow)
    }
    // 内边距
    if (comp.style.padding) {
      styleObj.padding = `${comp.style.padding}px`
    }
  }

  // 动画样式（与 RuntimeComponent.vue 保持一致）
  if (comp.animation && comp.animation.class) {
    styleObj.animationDuration = `${comp.animation.duration || 0.7}s`
    styleObj.animationDelay = `${comp.animation.delay || 0}s`
    styleObj.animationIterationCount = comp.animation.iterationCount || 1
    styleObj.animationTimingFunction = comp.animation.timingFunction || 'ease'
  }

  return JSON.stringify(styleObj)
}

/**
 * 生成组件Props
 * 使用单引号包裹属性值，避免 JSON 双引号冲突
 */
function generateComponentProps(comp: Component): string {
  let propsStr = ''
  const indentStr = ' '.repeat(6)

  if (comp.props) {
    for (const [key, value] of Object.entries(comp.props)) {
      // 跳过 Text 组件的 text 属性（在模板中特殊处理）
      if (comp.type === 'Text' && key === 'text') continue

      // 跳过保留属性
      if (RESERVED_PROPS.includes(key)) continue

      // 跳过 undefined 和 null
      if (value === undefined || value === null) continue

      // 使用单引号包裹 JSON 字符串，避免双引号冲突
      const propValue = JSON.stringify(value)
      propsStr += `${indentStr}:${key}='${propValue}'\n`
    }
  }

  return propsStr
}

/**
 * 生成组件事件绑定
 */
function generateComponentEvents(comp: Component): string {
  let eventsStr = ''
  const indentStr = ' '.repeat(6)

  if (comp.events) {
    if (comp.events.click && comp.events.click.length > 0) {
      eventsStr += `${indentStr}@click="handleEvent_${comp.id}_click"\n`
    }
    if (comp.events.hover && comp.events.hover.length > 0) {
      eventsStr += `${indentStr}@mouseenter="handleEvent_${comp.id}_hover"\n`
    }
    if (comp.events.doubleClick && comp.events.doubleClick.length > 0) {
      eventsStr += `${indentStr}@dblclick="handleEvent_${comp.id}_doubleclick"\n`
    }
  }

  return eventsStr
}

/**
 * 生成Script代码（使用运行时 Hook）
 */
function generateScript(components: Component[]): string {
  const imports = generateImports(components)
  const animationHandlers = generateAnimationHandlers(components)
  const eventHandlers = generateEventHandlers(components)
  const hasDataBindings = components.some((c) => c.dataBindings && c.dataBindings.length > 0)
  const hasDataSource = components.some((c) => c.dataSource?.enabled)

  return `<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useEventExecutor } from '@/runtime/useEventExecutor'
import { useDataBindingEngine } from '@/runtime/useDataBindingEngine'
${hasDataSource ? "import { useDataSource } from '@/datasource/useDataSource'" : ''}
${imports}

// 组件 Ref 类型定义
type ComponentRef = Element | ComponentPublicInstance | null

// 组件 ref 引用
const componentRefs = ref<Record<string, ComponentRef>>({})

// 设置组件 ref 的辅助函数
const setComponentRef = (id: string) => (el: ComponentRef) => {
  if (el) componentRefs.value[id] = el
}

// 组件数据（响应式）
${generateComponentData(components)}

// 动画状态
${generateAnimationStates(components)}

// 动画样式对象
${generateAnimationStyles(components)}

// 动画处理函数
${animationHandlers}

// 初始化运行时 Hook
const router = useRouter()

// 包装 componentsData 为 ref 以兼容运行时 Hook
const componentsDataRef = ref(componentsData)

// 事件执行器
const { executeAction } = useEventExecutor({
  components: componentsDataRef,
  pages: ref([]), // 注：生成的代码中需要根据实际情况注入 pages 数据
  isProjectMode: ref(false),
  router,
})

// 数据联动引擎
${
  hasDataBindings
    ? `const bindingEngine = useDataBindingEngine(componentsDataRef)

onMounted(() => {
  bindingEngine.start()
})

onBeforeUnmount(() => {
  bindingEngine.stop()
})`
    : '// 无数据联动配置'
}

// 页面加载时触发的动画
onMounted(() => {
  nextTick(() => {
${generateOnMountAnimations(components)}
  })
})

// 事件处理函数（代理调用）
${eventHandlers}
</script>`
}

/**
 * 生成导入语句
 * 统一从 @vela/ui 导入所有组件
 */
function generateImports(components: Component[]): string {
  const libImports = new Set<string>()

  // 收集所有需要导入的组件
  components.forEach((comp) => {
    const componentName = COMPONENT_NAME_MAP[comp.type]
    // 只导入在映射表中的组件（排除原生 HTML 标签）
    if (componentName) {
      libImports.add(componentName)
    }
  })

  let importStr = ''

  // 生成组件库导入语句
  if (libImports.size > 0) {
    const sortedImports = Array.from(libImports).sort()
    importStr += `import { ${sortedImports.join(', ')} } from '@vela/ui'\n`
    importStr += `import '@vela/ui/dist/style.css'`
  }

  return importStr
}

/**
 * 生成组件数据（响应式组件状态）
 */
function generateComponentData(components: Component[]): string {
  let dataStr = ''

  // 生成组件响应式数据对象
  dataStr += `// 组件响应式数据
const componentsData = reactive(${JSON.stringify(
    components.map((c) => ({
      id: c.id,
      props: c.props || {},
      style: c.style || {},
      dataBindings: c.dataBindings || [],
      condition: c.condition,
      loop: c.loop,
    })),
    null,
    2,
  )})\n\n`

  // 生成组件索引 Map
  dataStr += `// 组件索引 Map
const compById = new Map(componentsData.map((c: { id: string }) => [c.id, c] as const))\n\n`

  // v-for 循环数据源
  const componentsWithLoop = components.filter((c) => c.loop)
  if (componentsWithLoop.length > 0) {
    dataStr += `// v-for 循环数据源\n`
    for (const comp of componentsWithLoop) {
      const { data } = comp.loop!
      // 如果是静态数组，生成响应式数据
      if (Array.isArray(data)) {
        dataStr += `const loopData_${comp.id} = ref(${JSON.stringify(data, null, 2)})\n`
      }
    }
    dataStr += '\n'
  }

  // 数据源相关配置和 Hook 调用
  const componentsWithDataSource = components.filter((c) => c.dataSource?.enabled)

  if (componentsWithDataSource.length > 0) {
    dataStr += `// 数据源配置和 Hook 调用\n`

    for (const comp of componentsWithDataSource) {
      // 生成数据源配置 ref
      dataStr += `const dsConfig_${comp.id} = ref(${JSON.stringify(comp.dataSource, null, 2)})\n`

      // 调用 useDataSource Hook 并解构 data
      dataStr += `const { data: data_${comp.id}, loading: loading_${comp.id}, error: error_${comp.id}, refetch: refetch_${comp.id} } = useDataSource(dsConfig_${comp.id})\n\n`
    }
  }

  return dataStr
}

/**
 * 生成动画播放状态
 */
function generateAnimationStates(components: Component[]): string {
  let statesStr = ''

  for (const comp of components) {
    if (comp.animation && comp.animation.class) {
      const trigger = comp.animation.trigger || 'load'
      // hover/click 需要响应式控制动画播放
      if (trigger === 'hover' || trigger === 'click') {
        statesStr += `const animationPlaying_${comp.id} = ref(false)\n`
      }
    }
  }

  return statesStr || '// 无需动画状态控制'
}

/**
 * 生成动画样式对象
 */
function generateAnimationStyles(components: Component[]): string {
  let stylesStr = ''

  for (const comp of components) {
    if (comp.animation && comp.animation.class) {
      const duration = comp.animation.duration || 0.7
      const delay = comp.animation.delay || 0
      const iterationCount = comp.animation.iterationCount || 1
      const timingFunction = comp.animation.timingFunction || 'ease'

      stylesStr += `const animationStyles_${comp.id} = ref({
  animationDuration: '${duration}s',
  animationDelay: '${delay}s',
  animationIterationCount: '${iterationCount}',
  animationTimingFunction: '${timingFunction}',
})\n`
    }
  }

  return stylesStr || '// 无动画样式配置'
}

/**
 * 生成动画处理函数（与 RuntimeComponent.vue 保持一致）
 */
function generateAnimationHandlers(components: Component[]): string {
  let handlersStr = ''

  for (const comp of components) {
    if (comp.animation && comp.animation.class) {
      const trigger = comp.animation.trigger || 'load'
      const tagName = getComponentTagName(comp.type)
      const needsEl = !['div', 'span', 'button', 'input', 'video', 'img'].includes(tagName)

      if (trigger === 'hover') {
        handlersStr += `
function playAnimation_${comp.id}() {
  animationPlaying_${comp.id}.value = true
  nextTick(() => {
    const ref = componentRefs.value['${comp.id}']
    if (ref) {
      const el = ${needsEl ? '(ref as any).$el || ref' : 'ref'} as HTMLElement
      el.style.animation = 'none'
      setTimeout(() => {
        el.style.animation = ''
      }, 10)
    }
  })
}

function resetAnimation_${comp.id}() {
  const ref = componentRefs.value['${comp.id}']
  if (ref) {
    const el = ${needsEl ? '(ref as any).$el || ref' : 'ref'} as HTMLElement
    animationPlaying_${comp.id}.value = false
    el.style.animation = 'none'
    setTimeout(() => {
      el.style.animation = ''
    }, 10)
  }
}
`
      } else if (trigger === 'click') {
        handlersStr += `
function playAnimation_${comp.id}() {
  animationPlaying_${comp.id}.value = true
  nextTick(() => {
    const ref = componentRefs.value['${comp.id}']
    if (ref) {
      const el = ${needsEl ? '(ref as any).$el || ref' : 'ref'} as HTMLElement
      el.style.animation = 'none'
      setTimeout(() => {
        el.style.animation = ''
      }, 10)
    }
  })
}
`
      }
    }
  }

  return handlersStr || '// 无需动画处理函数'
}

/**
 * 生成onMounted中的动画触发
 */
function generateOnMountAnimations(components: Component[]): string {
  let animStr = ''

  for (const comp of components) {
    if (comp.animation && comp.animation.trigger === 'load') {
      animStr += `    // 触发组件 ${comp.id} 的动画\n`
    }
  }

  return animStr || '    // 没有需要在页面加载时触发的动画'
}

/**
 * 生成事件处理函数（代理调用运行时 Hook）
 */
function generateEventHandlers(components: Component[]): string {
  let handlersStr = ''

  for (const comp of components) {
    if (comp.events) {
      // Click事件
      if (comp.events.click && comp.events.click.length > 0) {
        const isAsync = comp.events.click.some((a: ActionConfig) => a.delay && a.delay > 0)
        handlersStr += `\n${isAsync ? 'async ' : ''}function handleEvent_${comp.id}_click() {\n`
        handlersStr += `  // 代理调用运行时执行器\n`
        for (const action of comp.events.click) {
          handlersStr += `  ${isAsync ? 'await ' : ''}executeAction(${JSON.stringify(action)})\n`
        }
        handlersStr += `}\n`
      }

      // Hover事件
      if (comp.events.hover && comp.events.hover.length > 0) {
        const isAsync = comp.events.hover.some((a: ActionConfig) => a.delay && a.delay > 0)
        handlersStr += `\n${isAsync ? 'async ' : ''}function handleEvent_${comp.id}_hover() {\n`
        handlersStr += `  // 代理调用运行时执行器\n`
        for (const action of comp.events.hover) {
          handlersStr += `  ${isAsync ? 'await ' : ''}executeAction(${JSON.stringify(action)})\n`
        }
        handlersStr += `}\n`
      }

      // DoubleClick事件
      if (comp.events.doubleClick && comp.events.doubleClick.length > 0) {
        const isAsync = comp.events.doubleClick.some((a) => a.delay && a.delay > 0)
        handlersStr += `\n${isAsync ? 'async ' : ''}function handleEvent_${comp.id}_doubleclick() {\n`
        handlersStr += `  // 代理调用运行时执行器\n`
        for (const action of comp.events.doubleClick) {
          handlersStr += `  ${isAsync ? 'await ' : ''}executeAction(${JSON.stringify(action)})\n`
        }
        handlersStr += `}\n`
      }
    }
  }

  return handlersStr || '// 无事件处理函数'
}

/**
 * 生成样式代码（与 RuntimeComponent.vue 保持一致）
 */
function generateStyle(): string {
  return `<style scoped>
.runtime-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* 动画效果（与 RuntimeComponent.vue 保持一致） */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.anim-fade {
  animation: fadeIn 0.8s ease both;
}

@keyframes zoomIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
.anim-zoom {
  animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes slideLeft {
  0% {
    transform: translateX(40px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.anim-slide-left {
  animation: slideLeft 0.6s ease-out both;
}

@keyframes slideUp {
  0% {
    transform: translateY(40px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.anim-slide-up {
  animation: slideUp 0.6s ease-out both;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
.anim-bounce {
  animation: bounceIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
}

@keyframes rotateIn {
  0% {
    transform: rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: rotate(0deg);
    opacity: 1;
  }
}
.anim-rotate {
  animation: rotateIn 0.7s ease-out both;
}

.animation-paused {
  animation-play-state: paused !important;
}

.animated {
  animation-fill-mode: both;
}

/* 高亮效果（与 useEventExecutor.ts 保持一致） */
@keyframes editor-highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

@keyframes editor-highlight-border {
  0%, 100% {
    border-color: rgba(64, 158, 255, 0.8);
  }
  50% {
    border-color: rgba(64, 158, 255, 0.3);
  }
}

.highlight-effect {
  position: relative;
  animation: editor-highlight-pulse 1s ease-in-out infinite;
  outline: 3px solid rgba(64, 158, 255, 0.8);
  outline-offset: 2px;
  border-radius: 4px;
  z-index: 9999;
}

.highlight-effect::before {
  content: '';
  position: absolute;
  inset: -6px;
  border: 2px dashed rgba(64, 158, 255, 0.6);
  border-radius: 8px;
  animation: editor-highlight-border 1s ease-in-out infinite;
  pointer-events: none;
}

/* 展开效果 */
.expanded {
  transform: scale(1.1);
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}
</style>`
}

/**
 * 将组件数据转换为JSON字符串
 */
export function componentsToJSON(components: Component[]): string {
  return JSON.stringify(components, null, 2)
}

/**
 * 从JSON字符串恢复组件数据
 */
export function JSONToComponents(json: string): Component[] {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    return []
  }
}
