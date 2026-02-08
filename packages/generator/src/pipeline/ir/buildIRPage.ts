import type { NormalizedPage } from '../normalize/types'
import type { IRPage } from './ir'
import { buildIRNode } from './buildIRNode'

export function buildIRPage(page: NormalizedPage): IRPage {
  return {
    id: page.id,
    type: page.type,
    name: page.name,
    path: page.path,
    defaultLayoutMode: page.defaultLayoutMode,
    raw: page.raw,
    root: page.root ? buildIRNode(page.root) : undefined,
  }
}

