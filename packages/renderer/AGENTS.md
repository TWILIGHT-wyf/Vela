# PACKAGE: @vela/renderer

## OVERVIEW

High-performance runtime engine for recursive component rendering, reactive data linking, and sandboxed event execution.

## STRUCTURE

```
packages/renderer/src/
├── RecursiveRenderer.vue   # Component tree traversal (depth-first)
├── runtime/
│   ├── useDataBindingEngine.ts # O(1) reactive synchronization & cycle protection
│   ├── useEventExecutor.ts # Action dispatcher with Proxy-based sandbox
│   └── useComponentDataSource.ts # Lifecycle-aware data fetching
└── types.ts                # Runtime schemas (NodeSchema vs Component)
```

## RUNTIME ENGINE

### Recursive Rendering

Performs depth-first traversal of `NodeSchema`. It dynamically resolves components from `@vela/materials` registry, injecting scoped props, styles, and nested children into the Vue lifecycle.

### Data Binding Engine

- **Performance**: Uses `Map` indexing for $O(1)$ component discovery and `watch` on specific paths to minimize re-renders.
- **Cycle Protection**: Implements `updateLocks` (Set-based) to detect and terminate infinite update loops (e.g., A ↔ B).
- **Transformation**: Supports `template` (interpolation) and `expression` (compiled JS) via `new Function` with immediate value mapping.

### Event Execution

Centralized dispatcher for action sequences. Supports delays, visual feedback (highlighting/animations), and page navigation. Multi-step actions are executed sequentially with `await` support.

## SECURITY (Sandbox Rules)

Custom JS scripts in `custom-script` actions are isolated using a **Proxy-based Sandbox**:

1. **Global Whitelist**: Access restricted to safe globals (`JSON`, `Math`, `Date`, `console`, `Promise`, etc.).
2. **Scope Isolation**: Uses `with(proxy)` to intercept all variable lookups. Any variable not in whitelist or provided context returns `undefined`.
3. **No DOM Access**: Direct access to `window`, `document`, and `eval` is strictly prohibited.
4. **Controlled API**: Only exposes `component`, `components` (read-only), `navigateToPage`, and `allPages`.
