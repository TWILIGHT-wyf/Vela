/**
 * CanvasBoard 组件测试（当前画布架构）
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

const canvasBoardPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/Canvas/CanvasBoard.vue',
)

describe('CanvasBoard 组件', () => {
  it('应保持新画布入口：CanvasViewport + FlowCanvas', () => {
    const source = readFileSync(canvasBoardPath, 'utf-8')
    expect(source).toContain('<CanvasViewport>')
    expect(source).toContain('<FlowCanvas embedded />')
  })

  it('Board 层不应再出现旧的 SelectionLayer/canvasStore 桥接', () => {
    const source = readFileSync(canvasBoardPath, 'utf-8')
    expect(source).not.toContain('SelectionLayer')
    expect(source).not.toContain('useCanvasStore')
    expect(source).not.toContain('canvasStore')
  })
})
