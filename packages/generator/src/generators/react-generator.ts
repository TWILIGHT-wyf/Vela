/**
 * React 代码生成器
 * 基于 IR 中间表示生成 React TSX 代码
 */

import * as t from '@babel/types'
import generate from '@babel/generator'
import type {
  IRNode,
  IRComponent,
  IRScriptContext,
  IRStyleContext,
  IRDirective,
  IREvent,
  IRSlot,
  IRProp,
} from '../types/ir'

// ============================================================
// React 组件名映射
// ============================================================

const REACT_COMPONENT_MAP: Record<string, string> = {
  // 基础组件映射到 React 组件名
  Text: 'Text',
  box: 'Box',
  stat: 'Stat',
  countUp: 'CountUp',
  progress: 'Progress',
  badge: 'Badge',
  table: 'Table',
  list: 'List',
  select: 'Select',
  row: 'Row',
  col: 'Col',
  flex: 'Flex',
  grid: 'Grid',
  modal: 'Modal',
  panel: 'Panel',
  tabs: 'Tabs',
  Container: 'Container',
  image: 'Image',
  video: 'Video',
  Group: 'Group',
  map: 'Map',
  // 图表组件 - 使用 ReactECharts (echarts-for-react)
  lineChart: 'ReactECharts',
  barChart: 'ReactECharts',
  pieChart: 'ReactECharts',
  doughnutChart: 'ReactECharts',
  scatterChart: 'ReactECharts',
  radarChart: 'ReactECharts',
  gaugeChart: 'ReactECharts',
  funnelChart: 'ReactECharts',
  sankeyChart: 'ReactECharts',
}

// 图表类型映射 (用于生成 ECharts option)
const ECHARTS_TYPE_MAP: Record<string, string> = {
  lineChart: 'line',
  barChart: 'bar',
  pieChart: 'pie',
  doughnutChart: 'pie', // 圆环图是 pie 的变体
  scatterChart: 'scatter',
  radarChart: 'radar',
  gaugeChart: 'gauge',
  funnelChart: 'funnel',
  sankeyChart: 'sankey',
}

// 判断是否是图表组件
function isChartComponent(type: string): boolean {
  return type in ECHARTS_TYPE_MAP
}

// ============================================================
// React 生成器类
// ============================================================

export class ReactGenerator {
  private imports: Map<string, Set<string>> = new Map()
  private stateDeclarations: string[] = []
  private effectDeclarations: string[] = []
  private handlerDeclarations: string[] = []

  /**
   * 生成完整的 React TSX 代码
   */
  generate(ir: IRComponent): string {
    // 重置状态
    this.imports = new Map()
    this.stateDeclarations = []
    this.effectDeclarations = []
    this.handlerDeclarations = []

    // 收集所需的导入
    this.collectImports(ir)

    // 生成 JSX
    const jsx = this.generateJSX(ir.template)

    // 生成完整代码
    const code = this.assembleCode(ir, jsx)

    return code
  }

  // ============================================================
  // 导入收集
  // ============================================================

  private collectImports(ir: IRComponent): void {
    // React 核心
    this.addImport('react', ['useState', 'useEffect', 'useCallback', 'useRef', 'useMemo'])

    // 收集组件库导入
    const componentNames = new Set<string>()
    this.collectComponentNames(ir.template, componentNames)

    if (componentNames.size > 0) {
      for (const name of componentNames) {
        this.addImport('@vela/ui-react', [name])
      }
    }

    // 样式导入
    this.addImport('@vela/ui-react/dist/style.css', [])
  }

  private collectComponentNames(nodes: IRNode[], names: Set<string>): void {
    for (const node of nodes) {
      const reactName = REACT_COMPONENT_MAP[node.type]
      if (reactName && !this.isNativeElement(node.type)) {
        names.add(reactName)
      }
      this.collectComponentNames(node.children, names)
      for (const slot of node.slots) {
        this.collectComponentNames(slot.children, names)
      }
    }
  }

  private addImport(source: string, specifiers: string[]): void {
    if (!this.imports.has(source)) {
      this.imports.set(source, new Set())
    }
    for (const spec of specifiers) {
      if (spec) {
        this.imports.get(source)!.add(spec)
      }
    }
  }

  private isNativeElement(type: string): boolean {
    const natives = ['div', 'span', 'button', 'input', 'img', 'video', 'a', 'p', 'h1', 'h2', 'h3']
    return natives.includes(type.toLowerCase())
  }

  // ============================================================
  // JSX 生成
  // ============================================================

  private generateJSX(nodes: IRNode[]): string {
    if (nodes.length === 0) {
      return '<></>'
    }

    if (nodes.length === 1) {
      return this.generateElement(nodes[0], 4)
    }

    // 多个根节点使用 Fragment
    const children = nodes.map((n) => this.generateElement(n, 6)).join('\n')
    return `<>\n${children}\n    </>`
  }

  private generateElement(node: IRNode, indent: number): string {
    const spaces = ' '.repeat(indent)
    const tagName = this.getReactComponentName(node.type)

    // 检查是否有 v-for 指令
    const forDirective = node.directives.find((d) => d.type === 'for')
    const ifDirective = node.directives.find((d) => d.type === 'if')
    const showDirective = node.directives.find((d) => d.type === 'show')

    let element = ''

    // 处理 v-if -> 条件渲染
    if (ifDirective && ifDirective.type === 'if') {
      element = this.wrapWithCondition(
        ifDirective.condition!,
        () => this.generateBaseElement(node, tagName, indent, forDirective),
        indent
      )
    } else {
      element = this.generateBaseElement(node, tagName, indent, forDirective)
    }

    // 处理 v-for -> map
    if (forDirective && forDirective.type === 'for') {
      element = this.wrapWithMap(forDirective, element, indent)
    }

    return element
  }

  private generateBaseElement(
    node: IRNode,
    tagName: string,
    indent: number,
    forDirective: IRDirective | undefined
  ): string {
    const spaces = ' '.repeat(indent)
    const attrs: string[] = []

    // 生成 key (如果在循环中)
    if (forDirective && forDirective.type === 'for') {
      attrs.push(`key={${forDirective.indexName}}`)
    }

    // 生成 id
    if (forDirective && forDirective.type === 'for') {
      attrs.push(`id={\`${node.id}-\${${forDirective.indexName}}\`}`)
      attrs.push(`data-component-id={\`${node.id}-\${${forDirective.indexName}}\`}`)
    } else {
      attrs.push(`id="${node.id}"`)
      attrs.push(`data-component-id="${node.id}"`)
    }

    // 生成 ref
    attrs.push(`ref={(el) => { if (el) componentRefs.current['${node.id}'] = el }}`)

    // 生成 className
    if (node.classes.length > 0) {
      attrs.push(`className="${node.classes.join(' ')}"`)
    }

    // 生成 style
    if (Object.keys(node.style).length > 0) {
      const styleObj = this.convertStyleToReact(node.style as Record<string, unknown>)
      attrs.push(`style={${JSON.stringify(styleObj)}}`)
    }

    // v-show -> style.display
    const showDirective = node.directives.find((d) => d.type === 'show')
    if (showDirective && showDirective.type === 'show') {
      attrs.push(`style={{ ...style, display: ${showDirective.condition} ? undefined : 'none' }}`)
    }

    // 生成 props
    for (const prop of node.props) {
      attrs.push(this.generateProp(prop))
    }

    // 生成事件
    for (const event of node.events) {
      attrs.push(this.generateEvent(event))
    }

    // 构建属性字符串
    const attrStr = attrs.map((a) => `${spaces}  ${a}`).join('\n')

    // 生成子内容
    const hasChildren = node.children.length > 0
    const hasSlots = node.slots.length > 0
    const hasText = !!node.textContent

    if (!hasChildren && !hasSlots && !hasText) {
      return `${spaces}<${tagName}\n${attrStr}\n${spaces}/>`
    }

    let content = ''

    // 生成子节点
    for (const child of node.children) {
      content += this.generateElement(child, indent + 2) + '\n'
    }

    // 生成插槽 (React 中使用 children 或 render props)
    for (const slot of node.slots) {
      content += this.generateSlotAsChildren(slot, indent + 2)
    }

    // 生成文本内容
    if (hasText) {
      content += `${spaces}  {${JSON.stringify(node.textContent)}}\n`
    }

    return `${spaces}<${tagName}\n${attrStr}\n${spaces}>\n${content}${spaces}</${tagName}>`
  }

  private wrapWithCondition(condition: string, elementFn: () => string, indent: number): string {
    const spaces = ' '.repeat(indent)
    const element = elementFn()
    return `{${condition} && (\n${element}\n${spaces})}`
  }

  private wrapWithMap(forDirective: IRDirective & { type: 'for' }, element: string, indent: number): string {
    const spaces = ' '.repeat(indent)
    return `{${forDirective.iterable}.map((${forDirective.itemName}, ${forDirective.indexName}) => (\n${element}\n${spaces}))}`
  }

  private generateProp(prop: IRProp): string {
    if (prop.isDynamic) {
      return `${prop.name}={${prop.expression}}`
    }

    if (typeof prop.value === 'string') {
      return `${prop.name}="${prop.value}"`
    }

    if (typeof prop.value === 'boolean') {
      return prop.value ? prop.name : `${prop.name}={false}`
    }

    return `${prop.name}={${JSON.stringify(prop.value)}}`
  }

  private generateEvent(event: IREvent): string {
    const reactEventName = this.toReactEventName(event.name)
    return `${reactEventName}={${event.handler}}`
  }

  private generateSlotAsChildren(slot: IRSlot, indent: number): string {
    if (slot.name === 'default') {
      return slot.children.map((c) => this.generateElement(c, indent)).join('\n')
    }

    // 命名插槽转换为 render prop
    const spaces = ' '.repeat(indent)
    const propName = `render${slot.name.charAt(0).toUpperCase()}${slot.name.slice(1)}`
    const children = slot.children.map((c) => this.generateElement(c, indent + 2)).join('\n')

    if (slot.slotProps?.length) {
      return `${spaces}${propName}={({ ${slot.slotProps.join(', ')} }) => (\n${children}\n${spaces})}`
    }

    return `${spaces}${propName}={() => (\n${children}\n${spaces})}`
  }

  private getReactComponentName(type: string): string {
    if (this.isNativeElement(type)) {
      return type.toLowerCase()
    }
    return REACT_COMPONENT_MAP[type] || type
  }

  private toReactEventName(eventName: string): string {
    const map: Record<string, string> = {
      click: 'onClick',
      mouseenter: 'onMouseEnter',
      mouseleave: 'onMouseLeave',
      dblclick: 'onDoubleClick',
      change: 'onChange',
      input: 'onInput',
      submit: 'onSubmit',
      focus: 'onFocus',
      blur: 'onBlur',
      keydown: 'onKeyDown',
      keyup: 'onKeyUp',
      keypress: 'onKeyPress',
    }
    return map[eventName.toLowerCase()] || `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
  }

  private convertStyleToReact(style: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(style)) {
      // 将 kebab-case 转换为 camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = value
    }
    return result
  }

  // ============================================================
  // 代码组装
  // ============================================================

  private assembleCode(ir: IRComponent, jsx: string): string {
    let code = ''

    // 导入语句
    for (const [source, specifiers] of this.imports) {
      if (specifiers.size === 0) {
        code += `import '${source}'\n`
      } else {
        const specs = Array.from(specifiers).join(', ')
        code += `import { ${specs} } from '${source}'\n`
      }
    }

    code += '\n'

    // 类型定义
    code += `interface ComponentData {
  id: string
  props: Record<string, unknown>
  style: Record<string, unknown>
}

`

    // 组件函数
    code += `export default function ${ir.name}() {\n`

    // Refs
    code += `  const componentRefs = useRef<Record<string, HTMLElement | null>>({})\n\n`

    // State
    code += `  const [componentsData, setComponentsData] = useState<ComponentData[]>(${this.generateInitialState(ir)})\n\n`

    // 生成事件处理函数
    code += this.generateEventHandlers(ir.script)

    // useEffect for data binding
    code += `  useEffect(() => {
    // 数据绑定引擎
    console.log('Component mounted, refs:', componentRefs.current)
  }, [])\n\n`

    // Return JSX
    code += `  return (\n    <div className="runtime-container">\n`
    code += `      ${jsx}\n`
    code += `    </div>\n  )\n`
    code += `}\n`

    return code
  }

  private generateInitialState(ir: IRComponent): string {
    const data = ir.template.map((node) => ({
      id: node.id,
      props: Object.fromEntries(
        node.props
          .filter((p) => !p.isDynamic)
          .map((p) => [p.name, p.value])
      ),
      style: node.style,
    }))
    return JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')
  }

  private generateEventHandlers(script: IRScriptContext): string {
    let code = ''

    for (const func of script.functions) {
      const params = func.params.map((p) => (p.type ? `${p.name}: ${p.type}` : p.name)).join(', ')
      const asyncKeyword = func.async ? 'async ' : ''

      code += `  const ${func.name} = useCallback(${asyncKeyword}(${params}) => {\n`
      code += `    ${func.body.split('\n').join('\n    ')}\n`
      code += `  }, [])\n\n`
    }

    return code
  }
}

// ============================================================
// 简化版 React 生成函数
// ============================================================

/**
 * 生成 React TSX 代码
 */
export function generateReactCode(ir: IRComponent): string {
  const generator = new ReactGenerator()
  return generator.generate(ir)
}

/**
 * 生成完整的 React 组件文件 (带 CSS Module)
 */
export function generateReactFiles(ir: IRComponent): { tsx: string; css: string } {
  const generator = new ReactGenerator()
  const tsx = generator.generate(ir)

  // 生成 CSS
  let css = `.runtime-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
}

.animated {
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.anim-fade {
  animation: fadeIn 0.8s ease both;
}

@keyframes zoomIn {
  0% { transform: scale(0.3); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: scale(1); }
}

.anim-zoom {
  animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes slideLeft {
  0% { transform: translateX(40px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.anim-slide-left {
  animation: slideLeft 0.6s ease-out both;
}

@keyframes slideUp {
  0% { transform: translateY(40px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.anim-slide-up {
  animation: slideUp 0.6s ease-out both;
}
`

  return { tsx, css }
}
