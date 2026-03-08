# Blueprint: ZIFT Props Spread Redesign

> 생성일: 2026-03-09 00:45
> 기원: /discussion → /conflict → /redteam → /blueprint
> 관련: `docs/0-inbox/2026-0308-2345-[blueprint]-zone-initial-state-ownership.md` (선행)
> 관련: `docs/0-inbox/2026-0309-0015-[audit]-react-effect-hooks-census.md` (전수 조사)

## 1. Goal

**ZIFT(Zone, Item, Field, Trigger)의 React projection을 최소화하여, headless가 canonical이고 React는 props를 DOM에 붙이기만 하는 구조로 전환한다.**

UDE (Undesirable Effects):
- U1. `<Item>` 컴포넌트가 180줄 — 실제 역할은 attrs spread + el.focus() + re-render trigger
- U2. bind()가 headless 등록과 React 컴포넌트 생성을 동시 수행 — 이중 책임
- U3. Item.tsx의 per-item bitmask 구독이 React 없이는 불가능 — headless와 React가 영원히 별도 추상화
- U4. `<Zone>` 컴포넌트의 useLayoutEffect가 초기 상태를 설정 — renderToString에서 미실행 (별도 blueprint)
- U5. LLM이 `<Item>`, `<Zone>` 컴포넌트 패턴을 보고 React-first로 회귀

Done Criteria:
- [ ] `zone.item(id)` — 순수 함수로 attrs 반환, React 컴포넌트 불필요
- [ ] `zone.container` — props 객체로 Zone attrs 반환
- [ ] `<zone.Field>` — 컴포넌트 유지 (DOM 생명주기)
- [ ] navigate command가 `focus: targetId` effect 반환 → 5-effect가 DOM focus 주 경로
- [ ] 기존 전체 테스트 regression 0
- [ ] tsc 0

## 2. Why

### Phase 2 원칙 ("Headless-first") 미완성

```
Phase 2 약속: headless가 canonical, React는 projection
현실: Item.tsx가 DOM focus의 주 경로 — headless 없이는 focus가 동작하지 않음
```

rules.md 위반:
1. **"100% Observable"** — Item의 DOM focus 동기화가 headless에서 재현 불가능
2. **"Pit of Success"** — `<Item>` 컴포넌트가 있으면 LLM이 React 컴포넌트를 만드는 경로가 열림

근본 원인: DOM focus의 주 경로(el.focus())가 **React useLayoutEffect**에 묶여 있어서, 5-effect로 이전하지 않는 한 React 컴포넌트를 제거할 수 없다.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| A1. "Item에서 per-item 구독이 필요하다" | 부분적 — **CSS 선택자**(`[aria-selected]`, `[data-focused]`)로 스타일링 가능. JS 구독은 조건부 렌더링 시에만 필요 | Zone-level 구독 + CSS 속성 선택자 |
| A2. "el.focus()는 Item 컴포넌트에서 해야 한다" | **거짓** — 5-effect가 이미 focus handler를 갖고 있음. navigate command가 focus effect를 반환하도록 수정하면 Item 불필요 | navigate → `{ focus: targetId }` effect 추가 |
| A3. "브라우저가 알아서 focus를 준다" | **거짓** — roving tabindex에서 Arrow 네비게이션은 반드시 el.focus() 필요 (Tab 진입 시에만 자동) | 5-effect가 모든 focus를 담당 |
| A4. "zone.item(id) 순수 함수면 attrs가 stale된다" | **맞음** — 하지만 Zone-level 구독이 focus 변경 시 리스트를 re-render하면 해결. VDOM diffing이 실제 DOM 변경을 최소화 | `useZone()` hook이 zone state 구독 |
| A5. "virtualFocus 모드에서 :focus-visible이 안 된다" | **맞음** — container에만 :focus가 걸림. 아이템 시각적 focus는 `[data-focused]` CSS 필수 | computeItem이 이미 `data-focused` 반환 |

**진짜 Goal**: navigate command → focus effect 반환. 이 한 가지 변경이 Item.tsx의 핵심 존재 이유를 제거한다.

## 4. Ideal

```tsx
// ── 앱 개발자 Usage (After) ──

const app = defineApp("todo", initialState);
const zone = app.createZone("todos");

// Zone: bind()가 config + hook 반환
const todos = zone.bind({
  role: "listbox",
  getItems: () => state.todos.map(t => t.id),
  onAction: (cursor) => toggleTodo({ id: cursor }),
});

// 사용: React 컴포넌트 최소화
function TodoList() {
  const zoneState = todos.useZone(); // Zone-level 구독 (1개)

  return (
    <div {...todos.container}>
      {state.todos.map(todo => (
        <TodoItem key={todo.id} id={todo.id} todo={todo} zone={todos} />
      ))}
    </div>
  );
}

function TodoItem({ id, todo, zone }) {
  // 순수 함수 — 호출 시점의 OS 상태에서 attrs 계산
  // 부모(TodoList)가 zoneState 구독으로 re-render → 자식도 re-render → 최신 attrs
  const attrs = zone.item(id);

  return (
    <div {...attrs}>
      {todo.title}
      <button {...zone.trigger("remove", () => removeTodo({ id }))}>
        Delete
      </button>
    </div>
  );
}

// 스타일: CSS 선택자
// [data-focused] { outline: 2px solid blue; }
// [aria-selected="true"] { background: rgb(59 130 246 / 0.1); }

// 조건부 렌더링이 필요할 때:
function TodoItemWithToolbar({ id, todo, zone }) {
  const [attrs, itemState] = zone.useItem(id); // per-item hook (선택적)
  return (
    <div {...attrs}>
      {todo.title}
      {itemState.isFocused && <FloatingToolbar />}
    </div>
  );
}

// Field: 컴포넌트 유지 (DOM 생명주기)
<todos.Field name="draft" value={draft} mode="immediate" />
```

Negative Branch:
- NBR1: Zone-level 구독은 focus 이동마다 전체 리스트 re-render → 1000+ 아이템에서 성능 문제
  → 해소: `zone.useItem(id)` per-item hook을 **선택적으로** 제공. 대다수 앱은 zone-level로 충분
- NBR2: zone.item(id) 순수 함수는 zone-level re-render 없이는 stale
  → 해소: `todos.useZone()`이 필수. 이것 없이 zone.item() 호출은 경고/에러
- NBR3: el.focus()를 5-effect로 옮기면 React commit phase 전에 focus가 일어날 수 있음
  → 해소: effect는 command dispatch 직후 동기 실행 — React re-render 전이지만 DOM은 이미 존재 (이전 render의 DOM)

## 5. Inputs

| 입력 | 위치 | 역할 |
|------|------|------|
| computeItem() | `packages/os-core/src/3-inject/compute.ts:45` | 순수 함수 — attrs + state 계산 (이미 존재) |
| navigate command | `packages/os-core/src/4-command/navigate/index.ts:223` | 현재 `scroll:` effect만 반환 — `focus:` 추가 필요 |
| 5-effect focus handler | `packages/os-core/src/5-effect/index.ts:22` | 이미 존재 — 현재 fallback, 주 경로로 승격 필요 |
| findItemElement() | `packages/os-core/src/3-inject/itemQueries.ts:24` | zone-scoped DOM 탐색 (이미 존재) |
| Item.tsx | `packages/os-react/src/6-project/Item.tsx` | 180줄 — 제거 대상 |
| Zone.tsx | `packages/os-react/src/6-project/Zone.tsx` | 286줄 — 초기 상태 블록 제거 (별도 blueprint) |
| bind.ts | `packages/os-sdk/src/app/defineApp/bind.ts` | createBoundComponents — 새 API로 교체 |
| types.ts | `packages/os-sdk/src/app/defineApp/types.ts` | BoundComponents 타입 — 새 타입으로 교체 |
| Zone Initial State Blueprint | `docs/0-inbox/2026-0308-2345-[blueprint]-zone-initial-state-ownership.md` | 선행 작업 (onRegister hook) |
| React Effect Census | `docs/0-inbox/2026-0309-0015-[audit]-react-effect-hooks-census.md` | 29건 전수 조사 결과 |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | navigate가 focus effect 반환 | navigate가 scroll만 반환 | **navigate command에 `focus: targetId` effect 추가** | 🔴 Critical — 이것 없이는 Item 제거 불가 | — |
| G2 | 5-effect가 focus 주 경로 | 5-effect는 fallback만 | G1 완료 시 **자동 승격** | 🔴 Critical | G1 |
| G3 | `zone.item(id)` 순수 함수 API | `<Item>` React 컴포넌트 | **bind()가 item() 함수 반환하도록 변경** | High | G2 |
| G4 | `zone.container` props 객체 | `<Zone>` React 컴포넌트 | **bind()가 container props 반환** | High | G6 |
| G5 | `zone.useZone()` hook | Item 개별 구독 | **Zone-level useSyncExternalStore 구독** | High | G3 |
| G6 | Zone 초기 상태 onRegister hook | useLayoutEffect에서 os.setState | **별도 blueprint (T1-T7)** — 선행 작업 | High | — |
| G7 | `zone.useItem(id)` per-item hook (선택적) | Item 컴포넌트 강제 | **per-item useSyncExternalStore** — 대규모 리스트용 | Med | G3 |
| G8 | focus 외 OS command도 effect 반환 검토 | 일부 command만 effect 사용 | **OS_FOCUS, OS_TAB 등 focus 관련 command 전수 검토** | Med | G1 |
| G9 | 기존 앱/테스트 마이그레이션 | `<UI.Item>`, `<UI.Zone>` 사용 중 (16+ 파일) | **점진적 마이그레이션 — 호환 레이어** | Med | G3, G4 |
| G10 | Field 컴포넌트 유지 확인 | 현행 Field.tsx | **변경 없음 — DOM 생명주기 필수** | Low | — |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T0 | Zone 초기 상태 onRegister hook | Clear | — | **별도 blueprint 실행** (선행). Zone.tsx useLayoutEffect에서 초기 상태 제거 |
| T1 | navigate command → focus effect | Clear | — | `navigate/index.ts`에서 `scroll: targetId` 옆에 `focus: targetId` 추가. 5-effect가 주 경로로 승격 |
| T2 | focus 관련 command 전수 검토 | Complicated | T1 | OS_FOCUS, OS_TAB, OS_EXPAND 등에서 focus effect 반환 필요한 곳 식별 + 추가 |
| T3 | Item.tsx useLayoutEffect 제거 확인 | Clear | T1, T2 | T1-T2 완료 후 Item.tsx:114-121의 el.focus() useLayoutEffect가 **dead code**인지 확인. 제거 |
| T4 | `zone.useItem(id)` per-item hook (기본 API) | Clear | T3 | bind()가 `useItem(id): ItemAttrs` hook 반환. 내부: `useSyncExternalStore` + `computeItem()`. per-item 구독으로 변경된 아이템만 re-render |
| T5 | `zone.container` props 객체 | Clear | T0 | bind()가 `container: ContainerProps` 반환. 내부: `computeContainerProps()` |
| T6 | `zone.item(id)` 순수 함수 (유틸) | Clear | T4 | headless 테스트/정적 리스트용. `computeItem(os, id, zoneId).attrs` 직접 호출 wrapper |
| T7 | 호환 레이어 | Clear | T4, T5 | `<UI.Zone>`, `<UI.Item>`을 내부적으로 새 API 호출하는 wrapper로 유지. 기존 코드 깨지지 않음 |
| T8 | 앱/테스트 마이그레이션 | Clear | T7 | 16+ 파일을 점진적으로 새 API로 전환. 호환 레이어 덕에 긴급하지 않음 |
| T9 | 검증 — tsc 0 + 전체 테스트 | Clear | T1~T8 | regression 0 확인 |

### 의존 그래프

```
T0 (onRegister hook) ──────────────────→ T5 (container props)
                                          │
T1 (navigate→focus) ──→ T2 (전수 검토)    │
                         │                │
                         ↓                │
                     T3 (Item effect 제거) │
                         │                │
                         ↓                ↓
                     T4 (zone.item) ──→ T6 (useZone)
                         │            ──→ T7 (useItem)
                         │            ──→ T8 (호환 레이어)
                         │                │
                         ↓                ↓
                                      T9 (마이그레이션)
                                          │
                                          ↓
                                      T10 (검증)
```

### Critical Path

**T1 → T2 → T3 → T4** — navigate command에 focus effect를 추가하는 것이 전체 전환의 선행 조건. 이것 없이는 Item.tsx 제거 불가.

### 병렬 가능

- T0(onRegister hook)과 T1(navigate focus)은 **독립 — 병렬 실행 가능**
- T6, T7, T8은 T4 완료 후 **병렬 실행 가능**

## 라우팅

승인 후 → /project (새 프로젝트) — os-core 도메인, `zift-props-spread` 프로젝트
