import { generateProjectSourceFiles } from '../../projectGenerator'
import type { IRProject } from '../../pipeline/ir/ir'
import type { CompileDiagnostic } from '../../pipeline/validate/diagnostics'
import { toLegacyVueProject } from '../shared/compatAdapter'

export interface VueEmitterOptions {
  language: 'ts' | 'js'
  lint: boolean
}

export interface VueEmitterResult {
  files: Array<{ path: string; content: string }>
  diagnostics: CompileDiagnostic[]
}

export function emitVueProject(project: IRProject, options: VueEmitterOptions): VueEmitterResult {
  const diagnostics: CompileDiagnostic[] = []
  const legacyProject = toLegacyVueProject(project, diagnostics)
  const files = generateProjectSourceFiles(legacyProject, {
    language: options.language,
    lint: options.lint,
  })

  return { files, diagnostics }
}

