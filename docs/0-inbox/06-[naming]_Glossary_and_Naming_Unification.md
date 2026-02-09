# Glossary — 용어 통일 및 혼용 정리

> 날짜: 2026-02-09
> 태그: naming, glossary, convention
> 상태: Draft
> 선행 문서: 03-[naming] 네이밍 컨벤션, 05-[architecture] 3-Layer 제안서

---

## 0. 이 문서의 목적

현재 코드와 제안 문서에서 **같은 개념을 다른 이름으로**, **다른 개념을 같은 이름으로** 부르고 있다.
원인: 레거시(`os/`)와 신규(`os-new/`)가 공존하고, 제안 문서(01~05)가 또 다른 이름을 쓰기 때문.

이 문서는 **하나의 개념 = 하나의 이름** 원칙으로 확정 용어를 정한다.

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
│   └── schema/       ← 타입 정의
```

**현재 상태:**
- Public primitive (`Zone`, `Item` 등)는 **레거시 `os/`** 위에 있음
- `os-new/`는 internal을 새로 만들고 있음
- 최종적으로 Public primitive도 `os-new/` 위에 올라감

이 glossary는 **레거시/신규 구분 없이 최종 목표 용어**를 정의한다.

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
| 디스패치 데이터 | `BaseCommand` | `BaseCommand` | `Event`, `Command` | **Command** |
| 커맨드 처리 함수 | `cmd.run` | `OSCommand.run` | handler | **Handler** |
| 커맨드 등록 단위 | `CommandFactory` | `OSCommand` | — | **CommandDef** |
| 핸들러 반환값 | — | `OSResult` | `EffectMap` | **EffectMap** |
| DOM 부수효과 객체 | `DOMEffect` | `DOMEffect` | `fx`, `Effect` | **DOMEffect** |
| 이펙트 로그 | — | `EffectRecord` | — | **EffectRecord** |
| 핸들러 읽기 컨텍스트 | `ctx` | `OSContext` | `cofx`, `Context` | **Context** |
| 핸들러 전후 훅 | `Middleware` | `OSMiddleware` | `Interceptor`, `Middleware` | **Middleware** |
| 파생 상태 | (없음) | (없음) | `Subscription`, `Computed` | **Computed** |
| 전체 상태 트리 | — | `OSState` | `db`, `DB`, `Store` | **DB** |
| Zone별 상태 | `ZoneState`, `ZoneSnapshot` | `FocusGroupState` | `ZoneState` | **ZoneState** |
| Zone별 설정 | — | `FocusGroupConfig` | `ZoneConfig` | **ZoneConfig** |
| Kernel 버블링 단위 | `bubblePath` (부분) | (없음) | `Scope` | **Scope** |

---

## 4. 혼용 현황 — 같은 이름, 다른 개념

| 이름 | 의미 A | 의미 B | 해결 |
|---|---|---|---|
| **`Command`** | 디스패치 데이터 `{ type, payload }` | 핸들러 포함 정의 `{ run }` | 데이터 **Command**, 정의 **CommandDef** |
| **`Context`** | 핸들러 읽기 컨텍스트 | React Context (`FocusGroupContext`) | Kernel **Context**, React는 `React.Context` |
| **`Effect`** | EffectMap의 키 (선언) | DOM 부수효과 객체 (실행) | 선언 **EffectMap 키**, 실행 **DOMEffect** |
| **`State`** | 전체 상태 (`OSState`) | Zone별 상태 (`FocusGroupState`) | 전체 **DB**, Zone별 **ZoneState** |
| **`Middleware`** | Redux `(next) => (s, a) => ...` | re-frame `{ id, before, after }` | **Middleware** 통일, 형태 `{ id, before, after }` |
| **`Store`** | Zustand 인스턴스 | 상태 트리 별칭 | Zustand `store`, 상태 트리 **DB** |
| **`Zone`** | Public primitive 컴포넌트 | 개념으로서의 "포커스 영역" | 컴포넌트 **`<Zone>`**, 개념 **"zone"** (소문자) |
| **`groupId`** | FocusGroup 내부 식별자 | OS 상태의 zone 식별자 | Internal `groupId`, OS State `activeZoneId` |

---

## 5. 확정 용어집

### 5.1 개념 (Concept) — 설계 문서, 주석

| 확정 이름 | 정의 | ❌ 쓰지 않는 이름 |
|---|---|---|
| **zone** | 포커스 관리 영역 단위. ARIA composite widget 대응. | group (개념으로서) |
| **scope** | Kernel 버블링 계층 단위. zone은 scope의 OS 활용. | layer, level |
| **command** | 디스패치되는 데이터 `{ type, payload }` | event (re-frame), action (Redux) |
| **handler** | 커맨드 처리 순수함수 `(ctx, payload) → EffectMap` | — |
| **effect map** | 핸들러 반환 이펙트 선언 `{ db, focus, scroll, ... }` | result, fx-map |
| **DOM effect** | 실제 DOM 조작 `{ type: "FOCUS", targetId }` | — |
| **effect executor** | DOM effect 실행 함수. `defineEffect`로 등록. | effect handler (handler와 혼동) |
| **context** | 핸들러가 받는 읽기 전용 데이터 | cofx, coeffects |
| **context provider** | Context 수집 함수. `defineContext`로 등록. | cofx handler |
| **middleware** | 핸들러 전후 훅 `{ id, before, after }` | interceptor |
| **computed** | 캐싱된 파생 상태 | subscription, selector, query |
| **bubble path** | 커맨드 전파 scope 경로 `[active, ..., __global__]` | focus path (다른 것) |
| **focus path** | 활성 zone 조상 체인 `[root, ..., active]` | (bubble path와 방향 반대) |
| **role preset** | ARIA role 기반 zone 기본 설정 | — |
| **sentinel** | 런타임 치환 플레이스홀더 (`OS.FOCUS`) | — |

### 5.2 함수/API (Function) — Kernel

| 이름 | 역할 | 시그니처 |
|---|---|---|
| `dispatch` | 커맨드 발행 | `(cmd: Command) → void` |
| `defineHandler` | 순수 상태 핸들러 등록 | `(id, (db, payload) → db) → void` |
| `defineCommand` | 이펙트 반환 핸들러 등록 | `(id, (ctx, payload) → EffectMap) → void` |
| `defineEffect` | Effect executor 등록 | `(id, (value) → void) → void` |
| `defineContext` | Context provider 등록 | `(id, () → value) → void` |
| `defineComputed` | 파생 상태 등록 | `(id, (db, args) → value) → void` |
| `inject` | 핸들러에 context 주입 | `(id) → Middleware` |
| `use` | 글로벌 middleware 등록 | `(middleware) → void` |
| `defineScope` | Scope 등록 (버블링 노드) | `(id, { parent? }) → void` |
| `removeScope` | Scope 제거 | `(id) → void` |
| `defineKeybinding` | 키 → 커맨드 매핑 | `({ key, command, ... }) → void` |
| `useComputed` | React 훅: 파생 상태 구독 | `([id, ...args]) → T` |
| `useDispatch` | React 훅: dispatch 획득 | `() → (cmd) → void` |
| `getDb` | DB 스냅샷 읽기 | `() → DB` |
| `resetDb` | DB 초기화 | `(db) → void` |

### 5.3 타입 (Type)

| 확정 타입명 | 정의 | ❌ 레거시/신규 이전 이름 |
|---|---|---|
| `Command` | `{ type: string; payload?: unknown }` | `BaseCommand` (양쪽), `Event` (문서) |
| `CommandDef<P>` | `{ id: string; run: Handler<P>; log?: boolean }` | `OSCommand` (신규), `CommandFactory` (레거시) |
| `Handler<P>` | `(ctx: Context, payload: P) → EffectMap \| null` | `OSCommand.run` (신규), `cmd.run` (레거시) |
| `EffectMap` | `{ db?, focus?, scroll?, dispatch?, ... }` | `OSResult` (신규) |
| `DOMEffect` | `{ type: "FOCUS"\|"SCROLL"\|"CLICK"\|"BLUR"; targetId? }` | (양쪽 동일) |
| `EffectRecord` | `{ source, action, targetId, executed, reason }` | (신규만) |
| `Context` | `{ db: DB; [injectedKey]: unknown }` | `OSContext` (신규), `cofx` (문서) |
| `Middleware` | `{ id: string; before?; after? }` | `OSMiddleware` (신규), `Interceptor` (문서) |
| `DB` | `{ os, app, scopes }` | `OSState` (신규, 전체 상태를 가리킬 때) |
| `ZoneState` | `{ focusedItemId, selection, ... }` | `FocusGroupState` (신규), `ZoneSnapshot` (레거시) |
| `ZoneConfig` | `{ navigate, tab, select, activate, dismiss, project }` | `FocusGroupConfig` (신규) |
| `ZoneRole` | `"listbox" \| "menu" \| "grid" \| ...` | (양쪽 동일) |
| `Computed<T>` | 파생 상태 정의 | `Subscription` (문서) |
| `Scope` | `{ id: string; parent?: string }` | (신규 개념) |
| `BubblePath` | `string[]` | (신규 개념) |
| `InputSource` | `"keyboard" \| "mouse" \| "programmatic"` | (양쪽 동일) |

### 5.4 컴포넌트 (Component)

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

// OS State — 활성 zone을 추적
interface FocusState {
  activeZoneId: string | null;
  zones: Record<string, ZoneState>;
}
```

### 6.2 약어

**허용:**

| 약어 | 원형 | 사용처 |
|---|---|---|
| `ctx` | Context | 핸들러 파라미터 |
| `cmd` | Command | 변수명 |
| `db` | Database (상태 트리) | `getDb()`, `ctx.db` |
| `id` | Identifier | 모든 곳 |
| `ref` | Reference | React ref |
| `props` | Properties | React props |
| `e` | Event | DOM Event 핸들러 |
| `fn` | Function | 콜백 파라미터 |
| `el` | Element | DOM Element |

**금지:**

| ❌ 약어 | 대신 사용 |
|---|---|
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
| `app-db` | **DB** | 전체 상태 트리 |
| `reg-event-fx` | `defineCommand` | 함수명 |
| `reg-event-db` | `defineHandler` | 함수명 |
| `reg-fx` | `defineEffect` | 함수명 |
| `reg-cofx` | `defineContext` | 함수명 |
| `inject-cofx` | `inject` | 함수명 |
| `reg-sub` | `defineComputed` | 함수명 |
| `subscribe` | `useComputed` | 함수명 |
| `coeffects` / `cofx` | **Context** | 개념 |
| `effects map` | **EffectMap** | 개념/타입 |
| `interceptor` | **Middleware** | 개념/타입 |
| `event` | **Command** | 개념/타입 |

### 레거시 코드 (`os/`) → 확정

| 레거시 | 확정 | 비고 |
|---|---|---|
| `BaseCommand` | **Command** | 타입 rename |
| `CommandFactory` | **CommandDef** | 타입 rename |
| `CommandEngineStore` | Kernel dispatcher | 구조 변경 |
| `ZoneState` | **ZoneState** | 유지 |
| `ZoneSnapshot` | **ZoneState** | 통합 |
| `Middleware` (Redux 형태) | **Middleware** (`{ id, before, after }` 형태로) | 형태 변경 |
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
| `OSContext` | **Context** | 타입 rename |
| `OSMiddleware` | **Middleware** | 타입 rename |
| `FocusGroupState` | **ZoneState** | 타입 rename |
| `FocusGroupConfig` | **ZoneConfig** | 타입 rename |
| `FocusGroupStore` | (내부 구현, 노출 안 함) | — |
| `EffectRecord` | **EffectRecord** | 유지 |
| `FocusGroup` (컴포넌트) | **FocusGroup** | 유지 (Internal) |
| `FocusItem` (컴포넌트) | **FocusItem** | 유지 (Internal) |
| `groupId` (FocusGroup 내부) | **groupId** | 유지 (Internal) |
| `activeZoneId` | **activeZoneId** | 유지 |

### 제안 문서 (01~05) → 확정

| 문서에서 사용 | 확정 | 비고 |
|---|---|---|
| `Event` (데이터 타입, 03 문서) | **Command** | 수정 필요 |
| `Scope` (Kernel 계층, 05 문서) | **Scope** | 유지 |
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
  db?: DB;
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
  □ OSResult → EffectMap
  □ OSContext → Context
  □ OSMiddleware → Middleware
  □ FocusGroupState → ZoneState
  □ FocusGroupConfig → ZoneConfig

Phase 2: 중복 필드 정리 (os-new/)
  □ KeybindingItem: groupId 필드 제거, zoneId 통일

Phase 3: 개념어 통일 (주석, 문서)
  □ "Interceptor" → "Middleware"
  □ "Subscription" → "Computed"
  □ "cofx" / "coeffect" → "Context"
  □ "fx" → "effect" 또는 "effectMap"
  □ "Event" (데이터 의미) → "Command"
```

**하지 않는 것:**
- `FocusGroup` rename ❌ — Internal primitive로 유지
- `FocusItem` rename ❌ — Internal primitive로 유지
- `groupId` (FocusGroup 내부) rename ❌ — Internal 용어로 유지
- 레거시 `os/` 코드 rename ❌ — 마이그레이션으로 대체될 예정
