import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const exportDialogPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/dialogs/ExportConfigDialog.vue',
)

describe('ExportConfigDialog', () => {
  it('uses strict generation policy for export', () => {
    const source = readFileSync(exportDialogPath, 'utf-8')
    expect(source).toContain('continueOnError: false')
  })
})
