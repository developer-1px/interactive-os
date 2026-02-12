# createModule 실현 가능성 진단

| 항목 | 내용 |
|------|------|
| 원문 | 가능할까? 고민을 해봐 |
| 내(AI)가 추정한 의도 | createModule이 기존 커널 위에서 실현 가능한지 기술적으로 검증하고 싶다 |

---

## 1. 개요

`createModule` = RTK의 범위(all-in-one) + Zustand의 간결함 (define 콜백). 현재 `registerAppSlice`의 진화형. 기술적 실현 가능성을 코드 레벨에서 진단한다.

---

## 2. 현재 registerAppSlice가 이미 하는 것

```
registerAppSlice("todo", { initialState, persistence, history })
```

내부에서 일어나는 일 (appSlice.ts L82–173):

| 단계 | 코드 | 설명 |
|------|------|------|
| 1 | `defineScope(appId)` | 스코프 토큰 생성 |
| 2 | `hydrateState()` | persistence에서 상태 복원 |
| 3 | `kernel.setState()` | 커널 트리에 `state.apps[appId]` 초기화 |
| 4 | `kernel.group({ scope, stateSlice })` | state lens로 격리된 그룹 생성 |
| 5 | `appGroup.defineContext()` | AppState 컨텍스트 토큰 생성 |
| 6 | `kernel.use(persistenceMiddleware)` | persistence 미들웨어 등록 |
| 7 | `kernel.use(historyMiddleware)` | history 미들웨어 등록 |

**반환**: `{ scope, group, AppState, getState, setState, resetState, useComputed, dispose }`

핵심: **group이 이미 반환된다.** 즉 `todoSlice.group.defineCommand()`가 바로 가능.

---

## 3. createModule이 추가해야 하는 것

```ts
const TodoList = createModule("todo", (define) => ({
  state: INITIAL_STATE,
  addTodo: define.command("TODO_ADD", handler),
  keymap: { ... },
  context: (state) => ({ isEditing: ... }),
  persistence: { key: "todo-v5" },
}))
```

### 3-1. define 콜백 내부의 `define.command()`

**가능한가?** ✅

```ts
function createModule(appId, factory) {
  // 1. registerAppSlice로 slice 생성 (기존 코드 그대로)
  const slice = registerAppSlice(appId, { initialState: ??? });

  // 문제: factory의 반환값에서 state를 먼저 꺼내야 함
  // → 2단계 실행 (state 추출 → slice 생성 → factory 재실행)
}
```

### ⚠️ 문제 1: state와 command의 동시 선언

Zustand 스타일 `(define) => ({ state, commands })` 에서 state를 먼저 꺼내야 slice를 만들 수 있다. 그런데 factory는 한 번에 돌아간다.

**해결**: factory를 두 번 실행하거나, state를 별도 인자로 분리:

```ts
// 옵션 A: state를 첫 번째 인자로 분리 (Zustand과 살짝 다름)
const TodoList = createModule("todo", INITIAL_STATE, (define) => ({
  addTodo: define.command("TODO_ADD", handler),
  keymap: { ... },
}))

// 옵션 B: config 객체 + commands 콜백 분리
const TodoList = createModule("todo", {
  state: INITIAL_STATE,
  persistence: { key: "todo-v5" },
  commands: (define) => ({
    addTodo: define.command("TODO_ADD", handler),
  }),
  keymap: { ... },
})
```

**옵션 A가 Zustand에 더 가깝다.** Zustand도 `create((set) => ({ ... }))`에서 `set`은 외부 제공이고, state는 반환값에 포함.

### ✅ 문제 없음: define.command → group.defineCommand

`define.command`는 `slice.group.defineCommand`를 그대로 위임하면 됨. 커널 변경 불필요.

```ts
const define = {
  command: slice.group.defineCommand,
  effect: slice.group.defineEffect,
  context: slice.group.defineContext,
}
```

### 3-2. keymap 등록

**가능한가?** 🟡 (현재 구조 확인 필요)

현재 키맵은 `keymaps/osDefaults.ts`에서 정의하고, `KeyboardListener`에서 참조. 앱 키맵(`todoKeys.ts`)은 별도 경로로 주입.

createModule이 keymap을 받으면, 이를 OS의 키맵 시스템에 **자동 등록**해야 함. 현재 이 "자동 등록" API가 없다.

**필요한 작업**: KeyboardListener 또는 keybindings 시스템에 앱 키맵 동적 등록 API 추가.

### 3-3. context 매핑

**가능한가?** ✅

`context: (state) => ({ isEditing: ... })`가 받으면, 이를 `defineContext`로 등록하면 됨.

```ts
slice.group.defineContext(`module:${appId}:context`, () =>
  config.context(slice.getState())
);
```

### 3-4. headless 컴포넌트 반환

**가능한가?** 🟡 (가장 큰 설계 과제)

`TodoList.Zone`, `TodoList.Item`을 반환하려면:

```tsx
// TodoList.Zone = OS.Zone을 감싸되, slice/keymap/context가 pre-bound
function ModuleZone({ children, ...props }) {
  return (
    <OS.Zone
      {...props}
      // slice의 scope 자동 바인딩
      // keymap 자동 등록
      // context 자동 주입
    >
      {children}
    </OS.Zone>
  );
}
```

이건 **OS.Zone의 인터페이스 변경이 필요하다.** 현재 Zone은 `slice` prop을 모른다.

가능한 접근:
- Zone에 `slice` prop 추가 → Zone이 scope와 context를 자동 바인딩
- 또는 ModuleZone이 React Context Provider로 감싸서 하위 OS.* 컴포넌트에 전달

---

## 3. 결론 / 제안

### 가능하다. 커널 변경 없이.

| 항목 | 가능 여부 | 필요 작업 |
|------|----------|----------|
| `define.command()` | ✅ 즉시 가능 | `group.defineCommand` 위임 |
| `context` 매핑 | ✅ 즉시 가능 | `defineContext` 위임 |
| `persistence` / `history` | ✅ 이미 있음 | `registerAppSlice` 그대로 |
| `keymap` 자동 등록 | 🟡 가능하나 작업 필요 | 앱 키맵 동적 등록 API |
| headless 컴포넌트 반환 | 🟡 가능하나 설계 필요 | Zone의 scope/context 자동 바인딩 |
| `useStore` | ✅ 즉시 가능 | `useComputed` 그대로 |

### 구현 순서 제안

```
Phase 1: createModule 코어 (state + commands + context)
         → registerAppSlice 위에 thin wrapper
         → 기존 Todo 앱을 마이그레이션하여 검증

Phase 2: headless 컴포넌트 반환 (Zone, Item)
         → Zone에 scope/context auto-binding
         → asChild 패턴 검증

Phase 3: keymap 자동 등록
         → 앱 키맵 동적 등록 API
         → KeyboardListener 확장
```

## 4. 해법 유형

🟡 **Constrained** — 커널은 건드리지 않는다. `registerAppSlice`를 감싸는 OS 레이어 확장. 트레이드오프는 Zone 인터페이스 변경 범위.

## 5. 인식 한계

- headless 컴포넌트의 React 렌더링 성능 영향은 분석하지 못했다 (Provider 중첩으로 인한 re-render).
- `asChild` 패턴의 Radix 구현체를 정밀 분석하지 않았다.
- 커맨드 간 상호 참조(`addTodo` 안에서 `startEdit` 호출)의 타입 안전성은 확인하지 못했다.

## 6. 열린 질문

1. state를 factory 인자에서 분리할 것인가? (옵션 A vs B)
2. headless 컴포넌트의 **커스텀 sub-component** (예: `TodoList.Checkbox`)는 어떻게 정의하나?
3. 두 개의 createModule이 서로 통신하는 방법은? (앱 간 커맨드)

---

**한줄요약**: createModule은 커널 변경 없이 registerAppSlice의 thin wrapper로 구현 가능하며, 핵심 난관은 headless 컴포넌트의 Zone 자동 바인딩과 앱 키맵 동적 등록 두 가지다.
