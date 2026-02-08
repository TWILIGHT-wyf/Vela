import { getNodeComponent, type LayoutMode, type NodeSchema } from '@vela/core'
import type { CompileDiagnostic } from '../validate/diagnostics'
import { createDiagnostic } from '../validate/diagnostics'
import { resolveLayout } from './resolveLayout'
import type { NormalizedNode } from './types'

export interface NormalizeNodeContext {
  parentId?: string
  parentChildMode: LayoutMode
  pageDefaultMode: LayoutMode
  nodeIndex: Map<string, NormalizedNode>
  diagnostics: CompileDiagnostic[]
}

export function normalizeNode(node: NodeSchema, context: NormalizeNodeContext): NormalizedNode {
  const component = getNodeComponent(node)
  if (!component) {
    context.diagnostics.push(
      createDiagnostic(
        'error',
        'NODE_COMPONENT_MISSING',
        `Node "${node.id}" is missing component`,
        `nodes.${node.id}.component`,
      ),
    )
  }

  if (context.nodeIndex.has(node.id)) {
    context.diagnostics.push(
      createDiagnostic(
        'error',
        'NODE_ID_DUPLICATED',
        `Duplicate node id "${node.id}"`,
        `nodes.${node.id}`,
      ),
    )
  }

  const layout = resolveLayout({
    node,
    parentChildMode: context.parentChildMode,
    pageDefaultMode: context.pageDefaultMode,
  })

  const normalized: NormalizedNode = {
    id: node.id,
    component: component || 'Unknown',
    parentId: context.parentId,
    raw: node,
    layout,
    children: [],
    slots: {},
  }

  context.nodeIndex.set(node.id, normalized)

  if (node.children) {
    normalized.children = node.children.map((child) =>
      normalizeNode(child, {
        ...context,
        parentId: node.id,
        parentChildMode: layout.childMode,
      }),
    )
  }

  if (node.slots) {
    for (const [slotName, slotChildren] of Object.entries(node.slots)) {
      normalized.slots[slotName] = slotChildren.map((child) =>
        normalizeNode(child, {
          ...context,
          parentId: node.id,
          parentChildMode: layout.childMode,
        }),
      )
    }
  }

  return normalized
}

