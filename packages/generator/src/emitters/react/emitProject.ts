import { generateReactProject } from '../../generators/react-project-generator'
import type { IRProject } from '../../pipeline/ir/ir'
import type { CompileDiagnostic } from '../../pipeline/validate/diagnostics'
import { toLegacyReactProject } from '../shared/compatAdapter'

export interface ReactEmitterOptions {
  typescript: boolean
  cssModules: boolean
  router: 'react-router' | 'tanstack-router'
  stateManagement: 'zustand' | 'jotai' | 'redux' | 'none'
}

export interface ReactEmitterResult {
  files: Array<{ path: string; content: string }>
  diagnostics: CompileDiagnostic[]
}

export function emitReactProject(
  project: IRProject,
  options: ReactEmitterOptions,
): ReactEmitterResult {
  const diagnostics: CompileDiagnostic[] = []
  const legacyProject = toLegacyReactProject(project, diagnostics)
  const files = generateReactProject(legacyProject, {
    typescript: options.typescript,
    cssModules: options.cssModules,
    router: options.router,
    stateManagement: options.stateManagement,
  })

  return { files, diagnostics }
}

