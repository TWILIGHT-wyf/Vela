import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

const nodeWrapperPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/Canvas/modes/Flow/NodeWrapper.vue',
)

describe('NodeWrapper 组件', () => {
  it('应透传 data-id/data-component，统一命中与交互协议', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain(':data-id="nodeId"')
    expect(source).toContain(':data-component="componentLabel"')
    expect(source).toContain("'is-selected': isSelected.value")
    expect(source).toContain('selectedIds.value.includes(props.nodeId)')
  })

  it('应支持修饰键点击切换多选', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('toggleSelection')
    expect(source).toContain('e.ctrlKey || e.metaKey || e.shiftKey')
  })

  it('流式模式选中后应提供宽高拖拽控制点', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showFlowResizeHandles')
    expect(source).toContain('selectedId.value === props.nodeId')
    expect(source).toContain('flow-resize-handle')
    expect(source).toContain("handleFlowResizeStart('e', $event)")
    expect(source).toContain("handleFlowResizeStart('s', $event)")
    expect(source).toContain("handleFlowResizeStart('se', $event)")
    expect(source).toContain('updateStyle(props.nodeId, patch)')
    expect(source).toContain('patch.width = Math.round(pendingWidth)')
    expect(source).toContain('patch.minHeight = Math.round(pendingMinHeight)')
  })

  it('流式模式应在悬停/选中时显示 margin 标注', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showFlowSpacingHints')
    expect(source).toContain('flowSpacingHints')
    expect(source).toContain('resolveSpacing(style,')
    expect(source).toContain("style[`margin${side}`]")
    expect(source).toContain('flow-spacing-hint')
    expect(source).toContain('mt {{ flowSpacingHints.top }}')
    expect(source).toContain('mr {{ flowSpacingHints.right }}')
    expect(source).toContain('mb {{ flowSpacingHints.bottom }}')
    expect(source).toContain('ml {{ flowSpacingHints.left }}')
  })

  it('free 父布局逻辑应使用 geometry 计算绝对定位', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain("if (props.parentLayoutMode === 'free')")
    expect(source).toContain("position: 'absolute'")
    expect(source).toContain('left: formatValue')
    expect(source).toContain('top: formatValue')
    expect(source).toContain('geometry?.x')
    expect(source).toContain('geometry?.y')
  })
})
