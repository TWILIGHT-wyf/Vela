export type DiagnosticLevel = 'error' | 'warning' | 'info'

export interface CompileDiagnostic {
  level: DiagnosticLevel
  code: string
  message: string
  path?: string
}

export function hasErrorDiagnostics(diagnostics: CompileDiagnostic[]): boolean {
  return diagnostics.some((item) => item.level === 'error')
}

export function createDiagnostic(
  level: DiagnosticLevel,
  code: string,
  message: string,
  path?: string,
): CompileDiagnostic {
  return { level, code, message, path }
}

