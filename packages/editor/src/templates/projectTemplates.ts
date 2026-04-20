import type { PageSchema, ProjectSchema } from '@vela/core'
import { createDefaultProject, createRoutePage } from '@vela/core'
import type { PageTemplate, PageTemplateInstance, TemplateCategory } from './index'
import { getTemplateById, instantiateTemplate, templates } from './index'

const STARTER_TAG_PREFIX = 'starter:'
const PROJECT_TEMPLATE_TAG_PREFIX = 'project-template:'
const TEMPLATE_STARTER_TAG = `${STARTER_TAG_PREFIX}template`

const RECOMMENDED_TEMPLATE_IDS = new Set(['query-workbench', 'approval-center', 'project-board'])

export interface ProjectTemplateDefinition {
  id: string
  label: string
  description: string
  category: TemplateCategory
  recommended?: boolean
}

export const projectTemplateDefinitions: ProjectTemplateDefinition[] = templates.map(
  (template) => ({
    id: template.id,
    label: template.name,
    description: template.description,
    category: template.category,
    recommended: RECOMMENDED_TEMPLATE_IDS.has(template.id),
  }),
)

function applyTemplateInstanceToPage(page: PageSchema, template: PageTemplateInstance): PageSchema {
  if (!page.children) {
    return page
  }

  page.children.container = {
    mode: 'grid',
    columns: template.root.columns,
    rows: template.root.rows,
    gap: template.root.gap ?? 12,
  }
  page.children.style = {
    ...(page.children.style || {}),
    ...(template.root.style || {}),
  }
  page.children.children = template.nodes
  page.actions = template.pageActions ? [...template.pageActions] : []

  return page
}

function tagTemplateProject(project: ProjectSchema, templateId: string): void {
  const nextTags = new Set(project.meta?.tags || [])
  nextTags.add(TEMPLATE_STARTER_TAG)
  nextTags.add(`${PROJECT_TEMPLATE_TAG_PREFIX}${templateId}`)
  project.meta = {
    ...(project.meta || {}),
    tags: Array.from(nextTags),
  }
}

function buildDefaultRoutePath(template: PageTemplate): string {
  switch (template.id) {
    case 'secure-login':
      return '/login'
    case 'query-workbench':
      return '/orders'
    case 'approval-center':
      return '/users'
    default:
      return '/'
  }
}

export function buildProjectFromTemplate(
  templateId: string,
  name: string,
  description?: string,
): ProjectSchema {
  const template = getTemplateById(templateId)
  const instance = instantiateTemplate(templateId)

  if (!template || !instance) {
    throw new Error(`Project template "${templateId}" is not available`)
  }

  const routePath = buildDefaultRoutePath(template)
  const page = createRoutePage(`page_${template.id}`, routePath, template.name)
  applyTemplateInstanceToPage(page, instance)
  page.title = template.name
  page.description = template.description

  const project = createDefaultProject(name)
  project.description = description?.trim() || template.description
  project.config.target = 'pc'
  project.config.router = {
    ...(project.config.router || {}),
    mode: 'hash',
    homePage: { type: 'path', path: routePath },
  }
  project.pages = [page]

  if (instance.globalActions?.length) {
    project.logic = {
      ...(project.logic || {}),
      actions: [...instance.globalActions],
    }
  }

  tagTemplateProject(project, template.id)
  return project
}

export function getProjectTemplateId(project?: Pick<ProjectSchema, 'meta'> | null): string | null {
  const tags = project?.meta?.tags || []
  const matchedTag = tags.find((tag) => tag.startsWith(PROJECT_TEMPLATE_TAG_PREFIX))
  return matchedTag ? matchedTag.slice(PROJECT_TEMPLATE_TAG_PREFIX.length) : null
}

export function getProjectTemplateDefinition(
  project?: Pick<ProjectSchema, 'meta'> | null,
): ProjectTemplateDefinition | null {
  const templateId = getProjectTemplateId(project)
  if (!templateId) return null
  return projectTemplateDefinitions.find((item) => item.id === templateId) || null
}
