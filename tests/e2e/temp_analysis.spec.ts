import { test, expect, type Page } from '@playwright/test'
import { bootstrapProjects, PRIMARY_PROJECT_ID } from './utils/projectFixtures'

async function dropNode(
  page: Page,
  schema: {
    id: string
    component: string
    props?: Record<string, unknown>
    style?: Record<string, unknown>
  },
  position: { x: number; y: number },
) {
  await page.locator('.canvas-stage').evaluate(
    (canvas, payload) => {
      const data = new DataTransfer()
      data.setData(
        'application/x-vela',
        JSON.stringify({
          ...payload.schema,
          children: [],
        }),
      )

      canvas.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          clientX: payload.position.x,
          clientY: payload.position.y,
          dataTransfer: data,
        }),
      )
      canvas.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          clientX: payload.position.x,
          clientY: payload.position.y,
          dataTransfer: data,
        }),
      )
    },
    {
      schema,
      position,
    },
  )
}

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
  const textNodes = page.locator('.component-node[data-component="Text"]')
  const beforeTextCount = await textNodes.count()

  // Scripted drop for cross-browser stability
  await dropNode(
    page,
    {
      id: 'analysis_text_1',
      component: 'Text',
      props: { text: '文本内容', content: '文本内容' },
      style: { width: 180, height: 42 },
    },
    { x: canvasBox.width / 2 - 100, y: canvasBox.height / 2 },
  )
  await page.waitForTimeout(1000) // Wait for drop to process
  await expect(textNodes).toHaveCount(beforeTextCount + 1, { timeout: 5000 })

  // 4. Drop "LineChart" to canvas
  const lineChartNodes = page.locator('.component-node[data-component="lineChart"]')
  const beforeLineChartCount = await lineChartNodes.count()

  await dropNode(
    page,
    {
      id: 'analysis_line_1',
      component: 'lineChart',
      props: {},
      style: { width: 360, height: 240 },
    },
    { x: canvasBox.width / 2 + 100, y: canvasBox.height / 2 },
  )
  await page.waitForTimeout(1000)
  await expect(lineChartNodes).toHaveCount(beforeLineChartCount + 1, { timeout: 5000 })

  // 5. Verify both nodes are rendered and selection works
  const textOnCanvas = textNodes.last()
  await expect(textOnCanvas).toBeVisible()
  await expect(lineChartNodes.last()).toBeVisible()

  await textOnCanvas.click({ force: true })
  await expect(textOnCanvas).toHaveClass(/is-selected/)

  console.log('--- END OF LOGS ---')
  console.log(JSON.stringify(logs, null, 2))
})
