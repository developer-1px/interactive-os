# Scope & Bubbling — Kernel의 계층적 커맨드 해석

> 날짜: 2026-02-09
> 태그: kernel, scope, bubbling, dispatch
> 상태: Draft
> 선행 문서: 01-[re-frame] 제안서, 05-[architecture] 3-Layer 제안서, 06-[naming] 용어 통일

---

## 0. 요약

re-frame은 **flat dispatch**다. `dispatch(event)` → `registry.get(type)` → 실행. 끝.
우리는 **계층적 dispatch**가 필요하다. DOM 이벤트 버블링처럼 커맨드가 scope 계층을 따라 전파되고, 가장 가까운 핸들러가 처리한다.

이 문서는 Kernel에 Scope와 Bubbling을 도입하는 제안서다.

---

## 1. 왜 Scope가 필요한가

### 1.1 문제: "같은 키, 다른 동작"

Enter 키를 누르면 무슨 일이 일어나는가?

```
Kanban Board
  └─ Column "col-1"
       └─ Card List "card-list"    ← 포커스가 여기 있다
            └─ Card "card-3"       ← focused item
```

- `card-list`에 `onAction`이 바인딩되어 있으면 → **카드 편집 시작**
- 바인딩이 없으면 → **OS 기본 ACTIVATE** (click 시뮬레이션)

이것은 단순한 "핸들러가 있다/없다"의 문제가 아니다.
**"누가 처리하는가"가 포커스 위치(= scope 계층)에 따라 달라지는 것**이다.

### 1.2 문제: 현재 코드의 이중 경로

현재 코드는 이 문제를 **두 갈래로 나눠서** 해결하고 있다:

```
경로 1 — passthrough 커맨드 (COPY, DELETE, UNDO):
  resolveKeybinding()
    → hasZoneBinding("copyCommand") 확인
    → 있으면 Zone 바인딩 커맨드 dispatch
    → 없으면 키바인딩 자체가 매칭 안 됨 (무시)

경로 2 — OS 커맨드 (ACTIVATE, SELECT):
  OS ACTIVATE.run()
    → ctx.activateCommand가 있으면 dispatch (App 커맨드)
    → 없으면 OS 기본 동작
```

**두 경로 모두 같은 문제를 해결한다: "이 커맨드를 누가 처리하는가?"**
하지만 메커니즘이 다르다. passthrough는 키바인딩 해석 단계에서, OS 커맨드는 핸들러 실행 단계에서.

### 1.3 문제: 확장 불가능

App이 새로운 커맨드 오버라이드를 추가하려면?

```tsx
// 현재: Zone이 인식하는 prop이 있어야 한다
<Zone onAction={...} onCopy={...} onDelete={...}>

// "onDuplicate"를 추가하려면?
// → Zone 컴포넌트에 prop 추가
// → resolveKeybinding에 hasZoneBinding 분기 추가
// → 매번 OS 레이어 수정이 필요하다
```

Zone 컴포넌트가 모든 가능한 오버라이드를 미리 알아야 한다.
**App이 OS 동작을 바꾸려면 OS를 수정해야 한다. 이것은 레이어 위반이다.**

### 1.4 해결: Scope + Bubbling

```
dispatch({ type: "ACTIVATE" })
  │
  ▼
Kernel이 scope 계층을 순회:
  ["card-list", "col-1", "kanban-board", "__global__"]
  │
  ├─ "card-list" → scoped handler? → 있음! → App이 등록한 핸들러 → 실행 → 끝
  │
  └─ (없었다면) "__global__" → OS 기본 ACTIVATE → 실행
```

- 하나의 메커니즘 (scope 순회)
- Zone이 prop을 미리 알 필요 없음
- App은 원하는 커맨드를 원하는 scope에 자유롭게 등록
- OS 레이어 수정 불필요

---

## 2. re-frame과 왜 달라야 하는가

### 2.1 re-frame의 모델: Flat Registry

```clojure
;; re-frame — 하나의 전역 핸들러 테이블
(reg-event-fx :navigate handler-fn)
(reg-event-fx :activate handler-fn)

;; dispatch → 전역 테이블에서 lookup → 실행
(dispatch [:activate])
;; → registry["activate"] → handler-fn → 끝
```

re-frame에서 **모든 핸들러는 전역**이다. scope 개념이 없다.
같은 `:activate`를 다른 컨텍스트에서 다르게 처리하고 싶으면?

```clojure
;; re-frame의 해법: 핸들러 안에서 if/else
(reg-event-fx :activate
  (fn [{:keys [db]} _]
    (let [zone (get-active-zone db)]
      (cond
        (= (:role zone) :kanban-card) (edit-card db zone)
        (= (:role zone) :todo-item)   (toggle-done db zone)
        :else                         (default-activate db zone)))))
```

**핸들러가 모든 Zone의 동작을 알아야 한다.**
새로운 앱이 추가될 때마다 이 핸들러를 수정해야 한다.

### 2.2 우리의 모델: Scoped Registry + Bubbling

```typescript
// Kernel — 계층적 핸들러 테이블
defineCommand("ACTIVATE", osDefaultHandler);                            // __global__
defineCommand("ACTIVATE", { scope: "card-list" }, editCardHandler);     // card-list scope
defineCommand("ACTIVATE", { scope: "todo-list" }, toggleDoneHandler);   // todo-list scope

// dispatch → scope 계층 순회 → 가장 가까운 핸들러 실행
dispatch({ type: "ACTIVATE" });
// activeScope = "card-list"
// bubblePath = ["card-list", "col-1", "board", "__global__"]
// → "card-list"에 핸들러 있음 → editCardHandler 실행 → 끝
```

### 2.3 근본적 차이

| | re-frame | 우리 |
|---|---|---|
| **핸들러 해석** | Flat — `registry[type]` | 계층적 — `registry[scope][type]` |
| **다른 동작** | 핸들러 내부 분기 | scope별 핸들러 등록 |
| **확장** | 핸들러 수정 | scope에 핸들러 추가 (기존 코드 불변) |
| **비유** | 함수 하나가 모든 케이스 처리 | DOM 이벤트 버블링 |

### 2.4 왜 이 차이가 불가피한가

re-frame이 만들어진 환경:

- **SPA**: 하나의 앱, 하나의 상태
- **Flat UI**: 대부분 리스트/폼, 중첩 composite widget이 드물다
- **개발자 = 핸들러 작성자**: 모든 케이스를 한 곳에서 관리 가능

우리의 환경:

- **멀티 앱**: Todo, Kanban, 설정 등이 공존
- **중첩 Zone**: Board > Column > CardList > Card — 4단계 이상의 계층
- **OS/App 분리**: OS 개발자 ≠ App 개발자. App이 OS를 몰라도 동작을 바꿀 수 있어야 한다
- **W3C ARIA composite widget**: listbox > option, tree > treeitem, grid > row > cell — spec 자체가 계층적

**계층적 UI에서 flat dispatch는 결국 핸들러 내부에 계층 로직을 숨기게 된다.**
그 숨겨진 로직을 프레임워크 레벨로 끌어올린 것이 Scope + Bubbling이다.

---

## 3. 설계

### 3.1 핵심 개념

```
Scope: Kernel의 계층 단위. 트리를 형성한다.
Zone:  OS가 Scope를 포커스 목적으로 사용한 것. Zone = Scope의 OS 활용.

Kernel은 "포커스"를 모른다. "Scope 계층이 있고, 커맨드가 이 계층을 따라 해석된다"는 것만 안다.
```

### 3.2 Scope Tree

```
__global__                    ← 항상 존재하는 루트
  ├─ "app-shell"
  │    ├─ "sidebar"
  │    └─ "main-content"
  │         ├─ "todo-list"
  │         └─ "kanban-board"
  │              ├─ "col-1"
  │              │    └─ "card-list-1"
  │              └─ "col-2"
  │                   └─ "card-list-2"
  └─ "command-palette"        ← 모달: 별도 서브트리
```

### 3.3 Bubble Path

activeScope가 `"card-list-1"`일 때:

```
buildBubblePath("card-list-1")
→ ["card-list-1", "col-1", "kanban-board", "main-content", "app-shell", "__global__"]
```

**가장 가까운 scope부터 루트까지.** DOM 이벤트 버블링과 동일한 방향.

### 3.4 Handler Resolution

```
dispatch({ type: "ACTIVATE" })

1. activeScope → "card-list-1"
2. bubblePath → ["card-list-1", "col-1", "kanban-board", ..., "__global__"]
3. 순회:
   "card-list-1" → scopeHandlers["card-list-1"]["ACTIVATE"]? → 있음! → 실행
   → EffectMap 반환 → bubble: false (기본) → 중단

   (없었다면)
   "col-1" → scopeHandlers["col-1"]["ACTIVATE"]? → 없음 → 계속
   ...
   "__global__" → globalHandlers["ACTIVATE"] → OS 기본 핸들러 → 실행
```

### 3.5 버블 제어

| 반환값 | 의미 |
|---|---|
| `null` | 이 scope 패스. 다음 scope로 계속 버블 |
| `EffectMap` | 처리됨. 버블 중단 (기본) |
| `EffectMap` + `bubble: true` | 처리하고도 다음 scope로 계속 전파 |
| `{}` (빈 EffectMap) | 소비만 하고 아무것도 안 함. 버블 중단 |

---

## 4. API

### 4.1 Scope 관리

```typescript
// Scope 등록 (OS: FocusGroup 마운트 시 호출)
defineScope("todo-list", { parent: "main-content" });
defineScope("card-list-1", { parent: "col-1" });

// Scope 제거 (OS: FocusGroup 언마운트 시 호출)
removeScope("card-list-1");

// Active scope 설정 (OS: 포커스 이동 시 호출)
setActiveScope("card-list-1");

// Active scope 읽기
getActiveScope();  // → "card-list-1"

// Bubble path 계산
buildBubblePath("card-list-1");
// → ["card-list-1", "col-1", "kanban-board", "main-content", "app-shell", "__global__"]
```

### 4.2 Scoped Handler 등록

```typescript
// 글로벌 핸들러 — __global__ scope에 등록
// OS 기본 동작. 어떤 scope에서도 핸들러를 못 찾으면 여기로 온다.
defineCommand("ACTIVATE", (ctx, payload) => {
  const el = document.getElementById(ctx.state.focus.focusedItemId);
  el?.click();
  return {};
});

// Scoped 핸들러 — 특정 scope에만 적용
// App이 OS 동작을 오버라이드한다.
defineCommand("ACTIVATE", { scope: "todo-list" }, (ctx, payload) => {
  return {
    state: toggleDone(ctx.state, ctx.state.focus.focusedItemId),
  };
});

defineCommand("ACTIVATE", { scope: "card-list-1" }, (ctx, payload) => {
  return {
    dispatch: { type: "EDIT_CARD", payload: { id: ctx.state.focus.focusedItemId } },
  };
});
```

### 4.3 동적 Scoped Handler (Zone 마운트 시)

```tsx
// App 개발자가 Zone에 onAction을 바인딩하면:
<Zone id="todo-list" onAction={ToggleDone({ id: OS.FOCUS })}>
  <Item id="todo-1">Buy milk</Item>
</Zone>

// OS 내부에서 FocusGroup이 마운트될 때:
function FocusGroup({ id, onAction }) {
  useEffect(() => {
    defineScope(id, { parent: parentId });

    if (onAction) {
      defineCommand("ACTIVATE", { scope: id }, (ctx, payload) => ({
        dispatch: onAction,
      }));
    }

    return () => {
      removeScope(id);
      removeScopedCommand("ACTIVATE", id);
    };
  }, [id, onAction, parentId]);
}
```

### 4.4 App Override 패턴 3가지

**패턴 A: 대체 (Replace)** — OS 기본 동작 대신 App 동작

```typescript
// "Enter 누르면 Todo 완료 토글"
defineCommand("ACTIVATE", { scope: "todo-list" }, (ctx, payload) => ({
  state: toggleDone(ctx.state, payload.targetId),
}));
// bubble: false (기본) → OS ACTIVATE 실행 안 됨
```

**패턴 B: 확장 (Extend)** — OS 기본 동작 + App 추가 동작

```typescript
// "Enter 누르면 OS activate도 하고, analytics도 보내"
defineCommand("ACTIVATE", { scope: "card-list" }, (ctx, payload) => ({
  dispatch: { type: "TRACK_ACTIVATION", payload: { id: payload.targetId } },
  bubble: true,  // OS ACTIVATE도 실행
}));
```

**패턴 C: 조건부 가로채기 (Conditional)**

```typescript
// "편집 중일 때 Enter는 submit, 아닐 때는 OS 기본"
defineCommand("ACTIVATE", { scope: "card-list" }, (ctx, payload) => {
  if (ctx.state.app.kanban.editingCardId) {
    return { dispatch: { type: "SUBMIT_EDIT" } };  // 가로채기
  }
  return null;  // 패스 → 다음 scope로 버블 → 결국 OS 기본
});
```

### 4.5 Passthrough 커맨드가 사라지는 이유

현재:
```
Cmd+C → resolveKeybinding → hasZoneBinding("copyCommand")?
  → 있음 → Zone의 copyCommand dispatch
  → 없음 → 키바인딩 매칭 실패 (아무 일도 안 일어남)
```

제안:
```
Cmd+C → Phase 1: key → "COPY"
     → Phase 2: dispatch({ type: "COPY" })
     → bubblePath 순회
       → "card-list"에 COPY scoped handler? → 있음! → CopyCard 실행
       → (없으면) "__global__" → OS 기본 COPY (클립보드?) or 무시
```

**Zone이 `onCopy` prop을 가질 필요가 없다.** App이 scope에 직접 등록한다.

---

## 5. Dispatch 흐름 — Before vs After

### Before (현재: Flat)

```
dispatch(cmd)
  → registry.get(cmd.type)     ← Flat lookup. 하나의 핸들러.
  → handler(ctx, payload)
  → EffectMap
  → executeEffects
```

### After (제안: Scoped)

```
dispatch(cmd)
  │
  ├─ 1. activeScope 확인
  │     → "card-list-1"
  │
  ├─ 2. bubblePath 계산
  │     → ["card-list-1", "col-1", "kanban-board", ..., "__global__"]
  │
  ├─ 3. scope 순회하며 핸들러 탐색
  │     for (const scope of bubblePath) {
  │       const handler = scopeHandlers[scope]?.[cmd.type]
  │                    ?? (scope === "__global__" ? globalHandlers[cmd.type] : null);
  │       if (!handler) continue;
  │
  │       const result = handler(ctx, payload);
  │       if (result === null) continue;      // 패스
  │       effectMaps.push(result);
  │       if (!result.bubble) break;          // 버블 중단
  │     }
  │
  ├─ 4. Middleware (before/after) — 기존과 동일
  │
  ├─ 5. EffectMap 실행
  │
  └─ 6. Transaction 기록
```

---

## 6. 키바인딩과 버블링의 분리

### Phase 1: Key → Command (Flat)

```
KeyDown "Enter"
  → keybindingTable.resolve("enter")
  → { type: "ACTIVATE" }
```

키바인딩 해석은 **flat**이다. scope와 무관하게 "이 키가 어떤 커맨드인가"만 결정한다.

### Phase 2: Command → Handler (Scoped)

```
dispatch({ type: "ACTIVATE" })
  → bubblePath 순회
  → scoped handler resolution
```

커맨드 해석은 **scoped**다. "이 커맨드를 누가 처리하는가"를 scope 계층에서 결정한다.

**현재 문제:** `resolveKeybinding()`이 Phase 1과 Phase 2를 동시에 수행한다.
`hasZoneBinding` 체크가 키바인딩 해석에 섞여 있다.

**제안:** Phase 1은 순수한 key→command 매핑. Phase 2는 Kernel이 담당.

---

## 7. 현재 코드와의 매핑

### 7.1 현재 구현 → Scope로 대체

| 현재 | Scope 모델 |
|---|---|
| `FocusGroup.onAction` prop | `defineCommand("ACTIVATE", { scope: zoneId }, ...)` |
| `FocusGroup.onCopy` prop | `defineCommand("COPY", { scope: zoneId }, ...)` |
| `hasZoneBinding()` 체크 | 불필요 — bubblePath가 해결 |
| `resolveKeybinding` 내 zone 탐색 | Phase 2 bubbling으로 이동 |
| `ctx.activateCommand` | 불필요 — scoped handler가 대체 |
| `buildBubblePath.ts` (os-new) | Kernel `buildBubblePath()`로 이동 |

### 7.2 Kernel 변경 범위

```
packages/kernel/src/
├── scope.ts         ← 신규: Scope tree + bubblePath
├── dispatch.ts      ← 수정: flat lookup → scoped resolution
├── registry.ts      ← 수정: scoped handler 저장소 추가
├── middleware.ts     ← 변경 없음
├── context.ts       ← 변경 없음
└── index.ts         ← 수정: 새 API export
```

---

## 8. 열린 질문

### Q1. Scope 핸들러도 per-command interceptor를 가질 수 있는가?

```typescript
// 글로벌 핸들러의 interceptor는 이미 지원
defineCommand("NAVIGATE", handler, [inject("dom-items")]);

// Scoped 핸들러에도?
defineCommand("NAVIGATE", { scope: "card-list" }, handler, [inject("card-data")]);
```

→ 1차에서는 **글로벌 핸들러의 interceptor만 지원**. Scoped 핸들러는 ctx에서 필요한 것을 직접 읽는다.
→ 필요하면 나중에 추가.

### Q2. bubble: true일 때 여러 EffectMap을 어떻게 merge하는가?

→ 1차에서는 **bubble: true 미지원**. "첫 매칭 핸들러가 유일한 처리자" 단순 모델로 시작.
→ 실제로 "OS 동작도 하고, App 동작도 하고" 패턴이 얼마나 필요한지 검증 후 결정.

### Q3. Scope별 keybinding이 필요한가?

```typescript
// 특정 scope에서만 동작하는 키바인딩
defineKeybinding({ key: "cmd+n", command: "ADD_COLUMN", scope: "kanban-board" });
```

→ 대부분의 경우 **글로벌 keybinding + scoped handler**로 충분.
→ scope keybinding은 Phase 2 이후 필요하면 추가.

---

## 9. 요약

```
re-frame:
  dispatch → registry[type] → handler → effects
  (Flat. 핸들러 안에서 분기.)

우리:
  dispatch → bubblePath → registry[scope][type] → handler → effects
  (계층적. 프레임워크가 해석.)

      ┌──────────────────────────────────────────────────┐
      │  "같은 커맨드, 다른 scope, 다른 핸들러"            │
      │  를 프레임워크 레벨에서 해결하는 것이 Scope다.      │
      └──────────────────────────────────────────────────┘
```

**Scope가 해결하는 것:**
1. 이중 경로 (passthrough vs OS 커맨드) → **하나의 bubbling 메커니즘**
2. Zone prop 폭발 (onAction, onCopy, ...) → **App이 scope에 직접 등록**
3. 핸들러 내부 분기 → **scope별 핸들러 분리**
4. OS 레이어 수정 없는 App 확장 → **레이어 독립성 확보**
