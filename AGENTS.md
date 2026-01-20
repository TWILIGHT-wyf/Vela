# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-20
**Monorepo:** Yes (pnpm)

## OVERVIEW

Vela LowCode Editor - A Vue 3 + TypeScript visual platform for building data visualization dashboards. Features drag-and-drop orchestration, event/data linkage engines, and multiple renderer implementations.

## STRUCTURE

```
.
├── packages/
│   ├── editor/       # Main app (Vue 3, Pinia, Router) - 280+ files
│   ├── core/         # Shared types & utils
│   ├── ui/           # Reusable components (Library mode)
│   ├── materials/    # Component implementations (Charts, Maps)
│   ├── renderer/     # Runtime engine (Vue recursive)
│   └── generator/    # Code generation (AST-based)
├── server/           # Backend (Express, MongoDB, AI agents)
└── dist/             # Build artifacts
```

## WHERE TO LOOK

| Task           | Location                 | Notes                                   |
| -------------- | ------------------------ | --------------------------------------- |
| **App Logic**  | `packages/editor/src`    | Main entry, stores, views               |
| **Components** | `packages/materials/src` | Charts, Maps, Controls impl             |
| **Runtime**    | `packages/renderer/src`  | Execution engine (separate from editor) |
| **Shared**     | `packages/core/src`      | Types (`NodeSchema`) & consts           |
| **Backend**    | `server/src`             | AI agents, project CRUD                 |

## CONVENTIONS

- **Aliases**: Use `@vela/*` for cross-package imports.
- **Components**: PascalCase. `materials` accept only `id`, fetch own data.
- **Stores**: `useXxxStore` (Pinia setup syntax).
- **Styles**: Tailwind-like utilities discouraged; use BEM/scoped CSS or Element Plus.
- **Events**: `handleXxx` for handlers, `onXxx` for props callbacks.

## ANTI-PATTERNS (THIS PROJECT)

- **NO** default exports (prefer named).
- **NO** `any` (use `unknown` or `NodeSchema`).
- **NO** direct DOM manipulation (use Refs).
- **NO** `console.log` in commits (use prefixes `[Scope]` if debugging).
- **NO** business logic in `materials` (keep them dumb/data-driven).

## COMMANDS

```bash
pnpm dev              # Start editor + server
pnpm build            # Build all packages
pnpm lint --fix       # Fix lint issues
pnpm test:e2e         # Run Playwright tests
pnpm -F @vela/editor  # Run command for specific package
```
