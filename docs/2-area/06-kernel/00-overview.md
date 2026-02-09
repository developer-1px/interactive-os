# Kernel — 범용 커맨드 처리 엔진

> 날짜: 2026-02-09
> 태그: kernel, area, overview
> 상태: v3 — Canonical (코드 검증됨)

---

## 1. Kernel이란

Kernel은 **입력을 모르는 범용 커맨드 처리 엔진**이다.

```
Command가 들어오면 → 적절한 handler를 찾아 → 순수하게 처리하고 → 선언된 effects를 실행한다.
```

Kernel은 키보드를 모른다. 마우스를 모른다. 포커스를 모른다. ARIA를 모른다. Todo를 모른다.
Kernel이 아는 것은 오직: **Group, Command, Effect, Context, Scope, Middleware, State, Token.**

```
packages/kernel/src/
├── index.ts          공개 API export + initKernel, resetKernel
├── tokens.ts         Token 타입 (CommandFactory, EffectToken, ContextToken, ScopeToken)
├── registry.ts       createKernel → Group, defineScope, dispatch — 핵심 엔진 (Unified Group API)
├── context.ts        defineContext, resolveContext — 컨텍스트 제공/해석
├── store.ts          getState, resetState, bindStore, unbindStore — 단일 상태 트리 바인딩
├── createStore.ts    createStore — 미니멀 반응형 스토어 (0 의존성)
├── transaction.ts    getTransactions, travelTo — 트랜잭션 로그 + 타임 트래블
├── dispatch.ts       (shim) registry.ts re-export
├── middleware.ts     (shim) registry.ts re-export
├── __tests__/
│   ├── step1.ts      기본 dispatch, CommandFactory, EffectToken (20 tests)
│   ├── step2.ts      React hooks, Middleware, TestBot (10 tests)
│   ├── step3.ts      defineContext, inject (15 tests)
│   ├── step4.ts      Group API, scoped dispatch, bubbling (25 tests)
│   └── type-proof.ts 컴파일 타임 타입 검증
└── react/
    ├── useComputed.ts   파생 상태 구독 (useSyncExternalStore)
    └── useDispatch.ts   dispatch 참조 획득 (index.ts에서 미노출 — 직접 import 필요)
```

---

## 2. 3-Layer 모델에서의 위치

```
┌─────────────────────────────────────────────────────┐
│  Layer 3: App                                        │
│  TodoState, KanbanState, AppCommand                  │
│  → 도메인 로직. OS가 뭔지 모른다.                      │
├─────────────────────────────────────────────────────┤
│  Layer 2: OS                                         │
│  FocusState, Zone, Item, NAVIGATE, ACTIVATE, ARIA    │
│  defineKeybinding, resolveKeybinding, Sensor          │
│  → 포커스/탐색/접근성. Kernel 위에서 동작한다.          │
├─────────────────────────────────────────────────────┤
│  Layer 1: Kernel                                     │
│  dispatch, defineCommand, defineEffect, scope         │
│  → 범용 커맨드 엔진. OS가 뭔지 모른다.                 │
└─────────────────────────────────────────────────────┘
```

**의존 규칙 (단방향):**

| From → To | 허용 |
|---|---|
| Kernel → OS | ❌ Kernel은 OS를 모른다 |
| Kernel → App | ❌ Kernel은 App을 모른다 |
| OS → Kernel | ✅ OS는 Kernel API를 사용한다 |
| App → Kernel | ✅ App은 defineCommand를 직접 사용할 수 있다 |
| App → OS | ✅ App은 Zone, Item 등 primitive를 사용한다 |
| OS → App | ❌ OS는 App을 모른다 |

**Kernel의 경계 — 입력 소스를 모른다:**

센서(키보드, 마우스, 포커스)는 OS의 책임이다. 모든 센서가 각자의 입력을 Command로 번역하여 `dispatch()`에 넘긴다. Kernel은 Command가 어디서 왔는지 관심 없다.

```
OS KeyboardSensor → "Enter" → dispatch(ACTIVATE())        // ✅ CommandFactory 호출
OS MouseSensor    → click   → dispatch(ACTIVATE())
OS FocusSensor    → focus   → dispatch(ZONE_ENTER())
Test              → direct  → dispatch(ACTIVATE())
```

---

## 3. Dispatch 파이프라인 ✅

### 3.1 Scoped Dispatch (Unified Group API)

```
dispatch(cmd)
  → queue (re-entrance safe)
  → processCommand(cmd)
      1. bubblePath = cmd.scope ?? ["GLOBAL"]
      2. For each scope in bubblePath:
           a. Run scope before-middleware
           b. Find handler: scopedCommands[scope][cmd.type]
           c. If no handler → skip to next scope (bubble)
           d. Run per-command interceptors (inject middleware)
           e. Execute handler → result
           f. Run scope after-middleware (reverse order)
           g. result === null → continue (bubble)
           h. result === EffectMap → stop (handled)
      3. Execute effects (scope chain bubbling + try-catch)
      4. Record transaction (with handlerScope, bubblePath)
```

**하위 호환:** `scope` 생략 시 `["GLOBAL"]`로 fallback. 기존 코드 수정 없이 동작한다.

Effect 실행도 scope chain을 따른다: 위젯 scope → 앱 scope → GLOBAL 순으로 handler를 찾는다. try-catch로 개별 effect 실패가 나머지 effect 실행을 차단하지 않는다.

---

## 4. 핵심 개념

### 4.1 Token — 모든 ID의 타입 안전한 참조 ✅

> **절대 원칙: raw string은 컴파일 에러. 암묵적인 것은 없다.**

Kernel의 모든 ID(`"ACTIVATE"`, `"DOM_ITEMS"`, `"NOTIFY"`)는 Token을 통해 참조한다. 오타, 타입 불일치 모두 컴파일 에러.

```typescript
// ✅ Token Types

// EffectToken, ScopeToken: branded string (runtime = string, unique symbol로 구조적 타이핑 차단)
type EffectToken<Type extends string, Value = unknown> = Type & {
  readonly [__effectBrand]: Value;
};

type ScopeToken<Id extends string> = Id & {
  readonly [__scopeBrand]: true;
};

// ContextToken: wrapper object (branded string에서 변경 — TS mapped type 추론 문제 해결)
type ContextToken<Id extends string, Value = unknown> = {
  readonly __id: Id;
  readonly __phantom?: Value;   // compile-time only — Value 타입 전달
};

// Command: branded object (dispatch가 받는 실제 데이터)
type Command<Type extends string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly scope?: ScopeToken[];   // ✅ 정식 필드 (Group에서 자동 부여)
  readonly [__commandBrand]: true;
};

// CommandFactory: Command를 생성하는 함수 (defineCommand의 반환값)
type CommandFactory<Type extends string, Payload = void> = {
  (...args: Payload extends void ? [] : [payload: Payload]): Command<Type, Payload>;
  readonly commandType: Type;
};
```

> **ContextToken이 branded string이 아닌 wrapper object인 이유:**
> branded string `Id & { [__brand]: Value }`은 TypeScript의 mapped type에서 `Value` 추론이 실패한다.
> wrapper object `{ __id: Id; __phantom?: Value }`로 변경하면 `InjectResult` mapped type이 정상 동작한다.
> 이것이 C1(Context 타입 추론 실패) 해결의 핵심이다.

Token은 반드시 `define*()` 함수를 거쳐야만 생성된다. `{ type: "INCREMENT", payload: undefined }`를 직접 만들어도 `Command`가 될 수 없다 — unique symbol이 없으므로.

**설계 원칙 — 오버로딩 금지:**
`dispatch(TOKEN)` / `dispatch(TOKEN, payload)` 형태의 오버로딩은 LLM이 환각을 일으킬 위험이 있다. 대신 **CommandFactory 패턴**을 채택: Factory가 Command를 생성하고, dispatch는 Command만 받는다. 단일 시그니처.

```typescript
// ✅ Token 생성 — define*()만이 Token을 반환 (Group API 기반)

// CommandFactory — Group.defineCommand로 생성
const INCREMENT = kernel.defineCommand("INCREMENT", handler);
// typeof INCREMENT = CommandFactory<"INCREMENT", void>
// INCREMENT() → Command<"INCREMENT", void>

const SET_COUNT = kernel.defineCommand("SET_COUNT", (ctx, payload: number) => ({ ... }));
// typeof SET_COUNT = CommandFactory<"SET_COUNT", number>
// SET_COUNT(42) → Command<"SET_COUNT", number>

// EffectToken — Group.defineEffect로 생성. EffectMap의 computed key로 사용
const NOTIFY = kernel.defineEffect("NOTIFY", (message: string) => toast(message));
// typeof NOTIFY = EffectToken<"NOTIFY", string>

// ContextToken — wrapper object. group({ inject: [...] })로 핸들러에 주입
const DOM_ITEMS = defineContext("DOM_ITEMS", (): DOMItem[] => queryDOMItems());
// typeof DOM_ITEMS = ContextToken<"DOM_ITEMS", DOMItem[]>

// ScopeToken — branded string.
const CARD_LIST = defineScope("CARD_LIST");
// typeof CARD_LIST = ScopeToken<"CARD_LIST">
```

### 4.2 Command — 디스패치 데이터

```typescript
// ✅ Command는 branded object
type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly [__commandBrand]: true;
};

// ✅ CommandFactory 패턴 — 오버로딩 없는 단일 dispatch 시그니처
dispatch(INCREMENT());                  // ✅ void payload → Factory() 호출
dispatch(SET_COUNT(42));                // ✅ number payload → Factory(42) 호출
dispatch({ type: "INCREMENT" } as any); // ❌ 런타임은 되지만 타입 검증 우회
SET_COUNT("wrong");                     // ❌ 컴파일 에러 — string ≠ number
INCREMENT(42);                          // ❌ 컴파일 에러 — void에 인자 전달
```

### 4.3 EffectMap — 핸들러 반환값 (Effects as Data) ✅

```typescript
// ✅ TypedEffectMap — index signature 제거됨. EffectToken computed key만 허용.
type TypedEffectMap<S, E extends Record<string, EffectToken>> = {
  state?: S;                          // 내장: 상태 업데이트 (항상 먼저 실행)
  dispatch?: Command | Command[];     // 내장: 재-dispatch
} & EffectFields<E>;                  // EffectToken의 computed key만 허용

// EffectFields — EffectToken에서 key/value 타입 자동 유도
type EffectFields<E extends Record<string, EffectToken>> = {
  [K in keyof E as E[K] extends EffectToken<infer T, unknown> ? T : never]?:
    E[K] extends EffectToken<string, infer V> ? V : never;
};

// ✅ 사용 예시 — computed key로 타입 안전한 effect 선언
kernel.defineCommand("SHOUT", (ctx) => ({
  state: nextState,
  [NOTIFY]: "hello",           // ✅ key = EffectToken, value 타입 = string
}));

kernel.defineCommand("SHOUT", (ctx) => ({
  state: nextState,
  [NOTIFY]: 42,                // ❌ 컴파일 에러 — number ≠ string
  ntoify: "hello",             // ❌ 컴파일 에러 — 'ntoify' is not a valid key
}));
```

핸들러는 부수효과를 직접 실행하지 않는다. 선언만 한다. 실행은 Kernel이.

### 4.4 Context — 핸들러 읽기 컨텍스트 ✅

```typescript
// ✅ Group inject 기반
// TypedContext<S, Injected> = { readonly state: S } & Readonly<Injected>

// inject는 group config에서 선언 (re-frame coeffect)
const { defineCommand } = kernel.group({
  scope: TODO,
  inject: [DOM_ITEMS, USER_INFO],
});

// 핸들러는 순수 데이터만 받음 — inject된 값이 ctx에 자동 포함
defineCommand("NAVIGATE", (ctx) => {
  const items = ctx.DOM_ITEMS;     // 타입: DOMItem[] — 자동 추론 ✅
  const user = ctx.USER_INFO;     // 타입: User — 자동 추론 ✅
  // ctx.NONEXISTENT;              // ❌ 컴파일 에러 — index signature 없음
  return { state: nextState };
});
```

> **inject()가 제거된 이유:** 기존 `inject(TOKEN)` 인터셉터 방식은 `defineCommand`의 제네릭 체인에서
> interceptor의 ContextToken 타입을 handler ctx에 전파할 수 없었다 (C1 이슈).
> Group config의 `inject: [...]`로 변경하면 `createGroup<S, E, Tokens>`의 Tokens 제네릭이
> `TypedContext<S, InjectResult<Tokens>>`를 통해 ctx에 자연스럽게 전파된다.

### 4.5 Middleware — 전후 훅

```typescript
type Middleware = {          // ✅ 구현됨
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
};
```

re-frame의 interceptor 모델. Redux의 `(next) => (s, a) => ...`가 아님.

### 4.6 Group & Scope — 계층적 커맨드 해석 ✅

```
Group: Kernel의 유일한 추상화 단위. kernel 자체도 Group("GLOBAL")이다.
Scope: 문자열 ID. Group마다 하나의 scope를 가진다.
"GLOBAL": 항상 존재하는 루트 scope. createKernel()이 반환하는 Group의 scope.

Group이 제공하는 것: defineCommand, defineEffect, defineContext, group, dispatch, use, reset
Group이 모르는 것: 트리 구조, DOM, 포커스, Zone.

Kernel이 아는 것: "scope 문자열 배열을 받으면 앞에서부터 순회하며 handler를 찾는다."
OS가 할 일: buildBubblePath()로 scope 배열을 계산하여 cmd.scope에 넘긴다.
```

```typescript
// ✅ Group = 유일한 인터페이스 — Kernel도 Group이다
createKernel(config) → Group    // root = Group("GLOBAL")

Group = {
  defineCommand(type, handler) → CommandFactory
  defineEffect(type, handler)  → EffectToken
  defineContext(id, provider)  → ContextToken
  group(config)                → Group       // 자식 그룹 (재귀)
  dispatch(command)            → void
  use(middleware)              → void
  reset(initialState)          → void
}
```

---

## 5. API Reference

### 5.1 Setup

| API | 설명 | 상태 |
|---|---|---|
| `createKernel({ state?, effects? })` | root Group 생성. `state: state<S>()`로 상태 타입 바인딩 | ✅ |
| `initKernel(initialState)` | `createStore(initialState)` + `bindStore(store)` 편의 함수. 항상 새로 생성 | ✅ |
| `resetKernel()` | Registry, middleware, context, transaction 초기화. Store 유지 | ✅ |

```typescript
// ✅ createKernel — state<S>() phantom marker로 상태 타입 바인딩
const kernel = createKernel({
  state: state<AppState>(),
  effects: { NOTIFY, FOCUS },
});
// → root Group("GLOBAL") 반환. S = AppState, E = { NOTIFY, FOCUS }

// ✅ initKernel — 스토어 생성 + 바인딩 (항상 새로 생성)
const store = initKernel({ count: 0, todos: [] });
// → createStore({ count: 0, ... }) + bindStore(store)
```

### 5.2 Command Registration (Group API)

| API | 시그니처 | 상태 |
|---|---|---|
| `group.defineCommand(type, handler)` | `(string, (ctx: Ctx) → EffMap) → CommandFactory<T, void>` | ✅ |
| `group.defineCommand(type, handler)` | `(string, (ctx: Ctx, payload: P) → EffMap) → CommandFactory<T, P>` | ✅ |

> **오버로드 2개만 존재** — void payload / with payload. 인터셉터 인자, scope 인자 없음.
> inject는 group config에서 선언. scope는 group이 자동 부여.

```typescript
// ✅ GLOBAL scope — kernel에서 직접 정의
const ACTIVATE = kernel.defineCommand("ACTIVATE", (ctx) => ({
  state: nextState,
}));
// typeof ACTIVATE = CommandFactory<"ACTIVATE", void>
// ACTIVATE() → Command<"ACTIVATE", void>  (scope 없음 = GLOBAL)

const SET_COUNT = kernel.defineCommand("SET_COUNT", (ctx, payload: number) => ({
  state: { ...ctx.state, count: payload },
}));
// typeof SET_COUNT = CommandFactory<"SET_COUNT", number>
// SET_COUNT(42) → Command<"SET_COUNT", number>

// ✅ Scoped + Inject — group config로 선언
const { defineCommand } = kernel.group({
  scope: TODO_LIST,
  inject: [DOM_ITEMS, ZONE_CONFIG],
});

const NAVIGATE = defineCommand("NAVIGATE", (ctx, payload) => ({
  state: nextState,
  // ctx.DOM_ITEMS, ctx.ZONE_CONFIG 자동 타입 추론
}));
// NAVIGATE(payload) → Command with scope = [TODO_LIST]
```

### 5.3 Effect Registration (Group API — Scoped)

| API | 시그니처 | 상태 |
|---|---|---|
| `group.defineEffect(type, handler)` | `(string, (value: V) → void) → EffectToken<T, V>` | ✅ |

Effect는 **Group의 scope에 등록**된다. 실행 시 scope chain을 따라 bubbling하며, 가장 가까운 scope의 handler가 실행된다.

```typescript
// ✅ GLOBAL scope — OS 기본 구현
const TOAST = kernel.defineEffect("TOAST", (msg: string) => systemToast(msg));
// typeof TOAST = EffectToken<"TOAST", string>

const FOCUS = kernel.defineEffect("FOCUS", (id: string) => document.getElementById(id)?.focus());
// typeof FOCUS = EffectToken<"FOCUS", string>

// ✅ Widget scope — 오버라이드 (bubbling으로 fallback)
const { defineEffect } = kernel.group({ scope: TODO_WIDGET });
defineEffect("TOAST", (msg: string) => miniPopup(msg));
// → TODO_WIDGET scope의 커맨드에서 TOAST 사용 시 miniPopup 실행
// → 다른 scope에서는 GLOBAL의 systemToast가 실행
```

### 5.4 Context & Injection (Group API)

| API | 시그니처 | 상태 |
|---|---|---|
| `defineContext(id, provider)` | `(string, () → V) → ContextToken<Id, V>` | ✅ |
| `group({ inject: [...tokens] })` | Group config에서 선언적 주입 | ✅ |

> **`inject()` 함수는 제거됨.** Group config의 `inject: [...]`로 대체.

```typescript
// ✅ ContextToken 반환 — wrapper object
const DOM_ITEMS = defineContext("DOM_ITEMS", (): DOMItem[] => queryDOMItems());
// typeof DOM_ITEMS = ContextToken<"DOM_ITEMS", DOMItem[]>
// runtime value = { __id: "DOM_ITEMS" }

const AUTH = defineContext("AUTH", (): AuthInfo => getAuth());
// typeof AUTH = ContextToken<"AUTH", AuthInfo>

// ✅ inject는 group config에서 선언 — handler의 ctx에 자동 타입 추론
const { defineCommand } = kernel.group({
  scope: TODO,
  inject: [DOM_ITEMS, AUTH],
});

const NAVIGATE = defineCommand("NAVIGATE", (ctx, payload) => {
  const items = ctx.DOM_ITEMS;    // ✅ DOMItem[] — 자동 추론
  const user = ctx.AUTH;          // ✅ AuthInfo — 자동 추론
  return { state: nextState };
});
```

inject는 Group의 `createGroup<S, E, Tokens>`에서 `Tokens` 제네릭으로 전파된다.
`TypedContext<S, InjectResult<Tokens>>`를 통해 handler ctx에 inject된 값의 타입이 자동으로 포함된다.

### 5.5 Middleware (Group API — Scoped)

| API | 시그니처 | 상태 |
|---|---|---|
| `group.use(middleware)` | `(Middleware) → void` | ✅ |

Middleware는 Group의 scope에 등록된다. `kernel.use()`는 GLOBAL scope에 등록.

```typescript
kernel.use({
  id: "LOGGER",
  before: (ctx) => { console.group(`[kernel] ${ctx.command.type}`); return ctx; },
  after: (ctx) => { console.groupEnd(); return ctx; },
});
```

**실행 순서 (per scope):**
```
scope-middleware:before → per-cmd-inject:before → handler → per-cmd-inject:after → scope-middleware:after
```

inject middleware는 Group이 `injectTokens`를 가질 때 자동으로 per-command interceptor로 등록된다.

### 5.6 Dispatch

| API | 시그니처 | 상태 |
|---|---|---|
| `dispatch(cmd)` | `(Command) → void` | ✅ |
| `dispatch(cmd, options?)` | `(Command, { scope?: ScopeToken[] }) → void` | ✅ |

> **오버로딩 금지 원칙:** dispatch는 단일 시그니처. payload는 CommandFactory가 캡슐화한다.
> `dispatch(TOKEN, payload)` 형태의 오버로딩은 **LLM 환각을 유발**하므로 채택하지 않는다.

```typescript
// ✅ CommandFactory 패턴 — Factory가 Command를 생성, dispatch는 Command만 받는다
dispatch(ACTIVATE());                   // void payload
dispatch(SET_COUNT(42));                // number payload — Factory가 타입 검증
SET_COUNT("wrong");                     // ❌ 컴파일 에러 — string ≠ number
dispatch({ type: "ACTIVATE" } as any);  // ❌ as any 없이는 불가 — branded type
```

re-entrance safe. 큐 기반. dispatch 안에서 dispatch해도 안전하다 (큐에 추가, 현재 커맨드 처리 후 실행).

### 5.7 Store

| API | 시그니처 | 상태 |
|---|---|---|
| `createStore(initial)` | `(S) → Store<S>` | ✅ |
| `bindStore(store)` | `(Store<S>) → void` — dispatch 파이프라인에 스토어 연결 | ✅ |
| `unbindStore()` | `() → void` — 스토어 연결 해제 (테스트용) | ✅ |
| `getActiveStore()` | `() → Store<unknown> \| null` — 현재 바인딩된 스토어 | ✅ |
| `getState()` | `<S>() → S` | ✅ |
| `resetState(state)` | `<S>(nextState: S) → void` — 전체 상태 트리 교체 | ✅ |

`initKernel(initialState)` = `createStore(initialState)` + `bindStore(store)` 편의 함수.

React 안에서는 `useComputed(selector)` 사용. `getState()`는 defineContext provider나 React 바깥에서 사용.

### 5.8 React Hooks

| API | 시그니처 | 상태 |
|---|---|---|
| `useComputed(selector)` | `((state) → T) → T` | ✅ index.ts에서 export |
| `useDispatch()` | `() → (cmd) → void` | ✅ `react/useDispatch.ts`에 존재, index.ts에서 미노출 |

> **`useDispatch` 참고:** `react/useDispatch.ts`에 구현되어 있으나 `index.ts`에서 re-export되지 않는다.
> 사용 시 `import { useDispatch } from "@kernel/react/useDispatch.ts"` 직접 import이 필요하다.

```tsx
// ✅ CommandFactory 패턴
function TodoItem({ id }: { id: string }) {
  const isDone = useComputed((s) => s.todos[id].done);
  const send = useDispatch();
  return (
    <li data-done={isDone}>
      <button onClick={() => send(TOGGLE({ id }))} />
    </li>
  );
}
```

### 5.9 Inspector / Time Travel

| API | 시그니처 | 상태 |
|---|---|---|
| `getTransactions()` | `() → readonly Transaction[]` | ✅ |
| `getLastTransaction()` | `() → Transaction \| undefined` | ✅ |
| `travelTo(id)` | `(number) → void` | ✅ |
| `clearTransactions()` | `() → void` | ✅ |

```typescript
type Transaction = {           // ✅ 구현됨
  id: number;
  timestamp: number;
  command: Command;
  handlerScope: string;        // 실제 매칭된 scope (e.g., "GLOBAL")
  bubblePath: string[];        // 순회한 전체 scope 경로
  effects: Record<string, unknown> | null;
  changes: StateDiff[];
  stateBefore: unknown;
  stateAfter: unknown;
};

type StateDiff = { path: string; from: unknown; to: unknown };
```

### 5.10 Group & Scope ✅

| API | 시그니처 | 상태 |
|---|---|---|
| `defineScope(id)` | `(string) → ScopeToken` | ✅ |
| `group.group({ scope?, inject? })` | 자식 Group 생성 | ✅ |
| `group.reset(initialState)` | 상태 초기화 (레지스트리 유지) | ✅ |

```typescript
// ✅ Scope + Group — Unified Group API
const TODO_LIST = defineScope("TODO_LIST");

// ✅ 자식 Group 생성 — scope와 inject 지정
const { defineCommand, defineEffect } = kernel.group({
  scope: TODO_LIST,
  inject: [AUTH],
});

// ✅ 이 Group에서 정의된 CommandFactory는 scope를 자동 부여
const TOGGLE = defineCommand("TOGGLE", (ctx, id: number) => ({
  state: { ...ctx.state, todos: ctx.state.todos.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  ) },
}));
// TOGGLE(1) → Command { type: "TOGGLE", payload: 1, scope: [TODO_LIST] }

// ✅ dispatch 시 scope 수동 지정도 가능 (OS Sensor 용)
dispatch(ACTIVATE(), {
  scope: buildBubblePath(focusPath, activeGroupId),
  // → [TODO_LIST, MAIN_CONTENT, APP_SHELL, GLOBAL]
});
```

---

## 6. Public Export Surface (`index.ts`)

`packages/kernel/src/index.ts`에서 export되는 전체 API 목록.

### 6.1 Type Exports

| Type | 소스 | 설명 |
|---|---|---|
| `Command<Type, Payload>` | tokens.ts | 타입 커맨드 객체 |
| `CommandFactory<Type, Payload>` | tokens.ts | 커맨드 생성 함수 |
| `ContextToken<Id, Value>` | tokens.ts | 컨텍스트 래퍼 객체 |
| `EffectToken<Type, Value>` | tokens.ts | 이펙트 브랜드 문자열 |
| `ScopeToken<Id>` | tokens.ts | 스코프 브랜드 문자열 |
| `TypedContext<S, Injected>` | tokens.ts | 핸들러 ctx 타입 |
| `TypedEffectMap<S, E>` | tokens.ts | 핸들러 반환 타입 |
| `EffectFields<E>` | tokens.ts | EffectToken → optional fields 유도 |
| `InjectResult<T>` | tokens.ts | ContextToken[] → inject 결과 유도 |
| `Middleware` | registry.ts | 미들웨어 타입 `{ id, before?, after? }` |
| `MiddlewareContext` | registry.ts | 미들웨어 훅 컨텍스트 |
| `StateMarker<S>` | registry.ts | phantom state 타입 마커 |
| `Store<S>` | createStore.ts | 스토어 인터페이스 `{ getState, setState, subscribe }` |
| `StateDiff` | transaction.ts | `{ path, from, to }` |
| `Transaction` | transaction.ts | 트랜잭션 로그 엔트리 |

### 6.2 Function/Value Exports

| Export | 시그니처 | 설명 |
|---|---|---|
| `GLOBAL` | `ScopeToken<"GLOBAL">` | 루트 스코프 상수 |
| `createKernel(config)` | `({ state?, effects? }) → Group` | 커널 생성 → root Group |
| `defineScope(id)` | `(string) → ScopeToken` | 스코프 토큰 생성 |
| `dispatch(cmd, options?)` | `(Command, { scope? }) → void` | 커맨드 디스패치 |
| `state()` | `<S>() → StateMarker<S>` | phantom state 마커 (createKernel config용) |
| `defineContext(id, provider)` | `(string, () → V) → ContextToken` | 컨텍스트 프로바이더 등록 |
| `createStore(initial)` | `(S) → Store<S>` | 미니멀 반응형 스토어 생성 |
| `bindStore(store)` | `(Store<S>) → void` | 스토어 바인딩 |
| `unbindStore()` | `() → void` | 스토어 해제 |
| `getActiveStore()` | `() → Store \| null` | 바인딩된 스토어 조회 |
| `getState()` | `<S>() → S` | 현재 상태 읽기 |
| `resetState(next)` | `<S>(S) → void` | 상태 트리 교체 |
| `initKernel(initial)` | `<S>(S) → Store<S>` | createStore + bindStore 편의 |
| `resetKernel()` | `() → void` | 전체 초기화 (레지스트리 + 컨텍스트 + 트랜잭션) |
| `useComputed(selector)` | `((state) → T) → T` | React 파생 상태 훅 |
| `getTransactions()` | `() → readonly Transaction[]` | 트랜잭션 로그 조회 |
| `getLastTransaction()` | `() → Transaction \| undefined` | 마지막 트랜잭션 |
| `travelTo(id)` | `(number) → void` | 타임 트래블 |
| `clearTransactions()` | `() → void` | 트랜잭션 로그 초기화 |
| `recordTransaction(...)` | 내부 사용 (exported) | 트랜잭션 기록 |
| `clearAllRegistries()` | `() → void` | 테스트용 레지스트리 초기화 |
| `clearContextProviders()` | `() → void` | 테스트용 컨텍스트 초기화 |

---

## 7. 확정된 설계 결정

| # | 결정 | 근거 | 소스 |
|---|---|---|---|
| D1 | 디스패치 데이터 = **Command** (Event ❌) | DOM Event와 충돌 | 06 glossary |
| D2 | ZoneState ≠ ZoneSnapshot — 공존 | 런타임 vs 직렬화 | 06 glossary |
| D3 | 상태 트리 루트 = **State** (DB ❌, OSState ❌) | 범용적. 모든 레이어에서 자연스럽다 | 06 glossary |
| D4 | Middleware = `{ id, before, after }` | re-frame interceptor 모델 | 06 glossary |
| D5 | Handler 통일. defineHandler는 sugar | 내부적으로 CommandFn으로 wrap | 06 glossary |
| D6 | 센서/파이프라인 타입도 glossary 범위 | 네이밍 일관성 | 06 glossary |
| D7 | Zone 상태 = `Record<string, ZoneState>` | 전체 보관 모델 | 06 glossary |
| S1 | Scope 전달 = **Explicit** (cmd.scope 필드) | 결정론적, LLM 가독성, replay | 13 scope final |
| S2 | Scope Tree 관리 = **OS 책임** | Kernel은 DOM을 모른다 | 13 scope final |
| S3 | Middleware 실행 = **scope-level** | handler와 동일한 bubbling | 13 scope final |
| K1 | defineKeybinding = **OS** (Kernel ❌) | Kernel은 입력 소스를 모른다 | 11 debate |
| T1 | **100% Type-Strict** — raw string 컴파일 에러 | LLM 시대에 암묵적인 것은 없어야 한다 | 14 type-safety |
| T2 | Token = **Branded Type** (unique symbol) | 구조적 타이핑 차단. `{ type: "x" }` ≠ CommandToken | 14 type-safety |
| T3 | **index signature 전면 제거** (EffectMap, Context) | 오타/미등록 key가 타입 에러 없이 통과하는 구멍 차단 | 14 type-safety |
| T4 | **dispatch 오버로딩 금지** — CommandFactory 패턴 | LLM 환각 방지. `dispatch(CMD())` 단일 시그니처 | 17 audit |
| G1 | **Group = 유일한 인터페이스** — kernel도 Group("GLOBAL") | API 개수 최소화, 학습 비용 제거 | 19 group-api |
| G2 | **ContextToken = wrapper object** (branded string ❌) | TS mapped type에서 Value 추론 실패 해결 (C1) | 19 group-api |
| G3 | **inject = group config** (inject() 인터셉터 ❌) | 제네릭 체인으로 ctx 타입 자동 전파 | 19 group-api |
| G4 | **Effect scoping + bubbling** | 위젯별 effect 오버라이드, GLOBAL fallback | 19 group-api |
| N1 | **SCREAMING_CASE 통일** — 변수명 = string 리터럴 | grep/find-replace 일관성 | naming convention |

---

## 8. 용어 치트시트

| 용어 | 정의 | ❌ 쓰지 않는 이름 |
|---|---|---|
| **Group** | Kernel의 유일한 추상화 단위. `{ defineCommand, defineEffect, defineContext, group, dispatch, use, reset }` | module, namespace |
| **Command** | `{ type, payload?, scope? }` | event, action |
| **EffectMap** | 핸들러 반환값. `{ state?, [EFFECT]?, dispatch? }` | result, fx-map |
| **Context** | `{ state, ...injected }` — Group inject로 자동 타입 추론 | cofx, coeffects |
| **Middleware** | `{ id, before?, after? }` | interceptor |
| **Scope** | 커맨드 해석 계층 단위 (문자열 ID). Group마다 하나 | layer, level |
| **State** | 단일 상태 트리 루트 | db, DB, OSState |
| **Token** | 타입 안전한 참조. `define*()`로만 생성 | ID, key, tag |
| **EffectToken** | Branded string. `group.defineEffect()`의 반환값 | — |
| **ContextToken** | Wrapper object `{ __id, __phantom? }`. `defineContext()`의 반환값 | — |
| **ScopeToken** | Branded string. `defineScope()`의 반환값 | — |
| **CommandFactory** | Command 생성 함수. `group.defineCommand()`의 반환값. `ACTIVATE()` 호출로 Command 생성 | CommandToken |
| **Computed** | 캐싱된 파생 상태 | subscription, selector |

**금지 약어:** `db` → `state`, `fx` → `effect`, `cofx` → `ctx`, `mw` → `middleware`, `sub` → `computed`

---

## 9. 구현 현황

```
✅ 완료 (현재 동작 중)                  📐 설계 확정, 미구현
──────────────────────────────        ─────────────────────
Unified Group API (createKernel→Group) removeScopedCommand (동적 해제)
  group.defineCommand → CommandFactory  removeScopedMiddleware (동적 해제)
  group.defineEffect  → EffectToken    Store 타입 전파 (H3)
  group.defineContext  → ContextToken
  group.group()       → child Group
  group.dispatch / use / reset
dispatch (scoped bubbling)
defineScope → ScopeToken
ContextToken wrapper object (C1 해결)
Group inject (inject() 인터셉터 제거)
CommandFactory 패턴
Command.scope 정식 필드 (H2 해결)
Effect scoping + bubbling
executeEffects try-catch (H4 해결)
createKernel (타입 바인딩)
useComputed, useDispatch
getState, resetState
bindStore, unbindStore, getActiveStore
getTransactions, travelTo
clearTransactions
initKernel, resetKernel
createStore, bindStore
TypedEffectMap (index sig 제거)
StateDiff (shallow-then-recurse)
Transaction (handlerScope, bubblePath)
Transaction log (cap 200)
state<S>() phantom marker
GLOBAL constant
clearAllRegistries, clearContextProviders
recordTransaction
```

---

## 10. OS 연동 요약

Kernel은 순수한 커맨드 처리 엔진이다. OS가 다음을 담당한다:

| 책임 | OS가 하는 일 | Kernel API 사용 |
|---|---|---|
| **입력 번역** | KeyboardSensor → Command | `dispatch()` |
| **키바인딩** | defineKeybinding, resolveKeybinding | — (OS 전용) |
| **Zone 등록** | FocusGroup 마운트 시 scope 등록 | `kernel.group({ scope })` ✅ |
| **Zone 해제** | FocusGroup 언마운트 시 scope 해제 | `removeScopedCommand()` 📐 |
| **Bubble Path** | buildBubblePath(focusPath) 계산 | `dispatch(cmd, { scope })` ✅ |
| **OS 커맨드** | NAVIGATE, ACTIVATE, ESCAPE 등록 | `group.defineCommand()` |
| **OS 이펙트** | FOCUS, SCROLL, BLUR 등록 | `group.defineEffect()` |
| **OS 컨텍스트** | DOM_ITEMS, ZONE_CONFIG 등록 | `defineContext()` + `group({ inject })` |
| **파생 상태** | focused-item, is-focused | `useComputed()` |
