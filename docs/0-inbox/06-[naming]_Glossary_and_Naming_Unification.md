# Glossary — 용어 통일 및 혼용 정리

> 날짜: 2026-02-09
> 태그: naming, glossary, convention
> 상태: Draft (v3 — 레드팀 감수 후 결정 반영)
> 선행 문서: 03-[naming] 네이밍 컨벤션, 05-[architecture] 3-Layer 제안서

---

## 0. 이 문서의 목적

현재 코드와 제안 문서에서 **같은 개념을 다른 이름으로**, **다른 개념을 같은 이름으로** 부르고 있다.
원인: 레거시(`os/`)와 신규(`os-new/`)가 공존하고, 제안 문서(01~05)가 또 다른 이름을 쓰기 때문.

이 문서는 **하나의 개념 = 하나의 이름** 원칙으로 확정 용어를 정한다.

### 확정된 결정 (레드팀 감수 후)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 디스패치 데이터 = **Command** (Event ❌) | DOM `Event`와 이름 충돌. `useQuery` 사례와 동일 |
| D2 | **ZoneState ≠ ZoneSnapshot** — 공존 | 런타임 상태와 직렬화 스냅샷은 용도가 다르다 |
| D3 | 상태 트리 루트 = **State** | `DB` (re-frame), `OSState` (레거시) 모두 대체 |
| D4 | Middleware = **re-frame `{ id, before, after }`** | 패턴 전환 (Redux 스타일에서) |
| D5 | Handler = **통일** (별도 타입명 불필요) | `defineHandler`는 sugar. 내부적으로 Handler로 wrap |
| D6 | 센서/파이프라인 타입 = **glossary 범위** | 내부 타입도 네이밍 일관성 필요 |
| D7 | Zone 상태 모델 = **Record (전체 보관)** | `zones: Record<string, ZoneState>` |

---

## 1. 코드베이스 현황

```
src/
├── os/          ← 레거시 (마이그레이션 대상)
│   ├── app/export/primitives/   ← Public: Zone, Item, Field, Trigger, Label
│   ├── features/focus/primitives/  ← Internal: FocusGroup, FocusItem (레거시)
│   ├── features/command/        ← CommandEngineStore, createCommandStore
│   └── middleware/              ← historyMiddleware, navigationMiddleware
│
├── os-new/      ← 신규 (현재 개발 중)
│   ├── primitives/   ← Internal: FocusGroup, FocusItem (신규)
│   ├── 1-sensor/     ← 키보드/포커스 센서
│   ├── 2-command/    ← OS 커맨드 (NAVIGATE, ACTIVATE, ...)
│   ├── 3-store/      ← Zone별 Zustand 스토어
│   ├── 4-effect/     ← DOM 이펙트, 미들웨어
│   ├── core/         ← 로직 엔진 (LogicNode, Rule, evalContext)
│   └── schema/       ← 타입 정의
```

**현재 상태:**
- Public primitive (`Zone`, `Item` 등)는 **레거시 `os/`** 위에 있음
- `os-new/`는 internal을 새로 만들고 있음
- 최종적으로 Public primitive도 `os-new/` 위에 올라감

이 glossary는 **레거시/신규 구분 없이 최종 목표 용어**를 정의한다.
단, **코드에 아직 없는 타입**은 `(제안)` 표시로 구분한다.

---

## 2. 컴포넌트 레이어 구분

### Public Primitive ≠ Internal Primitive

```
┌──────────────────────────────────────────────────────────────┐
│  App Developer (Public API)                                  │
│                                                              │
│  Zone ──→ FocusGroup을 wrapping하는 facade                   │
│  Item ──→ FocusItem을 wrapping + selection state + render props│
│  Field ──→ FocusItem을 wrapping + contentEditable + registry  │
│  Trigger → FocusItem을 wrapping + click dispatch              │
│  Label ──→ standalone (hit area expansion)                    │
├──────────────────────────────────────────────────────────────┤
│  OS Internal                                                 │
│                                                              │
│  FocusGroup ──→ scope 등록, store 생성, config 관리, DOM 추적  │
│  FocusItem  ──→ tabindex, aria, data-focused, DOM 등록        │
└──────────────────────────────────────────────────────────────┘
```

**이 둘은 rename 관계가 아니다. 다른 레이어의 다른 컴포넌트다.**

| | Public Primitive | Internal Primitive |
|---|---|---|
| 소비자 | App Developer | OS Developer |
| 관심사 | 선언적 API, 커맨드 바인딩 | 포커스 메커니즘, ARIA, DOM |
| 현재 위치 | `os/app/export/primitives/` (레거시 위) | `os-new/primitives/` (신규) |
| 최종 위치 | 신규 internal 위에 재구축 | `os-new/primitives/` |
| ID 변수명 | `id` (prop) | `groupId` (내부) |

| Public | Internal | 관계 |
|---|---|---|
| `Zone` | `FocusGroup` | facade. props 단순화, `options`로 묶음. |
| `Item` | `FocusItem` | 확장. store 접근, selection 상태, render props 추가. |
| `Field` | `FocusItem` | 내부 사용. contentEditable, FieldRegistry 바인딩 추가. |
| `Trigger` | `FocusItem` | 내부 사용 (id 있을 때). click → dispatch 추가. |
| `Label` | (없음) | standalone. |

---

## 3. 혼용 현황 — 같은 개념, 여러 이름

출처별로 구분: **레거시 코드** / **신규 코드** / **제안 문서**

| 개념 | 레거시 (`os/`) | 신규 (`os-new/`) | 제안 문서 (01~05) | 확정 |
|---|---|---|---|---|
| 디스패치 데이터 | `BaseCommand` | `BaseCommand` | `Event`, `Command` | **Command** (D1) |
| 커맨드 처리 함수 | `cmd.run` | `OSCommand.run` | handler | **Handler** (D5) |
| 커맨드 등록 단위 | `CommandFactory` | `OSCommand` | — | **CommandDef** |
| 핸들러 반환값 | — | `OSResult` | `EffectMap` | **EffectMap** |
| DOM 부수효과 객체 | `DOMEffect` | `DOMEffect` | `fx`, `Effect` | **DOMEffect** |
| 이펙트 로그 | — | `EffectRecord` | — | **EffectRecord** |
| 핸들러 읽기 컨텍스트 | `ctx` | `OSContext` | `cofx`, `Context` | **Context** |
| 핸들러 전후 훅 | `Middleware` (Redux) | `OSMiddleware` (Redux) | `Interceptor`, `Middleware` | **Middleware** `{ id, before, after }` (D4) |
| 파생 상태 | (없음) | (없음) | `Subscription`, `Computed` | **Computed** |
| 전체 상태 트리 | — | `OSState` | `db`, `DB`, `Store` | **State** (D3) |
| Zone 런타임 상태 | — | `FocusGroupState` | `ZoneState` | **ZoneState** (D2) |
| Zone 직렬화 스냅샷 | — | `ZoneSnapshot` | — | **ZoneSnapshot** (D2) |
| Zone별 설정 | — | `FocusGroupConfig` | `ZoneConfig` | **ZoneConfig** |
| Kernel 버블링 단위 | `bubblePath` (부분) | (없음) | `Scope` | **Scope** (제안) |

---

## 4. 혼용 현황 — 같은 이름, 다른 개념

| 이름 | 의미 A | 의미 B | 해결 |
|---|---|---|---|
| **`Command`** | 디스패치 데이터 `{ type, payload }` | 핸들러 포함 정의 `{ run }` | 데이터 **Command**, 정의 **CommandDef** |
| **`Context`** | 핸들러 읽기 컨텍스트 | React Context (`FocusGroupContext`) | Kernel **Context**, React는 `React.Context` |
| **`Effect`** | EffectMap의 키 (선언) | DOM 부수효과 객체 (실행) | 선언 **EffectMap 키**, 실행 **DOMEffect** |
| **`State`** | 전체 상태 (`OSState`) | Zone 런타임 상태 | 전체 **보류**, Zone **ZoneState** |
| **`Middleware`** | Redux `(next) => (s, a) => ...` | re-frame `{ id, before, after }` | **re-frame 형태로 확정** (D4) |
| **`Store`** | Zustand 인스턴스 | 상태 트리 별칭 | Zustand `store`, 상태 트리 **보류** (D3) |
| **`Zone`** | Public primitive 컴포넌트 | 개념으로서의 "포커스 영역" | 컴포넌트 **`<Zone>`**, 개념 **"zone"** (소문자) |
| **`groupId`** | FocusGroup 내부 식별자 | OS 상태의 zone 식별자 | Internal `groupId`, OS State `activeZoneId` |
| **`ZoneSnapshot`** | Zone 직렬화 스냅샷 (순수 데이터) | (오해) Zone 런타임 상태 | 스냅샷 전용. 런타임은 **ZoneState** |

---

## 5. 확정 용어집

### 5.1 개념 (Concept) — 설계 문서, 주석

| 확정 이름 | 정의 | ❌ 쓰지 않는 이름 |
|---|---|---|
| **zone** | 포커스 관리 영역 단위. ARIA composite widget 대응. | group (개념으로서) |
| **scope** | Kernel 버블링 계층 단위. zone은 scope의 OS 활용. | layer, level |
| **command** | 디스패치되는 데이터 `{ type, payload }` | event (DOMEvent 충돌), action (Redux) |
| **handler** | 커맨드 처리 순수함수. 시그니처 통일: `(ctx, payload) → EffectMap` | — |
| **effect map** | 핸들러 반환 이펙트 선언 `{ state, focus, scroll, ... }` | result, fx-map |
| **DOM effect** | 실제 DOM 조작 `{ type: "FOCUS", targetId }` | — |
| **effect executor** | DOM effect 실행 함수. `defineEffect`로 등록. | effect handler (handler와 혼동) |
| **context** | 핸들러가 받는 읽기 전용 데이터 | cofx, coeffects |
| **context provider** | Context 수집 함수. `defineContext`로 등록. | cofx handler |
| **middleware** | 핸들러 전후 훅 `{ id, before, after }` | interceptor |
| **computed** | 캐싱된 파생 상태 | subscription, selector, query |
| **zone state** | Zone의 런타임 상태 (focusedItemId, selection 등) | — |
| **zone snapshot** | Zone 상태의 직렬화 스냅샷 (트랜잭션 로그용) | — |
| **bubble path** | 커맨드 전파 scope 경로 `[active, ..., __global__]` | focus path (다른 것) |
| **focus path** | 활성 zone 조상 체인 `[root, ..., active]` | (bubble path와 방향 반대) |
| **role preset** | ARIA role 기반 zone 기본 설정 | — |
| **sentinel** | 런타임 치환 플레이스홀더 (`OS.FOCUS`) | — |

### 5.2 함수/API (Function) — Kernel

| 이름 | 역할 | 시그니처 |
|---|---|---|
| `dispatch` | 커맨드 발행 | `(cmd: Command) → void` |
| `defineHandler` | 순수 상태 핸들러 등록 (sugar) | `(id, (state, payload) → state) → void` |
| `defineCommand` | 이펙트 반환 핸들러 등록 | `(id, (ctx, payload) → EffectMap) → void` |
| `defineEffect` | Effect executor 등록 | `(id, (value) → void) → void` |
| `defineContext` | Context provider 등록 | `(id, () → value) → void` |
| `defineComputed` | 파생 상태 등록 | `(id, (state, args) → value) → void` |
| `inject` | 핸들러에 context 주입 | `(id) → Middleware` |
| `use` | 글로벌 middleware 등록 | `(middleware) → void` |
| `defineScope` | Scope 등록 (버블링 노드) | `(id, { parent? }) → void` |
| `removeScope` | Scope 제거 | `(id) → void` |
| `defineKeybinding` | 키 → 커맨드 매핑 | `({ key, command, ... }) → void` |
| `useComputed` | React 훅: 파생 상태 구독 | `([id, ...args]) → T` |
| `useDispatch` | React 훅: dispatch 획득 | `() → (cmd) → void` |
| `getState` | 상태 트리 스냅샷 읽기 | `() → State` |
| `resetState` | 상태 트리 초기화 | `(state) → void` |

> `defineHandler`는 `defineCommand`의 sugar다. 내부적으로 `(state, payload) => state`를
> `(ctx, payload) => ({ state: fn(ctx.state, payload) })`로 wrap한다. (D5)

### 5.3 타입 (Type) — Kernel / OS 공통

> `(제안)` = 코드에 아직 없음. 리팩터링 시 생성 예정.

| 확정 타입명 | 정의 | 현재 코드 이름 | 상태 |
|---|---|---|---|
| `Command` | `{ type: string; payload?: unknown }` | `BaseCommand` | rename |
| `CommandDef<P>` | `{ id: string; run: Handler<P>; log?: boolean }` | `OSCommand<P>` (신규), `CommandFactory` (레거시) | rename |
| `Handler<P>` | `(ctx: Context, payload: P) → EffectMap \| null` | `OSCommand.run` | rename |
| `EffectMap` | `{ state?, focus?, scroll?, dispatch?, ... }` | `OSResult` (구조 다름) | rename + 구조 변경 |
| `DOMEffect` | `{ type: "FOCUS"\|"SCROLL_INTO_VIEW"\|"CLICK"\|"BLUR"; targetId? }` | `DOMEffect` | 유지 |
| `EffectRecord` | `{ source, action, targetId, executed, reason }` | `EffectRecord` | 유지 |
| `Context` | `{ state; [injectedKey]: unknown }` | `OSContext` (레거시) | (제안) |
| `Middleware` | `{ id: string; before?; after? }` | — (현재 Redux 스타일) | (제안) — D4 |
| `ZoneState` | `{ focusedItemId, selection, ... }` (런타임) | `FocusGroupState` | rename |
| `ZoneSnapshot` | `{ id, focusedItemId, selection, ... }` (직렬화) | `ZoneSnapshot` | 유지 |
| `ZoneConfig` | `{ navigate, tab, select, activate, dismiss, project }` | `FocusGroupConfig` | rename |
| `ZoneRole` | `"listbox" \| "menu" \| "grid" \| ...` | `ZoneRole` | 유지 |
| `Computed<T>` | 파생 상태 정의 | — | (제안) |
| `Scope` | `{ id: string; parent?: string }` | — | (제안) |
| `BubblePath` | `string[]` | — | (제안) |
| `InputSource` | `"keyboard" \| "mouse" \| "programmatic"` | `InputSource` | 유지 |

**ZoneState ≠ ZoneSnapshot (D2):**

```typescript
// ZoneState — 런타임 상태. Zustand 스토어의 슬라이스.
// 현재: FocusGroupState = CursorSlice & SpatialSlice & SelectionSlice & ExpansionSlice
interface ZoneState {
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;
}

// ZoneSnapshot — 트랜잭션 로그용 직렬화 스냅샷.
// FocusState.zone에 저장. 현재 코드 그대로.
interface ZoneSnapshot {
  id: string;
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;
}
```

### 5.4 타입 (Type) — 센서 / 파이프라인

키보드 센서 4-Phase 파이프라인:

| Phase | 타입 | 정의 | 역할 |
|---|---|---|---|
| 1. Sense | `KeyboardIntent` | `{ canonicalKey, isFromField, isComposing, target, fieldId, originalEvent }` | 키보드 이벤트 정규화 |
| 2. Classify | `KeyboardCategory` | `"COMMAND" \| "FIELD" \| "PASSTHRU"` | 입력 분류 |
| 3. Resolve | `KeyboardResolution` | `CommandResolution \| FieldResolution \| null` | 커맨드/필드 액션 결정 |
| — | `CommandResolution` | `{ type: "COMMAND"; commandId; args?; source: "app"\|"os" }` | 커맨드 해석 결과 |
| — | `FieldResolution` | `{ type: "FIELD"; action: "START_EDIT"\|"COMMIT"\|"CANCEL"\|"SYNC"; fieldId }` | 필드 액션 해석 결과 |
| 4. Execute | `KeyboardExecutionResult` | `{ success, category, commandId?, error?, timestamp }` | 실행 결과 |

포커스 파이프라인:

| 타입 | 정의 | 역할 |
|---|---|---|
| `FocusIntent` | discriminated union (`NAVIGATE \| TAB \| SELECT \| ACTIVATE \| DISMISS \| FOCUS \| POINTER \| EXPAND`) | 사용자 의도 표현 |
| `PipelineContext` | `{ sourceId, intent, targetId, stickyX/Y, shouldTrap, newSelection, ... }` | 파이프라인 실행 스레드 |
| `FocusNode` | `{ id, element, rect, disabled? }` | DOM 노드 최소 표현 |
| `FocusTarget` | `"real" \| "virtual"` | 실제/가상 포커스 구분 |

방향 프리미티브:

| 타입 | 정의 |
|---|---|
| `Direction` | `"up" \| "down" \| "left" \| "right" \| "home" \| "end"` |
| `TabDirection` | `"forward" \| "backward"` |
| `Orientation` | `"horizontal" \| "vertical" \| "both" \| "corner"` |

### 5.5 타입 (Type) — 커맨드 / 키바인딩

| 타입 | 정의 | 역할 |
|---|---|---|
| `OS_COMMANDS` | `const { NAVIGATE, FOCUS, TAB, SELECT, ACTIVATE, ESCAPE, ... }` | OS 표준 커맨드 ID 상수 |
| `OSCommandType` | `typeof OS_COMMANDS[keyof typeof OS_COMMANDS]` | OS 커맨드 ID 유니온 |
| `OSCommandUnion` | discriminated union (각 커맨드별 payload 타입) | 타입 안전 커맨드 |
| `OSNavigatePayload` | `{ direction, sourceId, targetId?, select? }` | NAVIGATE 페이로드 |
| `OSFocusPayload` | `{ id, sourceId? }` | FOCUS 페이로드 |
| `OSSelectPayload` | `{ targetId?, mode?, isExplicitAction? }` | SELECT 페이로드 |
| `OSActivatePayload` | `{ targetId? }` | ACTIVATE 페이로드 |
| `KeybindingItem<T>` | `{ key, command, args?, when?, groupId?, zoneId?, ... }` | 키바인딩 선언 |
| `FieldCommandFactory` | `((payload) => Command) & { id }` | Field props용 커맨드 팩토리 |

### 5.6 타입 (Type) — 상태 / 트랜잭션

| 타입 | 정의 | 역할 |
|---|---|---|
| `OSState` | `{ focus: FocusState; inputSource; effects }` | 루트 OS 상태 (이름 보류 — D3) |
| `FocusState` | `{ activeZoneId; zone: ZoneSnapshot \| null; focusStackDepth }` | 포커스 서브시스템 상태 |
| `Transaction` | `{ id, timestamp, input, command, snapshot, diff }` | 트랜잭션 로그 엔트리 |
| `TransactionInput` | `{ source: InputSource; raw: string }` | 트랜잭션 입력 |
| `TransactionCommand` | `{ type: string; payload?: unknown }` | 트랜잭션 커맨드 |
| `StateDiff` | `{ path: string; from; to }` | 상태 diff (dot-path) |

> **참고:** `FocusState.zone`은 현재 단수(활성 Zone 하나)이지만,
> D7 결정에 따라 `zones: Record<string, ZoneState>`로 변경 예정.

### 5.7 타입 (Type) — Zone Config

| 타입 | 정의 | 역할 |
|---|---|---|
| `FocusGroupConfig` → **`ZoneConfig`** | `{ navigate, tab, select, activate, dismiss, project }` | Zone 통합 설정 |
| `NavigateConfig` | `{ orientation, loop, seamless, typeahead, entry, recovery }` | 방향키 탐색 |
| `TabConfig` | `{ behavior: "trap"\|"escape"\|"flow"; restoreFocus }` | Tab 동작 |
| `SelectConfig` | `{ mode: "none"\|"single"\|"multiple"; followFocus, range, toggle, ... }` | 선택 동작 |
| `ActivateConfig` | `{ mode: "manual"\|"automatic" }` | 활성화 동작 |
| `DismissConfig` | `{ escape: "close"\|"deselect"\|"none"; outsideClick }` | 탈출 동작 |
| `ProjectConfig` | `{ virtualFocus, autoFocus }` | 가상 포커스 |

### 5.8 타입 (Type) — 스토어 / 이펙트 / 로직

스토어 슬라이스 (os-new/3-store):

| 타입 | 정의 | 역할 |
|---|---|---|
| `FocusGroupState` → **`ZoneState`** | `CursorSlice & SpatialSlice & SelectionSlice & ExpansionSlice & { groupId }` | Zone 런타임 상태 |
| `CursorSlice` | `{ focusedItemId, lastFocusedId, recoveryTargetId, setFocus }` | 포커스 커서 |
| `SelectionSlice` | `{ selection, selectionAnchor, setSelection, toggleSelection, ... }` | 선택 상태 |
| `ExpansionSlice` | `{ expandedItems, toggleExpanded, setExpanded, isExpanded }` | 확장/접힘 |
| `SpatialSlice` | `{ stickyX, stickyY, setSpatialSticky, clearSpatialSticky }` | 공간 기억 |

이펙트/미들웨어 (os-new/4-effect):

| 타입 | 정의 | 역할 |
|---|---|---|
| `OSMiddleware<S,A>` → **`Middleware`** | 현재: `(next: Next<S,A>) => Next<S,A>` → 제안: `{ id, before, after }` | 미들웨어 (D4) |
| `HistoryEntry` | `{ command, timestamp, snapshot?, focusedItemId? }` | 히스토리 엔트리 |
| `HistoryState` | `{ past: HistoryEntry[]; future: HistoryEntry[] }` | 실행 취소/재실행 |
| `OSManagedState` | `{ effects?, history?, data?, ui? }` | 미들웨어 계약 |

로직 (os-new/core/logic):

| 타입 | 정의 | 역할 |
|---|---|---|
| `LogicNode` | `(ctx: ContextState) => boolean` + `toString()` | 조건 평가 함수 |
| `ContextState` | `{ activeZone?, focusPath?, [key]: ContextValue }` | 로직 평가 컨텍스트 |
| `Rule` | `{ and(...), or(...) }` | 조건 조합 빌더 |

### 5.9 컴포넌트 (Component)

#### Public Primitive — App Developer가 사용

| 이름 | 현재 위치 | wraps | 역할 |
|---|---|---|---|
| `Zone` | `os/app/export/primitives/` | `FocusGroup` | 포커스 영역 facade |
| `Item` | `os/app/export/primitives/` | `FocusItem` | 포커스 요소 + selection + render props |
| `Field` | `os/app/export/primitives/` | `FocusItem` | contentEditable 인라인 편집 |
| `Trigger` | `os/app/export/primitives/` | `FocusItem` | 클릭 → dispatch 버튼 |
| `Label` | `os/app/export/primitives/` | (없음) | Field 히트 영역 확장 |

현재 레거시 `os/`의 FocusGroup/FocusItem 위에 있음.
최종적으로 신규 `os-new/`의 FocusGroup/FocusItem 위에 재구축.

#### Internal Primitive — OS Developer가 사용

| 이름 | 레거시 위치 | 신규 위치 | 역할 |
|---|---|---|---|
| `FocusGroup` | `os/features/focus/primitives/` | `os-new/primitives/` | scope/store/config/DOM 관리 |
| `FocusItem` | `os/features/focus/primitives/` | `os-new/primitives/` | tabindex/aria/data-focused/DOM 등록 |

**두 곳에 존재하는 이유:** 레거시 → 신규 마이그레이션 진행 중.
최종적으로 레거시 삭제, 신규만 남음.

---

## 6. 변수명 규칙

### 6.1 식별자 (ID) — 레이어별

| 대상 | Public API | Internal (FocusGroup) | OS State |
|---|---|---|---|
| 영역 식별자 | `id` (prop) | `groupId` | `activeZoneId` |
| 아이템 식별자 | `id` (prop) | `id` | `focusedItemId` |

같은 실제 값이지만 레이어에 따라 변수명이 다르다. **의도적 설계.**

```typescript
// Public — "id"만 알면 된다
<Zone id="todo-list">
  <Item id="todo-1">...</Item>
</Zone>

// Internal — FocusGroup은 groupId로 자신을 관리
function FocusGroup({ id }: FocusGroupProps) {
  const groupId = useStableId(id);
}

// OS State — 모든 Zone을 Record로 관리 (D7)
interface FocusState {
  activeZoneId: string | null;
  zones: Record<string, ZoneState>;   // ← 전체 Zone 보관
}
```

### 6.2 약어

**허용:**

| 약어 | 원형 | 사용처 |
|---|---|---|
| `ctx` | Context | 핸들러 파라미터 |
| `cmd` | Command | 변수명 |
| `id` | Identifier | 모든 곳 |
| `ref` | Reference | React ref |
| `props` | Properties | React props |
| `e` | Event | DOM Event 핸들러 |
| `fn` | Function | 콜백 파라미터 |
| `el` | Element | DOM Element |

**금지:**

| ❌ 약어 | 대신 사용 |
|---|---|
| `db` | `state` |
| `fx` | `effect` 또는 `effectMap` |
| `cofx` | `ctx` |
| `mw` | `middleware` |
| `sub` | `computed` |

---

## 7. 개념 관계도

```
┌───────────────────────────────────────────────────────────┐
│  Layer 3: App Developer                                   │
│                                                           │
│  ┌─────┐  ┌──────┐  ┌───────┐  ┌─────────┐  ┌───────┐   │
│  │Zone │  │ Item │  │ Field │  │ Trigger │  │ Label │   │
│  └──┬──┘  └──┬───┘  └──┬────┘  └────┬────┘  └───────┘   │
│     │        │         │            │                     │
│ ════╪════════╪═════════╪════════════╪═══ Public API ════  │
│     │        │         │            │                     │
├─────┼────────┼─────────┼────────────┼─────────────────────┤
│  Layer 2: OS Internal                                     │
│     │        │         │            │                     │
│     ▼        ▼         ▼            ▼                     │
│  ┌──────────────┐  ┌───────────┐                          │
│  │  FocusGroup  │  │ FocusItem │ ← 모든 Public primitive  │
│  │              │  │           │   가 내부에서 사용        │
│  │ scope 등록   │  │ tabindex  │                          │
│  │ store 생성   │  │ aria 속성 │                          │
│  │ config 관리  │  │ DOM 등록  │                          │
│  └──────┬───────┘  └───────────┘                          │
│         │                                                 │
│  defineCommand("NAVIGATE", handler)                       │
│  defineEffect("focus", executor)                          │
│  defineContext("dom-items", provider)                      │
│                                                           │
├─────────┼─────────────────────────────────────────────────┤
│  Layer 1: Kernel                                          │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  dispatch → Scope Tree → Handler → EffectMap → fx   │  │
│  │  defineScope / defineCommand / defineEffect / inject │  │
│  │  use(middleware) / defineComputed / useComputed      │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 8. 용어 대응표 — 출처별

### re-frame → 확정

| re-frame | 확정 | 비고 |
|---|---|---|
| `app-db` | **State** (D3) | 전체 상태 트리 |
| `reg-event-fx` | `defineCommand` | 함수명 |
| `reg-event-db` | `defineHandler` | 함수명 (sugar) |
| `reg-fx` | `defineEffect` | 함수명 |
| `reg-cofx` | `defineContext` | 함수명 |
| `inject-cofx` | `inject` | 함수명 |
| `reg-sub` | `defineComputed` | 함수명 |
| `subscribe` | `useComputed` | 함수명 |
| `coeffects` / `cofx` | **Context** | 개념 |
| `effects map` | **EffectMap** | 개념/타입 |
| `interceptor` | **Middleware** `{ id, before, after }` | 개념/타입 (D4) |
| `event` | **Command** | 개념/타입 (D1) |

### 레거시 코드 (`os/`) → 확정

| 레거시 | 확정 | 비고 |
|---|---|---|
| `BaseCommand` | **Command** | 타입 rename |
| `CommandFactory` | **CommandDef** | 타입 rename |
| `CommandEngineStore` | Kernel dispatcher | 구조 변경 |
| `Middleware` (Redux 형태) | **Middleware** (`{ id, before, after }` 형태로) | 패턴 전환 (D4) |
| `DOMEffect` | **DOMEffect** | 유지 |
| `OSContext` | **Context** | 타입 rename |
| `FocusGroup` (컴포넌트) | **FocusGroup** | 유지 (Internal) |
| `FocusItem` (컴포넌트) | **FocusItem** | 유지 (Internal) |
| `Zone` (컴포넌트) | **Zone** | 유지 (Public) |
| `Item` (컴포넌트) | **Item** | 유지 (Public) |

### 신규 코드 (`os-new/`) → 확정

| 신규 | 확정 | 비고 |
|---|---|---|
| `BaseCommand` | **Command** | 타입 rename |
| `OSCommand<P>` | **CommandDef\<P\>** | 타입 rename |
| `OSResult` | **EffectMap** | 타입 rename + 구조 변경 |
| `OSContext` | **Context** | (제안) 현재 레거시에만 존재 |
| `OSMiddleware` | **Middleware** | 패턴 전환 (D4) |
| `FocusGroupState` | **ZoneState** | 타입 rename |
| `ZoneSnapshot` | **ZoneSnapshot** | 유지 (D2) |
| `FocusGroupConfig` | **ZoneConfig** | 타입 rename |
| `FocusGroupStore` | (내부 구현, 노출 안 함) | — |
| `EffectRecord` | **EffectRecord** | 유지 |
| `FocusGroup` (컴포넌트) | **FocusGroup** | 유지 (Internal) |
| `FocusItem` (컴포넌트) | **FocusItem** | 유지 (Internal) |
| `groupId` (FocusGroup 내부) | **groupId** | 유지 (Internal) |
| `activeZoneId` | **activeZoneId** | 유지 |
| `KeyboardIntent` | **KeyboardIntent** | 유지 |
| `KeyboardCategory` | **KeyboardCategory** | 유지 |
| `KeyboardResolution` | **KeyboardResolution** | 유지 |
| `KeyboardExecutionResult` | **KeyboardExecutionResult** | 유지 |
| `FocusIntent` | **FocusIntent** | 유지 |
| `PipelineContext` | **PipelineContext** | 유지 |
| `FocusNode` | **FocusNode** | 유지 |
| `LogicNode` | **LogicNode** | 유지 |
| `OSCommandType` | **OSCommandType** | 유지 |
| `OSCommandUnion` | **OSCommandUnion** | 유지 |

### 제안 문서 (01~05) → 확정

| 문서에서 사용 | 확정 | 비고 |
|---|---|---|
| `Event` (데이터 타입, 03 문서) | **Command** (D1) | **03 문서 수정 필요** |
| `Interceptor` (05 문서 Section 8) | **Middleware** (D4) | **05 문서 수정 필요** |
| `Scope` (Kernel 계층, 05 문서) | **Scope** | 유지 (제안) |
| `DB` (01/05 문서) | **State** (D3) | 용어 통일 |
| 나머지 (`defineCommand`, `EffectMap`, `Computed` 등) | 동일 | — |

---

## 9. 위험 혼용 3가지

### 혼용 1: `Command` = 데이터 vs 정의

```typescript
// 디스패치되는 데이터 (레거시+신규 모두)
interface BaseCommand { type: string; payload?: any }

// 핸들러를 포함한 정의 (신규)
interface OSCommand<P> { run: (ctx, payload: P) => OSResult | null }

// 둘 다 "Command"인데 완전히 다른 것
```

→ 데이터 `Command`, 정의 `CommandDef`.

### 혼용 2: `OSResult` vs `EffectMap`

```typescript
// 신규 코드 (os-new)
interface OSResult {
  state?: { focusedItemId?, selection?, ... };
  activeZoneId?: string;
  domEffects?: DOMEffect[];
  dispatch?: any;
}

// 제안 문서
type EffectMap = {
  state?: State;
  focus?: string;
  scroll?: string;
  dispatch?: Command;
}
```

같은 역할(핸들러 반환값)인데 구조가 다르다.
마이그레이션 시 `OSResult` → `EffectMap`으로 통합 + 구조 평탄화.

### 혼용 3: `KeybindingItem`의 `groupId` vs `zoneId`

```typescript
// os-new/schema/keyboard/KeybindingItem.ts
interface KeybindingItem {
  key: string;
  command: string;
  groupId?: string;   // ← Internal 용어가 여기에
  zoneId?: string;    // ← OS State 용어도 여기에
  when?: string;
}
```

같은 파일에 같은 의미의 두 필드.
KeybindingItem은 OS 레벨 → `zoneId`만 사용.

---

## 10. 리팩터링 체크리스트

```
Phase 1: 타입 rename (os-new/ 대상)
  □ BaseCommand → Command
  □ OSCommand<P> → CommandDef<P>
  □ OSResult → EffectMap (+ 구조 평탄화)
  □ FocusGroupState → ZoneState
  □ FocusGroupConfig → ZoneConfig

Phase 2: 중복 필드 정리 (os-new/)
  □ KeybindingItem: groupId 필드 제거, zoneId 통일

Phase 3: Middleware 패턴 전환 (D4)
  ⚠️ 이것은 단순 rename이 아니라 인터페이스 재설계다.
  □ OSMiddleware (Redux 스타일) → Middleware { id, before, after }
  □ os/ Middleware (Redux 스타일) → 같은 형태로 전환
  □ historyMiddleware → Middleware 형태로 재작성
  □ 기존 미들웨어 체인 실행기 교체

Phase 4: 상태 모델 변경 (D7)
  □ FocusState.zone (단수) → FocusState.zones (Record)
  □ ZoneSnapshot 활용 방식 재정의

Phase 5: 개념어 통일 (주석, 문서)
  □ "Interceptor" → "Middleware"
  □ "Subscription" → "Computed"
  □ "cofx" / "coeffect" → "Context"
  □ "fx" → "effect" 또는 "effectMap"
  □ "Event" (데이터 의미) → "Command"
  □ 03 문서: Event → Command 전면 수정
  □ 05 문서: Interceptor → Middleware 수정
```

**하지 않는 것:**
- `FocusGroup` rename ❌ — Internal primitive로 유지
- `FocusItem` rename ❌ — Internal primitive로 유지
- `groupId` (FocusGroup 내부) rename ❌ — Internal 용어로 유지
- `ZoneSnapshot` rename ❌ — 스냅샷은 스냅샷이다 (D2)
- 레거시 `os/` 코드 rename ❌ — 마이그레이션으로 대체될 예정

---

## 11. 레드팀 감수 — 결과 요약

> v2에서 수행한 레드팀 감수 결과. 발견 항목과 해결 상태.

### 해결된 항목

| # | 발견 | 해결 | 결정 |
|---|---|---|---|
| 11.1 | 코드에 없는 "확정" 타입 7개 | Section 5.3에 `(제안)` 표시 추가 | — |
| 11.2 | ZoneSnapshot ≠ ZoneState 오분류 | 공존 모델로 변경 | D2 |
| 11.3 | 03 문서 `Event` vs 06 문서 `Command` | Command 확정, 03 수정 예정 | D1 |
| 11.4 | Middleware 형태 모순 | re-frame 형태 확정, Phase 3으로 분리 | D4 |
| 11.5 | Handler 타입 이중 정의 | Handler 통일, defineHandler는 sugar | D5 |
| 11.6 | inject() 반환 타입 Interceptor | Middleware로 통일, 05 문서 수정 예정 | D4 |
| 11.7 | 누락된 센서/파이프라인 타입 | Section 5.4~5.8에 추가 | D6 |
| 11.8 | FocusState.zone 단수 vs zones Record | Record 모델 확정 | D7 |

### 미해결 항목

| # | 발견 | 상태 |
|---|---|---|
| D3 | 상태 트리 루트 타입 | **확정: State** |
| — | `FocusGroupStore`가 OSContext.store로 노출됨 | 마이그레이션 시 Context 재설계로 해결 |
| — | os-new 커맨드가 레거시 OSContext를 import | 마이그레이션 시 해결 |

---

## 12. 열린 질문 — 남은 결정

### Q1. 상태 트리 루트 타입: DB vs OSState? (D3 — ✅ 확정: State)

- ~~`DB`: re-frame 관용어. 짧고 개념적.~~ → re-frame 내부 용어. FE에서 혼란 유발.
- ~~`OSState`: 현재 코드.~~ → OS 전용 뉘앙스. Kernel은 OS를 모른다.
- **`State`**: 범용적이고 명확. Kernel/OS/App 모든 레이어에서 자연스럽다.

→ **확정.** `getState()`, `resetState()`, `ctx.state`, EffectMap의 `state` 키로 통일.
