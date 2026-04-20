import {
  createRoutePage,
  ensurePageRoot,
  getPageRoot,
  setPageRoot,
  type DialogPage,
  type NodeSchema,
} from '@vela/core'

describe('page root helpers', () => {
  it('returns and replaces page root through helpers', () => {
    const page = createRoutePage('page_home', '/', 'Home')
    const nextRoot: NodeSchema = {
      id: 'custom_root',
      component: 'Page',
      children: [],
    }

    expect(getPageRoot(page)?.id).toBe('page_home_root')
    expect(setPageRoot(page, nextRoot).children?.id).toBe('custom_root')
    expect(getPageRoot(page)).toBe(nextRoot)
  })

  it('ensures a stable default root when page root is missing', () => {
    const page: DialogPage = {
      id: 'dialog_page',
      type: 'dialog',
      name: 'Dialog',
    }

    const root = ensurePageRoot(page)

    expect(root.id).toBe('dialog_page_root')
    expect(root.component).toBe('Dialog')
    expect(root.children).toEqual([])
    expect(getPageRoot(page)).toBe(root)
  })
})
