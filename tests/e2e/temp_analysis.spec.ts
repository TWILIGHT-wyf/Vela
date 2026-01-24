import { test, expect, type Page } from '@playwright/test'
import { bootstrapProjects, PRIMARY_PROJECT_ID } from './utils/projectFixtures'

test('Analyze basic components and chart interaction', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    logs.push(`[${msg.type()}] ${text}`)
    console.log(`[Browser Console] [${msg.type()}] ${text}`)
  })
  page.on('pageerror', (err) => {
    logs.push(`[error] ${err.message}`)
    console.log(`[Browser Error] ${err.message}`)
  })

  // 1. Setup and Navigate
  await bootstrapProjects(page)
  await page.goto(`/editor/${PRIMARY_PROJECT_ID}`)

  // Wait for editor to load
  await expect(page.locator('[data-testid="canvas-board"]')).toBeVisible({ timeout: 30000 })

  // 2. Open Basic Components
  const basicTab = page.locator('.el-tabs__item', { hasText: '基础组件' })
  if (await basicTab.isVisible()) {
    await basicTab.click()
  }

  // Ensure "基础组件" category is expanded
  // Note: Using regex to match text loosely
  const basicCategory = page.locator('.el-collapse-item__header', { hasText: /基础组件/ }).first()
  if (await basicCategory.isVisible()) {
    // Element Plus collapse header usually doesn't indicate expanded state easily in selector without class check
    // But clicking it might toggle. We should check if content is visible.
    const textItem = page.locator('.grid-item', { hasText: /^文本$/ }).first()
    if (!(await textItem.isVisible())) {
      await basicCategory.click()
      await page.waitForTimeout(500)
    }
  }

  // 3. Drag "Text" to canvas
  const textItem = page.locator('.grid-item', { hasText: /^文本$/ }).first()
  await expect(textItem).toBeVisible()

  const canvas = page.locator('[data-testid="canvas-board"]')
  const canvasBox = await canvas.boundingBox()
  if (!canvasBox) throw new Error('Canvas not found')

  // Drag and drop Text
  await textItem.dragTo(canvas, {
    targetPosition: { x: canvasBox.width / 2 - 100, y: canvasBox.height / 2 },
  })
  await page.waitForTimeout(1000) // Wait for drop to process

  // 4. Drag "LineChart" to canvas
  const chartCategory = page.locator('.el-collapse-item__header', { hasText: /图表/ }).first()
  await chartCategory.click()
  await page.waitForTimeout(500)

  const lineChartItem = page.locator('.grid-item', { hasText: /^折线图$/ }).first()
  await expect(lineChartItem).toBeVisible()

  await lineChartItem.dragTo(canvas, {
    targetPosition: { x: canvasBox.width / 2 + 100, y: canvasBox.height / 2 },
  })
  await page.waitForTimeout(1000)

  // 5. Move Text component
  // Find the text component on canvas.
  // We select the one with "文本内容" text which is the default content
  const textOnCanvas = page.locator('.shape-wrapper', { hasText: '文本内容' }).first()
  await expect(textOnCanvas).toBeVisible()

  const textIcon = await textOnCanvas.boundingBox()
  if (textIcon) {
    // Move mouse to center of component
    await page.mouse.move(textIcon.x + textIcon.width / 2, textIcon.y + textIcon.height / 2)
    await page.mouse.down()
    // Move by 100px
    await page.mouse.move(
      textIcon.x + textIcon.width / 2 + 100,
      textIcon.y + textIcon.height / 2 + 100,
    )
    await page.mouse.up()
  }

  await page.waitForTimeout(2000) // Wait for any final logs

  console.log('--- END OF LOGS ---')
  console.log(JSON.stringify(logs, null, 2))
})
