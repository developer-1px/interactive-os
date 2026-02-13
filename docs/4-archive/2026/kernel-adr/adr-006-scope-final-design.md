# Scope & Bubbling — 최종 설계서

> 날짜: 2026-02-09
> 태그: kernel, scope, bubbling, dispatch
> 상태: Approved Design
> 선행: 10-[kernel]\_Scope\_and\_Bubbling\_Proposal.md, 12-[kernel]\_Scope\_Implementation\_Design\_Decisions.md
> 결정: Decision 1~3 확정 후 작성

---

## 0. 확정된 설계 결정

| # | 질문 | 결정 | 근거 |
|---|------|------|------|
| 1 | Scope 전달 방식 | **Explicit** — command에 `scope` 필드로 bubblePath 포함 | 결정론적 dispatch, LLM 가독성, Transaction replay |
| 2 | Scope Tree 관리 | **OS 책임** — Kernel은 배열 순회만 | Kernel은 DOM 구조를 모름. `buildBubblePath()`가 이미 OS에 존재 |
| 3 | Middleware 실행 | **Scope-level** — handler와 동일한 bubbling 모델 | scope 동작의 일관성. 하나의 추상화로 handler + middleware 통합 |

---

## 1. 핵심 모델

### 1.1 Scope = Kernel의 유일한 계층 개념

```
Scope: 문자열 ID. 계층은 Kernel이 모른다 — OS가 bubblePath 배열로 넘긴다.
"__global__": 루트 scope. 항상 bubblePath의 마지막. 현재의 전역 등록과 동일.
```

Kernel이 아는 것: **"scope 문자열 배열을 받으면, 앞에서부터 순회하며 handler/middleware를 찾는다."**
Kernel이 모르는 것: 트리 구조, DOM, 포커스, Zone.

### 1.2 Scope 단위 = handler + middleware 묶음

각 scope는 자체 handler와 middleware를 가질 수 있다:

```
┌─ scope "card-list" ──────────────────────────┐
│  middleware: [analytics-tracker]              │
│  handlers:   { ACTIVATE: editCard, COPY: ... }│
└──────────────────────────────────────────────┘

┌─ scope "__global__" ─────────────────────────┐
│  middleware: [logger, devtools]               │
│  handlers:   { ACTIVATE: osDefault, ... }    │
└──────────────────────────────────────────────┘
```

### 1.3 Dispatch 흐름

```
dispatch({
  type: "ACTIVATE",
  scope: ["card-list", "col-1", "kanban-board", "__global__"]
})

for each scope in bubblePath:
  ┌─────────────────────────────────────────────┐
  │ 1. Run scope before-middleware               │
  │ 2. Find handler for command type             │
  │ 3. If handler found:                         │
  │    a. Run per-command interceptors (inject)   │
  │    b. Execute handler → result               │
  │    c. Run scope after-middleware              │
  │    d. result === null → continue (bubble)     │
  │    d. result === EffectMap → stop (handled)   │
  │ 4. If no handler → skip to next scope        │
  └─────────────────────────────────────────────┘
```

---

## 2. Command 타입 변경

### Before

```typescript
type Command = {
  type: string;
  payload?: unknown;
};
```

### After

```typescript
type Command = {
  type: string;
  payload?: unknown;
  scope?: string[];  // bubblePath. 생략 시 ["__global__"] fallback.
};
```

`scope`는 **optional**이다:
- 지정 시: 해당 경로를 순회
- 생략 시: `["__global__"]`만 순회 (현재 동작과 동일 — 하위 호환)

---

## 3. Registry 변경

### Before — Flat Map

```typescript
const commands = new Map<string, CommandHandler>();
// "ACTIVATE" → handler
```

### After — Scoped Map

```typescript
const scopedCommands = new Map<string, Map<string, CommandHandler>>();
// scope → type → handler
// "card-list" → "ACTIVATE" → editCardHandler
// "__global__" → "ACTIVATE" → osDefaultHandler

const scopedMiddleware = new Map<string, Middleware[]>();
// scope → middleware[]
// "card-list" → [analytics]
// "__global__" → [logger, devtools]
```

### 3.1 API — defineCommand 변경

```typescript
// 글로벌 (현재와 동일, 하위 호환)
defineCommand("ACTIVATE", handler);
// → scopedCommands.get("__global__").set("ACTIVATE", handler)

// Scoped
defineCommand("ACTIVATE", { scope: "card-list" }, handler);
// → scopedCommands.get("card-list").set("ACTIVATE", handler)

// Scoped + interceptors
defineCommand("ACTIVATE", { scope: "card-list" }, handler, [inject("card-data")]);
```

시그니처:

```typescript
function defineCommand<S = unknown>(
  id: string,
  handler: CommandHandler<S>,
  interceptors?: Middleware[],
): void;

function defineCommand<S = unknown>(
  id: string,
  options: { scope: string },
  handler: CommandHandler<S>,
  interceptors?: Middleware[],
): void;
```

### 3.2 API — use 변경

```typescript
// 글로벌 (현재와 동일, 하위 호환)
use({ id: "logger", before: ..., after: ... });
// → scopedMiddleware.get("__global__").push(...)

// Scoped
use({ id: "card-analytics", scope: "card-list", after: ... });
// → scopedMiddleware.get("card-list").push(...)
```

### 3.3 API — removeScopedCommand (새로운 API)

```typescript
// 동적 scope 해제 시 (Zone 언마운트)
removeScopedCommand("ACTIVATE", "card-list");
removeScopedMiddleware("card-analytics", "card-list");
```

---

## 4. dispatch.ts 변경

### processCommand — Before vs After

**Before (현재):**
```typescript
function processCommand(cmd) {
  const middlewareCtx = { command: cmd, state, ... };
  middlewareCtx = runBeforeChain(middlewareCtx, perCommand);
  const handler = getCommand(cmd.type);
  if (handler) { middlewareCtx.effects = handler(ctx, payload); }
  middlewareCtx = runAfterChain(middlewareCtx, perCommand);
  executeEffects(middlewareCtx.effects, store);
  recordTransaction(...);
}
```

**After (제안):**
```typescript
function processCommand(cmd) {
  const bubblePath = cmd.scope ?? ["__global__"];
  const stateBefore = store.getState();

  let result: EffectMap | null = null;
  let handlerScope: string = "unknown";

  for (const scope of bubblePath) {
    // 1. scope before-middleware
    let middlewareCtx = buildMiddlewareContext(cmd, stateBefore);
    middlewareCtx = runScopeBeforeChain(middlewareCtx, scope);

    // 2. handler lookup
    const handler = getScopedCommand(middlewareCtx.command.type, scope);
    if (!handler) continue;

    // 3. per-command interceptors (inject 등)
    const interceptors = getInterceptors(middlewareCtx.command.type);
    if (interceptors) {
      middlewareCtx = runBeforeChain(middlewareCtx, interceptors);
    }

    // 4. execute handler
    const ctx = { state: middlewareCtx.state, ...middlewareCtx.injected };
    result = handler(ctx, middlewareCtx.command.payload);

    // 5. scope after-middleware
    middlewareCtx.effects = result;
    middlewareCtx = runScopeAfterChain(middlewareCtx, scope);
    result = middlewareCtx.effects;

    // 6. bubble or stop
    if (result === null) continue;  // 패스 → 다음 scope
    handlerScope = scope;
    break;                          // 처리됨 → 중단
  }

  // 7. execute effects
  if (result) executeEffects(result, store);

  // 8. record transaction
  const stateAfter = store.getState();
  recordTransaction(cmd, handlerScope, result, stateBefore, stateAfter, bubblePath);
}
```

---

## 5. Transaction 변경

### Before

```typescript
type Transaction = {
  id: number;
  command: Command;
  handlerType: "handler" | "command" | "unknown";
  effects: EffectMap | null;
  ...
};
```

### After

```typescript
type Transaction = {
  id: number;
  command: Command;           // scope 포함
  handlerScope: string;       // 실제로 매칭된 scope
  bubblePath: string[];       // 전체 순회 경로
  effects: EffectMap | null;
  ...
};
```

`handlerType` → `handlerScope`로 대체. "handler"/"command" 구분은 `defineHandler` 제거로 불필요.

---

## 6. 하위 호환성

| 현재 API | Scope 도입 후 | 동작 |
|----------|-------------|------|
| `defineCommand("X", handler)` | 그대로 | `__global__` scope에 등록 |
| `use({ id, before, after })` | 그대로 | `__global__` scope에 등록 |
| `dispatch({ type: "X" })` | 그대로 | `scope: ["__global__"]`로 fallback |
| `inject("ctx-id")` | 그대로 | per-command interceptor로 동작 |

**기존 코드 수정 없이 동작한다.** scope를 쓰고 싶은 곳만 점진적으로 추가.

---

## 7. OS 레이어 연동

### Sensor → dispatch

```typescript
// OS Sensor (keyboard pipeline)
function handleKeyDown(e: KeyboardEvent) {
  const command = resolveKeybinding(e);        // Phase 1: key → command (flat)
  const bubblePath = buildBubblePath(           // OS가 계산
    focusPath, activeGroupId
  );
  dispatch({                                    // Phase 2: command → handler (scoped)
    type: command.type,
    payload: command.payload,
    scope: bubblePath,
  });
}
```

### Zone 마운트 → scoped handler 등록

```typescript
// OS FocusGroup
function FocusGroup({ id, onAction }) {
  useEffect(() => {
    if (onAction) {
      defineCommand("ACTIVATE", { scope: id }, (ctx, payload) => ({
        dispatch: onAction,
      }));
    }
    return () => removeScopedCommand("ACTIVATE", id);
  }, [id, onAction]);
}
```

---

## 8. Kernel 변경 파일 목록

```
packages/kernel/src/
├── registry.ts      ← 수정: scopedCommands + scopedMiddleware 저장소
├── dispatch.ts      ← 수정: bubblePath 순회 루프
├── middleware.ts     ← 수정: runScopeBeforeChain / runScopeAfterChain 추가
├── transaction.ts   ← 수정: handlerScope, bubblePath 필드 추가
├── store.ts         ← 변경 없음
├── context.ts       ← 변경 없음
└── index.ts         ← 수정: 새 API export (removeScopedCommand 등)
```

신규 파일 없음. Scope tree 관리 코드는 Kernel에 추가하지 않음.

---

## 9. Phase 1 제외 항목 (YAGNI)

| 기능 | 이유 | 도입 시점 |
|------|------|----------|
| `bubble: true` (처리 후 계속 전파) | 실제 필요 케이스 검증 후 | Phase 2 |
| scope별 keybinding | 글로벌 keybinding + scoped handler로 충분 | Phase 2 |
| scoped handler의 per-command interceptor | 1차에서는 ctx에서 직접 읽기 | Phase 2 |
| scope별 state slice 자동 주입 | ctx.state가 전체 state → 핸들러가 직접 접근 | Phase 2 |

---

## 10. 요약

```
┌──────────── 변경 전 ────────────┐     ┌──────────── 변경 후 ────────────┐
│                                 │     │                                 │
│  dispatch(cmd)                  │     │  dispatch(cmd + scope[])        │
│    → flat lookup                │     │    → bubblePath 순회             │
│    → 하나의 handler             │     │    → scope마다 mw + handler      │
│    → 하나의 middleware chain    │     │    → null → bubble / EffectMap → stop │
│                                 │     │                                 │
│  registry:                      │     │  registry:                      │
│    Map<type, handler>           │     │    Map<scope, Map<type, handler>>│
│    Middleware[]                  │     │    Map<scope, Middleware[]>      │
│                                 │     │                                 │
│  OS가 할 일:                     │     │  OS가 할 일:                     │
│    - Zone prop으로 오버라이드     │     │    - buildBubblePath 계산        │
│    - hasZoneBinding 체크         │     │    - cmd.scope에 넘기기          │
│    - 이중 경로 관리              │     │    - 정리 끝.                    │
│                                 │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘
```
