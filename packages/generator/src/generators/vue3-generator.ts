/**
 * Vue3 代码生成器
 * 基于 IR 中间表示生成 Vue3 SFC 代码
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
  IRImport,
  IRVariable,
  IRFunction,
  IRLifecycleHook,
} from '../types/ir'

// ============================================================
// 组件名映射
// ============================================================

const COMPONENT_NAME_MAP: Record<string, string> = {
  // 图表组件 (保持原名)
  lineChart: 'lineChart',
  barChart: 'barChart',
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
  Container: 'vContainer',

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
  marker: 'vMarker',
  heatLayer: 'vHeatLayer',
  geoJsonLayer: 'vGeoJsonLayer',
  clusterLayer: 'vClusterLayer',
  tileLayer: 'vTileLayer',
  vectorLayer: 'vVectorLayer',
  legend: 'vLegend',
  scale: 'vScale',
  layers: 'vLayers',

  // 高级组件
  scripting: 'vScripting',
  state: 'vState',
  trigger: 'vTrigger',
}

// ============================================================
// Vue3 生成器类
// ============================================================

export class Vue3Generator {
  /**
   * 生成完整的 Vue3 SFC 代码
   */
  generate(ir: IRComponent): string {
    const template = this.generateTemplate(ir.template)
    const script = this.generateScript(ir.script)
    const style = this.generateStyle(ir.style)

    return `<template>
  <div class="runtime-container">
${template}
  </div>
</template>

${script}

${style}
`
  }

  // ============================================================
  // 模板生成
  // ============================================================

  /**
   * 生成模板代码
   */
  private generateTemplate(nodes: IRNode[]): string {
    return nodes.map((node) => this.generateElement(node, 4)).join('\n')
  }

  /**
   * 生成单个元素
   */
  private generateElement(node: IRNode, indent: number): string {
    const spaces = ' '.repeat(indent)
    const tagName = this.getVueComponentName(node.type)

    const attrs: string[] = []

    // 生成指令
    attrs.push(...this.generateDirectives(node.directives, node))

    // 生成 ID 和 data-component-id
    const hasForDirective = node.directives.some((d) => d.type === 'for')
    if (hasForDirective) {
      const forDir = node.directives.find((d) => d.type === 'for')
      if (forDir && forDir.type === 'for') {
        attrs.push(`:id="\`${node.id}-\${${forDir.indexName}}\`"`)
        attrs.push(`:data-component-id="\`${node.id}-\${${forDir.indexName}}\`"`)
      }
    } else {
      attrs.push(`:id="'${node.id}'"`)
      attrs.push(`:data-component-id="'${node.id}'"`)
    }

    // 生成 ref
    attrs.push(`:ref="setComponentRef('${node.id}')"`)

    // 生成 class
    if (node.classes.length > 0) {
      const classExpr = JSON.stringify(node.classes)
      attrs.push(`:class="${classExpr}"`)
    }

    // 生成 style
    if (Object.keys(node.style).length > 0) {
      const styleStr = JSON.stringify(node.style)
      attrs.push(`:style='${styleStr}'`)
    }

    // 生成 props
    for (const prop of node.props) {
      if (prop.isDynamic) {
        attrs.push(`:${prop.name}="${prop.expression}"`)
      } else if (typeof prop.value === 'string') {
        attrs.push(`${prop.name}="${prop.value}"`)
      } else {
        attrs.push(`:${prop.name}='${JSON.stringify(prop.value)}'`)
      }
    }

    // 生成事件
    attrs.push(...this.generateEventBindings(node.events))

    // 构建属性字符串
    const attrLines = attrs.map((attr) => `${spaces}  ${attr}`).join('\n')

    // 生成子内容
    const hasChildren = node.children.length > 0
    const hasSlots = node.slots.length > 0
    const hasTextContent = !!node.textContent

    if (!hasChildren && !hasSlots && !hasTextContent) {
      // 自闭合标签
      return `${spaces}<${tagName}\n${attrLines}\n${spaces}/>`
    }

    let content = ''

    // 生成插槽内容
    for (const slot of node.slots) {
      content += this.generateSlot(slot, indent + 2)
    }

    // 生成子节点
    for (const child of node.children) {
      content += this.generateElement(child, indent + 2) + '\n'
    }

    // 生成文本内容
    if (hasTextContent) {
      content += `${spaces}  {{ ${JSON.stringify(node.textContent)} }}\n`
    }

    return `${spaces}<${tagName}\n${attrLines}\n${spaces}>\n${content}${spaces}</${tagName}>`
  }

  /**
   * 生成指令
   */
  private generateDirectives(directives: IRDirective[], node: IRNode): string[] {
    const result: string[] = []

    for (const directive of directives) {
      switch (directive.type) {
        case 'if':
          result.push(`v-if="${directive.condition}"`)
          break
        case 'else-if':
          result.push(`v-else-if="${directive.condition}"`)
          break
        case 'else':
          result.push('v-else')
          break
        case 'show':
          result.push(`v-show="${directive.condition}"`)
          break
        case 'for':
          result.push(
            `v-for="(${directive.itemName}, ${directive.indexName}) in ${directive.iterable}"`
          )
          result.push(`:key="${directive.keyExpr || directive.indexName}"`)
          break
        case 'model':
          const modifiers = directive.modifiers?.length
            ? '.' + directive.modifiers.join('.')
            : ''
          result.push(`v-model${modifiers}="${directive.value}"`)
          break
        case 'custom':
          const arg = directive.arg ? `:${directive.arg}` : ''
          const mods = directive.modifiers?.length
            ? '.' + directive.modifiers.join('.')
            : ''
          const val = directive.value ? `="${directive.value}"` : ''
          result.push(`v-${directive.name}${arg}${mods}${val}`)
          break
      }
    }

    return result
  }

  /**
   * 生成事件绑定
   */
  private generateEventBindings(events: IREvent[]): string[] {
    const result: string[] = []

    for (const event of events) {
      const modifiers = event.modifiers?.length
        ? '.' + event.modifiers.join('.')
        : ''
      result.push(`@${event.name}${modifiers}="${event.handler}"`)
    }

    return result
  }

  /**
   * 生成插槽
   */
  private generateSlot(slot: IRSlot, indent: number): string {
    const spaces = ' '.repeat(indent)

    if (slot.name === 'default' && !slot.slotProps?.length) {
      // 默认插槽不需要 template 包装
      return slot.children
        .map((child) => this.generateElement(child, indent))
        .join('\n') + '\n'
    }

    const scopeAttr = slot.slotProps?.length
      ? `="{ ${slot.slotProps.join(', ')} }"`
      : ''

    let content = `${spaces}<template #${slot.name}${scopeAttr}>\n`
    for (const child of slot.children) {
      content += this.generateElement(child, indent + 2) + '\n'
    }
    content += `${spaces}</template>\n`

    return content
  }

  /**
   * 获取 Vue 组件名
   */
  private getVueComponentName(type: string): string {
    return COMPONENT_NAME_MAP[type] || type
  }

  // ============================================================
  // 脚本生成 (使用 Babel AST)
  // ============================================================

  /**
   * 生成脚本代码
   */
  private generateScript(script: IRScriptContext): string {
    const statements: t.Statement[] = []

    // 生成导入语句
    for (const imp of script.imports) {
      statements.push(this.generateImport(imp))
    }

    // 添加类型导入
    statements.push(
      t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier('ComponentPublicInstance'),
            t.identifier('ComponentPublicInstance')
          ),
        ],
        t.stringLiteral('vue')
      )
    )

    // 生成变量声明
    for (const variable of script.variables) {
      statements.push(this.generateVariable(variable))
    }

    // 生成函数声明
    for (const func of script.functions) {
      statements.push(this.generateFunction(func))
    }

    // 生成生命周期钩子
    for (const lifecycle of script.lifecycles) {
      statements.push(this.generateLifecycle(lifecycle))
    }

    // 生成 AST
    const ast = t.file(t.program(statements))
    const { code } = generate(ast, {
      retainLines: false,
      compact: false,
    })

    return `<script setup lang="ts">
${code}
</script>`
  }

  /**
   * 生成导入语句
   */
  private generateImport(imp: IRImport): t.ImportDeclaration {
    const specifiers: (
      | t.ImportSpecifier
      | t.ImportDefaultSpecifier
      | t.ImportNamespaceSpecifier
    )[] = []

    for (const spec of imp.specifiers) {
      switch (spec.type) {
        case 'default':
          specifiers.push(t.importDefaultSpecifier(t.identifier(spec.local)))
          break
        case 'named':
          specifiers.push(
            t.importSpecifier(
              t.identifier(spec.local),
              t.identifier(spec.imported)
            )
          )
          break
        case 'namespace':
          specifiers.push(t.importNamespaceSpecifier(t.identifier(spec.local)))
          break
      }
    }

    return t.importDeclaration(specifiers, t.stringLiteral(imp.source))
  }

  /**
   * 生成变量声明
   */
  private generateVariable(variable: IRVariable): t.VariableDeclaration {
    // 解析变量名 (处理解构)
    let id: t.LVal
    if (variable.name.startsWith('{')) {
      // 对象解构
      const pattern = variable.name.slice(1, -1).trim()
      const properties = pattern.split(',').map((p) => {
        const parts = p.trim().split(':')
        if (parts.length === 2) {
          return t.objectProperty(
            t.identifier(parts[0].trim()),
            t.identifier(parts[1].trim())
          )
        }
        return t.objectProperty(
          t.identifier(parts[0].trim()),
          t.identifier(parts[0].trim()),
          false,
          true
        )
      })
      id = t.objectPattern(properties)
    } else {
      id = t.identifier(variable.name)
    }

    // 解析初始化表达式
    let init: t.Expression | null = null
    if (variable.init) {
      // 使用标识符作为占位符，实际代码将使用 raw
      init = t.identifier('__PLACEHOLDER__')
    }

    const kind = variable.kind as 'const' | 'let' | 'var'

    // 由于 Babel 无法直接解析复杂的初始化表达式，我们使用注释标记
    const decl = t.variableDeclaration(kind, [t.variableDeclarator(id, init)])

    // 添加原始代码作为注释
    if (variable.init) {
      t.addComment(decl, 'leading', ` @init: ${variable.init} `, false)
    }

    return decl
  }

  /**
   * 生成函数声明
   */
  private generateFunction(func: IRFunction): t.FunctionDeclaration {
    const params = func.params.map((p) => {
      const param = t.identifier(p.name)
      if (p.type) {
        param.typeAnnotation = t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier(p.type))
        )
      }
      return param
    })

    // 创建空函数体
    const body = t.blockStatement([])

    const decl = t.functionDeclaration(
      t.identifier(func.name),
      params,
      body,
      false,
      func.async
    )

    // 添加函数体作为注释
    t.addComment(decl, 'leading', ` @body: ${func.body} `, false)

    return decl
  }

  /**
   * 生成生命周期钩子
   */
  private generateLifecycle(lifecycle: IRLifecycleHook): t.ExpressionStatement {
    const call = t.callExpression(t.identifier(lifecycle.name), [
      t.arrowFunctionExpression([], t.blockStatement([])),
    ])

    const stmt = t.expressionStatement(call)

    // 添加回调函数体作为注释
    t.addComment(stmt, 'leading', ` @body: ${lifecycle.body} `, false)

    return stmt
  }

  // ============================================================
  // 样式生成
  // ============================================================

  /**
   * 生成样式代码
   */
  private generateStyle(style: IRStyleContext): string {
    const scopedAttr = style.scoped ? ' scoped' : ''
    const langAttr = style.lang && style.lang !== 'css' ? ` lang="${style.lang}"` : ''

    let css = ''

    // 生成关键帧动画
    for (const keyframe of style.keyframes) {
      css += `@keyframes ${keyframe.name} {\n`
      for (const frame of keyframe.frames) {
        css += `  ${frame.selector} {\n`
        for (const [prop, value] of Object.entries(frame.declarations)) {
          css += `    ${prop}: ${value};\n`
        }
        css += '  }\n'
      }
      css += '}\n\n'
    }

    // 生成样式规则
    for (const rule of style.rules) {
      css += `${rule.selector} {\n`
      for (const [prop, value] of Object.entries(rule.declarations)) {
        css += `  ${prop}: ${value};\n`
      }
      css += '}\n\n'
    }

    // 添加预定义的动画类
    css += this.generateAnimationClasses()

    return `<style${scopedAttr}${langAttr}>
${css}</style>`
  }

  /**
   * 生成动画类
   */
  private generateAnimationClasses(): string {
    return `.anim-fade {
  animation: fadeIn 0.8s ease both;
}

.anim-zoom {
  animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.anim-slide-left {
  animation: slideLeft 0.6s ease-out both;
}

.anim-slide-up {
  animation: slideUp 0.6s ease-out both;
}

.anim-bounce {
  animation: bounceIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
}

.anim-rotate {
  animation: rotateIn 0.7s ease-out both;
}

.animation-paused {
  animation-play-state: paused !important;
}

/* 高亮效果 */
@keyframes editor-highlight-pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7); }
  50% { box-shadow: 0 0 0 12px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}

.highlight-effect {
  position: relative;
  animation: editor-highlight-pulse 1s ease-in-out infinite;
  outline: 3px solid rgba(64, 158, 255, 0.8);
  outline-offset: 2px;
  border-radius: 4px;
  z-index: 9999;
}
`
  }
}

// ============================================================
// 简化版生成函数 (不使用完整 AST)
// ============================================================

/**
 * 简化版 Vue3 代码生成
 * 直接使用字符串拼接，更可靠
 */
export function generateVue3Code(ir: IRComponent): string {
  const generator = new Vue3SimpleGenerator()
  return generator.generate(ir)
}

/**
 * 简化版生成器
 */
class Vue3SimpleGenerator {
  generate(ir: IRComponent): string {
    const template = this.generateTemplate(ir.template)
    const script = this.generateScript(ir.script)
    const style = this.generateStyle(ir.style)

    return `<template>
  <div class="runtime-container">
${template}
  </div>
</template>

${script}

${style}
`
  }

  private generateTemplate(nodes: IRNode[]): string {
    return nodes.map((node) => this.generateElement(node, 4)).join('\n')
  }

  private generateElement(node: IRNode, indent: number): string {
    const spaces = ' '.repeat(indent)
    const tagName = COMPONENT_NAME_MAP[node.type] || node.type

    let html = `${spaces}<${tagName}\n`

    // 指令
    for (const directive of node.directives) {
      html += this.generateDirective(directive, spaces)
    }

    // ID
    const hasFor = node.directives.some((d) => d.type === 'for')
    if (hasFor) {
      const forDir = node.directives.find((d) => d.type === 'for')
      if (forDir && forDir.type === 'for') {
        html += `${spaces}  :id="\`${node.id}-\${${forDir.indexName}}\`"\n`
        html += `${spaces}  :data-component-id="\`${node.id}-\${${forDir.indexName}}\`"\n`
      }
    } else {
      html += `${spaces}  :id="'${node.id}'"\n`
      html += `${spaces}  :data-component-id="'${node.id}'"\n`
    }

    // ref
    html += `${spaces}  :ref="setComponentRef('${node.id}')"\n`

    // class
    if (node.classes.length > 0) {
      html += `${spaces}  :class="${JSON.stringify(node.classes)}"\n`
    }

    // style
    if (Object.keys(node.style).length > 0) {
      html += `${spaces}  :style='${JSON.stringify(node.style)}'\n`
    }

    // props
    for (const prop of node.props) {
      if (prop.isDynamic) {
        html += `${spaces}  :${prop.name}="${prop.expression}"\n`
      } else if (typeof prop.value === 'string') {
        html += `${spaces}  ${prop.name}="${prop.value}"\n`
      } else {
        html += `${spaces}  :${prop.name}='${JSON.stringify(prop.value)}'\n`
      }
    }

    // events
    for (const event of node.events) {
      const mods = event.modifiers?.length ? '.' + event.modifiers.join('.') : ''
      html += `${spaces}  @${event.name}${mods}="${event.handler}"\n`
    }

    // children / slots / text
    const hasChildren = node.children.length > 0
    const hasSlots = node.slots.length > 0
    const hasText = !!node.textContent

    if (!hasChildren && !hasSlots && !hasText) {
      html += `${spaces}/>\n`
    } else {
      html += `${spaces}>\n`

      for (const slot of node.slots) {
        html += this.generateSlot(slot, indent + 2)
      }

      for (const child of node.children) {
        html += this.generateElement(child, indent + 2)
      }

      if (hasText) {
        html += `${spaces}  {{ ${JSON.stringify(node.textContent)} }}\n`
      }

      html += `${spaces}</${tagName}>\n`
    }

    return html
  }

  private generateDirective(directive: IRDirective, spaces: string): string {
    switch (directive.type) {
      case 'if':
        return `${spaces}  v-if="${directive.condition}"\n`
      case 'else-if':
        return `${spaces}  v-else-if="${directive.condition}"\n`
      case 'else':
        return `${spaces}  v-else\n`
      case 'show':
        return `${spaces}  v-show="${directive.condition}"\n`
      case 'for':
        return (
          `${spaces}  v-for="(${directive.itemName}, ${directive.indexName}) in ${directive.iterable}"\n` +
          `${spaces}  :key="${directive.keyExpr || directive.indexName}"\n`
        )
      case 'model':
        const mods = directive.modifiers?.length ? '.' + directive.modifiers.join('.') : ''
        return `${spaces}  v-model${mods}="${directive.value}"\n`
      case 'custom':
        const arg = directive.arg ? `:${directive.arg}` : ''
        const modifiers = directive.modifiers?.length ? '.' + directive.modifiers.join('.') : ''
        const val = directive.value ? `="${directive.value}"` : ''
        return `${spaces}  v-${directive.name}${arg}${modifiers}${val}\n`
      default:
        return ''
    }
  }

  private generateSlot(slot: IRSlot, indent: number): string {
    const spaces = ' '.repeat(indent)

    if (slot.name === 'default' && !slot.slotProps?.length) {
      return slot.children.map((c) => this.generateElement(c, indent)).join('')
    }

    const scope = slot.slotProps?.length ? `="{ ${slot.slotProps.join(', ')} }"` : ''
    let html = `${spaces}<template #${slot.name}${scope}>\n`
    for (const child of slot.children) {
      html += this.generateElement(child, indent + 2)
    }
    html += `${spaces}</template>\n`
    return html
  }

  private generateScript(script: IRScriptContext): string {
    let code = ''

    // imports
    for (const imp of script.imports) {
      const specs = imp.specifiers
        .map((s) => {
          if (s.type === 'default') return s.local
          if (s.type === 'namespace') return `* as ${s.local}`
          return s.imported === s.local ? s.local : `${s.imported} as ${s.local}`
        })
        .join(', ')
      code += `import { ${specs} } from '${imp.source}'\n`
    }

    code += `import type { ComponentPublicInstance } from 'vue'\n\n`

    // variables
    for (const variable of script.variables) {
      if (variable.typeAnnotation) {
        code += `${variable.kind} ${variable.name}: ${variable.typeAnnotation} = ${variable.init}\n`
      } else {
        code += `${variable.kind} ${variable.name} = ${variable.init}\n`
      }
    }

    code += '\n'

    // functions
    for (const func of script.functions) {
      const params = func.params
        .map((p) => (p.type ? `${p.name}: ${p.type}` : p.name))
        .join(', ')
      const asyncKeyword = func.async ? 'async ' : ''
      const returnType = func.returnType ? `: ${func.returnType}` : ''
      code += `${asyncKeyword}function ${func.name}(${params})${returnType} {\n${func.body}\n}\n\n`
    }

    // lifecycles
    for (const lifecycle of script.lifecycles) {
      code += `${lifecycle.name}(() => {\n${lifecycle.body}\n})\n\n`
    }

    return `<script setup lang="ts">
${code}</script>`
  }

  private generateStyle(style: IRStyleContext): string {
    const scoped = style.scoped ? ' scoped' : ''
    let css = ''

    // keyframes
    for (const kf of style.keyframes) {
      css += `@keyframes ${kf.name} {\n`
      for (const frame of kf.frames) {
        css += `  ${frame.selector} {\n`
        for (const [prop, val] of Object.entries(frame.declarations)) {
          css += `    ${prop}: ${val};\n`
        }
        css += '  }\n'
      }
      css += '}\n\n'
    }

    // rules
    for (const rule of style.rules) {
      css += `${rule.selector} {\n`
      for (const [prop, val] of Object.entries(rule.declarations)) {
        css += `  ${prop}: ${val};\n`
      }
      css += '}\n\n'
    }

    // animation classes
    css += `.anim-fade { animation: fadeIn 0.8s ease both; }
.anim-zoom { animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both; }
.anim-slide-left { animation: slideLeft 0.6s ease-out both; }
.anim-slide-up { animation: slideUp 0.6s ease-out both; }
.anim-bounce { animation: bounceIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) both; }
.anim-rotate { animation: rotateIn 0.7s ease-out both; }
.animation-paused { animation-play-state: paused !important; }
.animated { animation-fill-mode: both; }

@keyframes editor-highlight-pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7); }
  50% { box-shadow: 0 0 0 12px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}

.highlight-effect {
  position: relative;
  animation: editor-highlight-pulse 1s ease-in-out infinite;
  outline: 3px solid rgba(64, 158, 255, 0.8);
  outline-offset: 2px;
  border-radius: 4px;
  z-index: 9999;
}
`

    return `<style${scoped}>
${css}</style>`
  }
}
