import { test, expect } from '@playwright/test'

test('SetterPanel UI Verification', async ({ page }) => {
  test.setTimeout(60000)

  // Monitor console errors
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Console Error: "${msg.text()}"`)
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    console.error(`Page Error: ${err.message}`)
    consoleErrors.push(err.message)
  })

  // 1. Navigate to the editor
  console.log('Navigating to http://localhost:5173/editor-v2...')
  await page.goto('http://localhost:5173/editor-v2', { waitUntil: 'domcontentloaded' })

  console.log('Waiting for .immersive-editor...')
  await page.waitForSelector('.immersive-editor', { timeout: 10000 })

  // Wait for loading screen to disappear
  const loadingScreen = page.locator('.loading-screen')
  if (await loadingScreen.isVisible()) {
    console.log('Waiting for loading screen to disappear...')
    await loadingScreen.waitFor({ state: 'hidden', timeout: 30000 })
  }

  // 2. Ensure Material Panel is visible
  const materialPanel = page.locator('.draggable-panel', { hasText: '组件库' })
  await expect(materialPanel).toBeVisible()

  // 3. Search for Stat
  const searchInput = materialPanel.locator('input[placeholder="搜索组件..."]')
  await searchInput.fill('统计')

  // Wait for filter to apply
  await page.waitForTimeout(500)

  // 4. Find Stat in the material panel
  const statSource = materialPanel.locator('.grid-item').first()
  await expect(statSource).toBeVisible()

  // Log the text to be sure
  console.log('Found material item:', await statSource.textContent())

  // 5. Drag Stat to the canvas
  const canvasStage = page.locator('.canvas-stage')
  await expect(canvasStage).toBeVisible()

  // Use dragTo which is more reliable for drag and drop
  await statSource.dragTo(canvasStage)

  // 6. Verify component is added
  const componentNode = page.locator('.component-node').first()
  await expect(componentNode).toBeVisible({ timeout: 5000 })

  // Check if selected
  await expect(componentNode).toHaveClass(/is-selected/)
  console.log('Component is selected.')

  // 7. Ensure Setter Panel is visible
  const setterPanel = page.locator('.draggable-panel', { hasText: '属性配置' })
  await expect(setterPanel).toBeVisible()

  // 9. Find a visible StringSetter input
  // We look for a visible input inside the setter panel
  const input = setterPanel.locator('.el-input__inner:visible').first()
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

  // Check 1: Layout Stability (width shouldn't change significantly)
  expect(Math.abs(hoveredInputBox.width - inputBox.width)).toBeLessThan(2) // Allow 1px sub-pixel diff

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

    // Should be very close (within 1-2px)
    expect(Math.abs(elInputBox.width - containerBox.width)).toBeLessThan(2)
  } else {
    console.warn('Could not find bounding box for el-input or container')
  }

  console.log('Verification Passed: Input width is stable and consistent.')

  // Check for console errors
  expect(consoleErrors.length).toBe(0)
})
