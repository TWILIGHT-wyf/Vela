import {
  getRouterPageRef,
  isRoutePage,
  resolvePageRef,
  validatePageActionRefs,
  type ProjectSchema,
  type RouterPageRefKey,
} from '@vela/core'
import { NodeZodSchema } from '@vela/core/validation'
import { createDiagnostic, hasErrorDiagnostics, type CompileDiagnostic } from './diagnostics'

export interface ProjectValidationResult {
  diagnostics: CompileDiagnostic[]
  hasError: boolean
}

const ROUTER_PAGE_REF_KEYS: RouterPageRefKey[] = ['homePage', 'notFoundPage', 'loginPage']

function toPath(path: Array<string | number>): string {
  if (path.length === 0) {
    return ''
  }
  return path
    .map((segment) => (typeof segment === 'number' ? `[${segment}]` : segment))
    .join('.')
}

export function validateProjectForGeneration(project: ProjectSchema): ProjectValidationResult {
  const diagnostics: CompileDiagnostic[] = []

  const pageIdSet = new Set<string>()
  const routePathSet = new Set<string>()
  const globalActionIds = project.logic?.actions?.map((action) => action.id)

  for (const page of project.pages) {
    if (pageIdSet.has(page.id)) {
      diagnostics.push(
        createDiagnostic(
          'error',
          'PROJECT_PAGE_ID_DUPLICATED',
          `Duplicate page id "${page.id}"`,
          `pages.${page.id}`,
        ),
      )
    } else {
      pageIdSet.add(page.id)
    }

    if (isRoutePage(page)) {
      if (routePathSet.has(page.path)) {
        diagnostics.push(
          createDiagnostic(
            'error',
            'PROJECT_ROUTE_PATH_DUPLICATED',
            `Duplicate route path "${page.path}"`,
            `pages.${page.id}.path`,
          ),
        )
      } else {
        routePathSet.add(page.path)
      }
    }

    if (page.children) {
      const nodeValidation = NodeZodSchema.safeParse(page.children)
      if (!nodeValidation.success) {
        for (const issue of nodeValidation.error.issues) {
          diagnostics.push(
            createDiagnostic(
              'error',
              'PAGE_NODE_SCHEMA_INVALID',
              issue.message,
              `pages.${page.id}.children.${toPath(issue.path as Array<string | number>)}`,
            ),
          )
        }
      }
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

    const actionRefIssues = validatePageActionRefs(page, globalActionIds)
    for (const issue of actionRefIssues.pageIssues) {
      diagnostics.push(
        createDiagnostic(
          'error',
          `PAGE_ACTION_REF_${issue.code.toUpperCase()}`,
          issue.message,
          `pages.${issue.pageId}.events.${issue.eventName}[${issue.actionIndex}]`,
        ),
      )
    }

    for (const issue of actionRefIssues.nodeIssues) {
      diagnostics.push(
        createDiagnostic(
          'error',
          `NODE_ACTION_REF_${issue.code.toUpperCase()}`,
          issue.message,
          `pages.${page.id}.nodes.${issue.nodeId}.events.${issue.eventName}[${issue.actionIndex}]`,
        ),
      )
    }
  }

  const routerConfig = project.config.router
  for (const key of ROUTER_PAGE_REF_KEYS) {
    const pageRef = getRouterPageRef(routerConfig, key)
    if (!pageRef) {
      continue
    }
    const targetPage = resolvePageRef(project.pages, pageRef)
    if (!targetPage) {
      diagnostics.push(
        createDiagnostic(
          'error',
          'ROUTER_PAGE_REF_UNRESOLVED',
          `Router reference "${key}" cannot be resolved`,
          `config.router.${key}`,
        ),
      )
    }
  }

  return {
    diagnostics,
    hasError: hasErrorDiagnostics(diagnostics),
  }
}
