import type { NormalizedNode } from '../normalize/types'
import type { IRNode } from './ir'

export function buildIRNode(node: NormalizedNode): IRNode {
  const slots: Record<string, IRNode[]> = {}
  for (const [slotName, slotNodes] of Object.entries(node.slots)) {
    slots[slotName] = slotNodes.map((slotNode) => buildIRNode(slotNode))
  }

  return {
    id: node.id,
    component: node.component,
    title: node.raw.title,
    layout: node.layout,
    props: node.raw.props,
    style: node.raw.style,
    dataSource: node.raw.dataSource,
    renderIf: node.raw.renderIf,
    repeat: node.raw.repeat,
    events: node.raw.events,
    actions: node.raw.actions,
    animation: node.raw.animation,
    responsive: node.raw.responsive,
    ref: node.raw.ref,
    slot: node.raw.slot,
    slotProps: node.raw.slotProps,
    children: node.children.map((child) => buildIRNode(child)),
    slots,
  }
}

