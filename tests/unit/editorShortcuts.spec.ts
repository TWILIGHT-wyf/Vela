import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

const shortcutsPath = path.resolve(__dirname, '../../packages/editor/src/composables/useEditorShortcuts.ts')
const transformPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/Canvas/composables/useTransform.ts',
)
const flowCanvasPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/Canvas/modes/Flow/FlowCanvas.vue',
)

describe('editor shortcuts / transform interaction', () => {
  it('删除快捷键应优先按多选批量删除', () => {
    const source = readFileSync(shortcutsPath, 'utf-8')
    expect(source).toContain('selectedIds.value.length > 1')
    expect(source).toContain('deleteComponents([...selectedIds.value])')
    expect(source).toContain('const targetId = selectedId.value ?? selectedIds.value[0]')
  })

  it('应支持方向键微调与 Shift 大步长', () => {
    const source = readFileSync(shortcutsPath, 'utf-8')
    expect(source).toContain('options.enableNudge ?? true')
    expect(source).toContain("if (e.key === 'ArrowLeft') dx = -1")
    expect(source).toContain("if (e.key === 'ArrowRight') dx = 1")
    expect(source).toContain("if (e.key === 'ArrowUp') dy = -1")
    expect(source).toContain("if (e.key === 'ArrowDown') dy = 1")
    expect(source).toContain("const step = e.shiftKey ? (options.nudgeLargeStep ?? 10) : (options.nudgeStep ?? 1)")
  })

  it('拖拽应支持 Alt 临时关闭吸附', () => {
    const source = readFileSync(transformPath, 'utf-8')
    expect(source).toContain('if (!ev.altKey)')
    expect(source).toContain('clearSnap()')
  })

  it('画布应展示交互提示文案', () => {
    const source = readFileSync(flowCanvasPath, 'utf-8')
    expect(source).toContain('Ctrl/Cmd/Shift + 点击：多选')
    expect(source).toContain('选中组件后拖拽边缘手柄：调整宽高')
    expect(source).toContain('悬停节点可查看 margin 标注')
    expect(source).toContain('方向键微调（Shift 加速）')
    expect(source).toContain('Alt + 拖拽：临时关闭吸附')
  })
})
