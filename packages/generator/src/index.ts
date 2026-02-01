/**
 * @vela/generator - 低代码代码生成器
 *
 * 支持 Vue3 和 React 双框架代码生成
 *
 * @example
 * ```ts
 * import { generateCode, generateProjectFiles } from '@vela/generator'
 *
 * // 生成单页面代码
 * const { code } = generateCode(components, { framework: 'vue3' })
 *
 * // 生成完整项目
 * const files = generateProjectFiles(project, {
 *   framework: 'react',
 *   typescript: true,
 * })
 * ```
 */

// 统一入口 API
export {
  generateCode,
  generateProjectFiles,
  getGenerator,
  toIR,
  type Framework,
  type GeneratorOptions,
  type GeneratedCode,
  type ProjectGeneratorOptions,
  type Page,
  type Project,
} from './codeGenerator'

// 组件类型
export type {
  Component,
  ActionConfig,
  DataBinding,
  DataSourceConfig,
  JSExpression,
  LoopConfig,
  SlotConfig,
} from './components'

// IR 类型
export type {
  IRNode,
  IRComponent,
  IRProp,
  IRDirective,
  IREvent,
  IRSlot,
  IRScriptContext,
  IRStyleContext,
  IRImport,
  IRVariable,
  IRFunction,
  IRLifecycleHook,
  IRPage,
  IRProject,
} from './types/ir'

// 转换器
export {
  transformToIRComponent,
  transformNodes,
  transformNode,
  generateScriptContext,
  generateStyleContext,
} from './transformer/schema-to-ir'

// Vue3 生成器
export {
  Vue3Generator,
  generateVue3Code,
} from './generators/vue3-generator'

// React 生成器
export {
  ReactGenerator,
  generateReactCode,
  generateReactFiles,
} from './generators/react-generator'

// React 项目生成器
export {
  generateReactProject,
  type ReactProject,
  type ReactPage,
  type ReactExportOptions,
} from './generators/react-project-generator'

// 原有的 Vue 生成器 (兼容)
export { generateVueCode, componentsToJSON, JSONToComponents } from './toCode'

// 原有的项目生成器 (兼容)
export {
  generateProjectSourceFiles,
  exportProjectToZip,
  processCode,
  type ExportOptions,
  type GeneratedSourceFile,
} from './projectGenerator'

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
