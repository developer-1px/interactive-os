# 3-Layer Architecture — Kernel / OS / App

> 날짜: 2026-02-09
> 태그: architecture, kernel, bubbling, 3-layer
> 상태: Draft
> 선행 문서: 01-[re-frame] 제안서, 03-[naming] 네이밍 컨벤션, 04-[core] Usage Guide

---

## 0. 왜 3-Layer인가

01 제안서에서는 "re-frame 코어 라이브러리"를 하나의 덩어리로 설계했다.
하지만 개발을 하면서 **분명한 3개 층**이 드러났다:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: App                                           │
│  TodoState, KanbanState, AppCommand, AppEffect          │
│  → 도메인 로직. OS가 뭔지 모른다.                        │
├─────────────────────────────────────────────────────────┤
│  Layer 2: OS                                            │
│  FocusState, Zone, Item, NAVIGATE, ACTIVATE, ARIA       │
│  → 포커스/탐색/접근성. Kernel 위에서 동작한다.            │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Kernel                                        │
│  dispatch, defineCommand, defineEffect, bubbleScope     │
│  → 범용 이벤트 엔진. OS가 뭔지 모른다.                   │
└─────────────────────────────────────────────────────────┘
```

01 제안서가 빠뜨린 것: **Kernel과 OS의 경계**.
특히 **버블링**은 OS 기능이 아니라 **Kernel 기능**이다.
DOM 이벤트 버블링이 브라우저 엔진에 있듯이.

---

## 1. 각 레이어의 책임

### Layer 1: Kernel — 범용 이벤트 엔진

**Kernel이 아는 것:**
- 이벤트(Event)가 있다
- 핸들러(Handler)가 등록된다
- 이펙트(Effect)가 선언되고 실행된다
- 스코프(Scope)가 계층을 이루고, 이벤트가 버블링된다
- 미들웨어(Middleware)가 실행 전후에 끼어든다
- 파생 상태(Computed)가 캐시된다

**Kernel이 모르는 것:**
- "포커스"가 뭔지
- "Zone"이 뭔지
- "ARIA"가 뭔지
- "Todo"가 뭔지

```typescript
// Kernel API — 이것이 전부
dispatch(event)
defineCommand(id, handler)
defineHandler(id, handler)
defineEffect(id, executor)
defineContext(id, provider)
defineComputed(id, extractor)
inject(id)
use(middleware)
defineScope(id, { parent })
```

### Layer 2: OS — 포커스 시스템

**OS가 아는 것:**
- Zone은 Kernel의 Scope다
- Zone은 Config(role preset)을 가진다
- Arrow keys → NAVIGATE, Enter → ACTIVATE, Escape → ESCAPE
- Zone에 바인딩된 앱 커맨드가 있으면 OS 기본 동작 대신 실행
- ARIA 역할, 속성, 키보드 패턴

**OS가 모르는 것:**
- Todo의 done 상태
- Kanban의 column 순서
- 앱의 비즈니스 로직

```typescript
// OS가 Kernel 위에 등록하는 것
defineCommand("NAVIGATE", [inject("dom-items"), inject("zone-config")], handler)
defineCommand("ACTIVATE", handler)
defineCommand("ESCAPE", handler)
defineCommand("SELECT", handler)
defineCommand("TAB", handler)

defineEffect("focus", (id) => el.focus())
defineEffect("scroll", (id) => el.scrollIntoView())
defineEffect("blur", () => document.activeElement?.blur())

defineContext("dom-items", () => queryItems(activeZoneId))
defineContext("dom-rects", () => queryRects(domItems))
defineContext("zone-config", () => zoneRegistry.get(activeZoneId))

defineComputed("focused-item", (db, [_, zoneId]) => ...)
defineComputed("is-focused", ...)
defineComputed("is-selected", ...)

// OS가 Kernel의 Scope로 Zone을 등록
// FocusGroup 마운트 시:
defineScope(zoneId, { parent: parentZoneId })
```

### Layer 3: App — 도메인 로직

**App이 아는 것:**
- 자기 데이터 (todos, cards)
- 자기 커맨드 (ToggleDone, DeleteCard)
- 어떤 Zone에 어떤 커맨드를 바인딩할지

**App이 모르는 것:**
- 포커스가 어떻게 이동하는지
- Arrow keys가 어떻게 처리되는지
- ARIA가 어떻게 설정되는지

```typescript
// App이 Kernel 위에 등록하는 것
defineCommand("TODO_TOGGLE_DONE", (ctx, { id }) => {
  return { db: toggleDone(ctx.db, id) };
})

defineCommand("TODO_DELETE", (ctx, { id }) => {
  return { db: deleteTodo(ctx.db, id), focus: recoveryId };
})

// App이 OS primitive에 바인딩하는 것
<Zone role="listbox" onAction={ToggleDone({ id: OS.FOCUS })} />
```

---

## 2. State 분리 모델

### 2.1 확정된 구조: OS State ≠ App State

```
┌───────────────────────────────────────────────────┐
│  Kernel DB (단일 상태 트리)                         │
│                                                   │
│  db.os ──────────────────────────────────────────  │
│  │  focus:                                        │
│  │    activeZoneId: "todo-list"                    │
│  │    focusStack: [{ zoneId, itemId }]            │
│  │    zones:                                      │
│  │      "todo-list": { focusedItemId, selection } │
│  │      "kanban-col-1": { focusedItemId }         │
│  │  input:                                        │
│  │    source: "keyboard"                          │
│  │                                                │
│  db.app ─────────────────────────────────────────  │
│  │  activeAppId: "todo"                           │
│  │  todo:                                         │
│  │    data: { todos, todoOrder }                  │
│  │    ui: { draft, editingId }                    │
│  │    history: { past, future }                   │
│  │  kanban:                                       │
│  │    data: { cards, columns, cardOrder }         │
│  │    ui: { editingCardId }                       │
│  │    history: { past, future }                   │
│  │                                                │
│  db.scopes ──────────────────────────────────────  │
│  │  "todo-list": { parent: null, handlers: {...}} │
│  │  "kanban-board": { parent: null }              │
│  │  "kanban-col-1": { parent: "kanban-board" }    │
│  └────────────────────────────────────────────────│
└───────────────────────────────────────────────────┘
```

**핵심 원칙:**
- `db.os`는 App 데이터를 절대 포함하지 않는다
- `db.app`은 Focus 상태를 절대 포함하지 않는다
- `db.scopes`는 Kernel이 관리하는 스코프 계층 (Zone = Scope)
- 하나의 Zustand 스토어, 하지만 **namespace로 격리**

### 2.2 왜 하나의 DB인가

| 분리 스토어 (현재) | 통합 DB (제안) |
|---|---|
| FocusData(전역변수) + Zone스토어×N + CommandEngine | 하나의 Zustand 스토어 |
| 스냅샷 불가능 (분산) | 트랜잭션 로그에 전체 상태 기록 가능 |
| 동기화 이슈 (Zone A 업데이트 중 Zone B 참조) | 원자적 업데이트 |
| DevTools에서 3곳을 봐야 함 | 한 곳에서 전체 상태 확인 |
| 리플레이 불가 | EffectMap 리플레이로 전체 복원 |

**리렌더 우려 해소:**
Zone A가 변경되어도 Zone B가 리렌더되지 않는다.
`useComputed(["is-focused", "zone-b", "item-1"])`는 `db.os.focus.zones["zone-b"]`만 참조하므로.
Zustand의 selector 비교가 이를 보장한다.

---

## 3. Effect 처리 모델

### 3.1 확정: 분리된 선언, 동일한 파이프라인

```
                OS Effect                    App Effect
                ──────────                   ──────────
선언 시점    │ defineCommand 반환값        │ AppCommand 반환값
형태        │ EffectMap                   │ EffectMap
키 예시     │ focus, scroll, blur         │ toast, http, analytics
실행 방법    │ defineEffect 레지스트리     │ 동일한 defineEffect 레지스트리
실행 시점    │ 핸들러 실행 직후            │ 핸들러 실행 직후
```

**핵심: 하나의 Effect 레지스트리.**

```typescript
// OS가 등록
defineEffect("focus", (id) => document.getElementById(id)?.focus());
defineEffect("scroll", (id) => document.getElementById(id)?.scrollIntoView());

// App이 등록
defineEffect("toast", (msg) => toastStore.add(msg));
defineEffect("http", async (config) => { ... });
defineEffect("analytics", (event) => mixpanel.track(event));

// 둘 다 같은 EffectMap으로 선언
defineCommand("NAVIGATE", (ctx, payload) => ({
  db: nextDb,
  focus: "item-3",    // ← OS effect
  scroll: "item-3",   // ← OS effect
}));

defineCommand("TODO_ADD", (ctx, payload) => ({
  db: nextDb,
  focus: newItemId,    // ← OS effect (앱이 OS effect도 쓸 수 있다!)
  toast: "Added!",     // ← App effect
}));
```

**앱이 OS effect를 쓸 수 있다는 점이 중요하다.**
`TODO_DELETE`가 `focus: recoveryId`를 반환하면, 삭제 후 다음 아이템으로 포커스가 이동한다.
앱은 `el.focus()`를 직접 호출하지 않는다. Effect로 선언할 뿐이다.

### 3.2 Effect 실행 순서

```typescript
function executeFx(effectMap: EffectMap): void {
  // 1. db는 항상 먼저 (상태 업데이트)
  if ("db" in effectMap) {
    fxRegistry.get("db")!(effectMap.db);
  }

  // 2. 나머지 effect는 등록 순서대로
  for (const [key, value] of Object.entries(effectMap)) {
    if (key === "db") continue;
    const executor = fxRegistry.get(key);
    if (executor) executor(value);
  }
}
```

**`db`가 먼저인 이유:**
다른 effect(focus, scroll)가 실행될 때 새 상태가 이미 반영되어 있어야 한다.
React가 새 아이템을 렌더한 후에 그 아이템으로 focus를 이동하는 식.

---

## 4. 버블링 모델 — Kernel의 핵심

### 4.1 왜 Kernel에 있어야 하는가

re-frame은 **flat dispatch**다. `dispatch(event)` → `registry.get(type)` → 실행. 끝.
하지만 우리에겠는 **Scope 계층**이 있다:

```
Zone "kanban-board" (Scope)
  └─ Zone "col-1" (Scope)
       └─ Zone "card-list" (Scope)  ← activeScope
            └─ Item "card-3"        ← focused
```

"Enter 키를 누르면 누가 처리하는가?"

- `card-list`에 `onAction`이 바인딩되어 있으면 → App 핸들러
- 없으면 → `col-1`에 있나? → `kanban-board`에 있나? → OS 기본 ACTIVATE

**이것은 DOM 이벤트 버블링과 같은 패턴이다.**
그리고 DOM 이벤트 버블링은 브라우저 엔진(= Kernel)에 있다.

"이벤트가 계층을 따라 전파되고, 어느 레벨에서든 가로채거나 변형할 수 있다"는 건
범용 엔진 기능이지 포커스 시스템 특화가 아니다.

### 4.2 Scope — Kernel의 계층 단위

```typescript
// Kernel API
defineScope(scopeId: string, config: { parent?: string }): void
removeScope(scopeId: string): void
getActiveScopeId(): string | null
setActiveScopeId(scopeId: string): void
buildBubblePath(scopeId?: string): string[]
```

Zone은 **OS가 Scope를 포커스 목적으로 사용**하는 것이다:

```typescript
// OS (Layer 2)에서:
// FocusGroup 마운트 시
defineScope(zoneId, { parent: parentZoneId });

// FocusGroup 언마운트 시
removeScope(zoneId);

// 포커스 이동 시
setActiveScopeId(zoneId);
```

Kernel은 "이 Scope에 Zone 설정이 있다"는 사실을 모른다.
Kernel이 아는 건 "Scope 계층이 있고, 이벤트가 이 계층을 따라 resolve된다"는 것뿐이다.

### 4.3 dispatch의 핸들러 해석(Resolution) 과정

```
dispatch({ type: "ACTIVATE" })
    │
    ▼
1. activeScope 확인
   → "card-list"

2. bubblePath 계산
   → ["card-list", "col-1", "kanban-board", "__global__"]

3. 각 scope를 순회하며 핸들러 검색
   │
   ├─ "card-list":
   │   scopeHandlers.get("card-list", "ACTIVATE")
   │   → 있음! App이 등록한 onAction 핸들러
   │   → 실행. 버블 중단.
   │
   ├─ (없었다면) "col-1":
   │   scopeHandlers.get("col-1", "ACTIVATE")
   │   → 없음. 다음으로.
   │
   ├─ (없었다면) "kanban-board":
   │   → 없음. 다음으로.
   │
   └─ "__global__":
       globalHandlers.get("ACTIVATE")
       → OS가 등록한 기본 ACTIVATE 핸들러
       → 실행.
```

### 4.4 Scoped Handler 등록

```typescript
// === Kernel API ===

// 글로벌 핸들러 (OS 기본 동작) — __global__ scope
defineCommand("ACTIVATE", handler)

// 스코프 핸들러 (앱 오버라이드) — 특정 scope
defineCommand("ACTIVATE", { scope: "card-list" }, appHandler)
```

현재 코드에서 이 패턴이 이미 존재한다:

```typescript
// 현재: FocusGroup이 onAction prop을 받으면
// → ZoneData에 activateCommand로 저장
// → resolveKeybinding이 hasZoneBinding() 확인
// → 있으면 App command dispatch

// 제안: 이것을 Kernel의 scoped handler로 일반화
// FocusGroup 마운트 시:
if (props.onAction) {
  defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => ({
    dispatch: props.onAction,  // App command를 dispatch effect로 발행
  }));
}
```

### 4.5 버블 제어

App이 이벤트를 가로챌 때, 버블링이 자동 중단된다 (첫 매칭 핸들러가 처리).
하지만 더 세밀한 제어가 필요할 수 있다:

```typescript
// Case 1: 가로채고 OS 기본 동작도 실행
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => ({
  dispatch: { type: "EDIT_CARD", payload: { id: ctx.focusedItemId } },
  // ← OS의 기본 ACTIVATE 동작(click, expand)도 실행되길 원한다면?
  bubble: true,  // Kernel에게 "다음 scope도 계속 탐색해"
}));

// Case 2: 가로채고 완전 소비 (기본 — bubble: false)
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => ({
  dispatch: { type: "OPEN_MODAL", payload: {} },
  // bubble: false (기본값) — 여기서 끝. OS ACTIVATE 실행 안 됨.
}));

// Case 3: 조건부 가로채기
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => {
  if (isEditing(ctx)) return null;  // null 반환 = 이 scope 패스, 계속 버블
  return { dispatch: { type: "START_EDIT" } };
});
```

**규칙:**
- 핸들러가 `null` 반환 → 이 scope 패스, 다음 scope로 버블
- 핸들러가 `EffectMap` 반환 → 처리됨, 버블 중단 (기본)
- `EffectMap.bubble: true` → 처리하고도 다음 scope로 계속 전파

---

## 5. App Override 패턴

### 5.1 Override = Scoped Handler

App이 OS 동작을 변경하는 3가지 패턴:

**패턴 A: 대체 (Replace)**
OS 기본 동작 대신 App 동작을 실행.

```tsx
// "Enter 누르면 Todo 완료 토글 (OS의 기본 activate 대신)"
<Zone onAction={ToggleDone({ id: OS.FOCUS })}>
```

내부적으로:
```typescript
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => ({
  dispatch: ToggleDone({ id: ctx.focusedItemId }),
  // bubble: false — OS ACTIVATE 실행 안 됨
}));
```

**패턴 B: 확장 (Extend)**
OS 기본 동작 + App 추가 동작.

```tsx
// "Enter 누르면 OS activate도 하고, 추가로 analytics도 보내"
<Zone onAction={TrackActivation({ id: OS.FOCUS })} activateBubble>
```

내부적으로:
```typescript
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => ({
  dispatch: TrackActivation({ id: ctx.focusedItemId }),
  bubble: true,  // OS ACTIVATE도 실행
}));
```

**패턴 C: 억제 (Suppress)**
특정 조건에서 OS 동작을 막음.

```tsx
// "편집 중일 때 Enter는 submit이지 activate가 아님"
<Zone onAction={null} /* 또는 when 조건 */>
```

내부적으로:
```typescript
defineScopedHandler(zoneId, "ACTIVATE", (ctx, payload) => {
  if (ctx["is-editing"]) {
    return {};  // 빈 EffectMap — 아무것도 안 함, 버블도 안 함
  }
  return null;  // null — 이 scope 패스, OS 기본으로 버블
});
```

### 5.2 왜 이것이 중요한가

현재 코드에서 App override는 **두 갈래**로 나뉘어 있다:

```
현재 경로 1 (passthrough 커맨드):
  resolveKeybinding → hasZoneBinding("copyCommand")
  → 없으면 키바인딩 자체가 매칭 안 됨

현재 경로 2 (activate/select):
  OS ACTIVATE.run() → result.dispatch = ctx.activateCommand
  → OS가 App 커맨드를 직접 dispatch
```

이 두 갈래가 **Kernel의 scoped handler 하나로 통합**된다:

```
제안:
  dispatch("ACTIVATE")
  → Kernel이 bubblePath를 순회
  → scope "card-list"에 핸들러 있음
  → App 핸들러 실행 (dispatch: AppCommand)
  → bubble: false면 여기서 끝

또는:
  dispatch("COPY")
  → Kernel이 bubblePath를 순회
  → scope "card-list"에 핸들러 있음 (onCopy 바인딩)
  → App 핸들러 실행 (dispatch: CopyCard)
  → 없으면 → __global__ → OS 기본 COPY (없으므로 무시)
```

**COPY, DELETE, UNDO 같은 "passthrough" 패턴이 자연스럽게 사라진다.**
별도의 `hasZoneBinding` 체크가 불필요하다. 그냥 scoped handler가 있으면 실행, 없으면 버블.

---

## 6. Keybinding Resolution과 Bubbling의 관계

현재 코드에는 **두 종류의 계층 탐색**이 있다:

1. **Keybinding Resolution** — "이 키가 어떤 커맨드인가?"
2. **Command Resolution** — "이 커맨드를 누가 처리하는가?"

이 둘을 분리해야 한다.

### 6.1 Phase 1: Key → Command (Keybinding)

```
KeyDown "Enter"
  │
  ▼
Keybinding Table 검색:
  key: "enter" → command: "ACTIVATE"
  key: "space" → command: "SELECT"
  key: "down"  → command: "NAVIGATE", args: { direction: "down" }
  key: "cmd+c" → command: "COPY"
  key: "cmd+z" → command: "UNDO"
  │
  ▼
dispatch({ type: "ACTIVATE" })
```

Keybinding은 **순수한 키 → 커맨드 매핑**이다.
scope별 다른 키바인딩이 필요하면 scope keybinding도 가능하지만,
대부분의 경우 **글로벌 키맵 하나**면 충분하다.

### 6.2 Phase 2: Command → Handler (Bubbling)

```
dispatch({ type: "ACTIVATE" })
  │
  ▼
Kernel bubblePath: ["card-list", "col-1", "board", "__global__"]
  │
  ├─ "card-list" scope → App handler? → YES → 실행 → 끝
  └─ (없으면) "__global__" → OS ACTIVATE → 실행
```

**현재 코드의 문제:**
`resolveKeybinding`이 bubblePath를 순회하면서 **키바인딩과 커맨드 해석을 동시에** 한다.
`hasZoneBinding` 체크까지 섞여 있다. 이 세 가지가 한 함수에 결합되어 있다.

**제안:**
```
Phase 1 (Keybinding): "enter" → "ACTIVATE"  (flat lookup, no bubbling)
Phase 2 (Dispatch):   "ACTIVATE" → kernel bubblePath → handler resolution
```

Phase 1은 간단하다. Phase 2에서 **Kernel이 bubblePath를 사용해 handler를 resolve**한다.
관심사가 분리되고, 각 Phase를 독립적으로 테스트할 수 있다.

### 6.3 예외: Scope-specific Keybinding

특정 Zone에서만 동작하는 키바인딩이 필요한 경우:

```typescript
// "kanban-board" Zone에서만 Cmd+N = ADD_COLUMN
defineKeybinding({ key: "cmd+n", command: "ADD_COLUMN", scope: "kanban-board" });
```

이 경우 Phase 1에서도 scope를 확인해야 한다:

```
Phase 1:
  key: "cmd+n"
  → scope keybindings 확인 (bubblePath 순서)
    "card-list": cmd+n 바인딩? → 없음
    "col-1": cmd+n 바인딩? → 없음
    "kanban-board": cmd+n 바인딩? → 있음! → "ADD_COLUMN"
  → 없으면 global keybindings 확인

Phase 2:
  dispatch({ type: "ADD_COLUMN" })
  → 일반적인 bubblePath resolution
```

**Phase 1도 bubblePath를 탈 수 있다.** 하지만 Phase 2와는 독립적이다.

---

## 7. 전체 실행 흐름

### 7.1 정상 흐름 — OS 기본 동작

```
User: ArrowDown in todo-list
  │
  ▼
[Sensor] KeyboardSensor.onKeyDown("ArrowDown")
  │
  ▼
[Phase 1: Key → Command]
  keybindingTable.resolve("down") → { type: "NAVIGATE", args: { direction: "down" } }
  │
  ▼
[Kernel] dispatch({ type: "NAVIGATE", payload: { direction: "down" } })
  │
  ▼
[Phase 2: Handler Resolution via bubblePath]
  bubblePath: ["todo-list", "__global__"]
  "todo-list" → scoped NAVIGATE handler? → 없음
  "__global__" → OS NAVIGATE handler? → 있음!
  │
  ▼
[Middleware: before]
  transaction snapshot 캡처
  │
  ▼
[Context Injection]
  inject("dom-items") → ["item-1", "item-2", "item-3"]
  inject("zone-config") → { navigate: { orientation: "vertical" } }
  │
  ▼
[Handler Execution]
  NAVIGATE.run(ctx, { direction: "down" })
  → { db: nextDb, focus: "item-2", scroll: "item-2" }
  │
  ▼
[Middleware: after]
  transaction 기록
  │
  ▼
[Effect Execution]
  fx("db") → store.setState(nextDb)
  fx("focus") → document.getElementById("item-2").focus()
  fx("scroll") → document.getElementById("item-2").scrollIntoView()
```

### 7.2 App Override 흐름 — App이 가로채기

```
User: Enter in kanban-card-list (onAction={EditCard} 바인딩됨)
  │
  ▼
[Phase 1: Key → Command]
  "enter" → { type: "ACTIVATE" }
  │
  ▼
[Kernel] dispatch({ type: "ACTIVATE" })
  │
  ▼
[Phase 2: Handler Resolution via bubblePath]
  bubblePath: ["card-list", "col-1", "kanban-board", "__global__"]

  "card-list" → scoped ACTIVATE handler? → 있음! (onAction 바인딩)
  │
  ▼
[Scoped Handler 실행]
  → { dispatch: EditCard({ id: focusedItemId }) }
  → bubble: false (기본) → 버블 중단
  │
  ▼
[Effect Execution]
  fx("dispatch") → dispatch(EditCard({ id: "card-3" }))
    │
    ▼
  [Kernel] dispatch({ type: "EDIT_CARD", payload: { id: "card-3" } })
    → __global__ → App EDIT_CARD handler → { db: nextDb, focus: "card-3-input" }
  │
  ▼
[OS의 기본 ACTIVATE는 실행되지 않음]
```

### 7.3 App Effect 사용 흐름 — App이 OS Effect 활용

```
User: Delete in todo-list
  │
  ▼
[Phase 1 → Phase 2]
  "delete" → ACTIVATE → scoped handler (onDelete 바인딩)
  │
  ▼
[Scoped Handler]
  → { dispatch: DeleteTodo({ id: focusedItemId }) }
  │
  ▼
[Kernel] dispatch({ type: "TODO_DELETE", payload: { id: "todo-5" } })
  │
  ▼
[Handler]
  TODO_DELETE.run(ctx, { id: "todo-5" })
  → {
      db: deleteTodo(ctx.db, "todo-5"),  // 상태에서 제거
      focus: "todo-6",                    // ← OS effect! 다음 아이템으로 포커스
      toast: "Deleted",                   // ← App effect
    }
  │
  ▼
[Effect Execution]
  fx("db") → 상태 업데이트
  fx("focus") → todo-6에 포커스
  fx("toast") → 토스트 표시
```

---

## 8. Kernel API 최종 설계

```typescript
// ═══════════════════════════════════════════
//  Kernel API — ~600 LOC, 0 dependencies
// ═══════════════════════════════════════════

// ── Event ──
dispatch(event: { type: string; payload?: unknown }): void

// ── Handler Registration ──
defineHandler(id: string, handler: (db: DB, payload: any) => DB): void
defineCommand(id: string, handler: (ctx: Ctx, payload: any) => EffectMap): void
defineCommand(id: string, interceptors: Interceptor[], handler): void
defineCommand(id: string, options: { scope: string }, handler): void

// ── Effect Registration ──
defineEffect(id: string, executor: (value: any) => void): void

// ── Context Injection ──
defineContext(id: string, provider: () => unknown): void
inject(id: string): Interceptor

// ── Scope (Bubble Hierarchy) ──
defineScope(id: string, config: { parent?: string }): void
removeScope(id: string): void
setActiveScope(id: string): void
getActiveScope(): string | null
buildBubblePath(from?: string): string[]

// ── Keybinding ──
defineKeybinding(binding: { key: string; command: string; args?: any; scope?: string; when?: string }): void
resolveKeybinding(key: string, context: ResolveContext): { command: string; args: any } | null

// ── Computed (Subscriptions) ──
defineComputed(id: string, extractor: (db: DB, args: any[]) => unknown): void
useComputed(query: [string, ...unknown[]]): unknown

// ── Middleware ──
use(middleware: Middleware): void

// ── Store ──
getDb(): DB
resetDb(db: DB): void

// ── React Binding ──
useDispatch(): (event: Event) => void
```

### Kernel 내부 구조

```
kernel/
├── dispatch.ts          // 이벤트 큐 + processQueue
├── registry.ts          // handler registry (global + scoped)
├── fx.ts                // effect registry + executeFx
├── context.ts           // defineContext + inject + resolve
├── scope.ts             // scope tree + bubblePath + activeScope
├── keybinding.ts        // key → command resolution
├── computed.ts          // subscription graph + caching
├── middleware.ts        // interceptor chain (before/after)
├── store.ts             // Zustand store wrapper (getDb/resetDb)
└── index.ts             // public API exports
```

---

## 9. Layer 간 의존 관계

```
              ┌─────────────────────┐
              │    Layer 3: App     │
              │  (TodoApp, Kanban)  │
              └────────┬────────────┘
                       │ imports
              ┌────────▼────────────┐
              │    Layer 2: OS      │
              │  (Zone, Item, etc.) │
              └────────┬────────────┘
                       │ imports
              ┌────────▼────────────┐
              │   Layer 1: Kernel   │
              │  (dispatch, etc.)   │
              └─────────────────────┘
```

**엄격한 단방향 의존:**

| From | To | 허용 |
|---|---|---|
| Kernel → OS | ❌ | Kernel은 OS를 모른다 |
| Kernel → App | ❌ | Kernel은 App을 모른다 |
| OS → Kernel | ✅ | OS는 Kernel API를 사용한다 |
| OS → App | ❌ | OS는 App을 모른다 |
| App → Kernel | ✅ | App은 defineCommand를 직접 사용할 수 있다 |
| App → OS | ✅ | App은 Zone, Item 등 primitive를 사용한다 |

**App → Kernel 직접 접근이 가능한 이유:**
App이 `defineCommand("TODO_TOGGLE", ...)` 같은 도메인 커맨드를 등록할 때
OS를 거칠 필요가 없다. Kernel에 직접 등록한다.

---

## 10. 현재 코드 → 3-Layer 매핑

### 10.1 현재 → Kernel로 이동

| 현재 위치 | 현재 이름 | Kernel 이름 |
|---|---|---|
| `CommandEngineStore.dispatch()` | dispatch | `dispatch` |
| `createCommandStore` | store factory | `kernel/store.ts` |
| `createCommandFactory` | command factory | `defineCommand` |
| `resolveKeybinding + bubblePath` | keybinding resolution | `resolveKeybinding` + `buildBubblePath` |
| `FocusData.parentId` + `getFocusPath` | zone hierarchy | `defineScope` + `buildBubblePath` |
| `resolveFocusMiddleware` | OS.FOCUS resolution | `middleware` |
| `historyMiddleware` | undo/redo | `middleware` |
| `navigationMiddleware` | app effect → zone state | `defineEffect("focus")` |
| `TransactionLog` | transaction recording | `middleware` (transaction interceptor) |

### 10.2 현재 → OS로 유지

| 현재 위치 | 역할 |
|---|---|
| `NAVIGATE`, `TAB`, `ACTIVATE`, `ESCAPE`, `SELECT` | OS 커맨드 (Kernel에 등록) |
| `FocusGroup`, `FocusItem` | OS primitive (React 컴포넌트) |
| `roleRegistry` | Zone role → config 매핑 |
| `classifyKeyboard` | 키 입력 분류 (COMMAND vs FIELD) |
| `useKeyboardEvents` | 키보드 센서 |
| `focusGroupStore` slices | Zone별 상태 (→ `db.os.focus.zones`로 이동) |

### 10.3 현재 → App으로 유지

| 현재 위치 | 역할 |
|---|---|
| `apps/todo/features/commands/*` | Todo 앱 커맨드 |
| `apps/kanban/features/commands/*` | Kanban 앱 커맨드 |
| `apps/todo/model/appState.ts` | Todo 상태 스키마 |
| `apps/kanban/model/appState.ts` | Kanban 상태 스키마 |
| `App.tsx` + `defineApplication` | 앱 등록 (→ Kernel registerApp) |

---

## 11. 마이그레이션 전략

### Phase 1: Kernel 추출 (기반 작업)

```
1. kernel/dispatch.ts — 이벤트 큐 + re-entrance guard
2. kernel/registry.ts — global + scoped handler registry
3. kernel/scope.ts — scope tree + bubblePath
4. kernel/fx.ts — effect registry + executeFx
5. kernel/context.ts — defineContext + inject
6. kernel/middleware.ts — interceptor chain
7. kernel/store.ts — Zustand wrapper
```

**검증:** 기존 OS 커맨드를 Kernel에 등록하고 동일하게 동작하는지 확인.

### Phase 2: OS를 Kernel 위로 재배치

```
1. OS 커맨드를 defineCommand로 등록
2. executeDOMEffect → defineEffect("focus"), defineEffect("scroll") 등
3. buildContext → defineContext("dom-items"), defineContext("zone-config") 등
4. FocusGroup이 defineScope를 사용하도록 변경
5. resolveKeybinding을 Kernel 함수로 대체
```

### Phase 3: App을 Kernel + OS 위로 재배치

```
1. 앱 커맨드를 defineCommand로 등록
2. AppCommand의 scoped handler 등록 (Zone onAction → defineScopedHandler)
3. App effect를 defineEffect로 등록
4. App state를 db.app에 통합
```

### Phase 4: 상태 통합

```
1. FocusData + Zone스토어×N → db.os.focus
2. CommandEngineStore → db.app (또는 Kernel registry)
3. WeakMap 기반 zone data → db.scopes + zone registry
4. defineComputed + useComputed 도입
```

---

## 12. 열린 질문

### Q1: scope별 keybinding이 정말 필요한가?

현재: 모든 keybinding이 global이고, Zone binding(onAction 등)으로 커맨드를 오버라이드.
제안: 대부분의 경우 이 모델이면 충분하다. scope keybinding은 Phase 2 이후에 필요하면 추가.

### Q2: App state를 db에 넣을 것인가, 별도 스토어로 둘 것인가?

**옵션 A: db.app에 통합**
- 장점: 하나의 스냅샷으로 전체 상태 캡처. 리플레이 완전.
- 단점: 앱 독립성 약화. 앱 교체 시 db 구조 변경.

**옵션 B: 앱별 별도 스토어, Kernel은 dispatch만 라우팅**
- 장점: 앱 독립성 최대. 현재 구조 유지.
- 단점: 트랜잭션 로그에 앱 상태 포함 어려움.

**현재 추천: 옵션 B에서 시작, 필요하면 A로 전환.**
01 제안서에서 제기한 "단일 db" 이상은 유지하되, 실용적으로 앱 스토어를 먼저 분리.

### Q3: bubble: true (계속 전파)가 실제로 필요한가?

대부분의 경우 App은 OS 기본 동작을 **대체**한다.
"OS 동작도 하고, App 동작도 하고" 패턴이 실제로 얼마나 쓰이는지 검증 필요.
→ 1차에서는 **대체만 지원**, bubble: true는 나중에 필요하면 추가.

### Q4: 한 이벤트가 여러 EffectMap을 반환하면?

bubblePath를 따라 여러 핸들러가 실행되면 (bubble: true), EffectMap을 merge해야 한다.
→ 이것도 Q3과 연결. 1차에서는 "첫 매칭 핸들러가 유일한 처리자" 단순 모델로 시작.

---

## 13. 요약

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: App                                           │
│                                                         │
│  defineCommand("TODO_TOGGLE", handler)                  │
│  <Zone onAction={ToggleDone({ id: OS.FOCUS })}>         │
│  → 도메인 커맨드를 Kernel에 등록                         │
│  → OS primitive에 바인딩 (scoped handler로 변환)         │
├─────────────────────────────────────────────────────────┤
│  Layer 2: OS                                            │
│                                                         │
│  defineCommand("NAVIGATE", handler)                     │
│  defineEffect("focus", executor)                        │
│  defineContext("dom-items", provider)                    │
│  defineScope(zoneId, { parent })                        │
│  → 포커스/탐색/접근성을 Kernel 위에 구축                  │
│  → Zone, Item, Field 등 primitive 제공                  │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Kernel                                        │
│                                                         │
│  dispatch ──→ bubblePath ──→ handler ──→ EffectMap      │
│  scope tree + handler registry + effect registry        │
│  middleware chain + computed cache + event queue         │
│  → "이벤트가 계층을 따라 전파되고 처리되는" 범용 엔진    │
│  → ~600 LOC, 0 dependencies, OS가 뭔지 모른다           │
└─────────────────────────────────────────────────────────┘
```

**01 제안서와의 차이:**

| 01 제안서 | 이 제안서 |
|---|---|
| Kernel + OS를 하나의 "코어"로 설계 | Kernel / OS를 명확히 분리 |
| flat dispatch (re-frame 동일) | **bubbling dispatch** (scope 계층) |
| Zone은 OS 내부 구현 | Zone = Kernel Scope의 OS 활용 |
| App override는 별도 메커니즘 | **scoped handler로 통합** |
| passthrough 패턴 필요 | passthrough 불필요 (자연스러운 bubbling) |
| keybinding + command 해석 결합 | **Phase 1 (key→cmd) + Phase 2 (cmd→handler) 분리** |
