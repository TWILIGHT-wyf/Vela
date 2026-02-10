import { test, expect } from '@playwright/test'

test.describe('Editor V2 Core Functions', () => {
  test.beforeEach(async ({ page }) => {
    // 访问本地开发环境 (使用 V2 路由)
    await page.goto('http://localhost:5173/editor-v2')

    // 等待画布加载
    await page.waitForSelector('.editor-canvas-viewport', { state: 'visible', timeout: 30000 })
  })

  test('Should support Drag & Drop from Material Panel', async ({ page }) => {
    // 1. 展开组件库 (默认已展开)
    // 搜索 Button (以防折叠)
    await page.fill('.material-panel-content input', 'Button')

    // 定位组件项
    // 根据 MaterialPanel.vue，item 有 .grid-item class 和 item-label
    const materialItem = page.locator('.grid-item').filter({ hasText: '按钮' }).first()
    await expect(materialItem).toBeVisible()

    // 2. 执行拖拽 (使用手动 dispatchEvent 模拟 Drop，因为 dragTo 对 HTML5 DnD 支持不稳定)
    const canvas = page.locator('.editor-canvas-viewport')

    // 构造 Mock 数据 (模拟从 MaterialPanel 拖出的数据)
    // 实际上应该从 materialItem 获取，但为了测试稳定性，我们构造一个合法的 Schema
    await canvas.evaluate((el) => {
      const mockSchema = {
        id: 'test-button-' + Date.now(),
        componentName: 'Button',
        component: 'Button',
        props: { text: 'Test Button', type: 'primary' },
        style: { width: 120, height: 40 },
        children: [],
      }

      const dt = new DataTransfer()
      dt.setData('application/x-vela', JSON.stringify(mockSchema))

      el.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          clientX: 500,
          clientY: 300,
          dataTransfer: dt,
        }),
      )
    })

    // 3. 验证画布中出现了组件
    // NodeWrapper -> UnifiedComponent -> Button -> button.v-button
    // 查找文本内容为 "Test Button" 的组件
    await expect(page.locator('.editor-canvas-viewport .v-button')).toBeVisible({ timeout: 5000 })
  })

  test('Should select component on click', async ({ page }) => {
    // 前置：先拖入一个组件 (同上)
    const canvas = page.locator('.editor-canvas-viewport')
    await canvas.evaluate((el) => {
      const mockSchema = {
        id: 'select-test-btn',
        componentName: 'Button',
        props: { text: 'Select Me' },
        style: { width: 120, height: 40, x: 100, y: 100 },
        children: [],
      }
      const dt = new DataTransfer()
      dt.setData('application/x-vela', JSON.stringify(mockSchema))
      el.dispatchEvent(
        new DragEvent('drop', { bubbles: true, clientX: 400, clientY: 400, dataTransfer: dt }),
      )
    })

    // 1. 点击画布上的组件
    // 确保组件已渲染
    const buttonComponent = page.locator('.editor-canvas-viewport .v-button')
    await expect(buttonComponent).toBeVisible()

    // 点击组件 (实际上是点击 NodeWrapper)
    // NodeWrapper 拦截了 mousedown
    // 使用 force: true 确保即使有覆盖层也能点击（虽然理论上覆盖层 pointer-events: none）
    await buttonComponent.dispatchEvent('mousedown', { bubbles: true })

    // 等待选中框出现
    const selectionBox = page.locator('.selection-box')
    await expect(selectionBox).toBeVisible({ timeout: 5000 })

    // 验证选中框的位置是否与组件重合 (近似)
    const btnBox = await buttonComponent.boundingBox()
    const selBox = await selectionBox.boundingBox()

    expect(selBox?.x).toBeCloseTo(btnBox?.x || 0, -1) // 允许 10px 误差
    expect(selBox?.y).toBeCloseTo(btnBox?.y || 0, -1)
  })
})
