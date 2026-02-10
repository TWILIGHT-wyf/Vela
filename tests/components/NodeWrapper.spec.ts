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

  it('网格编排模式选中后应提供8方向跨度调节控制点', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showFlowResizeHandles')
    expect(source).toContain('selectedId.value === props.nodeId')
    expect(source).toContain("props.parentLayoutMode === 'grid'")
    expect(source).toContain('flow-resize-handle')
    // 8方向 resize handles
    expect(source).toContain("handleFlowResizeStart('n', $event)")
    expect(source).toContain("handleFlowResizeStart('e', $event)")
    expect(source).toContain("handleFlowResizeStart('s', $event)")
    expect(source).toContain("handleFlowResizeStart('w', $event)")
    expect(source).toContain("handleFlowResizeStart('nw', $event)")
    expect(source).toContain("handleFlowResizeStart('ne', $event)")
    expect(source).toContain("handleFlowResizeStart('se', $event)")
    expect(source).toContain("handleFlowResizeStart('sw', $event)")
    expect(source).toContain('handleGridFrResize(handle, e)')
    expect(source).toContain('componentStore.updateGridTemplate(parentId, cols, rows)')
    expect(source).toContain('const colFrValues = parseFrTemplate(parentContainer.columns)')
    expect(source).toContain('const rowFrValues = parseFrTemplate(parentContainer.rows)')
  })

  it('应支持 Escape 键取消 resize 和 spacing 拖拽操作', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    // Escape 取消 resize
    expect(source).toContain("if (ev.key === 'Escape')")
    expect(source).toContain('cancelled = true')
    expect(source).toContain("window.addEventListener('keydown', onKeyDown)")
  })

  it('网格编排模式应在悬停/选中时显示 margin 标注', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showFlowSpacingHints')
    expect(source).toContain('flowSpacingHints')
    expect(source).toContain('resolveSpacing(style,')
    expect(source).toContain('style[`margin${side}`]')
    expect(source).toContain('flow-spacing-hint')
    expect(source).toContain('mt {{ flowSpacingHints.top }}')
    expect(source).toContain('mr {{ flowSpacingHints.right }}')
    expect(source).toContain('mb {{ flowSpacingHints.bottom }}')
    expect(source).toContain('ml {{ flowSpacingHints.left }}')
  })

  it('网格编排模式应支持拖拽外侧线调整 margin', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showFlowSpacingHandles')
    expect(source).toContain("handleFlowSpacingDragStart('top', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('right', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('bottom', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('left', $event)")
    expect(source).toContain('parseMarginShorthand')
    expect(source).toContain('resolveSpacingNumber(style, side)')
    expect(source).toContain('const patch = { [styleKey]: Math.round(pendingMargin) }')
    expect(source).toContain('.flow-spacing-handle.spacing-top')
    expect(source).toContain('.flow-spacing-handle.spacing-right')
    expect(source).toContain('.flow-spacing-handle.spacing-bottom')
    expect(source).toContain('.flow-spacing-handle.spacing-left')
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

  it('网格编排模式应输出显式 grid 坐标并兼容容器嵌套网格', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain("if (props.parentLayoutMode === 'grid')")
    expect(source).toContain('gridColumnStart')
    expect(source).toContain('gridColumnEnd')
    expect(source).toContain('gridRowStart')
    expect(source).toContain('gridRowEnd')
    expect(source).toContain("width: '100%'")
    expect(source).toContain("height: '100%'")
    expect(source).toContain("display: 'grid'")
    expect(source).toContain('gridTemplateColumns: nestedGrid.columns ||')
    expect(source).toContain('gridTemplateRows: nestedGrid.rows ||')
    expect(source).toContain(
      'marginTop: formatOptionalValue(style.marginTop as string | number | undefined)',
    )
    expect(source).toContain(
      'marginRight: formatOptionalValue(style.marginRight as string | number | undefined)',
    )
    expect(source).toContain(
      'marginBottom: formatOptionalValue(style.marginBottom as string | number | undefined)',
    )
    expect(source).toContain(
      'marginLeft: formatOptionalValue(style.marginLeft as string | number | undefined)',
    )
  })
})
