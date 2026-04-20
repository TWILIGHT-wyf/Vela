import { generateNodeId, generatePageId, generatePageRootId, generateProjectId } from '@vela/core'

describe('id helpers', () => {
  it('generates stable prefixed IDs for canonical entities', () => {
    expect(generateProjectId()).toMatch(/^project_/)
    expect(generatePageId()).toMatch(/^page_/)
    expect(generateNodeId()).toMatch(/^node_/)
    expect(generateNodeId('table')).toMatch(/^table_/)
  })

  it('derives page root IDs from page ID when provided', () => {
    expect(generatePageRootId('page_123')).toBe('page_123_root')
    expect(generatePageRootId()).toMatch(/^root_/)
  })
})
