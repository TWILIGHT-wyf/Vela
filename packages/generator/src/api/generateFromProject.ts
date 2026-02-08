import type { ProjectSchema } from '@vela/core'
import { emitReactProject } from '../emitters/react/emitProject'
import { emitVueProject } from '../emitters/vue3/emitProject'
import { buildIRProject } from '../pipeline/ir/buildIRProject'
import type { IRProject } from '../pipeline/ir/ir'
import { normalizeProject } from '../pipeline/normalize/normalizeProject'
import {
  createDiagnostic,
  hasErrorDiagnostics,
  type CompileDiagnostic,
} from '../pipeline/validate/diagnostics'
import { validateProjectForGeneration } from '../pipeline/validate/validateProject'

export type GenerateFramework = 'vue3' | 'react'

export interface GenerateFromProjectOptions {
  framework: GenerateFramework
  continueOnError?: boolean
  vue?: {
    language?: 'ts' | 'js'
    lint?: boolean
  }
  react?: {
    typescript?: boolean
    cssModules?: boolean
    router?: 'react-router' | 'tanstack-router'
    stateManagement?: 'zustand' | 'jotai' | 'redux' | 'none'
  }
}

export interface GenerateFromProjectResult {
  files: Array<{ path: string; content: string }>
  diagnostics: CompileDiagnostic[]
  ir: IRProject
}

export class ProjectGenerationError extends Error {
  diagnostics: CompileDiagnostic[]

  constructor(message: string, diagnostics: CompileDiagnostic[]) {
    super(message)
    this.name = 'ProjectGenerationError'
    this.diagnostics = diagnostics
  }
}

function ensureCanContinue(
  diagnostics: CompileDiagnostic[],
  continueOnError: boolean,
  step: string,
): void {
  if (!continueOnError && hasErrorDiagnostics(diagnostics)) {
    throw new ProjectGenerationError(`Project generation failed at step: ${step}`, diagnostics)
  }
}

export function generateFromProject(
  project: ProjectSchema,
  options: GenerateFromProjectOptions,
): GenerateFromProjectResult {
  const diagnostics: CompileDiagnostic[] = []
  const continueOnError = options.continueOnError ?? false

  const validation = validateProjectForGeneration(project)
  diagnostics.push(...validation.diagnostics)
  ensureCanContinue(diagnostics, continueOnError, 'validate')

  const normalized = normalizeProject(project)
  diagnostics.push(...normalized.diagnostics)
  ensureCanContinue(diagnostics, continueOnError, 'normalize')

  const ir = buildIRProject(normalized.project)
  let files: Array<{ path: string; content: string }> = []

  if (options.framework === 'vue3') {
    const emitted = emitVueProject(ir, {
      language: options.vue?.language ?? 'ts',
      lint: options.vue?.lint ?? true,
    })
    files = emitted.files
    diagnostics.push(...emitted.diagnostics)
  } else if (options.framework === 'react') {
    const emitted = emitReactProject(ir, {
      typescript: options.react?.typescript ?? true,
      cssModules: options.react?.cssModules ?? true,
      router: options.react?.router ?? 'react-router',
      stateManagement: options.react?.stateManagement ?? 'zustand',
    })
    files = emitted.files
    diagnostics.push(...emitted.diagnostics)
  } else {
    diagnostics.push(
      createDiagnostic(
        'error',
        'FRAMEWORK_UNSUPPORTED',
        `Unsupported framework "${(options as { framework: string }).framework}"`,
      ),
    )
  }

  ensureCanContinue(diagnostics, continueOnError, 'emit')

  return {
    files,
    diagnostics,
    ir,
  }
}

