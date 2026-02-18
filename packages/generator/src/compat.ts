/**
 * @vela/generator/compat - 旧版兼容入口
 *
 * 该入口保留历史 API，供旧链路平滑迁移。
 * 新项目请使用 `@vela/generator` 主入口（协议驱动）。
 */

const compatWarningFlag = '__vela_generator_compat_warned__'
const compatGlobal = globalThis as Record<string, unknown>

if (compatGlobal[compatWarningFlag] !== true) {
  compatGlobal[compatWarningFlag] = true
  console.warn(
    '[vela-generator] `@vela/generator/compat` 已进入弃用阶段，请迁移到 `@vela/generator` 主入口。',
  )
}

// 统一入口 API（旧组件模型）
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

// 组件类型（旧模型）
export type {
  Component,
  ActionConfig,
  DataBinding,
  DataSourceConfig,
  JSExpression,
  LoopConfig,
  SlotConfig,
} from './components'

// 旧 IR 类型
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

// 转换器（旧模型）
export {
  transformToIRComponent,
  transformNodes,
  transformNode,
  generateScriptContext,
  generateStyleContext,
} from './transformer/schema-to-ir'

// Vue3 生成器（旧模型）
export { Vue3Generator, generateVue3Code } from './generators/vue3-generator'

// React 生成器（旧模型）
export { ReactGenerator, generateReactCode, generateReactFiles } from './generators/react-generator'

// React 项目生成器（旧模型）
export {
  generateReactProject,
  type ReactProject,
  type ReactPage,
  type ReactExportOptions,
} from './generators/react-project-generator'

// 原有 Vue 代码生成器
export { generateVueCode, componentsToJSON, JSONToComponents } from './toCode'

// 工具：表达式验证
export {
  validateExpression,
  validateExpressions,
  validateOrThrow,
  checkExpressionSafety,
  type ValidationResult as ExpressionValidationResult,
  type ValidateOptions,
} from './utils/expression-validator'

// 工具：代码验证
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
