import type { NormalizedProject } from '../normalize/types'
import type { IRProject } from './ir'
import { buildIRPage } from './buildIRPage'

export function buildIRProject(project: NormalizedProject): IRProject {
  return {
    id: project.raw.id,
    name: project.raw.name,
    description: project.raw.description,
    config: project.raw.config,
    pages: project.pages.map((page) => buildIRPage(page)),
    raw: project.raw,
  }
}

