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

  it('普通点击应走命中链选择，支持重复点击逐级选父', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain('selectByHitPath')
    expect(source).toContain('const nextId = selectByHitPath(props.nodeId)')
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

  it('任意布局模式在悬停/选中时应显示全面积 margin 覆盖层', () => {
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
    // 有选中目标时仅显示当前选中，避免切换组件时出现多目标叠加异常
    expect(source).toContain('if (selectedIds.value.length > 0) return isSelected.value')
    expect(source).toContain('return isHovered.value')
    // 拖拽反馈进行中时关闭，避免视觉冲突
    expect(source).toContain('if (isDragFeedbackActive.value) return false')
  })

  it('网格编排模式应支持拖拽 margin 覆盖层调整外边距', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).toContain("handleFlowSpacingDragStart('top', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('right', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('bottom', $event)")
    expect(source).toContain("handleFlowSpacingDragStart('left', $event)")
    expect(source).toContain('parseMarginShorthand')
    expect(source).toContain('const baseMargin = marginPx.value[side]')
    expect(source).toContain('const patch = { [styleKey]: Math.round(pendingMargin) }')
    // 使用面积型覆盖层替代旧的细线 handle
    expect(source).toContain('.margin-overlay-top')
    expect(source).toContain('.margin-overlay-right')
    expect(source).toContain('.margin-overlay-bottom')
    expect(source).toContain('.margin-overlay-left')
    // 调整中仅显示当前侧
    expect(source).toContain("activeSpacingKind.value !== 'margin'")
    expect(source).toContain('return activeSpacingSide.value === side')
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
    // 选中即显示（保留最小命中 strip），不要求 padding > 0
    expect(source).toContain('return isSelected.value')
    expect(source).toContain('Math.max(paddingPx.top, MIN_PADDING_HIT_SIZE)')
    // 调整中仅显示当前侧
    expect(source).toContain("activeSpacingKind.value !== 'padding'")
    expect(source).toContain('return activeSpacingSide.value === side')
  })

  it('容器有子元素时不应使用 padding 扩大命中区（避免子组件漂移）', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    // 容器选中状态只用 box-shadow: inset，不用 padding
    expect(source).toContain('box-shadow: inset 0 0 0 1px rgba(14, 116, 144, 0.35)')
    expect(source).not.toContain('  padding: 6px;')
  })

  it('拖拽提示应由 DropIndicator 统一渲染，NodeWrapper 不再渲染本地 drop 提示线', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    expect(source).not.toContain('drop-edge-indicator')
    expect(source).not.toContain('is-drop-inside')
    expect(source).not.toContain('isDropInsideActive')
  })

  it('FlowCanvas 应挂载 DropIndicator 作为唯一拖拽反馈组件', () => {
    const flowCanvasPath = path.resolve(
      __dirname,
      '../../packages/editor/src/components/Canvas/modes/Flow/FlowCanvas.vue',
    )
    const source = readFileSync(flowCanvasPath, 'utf-8')
    expect(source).toContain('<DropIndicator')
    expect(source).toContain("import DropIndicator from './DropIndicator.vue'")
    // 根容器空白区 dragover 时清理节点提示，避免提示线残留
    expect(source).toContain("const overNode = target?.closest('[data-id]')")
    expect(source).toContain('flowDrop.hideIndicator()')
    // 根容器提示仅在没有节点级指示器时显示，避免叠加
    expect(source).toContain('showRootDropHint')
    expect(source).toContain('!flowDrop.indicator.value.visible')
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

  it('编辑模式应阻止组件内部交互，模拟运行时恢复交互', () => {
    const source = readFileSync(nodeWrapperPath, 'utf-8')
    // 编辑模式透明遮罩拦截所有 pointer events
    expect(source).toContain('interaction-blocker')
    expect(source).toContain('v-if="!isSimulationMode"')
    expect(source).toContain('isSimulationMode')
    // 从 UI store 读取模拟模式状态
    expect(source).toContain('useUIStore')
    expect(source).toContain('storeToRefs(uiStore)')
    // 遮罩必须在 slot（组件内容）之上，但在 resize 手柄和 box-model overlays 之下
    expect(source).toContain('.interaction-blocker')
    expect(source).toContain('pointer-events: auto')
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
