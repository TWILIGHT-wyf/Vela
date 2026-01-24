/**
 * 支持的语言代码 (ISO 639-1)
 */
export type Locale = 'zh-CN' | 'en-US' | string

/**
 * 国际化字符串类型
 * 既可以是普通字符串(兼容旧数据/单语言)，也可以是多语言对象
 */
export type I18nString = string | Record<Locale, string>

/**
 * 辅助函数：解析国际化字符串
 * @param text 可能是字符串或多语言对象
 * @param locale 当前语言环境
 * @param defaultLocale 默认回退语言
 */
export function translate(
  text: I18nString | undefined,
  locale: string = 'zh-CN',
  defaultLocale: string = 'zh-CN',
): string {
  if (!text) return ''

  // 如果是纯字符串，直接返回
  if (typeof text === 'string') return text

  // 尝试获取当前语言
  if (text[locale]) return text[locale]

  // 尝试获取默认语言
  if (text[defaultLocale]) return text[defaultLocale]

  // 尝试获取任意一种语言
  const keys = Object.keys(text)
  if (keys.length > 0) return text[keys[0]]

  return ''
}

/**
 * 辅助函数：创建国际化对象
 */
export function createI18n(zh: string, en?: string): I18nString {
  if (!en) return zh
  return {
    'zh-CN': zh,
    'en-US': en,
  }
}
