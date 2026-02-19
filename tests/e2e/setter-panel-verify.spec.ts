import { test, expect } from '@playwright/test'

test('SetterPanel UI Verification', async ({ page }) => {
  test.setTimeout(60000)

  const isIgnorableConsoleError = (text: string) => {
    return text.includes('favicon.ico') || text.includes('404 (Not Found)')
  }

  // Monitor console errors
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      if (isIgnorableConsoleError(msg.text())) return
      console.error(`Console Error: "${msg.text()}"`)
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    if (isIgnorableConsoleError(err.message)) return
    console.error(`Page Error: ${err.message}`)
    consoleErrors.push(err.message)
  })

  // 1. Navigate to the editor
  console.log('Navigating to /editor-v2...')
  await page.goto('/editor-v2', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-testid="canvas-board"]')).toBeVisible({ timeout: 30000 })

  // Wait for loading screen to disappear
  const loadingScreen = page.locator('.loading-screen')
  if (await loadingScreen.isVisible()) {
    console.log('Waiting for loading screen to disappear...')
    await loadingScreen.waitFor({ state: 'hidden', timeout: 30000 })
  }

  // 2. Ensure Material Panel is visible
  const materialPanel = page.locator('.draggable-panel', { hasText: '组件库' })
  await expect(materialPanel).toBeVisible()

  // 3. Search for Text
  const searchInput = materialPanel.locator('input[placeholder="搜索组件..."]')
  await searchInput.fill('文本')

  // Wait for filter to apply
  await page.waitForTimeout(500)

  // 4. Find Text in the material panel
  const textSource = materialPanel.locator('.grid-item').filter({ hasText: /^文本$/ }).first()
  await expect(textSource).toBeVisible()

  // Log the text to be sure
  console.log('Found material item:', await textSource.textContent())

  // 5. Drop Text to the canvas (scripted drop for cross-browser stability)
  const canvasStage = page.locator('.canvas-stage')
  await expect(canvasStage).toBeVisible()
  const textNodes = page.locator('.component-node[data-component="Text"]')
  const beforeTextCount = await textNodes.count()
  await canvasStage.evaluate((el) => {
    const mockSchema = {
      id: 'verify_text_1',
      component: 'Text',
      props: { text: '验证文本', content: '验证文本' },
      style: { width: 180, height: 40 },
      children: [],
    }
    const data = new DataTransfer()
    data.setData('application/x-vela', JSON.stringify(mockSchema))
    el.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: 500,
        clientY: 260,
        dataTransfer: data,
      }),
    )
  })

  // 6. Verify component is added
  await expect(textNodes).toHaveCount(beforeTextCount + 1, { timeout: 5000 })
  const componentNode = textNodes.last()
  await expect(componentNode).toBeVisible()

  // Check if selected
  await componentNode.click({ force: true })
  await expect(componentNode).toHaveClass(/is-selected/, { timeout: 5000 })
  console.log('Component is selected.')

  // 7. Ensure Setter Panel is visible
  const setterPanel = page.locator('.draggable-panel', { hasText: '属性配置' })
  await expect(setterPanel).toBeVisible()

  // 9. Find a visible StringSetter input
  // We look for a visible input inside the setter panel
  const input = setterPanel.locator('.el-input__inner').first()
  await expect(input).toBeVisible({ timeout: 5000 })

  // 10. Measure width consistency
  const inputBox = await input.boundingBox()
  if (!inputBox) throw new Error('Input bounding box not found')

  console.log(`Initial Input Width: ${inputBox.width}`)

  // 11. Hover and check for layout shift
  await input.hover()
  await page.waitForTimeout(500) // Wait for any transition

  const hoveredInputBox = await input.boundingBox()
  if (!hoveredInputBox) throw new Error('Hovered input bounding box not found')

  console.log(`Hovered Input Width: ${hoveredInputBox.width}`)

  // Check 1: Layout Stability (hover does not cause severe width collapse)
  const widthDelta = Math.abs(hoveredInputBox.width - inputBox.width)
  const widthDeltaRatio = widthDelta / Math.max(inputBox.width, 1)
  expect(widthDeltaRatio).toBeLessThan(0.2)
  expect(hoveredInputBox.width).toBeGreaterThan(180)

  // Check 2: Width Consistency (should be "full width")
  // We need to find the el-input root element (which has style="width: 100%")
  // The input found is .el-input__inner.
  // Hierarchy: el-input -> el-input__wrapper -> el-input__inner
  const elInput = input.locator('xpath=ancestor::div[contains(@class, "el-input")]').first()
  const elInputBox = await elInput.boundingBox()

  // The container is the parent of el-input, which is usually el-form-item__content
  const container = elInput.locator('xpath=..')
  const containerBox = await container.boundingBox()

  if (elInputBox && containerBox) {
    console.log(`el-input Width: ${elInputBox.width}`)
    console.log(`Container Width: ${containerBox.width}`)

    // Keep most available width to avoid obvious layout break
    const fillRatio = elInputBox.width / Math.max(containerBox.width, 1)
    expect(fillRatio).toBeGreaterThan(0.8)
  } else {
    console.warn('Could not find bounding box for el-input or container')
  }

  console.log('Verification Passed: Input width is stable and consistent.')

  // Check for console errors
  expect(consoleErrors.length).toBe(0)
})
