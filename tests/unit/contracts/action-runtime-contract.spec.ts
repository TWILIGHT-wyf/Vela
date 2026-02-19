import { describe, expect, it } from 'vitest'
import {
  ACTION_CONFIRM_DEFAULT_MESSAGE,
  ACTION_TARGET_DATA_ATTRIBUTES,
  normalizeActionType,
} from '@vela/core/contracts'

describe('action runtime contracts', () => {
  it('shares canonical target selector attributes', () => {
    expect(ACTION_TARGET_DATA_ATTRIBUTES).toEqual([
      'data-node-id',
      'data-id',
      'data-component-id',
    ])
  })

  it('defines a stable default confirm message', () => {
    expect(ACTION_CONFIRM_DEFAULT_MESSAGE).toBe('Do you want to execute this action?')
  })

  it('normalizes legacy aliases via core contract', () => {
    expect(normalizeActionType('alert')).toBe('showToast')
    expect(normalizeActionType('custom-script')).toBe('runScript')
    expect(normalizeActionType('navigate-page')).toBe('navigate')
  })
})

