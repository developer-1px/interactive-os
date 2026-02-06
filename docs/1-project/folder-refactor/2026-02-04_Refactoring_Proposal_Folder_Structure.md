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

### 4.0. 네이밍 규칙 (Naming Convention)

> [!IMPORTANT]
> **파일명 = 핵심 Export명** 규칙을 준수합니다.
> 파일 내 주요 함수/클래스/인터페이스명을 그대로 파일명으로 사용합니다.

#### 응집도 기반 Prefix 규칙

> [!TIP]
> **응집도가 높은 개념은 Prefix로** 사용하여 알파벳순 정렬 시 유사 파일이 모이도록 합니다.

```
❌ BAD (흩어짐)                    ✅ GOOD (그룹핑)
clipboardCommands.ts              commandsClipboard.ts
fieldCommands.ts                  commandsField.ts
navigationCommands.ts             commandsNavigation.ts
shellCommands.ts                  commandsShell.ts
```

| 패턴 | 설명 | 예시 |
|------|------|------|
| `commands*` | 커맨드 정의 그룹 | `commandsNavigation.ts`, `commandsClipboard.ts` |
| `handler*` | 핸들러 그룹 | `handlerDirection.ts`, `handlerEdge.ts` |
| `slice*` | 슬라이스 그룹 | `sliceCursor.ts`, `sliceZone.ts`, `sliceSpatial.ts` |

#### Postfix 키 풀 (단일 책임 파일)

| Postfix | 용도 | 예시 |
|---------|------|------|
| `Store` | Zustand 스토어 | `focusStore.ts` → `useFocusStore()` |
| `Registry` | 레지스트리 클래스 | `CommandRegistry.ts` → `CommandRegistry` |
| `Context` | React Context | `JurisdictionContext.tsx` |
| `Resolver` | 리졸버 함수 | `behaviorResolver.ts` → `resolveBehavior()` |
| `Pipeline` | 파이프라인 로직 | `focusPipeline.ts` → `runFocusPipeline()` |
| `Presets` | 프리셋 정의 | `behaviorPresets.ts` → `FOCUS_PRESETS` |

#### Prefix 키 풀

| Prefix | 용도 | 예시 |
|--------|------|------|
| `use` | React Hook | `useCommandCenter.ts` → `useCommandCenter()` |
| `create` | 팩토리 함수 | `createCommandFactory.ts` → `createCommandFactory()` |


### 4.0.1. FSD 세그먼트 전략

| Segment | 역할 | 규칙 |
|---------|------|------|
| `model/` | 상태 관리 (Store, Slice) | `*Store.ts`, `*Slice.ts`, `*Registry.ts` |
| `lib/` | 순수 함수, 유틸리티 | `*Handler.ts`, `*Resolver.ts`, `*Pipeline.ts` |
| `ui/` | React 컴포넌트 | `*Context.tsx`, `*.tsx` |


### 4.1. 새로운 폴더 구조

```
src/os/
│
├── entities/                          # 📋 도메인 인터페이스 (파일명 = 인터페이스명)
│   ├── ZoneMetadata.ts                # interface ZoneMetadata
│   ├── FocusBehavior.ts               # interface FocusBehavior  
│   ├── FocusState.ts                  # interface FocusState
│   ├── NavContext.ts                  # interface NavContext
│   ├── NavResult.ts                   # interface NavResult
│   ├── FocusObject.ts                 # interface FocusObject
│   ├── CommandDefinition.ts           # interface CommandDefinition
│   ├── CommandFactory.ts              # interface CommandFactory
│   ├── KeybindingItem.ts              # interface KeybindingItem
│   └── Direction.ts                   # type Direction (enum-like)
│
├── features/                          # ⚙️ OS 핵심 기능 (FSD Feature Slice)
│   │
│   ├── command/                       # 🎯 Command Feature
│   │   ├── model/                     # 상태 관리
│   │   │   ├── commandStore.ts        # createCommandStore
│   │   │   └── CommandRegistry.ts     # CommandRegistry class
│   │   ├── lib/                       # 순수 함수
│   │   │   ├── createCommandFactory.ts
│   │   │   └── resolveCommand.ts
│   │   ├── ui/                        # 컴포넌트
│   │   │   └── CommandContext.tsx
│   │   └── definitions/               # OS 기본 커맨드 정의
│   │       ├── commandsClipboard.ts   # 알파벳순 그룹핑
│   │       ├── commandsField.ts
│   │       ├── commandsNavigation.ts
│   │       └── commandsShell.ts
│   │
│   ├── focus/                         # 🎯 Focus Feature
│   │   ├── model/                     # 상태 관리
│   │   │   ├── focusStore.ts          # Zustand store
│   │   │   ├── sliceCursor.ts         # 알파벳순 그룹핑
│   │   │   ├── sliceSpatial.ts
│   │   │   └── sliceZone.ts
│   │   ├── lib/                       # 순수 함수
│   │   │   ├── focusPipeline.ts       # Navigation pipeline
│   │   │   ├── focusOrchestrator.ts   # Orchestration logic
│   │   │   ├── behaviorPresets.ts     # Preset definitions
│   │   │   └── behaviorResolver.ts    # Behavior resolution
│   │   ├── axes/                      # 7-Axis Handlers (알파벳순)
│   │   │   ├── handlerDirection.ts
│   │   │   ├── handlerEdge.ts
│   │   │   ├── handlerEntry.ts
│   │   │   ├── handlerRecovery.ts
│   │   │   ├── handlerRestore.ts
│   │   │   ├── handlerSeamless.ts
│   │   │   ├── handlerTab.ts
│   │   │   └── handlerTarget.ts
│   │   └── lib/                       # 축별 순수 로직
│   │       ├── navigationRoving.ts
│   │       └── navigationSpatial.ts
│   │
│   ├── input/                         # 🎯 Input Feature
│   │   ├── model/
│   │   │   └── inputStore.ts          # (필요시)
│   │   ├── lib/
│   │   │   └── keybindingMatcher.ts   # 키 매칭 순수 함수
│   │   └── ui/
│   │       └── InputEngine.tsx        # Global input listener
│   │
│   ├── jurisdiction/                  # 🏛️ Jurisdiction Feature
│   │   ├── model/
│   │   │   └── ZoneRegistry.ts        # Zone → Command 매핑 스토어
│   │   ├── lib/
│   │   │   └── jurisdictionResolver.ts
│   │   └── ui/
│   │       └── JurisdictionContext.tsx
│   │
│   ├── logic/                         # 🧮 Logic Feature (Condition DSL)
│   │   ├── lib/
│   │   │   ├── logicBuilder.ts
│   │   │   └── logicEvaluator.ts
│   │   └── LogicNode.ts               # Type definition
│   │
│   └── persistence/                   # 💾 Persistence Feature
│       ├── lib/
│       │   └── LocalStorageAdapter.ts
│       └── PersistenceAdapter.ts      # Interface
│
├── widgets/                           # 🎨 OS UI 위젯 (복합 컴포넌트)
│   ├── Zone.tsx                       # OS.Zone
│   ├── Item.tsx                       # OS.Item
│   ├── Field.tsx                      # OS.Field
│   ├── Trigger.tsx                    # OS.Trigger
│   ├── Kbd.tsx                        # OS.Kbd
│   └── App.tsx                        # OS.App (Shell)
│
├── shared/                            # 🔧 공유 유틸리티
│   ├── lib/
│   │   ├── fieldLogic.ts
│   │   └── fieldUtils.ts
│   └── hooks/
│       ├── useCommandCenter.ts
│       ├── useCommandListener.ts
│       └── useFieldHooks.ts
│
└── debug/                             # 🔍 디버그 도구
    ├── ui/
    │   └── Inspector.tsx
    └── lib/
        ├── logger.ts
        └── inputTelemetry.ts
```

### 4.2. 엔티티 네이밍 규칙 (`entities/`)

> [!IMPORTANT]
> **1 File = 1 Interface** 규칙을 준수합니다.
> 파일명은 인터페이스명과 **완전히 동일**해야 합니다.

| 파일명 | 내용 |
|--------|------|
| `ZoneMetadata.ts` | `export interface ZoneMetadata { ... }` |
| `FocusBehavior.ts` | `export interface FocusBehavior { ... }` |
| `FocusState.ts` | `export interface FocusState { ... }` (Combined type) |
| `NavContext.ts` | `export interface NavContext { ... }` |
| `NavResult.ts` | `export interface NavResult { ... }` |
| `FocusObject.ts` | `export interface FocusObject { ... }` |
| `CommandDefinition.ts` | `export interface CommandDefinition<S, P, K> { ... }` |
| `CommandFactory.ts` | `export interface CommandFactory<S, P, K> { ... }` |
| `KeybindingItem.ts` | `export interface KeybindingItem<K> { ... }` |
| `Direction.ts` | `export type Direction = "UP" \| "DOWN" \| "LEFT" \| "RIGHT";` |

#### 예시: `entities/NavContext.ts`
```typescript
import type { Direction } from "./Direction";
import type { ZoneMetadata } from "./ZoneMetadata";
import type { FocusBehavior } from "./FocusBehavior";

/** Unified context passed through the navigation pipeline */
export interface NavContext {
    direction: Direction;
    focusPath: string[];
    zoneRegistry: Record<string, ZoneMetadata>;
    focusedItemId: string | null;
    stickyX: number | null;
    stickyY: number | null;
    currentZoneId?: string;
    behavior?: FocusBehavior;
    items?: string[];
    targetId?: string | null;
}
```


### 4.3. 큰 파일 분리

#### `command/store.tsx` (323줄) → 분리

| 분리 파일 | 내용 | 예상 라인 |
|----------|------|----------|
| `registry.ts` | `CommandRegistry` 클래스 | ~130줄 |
| `store.ts` | `createCommandStore` 함수 | ~150줄 |
| `entities/command.ts` | 타입 정의 | ~30줄 |

### 4.4. 관할권 시스템 명시화 (`jurisdiction/`)

> [!NOTE]
> "Jurisdiction"은 Antigravity OS의 핵심 개념으로, Zone이 Command를 소유하고 관리하는 패턴입니다.

현재 `command/zoneRegistry.ts`와 `command/CommandContext.tsx`를 별도 폴더로 분리하여 이 개념을 명시화합니다.

```
features/jurisdiction/
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
| `behaviorTypes.ts` | `@os/entities/zone.ts` | 타입 통합 |
| `commandEventBus.ts` | `eventBus.ts` | 중복 제거 (폴더가 `command/`) |

---

## 6. 마이그레이션 전략 (Migration Strategy)

### Phase 1: 엔티티 통합 (Low Risk)
1. `os/entities/` 폴더 생성
2. 분산된 타입들을 모델링하여 Re-export
3. 기존 import 경로를 점진적으로 업데이트

### Phase 2: 폴더 구조 개선 (Medium Risk)
1. `core/` → `features/` 리네임
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
| 도메인 찾기 | 5-6개 파일 검색 | `os/entities/` 확인 |
| 시스템 구조 파악 | 코드 분석 필요 | 폴더명으로 파악 |
| 새 기능 위치 결정 | 모호함 | 명확한 도메인 분리 |

### 7.2. 문서화 자동화

```
os/entities/                 → Domain Model Reference 자동 생성 가능
features/focus/axes/         → 7-Axis 문서 매핑
features/jurisdiction/       → 관할권 패턴 문서화
```

### 7.3. 테스트 구조화

```
__tests__/
├── entities/       # 도메인 로직 테스트
├── features/
│   ├── command/
│   ├── focus/
│   └── jurisdiction/
└── ui/
```

---

## 8. 결론 (Conclusion)

본 리팩토링은 **코드의 기능은 그대로 유지**하면서 **구조적 명확성**을 확보하는 것을 목표로 합니다.

핵심 원칙:
1. **엔티티 우선 (Entity First)**: `entities/` 폴더로 도메인 모델 집중
2. **도메인 명시화 (Explicit Domain)**: `jurisdiction/` 등 핵심 개념 폴더화
3. **책임 분리 (Single Responsibility)**: 큰 파일 분리
4. **네이밍 일관성 (Naming Consistency)**: 폴더 컨텍스트 활용

> [!TIP]
> Phase 1 (타입 통합)부터 시작하여 점진적으로 진행하는 것을 권장합니다.
> 각 Phase 후 전체 빌드 및 테스트 검증이 필요합니다.

---

*Created: 2026-02-04*
*Category: Architecture / Refactoring*
