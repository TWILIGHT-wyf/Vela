/**
 * Expression Validator
 * Validates JavaScript expressions before code generation
 */

import { parse, ParserOptions } from '@babel/parser'

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  position?: {
    line: number
    column: number
  }
}

/**
 * Expression validation options
 */
export interface ValidateOptions {
  /** Allow JSX syntax */
  jsx?: boolean
  /** Allow TypeScript syntax */
  typescript?: boolean
  /** Treat as module (allows import/export) */
  sourceType?: 'script' | 'module'
}

const DEFAULT_OPTIONS: ValidateOptions = {
  jsx: false,
  typescript: false,
  sourceType: 'module',
}

/**
 * Validate a JavaScript expression
 *
 * @param expr - The expression string to validate
 * @param options - Validation options
 * @returns ValidationResult with valid status and optional error info
 *
 * @example
 * ```ts
 * const result = validateExpression('count + 1')
 * if (!result.valid) {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateExpression(
  expr: string,
  options: ValidateOptions = {},
): ValidationResult {
  if (!expr || typeof expr !== 'string') {
    return { valid: false, error: 'Expression must be a non-empty string' }
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  // Build parser plugins
  const plugins: ParserOptions['plugins'] = []
  if (mergedOptions.jsx) {
    plugins.push('jsx')
  }
  if (mergedOptions.typescript) {
    plugins.push('typescript')
  }

  try {
    // Wrap expression to make it a valid statement
    // This allows validating expressions like "a + b" which aren't valid statements on their own
    const wrappedCode = `(${expr})`

    parse(wrappedCode, {
      sourceType: mergedOptions.sourceType,
      plugins,
      errorRecovery: false,
    })

    return { valid: true }
  } catch (error: unknown) {
    const parseError = error as {
      message?: string
      loc?: { line: number; column: number }
    }

    return {
      valid: false,
      error: parseError.message || 'Unknown parsing error',
      position: parseError.loc
        ? {
            // Adjust for the wrapping parenthesis we added
            line: parseError.loc.line,
            column: Math.max(0, parseError.loc.column - 1),
          }
        : undefined,
    }
  }
}

/**
 * Validate multiple expressions and return all errors
 *
 * @param expressions - Map of expression name to expression string
 * @returns Map of expression name to validation result (only invalid ones)
 */
export function validateExpressions(
  expressions: Record<string, string>,
): Record<string, ValidationResult> {
  const errors: Record<string, ValidationResult> = {}

  for (const [name, expr] of Object.entries(expressions)) {
    const result = validateExpression(expr)
    if (!result.valid) {
      errors[name] = result
    }
  }

  return errors
}

/**
 * Check if expression contains potentially dangerous patterns
 *
 * @param expr - The expression to check
 * @returns Object with safe status and optional warning
 */
export function checkExpressionSafety(expr: string): {
  safe: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, warning: 'eval() is dangerous and should be avoided' },
    { pattern: /Function\s*\(/, warning: 'Function() constructor is dangerous' },
    { pattern: /document\.write/, warning: 'document.write is deprecated' },
    { pattern: /innerHTML\s*=/, warning: 'innerHTML assignment may cause XSS' },
    { pattern: /__proto__/, warning: '__proto__ manipulation is dangerous' },
    { pattern: /constructor\s*\[/, warning: 'Constructor access may be dangerous' },
  ]

  for (const { pattern, warning } of dangerousPatterns) {
    if (pattern.test(expr)) {
      warnings.push(warning)
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  }
}

/**
 * Validate and sanitize an expression for code generation
 *
 * @param expr - The expression to validate
 * @param context - Context for error messages
 * @returns The validated expression or throws an error
 */
export function validateOrThrow(expr: string, context?: string): string {
  const result = validateExpression(expr)

  if (!result.valid) {
    const contextStr = context ? ` in ${context}` : ''
    const posStr = result.position
      ? ` at line ${result.position.line}, column ${result.position.column}`
      : ''
    throw new Error(`Invalid expression${contextStr}${posStr}: ${result.error}`)
  }

  return expr
}
