---
last-reviewed: 2026-02-12
---

# State Isolation Patterns — 프론트엔드에서 커널까지

> 앱이 자기 state만 보고, 자기 state만 고치게 만드는 모든 방법.

## 왜 이 주제인가

현재 interactive-os 커널의 가장 뜨거운 문제는 **state visibility 격리**다.

- inbox `Kernel_Scope_Isolation.md` — `ctx.state`가 전체 커널 state를 노출하는 문제 발견
- inbox `Kernel_App_Migration_Gaps.md` — Gap 1: 앱 커맨드가 전체 `AppState`를 알아야 하는 ergonomics 저하
- 최근 커밋 `f2ada95` — kernel state lens (ownership isolation) 구현 시작

**scope가 command routing과 effect routing은 격리하지만 state는 격리하지 않는다** — 이 한 줄이 현재 커널의 정체점이다. 이 문서는 다른 시스템들이 같은 문제를 어떻게 해결했는지 깊이 있게 살펴본다.

---

## Background / Context

State isolation은 "누가 무엇을 볼 수 있는가"와 "누가 무엇을 바꿀 수 있는가"를 통제하는 문제다. 이 문제가 발생하는 근본적 이유는 하나의 시스템 안에 **여러 독립적 주체**(앱, 모듈, 프로세스)가 공존하기 때문이다.

역사적으로 이 문제는 OS에서 먼저 해결되었다:

```
1960s  Multics — 프로세스별 가상 메모리 (address space isolation)
1970s  Unix   — 파일 권한, 프로세스 격리
1990s  Mach   — 마이크로커널, IPC 기반 서비스 격리
2010s  Docker — 네임스페이스 + cgroups
```

프론트엔드에서는 SPA가 복잡해지면서 같은 문제가 등장했다:

```
2015  Redux   — 단일 스토어, 하지만 슬라이스별 리듀서 격리
2016  Elm     — Model/Update 모듈화, Cmd.map으로 메시지 격리
2017  re-frame — app-db 네임스페이싱, reg-event-fx 핸들러 격리
2021  XState  — Actor 모델, spawn/invoke로 상태 머신 격리
2022  Zustand — 다중 스토어 vs. 슬라이스 패턴
```

---

## Core Concept

State isolation은 **3가지 축**으로 분해할 수 있다:

| 축 | 질문 | OS 대응 | FE 대응 |
|---|---|---|---|
| **Visibility** | 누가 읽을 수 있나? | 가상 메모리 (MMU) | Scoped state view |
| **Mutation** | 누가 바꿀 수 있나? | 권한 체계 (rwx) | Slice-scoped reducer |
| **Communication** | 격리된 주체끼리 어떻게 소통하나? | IPC, 시스템 콜 | Context injection, events |

세 축을 모두 해결한 시스템만이 진정한 격리를 달성한다. 대부분의 프레임워크는 Mutation은 격리하지만 Visibility는 느슨하고 Communication은 ad-hoc이다.

### 격리 강도 스펙트럼

```
느슨 ←──────────────────────────────────→ 엄격

  전역 변수   Redux    Zustand    Elm     XState    OS Process
  (공유 all)  (관행적)  (선택적)  (구조적) (Actor)  (강제적)
```

---

## 시스템별 상세 분석

### 1. Redux Toolkit — `createSlice`

**격리 메커니즘**: 슬라이스 리듀서가 자기 state만 받는다.

```typescript
const todoSlice = createSlice({
  name: 'todo',
  initialState: { items: [] },
  reducers: {
    addTodo(state, action) {
      // state = todoSlice의 state만.
      // 다른 슬라이스의 state는 보이지 않음.
      state.items.push(action.payload);
    }
  }
});
```

| 축 | 방법 | 강도 |
|---|---|---|
| Visibility | 리듀서는 자기 slice state만 받음 | ✅ 강제 |
| Mutation | 리듀서가 자기 slice만 수정. Immer가 보호 | ✅ 강제 |
| Communication | `extraReducers`로 다른 슬라이스 액션에 반응. `getState()`로 전체 읽기 (thunk에서만) | ⚠️ 관행적 |

**우리 커널에 주는 교훈**:  
Redux의 핵심 통찰은 `combineReducers`가 **state를 자동으로 잘라서** 전달하는 것이다. 리듀서 작성자는 전체 state tree의 존재를 모른다. 이것이 바로 inbox 문서가 제안하는 "접근법 A: Scoped State View"와 같다.

---

### 2. Zustand — 다중 스토어 vs. 슬라이스

**격리 메커니즘**: 기본적으로 **스토어 자체가 경계**.

```typescript
// 방식 1: 완전 분리된 다중 스토어
const useTodoStore = create((set) => ({ items: [], add: (item) => set(...) }));
const useAuthStore = create((set) => ({ user: null, login: () => set(...) }));
// → 물리적 격리. 서로의 존재를 모름.

// 방식 2: 슬라이스 결합 (단일 스토어)
const useBoundStore = create((...args) => ({
  ...createTodoSlice(...args),
  ...createAuthSlice(...args),
}));
// → 논리적 격리만. 슬라이스가 서로 접근 가능.
```

| 축 | 다중 스토어 | 슬라이스 패턴 |
|---|---|---|
| Visibility | ✅ 물리적 분리 | ⚠️ 전체 노출 |
| Mutation | ✅ 자기 스토어만 `set()` | ⚠️ 관행에 의존 |
| Communication | React Context / 이벤트 | 같은 스토어 내 직접 참조 |

**현재 커널의 현실**:  
interactive-os는 "단일 커널 스토어 + 앱 슬라이스" 구조다. Zustand 슬라이스 패턴의 한계가 그대로 재현된다 — 앱 커맨드가 전체 state를 볼 수 있다. 모든 의미 있는 격리는 커널이 직접 구현해야 한다.

---

### 3. re-frame (ClojureScript) — `app-db` 네임스페이싱

**격리 메커니즘**: 단일 `app-db`이지만 이벤트 핸들러와 구독이 경계를 형성.

```clojure
;; 이벤트 핸들러 - 네임스페이스로 격리
(reg-event-db :todo/add
  (fn [db [_ item]]
    (update-in db [:todo :items] conj item)))
    ;;              ^^^^^^ 관행적으로 자기 네임스페이스만 접근

;; 구독 - 접근 경로를 명시적으로 선언
(reg-sub :todo/items
  (fn [db] (get-in db [:todo :items])))
```

| 축 | 방법 | 강도 |
|---|---|---|
| Visibility | reg-sub이 접근 경로를 명시. 하지만 db 전체 전달됨 | ⚠️ 관행적 |
| Mutation | reg-event-db가 db 전체를 받고 전체를 반환 | ⚠️ 관행적 |
| Communication | 다른 네임스페이스 이벤트를 dispatch | ✅ 명시적 |

**핵심 인사이트**:  
re-frame의 강점은 격리 강도가 아니라 **격리를 위반해도 추적이 가능**하다는 점이다. 모든 상태 변경이 이벤트 핸들러를 통하므로, 누가 어디를 건드렸는지 re-frame-10x에서 확인할 수 있다.

---

### 4. Elm — 모듈별 Model/Update

**격리 메커니즘**: 타입 시스템이 강제하는 구조적 격리.

```elm
-- 자식 모듈
type alias Model = { items : List Todo }
type Msg = Add String | Toggle Int

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = ...

-- 부모 모듈
type alias ParentModel = { todo : Todo.Model, auth : Auth.Model }
type ParentMsg = TodoMsg Todo.Msg | AuthMsg Auth.Msg

parentUpdate : ParentMsg -> ParentModel -> ( ParentModel, Cmd ParentMsg )
parentUpdate msg model =
    case msg of
        TodoMsg subMsg ->
            let (newTodo, cmd) = Todo.update subMsg model.todo
            in ({ model | todo = newTodo }, Cmd.map TodoMsg cmd)
```

| 축 | 방법 | 강도 |
|---|---|---|
| Visibility | 자식 update는 자기 Model만 받음 | ✅ **타입 강제** |
| Mutation | 자식이 반환한 Model이 부모에 의해 올바른 위치에 합성 | ✅ 타입 강제 |
| Communication | `Cmd.map`, `Sub.map`으로 메시지 라우팅. 부모가 중재 | ✅ 명시적 |

**우리 커널에 주는 교훈**:  
Elm의 `Cmd.map`은 커널의 **scope chain bubbling**과 정확히 같은 패턴이다. 차이점: Elm은 타입 레벨에서 격리를 강제하고, 커널은 런타임 scope 토큰으로 격리한다. inbox의 "접근법 A"를 구현하면 커널이 Elm과 같은 수준의 격리를 달성한다.

---

### 5. XState — Actor Model

**격리 메커니즘**: 모든 머신이 독립 Actor. 메시지 패싱으로만 소통.

```typescript
const todoMachine = createMachine({
  context: { items: [] },
  on: {
    ADD: { actions: assign({ items: (ctx, e) => [...ctx.items, e.item] }) }
  }
});

const appMachine = createMachine({
  invoke: {
    id: 'todoActor',
    src: todoMachine,
    // todoMachine은 자기 context만 본다.
    // appMachine의 context에 접근 불가.
  },
  on: {
    FORWARD_TO_TODO: {
      actions: sendTo('todoActor', (_, e) => ({ type: 'ADD', item: e.item }))
    }
  }
});
```

| 축 | 방법 | 강도 |
|---|---|---|
| Visibility | Actor는 자기 context만 접근 | ✅ **물리적 격리** |
| Mutation | assign으로 자기 context만 변경 | ✅ 물리적 격리 |
| Communication | send / sendTo (비동기 메시지) | ✅ 명시적 |

**가장 엄격한 FE 격리 모델.** OS 프로세스 모델의 직역이다. 대가: 앱 간 데이터 공유가 번거롭다.

---

### 6. OS 프로세스 — 가상 주소 공간

| 축 | 방법 |
|---|---|
| Visibility | MMU가 물리 메모리를 가상 주소로 매핑. 프로세스는 자기 주소 공간만 봄 |
| Mutation | 페이지 테이블 + 권한 비트 (R/W/X). 커널만 매핑 변경 가능 |
| Communication | IPC (pipe, socket, shared memory with explicit mmap) |

이것이 궁극의 격리 모델이며, 프론트엔드의 모든 격리 패턴은 이 모델의 **소프트웨어적 근사**다.

---

## 우리 커널에 적용 — 현재 vs. 목표

| 축 | 현재 | 목표 (접근법 A+C) | 대응 패턴 |
|---|---|---|---|
| Visibility | `ctx.state` = 전체 커널 state | scope=GLOBAL → 전체, scope=app → 자기 slice만 | Redux `combineReducers` |
| Mutation | `{ state: newState }` → 전체 교체 | scope=app → 자기 slice만 교체, 커널이 자동 병합 | Elm `Cmd.map` |
| Communication | 없음 (직접 접근) | `defineContext`로 OS 정보 명시적 주입 | re-frame `inject-cofx` |

```typescript
// 목표 상태: 앱 커맨드
appGroup.defineCommand("ADD_TODO", (ctx) => (payload) => {
  // ctx.state = TodoAppState (자기 slice만!)
  // ctx.state.os → 존재하지 않음 (타입 에러)
  return {
    state: produce(ctx.state, draft => { draft.items.push(payload); })
    // → 커널이 자동으로 { ...fullState, apps: { ...apps, todo: newState } } 변환
  };
});

// OS 정보가 필요할 때: defineContext 주입
appGroup.defineCommand("CONTEXT_AWARE_CMD", [FocusInfo], (ctx) => () => {
  const focus = ctx.inject(FocusInfo);  // 읽기 전용, 타입 안전
  // ctx.state에는 여전히 OS state 없음
});
```

---

## Best Practice + Anti-Pattern

### ✅ Do

| 원칙 | 구체적 방법 |
|---|---|
| **State view는 좁게** | 핸들러에 전체 state 대신 자기 scope state만 전달 |
| **자동 병합** | 반환된 state를 커널이 올바른 위치에 합성 (Elm `Cmd.map` 패턴) |
| **Cross-scope는 명시적으로** | `defineContext`로 필요한 외부 정보만 inject |
| **GLOBAL scope는 예외 허용** | OS 커맨드는 전체 state가 필요. scope=GLOBAL일 때만 전체 노출 |

### ❌ Don't

| Anti-Pattern | 왜 위험한가 |
|---|---|
| 앱 핸들러에 전체 state 전달 | 앱이 OS 내부 구현에 coupling → OS 리팩토링 불가 |
| `...ctx.state`로 수동 병합 | 필드 누락 시 OS state 소멸 (실제 inbox에 기록된 위험) |
| Selector로 격리 대체 | 읽기만 제한. 쓰기 경로는 여전히 열려 있음 |
| "신뢰 기반" 격리 | 관행에 의존하는 격리는 팀 규모에 비례해 실패함 |

---

## 흥미로운 이야기들

### "프로그레시브 격리"의 전략

모든 시스템이 처음부터 완전한 격리를 구현하지 않았다. Redux는 v1에서 단일 리듀서로 시작해 `combineReducers`를 나중에 추가했다. re-frame은 `app-db`를 일부러 투명하게 두면서 DevTools 추적성으로 보상했다.

우리 커널도 같은 길을 가고 있다:
1. Phase 1 — 단일 state (현재)
2. Phase 2 — scoped state view (접근법 A) ← **지금 여기**
3. Phase 3 — 타입 레벨 강제 (Elm 수준)

### Elm의 "The Life of a File" 논쟁

Evan Czaplicki는 "모듈을 너무 작게 쪼개지 마라"고 주장했다. 상태 격리를 위해 모듈을 분리하면 boilerplate가 폭발하기 때문이다. 대신 "하나의 큰 Model에서 시작하고, 필요할 때만 추출하라"는 접근법을 권장했다. 이 철학은 Redux의 "start with a single store, split when needed" 권고와도 일치한다.

### XState의 Actor Model과 Erlang의 유산

XState가 채택한 Actor 모델은 1973년 Carl Hewitt가 제안하고, Erlang이 대중화한 것이다. Erlang에서 프로세스 하나가 죽어도 시스템이 살아남는 것처럼, XState에서 Actor 하나가 에러 상태에 빠져도 부모 Actor가 대응할 수 있다. 이 "let it crash" 철학은 격리의 궁극적 목적이 **장애 전파 차단**임을 보여준다.

---

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|---|---|---|---|---|
| Redux `combineReducers` 소스 | 10줄 안에 state slicing의 핵심이 있다 | [Redux 소스](https://github.com/reduxjs/redux/blob/master/src/combineReducers.ts) | ⭐⭐ | 30분 |
| Elm "Scaling The Elm Architecture" | 모듈 분리 없이 어디까지 갈 수 있는지 | [Elm Guide](https://guide.elm-lang.org/webapps/modules) | ⭐⭐⭐ | 1시간 |
| XState Actor Model deep dive | 가장 엄격한 FE 격리 구현체 | [Stately docs](https://stately.ai/docs/actors) | ⭐⭐⭐ | 1시간 |
| Linux namespaces 개요 | cgroups/namespaces가 프론트엔드 scope와 같은 문제를 해결 | [Linux Namespaces (man7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) | ⭐⭐⭐⭐ | 2시간 |
| re-frame Flows (최신) | 선언적 파생 상태 — 격리된 state에서 cross-scope 파생 유도 | [re-frame Flows](https://day8.github.io/re-frame/Flows/) | ⭐⭐⭐ | 45분 |
