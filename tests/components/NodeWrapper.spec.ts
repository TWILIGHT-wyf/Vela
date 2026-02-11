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

  it('应支持 Alt + 点击快速选中父容器', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('if (e.altKey)')
    expect(source).toContain('const parentId = componentStore.getParentId(props.nodeId)')
    expect(source).toContain('selectComponent(parentId)')
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

  it('网格编排模式应在悬停/选中时显示全面积 margin 覆盖层', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    // 新 API: showMarginOverlays + marginPx（替换旧 showFlowSpacingHints + flowSpacingHints）
    expect(source).toContain('showMarginOverlays')
    expect(source).toContain('marginPx')
    expect(source).toContain('margin-overlay')
    expect(source).toContain('margin-overlay-top')
    expect(source).toContain('margin-overlay-right')
    expect(source).toContain('margin-overlay-bottom')
    expect(source).toContain('margin-overlay-left')
    // 使用 overlay-label 替换旧 flow-spacing-hint
    expect(source).toContain('overlay-label')
    // 仅网格模式触发
    expect(source).toContain("parentLayoutMode !== 'grid'")
  })

  it('网格编排模式应支持拖拽 margin 覆盖层调整外边距', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain("handleFlowSpacingDragStart('top', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('right', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('bottom', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('left', $event)")
    expect(source).toContain('parseMarginShorthand')
    expect(source).toContain('resolveSpacingNumber(style, side)')
    expect(source).toContain('const patch = { [styleKey]: Math.round(pendingMargin) }')
    // 使用面积型覆盖层替代旧的细线 handle
    expect(source).toContain('.margin-overlay-top')
    expect(source).toContain('.margin-overlay-right')
    expect(source).toContain('.margin-overlay-bottom')
    expect(source).toContain('.margin-overlay-left')
  })

  it('选中时应显示全面积 padding 覆盖层并支持拖拽调整内边距', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showPaddingOverlays')
    expect(source).toContain('paddingPx')
    expect(source).toContain('resolvePaddingNumber')
    expect(source).toContain('parsePaddingShorthand')
    expect(source).toContain('handlePaddingDragStart')
    expect(source).toContain("handlePaddingDragStart('top', $event)")
    expect(source).toContain("handlePaddingDragStart('right', $event)")
    expect(source).toContain("handlePaddingDragStart('bottom', $event)")
    expect(source).toContain("handlePaddingDragStart('left', $event)")
    expect(source).toContain('padding-overlay')
    expect(source).toContain('padding-overlay-top')
    expect(source).toContain('padding-overlay-right')
    expect(source).toContain('padding-overlay-bottom')
    expect(source).toContain('padding-overlay-left')
    // padding 拖拽方向：向内拖增加（不同于 margin 的方向）
    expect(source).toContain("if (side === 'top') next = baseVal + dy")
    // Escape 同样可取消 padding 调整
    expect(source).toContain('PADDING_RANGE')
  })

  it('容器有子元素时不应使用 padding 扩大命中区（避免子组件漂移）', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    // 容器选中状态只用 box-shadow: inset，不用 padding
    expect(source).toContain('box-shadow: inset 0 0 0 1px rgba(14, 116, 144, 0.35)')
    expect(source).not.toContain('  padding: 6px;')
  })

  it('容器作为拖拽目标时应提供明确的放入内部高亮态', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('isDropInsideActive')
    expect(source).toContain("state.targetId === props.nodeId && state.position === 'inside'")
    expect(source).toContain("'is-drop-inside': isDropInsideActive.value")
    expect(source).toContain('.editor-node-wrapper.is-container.is-drop-inside:not(.is-empty)')
    expect(source).toContain("content: '释放到容器内部'")
  })

  it('应在目标节点内显示 before/after 拖拽边缘指示', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('showDropEdgeIndicator')
    expect(source).toContain('drop-edge-indicator')
    expect(source).toContain('isDropBeforeActive')
    expect(source).toContain('isDropAfterActive')
    expect(source).toContain("'is-row': dropIndicatorDirection.value === 'row'")
    expect(source).toContain("'is-column': dropIndicatorDirection.value === 'column'")
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

  it('网格编排模式应输出显式 grid 坐标，margin 不与 width/height:100% 冲突', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain("if (props.parentLayoutMode === 'grid')")
    expect(source).toContain('gridColumnStart')
    expect(source).toContain('gridColumnEnd')
    expect(source).toContain('gridRowStart')
    expect(source).toContain('gridRowEnd')
    // No explicit width/height on grid item wrapper: rely on CSS grid stretch to avoid
    // margin overflow (width:100% + margin > cell width).
    expect(source).not.toContain("width: '100%',\n      // No explicit")
    // Nested grid CSS (display:grid, template) is on UniversalRenderer innerStyle, NOT here.
    // This ensures child NodeWrappers are direct children of the CSS grid container.
    expect(source).not.toContain('gridTemplateColumns: nestedGrid.columns ||')
    expect(source).not.toContain('gridTemplateRows: nestedGrid.rows ||')
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

  it('UniversalRenderer 应将嵌套网格 CSS 应用到内层组件元素上', () => {
    const urPath = path.resolve(
      __dirname,
      '../../packages/editor/src/components/Canvas/UniversalRenderer.vue',
    )
    const source = readFileSync(urPath, 'utf-8')
    expect(source).toContain("props.node.container?.mode === 'grid'")
    expect(source).toContain("style.display = 'grid'")
    expect(source).toContain('style.gridTemplateColumns = gridContainer.columns')
    expect(source).toContain('style.gridTemplateRows = gridContainer.rows')
  })

  it('useFlowDrop 应支持 Shift 强制同级插入并优化容器 edgeZone 判定', () => {
    const dropPath = path.resolve(
      __dirname,
      '../../packages/editor/src/components/Canvas/modes/Flow/useFlowDrop.ts',
    )
    const source = readFileSync(dropPath, 'utf-8')
    expect(source).toContain('isShiftPressed')
    expect(source).toContain('if (isShiftPressed)')
    expect(source).toContain("return ratio < 0.5 ? 'before' : 'after'")
    expect(source).toContain('const edgeZone = Math.min(28, Math.max(10, edgeSize * 0.18))')
    expect(source).toContain('const centerZone = edgeSize - edgeZone * 2')
    expect(source).toContain(
      'updateIndicatorState(e.clientX, e.clientY, node, element, e.altKey, e.shiftKey)',
    )
  })
})
