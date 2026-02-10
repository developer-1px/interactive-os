# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive OS (codename: Project Antigravity) — a React-based operating system environment for complex web applications. Implements spatial navigation, command orchestration, and a 7-axis focus model. Core philosophy: "Structure as Specification."

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint (custom pipeline rules)
npm run lint:biome   # Biome linter
npm run format       # Biome format (--write)
npm run test:e2e     # Playwright E2E tests (requires dev server running)
```

Pre-commit hook runs `biome check --write` on staged `*.{ts,tsx,js,jsx,json,css}` files via lint-staged.

## Tech Stack

React 19, TypeScript 5.9 (strict), Vite 7, TailwindCSS 4, Zustand + Immer, Biome + ESLint, React Router DOM 7

## TypeScript Strictness

Beyond `strict: true`, these additional checks are enabled — all code must satisfy them:

`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`

## Path Aliases

```
@os/*     → ./src/os/*
@apps/*   → ./src/apps/*
@/*       → ./src/*
@kernel   → ./packages/kernel/src      (monorepo package)
@kernel/* → ./packages/kernel/src/*
```

Note: Vite also aliases `@playwright/test` → `src/os/testBot/playwright/index.ts` (see Testing section).

## Architecture

### Data Flow Pipeline

```
DOM Event → Sensor (1-sensor) → OS Command (2-command) → runOS() pure function
→ Store Update (3-store, Zustand+Immer) → DOM Effects (4-effect)
```

All state changes flow through this single pipeline. No direct store manipulation or `el.focus()` calls.

### Source Structure

```
src/
├── os-new/              # Canonical OS implementation (active development)
│   ├── 1-sensor/        # Input translation (keyboard, focus, clipboard, history)
│   ├── 2-command/       # Command handlers (OS_ACTIVATE, OS_NAVIGATE, OS_SELECT, etc.)
│   ├── 3-store/         # Zustand stores and slices (cursor, expansion, selection, spatial)
│   ├── 4-effect/        # DOM effect builders and middleware
│   ├── core/            # Logic engine (LogicNode, Rule, evalContext)
│   ├── primitives/      # React primitives (FocusGroup, FocusItem, hooks)
│   ├── schema/          # Type definitions (OSState, commands, focus, transaction)
│   ├── registry/        # Role-based zone registry
│   ├── spike/           # Experimental kernel integration demos
│   └── lib/             # OS utilities
├── os/                  # Legacy OS features (being migrated to os-new)
│   ├── app/debug/       # Inspector UI (Cmd+D toggle)
│   ├── inspector/       # InspectorStore (Zustand + localStorage persist)
│   └── testBot/         # In-browser test framework
├── apps/                # Applications (kanban/, todo/)
├── pages/               # Route pages
├── packages/kernel/     # Standalone kernel package (Group API)
└── lib/                 # Generic utilities
```

### Layer Dependency (strict one-way)

```
packages/kernel/ → src/os-new/ → src/os/ → src/apps/ → src/pages/
```

Lower layers must never import from higher layers.

### Router & App Shell Pattern

Three wrapping layers in `App.tsx`:

1. **`OS.Root`** — Global infrastructure (InputEngine, FocusSensor)
2. **`OS.App`** with `definition` prop — App-specific keybindings (TodoApp, KanbanApp, or none)
3. **`AppContent`** — Outlet + Inspector sidebar

Routes map to app shells: `/` + `/settings` → TodoAppShell, `/kanban` → KanbanAppShell, showcase/builder pages → MinimalShell. `isAppShell=true` uses fixed viewport (no scroll).

### Commands are Config-Driven

Same command behaves differently per Zone config. Example: `NAVIGATE` checks `navigate.orientation` (vertical/horizontal/grid), `TAB` checks `tab.trap`, etc. No hardcoded `if/else` — behavior is declared in zone config via role-based presets.

### Kernel (packages/kernel/)

Standalone command orchestration engine using the **Unified Group API**:

```ts
const kernel = createKernel(config);  // Returns root Group at "GLOBAL" scope
// Group = { defineCommand, defineEffect, defineContext, group, dispatch, use, reset }
```

- **ContextToken** is a wrapper object `{ __id, __phantom? }`, NOT a branded string
- Effects are scoped and bubble through the scope chain → GLOBAL fallback
- `inject` is declared in `group({ inject: [...] })`, not via standalone function
- Middleware follows Redux-style `(next) => (state, action) => state` pattern
- Transaction log (max 200 entries) with full state diffs for time-travel debugging

## Key Rules

- **Never barrel export** — Use direct path imports. No `index.ts` re-exports.
- **OS-First** — Solve at OS level, not ad-hoc in components.
- **Pure function pipeline** — Commands are `(ctx, payload) → OSResult | null`. No side effects.
- **W3C absolute compliance** — All ARIA roles, states, keyboard patterns follow WAI-ARIA spec and APG.
- **Code minimalism** — YAGNI. No speculative code. 200-line file limit before splitting.
- **Verified solutions first** — Prefer W3C ARIA, React Aria, browser APIs over custom implementations.

## Naming Conventions

- **Files**: Components `PascalCase.tsx`, functions `camelCase.ts`, hooks `use*.ts`, stores `*Store.ts`, commands `*Command.ts`
- **Exports**: File name matches primary export
- **Commands/Effects/Contexts**: SCREAMING_CASE, variable name MUST match string literal: `const INCREMENT = kernel.defineCommand("INCREMENT", ...)`
- **Folders**: Pipeline phases `{n}-{noun}`, domains singular camelCase
- **No abbreviations** except: `ctx`, `cmd`, `id`, `ref`, `props`, `e`
- **One concept = one name** — Don't create `UserProfile`, `UserProfileData`, `UserProfileInfo`

## Custom ESLint Rules (eslint-plugin-pipeline)

- `no-pipeline-bypass` (error) — Prevents direct `commitAll()`, `DOMRegistry`, or `FocusRegistry` mutations in resolve functions
- `no-direct-commit` (error) — Only allows `commitAll()` from within `pipeline.ts`
- `no-handler-in-app` (warn) — No native DOM handlers (onClick, onChange, etc.) in app components. Visual handlers (onMouseEnter, onPointerLeave) and ZIFT semantic props are allowed
- `no-imperative-handler` (warn) — Blocks `addEventListener()`/`removeEventListener()` in app components

## Formatting

Biome: 2-space indent, double quotes. Max cognitive complexity: 15. Biome also runs `organizeImports` on assist.

## Testing

### TestBot (In-Browser)

Browser-based test framework via `window.__TESTBOT__` global API:

```js
window.__TESTBOT__.runAll()           // Run all tests (async)
window.__TESTBOT__.isRunning()        // Poll for completion
window.__TESTBOT__.getResults()       // Full JSON results
window.__TESTBOT__.getFailures()      // Failed suites only
window.__TESTBOT__.summary()          // "PASS: 8 / FAIL: 4 / TOTAL: 12"
window.__TESTBOT__.rerunFailed()      // Re-run failures only
```

### Playwright E2E

`@playwright/test` is **aliased** to a custom shim (`src/os/testBot/playwright/index.ts`) — `.spec.ts` files are transformed by the `spec-wrapper` Vite plugin and run in-browser via TestBot, not through real Playwright. The `/playwright-runner` page executes these specs. `npm run test:e2e` runs Playwright against the dev server (chromium only). Tests live in `e2e/`.

### Vite Plugins

- **spec-wrapper** (`vite-plugins/spec-wrapper.ts`): Wraps `.spec.ts` files in `export default function __runSpec__()` for in-browser execution
- **babel-inspector** (`vite-plugins/babel-inspector.ts`): Adds `data-inspector-line`/`data-inspector-loc` to all JSX elements for click-to-source
- **inspector** (`vite-plugins/inspector.ts`): Injects component-inspector UI overlay

## Inspector / Debugger

Toggle with **Cmd+D**. State persisted to localStorage key `"antigravity_inspector"`. Tabs: STATE, REGISTRY, EVENT_STREAM, KEY_MONITOR, OS_STATE, DATA_STATE, ELEMENT_PANEL, KERNEL_PANEL.

## Documentation

Follows PARA method in `docs/`: `0-inbox/` (drafts), `1-project/` (active), `2-area/` (standards), `3-resource/` (reference), `4-archive/` (historical). New docs always go to `0-inbox/` with naming `{순번}-[{태그}]{제목}.md`.
