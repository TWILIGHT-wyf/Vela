/**
 * Stable ID utilities shared across packages.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
let lastTimestamp = ''
let lastCounter = 0

export type StableIdKind = 'project' | 'page' | 'node' | 'root' | 'action'

/**
 * Generate a unique, time-sortable ID.
 * Format: [prefix]_[timestamp(base36)][counter(2)][random(4)]
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36)

  if (timestamp === lastTimestamp) {
    lastCounter = (lastCounter + 1) % (62 * 62)
  } else {
    lastTimestamp = timestamp
    lastCounter = 0
  }
  const counter = lastCounter.toString(36).padStart(2, '0')

  let random = ''
  for (let i = 0; i < 4; i++) {
    random += ALPHABET[(Math.random() * 62) | 0]
  }

  const id = `${timestamp}${counter}${random}`
  if (!prefix) {
    return id
  }

  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return `${cleanPrefix}_${id}`
}

export function generateStableId(kind: StableIdKind, prefix?: string): string {
  return generateId(prefix || kind)
}

export function generateProjectId(): string {
  return generateStableId('project')
}

export function generatePageId(): string {
  return generateStableId('page')
}

export function generateNodeId(prefix?: string): string {
  return generateStableId('node', prefix || 'node')
}

export function generatePageRootId(pageId?: string): string {
  if (pageId) {
    return `${pageId}_root`
  }
  return generateStableId('root')
}

/**
 * Generate a shorter ID for length-sensitive cases.
 */
export function generateShortId(): string {
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += ALPHABET[(Math.random() * 62) | 0]
  }
  return id
}
