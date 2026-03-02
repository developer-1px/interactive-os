# Interactive OS — 공식 기술 문서

> Interactive OS 프로젝트의 기술 문서

---

## 비전

| 문서 | 설명 |
|---|---|
| [VISION](./VISION.md) | Interactive OS의 존재 이유 — Problem, Pipeline, Module Ecosystem |

---

## Kernel

인터랙티브 애플리케이션을 위한 범용 커맨드 처리 엔진

| 문서 | 설명 |
|---|---|
| [개요](./kernel/00-overview.md) | Kernel의 정의, 아키텍처, 설계 철학 |
| [시작하기](./kernel/01-getting-started.md) | 설치와 첫 커널 인스턴스 |
| [핵심 개념](./kernel/02-core-concepts.md) | Command, Effect, Context, Scope, When Guard, Middleware, State |
| [API 레퍼런스](./kernel/03-api-reference.md) | 시그니처와 타입을 포함한 전체 API |
| [디스패치 파이프라인](./kernel/04-dispatch-pipeline.md) | dispatch에서 상태 업데이트까지의 처리 흐름 |
| [타입 시스템](./kernel/05-type-system.md) | 브랜드 토큰과 컴파일 타임 안전성 |
| [미들웨어](./kernel/06-middleware.md) | 양파 모델의 before/after 훅 |
| [상태 관리](./kernel/07-state-management.md) | 단일 상태 트리, Store, 상태 렌즈 |
| [패턴 & 레시피](./kernel/08-patterns.md) | 모범 사례와 일반적인 패턴 |
| [용어집](./kernel/09-glossary.md) | 정식 용어와 동결된 설계 결정 |

## OS

인터랙티브 웹 애플리케이션을 위한 행동 인프라

### Why — 문제 공간

| 문서 | 파이프라인 | 소스 | 설명 |
|---|---|---|---|
| [Why Focus](./os/why-focus.md) | ① Spatial | `focus/` | Zone 단위 포커스 추적, 복원, 복구 |
| [Why Command](./os/why-command.md) | ② Input | `keymaps/`, `1-listen/` | 입력과 행동의 분리, Keybinding Table |
| [Why Navigation](./os/why-navigation.md) | ③ Behavior | `navigate/` | 방향키 내비게이션 (1D, 2D, spatial) |
| [Why Selection](./os/why-selection.md) | ③ Behavior | `selection/` | 단일/다중/범위 선택 상태 머신 |
| [Why Tab](./os/why-tab.md) | ③ Behavior | `tab/` | 영역 간 Tab 이동 (trap/flow/escape) |
| [Why Dismiss](./os/why-dismiss.md) | ③ Behavior | `dismiss/` | Escape 키의 맥락별 해석 |
| [Why Overlay](./os/why-overlay.md) | ③ Behavior | `overlay/` | 모달/다이얼로그 포커스 생명주기 |
| [Why Expand](./os/why-expand.md) | ③ Behavior | `expand/` | 트리/아코디언 확장-축소 |
| [Why Field](./os/why-field.md) | ③ Behavior | `field/` | 인라인 편집 모드 전환, 키 소유권 |
| [Why Clipboard](./os/why-clipboard.md) | ③ Behavior | `clipboard/` | 조건부 클립보드 가로채기 |
| [Why ARIA](./os/why-aria.md) | ④ Output | `registries/` | 접근성은 기능이 아니라 인프라 |

### What — 솔루션 공간

| 문서 | 설명 |
|---|---|
| [SPEC](./os/SPEC.md) | Single Source of Truth — State, Commands, Keymaps, ARIA Role Presets, Components |

## 아키텍처

```
┌──────────────────────────────────────────────┐
│  Layer 3: App                                │
│  도메인 로직 (Todo, Kanban, Mail 등)           │
├──────────────────────────────────────────────┤
│  Layer 2: OS                                 │
│  Focus, Zone, Navigation, ARIA, Keybindings  │
├──────────────────────────────────────────────┤
│  Layer 1: Kernel                             │
│  dispatch, defineCommand, defineEffect       │
└──────────────────────────────────────────────┘
```

---

## 상태

| 패키지 | 상태 | 문서 |
|---|---|---|
| Kernel | `@frozen 2026-02-11` | ✅ 완료 |
| OS | 개발 중 | 🚧 SPEC 완료 |
