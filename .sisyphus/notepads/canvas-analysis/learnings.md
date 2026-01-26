# Canvas Rendering Architecture Analysis

## 1. Core Pattern: Recursive & Schema-Driven

The engine follows a standard **Recursive Component** pattern:

- **Data Structure**: `NodeSchema` (defined in `@vela/core`) is the atomic unit. It contains `id`, `props`, `children`, `events`, and `style`.
- **Entry Point**: `RuntimeRenderer.vue` takes a `rootNode` prop.
- **Recursion**: `RuntimeComponent.vue` renders a specific component and then iterates over `element.children` to render itself recursively.
- **Component Resolution**: `UnifiedComponent` or direct mapping resolves string names (e.g., "Button") to actual Vue components from `@vela/materials`.

## 2. State Management

- **Single Source of Truth**: The `editor` package's Pinia store (`useComponentStore`) holds the master tree.
- **Prop Flow**: Changes in the store flow down via props to `RuntimeRenderer`.
- **Local State**: `RuntimeRenderer` creates a local copy (via deep clone) to handle high-frequency updates (like dragging or data binding) without spamming the global store.

## 3. Dynamic Behavior

- **Data Binding**: `useDataBindingEngine` watches values and updates node props at runtime.
- **Event Handling**: `useEventExecutor` handles interactions (clicks, etc.) and executes configured actions (scripts, API calls).
