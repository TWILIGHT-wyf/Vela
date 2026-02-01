/**
 * 代码验证器
 *
 * 功能：
 * 1. AST 语法验证
 * 2. 代码质量检查
 * 3. 安全性检查
 * 4. 框架特定规则验证
 */

import { parse as babelParse } from '@babel/parser'

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * 验证错误
 */
export interface ValidationError {
  type: 'syntax' | 'semantic' | 'security'
  message: string
  line?: number
  column?: number
  code?: string
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  type: 'quality' | 'performance' | 'deprecated'
  message: string
  line?: number
  column?: number
  suggestion?: string
}

/**
 * 验证选项
 */
export interface ValidatorOptions {
  framework?: 'vue' | 'react'
  strict?: boolean
  checkSecurity?: boolean
  checkQuality?: boolean
}

/**
 * 危险模式列表
 */
const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, message: 'Avoid using eval()' },
  { pattern: /Function\s*\(/, message: 'Avoid using Function constructor' },
  { pattern: /innerHTML\s*=/, message: 'Avoid direct innerHTML assignment (XSS risk)' },
  { pattern: /document\.write/, message: 'Avoid document.write()' },
  { pattern: /__proto__/, message: 'Avoid __proto__ manipulation' },
  { pattern: /\$\{.*\}.*innerHTML/, message: 'Template literals in innerHTML (XSS risk)' },
]

/**
 * 质量问题模式
 */
const QUALITY_PATTERNS = [
  { pattern: /console\.(log|debug|info)/, message: 'Remove console statements in production', type: 'quality' as const },
  { pattern: /debugger/, message: 'Remove debugger statements', type: 'quality' as const },
  { pattern: /TODO|FIXME|XXX/, message: 'Unresolved TODO comment', type: 'quality' as const },
  { pattern: /\bvar\b/, message: 'Prefer const/let over var', type: 'deprecated' as const },
]

/**
 * 验证 JavaScript/TypeScript 代码
 */
export function validateCode(code: string, options: ValidatorOptions = {}): ValidationResult {
  const { framework, strict = false, checkSecurity = true, checkQuality = true } = options
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 1. AST 语法验证
  try {
    const parserOptions: any = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    }

    babelParse(code, parserOptions)
  } catch (error: any) {
    errors.push({
      type: 'syntax',
      message: error.message,
      line: error.loc?.line,
      column: error.loc?.column,
      code: extractCodeSnippet(code, error.loc?.line),
    })
    // 语法错误直接返回
    return { valid: false, errors, warnings }
  }

  // 2. 安全性检查
  if (checkSecurity) {
    const securityIssues = checkSecurityPatterns(code)
    errors.push(...securityIssues)
  }

  // 3. 质量检查
  if (checkQuality) {
    const qualityIssues = checkQualityPatterns(code)
    warnings.push(...qualityIssues)
  }

  // 4. 框架特定验证
  if (framework === 'vue') {
    const vueIssues = validateVueCode(code, strict)
    errors.push(...vueIssues.errors)
    warnings.push(...vueIssues.warnings)
  } else if (framework === 'react') {
    const reactIssues = validateReactCode(code, strict)
    errors.push(...reactIssues.errors)
    warnings.push(...reactIssues.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证 Vue 模板
 */
export function validateVueTemplate(template: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 检查未闭合的标签
  const openTags: string[] = []
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*\/?>/g
  let match

  while ((match = tagRegex.exec(template)) !== null) {
    const fullMatch = match[0]
    const tagName = match[1].toLowerCase()

    // 自闭合标签
    if (fullMatch.endsWith('/>')) continue

    // 空元素标签
    const voidElements = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']
    if (voidElements.includes(tagName)) continue

    if (fullMatch.startsWith('</')) {
      // 闭合标签
      if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
        errors.push({
          type: 'syntax',
          message: `Unexpected closing tag </${tagName}>`,
        })
      } else {
        openTags.pop()
      }
    } else {
      // 开始标签
      openTags.push(tagName)
    }
  }

  // 检查未闭合的标签
  for (const tag of openTags) {
    errors.push({
      type: 'syntax',
      message: `Unclosed tag <${tag}>`,
    })
  }

  // 检查危险的 v-html
  if (template.includes('v-html')) {
    warnings.push({
      type: 'quality',
      message: 'v-html can be a security risk if content is not sanitized',
      suggestion: 'Consider using v-text or sanitize the HTML content',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证 Vue SFC 文件
 */
export function validateVueSFC(content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 提取各部分
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/)
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)

  // 验证 template
  if (templateMatch) {
    const templateResult = validateVueTemplate(templateMatch[1])
    errors.push(...templateResult.errors)
    warnings.push(...templateResult.warnings)
  }

  // 验证 script
  if (scriptMatch) {
    const scriptResult = validateCode(scriptMatch[1], { framework: 'vue' })
    errors.push(...scriptResult.errors)
    warnings.push(...scriptResult.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证 React JSX
 */
export function validateReactJSX(code: string): ValidationResult {
  return validateCode(code, { framework: 'react' })
}

/**
 * 检查安全模式
 */
function checkSecurityPatterns(code: string): ValidationError[] {
  const errors: ValidationError[] = []

  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    const match = code.match(pattern)
    if (match) {
      const line = getLineNumber(code, match.index || 0)
      errors.push({
        type: 'security',
        message,
        line,
      })
    }
  }

  return errors
}

/**
 * 检查质量问题
 */
function checkQualityPatterns(code: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  for (const { pattern, message, type } of QUALITY_PATTERNS) {
    const match = code.match(pattern)
    if (match) {
      const line = getLineNumber(code, match.index || 0)
      warnings.push({
        type,
        message,
        line,
      })
    }
  }

  return warnings
}

/**
 * Vue 特定验证
 */
function validateVueCode(code: string, strict: boolean): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 检查 Options API vs Composition API 混用
  const hasOptions = /export\s+default\s*\{[\s\S]*\bdata\s*\(\s*\)/.test(code)
  const hasSetup = /\bsetup\s*\(/.test(code) || /<script\s+setup/.test(code)

  if (hasOptions && hasSetup) {
    warnings.push({
      type: 'quality',
      message: 'Mixing Options API and Composition API',
      suggestion: 'Consider using only one API style per component',
    })
  }

  // 检查 reactive 对象解构
  if (code.includes('reactive') && /const\s*\{[^}]+\}\s*=\s*reactive/.test(code)) {
    warnings.push({
      type: 'quality',
      message: 'Destructuring reactive objects loses reactivity',
      suggestion: 'Use toRefs() when destructuring reactive objects',
    })
  }

  return { errors, warnings }
}

/**
 * React 特定验证
 */
function validateReactCode(code: string, strict: boolean): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 检查 hooks 规则
  const hookCalls = code.match(/\buse[A-Z]\w*\s*\(/g) || []
  const conditionalHooks = code.match(/if\s*\([^)]*\)\s*\{[^}]*\buse[A-Z]\w*\s*\(/g)

  if (conditionalHooks) {
    errors.push({
      type: 'semantic',
      message: 'Hooks should not be called conditionally',
    })
  }

  // 检查缺失的依赖数组
  if (code.includes('useEffect') && !/useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[/.test(code)) {
    warnings.push({
      type: 'quality',
      message: 'useEffect may be missing dependency array',
      suggestion: 'Add a dependency array to useEffect',
    })
  }

  // 检查 key prop
  if (code.includes('.map(') && !code.includes('key=')) {
    warnings.push({
      type: 'quality',
      message: 'Lists should have a unique key prop',
      suggestion: 'Add key prop to list items',
    })
  }

  return { errors, warnings }
}

/**
 * 获取行号
 */
function getLineNumber(code: string, index: number): number {
  return code.substring(0, index).split('\n').length
}

/**
 * 提取代码片段
 */
function extractCodeSnippet(code: string, line?: number): string | undefined {
  if (!line) return undefined
  const lines = code.split('\n')
  const start = Math.max(0, line - 2)
  const end = Math.min(lines.length, line + 1)
  return lines.slice(start, end).join('\n')
}

/**
 * 批量验证代码
 */
export function validateCodeBatch(
  files: Array<{ name: string; content: string; type: 'js' | 'ts' | 'vue' | 'jsx' | 'tsx' }>,
  options: ValidatorOptions = {},
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>()

  for (const file of files) {
    let result: ValidationResult

    if (file.type === 'vue') {
      result = validateVueSFC(file.content)
    } else if (file.type === 'jsx' || file.type === 'tsx') {
      result = validateCode(file.content, { ...options, framework: 'react' })
    } else {
      result = validateCode(file.content, options)
    }

    results.set(file.name, result)
  }

  return results
}

/**
 * 格式化验证结果
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []

  if (result.valid) {
    lines.push('✓ Code is valid')
  } else {
    lines.push('✗ Validation failed')
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors (${result.errors.length}):`)
    for (const error of result.errors) {
      const location = error.line ? ` (line ${error.line})` : ''
      lines.push(`  ✗ [${error.type}]${location} ${error.message}`)
      if (error.code) {
        lines.push(`    ${error.code.split('\n').join('\n    ')}`)
      }
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings (${result.warnings.length}):`)
    for (const warning of result.warnings) {
      const location = warning.line ? ` (line ${warning.line})` : ''
      lines.push(`  ⚠ [${warning.type}]${location} ${warning.message}`)
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`)
      }
    }
  }

  return lines.join('\n')
}
