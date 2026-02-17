import { test, expect, type Page } from '@playwright/test'
import { bootstrapProjects, PRIMARY_PROJECT_ID } from './utils/projectFixtures'

const canvasSelector = '[data-testid="canvas-board"]'
const componentSelector = '[data-component-id="text_1"]'

async function gotoDashboard(page: Page) {
  await bootstrapProjects(page)
  await page.goto('/')
  await expect(page).toHaveTitle(/Vela|Studio|项目工作台/i)
}

async function gotoEditor(page: Page) {
  await bootstrapProjects(page)
  await page.goto(`/editor/${PRIMARY_PROJECT_ID}`)
  await expect(page.locator(canvasSelector)).toBeVisible({ timeout: 15000 })
}

test.describe('Dashboard 工作台', () => {
  test('展示项目卡片并支持搜索过滤', async ({ page }) => {
    await gotoDashboard(page)

    await expect(page.locator('.project-card .project-name', { hasText: '演示项目' })).toBeVisible()

    const searchInput = page.locator('input[placeholder="搜索项目..."]')
    await searchInput.fill('图表')
    await page.waitForTimeout(300)

    await expect(page.locator('.project-card .project-name', { hasText: '演示项目' })).toHaveCount(
      0,
    )
    await expect(page.locator('.project-card .project-name', { hasText: '图表分析' })).toHaveCount(
      1,
    )
  })

  test('点击项目卡片可进入编辑页', async ({ page }) => {
    await gotoDashboard(page)

    const targetCard = page.locator('.project-card', { hasText: '演示项目' }).first()
    await targetCard.click()

    await page.waitForURL(`/editor/${PRIMARY_PROJECT_ID}`)
    await expect(page.locator(canvasSelector)).toBeVisible()
  })
})

test.describe('Editor 冒烟路径', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page)
  })

  test('画布、组件栏、属性面板均渲染', async ({ page }) => {
    await expect(page.locator(canvasSelector)).toBeVisible()
    await expect(page.locator('.component-bar-root')).toBeVisible()
    await expect(page.locator('.sider-root')).toBeVisible()
  })

  test('切换事件面板后可添加点击动作', async ({ page }) => {
    await page.locator(componentSelector).first().click()

    const eventTab = page.locator('.el-tabs__item', { hasText: '事件' })
    await eventTab.click()

    await expect(page.getByTestId('events-panel')).toBeVisible()
    await page.getByTestId('add-click-event').click()

    await expect(page.locator('.action-card')).toHaveCount(1)
  })
})
