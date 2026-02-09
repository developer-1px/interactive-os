# OS-New Kernel Migration — 전체 계획서

> 날짜: 2026-02-09  
> 태그: os-new, kernel, migration, architecture  
> 상태: Planning  
> 선행 문서: 05-[architecture] 3-Layer, 07-[interface] Full Interface Spec

---

## 0. 개요 (Overview)

### 목표

**os-new를 @kernel 베이스로 완전히 재구성**하여 3-Layer Architecture (Kernel / OS / App)를 실현한다:

```
┌─────────────────────────────────────┐
│  Layer 3: App                       │  ← Todo, Kanban (도메인 로직)
│  kernel.defineCommand("TODO_ADD")   │
├─────────────────────────────────────┤
│  Layer 2: OS                        │  ← Focus, Zone, NAVIGATE, ACTIVATE
│  kernel.defineCommand("OS_NAVIGATE")│
├─────────────────────────────────────┤
│  Layer 1: Kernel (완성)              │  ← dispatch, bubbling, scoped handler
│  @kernel 패키지                      │
└─────────────────────────────────────┘
```

### 핵심 차이점

| 현재 (os + os-new 혼재) | 목표 (os-new + kernel) |
|---|---|
| Zustand per-zone stores × N | 단일 Kernel State (state.os + state.app) |
| FocusData (전역 변수 상태) | Kernel State Management |
| CommandEngineStore dispatch | kernel.dispatch() |
| ZoneData에 앱 커맨드 바인딩 | Kernel scoped handler |
| resolveKeybinding 내부 버블링 | Kernel bubblePath resolution |
| DOMEffect 배열 | EffectMap (focus, scroll, blur) |
| OSResult 복합 구조 | EffectMap 플랫 선언 |

---

## 1. 왜 만드는가 (Rationale)

### 1.1 현재 문제점

#### 분산된 상태 관리
- `FocusData` (전역 변수) + per-zone `FocusGroupStore` (Zustand × N)
- 상태 동기화 이슈: Zone A 업데이트 중 Zone B 참조 시 race condition
- 트랜잭션 로그 불가: 상태가 분산되어 snapshot/replay 불가능

#### 복잡한 커맨드 라우팅
- `resolveKeybinding`이 키바인딩 + 버블 + 앱 오버라이드를 모두 처리
- passthrough 커맨드(`hasZoneBinding` 체크) vs activate/select (직접 dispatch) 이중 경로
- 버블링 로직이 OS Layer에 흩어져 있음 (Kernel 책임이어야 함)

#### App Override의 한계
- Zone prop으로 앱 커맨드 전달 (`onAction`, `onCopy` 등)
- OS 코드가 App 커맨드를 직접 dispatch (결합도 높음)
- 조건부 오버라이드나 버블 제어 불가능

### 1.2 Kernel 도입으로 해결되는 것

✅ **단일 State Tree**  
→ `state.os.focus.zones[zoneId]` + `state.app.todo.data`  
→ 모든 상태 변화가 트랜잭션으로 기록됨  
→ Time-travel debugging, replay 가능

✅ **Scoped Handler**  
→ App이 OS 커맨드를 scope 단위로 오버라이드  
→ DOM 이벤트 버블링과 동일한 패턴  
→ passthrough 개념 소멸 (scoped handler로 통합)

✅ **EffectMap 선언형 이펙트**  
→ App이 `focus`, `scroll` 같은 OS effect도 사용 가능  
→ `TODO_DELETE`가 `{ state: ..., focus: recoveryId }` 반환  
→ 부작용 격리, 테스트 용이

✅ **Middleware 체계**  
→ Transaction log, debug, analytics 등 횡단 관심사 분리  
→ re-frame의 Interceptor 패턴

---

## 2. 무엇을 만드는가 (What We're Building)

### 2.1 Layer 1: Kernel (✅ 완성)

**위치:** `packages/kernel/src/`

**공개 API:**
```typescript
// Entry
createKernel, initKernel, state

// Dispatch
dispatch

// Inspector
clearTransactions, getTransactions, travelTo, Transaction

// React
useComputed
```

**내부 API (internal.ts):**
```typescript
defineContext, getState, resetState, use, GLOBAL,
getLastTransaction, recordTransaction, resetKernel,
defineScope, useDispatch, 모든 타입들
```

**상태:**
- 27개 export → 9개로 축소 완료
- `strict: true` + 4개 추가 strict 플래그 적용
- Dead code 제거 완료
- 테스트 4개 통과 (step1 ✅, step

2 △, step3 △, step4 ✅)

### 2.2 Layer 2: OS (🚧 os-new 마이그레이션 대상)

**현재 os-new 디렉토리 구조:**
```
src/os-new/
├── 1-sensor/        keyboard, clipboard, focus, history (17 files)
├── 2-command/       navigate, activate, select, field, tab (27 files)
├── 3-store/         focusGroupStore, slices (6 files)
├── 4-effect/        (6 files)
├── core/            dispatchToZone (5 files)
├── lib/             (5 files)
├── primitives/      FocusGroup, FocusItem, Field (3 files)
├── registry/        (1 file)
├── schema/          types (23 files)
└── shared/          (2 files)
```

**마이그레이션 후 구조 (re-frame 6-Domino):**
```
src/os-new/
├── 1-listeners/      Event Listeners (DOM event → dispatch)
│   ├── keyboard/     KeyboardListener.tsx
│   ├── clipboard/    ClipboardListener.tsx
│   └── focus/        FocusSensor.tsx
│
├── 2-contexts/       Context Providers (Coeffects)
│   ├── domItems.ts   defineContext("dom-items", ...)
│   ├── zoneConfig.ts defineContext("zone-config", ...)
│   └── domRects.ts   defineContext("dom-rects", ...)
│
├── 3-commands/       Command Handlers
│   ├── navigate/     kernel.defineCommand("OS_NAVIGATE", ...)
│   ├── activate/     kernel.defineCommand("OS_ACTIVATE", ...)
│   ├── select/       kernel.defineCommand("OS_SELECT", ...)
│   └── field/        Field lifecycle commands
│
├── 4-effects/        Side Effects
│   ├── focus.ts      defineEffect("focus", ...)
│   ├── scroll.ts     defineEffect("scroll", ...)
│   └── blur.ts       defineEffect("blur", ...)
│
├── 5-hooks/          Custom Hooks (Subscriptions)
│   ├── useFocused.ts useComputed(["is-focused", ...])
│   ├── useSelection.ts
│   └── useFocusedItem.ts
│
├── 6-components/     React Components
│   ├── Zone.tsx      defineScope + scoped handlers
│   ├── Item.tsx      Focus/Selection decorators
│   └── Field.tsx     Inline edit UI
│
├── middleware/       Middleware (횡단 관심사)
│   ├── transaction.ts kernel.use({ before, after })
│   ├── logger.ts      Debug logging
│   └── analytics.ts   Event tracking
│
├── state/            State Schema
│   ├── OSState.ts
│   ├── FocusState.ts
│   └── initial.ts
│
├── lib/              Utilities
└── schema/           Type Definitions
```

**6-Domino Pipeline Flow:**
```
User: ArrowDown
    ↓
1. listeners     → dispatch("OS_NAVIGATE")
    ↓
2. contexts      → inject("dom-items"), inject("zone-config")
    ↓
    [middleware.before() — Transaction snapshot]
    ↓
3. commands      → NAVIGATE handler → { state, focus, scroll }
    ↓
    [middleware.after() — Transaction logging]
    ↓
4. effects       → focus(), scroll() 실행
    ↓
5. hooks         → useFocused re-compute
    ↓
6. components    → <Item /> re-render
```

### 2.3 Layer 3: App (📍 os-new 완료 후)

**Todo, Kanban 앱을 kernel 기반으로 재작성:**
```typescript
// App State
const TodoApp = kernel.group({ 
  scope: \"todo-app\",
  inject: [] 
});

// App Command
TodoApp.defineCommand(\"TODO_ADD\", (ctx, { text }) => ({
  state: { ...ctx.state, todos: [...ctx.state.todos, { id, text, done: false }] },
  focus: `todo-${id}`,  // ← OS effect 사용
  toast: \"Added!\",      // ← App effect
}));

// Zone에 스코프 바인딩
<Zone 
  scope={defineScope(\"todo-list\")} 
  onAction={TodoApp.commands.TODO_TOGGLE_DONE({ id: OS.FOCUS })} 
/>
```

---

## 3. 지금까지 되어 있는 것 (Current State)

### ✅ Kernel (완성)

| 항목 | 상태 | 비고 |
|---|---|---|
| dispatch 큐 | ✅ | re-entrance safe |
| bubblePath resolution | ✅ | scoped handler 지원 |
| EffectMap 실행 | ✅ | state, dispatch, 커스텀 effect |
| Context injection | ✅ | inject([NOW, USER]) |
| Middleware | ✅ | before/after 체인 |
| Transaction log | ✅ | snapshot, time-travel |
| React hooks | ✅ | useComputed, useDispatch |
| Public API 최소화 | ✅ | 27 → 9 exports |
| TypeScript strict | ✅ | noUncheckedIndexedAccess 등 |

### 🚧 OS (os-new 부분 완성)

| 항목 | 상태 | 비고 |
|---|---|---|
| Schema 정의 | ✅ | OSCommands, FocusState, ZoneConfig |
| Navigation strategies | ✅ | vertical, horizontal, corner, grid |
| Command 구현 | ⚠️ | 구조는 있지만 kernel 통합 안 됨 |
| FocusGroupStore | ⚠️ | Zustand per-zone (kernel State로 이관 필요) |
| Primitives | ⚠️ | FocusGroup, FocusItem 있지만 kernel 없이 동작 |
| Effect 선언 | ❌ | DOMEffect 배열 (EffectMap으로 변경 필요) |
| Scoped handler | ❌ | Zone props로 전달 (kernel.defineCommand로 변경) |

### ❌ App (미작업)

| 항목 | 상태 | 비고 |
|---|---|---|
| kernel.group() 사용 | ❌ | 기존 앱은 os/ 기반 |
| App State 분리 | ❌ | FocusState와 혼재 |
| App Command 정의 | ❌ | kernel.defineCommand 미사용 |
| EffectMap 반환 | ❌ | 직접 setState 호출 |

---

## 4. 되어 있지 않은 것 (Remaining Work)

### Phase 1: OS State 통합

**목표:** Zustand per-zone → Kernel 단일 State

```typescript
// Before (현재)
const useFocusGroupStore = create<FocusGroupState>(...);
FocusData.getActiveZone();

// After (계획)
const state = kernel.getState();
state.os.focus.activeZoneId;
state.os.focus.zones[\"todo-list\"].focusedItemId;
```

**작업:**
- [ ] OSState 인터페이스 정의 (`state.os`)
- [ ] Kernel에 OSState 등록 (`initial State`)
- [ ] FocusGroupStore 마이그레이션 (Zustand → Kernel State)
- [ ] FocusData 제거 (전역 변수 → Kernel State)

### Phase 2: OS Commands Kernel 등록

**목표:** OS 커맨드를 kernel.defineCommand로 등록

```typescript
// Before
export const NAVIGATE = createOSCommand(
  \"OS_NAVIGATE\",
  (ctx) => { /* ... */ }
);

// After
kernel.defineCommand(\"OS_NAVIGATE\", [inject(\"dom-items\"), inject(\"zone-config\")],
  (ctx, payload) => ({
    state: { ...ctx.state, os: { focus: { zones: { ... } } } },
    focus: targetId,
    scroll: targetId,
  })
);
```

**작업:**
- [ ] Navigation 커맨드 (NAVIGATE, TAB, FOCUS, SYNC_FOCUS, RECOVER)
- [ ] Selection 커맨드 (SELECT, SELECT_ALL, DESELECT_ALL)
- [ ] Activation/Escape (ACTIVATE, ESCAPE)
- [ ] Field 커맨드 (FIELD_START_EDIT, FIELD_COMMIT, FIELD_CANCEL)
- [ ] Clipboard/History (COPY, CUT, PASTE, UNDO, REDO, DELETE)

### Phase 3: OS Effects 등록

**목표:** DOM 이펙트를 kernel.defineEffect로 등록

```typescript
kernel.defineEffect(\"focus\", (id: string) => {
  document.getElementById(id)?.focus({ preventScroll: true });
});

kernel.defineEffect(\"scroll\", (id: string) => {
  document.getElementById(id)?.scrollIntoView({ block: \"nearest\" });
});

kernel.defineEffect(\"blur\", () => {
  (document.activeElement as HTMLElement)?.blur();
});
```

**작업:**
- [ ] focus effect
- [ ] scroll effect
- [ ] blur effect
- [ ] click effect (activate용)

### Phase 4: Context Providers 등록

**목표:** DOM 쿼리를 kernel.defineContext로 lazy 제공

```typescript
kernel.defineContext(\"dom-items\", () => {
  const zoneId = kernel.getState().os.focus.activeZoneId;
  const el = document.getElementById(zoneId!);
  return el ? Array.from(el.querySelectorAll(\"[data-focus-item]\")).map(e => e.id) : [];
});

kernel.defineContext(\"zone-config\", () => {
  const zoneId = kernel.getState().os.focus.activeZoneId;
  return zoneRegistry.get(zoneId!)?.config;
});
```

**작업:**
- [ ] dom-items context
- [ ] dom-rects context
- [ ] zone-config context
- [ ] sibling-zones context

### Phase 5: Scoped Handler 통합

**목표:** Zone props → kernel scoped handler

```typescript
// Before
<FocusGroup 
  zoneId=\"todo-list\" 
  onAction={TODO_TOGGLE_DONE}
  onDelete={TODO_DELETE}
/>

// After
<Zone scope=\"todo-list\" />

// App에서:
kernel.defineCommand(\"OS_ACTIVATE\", { scope: \"todo-list\" },
  (ctx) => ({
    dispatch: TODO_TOGGLE_DONE({ id: ctx.state.os.focus.zones[\"todo-list\"].focusedItemId }),
  })
);
```

**작업:**
- [ ] Zone primitive 재작성 (scope 기반)
- [ ] onAction → scoped \"OS_ACTIVATE\"
- [ ] onCopy → scoped \"OS_COPY\"
- [ ] onDelete → scoped \"OS_DELETE\"
- [ ] 기타 passthrough 커맨드 scoped handler로 변환
- [ ] dispatchToZone 로직 제거 (kernel bubbling으로 대체)

### Phase 6: Keybinding Phase 분리

**목표:** Key → Command (flat) + Command → Handler (bubbling) 분리

```typescript
// Phase 1: Keybinding (flat lookup)
kernel.defineKeybinding({ key: \"enter\", command: \"OS_ACTIVATE\" });
kernel.defineKeybinding({ key: \"down\", command: \"OS_NAVIGATE\", args: { direction: \"DOWN\" } });

// Phase 2: Command Resolution (bubblePath)
kernel.dispatch({ type: \"OS_ACTIVATE\" });
// → bubblePath: [\"todo-list\", \"__global__\"]
// → \"todo-list\" scoped handler 있으면 실행, 없으면 __global__
```

**작업:**
- [ ] resolveKeybinding 리팩토링 (flat lookup만)
- [ ] Kernel bubblePath resolution 활용
- [ ] scope-specific keybinding 지원

### Phase 7: Primitive 재작성

**목표:** Zone, Item, Field를 kernel 기반으로 재작성

```typescript
<Zone scope=\"todo-list\" role=\"listbox\">
  <Item id=\"todo-1\" />
  <Item id=\"todo-2\" />
  <Field id=\"new-todo-input\" />
</Zone>

// 내부적으로:
// - defineScope(scope, { parent })
// - useComputed([\"is-focused\", scope, itemId])
// - dispatch(kernel command)
```

**작업:**
- [ ] Zone (scoped mount/unmount)
- [ ] Item (focus/selection decorators)
- [ ] Field (inline edit lifecycle)

### Phase 8: App Layer 마이그레이션

**목표:** Todo, Kanban을 kernel 기반으로 재작성

```typescript
const TodoApp = kernel.group({ scope: \"todo\" });

TodoApp.defineCommand(\"TODO_ADD\", (ctx, { text }) => ({
  state: { ...ctx.state, app: { todo: { ...addTodo } } },
  focus: newId,
  toast: \"Added!\",
}));

// Zone에 바인딩
<Zone 
  scope=\"todo-list\" 
  onAction={TodoApp.commands.TODO_TOGGLE_DONE({ id: OS.FOCUS })}
/>
```

**작업:**
- [ ] AppState 정의 (state.app.todo, state.app.kanban)
- [ ] Todo commands (ADD, TOGGLE, DELETE, EDIT)
- [ ] Kanban commands (ADD_CARD, MOVE_CARD, DELETE_CARD)
- [ ] History (undo/redo) kernel 이펙트로 재구성

---

## 5. 마이그레이션 전략 (Migration Strategy)

### 5.1 접근 방식

**점진적 마이그레이션 (Incremental Migration):**
- `src/os` (레거시)는 그대로 유지
- `src/os-new`에 kernel 기반 재구성
- 완성 후 `src/os` 교체

### 5.2 우선순위

| 단계 | Phase | 복잡도 | 의존성 |
|---|---|---|---|
| 1 | OS State 통합 | 중 | Kernel State 이해 필요 |
| 2 | OS Commands 등록 | 고 | State 통합 완료 필수 |
| 3 | OS Effects 등록 | 낮 | 독립 가능 |
| 4 | Context Providers | 낮 | State 참조 필요 |
| 5 | Scoped Handler | 고 | Commands + Effects 완료 필수 |
| 6 | Keybinding 분리 | 중 | Scoped Handler 선행 |
| 7 | Primitive 재작성 | 중 | 위 모든 것 통합 |
| 8 | App 마이그레이션 | 낮 | OS Layer 완성 필수 |

### 5.3 검증 방법

각 Phase 완료 후:
- [ ] 기존 테스트 통과 (KernelLabPage, focus-showcase)
- [ ] 새 테스트 추가 (os-new specific)
- [ ] 타입 체크 통과 (`tsc --noEmit`)
- [ ] Inspector에서 transaction log 확인

---

## 6. 성공 기준 (Success Criteria)

### 6.1 기능

- [ ] Todo 앱 완전 동작 (kernel + os-new 기반)
- [ ] Kanban 앱 완전 동작
- [ ] Keyboard navigation 정상 (arrow, tab, enter, esc)
- [ ] Selection (single/multi) 정상
- [ ] Field inline edit 정상
- [ ] Clipboard (copy/cut/paste) 정상
- [ ] History (undo/redo) 정상

### 6.2 아키텍처

- [ ] `state.os`와 `state.app` 완전 분리
- [ ] 모든 OS 커맨드가 kernel.defineCommand
- [ ] 모든 App 커맨드가 kernel.group().defineCommand
- [ ] Scoped handler로 App override
- [ ] Zone = Kernel Scope (1:1)
- [ ] 전역 변수 제거 (FocusData, CommandEngineStore)

### 6.3 품질

- [ ] TypeScript strict 모드 0 에러
- [ ] 모든 테스트 통과
- [ ] Transaction log에 전체 상태 변화 기록
- [ ] Time-travel debugging 동작
- [ ] Inspector에서 모든 Zone 상태 확인 가능

---

## 7. 다음 단계 (Next Steps)

1. **Phase 1 Implementation Plan 작성**  
   OSState 인터페이스 정의 + Kernel 등록 + FocusGroupStore 마이그레이션 상세 계획

2. **Spike: 단순 Zone 프로토타입**  
   kernel 기반 Zone 1개 + 커맨드 1개로 end-to-end 검증

3. **Phase 1 실행**  
   OSState 통합 완료 후 Phase 2로 진행

---

## 8. 참고 문서

- [05-[architecture] 3-Layer Architecture](file:///Users/user/Desktop/interactive-os/docs/0-inbox/05-[architecture]_3-Layer_Architecture_Proposal.md)
- [07-[interface] Full Interface Specification](file:///Users/user/Desktop/interactive-os/docs/0-inbox/07-[interface]_Full_Interface_Specification.md)
- [Kernel Source](file:///Users/user/Desktop/interactive-os/packages/kernel/src/index.ts)
- [os-new Directory](file:///Users/user/Desktop/interactive-os/src/os-new)
