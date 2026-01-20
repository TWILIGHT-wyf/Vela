# EDITOR KNOWLEDGE BASE

**Location:** `packages/editor`
**Focus:** Main application logic, visual orchestration, and state management.

## OVERVIEW

The core visual editor implementing the low-code dashboard builder with drag-and-drop, multi-mode canvas, and complex state synchronization.

## STRUCTURE

- `src/stores/`: Pinia stores managing project schema, recursive component trees, and history.
- `src/components/Canvas/`: The "Heart" of the editor; supports Free (absolute) and Flow (flex) layout modes.
- `src/components/MaterialPanel/`: Component library that transforms material metadata into drag payloads.
- `src/components/SetterPanel/`: Multi-pane editor for Props, Styles, Events, and Data Linkages (Relations).
- `src/composables/`: Shared interaction logic for dragging, snapping, and event execution.

## WHERE TO LOOK

- **Store Structure**: `src/stores/component.ts` — Manages the `NodeSchema` tree with $O(1)$ Map indexing for fast lookup.
- **Canvas Interaction**: `src/components/Canvas/modes/Free/composables/useCanvasInteraction.ts` — Handles zoom, pan, and dragging.
- **Drag-and-drop System**: `src/composables/useShapeDrag.ts` & `MaterialPanel.vue` (Drag Start).
- **Component Registration**: `src/components/MaterialPanel/MaterialPanel.vue` — Dynamic registration from `@vela/materials`.

## ARCHITECTURE

- **Data Flow**: `MaterialPanel` (Drag) → `Canvas` (Drop) → `ComponentStore` (Tree Update) → `Renderer` package (Reactive UI Update).
- **Indexing System**: Uses `nodeIndex` (ID -> Node) and `parentIndex` (Child -> Parent) to perform constant-time updates on deep trees.
- **Coordinate System**: Free mode uses `(x, y)` relative to canvas origin, transformed by `scale` and `pan` offsets in `useCanvasInteraction`.
- **Layout Conversion**: `src/utils/layoutConverter.ts` handles the non-trivial transformation of component trees between Free and Flow modes.
