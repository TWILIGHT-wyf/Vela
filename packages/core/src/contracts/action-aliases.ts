/**
 * Legacy action aliases normalized to runtime built-in action types.
 * Keep this map as the single source of truth for renderer/generator parity.
 */
export const ACTION_TYPE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  alert: 'showToast',
  'show-tooltip': 'showToast',
  customScript: 'runScript',
  'custom-script': 'runScript',
  updateState: 'setState',
  'navigate-page': 'navigate',
})

export function normalizeActionType(type: unknown): string {
  const normalized = typeof type === 'string' ? type.trim() : ''
  if (!normalized) {
    return ''
  }
  return ACTION_TYPE_ALIASES[normalized] ?? normalized
}
