# Learnings

- `PropConfig` (alias for `PropSchema`) has a required `name` property. Extending it and adding `name` again causes a "specified more than once" error when spreading.
- `el-color-picker` emits `string | null`, so callbacks must handle `null`.
- `watch` accepts options as the 3rd argument, not 3rd and 4th.
- `I18nString` needs explicit translation in templates using `translate()`.

# Fixes

- Fixed `NamedPropConfig` and `NamedStyleConfig` interface definitions.
- Fixed `name` property shadowing in `map` functions by destructuring `name` out of the config object.
- Added `translate()` for `I18nString` labels.
- Fixed `el-color-picker` type mismatch.
- Fixed `watch` arguments in `StylePaneEnhanced.vue`.
- Fixed `opacity` type casting.
