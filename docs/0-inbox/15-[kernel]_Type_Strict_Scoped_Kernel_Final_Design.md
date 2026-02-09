# Kernel v2 — Type-Strict Scoped Dispatch 최종 설계서

> 날짜: 2026-02-09
> 태그: kernel, scope, type-safety, dispatch, final
> 상태: Final Design
> 선행 문서: 10, 12, 13, 14번 inbox 문서의 모든 논의를 통합

---

## 0. 절대 원칙

1. **100% Type-Strict** — raw string은 컴파일 에러. `as` 캐스팅 0개. `unknown` 0개.
2. **100% Explicit** — 암묵적 동작 없음. scope, payload, effect 모두 명시적.
3. **DX 우선** — 타입이 사용자를 방해하면 안 된다. 복잡한 타입 주석을 수동으로 쓰지 않는다.

---

## 1. 핵심 모델: 등록이 곧 타입 선언

```
defineEffect    → EffectToken    (타입 + 런타임 참조)
defineContext   → ContextToken   (타입 + 런타임 참조)
defineScope     → ScopeToken     (타입 + 런타임 참조)
createKernel    → Kernel         (effect 목록으로 EffectMap 타입 조합)
defineCommand   → CommandFactory (타입이 확정된 dispatch용 팩토리)
```

**Zod처럼: 런타임 등록과 타입 선언이 동시에 일어난다.**

---

## 2. API 전체 흐름 (DX 관점)

### Step 1 — Effect 정의

```typescript
const NOTIFY = defineEffect("notify", (message: string) => {
  toast(message);
});

const TRACK = defineEffect("track", (event: AnalyticsEvent) => {
  analytics.send(event);
});
```

### Step 2 — Context 정의

```typescript
const DOM_ITEMS = defineContext("dom-items", (): DOMItem[] => queryDOMItems());
const USER_INFO = defineContext("user", (): User => getCurrentUser());
```

### Step 3 — Scope 정의

```typescript
const CARD_LIST  = defineScope("card-list");
const KANBAN     = defineScope("kanban-board");
const GLOBAL     = defineScope("__global__");  // 내장. Kernel이 제공.
```

### Step 4 — Kernel 생성 (effect → EffectMap 타입 조합)

```typescript
const kernel = createKernel({
  effects: { NOTIFY, TRACK },
});

// kernel.defineCommand의 핸들러 반환 타입에
// NOTIFY, TRACK이 valid key로 자동 포함된다.
```

### Step 5 — Command 정의

```typescript
// payload 없는 커맨드
const INCREMENT = kernel.defineCommand(
  "increment",
  (ctx: Ctx<AppState>) => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }),
);

// payload 있는 커맨드
const SET_COUNT = kernel.defineCommand(
  "set-count",
  (ctx: Ctx<AppState>, payload: number) => ({
    state: { ...ctx.state, count: payload },
  }),
);

// effect를 반환하는 커맨드
const SHOUT = kernel.defineCommand(
  "shout",
  (ctx: Ctx<AppState>) => ({
    state: { ...ctx.state, lastAction: "shout" },
    [NOTIFY]: "hello",       // ✅ 타입: string (자동 추론)
    [TRACK]: { name: "shout", ts: Date.now() },  // ✅ 타입: AnalyticsEvent
    // ntoify: "hello",      // ❌ 컴파일 에러: unknown key
  }),
);

// context inject
const NAVIGATE = kernel.defineCommand(
  "navigate",
  (ctx) => {
    const items = ctx[DOM_ITEMS];     // 타입: DOMItem[] (자동 추론)
    return { state: nextState(items) };
  },
  [inject(DOM_ITEMS)],
);
```

### Step 6 — Dispatch

```typescript
// payload 없음
dispatch(INCREMENT());                    // ✅

// payload 있음
dispatch(SET_COUNT(42));                  // ✅ payload: number 검증
dispatch(SET_COUNT("wrong"));             // ❌ 컴파일 에러: string ≠ number
dispatch(SET_COUNT());                    // ❌ 컴파일 에러: payload 필수

// scope 지정
dispatch(INCREMENT(), { scope: [CARD_LIST, KANBAN, GLOBAL] });
dispatch(INCREMENT(), { scope: ["card-list"] });  // ❌ 컴파일 에러: string ≠ ScopeToken

// raw string dispatch — 불가
dispatch({ type: "increment" });          // ❌ 컴파일 에러
```

### Step 7 — Scoped Command

```typescript
// 특정 scope에만 적용되는 커맨드
const ACTIVATE_CARD = kernel.defineCommand(
  "ACTIVATE",
  { scope: CARD_LIST },
  (ctx: Ctx<AppState>) => ({
    dispatch: EDIT_CARD(ctx.state.focus.focusedItemId),
  }),
);

// 글로벌 기본 ACTIVATE
const ACTIVATE = kernel.defineCommand(
  "ACTIVATE",
  (ctx: Ctx<AppState>) => ({
    state: { ...ctx.state, activated: true },
  }),
);
```

---

## 3. 타입 설계

### 3.1 Token Types (branded, phantom)

```typescript
declare const __commandBrand: unique symbol;
declare const __effectBrand: unique symbol;
declare const __scopeBrand: unique symbol;
declare const __contextBrand: unique symbol;

// Command는 Token이 아니라 Factory — 호출하면 Command 객체를 생성한다
export type CommandFactory<Type extends string, Payload = void> =
  Payload extends void
    ? () => Command<Type, void>
    : (payload: Payload) => Command<Type, Payload>;

export type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly [__commandBrand]: true;
};

export type EffectToken<Type extends string = string, Value = unknown> = {
  readonly type: Type;
  readonly [__effectBrand]: Value;
};

export type ScopeToken<Id extends string = string> = {
  readonly id: Id;
  readonly [__scopeBrand]: true;
};

export type ContextToken<Id extends string = string, Value = unknown> = {
  readonly id: Id;
  readonly [__contextBrand]: Value;
};
```

### 3.2 dispatch 시그니처 (단순)

```typescript
// dispatch는 단일 시그니처. 
// payload 검증은 CommandFactory가 담당. dispatch는 Command만 받는다.

export function dispatch<T extends string, P>(
  cmd: Command<T, P>,
  options?: { scope: ScopeToken[] },
): void;
```

오버로드 없음. `CommandFactory`가 `Command`를 만들고, `dispatch`는 받기만 한다.

### 3.3 EffectMap 자동 타입 (createKernel이 조합)

```typescript
// createKernel이 effects에서 EffectMap 타입을 추론
function createKernel<E extends Record<string, EffectToken>>(config: {
  effects: E;
}): Kernel<E>;

// Kernel<E>의 defineCommand가 반환하는 핸들러의 반환 타입:
type EffectMap<S, E extends Record<string, EffectToken>> = {
  state?: S;
  dispatch?: Command | Command[];
} & {
  [K in keyof E as E[K]["type"]]?: E[K] extends EffectToken<any, infer V> ? V : never;
};

// 풀어쓰면:
// createKernel({ effects: { NOTIFY, TRACK } })
// → EffectMap = {
//     state?: S;
//     dispatch?: Command;
//     notify?: string;      ← NOTIFY의 value 타입
//     track?: AnalyticsEvent; ← TRACK의 value 타입
//   }
```

핵심: **핸들러가 타입 주석을 쓰지 않아도 EffectMap이 자동으로 제한된다.**

### 3.4 Context 타입 주입 (inject가 ctx 타입을 확장)

```typescript
// inject로 전달된 ContextToken들이 ctx 타입에 자동 반영

kernel.defineCommand(
  "navigate",
  (ctx) => {
    ctx[DOM_ITEMS];    // DOMItem[]  — inject에서 추론
    ctx[USER_INFO];    // User       — inject에서 추론
    ctx["random"];     // ❌ 컴파일 에러 — index signature 없음
  },
  [inject(DOM_ITEMS, USER_INFO)],
);

// inject 시그니처:
function inject<T extends ContextToken[]>(
  ...tokens: T
): Interceptor<InjectResult<T>>;

type InjectResult<T extends ContextToken[]> = {
  [K in T[number] as K["id"]]: K extends ContextToken<any, infer V> ? V : never;
};
```

---

## 4. Scope & Bubbling 통합

### 4.1 Command에 scope 포함

```typescript
dispatch(ACTIVATE(), {
  scope: [CARD_LIST, KANBAN, GLOBAL],
});

// 내부:
// Command { type: "ACTIVATE", payload: void }
// + scope: [ScopeToken<"card-list">, ScopeToken<"kanban-board">, ScopeToken<"__global__">]
```

### 4.2 Dispatch 루프 (Kernel 내부)

```
for each scope in bubblePath:
  ┌─────────────────────────────────────────────┐
  │ 1. Run scope-level before-middleware         │
  │ 2. Find handler for command type at scope    │
  │ 3. If handler:                               │
  │    a. Run per-command interceptors (inject)   │
  │    b. Execute handler → result               │
  │    c. Run scope-level after-middleware        │
  │    d. null → continue (bubble)               │
  │    d. EffectMap → stop (handled)             │
  │ 4. No handler → next scope                   │
  └─────────────────────────────────────────────┘
```

### 4.3 Scoped Middleware

```typescript
kernel.use({
  id: "logger",
  scope: GLOBAL,                    // __global__ scope — 항상 실행
  before: (ctx) => { log(ctx); return ctx; },
});

kernel.use({
  id: "card-analytics",
  scope: CARD_LIST,                 // card-list scope에서만 실행
  after: (ctx) => { track(ctx); return ctx; },
});
```

### 4.4 OS가 하는 일

```typescript
// OS Sensor:
const bubblePath = buildBubblePath(focusPath, activeGroupId)
  .map(id => getScopeToken(id));    // string → ScopeToken 변환

dispatch(ACTIVATE(), { scope: bubblePath });
```

Kernel은 트리를 모른다. 배열을 순회할 뿐.

---

## 5. Registry 구조

### Before (현재: Flat, string-keyed)

```
commands: Map<string, CommandHandler>
effects:  Map<string, EffectHandler>
middleware: Middleware[]
```

### After (Scoped, Token-keyed)

```
scopedCommands:    Map<ScopeToken, Map<string, CommandHandler>>
scopedMiddleware:  Map<ScopeToken, Middleware[]>
effects:           Map<EffectToken, EffectHandler>
contexts:          Map<ContextToken, ContextProvider>
```

---

## 6. Transaction 구조

```typescript
type Transaction = {
  id: number;
  timestamp: number;
  command: Command;           // type-safe Command (Token 기반)
  bubblePath: ScopeToken[];   // 전체 순회 경로
  handlerScope: ScopeToken;   // 실제 매칭 scope
  effects: EffectMap | null;
  changes: StateDiff[];
  stateBefore: unknown;       // state는 앱마다 다르므로 unknown 유지
  stateAfter: unknown;
};
```

> `stateBefore/After`만 `unknown` — state 구조는 앱 레벨이므로 Kernel이 타입을 알 수 없다.
> 그 외 모든 필드는 type-safe.

---

## 7. 파일 구조 변경

```
packages/kernel/src/
├── tokens.ts        ← 신규: Token branded types 정의
├── createKernel.ts  ← 신규: createKernel (effects 조합 → EffectMap 타입)
├── registry.ts      ← 수정: scoped storage, Token-keyed maps
├── dispatch.ts      ← 수정: bubblePath 순회, Command<T,P> 시그니처
├── middleware.ts     ← 수정: scope-level middleware
├── context.ts       ← 수정: ContextToken 기반
├── transaction.ts   ← 수정: handlerScope, bubblePath 필드
├── store.ts         ← 변경 없음
└── index.ts         ← 수정: 새 API export
```

---

## 8. 전체 DX 예시 (End-to-End)

```typescript
import { createKernel, defineEffect, defineContext, defineScope, inject } from "@kernel";

// ── 1. Effect ──
const NOTIFY = defineEffect("notify", (msg: string) => toast(msg));
const LOG    = defineEffect("log", (entry: LogEntry) => logger.write(entry));

// ── 2. Context ──
const DOM_ITEMS = defineContext("dom-items", (): DOMItem[] => queryDOMItems());

// ── 3. Scope ──
const TODO_LIST  = defineScope("todo-list");
const KANBAN     = defineScope("kanban-board");

// ── 4. Kernel ──
const kernel = createKernel({
  effects: { NOTIFY, LOG },
});

// ── 5. Commands ──
const INCREMENT = kernel.defineCommand(
  "increment",
  (ctx: Ctx<AppState>) => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }),
);

const SET_COUNT = kernel.defineCommand(
  "set-count",
  (ctx: Ctx<AppState>, payload: number) => ({
    state: { ...ctx.state, count: payload },
    [NOTIFY]: `Count set to ${payload}`,     // ✅ string
    [LOG]: { action: "set-count", value: payload },  // ✅ LogEntry
    // ntoify: "hello",                      // ❌ 컴파일 에러
  }),
);

const ACTIVATE = kernel.defineCommand(
  "ACTIVATE",
  (ctx: Ctx<AppState>) => ({
    state: { ...ctx.state, activated: true },
  }),
);

// Scoped override
const ACTIVATE_TODO = kernel.defineCommand(
  "ACTIVATE",
  { scope: TODO_LIST },
  (ctx: Ctx<AppState>) => ({
    state: toggleDone(ctx.state),
  }),
);

// With context injection
const NAVIGATE = kernel.defineCommand(
  "navigate",
  (ctx) => {
    const items = ctx[DOM_ITEMS];   // DOMItem[] — 자동 추론
    return { state: navigate(ctx.state, items) };
  },
  [inject(DOM_ITEMS)],
);

// ── 6. Dispatch ──
dispatch(INCREMENT());                                           // ✅
dispatch(SET_COUNT(42));                                         // ✅
dispatch(SET_COUNT("wrong"));                                    // ❌
dispatch(ACTIVATE(), { scope: [TODO_LIST, KANBAN, GLOBAL] });   // ✅
dispatch({ type: "increment" });                                 // ❌

// ── 7. Scoped Middleware ──
kernel.use({
  id: "logger",
  scope: GLOBAL,
  before: (ctx) => { console.log(ctx.command); return ctx; },
});
```

---

## 9. 검증 기준

| # | 테스트 | 현재 | 목표 |
|---|--------|------|------|
| 1 | `dispatch({ type: "typo" })` | ✅ 컴파일 통과 | ❌ 에러 |
| 2 | `dispatch(SET_COUNT("wrong"))` | ✅ 컴파일 통과 | ❌ 에러 |
| 3 | `{ ntoify: "hello" }` in EffectMap | ✅ 컴파일 통과 | ❌ 에러 |
| 4 | `ctx["nonexistent"]` | ✅ 컴파일 통과 | ❌ 에러 |
| 5 | `inject("raw-string")` | ✅ 컴파일 통과 | ❌ 에러 |
| 6 | `{ scope: ["raw"] }` | ✅ 컴파일 통과 | ❌ 에러 |
| 7 | `as` 캐스팅 사용 횟수 | 10+ | **0** |
| 8 | 핸들러에 수동 타입 주석 필요 | 매번 | **state 제네릭만** |
| 9 | IDE effect key 자동완성 | ❌ | ✅ |
| 10 | payload 타입 IDE 힌트 | ❌ | ✅ |

---

## 10. Phase 1 제외 (YAGNI)

| 기능 | 이유 |
|------|------|
| `bubble: true` (처리 후 계속 전파) | 실제 필요 케이스 검증 후 |
| scope별 keybinding | 글로벌 keybinding + scoped handler로 충분 |
| state 타입을 Kernel이 추적 | state는 앱 소유. `Ctx<S>` 제네릭으로 충분 |

---

## 11. 요약

```
┌──────────── Before ─────────────┐    ┌──────────── After ──────────────┐
│                                  │    │                                  │
│ defineCommand("increment", fn)   │    │ const INCREMENT =                │
│ defineEffect("notify", fn)       │    │   kernel.defineCommand(...)      │
│ dispatch({ type: "incrment" }) ✅│    │ dispatch(INCREMENT())         ✅ │
│                                  │    │ dispatch({ type: "x" })      ❌ │
│ payload: unknown                 │    │ payload: number (추론)          │
│ ctx["dom-items"] as DOMItem[]    │    │ ctx[DOM_ITEMS] → DOMItem[]     │
│ { ntoify: "hello" } ✅           │    │ { ntoify: "hello" } ❌         │
│ Map<string, Handler>             │    │ Map<ScopeToken, Map<...>>      │
│                                  │    │                                  │
│ 타입 안전성: 2/10               │    │ 타입 안전성: 10/10             │
└──────────────────────────────────┘    └──────────────────────────────────┘
```
