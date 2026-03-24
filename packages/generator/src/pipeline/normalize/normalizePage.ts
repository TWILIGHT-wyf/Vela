import { isRoutePage, type LayoutMode, type PageSchema } from '@vela/core'
import type { CompileDiagnostic } from '../validate/diagnostics'
import { createDiagnostic } from '../validate/diagnostics'
import { normalizeNode } from './normalizeNode'
import type { NormalizedNode, NormalizedPage } from './types'

export interface NormalizePageResult {
  page: NormalizedPage
  diagnostics: CompileDiagnostic[]
}

export function normalizePage(page: PageSchema): NormalizePageResult {
  const diagnostics: CompileDiagnostic[] = []
  const pageDefaultMode: LayoutMode = 'grid'
  const nodeIndex = new Map<string, NormalizedNode>()

  let root: NormalizedNode | undefined
  if (page.children) {
    root = normalizeNode(page.children, {
      parentChildMode: pageDefaultMode,
      pageDefaultMode,
      nodeIndex,
      diagnostics,
    })
  } else {
    diagnostics.push(
      createDiagnostic(
        'warning',
        'PAGE_ROOT_NODE_MISSING',
        `Page "${page.id}" has no root node`,
        `pages.${page.id}.children`,
      ),
    )
  }

  const normalizedPage: NormalizedPage = {
    id: page.id,
    type: page.type,
    name: page.name,
    path: isRoutePage(page) ? page.path : undefined,
    defaultLayoutMode: pageDefaultMode,
    raw: page,
    root,
    nodeIndex,
  }

  return { page: normalizedPage, diagnostics }
}
