# Layout Architecture Upgrade: From Free to Hybrid (Flow + Free)

## 1. Current State Analysis

- **Free Layout (Current)**:
  - **Schema**: `x`, `y` coordinates.
  - **Render**: `position: absolute`.
  - **Interaction**: Drag moves `x/y`.
  - **Limit**: Not responsive, hard to manage list-like content.
- **Flow Layout (Partial/Missing)**:
  - `flow-engine.ts` is referenced but **missing**.
  - `useFlowDrop.ts` exists for DnD, but rendering support is likely incomplete.
  - No CSS generation strategy for Flow items.

## 2. Proposed "Hybrid Container" Architecture

Instead of a global "Mode", we treat **Layout as a Container Property**.

### A. The Core Concept

Every Container component (Page, Box, Card) has a `layoutMode` property:

- `layoutMode: 'free'`: Children are absolute (Canvas-like).
- `layoutMode: 'flex'` (Flow): Children are static/relative (Document-like).

### B. Data Structure

```typescript
interface NodeSchema {
  id: string
  componentName: string
  props: Record<string, any>
  style: NodeStyle // width, height, padding, margin
  // New Layout Props
  layout?: {
    mode: 'free' | 'flex' | 'grid'
    // Flex Props (only if mode === 'flex')
    direction?: 'row' | 'column'
    justify?: 'flex-start' | 'center' | 'space-between'
    align?: 'flex-start' | 'center'
    gap?: number
    // Grid Props (only if mode === 'grid')
    columns?: number
  }
  children?: NodeSchema[]
}
```

### C. The Missing Link: `FlowLayoutEngine`

We need to implement `packages/core/src/layout/flow-engine.ts` to generate CSS for Flow containers.

- **Container CSS**: `display: flex`, `flex-direction`, `gap`.
- **Item CSS**: `position: relative` (reset absolute), `flex-grow`, `margin`.

### D. Visual Interaction (Editor)

- **Free Mode**: Box selection, Drag Handle (Current).
- **Flow Mode**:
  - **Drop Zones**: Blue lines showing insertion points (Between items).
  - **Ghost Element**: Placeholder during drag.
  - **Sorting**: Dragging reorders the `children` array, not `x/y`.

## 3. Implementation Plan

1.  **Core**: Implement `FlowLayoutEngine` (Create missing file).
2.  **Schema**: Update `NodeSchema` to support flex props.
3.  **Editor**: Implement "Drop Zone" visualizer for Flow containers.
4.  **Converter**: Enhance `layoutConverter` to smart-convert (Free -> Sort by Y -> Flow).

---

**Next Step**: I will implement the missing `flow-engine.ts` to establish the foundation.
