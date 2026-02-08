import type { ProjectSchema } from '@vela/core'
import type { CompileDiagnostic } from '../validate/diagnostics'
import { createDiagnostic } from '../validate/diagnostics'
import { normalizePage } from './normalizePage'
import type { NormalizedPage, NormalizedProject } from './types'

export interface NormalizeProjectResult {
  project: NormalizedProject
  diagnostics: CompileDiagnostic[]
}

export function normalizeProject(project: ProjectSchema): NormalizeProjectResult {
  const diagnostics: CompileDiagnostic[] = []
  const pages: NormalizedPage[] = []
  const pageIndex = new Map<string, NormalizedPage>()

  for (const page of project.pages) {
    const pageResult = normalizePage(page)
    diagnostics.push(...pageResult.diagnostics)
    pages.push(pageResult.page)

    if (pageIndex.has(page.id)) {
      diagnostics.push(
        createDiagnostic(
          'error',
          'PROJECT_PAGE_ID_DUPLICATED',
          `Duplicate page id "${page.id}"`,
          `pages.${page.id}`,
        ),
      )
    } else {
      pageIndex.set(page.id, pageResult.page)
    }
  }

  return {
    project: {
      raw: project,
      pages,
      pageIndex,
    },
    diagnostics,
  }
}

