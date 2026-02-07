/**
 * 国际化字符串
 * 支持简单字符串或多语言对象
 */
export type I18nString = string | Record<string, string>

/**
 * 解析国际化字符串
 * @param value 国际化值
 * @param locale 当前语言，默认 en-US
 * @param fallbackLocale 回退语言，默认 en-US
 */
export function translate(
  value: I18nString | undefined,
  locale: string = 'en-US',
  fallbackLocale: string = 'en-US',
): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (value[locale]) {
    return value[locale]
  }

  if (value[fallbackLocale]) {
    return value[fallbackLocale]
  }

  const first = Object.values(value)[0]
  return first ?? ''
}
