/**
 * @vela/generator - 协议驱动代码生成器
 *
 * 主入口仅导出 ProjectSchema 驱动的新架构 API。
 * 旧版兼容 API 已迁移至 `@vela/generator/compat`。
 *
 * @example
 * ```ts
 * import { generateFromProject } from '@vela/generator'
 *
 * const result = generateFromProject(project, {
 *   framework: 'vue3',
 * })
 * ```
 */

export {
  generateFromProject,
  ProjectGenerationError,
  type GenerateFramework,
  type GenerateFromProjectOptions,
  type GenerateFromProjectResult,
} from './api/generateFromProject'

export type {
  IRNode as CompileIRNode,
  IRPage as CompileIRPage,
  IRProject as CompileIRProject,
} from './pipeline/ir/ir'

export { validateProjectForGeneration } from './pipeline/validate/validateProject'
export { normalizeProject } from './pipeline/normalize/normalizeProject'
export { buildIRProject } from './pipeline/ir/buildIRProject'

export type { CompileDiagnostic, DiagnosticLevel } from './pipeline/validate/diagnostics'

// 表达式验证工具
export {
  validateExpression,
  validateExpressions,
  validateOrThrow,
  checkExpressionSafety,
  type ValidationResult as ExpressionValidationResult,
  type ValidateOptions,
} from './utils/expression-validator'

// 代码验证工具
export {
  validateCode,
  validateVueTemplate,
  validateVueSFC,
  validateReactJSX,
  validateCodeBatch,
  formatValidationResult,
  type ValidationResult as CodeValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidatorOptions,
} from './utils/code-validator'
