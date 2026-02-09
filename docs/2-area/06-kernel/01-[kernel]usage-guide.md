# Kernel Usage Guide

> 날짜: 2026-02-10
> 태그: kernel, usage, api
> 상태: v2 — Scope Tree Auto Bubbling, Per-command Inject 반영

---

## 1. Quick Start

```typescript
import { createKernel, defineScope, GLOBAL } from "@kernel";

// 1. 커널 생성 — 초기 상태와 함께
const kernel = createKernel<{ count: number }>({ count: 0 });

// 2. 이펙트 정의 — DOM 부수효과 선언
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
  console.log(msg);
});

// 3. 커맨드 정의 — 순수 핸들러
const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  [NOTIFY]: `count is now ${ctx.state.count + 1}`,
}));

// 4. 디스패치
kernel.dispatch(INCREMENT());

kernel.getState(); // { count: 1 }
```

**핵심 흐름:**

```
dispatch(Command) → handler(ctx)(payload) → { state, ...effects } → execute effects
```

---

## 2. createKernel

`createKernel<S>(initialState)` — 독립적인 커널 인스턴스를 생성한다.

```typescript
const kernel = createKernel<AppState>({ os: initialOSState });
```

**반환값:** Root Group API + Store API + Inspector API + React Hook

| 카테고리 | API |
|---|---|
| Group | `defineCommand`, `defineEffect`, `defineContext`, `group`, `dispatch`, `use`, `reset` |
| Store | `getState`, `setState`, `subscribe` |
| React | `useComputed` |
| Inspector | `getTransactions`, `getLastTransaction`, `clearTransactions`, `travelTo` |
| Scope Tree | `getScopePath`, `getScopeParent` |

**특성:**
- 클로저 기반. 싱글톤 없음. `globalThis` 없음
- 각 `createKernel()` 호출은 완전히 독립적인 인스턴스를 생성
- HMR 안전 — 모듈 리로드 시 새 커널이 생성될 뿐

```typescript
// 커널 인스턴스는 완전히 독립적
const k1 = createKernel<{ value: number }>({ value: 1 });
const k2 = createKernel<{ value: number }>({ value: 2 });

k1.setState(() => ({ value: 99 }));
k1.getState().value; // 99
k2.getState().value; // 2 — 영향 없음
```

---

## 3. defineCommand

커맨드를 정의하고 `CommandFactory`를 반환한다.

### 3.1 기본 (payload 없음)

```typescript
const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));

kernel.dispatch(INCREMENT()); // CommandFactory() → Command → dispatch
```

### 3.2 payload 있음

```typescript
const SET_COUNT = kernel.defineCommand(
  "SET_COUNT",
  (ctx) => (payload: number) => ({
    state: { ...ctx.state, count: payload },
  }),
);

kernel.dispatch(SET_COUNT(42));
SET_COUNT("wrong"); // ❌ 컴파일 에러 — string ≠ number
```

### 3.3 핸들러 시그니처 (Context-First Curried)

```typescript
(ctx: { state: S, ...injected }) => (payload: P) => EffectMap | void
```

- **ctx**: 현재 상태 + inject된 컨텍스트 값 (읽기 전용)
- **payload**: 커맨드에 전달되는 데이터
- **반환값**: `{ state?, [EffectToken]?, dispatch? }` 또는 `void`/`undefined`(버블링)

### 3.4 핸들러에서 null/undefined 반환 = 버블링

```typescript
const ACTION = kernel.defineCommand("OS_ACTION", (ctx) => () => {
  if (!ctx.state.os.activeZoneId) return; // undefined → 다음 scope로 버블링
  return { state: nextState };            // EffectMap → 처리 완료, 버블 중단
});
```

### 3.5 Per-command Inject Tokens (3인자 형태)

Group-level inject 외에 개별 커맨드에 직접 컨텍스트를 주입할 수 있다.

```typescript
const DOM_ITEMS = kernel.defineContext("DOM_ITEMS", () => queryDOMItems());
const ZONE_CONFIG = kernel.defineContext("ZONE_CONFIG", () => getZoneConfig());

// 3인자: (type, tokens[], handler)
const NAVIGATE = kernel.defineCommand(
  "OS_NAVIGATE",
  [DOM_ITEMS, ZONE_CONFIG],
  (ctx) => (payload: { direction: "up" | "down" }) => {
    const items: string[] = ctx.DOM_ITEMS;
    const config = ctx.ZONE_CONFIG;
    // ...
    return { state: nextState };
  },
);
```

Group inject와 per-command inject는 **병합**된다. 두 곳 모두에서 선언된 토큰이 합쳐져서 핸들러 ctx에 주입된다.

### 3.6 HMR 안전 — 재등록은 덮어쓰기

```typescript
// 같은 타입으로 재등록해도 에러 없음 (silent overwrite)
const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));
```

---

## 4. defineEffect

이펙트 핸들러를 등록하고 `EffectToken`을 반환한다.

```typescript
const FOCUS = kernel.defineEffect("focus", (itemId: string) => {
  document.getElementById(itemId)?.focus();
});

const SCROLL = kernel.defineEffect("scroll", (itemId: string) => {
  document.getElementById(itemId)?.scrollIntoView({ block: "nearest" });
});

const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
  toast(msg);
});
```

### 4.1 커맨드에서 이펙트 사용

`EffectToken`을 computed key로 사용한다. 타입이 자동 검증된다.

```typescript
const NAVIGATE = kernel.defineCommand("NAVIGATE", (ctx) => () => ({
  state: nextState,
  [FOCUS]: targetId,     // ✅ string — EffectToken<"focus", string>
  [SCROLL]: targetId,    // ✅ string
  [NOTIFY]: 42,          // ❌ 컴파일 에러 — number ≠ string
}));
```

### 4.2 내장 이펙트 키

| 키 | 동작 |
|---|---|
| `state` | `setState(value)` — 상태 트리 교체 (항상 먼저 실행) |
| `dispatch` | `dispatch(cmd)` — 재-디스패치 (큐에 추가) |

```typescript
const RESET_THEN_INCREMENT = kernel.defineCommand(
  "RESET_THEN_INCREMENT",
  (ctx) => () => ({
    state: { ...ctx.state, count: 0 },
    dispatch: INCREMENT(),  // 현재 커맨드 처리 후 큐에서 실행
  }),
);
```

### 4.3 이펙트 실행은 try-catch로 보호

개별 이펙트 실패가 나머지 이펙트 실행을 차단하지 않는다.

---

## 5. defineContext + group inject

핸들러에 외부 데이터를 주입하는 메커니즘.

### 5.1 컨텍스트 정의

```typescript
const NOW = kernel.defineContext("NOW", () => Date.now());
const USER = kernel.defineContext("USER", () => ({ name: "Alice", role: "admin" }));
```

- 프로바이더는 **디스패치마다 새로 호출** (캐싱 없음, lazy)
- 반환값: `ContextToken<Id, Value>` — wrapper object `{ __id }`

### 5.2 Group에서 inject 선언

```typescript
const g = kernel.group({ inject: [NOW, USER] });

const USE_CONTEXT = g.defineCommand("USE_CONTEXT", (ctx) => () => {
  ctx.NOW;           // number — 자동 추론 ✅
  ctx.USER.name;     // string — 자동 추론 ✅
  ctx.USER.role;     // string — 자동 추론 ✅
  ctx.state;         // AppState — 항상 존재 ✅
  return { state: ctx.state };
});
```

### 5.3 inject는 per-group

inject되지 않은 그룹에서 정의된 커맨드는 해당 컨텍스트에 접근하지 않는다. 프로바이더도 호출되지 않는다.

```typescript
let providerCalls = 0;
const EXPENSIVE = kernel.defineContext("EXPENSIVE", () => {
  providerCalls++;  // inject된 그룹의 커맨드만 이 함수를 호출
  return computeExpensiveData();
});

const gWithCtx = kernel.group({ inject: [EXPENSIVE] });
const gWithout = kernel; // root group — inject 없음

// gWithout에서 정의된 커맨드 → EXPENSIVE 프로바이더 호출 안 됨
kernel.defineCommand("CHEAP", (ctx) => () => ({ state: ctx.state }));
kernel.dispatch(CHEAP());
// providerCalls === 0

// gWithCtx에서 정의된 커맨드 → EXPENSIVE 프로바이더 호출
const NEEDS_CTX = gWithCtx.defineCommand("NEEDS_CTX", (ctx) => () => ({
  state: { ...ctx.state, data: ctx.EXPENSIVE },
}));
kernel.dispatch(NEEDS_CTX());
// providerCalls === 1
```

---

## 6. Group & Scope

### 6.1 Scope 생성

```typescript
import { defineScope } from "@kernel";

const TODO_LIST = defineScope("TODO_LIST");
const SIDEBAR = defineScope("SIDEBAR");
```

### 6.2 Scoped Group 생성

```typescript
const todoGroup = kernel.group({
  scope: TODO_LIST,
  inject: [DOM_ITEMS, ZONE_CONFIG],
});

const TOGGLE = todoGroup.defineCommand(
  "TOGGLE",
  (ctx) => (id: string) => ({
    state: produce(ctx.state, (draft) => {
      draft.todos[id].done = !draft.todos[id].done;
    }),
  }),
);

// TOGGLE("abc") → Command { type: "TOGGLE", scope: [TODO_LIST] }
```

- Group에서 정의된 커맨드는 **자동으로 scope가 부여**됨
- scope가 없는 커맨드(`kernel.defineCommand`)는 `GLOBAL`에 등록

### 6.3 Scope Tree Auto Bubbling

`group()` 중첩이 곧 **트리 선언**이다. 커널이 부모-자식 관계를 자동으로 기록하고, dispatch 시 bubble path를 자동 생성한다.

```typescript
const kernel = createKernel(state);                  // GLOBAL
const app = kernel.group({ scope: APP });             // parent: GLOBAL
const sidebar = app.group({ scope: SIDEBAR });        // parent: APP
const todoList = sidebar.group({ scope: TODO_LIST }); // parent: SIDEBAR
```

```
Scope Tree:
GLOBAL
└── APP
    └── SIDEBAR
        └── TODO_LIST
```

scoped group에서 정의된 커맨드를 dispatch하면, 커널이 **자동으로 트리를 걸어올라가며** bubble path를 생성한다.

```typescript
const TOGGLE = todoList.defineCommand("TOGGLE", handler);

// dispatch만 하면 된다 — scope chain 수동 조립 불필요
kernel.dispatch(TOGGLE("abc"));
// → 자동 생성: [TODO_LIST, SIDEBAR, APP, GLOBAL]
// → TODO_LIST에서 handler 검색 → 있으면 실행
// → 없으면 SIDEBAR → APP → GLOBAL 순으로 버블링
```

**자동 확장 규칙:**

| 케이스 | 입력 | 동작 |
|---|---|---|
| scope 없음 | `dispatch(INCREMENT())` | `[GLOBAL]` fallback |
| 단일 scope (트리에 등록됨) | `dispatch(TOGGLE())` | 자동 확장 → `[TODO_LIST, SIDEBAR, APP, GLOBAL]` |
| 단일 scope (트리에 없음) | `dispatch(ORPHAN_CMD())` | `[ORPHAN]` + GLOBAL fallback |
| 다중 scope (수동 지정) | `dispatch(cmd, { scope: [A, B] })` | 그대로 사용 (오버라이드) |

### 6.4 Scope Tree 조회 API

```typescript
// 특정 scope의 부모 조회
kernel.getScopeParent(TODO_LIST); // ScopeToken<"SIDEBAR"> 또는 null

// 특정 scope의 전체 bubble path 조회
kernel.getScopePath(TODO_LIST);   // [TODO_LIST, SIDEBAR, APP, GLOBAL]
kernel.getScopePath(GLOBAL);      // [GLOBAL]
```

### 6.5 핸들러에서 null/undefined 반환 = 버블링 계속

```typescript
// GLOBAL: 기본 no-op
const ACTION = kernel.defineCommand("OS_ACTION", () => () => undefined);

// Zone scope: 오버라이드
const demoGroup = kernel.group({ scope: DEMO_SCOPE });
demoGroup.defineCommand("OS_ACTION", (ctx) => () => ({
  state: produce(ctx.state, (draft) => {
    draft.lastAction = ctx.state.os.focus.focusedItemId;
  }),
}));

// dispatch만 하면 자동 버블링
kernel.dispatch(ACTION());
// → DEMO_SCOPE에서 정의된 커맨드가 아니므로 GLOBAL handler 실행
```

### 6.6 수동 Scope Chain 오버라이드

OS 레이어에서 동적으로 scope chain을 계산해야 하는 경우(포커스 위치에 따라 경로가 달라지는 경우), `dispatch`의 `options.scope`로 오버라이드할 수 있다.

```typescript
// OS Sensor에서 동적 bubble path 계산
const dynamicPath = osBuildBubblePath(focusedZoneId);
kernel.dispatch(ACTION(), { scope: dynamicPath });
// → 자동 확장 건너뜀 (다중 scope이므로 그대로 사용)
```

### 6.7 Effect Bubbling

이펙트 핸들러도 scope chain을 따라 resolve된다. 가장 가까운 scope의 핸들러가 실행된다.

```typescript
// GLOBAL: 기본 toast
kernel.defineEffect("TOAST", (msg: string) => systemToast(msg));

// Widget scope: 미니 팝업으로 오버라이드
const widgetGroup = kernel.group({ scope: TODO_WIDGET });
widgetGroup.defineEffect("TOAST", (msg: string) => miniPopup(msg));
```

---

## 7. Middleware

### 7.1 등록

```typescript
kernel.use({
  id: "LOGGER",
  scope: GLOBAL,  // 생략 시 GLOBAL
  before: (ctx) => {
    console.group(`[kernel] ${ctx.command.type}`);
    return ctx;
  },
  after: (ctx) => {
    console.groupEnd();
    return ctx;
  },
});
```

### 7.2 실행 순서 (Onion Pattern)

```
A:before → B:before → C:before → [handler] → C:after → B:after → A:after
```

```typescript
const kernel = createKernel<{ count: number }>({ count: 0 });
const log: string[] = [];

kernel.use({
  id: "A",
  before: (ctx) => { log.push("A:before"); return ctx; },
  after:  (ctx) => { log.push("A:after"); return ctx; },
});
kernel.use({
  id: "B",
  before: (ctx) => { log.push("B:before"); return ctx; },
  after:  (ctx) => { log.push("B:after"); return ctx; },
});

// 실행 후: ["A:before", "B:before", "B:after", "A:after"]
```

### 7.3 커맨드 변환 (Before)

```typescript
kernel.use({
  id: "ALIAS",
  before: (ctx) => {
    if (ctx.command.type === "ALIAS_ME") {
      return { ...ctx, command: { ...ctx.command, type: "ACTUAL_HANDLER" } };
    }
    return ctx;
  },
});
```

### 7.4 이펙트 변환 (After)

```typescript
kernel.use({
  id: "UPPERCASE",
  after: (ctx) => {
    if (ctx.effects?.NOTIFY) {
      return {
        ...ctx,
        effects: {
          ...ctx.effects,
          NOTIFY: (ctx.effects.NOTIFY as string).toUpperCase(),
        },
      };
    }
    return ctx;
  },
});
```

### 7.5 같은 id로 재등록 = 덮어쓰기 (Dedup)

```typescript
kernel.use({ id: "logger", before: v1Handler }); // v1 등록
kernel.use({ id: "logger", before: v2Handler }); // v1을 v2로 교체
// → v2Handler만 실행됨
```

---

## 8. useComputed (React Hook)

`useSyncExternalStore` 기반. selector로 파생 상태를 구독한다.

```typescript
function TodoItem({ id }: { id: string }) {
  const isDone = kernel.useComputed((s) => s.todos[id].done);
  const title = kernel.useComputed((s) => s.todos[id].title);

  return <li data-done={isDone}>{title}</li>;
}
```

```typescript
function useFocused(zoneId: string, itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.focusedItemId === itemId,
  );
}
```

---

## 9. Store API

```typescript
// 읽기
kernel.getState();                    // S

// 쓰기 (디스패치 파이프라인 우회 — 테스트/초기화 용도)
kernel.setState((prev) => ({ ...prev, count: 0 }));

// 구독
const unsubscribe = kernel.subscribe(() => {
  console.log("state changed:", kernel.getState());
});
unsubscribe();

// 리셋 (상태 초기화 + 트랜잭션 로그 클리어)
kernel.reset({ count: 0 });
```

---

## 10. Inspector & Time Travel

### 10.1 트랜잭션 조회

```typescript
const txs = kernel.getTransactions(); // readonly Transaction[]
const last = kernel.getLastTransaction(); // Transaction | undefined
```

```typescript
type Transaction = {
  id: number;
  timestamp: number;
  command: { type: string; payload: unknown };
  handlerScope: string;      // 실제 매칭된 scope
  bubblePath: string[];      // 순회한 전체 scope 경로
  effects: Record<string, unknown> | null;
  changes: StateDiff[];      // 상태 변경 diff
  stateBefore: unknown;
  stateAfter: unknown;
};

type StateDiff = {
  path: string;   // e.g. "user.name", "items[3]", "meta.nested.x"
  from: unknown;
  to: unknown;
};
```

### 10.2 트랜잭션 예시

```typescript
kernel.dispatch(SET_COUNT(42));
const tx = kernel.getLastTransaction()!;

tx.command.type;    // "SET_COUNT"
tx.handlerScope;    // "GLOBAL"
tx.bubblePath;      // ["GLOBAL"]
tx.changes;         // [{ path: "count", from: 0, to: 42 }]
```

### 10.3 Time Travel

```typescript
const txs = kernel.getTransactions();
kernel.travelTo(txs[0].id);  // 첫 번째 트랜잭션 시점으로 상태 복원
```

### 10.4 클리어

```typescript
kernel.clearTransactions();
```

트랜잭션 로그는 최대 200개로 캡 (FIFO).

---

## 11. 타입 추론 패턴

Kernel의 타입 시스템은 **수동 타입 어노테이션 없이** 전체 체인이 추론되도록 설계되었다.

### 11.1 ctx.state 자동 추론

```typescript
const kernel = createKernel<{ count: number; name: string }>({
  count: 0, name: "",
});

kernel.defineCommand("INC", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  //                      ^^^^^ number — createKernel<S>에서 추론
}));
```

### 11.2 payload 타입 추론

```typescript
kernel.defineCommand("SET", (ctx) => (payload: number) => ({
  state: { ...ctx.state, count: payload },
  //                             ^^^^^^^ number — payload 어노테이션에서 추론
}));
```

### 11.3 inject 컨텍스트 타입 추론

```typescript
const NOW = kernel.defineContext("NOW", (): number => Date.now());
const USER = kernel.defineContext("USER", () => ({ name: "Alice" }));

const g = kernel.group({ inject: [NOW, USER] });

g.defineCommand("CMD", (ctx) => () => {
  ctx.NOW;         // number
  ctx.USER.name;   // string
  ctx.state.count; // number
  return { state: ctx.state };
});
```

### 11.4 EffectToken 타입 추론

```typescript
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {});

kernel.defineCommand("CMD", (ctx) => () => ({
  state: ctx.state,
  [NOTIFY]: "hello",   // ✅ string
  [NOTIFY]: 42,        // ❌ 컴파일 에러
}));
```

---

## 12. 실전 패턴: OS 레이어에서의 사용

### 12.1 앱 커널 인스턴스 (싱글톤 모듈)

```typescript
// src/os-new/kernel.ts
import { createKernel } from "@kernel";
import type { OSState } from "./state/OSState";

export interface AppState {
  os: OSState;
}

export const kernel = createKernel<AppState>({ os: initialOSState });
```

### 12.2 이펙트 등록 (DOM 부수효과)

```typescript
// src/os-new/4-effects/index.ts
import { kernel } from "../kernel";

export const FOCUS_EFFECT = kernel.defineEffect("focus", (itemId: string) => {
  const el = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement | null;
  el?.focus({ preventScroll: true });
});

export const SCROLL_EFFECT = kernel.defineEffect("scroll", (itemId: string) => {
  const el = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement | null;
  el?.scrollIntoView({ block: "nearest" });
});
```

### 12.3 커맨드 등록 (순수 로직)

```typescript
// src/os-new/3-commands/navigate.ts
import { produce } from "immer";
import { kernel } from "../kernel";
import { FOCUS_EFFECT, SCROLL_EFFECT } from "../4-effects";

export const NAVIGATE = kernel.defineCommand(
  "OS_NAVIGATE",
  (ctx) => (payload: { direction: "up" | "down" }) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return; // 버블링

    const zone = ctx.state.os.focus.zones[activeZoneId];
    const targetId = resolveNextItem(zone, payload.direction);

    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.zones[activeZoneId]!.focusedItemId = targetId;
      }),
      [FOCUS_EFFECT]: targetId,
      [SCROLL_EFFECT]: targetId,
    };
  },
);
```

### 12.4 React 컴포넌트에서 사용

```typescript
// Dispatch
function KeyboardHandler() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") kernel.dispatch(NAVIGATE({ direction: "down" }));
      if (e.key === "ArrowUp") kernel.dispatch(NAVIGATE({ direction: "up" }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

// 파생 상태 구독
function useFocused(zoneId: string, itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.focusedItemId === itemId,
  );
}
```

---

## 13. Re-entrance (디스패치 안에서 디스패치)

이펙트 핸들러나 `dispatch` 이펙트 키를 통해 디스패치 안에서 디스패치가 가능하다.

```typescript
// 방법 1: dispatch 이펙트 키
kernel.defineCommand("RESET_THEN_INC", (ctx) => () => ({
  state: { ...ctx.state, count: 0 },
  dispatch: INCREMENT(),  // 큐에 추가, 현재 처리 완료 후 실행
}));

// 방법 2: 배열로 여러 커맨드
kernel.defineCommand("BATCH", (ctx) => () => ({
  state: ctx.state,
  dispatch: [CMD_A(), CMD_B(), CMD_C()],
}));
```

큐 기반이므로 안전하다. 현재 커맨드 처리가 완료된 후 순차적으로 실행된다.

---

## 14. Anti-patterns

```typescript
// ❌ raw string으로 dispatch — branded type에 의해 차단됨
dispatch({ type: "INCREMENT", payload: undefined });

// ❌ 핸들러 안에서 직접 부수효과
kernel.defineCommand("BAD", (ctx) => () => {
  document.getElementById("x")?.focus(); // ❌ 부수효과 금지
  return { state: ctx.state };
});

// ✅ 이펙트로 선언
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: ctx.state,
  [FOCUS]: "x",  // ✅ 이펙트 핸들러에서 실행
}));

// ❌ dispatch 오버로딩 — 존재하지 않음
dispatch("INCREMENT");           // ❌
dispatch("SET_COUNT", 42);       // ❌

// ✅ CommandFactory 패턴
dispatch(INCREMENT());           // ✅
dispatch(SET_COUNT(42));         // ✅
```
