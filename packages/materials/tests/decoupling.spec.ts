import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function walkFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, files)
      continue
    }
    if (fullPath.endsWith('.vue') || fullPath.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

describe('materials decoupling', () => {
  it('does not depend on @vela/editor store modules', () => {
    const srcRoot = path.resolve(__dirname, '../src')
    const allFiles = walkFiles(srcRoot)
    const violations: string[] = []

    allFiles.forEach((filePath) => {
      const text = fs.readFileSync(filePath, 'utf8')
      if (text.includes('@vela/editor/')) {
        violations.push(path.relative(srcRoot, filePath))
      }
    })

    expect(violations).toEqual([])
  })
})
