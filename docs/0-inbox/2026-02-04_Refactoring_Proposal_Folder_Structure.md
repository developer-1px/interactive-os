# Antigravity OS: 폴더 구조 리팩토링 제안서

## 1. 개요 (Overview)

본 문서는 Antigravity OS의 폴더 구조와 파일명을 **시스템의 인터페이스와 명세를 명확히 드러내도록** 개선하기 위한 리팩토링 제안서입니다.

현재 구조는 기능적으로 동작하지만, 몇 가지 핵심적인 문제점을 내포하고 있습니다:
- **추상화 계층이 폴더 구조에 명확히 반영되지 않음**
- **인터페이스 파일과 구현 파일의 분리가 일관되지 않음**
- **네이밍 규칙의 일관성 부족** (예: `focusTypes.ts` vs `behaviorTypes.ts`)
- **핵심 도메인 개념이 폴더명/파일명에서 직관적으로 드러나지 않음**

---

## 2. 현재 구조 분석 (Current Structure Analysis)

### 2.1. 전체 구조 개요

```
src/
├── App.tsx                    # 앱 엔트리
├── main.tsx                   # React 엔트리
├── index.css                  # 글로벌 스타일
├── os/                        # ⭐ OS 코어 (핵심)
│   ├── core/                  # 코어 로직
│   ├── ui/                    # UI 프리미티브
│   └── debug/                 # 디버그 도구
├── apps/                      # 앱 구현체
│   └── todo/                  # 레퍼런스 앱
├── lib/                       # 공유 유틸리티
└── pages/                     # 라우트 페이지
```

### 2.2. OS Core 상세 분석

```
os/core/
├── AntigravityOS.tsx          # ⚠️ OS 진입점 (컴포넌트)
├── context.tsx                # ⚠️ 컨텍스트 (혼합된 책임)
├── application/               # 앱 라이프사이클
├── command/                   # 커맨드 시스템
│   ├── CommandContext.tsx
│   ├── commandEventBus.ts
│   ├── commands/              # OS 기본 커맨드
│   ├── definition.ts
│   ├── osCommands.ts
│   ├── osRegistry.ts
│   ├── store.tsx              # ⚠️ 큰 파일 (323줄)
│   ├── useCommandCenter.ts
│   ├── useCommandListener.ts
│   └── zoneRegistry.ts
├── focus/                     # 포커스 엔진
│   ├── axes/                  # 7-Axis 핸들러
│   │   ├── direction/
│   │   ├── edge/
│   │   ├── entry/
│   │   ├── recovery/
│   │   ├── restore/
│   │   ├── tab/
│   │   └── target/
│   ├── behavior/              # 동작 프리셋
│   ├── store/                 # 상태 슬라이스
│   ├── utils/
│   ├── focusBridge.ts
│   ├── focusStore.ts
│   ├── focusTypes.ts
│   ├── orchestrator.ts
│   └── pipeline.ts
├── input/                     # 입력 엔진
├── logic/                     # 조건 평가 (Logic DSL)
└── persistence/               # 영속성 어댑터
```

---

## 3. 문제점 식별 (Problem Identification)

### 3.1. 인터페이스 분산 문제

> [!CAUTION]
> 타입 정의가 여러 파일에 분산되어 시스템 명세 파악이 어려움

| 위치 | 내용 | 문제 |
|------|------|------|
| `focusTypes.ts` | `ZoneMetadata`, `NavContext`, `FocusState` | 핵심 타입이 한 파일에 혼재 |
| `behavior/behaviorTypes.ts` | `FocusBehavior` | 별도 폴더에 분리됨 |
| `command/definition.ts` | `CommandDefinition`, `CommandFactory` | 인터페이스와 팩토리 혼재 |
| `os/ui/types.ts` | 단 1줄 (`export type BaseCommand = ...`) | 불필요하게 작은 파일 |

### 3.2. 혼합된 책임 (Mixed Responsibilities)

| 파일 | 현재 책임 | 문제 |
|------|----------|------|
| `command/store.tsx` | CommandRegistry + createCommandStore + 타입 정의 | 323줄, 분리 필요 |
| `context.tsx` | OS 상수 + ContextProvider + evaluator re-export | 혼합된 역할 |
| `AntigravityOS.tsx` | OS 쉘 + 사이드이펙트 | 역할 명확화 필요 |

### 3.3. 네이밍 일관성 부족

| 현재 이름 | 문제 | 개선안 |
|----------|------|--------|
| `focusBridge.ts` | "Bridge"의 의미 불명확 | `focusCoordinator.ts` |
| `osCommands.ts` vs `commands/` | 계층 불분명 | 통합 또는 명확한 분리 |
| `zoneRegistry.ts` (command 폴더) | Focus 영역인데 command에 위치 | 위치 이동 필요 |

### 3.4. 숨겨진 핵심 개념

현재 구조에서 **직관적으로 파악하기 어려운** 핵심 개념들:

1. **7-Axis Focus Behavior** - `axes/` 폴더로 존재하지만 명세 문서 부재
2. **Jurisdiction (관할권)** - Zone의 핵심 개념이나 폴더/파일명에 미반영
3. **Command Event Bus** - 핵심 패턴이나 단일 파일로만 존재
4. **Zero-Base Scaffolding** - 아키텍처 패턴이나 코드에서 발견 어려움

---

## 4. 리팩토링 제안 (Refactoring Proposal)

### 4.1. 새로운 폴더 구조

```
src/os/
├── index.ts                           # [NEW] 통합 Public API
├── types/                             # [NEW] 📋 시스템 명세 (인터페이스)
│   ├── index.ts                       # 전체 타입 Re-export
│   ├── focus.types.ts                 # FocusState, NavContext, etc.
│   ├── command.types.ts               # CommandDefinition, CommandFactory
│   ├── zone.types.ts                  # ZoneMetadata, FocusBehavior
│   └── input.types.ts                 # Keybinding, InputEvent
│
├── engine/                            # [RENAME: core → engine] ⚙️ 런타임 엔진
│   ├── AntigravityOS.tsx              # OS Shell
│   ├── command/                       # Command Engine
│   │   ├── index.ts
│   │   ├── registry.ts                # [FROM: store.tsx - Registry 분리]
│   │   ├── store.ts                   # [FROM: store.tsx - Store 분리]
│   │   ├── eventBus.ts                # [RENAME]
│   │   ├── definitions/               # [RENAME: commands → definitions]
│   │   │   ├── base.ts                # [FROM: osCommands.ts]
│   │   │   ├── navigation.ts
│   │   │   ├── clipboard.ts
│   │   │   ├── field.ts
│   │   │   └── shell.ts
│   │   └── hooks/
│   │       ├── useCommandCenter.ts
│   │       └── useCommandListener.ts
│   │
│   ├── focus/                         # Focus Engine
│   │   ├── index.ts
│   │   ├── store.ts                   # 통합 스토어
│   │   ├── coordinator.ts             # [RENAME: focusBridge]
│   │   ├── pipeline.ts
│   │   ├── orchestrator.ts
│   │   ├── axes/                      # 7-Axis Handlers (유지)
│   │   │   ├── index.ts               # [NEW] 축 요약 및 Re-export
│   │   │   ├── direction/
│   │   │   ├── edge/
│   │   │   ├── entry/
│   │   │   ├── recovery/
│   │   │   ├── restore/
│   │   │   ├── tab/
│   │   │   └── target/
│   │   ├── behavior/                  # 동작 프리셋
│   │   │   ├── presets.ts
│   │   │   └── resolver.ts
│   │   ├── slices/                    # [RENAME: store → slices]
│   │   │   ├── cursorSlice.ts
│   │   │   ├── spatialSlice.ts
│   │   │   └── zoneSlice.ts
│   │   └── utils/
│   │
│   ├── input/                         # Input Engine
│   │   ├── InputEngine.tsx
│   │   └── keybinding.ts
│   │
│   ├── jurisdiction/                  # [NEW] 🏛️ 관할권 시스템
│   │   ├── index.ts
│   │   ├── ZoneRegistry.ts            # [FROM: command/zoneRegistry.ts]
│   │   └── context.tsx                # [FROM: command/CommandContext.tsx]
│   │
│   ├── logic/                         # Condition Evaluator
│   │   ├── index.ts
│   │   ├── builder.ts
│   │   ├── evaluator.ts
│   │   └── types.ts
│   │
│   └── persistence/                   # Persistence Adapter
│
├── ui/                                # 🎨 UI 프리미티브 (유지)
│   ├── index.ts
│   ├── primitives/                    # [NEW] 핵심 프리미티브 그룹
│   │   ├── Zone.tsx
│   │   ├── Item.tsx
│   │   ├── Field.tsx
│   │   ├── Trigger.tsx
│   │   └── Kbd.tsx
│   ├── App.tsx                        # App Shell
│   └── field/                         # Field 헬퍼
│       ├── fieldLogic.ts
│       ├── fieldUtils.ts
│       └── useFieldHooks.ts
│
└── debug/                             # 🔍 디버그 도구 (유지)
    ├── Inspector.tsx
    ├── logger.ts
    └── ...
```

### 4.2. 인터페이스 통합 (`types/`)

> [!IMPORTANT]
> 모든 Public 인터페이스를 `os/types/`에 집중시켜 **시스템 명세를 한눈에 파악** 가능하게 함

#### `types/focus.types.ts`
```typescript
// Focus System Core Types
export interface FocusState { ... }
export interface NavContext { ... }
export interface NavResult { ... }
export interface FocusObject { ... }
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
```

#### `types/zone.types.ts`
```typescript
// Zone & Jurisdiction Types
export interface ZoneMetadata { ... }
export interface FocusBehavior { ... }
export type FocusDirection = "v" | "h" | "grid";
export type FocusEdge = "wrap" | "stop" | "escape";
export type FocusTab = "loop" | "escape" | "flow";
export type FocusEntry = "first" | "last" | "restore";
```

#### `types/command.types.ts`
```typescript
// Command System Types
export interface CommandDefinition<S, P, K> { ... }
export interface CommandFactory<S, P, K> { ... }
export interface CommandGroup<S, P, K> { ... }
```

### 4.3. 큰 파일 분리

#### `command/store.tsx` (323줄) → 분리

| 분리 파일 | 내용 | 예상 라인 |
|----------|------|----------|
| `registry.ts` | `CommandRegistry` 클래스 | ~130줄 |
| `store.ts` | `createCommandStore` 함수 | ~150줄 |
| `types.ts` → `@os/types/command.types.ts` | 타입 정의 | ~30줄 |

### 4.4. 관할권 시스템 명시화 (`jurisdiction/`)

> [!NOTE]
> "Jurisdiction"은 Antigravity OS의 핵심 개념으로, Zone이 Command를 소유하고 관리하는 패턴입니다.

현재 `command/zoneRegistry.ts`와 `command/CommandContext.tsx`를 별도 폴더로 분리하여 이 개념을 명시화합니다.

```
engine/jurisdiction/
├── index.ts
├── ZoneRegistry.ts      # Zone → Command 매핑
└── context.tsx          # FocusContext, CommandContext
```

---

## 5. 파일명 개선안 (File Naming Improvements)

| 현재 이름 | 개선안 | 이유 |
|----------|--------|------|
| `focusBridge.ts` | `coordinator.ts` | "Bridge" 모호함 → "Coordinator" 역할 명확 |
| `osCommands.ts` | `definitions/base.ts` | 계층 구조 명확화 |
| `behaviorPresets.ts` | `presets.ts` | 중복 제거 (폴더가 `behavior/`) |
| `behaviorResolver.ts` | `resolver.ts` | 중복 제거 |
| `behaviorTypes.ts` | `@os/types/zone.types.ts` | 타입 통합 |
| `commandEventBus.ts` | `eventBus.ts` | 중복 제거 (폴더가 `command/`) |

---

## 6. 마이그레이션 전략 (Migration Strategy)

### Phase 1: 타입 통합 (Low Risk)
1. `os/types/` 폴더 생성
2. 분산된 타입들을 복사 후 Re-export
3. 기존 import 경로를 점진적으로 업데이트

### Phase 2: 폴더 구조 개선 (Medium Risk)
1. `core/` → `engine/` 리네임
2. `jurisdiction/` 폴더 생성 및 파일 이동
3. `ui/primitives/` 생성

### Phase 3: 파일 분리 (Higher Risk)
1. `store.tsx` → `registry.ts` + `store.ts` 분리
2. Import 경로 업데이트
3. 테스트 검증

---

## 7. 기대 효과 (Expected Benefits)

### 7.1. 개발자 경험 향상

| 항목 | Before | After |
|------|--------|-------|
| 타입 찾기 | 5-6개 파일 검색 | `os/types/` 확인 |
| 시스템 구조 파악 | 코드 분석 필요 | 폴더명으로 파악 |
| 새 기능 위치 결정 | 모호함 | 명확한 도메인 분리 |

### 7.2. 문서화 자동화

```
os/types/                    → API Reference 자동 생성 가능
engine/focus/axes/           → 7-Axis 문서 매핑
engine/jurisdiction/         → 관할권 패턴 문서화
```

### 7.3. 테스트 구조화

```
__tests__/
├── types/          # 타입 테스트 (선택)
├── engine/
│   ├── command/
│   ├── focus/
│   └── jurisdiction/
└── ui/
```

---

## 8. 결론 (Conclusion)

본 리팩토링은 **코드의 기능은 그대로 유지**하면서 **구조적 명확성**을 확보하는 것을 목표로 합니다.

핵심 원칙:
1. **인터페이스 우선 (Interface First)**: `types/` 폴더로 명세 집중
2. **도메인 명시화 (Explicit Domain)**: `jurisdiction/` 등 핵심 개념 폴더화
3. **책임 분리 (Single Responsibility)**: 큰 파일 분리
4. **네이밍 일관성 (Naming Consistency)**: 폴더 컨텍스트 활용

> [!TIP]
> Phase 1 (타입 통합)부터 시작하여 점진적으로 진행하는 것을 권장합니다.
> 각 Phase 후 전체 빌드 및 테스트 검증이 필요합니다.

---

*Created: 2026-02-04*
*Category: Architecture / Refactoring*
