import type {
  ActionConfig,
  Component as LegacyRuntimeComponent,
  JSExpression,
  LoopConfig,
} from '../../components'
import type { ReactPage, ReactProject } from '../../generators/react-project-generator'
import type {
  Component as LegacyVueComponent,
  Page as LegacyVuePage,
  Project as LegacyVueProject,
} from '../../projectGenerator'
import type { IRNode, IRPage, IRProject } from '../../pipeline/ir/ir'
import { createDiagnostic, type CompileDiagnostic } from '../../pipeline/validate/diagnostics'

const ROOT_WRAPPER_COMPONENTS = new Set(['page', 'fragment', 'layout', 'dialog', 'container'])

function toSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'page'
}

function isExpressionLike(value: unknown): value is { type: string; value: string } {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.type === 'string' && typeof record.value === 'string'
}

function toLegacyExpression(value: unknown): string | boolean | JSExpression | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  if (isExpressionLike(value)) {
    return { type: 'JSExpression', value: value.value }
  }
  return undefined
}

function toLegacyLoop(loop: IRNode['repeat']): LoopConfig | undefined {
  if (!loop) {
    return undefined
  }

  const source = loop.source
  if (Array.isArray(source)) {
    return {
      data: source,
      itemArg: loop.itemAlias,
      indexArg: loop.indexAlias,
    }
  }

  if (isExpressionLike(source)) {
    return {
      data: { type: 'JSExpression', value: source.value },
      itemArg: loop.itemAlias,
      indexArg: loop.indexAlias,
    }
  }

  return undefined
}

function toLegacyAction(action: unknown, index: number): ActionConfig {
  if (typeof action === 'string') {
    return {
      id: `action_ref_${index}`,
      type: 'actionRef',
      ref: action,
    }
  }

  if (typeof action === 'object' && action !== null) {
    const record = action as Record<string, unknown>
    if (typeof record.id === 'string' && typeof record.type === 'string') {
      return {
        id: record.id,
        type: record.type,
        ...record,
      }
    }
    if (record.type === 'ref' && typeof record.id === 'string') {
      return {
        id: record.id,
        type: 'actionRef',
        ...record,
      }
    }
  }

  return {
    id: `action_unknown_${index}`,
    type: 'unknown',
    payload: action,
  }
}

function toLegacyEvents(
  events: IRNode['events'],
  diagnostics: CompileDiagnostic[],
  path: string,
): LegacyRuntimeComponent['events'] | undefined {
  if (!events) {
    return undefined
  }

  const mapped: NonNullable<LegacyRuntimeComponent['events']> = {}
  for (const [eventName, actions] of Object.entries(events)) {
    const normalizedName =
      eventName === 'mouseenter' ? 'hover' : eventName === 'dblclick' ? 'doubleClick' : eventName

    if (
      normalizedName !== 'click' &&
      normalizedName !== 'hover' &&
      normalizedName !== 'doubleClick'
    ) {
      diagnostics.push(
        createDiagnostic(
          'warning',
          'EVENT_UNSUPPORTED_IN_COMPAT_MODE',
          `Event "${eventName}" is not supported in legacy emitter and will be ignored`,
          path,
        ),
      )
      continue
    }

    mapped[normalizedName] = actions.map((action, index) => toLegacyAction(action, index))
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}

function toLegacyCssLength(value: unknown, fallback: number): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return `${fallback}px`
}

function toLegacyNumericSize(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

function buildLegacyStyle(node: IRNode): Record<string, unknown> {
  const style: Record<string, unknown> = { ...(node.style as Record<string, unknown> | undefined) }
  const rotate = node.layout.rotate
  const width = toLegacyCssLength(node.layout.width, 100)
  const height = toLegacyCssLength(node.layout.height, 100)

  if (node.layout.mode === 'free') {
    style.position = 'absolute'
    style.left = `${node.layout.x}px`
    style.top = `${node.layout.y}px`
    style.width = width
    style.height = height
    style.zIndex = node.layout.zIndex
    if (rotate !== 0) {
      style.transform = `rotate(${rotate}deg)`
    }
  } else {
    style.position = style.position || 'relative'
    if (style.width === undefined && node.layout.width !== undefined) {
      style.width = toLegacyCssLength(node.layout.width, 100)
    }
    if (style.height === undefined && node.layout.height !== undefined) {
      style.height = toLegacyCssLength(node.layout.height, 100)
    }
    if (node.layout.order !== undefined) {
      style.order = node.layout.order
    }
  }

  return style
}

function toLegacyAnimation(node: IRNode): LegacyRuntimeComponent['animation'] {
  const animation = node.animation
  if (!animation) {
    return undefined
  }

  const legacyClassName = animation.className || (animation as { class?: string }).class
  if (!legacyClassName) {
    return undefined
  }

  const triggerMap: Record<string, 'load' | 'hover' | 'click'> = {
    init: 'load',
    visible: 'load',
    hover: 'hover',
    click: 'click',
  }
  const trigger = animation.trigger ? triggerMap[animation.trigger] : 'load'

  return {
    class: legacyClassName,
    trigger: trigger || 'load',
    duration: animation.duration !== undefined ? animation.duration / 1000 : undefined,
    delay: animation.delay !== undefined ? animation.delay / 1000 : undefined,
    iterationCount: animation.iterations,
    timingFunction: animation.easing,
  }
}

function toLegacyRuntimeComponent(
  node: IRNode,
  parentId: string | undefined,
  diagnostics: CompileDiagnostic[],
): LegacyRuntimeComponent {
  const style = buildLegacyStyle(node)
  const events = toLegacyEvents(eventsFromNode(node), diagnostics, `nodes.${node.id}.events`)
  const loop = toLegacyLoop(node.repeat)

  const component: LegacyRuntimeComponent = {
    id: node.id,
    type: node.component,
    position: {
      x: node.layout.x,
      y: node.layout.y,
    },
    size: {
      width: toLegacyNumericSize(node.layout.width, 100),
      height: toLegacyNumericSize(node.layout.height, 100),
    },
    rotation: node.layout.rotate,
    zindex: node.layout.zIndex,
    props: node.props as Record<string, unknown> | undefined,
    style,
    groupId: parentId,
    events,
    animation: toLegacyAnimation(node),
    dataSource: node.dataSource
      ? ({
          enabled: true,
          ...node.dataSource,
        } as LegacyRuntimeComponent['dataSource'])
      : undefined,
    condition: toLegacyExpression(node.renderIf),
    loop,
  }

  return component
}

function eventsFromNode(node: IRNode): IRNode['events'] {
  return node.events
}

function flattenNodeTree(
  node: IRNode,
  parentId: string | undefined,
  collector: LegacyRuntimeComponent[],
  diagnostics: CompileDiagnostic[],
): void {
  collector.push(toLegacyRuntimeComponent(node, parentId, diagnostics))

  for (const child of node.children) {
    flattenNodeTree(child, node.id, collector, diagnostics)
  }

  if (Object.keys(node.slots).length > 0) {
    diagnostics.push(
      createDiagnostic(
        'warning',
        'SLOT_SEMANTICS_DEGRADED_IN_COMPAT_MODE',
        `Node "${node.id}" contains slots. Slot content is flattened as normal children in compatibility mode`,
        `nodes.${node.id}.slots`,
      ),
    )
  }
  for (const slotChildren of Object.values(node.slots)) {
    for (const slotChild of slotChildren) {
      flattenNodeTree(slotChild, node.id, collector, diagnostics)
    }
  }
}

function getPageEntryNodes(page: IRPage): IRNode[] {
  if (!page.root) {
    return []
  }
  if (
    ROOT_WRAPPER_COMPONENTS.has(page.root.component.toLowerCase()) &&
    page.root.children.length > 0
  ) {
    return page.root.children
  }
  return [page.root]
}

function toLegacyRuntimeComponents(
  page: IRPage,
  diagnostics: CompileDiagnostic[],
): LegacyRuntimeComponent[] {
  const components: LegacyRuntimeComponent[] = []
  for (const node of getPageEntryNodes(page)) {
    flattenNodeTree(node, undefined, components, diagnostics)
  }
  return components
}

function toLegacyVueComponent(component: LegacyRuntimeComponent): LegacyVueComponent {
  return {
    id: component.id,
    componentName: component.type,
    props: component.props,
    style: component.style,
    events: component.events as Record<string, unknown[]> | undefined,
  }
}

function toLegacyVuePage(
  page: IRPage,
  index: number,
  diagnostics: CompileDiagnostic[],
): LegacyVuePage {
  const components = toLegacyRuntimeComponents(page, diagnostics).map((component) =>
    toLegacyVueComponent(component),
  )
  return {
    id: page.id,
    name: page.name,
    route: page.type === 'page' ? page.path || `/${toSlug(page.name)}` : undefined,
    components,
  }
}

export function toLegacyVueProject(
  project: IRProject,
  diagnostics: CompileDiagnostic[],
): LegacyVueProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    pages: project.pages.map((page, index) => toLegacyVuePage(page, index, diagnostics)),
  }
}

function toLegacyReactPage(page: IRPage, diagnostics: CompileDiagnostic[]): ReactPage {
  return {
    id: page.id,
    name: page.name,
    route: page.type === 'page' ? page.path || `/${toSlug(page.name)}` : undefined,
    components: toLegacyRuntimeComponents(page, diagnostics),
  }
}

export function toLegacyReactProject(
  project: IRProject,
  diagnostics: CompileDiagnostic[],
): ReactProject {
  return {
    name: project.name,
    description: project.description,
    pages: project.pages.map((page) => toLegacyReactPage(page, diagnostics)),
  }
}
