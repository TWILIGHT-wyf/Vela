/**
 * 沙箱执行工具
 * 提供安全的 JS 表达式执行环境
 */

// 获取全局对象（兼容浏览器和 Node.js）
const getGlobalThis = (): typeof globalThis => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window as typeof globalThis
  if (typeof global !== 'undefined') return global as typeof globalThis
  if (typeof self !== 'undefined') return self as typeof globalThis
  throw new Error('Unable to locate global object')
}

// 全局白名单：允许在表达式中访问的对象
const GLOBAL_WHITELIST = new Set([
  'Math',
  'Date',
  'JSON',
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
  'RegExp',
  'Map',
  'Set',
  'console',
  'isNaN',
  'isFinite',
  'parseInt',
  'parseFloat',
  'undefined',
  'NaN',
  'Infinity',
  // 注意：移除了 Promise（可被滥用做异步攻击）
  // 禁用: window, document, eval, Function, etc.
])

/**
 * 创建沙箱代理
 * 拦截所有全局变量访问，只允许访问白名单和上下文变量
 */
export function createSandboxProxy(context: Record<string, unknown>): Record<string, unknown> {
  const globalObj = getGlobalThis()

  return new Proxy(context, {
    has(_target, _key: string) {
      // 拦截所有属性检查，强制走 get
      return true
    },
    get(target, key: string | symbol, receiver) {
      // 0. Symbol 处理 (如 Symbol.unscopables)
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver)
      }

      // 1. 优先从上下文获取
      if (key in target) {
        return Reflect.get(target, key, receiver)
      }

      // 2. 检查全局白名单
      if (GLOBAL_WHITELIST.has(key)) {
        return (globalObj as Record<string, unknown>)[key]
      }

      // 3. 阻止访问非白名单全局变量
      console.warn(`[Sandbox] Access denied: ${key}`)
      return undefined
    },
  })
}

/**
 * 安全执行表达式
 * @param code JS 代码片段
 * @param context 运行时上下文
 * @param timeout 超时时间（毫秒），默认 1000ms
 */
export function evaluate(code: string, context: Record<string, unknown> = {}): unknown {
  // 先进行安全校验
  if (!validateCode(code)) {
    console.error(`[Sandbox] Code validation failed: "${code}"`)
    return undefined
  }

  try {
    const proxy = createSandboxProxy(context)

    // 使用 with(proxy) 限制作用域
    // 注意：with 在严格模式下不可用，但 new Function 默认是非严格模式
    const fn = new Function('sandbox', `with(sandbox) { return (${code}) }`)

    return fn(proxy)
  } catch (error) {
    console.error(`[Sandbox] Execution failed: "${code}"`, error)
    return undefined
  }
}

/**
 * 校验代码安全性 (静态分析)
 * 增强版：支持 Unicode 转义检测
 */
export function validateCode(code: string): boolean {
  // 1. 先解码 Unicode 转义序列（防止 \u0077indow 这类绕过）
  let decodedCode: string
  try {
    // 解码 \uXXXX 和 \xXX 转义
    decodedCode = code
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  } catch {
    decodedCode = code
  }

  const blacklist = [
    'window',
    'document',
    'eval',
    'Function',
    'alert',
    'confirm',
    'prompt',
    'localStorage',
    'sessionStorage',
    'cookie',
    'XMLHttpRequest',
    'fetch',
    'process',
    'require',
    'import',
    'globalThis',
    'global',
    'self',
    'top',
    'parent',
    'frames',
    'constructor', // 防止 constructor.constructor('code')() 攻击
    '__proto__',
    'prototype',
  ]

  // 对原始代码和解码后的代码都进行检查
  for (const keyword of blacklist) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(code) || regex.test(decodedCode)) {
      return false
    }
  }

  // 检查可疑模式
  const suspiciousPatterns = [
    /\[\s*['"`]constructor['"`]\s*\]/, // ['constructor'] 访问
    /\.\s*constructor\b/, // .constructor 访问
    /\\u/i, // Unicode 转义（可疑）
    /\\x/i, // Hex 转义（可疑）
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(code)) {
      return false
    }
  }

  return true
}
