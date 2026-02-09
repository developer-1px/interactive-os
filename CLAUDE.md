# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive OS (codename: Project Antigravity) — a React-based operating system environment for complex web applications. Implements spatial navigation, command orchestration, and a 7-axis focus model. Core philosophy: "Structure as Specification."

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # ESLint (custom pipeline rules)
npm run lint:biome   # Biome linter
npm run format       # Biome format (--write)
npm run preview      # Preview production build
```

Pre-commit hook runs `biome check --write` on staged `*.{ts,tsx,js,jsx,json,css}` files via lint-staged.

## Tech Stack

React 19, TypeScript 5.9 (strict), Vite 7, TailwindCSS 4, Zustand + Immer, Biome + ESLint, React Router DOM 7

## Path Aliases

```
@os/*   → ./src/os/*
@apps/* → ./src/apps/*
@/*     → ./src/*
```

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
│   ├── 2-command/       # Command handlers (activate, navigate, select, escape, etc.)
│   ├── 3-store/         # Zustand stores and slices (cursor, expansion, selection, spatial)
│   ├── 4-effect/        # DOM effect builders and middleware
│   ├── core/            # Logic engine (LogicNode, Rule, evalContext)
│   ├── primitives/      # React primitives (FocusGroup, FocusItem, hooks)
│   ├── schema/          # Type definitions (OSState, commands, focus, transaction)
│   ├── registry/        # Role-based zone registry
│   ├── lib/             # OS utilities
│   └── shared/          # Shared primitives
├── os/                  # Legacy OS features (being migrated to os-new)
├── apps/                # Applications (kanban/, todo/)
├── pages/               # Route pages (todo, kanban, settings, docs, showcases)
└── lib/                 # Generic utilities
```

### Layer Dependency (strict one-way)

```
src/os-new/ → src/apps/ → src/pages/
```

Lower layers must never import from higher layers.

### Commands are Config-Driven

Same command behaves differently per Zone config. Example: `NAVIGATE` checks `navigate.orientation` (vertical/horizontal/grid), `TAB` checks `tab.trap`, etc. No hardcoded `if/else` — behavior is declared in zone config.

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
- **Commands**: Named as events, not actions (`OS_ESCAPE`, not `OS_DISMISS`). Exports use `SCREAMING_CASE`.
- **Folders**: Pipeline phases `{n}-{noun}`, domains singular camelCase
- **No abbreviations** except: `ctx`, `cmd`, `id`, `ref`, `props`, `e`
- **One concept = one name** — Don't create `UserProfile`, `UserProfileData`, `UserProfileInfo`

## Custom ESLint Rules (eslint-plugin-pipeline)

- `no-pipeline-bypass` (error) — Enforces all changes go through the pipeline
- `no-direct-commit` (error) — No direct store commits
- `no-handler-in-app` (warn) — Apps should not define handlers
- `no-imperative-handler` (warn) — Handlers should be declarative

## Formatting

Biome: 2-space indent, double quotes. Max cognitive complexity: 15.

## TestBot

Tests run via `window.__TESTBOT__` global API in the browser:

```js
window.__TESTBOT__.runAll()           // Run all tests (async)
window.__TESTBOT__.isRunning()        // Poll for completion
window.__TESTBOT__.getResults()       // Full JSON results
window.__TESTBOT__.getFailures()      // Failed suites only
window.__TESTBOT__.summary()          // "PASS: 8 / FAIL: 4 / TOTAL: 12"
window.__TESTBOT__.rerunFailed()      // Re-run failures only
```

## Documentation

Follows PARA method in `docs/`: `0-inbox/` (drafts), `1-project/` (active), `2-area/` (standards), `3-resource/` (reference), `4-archive/` (historical).
