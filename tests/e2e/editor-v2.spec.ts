import { test, expect, type Page } from '@playwright/test'

const canvasSelector = '[data-testid="canvas-board"]'

type DropSchema = {
  id: string
  component: string
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  children?: unknown[]
}

async function dropNode(
  page: Page,
  schema: DropSchema,
  position = { x: 500, y: 300 },
) {
  await page.locator(canvasSelector).evaluate(
    (canvasRoot, payload) => {
      const target =
        (canvasRoot.querySelector('.canvas-stage') as HTMLElement | null) ?? canvasRoot
      const data = new DataTransfer()
      data.setData('application/x-vela', JSON.stringify(payload.schema))

      target.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          clientX: payload.position.x,
          clientY: payload.position.y,
          dataTransfer: data,
        }),
      )

      target.dispatchEvent(
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
      schema: {
        ...schema,
        children: schema.children || [],
      },
      position,
    },
  )
}

test.describe('Editor V2 Core Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor-v2')
    await expect(page.locator(canvasSelector)).toBeVisible({ timeout: 30000 })
  })

  test('Should support Drag & Drop from Material Panel', async ({ page }) => {
    await page.fill('.material-panel-content input', '按钮')
    const materialItem = page.locator('.grid-item').filter({ hasText: /按钮|Button/ }).first()
    await expect(materialItem).toBeVisible()

    const buttonNodes = page.locator('.component-node[data-component="Button"]')
    const beforeCount = await buttonNodes.count()

    await dropNode(page, {
      id: 'test_button_drag',
      component: 'Button',
      props: { text: 'Test Button', type: 'primary' },
      style: { width: 120, height: 40 },
    })

    await expect(buttonNodes).toHaveCount(beforeCount + 1, { timeout: 5000 })
    const node = buttonNodes.last()
    await expect(node).toContainText('Test Button')
  })

  test('Should select component on click', async ({ page }) => {
    const buttonNodes = page.locator('.component-node[data-component="Button"]')
    const beforeCount = await buttonNodes.count()

    await dropNode(page, {
      id: 'select_test_btn',
      component: 'Button',
      props: { text: 'Select Me', type: 'primary' },
      style: { width: 120, height: 40, x: 100, y: 100 },
    })

    await expect(buttonNodes).toHaveCount(beforeCount + 1, { timeout: 5000 })
    const node = buttonNodes.last()

    await node.evaluate((el) => {
      el.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    await expect(node).toHaveClass(/is-selected/)
  })
})
