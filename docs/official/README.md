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

| Guide | Pipeline Stage | Description |
|---|---|---|
| [Why Focus](./os/why-focus.md) | ① Spatial | 웹에서 "지금 어디에 있는가"를 시스템이 모르는 문제 |
| [Why Navigation](./os/why-navigation.md) | ③ Behavior | 방향키 내비게이션의 재발명 문제 |
| [Why Selection](./os/why-selection.md) | ③ Behavior | 다중 선택 상태 머신의 조합 폭발 |
| [Why Tab](./os/why-tab.md) | ③ Behavior | 영역 간 Tab 이동 (trap/flow/escape) |
| [Why ARIA](./os/why-aria.md) | ④ Output | 접근성은 기능이 아니라 인프라 |
| [Why Command](./os/why-command.md) | ② Input | 입력과 행동의 분리, 단축키 충돌 해결 |
| [Why Overlay](./os/why-overlay.md) | ③ Behavior | 모달/다이얼로그 포커스 생명주기 |

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
