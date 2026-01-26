# Optimization Opportunities & Bottlenecks

## 1. Heavyweight Deep Cloning

**Issue**: `RuntimeRenderer.vue` performs `JSON.parse(JSON.stringify(props.rootNode))` on every update.
**Impact**: O(n) operation where n is tree size. For large trees (100+ nodes), this causes noticeable frame drops during editing.
**Fix**: Use structural sharing (shallow copy where possible) or a library like `immer`. Or only clone modified subtrees.

## 2. Excessive Watchers in Data Binding

**Issue**: `useDataBindingEngine` sets up individual Vue watchers for every bound property.
**Impact**: Memory and CPU overhead scales linearly with the number of bindings.
**Fix**: Use a centralized event bus or a single observer pattern to handle updates, rather than N watchers.

## 3. Lack of Render Caching

**Issue**: `RuntimeComponent` re-renders fully when parent updates, even if its own props haven't changed.
**Impact**: Unnecessary VDOM diffing.
**Fix**: Use `v-memo` (Vue 3.2+) or `v-once` for static subtrees to skip diffing.

## 4. Sandbox Execution Overhead

**Issue**: `useEventExecutor` creates new `Function` contexts frequently.
**Impact**: Parsing scripts at runtime is slow.
**Fix**: Cache compiled functions or use a lighter-weight expression evaluator for simple cases.
