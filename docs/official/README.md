# Interactive OS — Official Documentation

> Technical documentation for the Interactive OS project.

---

## Vision

| Guide | Description |
|---|---|
| [**VISION**](./VISION.md) | 왜 Interactive OS가 존재하는가 — Problem, Pipeline, Module Ecosystem |

---

## Kernel

A universal command processing engine for building interactive applications.

| Guide | Description |
|---|---|
| [Overview](./kernel/00-overview.md) | What is Kernel? Architecture and design philosophy |
| [Getting Started](./kernel/01-getting-started.md) | Installation and first kernel in under a minute |
| [Core Concepts](./kernel/02-core-concepts.md) | Commands, Effects, Context, Scope, Middleware, State |
| [API Reference](./kernel/03-api-reference.md) | Complete API surface with signatures and types |
| [Dispatch Pipeline](./kernel/04-dispatch-pipeline.md) | How commands flow from dispatch to state update |
| [Type System](./kernel/05-type-system.md) | Branded tokens and compile-time safety |
| [Middleware](./kernel/06-middleware.md) | Before/after hooks with onion-model execution |
| [State Management](./kernel/07-state-management.md) | Single state tree, Store, and State Lens |
| [Patterns & Recipes](./kernel/08-patterns.md) | Best practices and common patterns |
| [Glossary](./kernel/09-glossary.md) | Canonical terminology and frozen design decisions |

## OS Layer

The behavioral infrastructure for interactive web applications.

### Why — Problem Space (각 모듈이 존재하는 이유)

| Guide | Pipeline | Source Folder | Description |
|---|---|---|---|
| [Why Focus](./os/why-focus.md) | ① Spatial | `focus/` | Zone 단위 포커스 추적, 복원, 복구 |
| [Why Command](./os/why-command.md) | ② Input | `keymaps/`, `1-listeners/` | 입력과 행동의 분리, Keybinding Table |
| [Why Navigation](./os/why-navigation.md) | ③ Behavior | `navigate/` | 방향키 내비게이션 (1D, 2D, spatial) |
| [Why Selection](./os/why-selection.md) | ③ Behavior | `selection/` | 단일/다중/범위 선택 상태 머신 |
| [Why Tab](./os/why-tab.md) | ③ Behavior | `tab/` | 영역 간 Tab 이동 (trap/flow/escape) |
| [Why Dismiss](./os/why-dismiss.md) | ③ Behavior | `dismiss/` | Escape 키의 맥락별 해석 |
| [Why Overlay](./os/why-overlay.md) | ③ Behavior | `overlay/` | 모달/다이얼로그 포커스 생명주기 |
| [Why Expand](./os/why-expand.md) | ③ Behavior | `expand/` | 트리/아코디언 확장-축소 |
| [Why Field](./os/why-field.md) | ③ Behavior | `field/` | 인라인 편집 모드 전환, 키 소유권 |
| [Why Clipboard](./os/why-clipboard.md) | ③ Behavior | `clipboard/` | 조건부 클립보드 가로채기 |
| [Why ARIA](./os/why-aria.md) | ④ Output | `registries/` | 접근성은 기능이 아니라 인프라 |

### What — Solution Space (동작 명세)

| Guide | Description |
|---|---|
| [SPEC](./os/SPEC.md) | Single Source of Truth — State, Commands, Keymaps, ARIA Role Presets, Components |

## Architecture

```
┌──────────────────────────────────────────────┐
│  Layer 3: App                                │
│  Domain logic (Todo, Kanban, Mail, etc.)     │
├──────────────────────────────────────────────┤
│  Layer 2: OS                                 │
│  Focus, Zone, Navigation, ARIA, Keybindings  │
├──────────────────────────────────────────────┤
│  Layer 1: Kernel                             │
│  dispatch, defineCommand, defineEffect       │
└──────────────────────────────────────────────┘
```

---

## Status

| Package | Status | Documentation |
|---------|--------|---------------|
| **Kernel** | `@frozen 2026-02-11` | ✅ Complete |
| **OS** | In development | 🚧 SPEC (complete) |
