# Kernel v2 — Unified Group API 설계

> **상태: ✅ 구현 완료** — registry.ts, tokens.ts, context.ts, index.ts에 반영됨.

## 1. 개요

Kernel API를 **Group 인터페이스 하나로 통일**하는 설계 제안.

**배경**: `defineCommand`의 12개 오버로드, `inject`의 TS 추론 실패, scope/inject/effect의 분리된 API가
복잡성과 빌드 에러를 유발했다. 논의를 통해 다음 원칙에 도달:

- **오버로딩 금지** — 단일 시그니처
- **re-frame 순수성** — 핸들러는 순수 함수, inject는 선언적
- **LLM 친화** — 학습할 개념 최소화
- **위젯/멀티앱** — Effect/Context 버블링으로 오버라이드 가능

## 2. 핵심 설계

### 2.1 Group = 유일한 인터페이스

```typescript
createKernel(config) → Group    // kernel = Group("GLOBAL")

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

`createKernel`이 반환하는 것과 `group()`이 반환하는 것은 **동일한 인터페이스**.

### 2.2 ContextToken — wrapper object 인코딩

> [!IMPORTANT]
> 기존 branded string `Id & { [symbol]: Value }`은 TS mapped type에서 Value 추론 실패.
> wrapper object로 변경하면 `InjectResult` 정상 작동 확인됨 (`tsc --strict` 0 errors).

```typescript
// Before (broken)
type ContextToken<Id, Value> = Id & { readonly [__brand]: Value }

// After (works)
type ContextToken<Id, Value> = { readonly __id: Id; readonly __phantom: Value }
```

### 2.3 Scope Tree 버블링 (Command + Effect + Context)

```
[Widget Group]  →  핸들러 있으면 로컬 처리
       │
       │ (없으면 버블)
       ▼
[App Group]     →  핸들러 있으면 앱 레벨 처리
       │
       │ (없으면 버블)
       ▼
[Global]        →  OS 기본 핸들러 (fallback)
```

Command, Effect, Context **전부 같은 메커니즘**으로 버블링.

### 2.4 inject — group 단위 선언적 주입

```typescript
// inject는 group config에서 선언 (re-frame coeffect)
const { defineCommand } = kernel.group({
  scope: TODO,
  inject: [AUTH, NOW],
})

// 핸들러는 순수 데이터만 받음 (provider 호출 안 함)
const ADD = defineCommand("ADD", (ctx, text: string) => ({
  state: { ...ctx.state, todos: [...ctx.state.todos, { text, by: ctx.AUTH.name }] },
  [TOAST]: `Added: ${text}`,
}))
```

### 2.5 Effect — 토큰(인터페이스) vs 구현 분리

```typescript
// OS: 기본 구현
const { defineEffect } = kernel
const TOAST = defineEffect("TOAST", (msg) => systemToast(msg))

// Widget: 오버라이드 (버블링으로 fallback)
const { defineEffect } = kernel.group({ scope: TODO_WIDGET })
defineEffect("TOAST", (msg) => miniPopup(msg))
```

## 3. Usage — TodoApp 예시

```typescript
import { kernel } from "@os"
import { TOAST } from "@os/effects"
import { AUTH } from "@os/contexts"

// ─── Group (scope + inject) ───
const { defineCommand } = kernel.group({
  scope: defineScope("TODO"),
  inject: [AUTH],
})

// ─── Commands (순수 핸들러) ───
const ADD = defineCommand("ADD", (ctx, text: string) => ({
  state: {
    ...ctx.state,
    todos: [...ctx.state.todos, { text, by: ctx.AUTH.name }],
  },
  [TOAST]: `Added: ${text}`,
}))

const TOGGLE = defineCommand("TOGGLE", (ctx, id: number) => ({
  state: {
    ...ctx.state,
    todos: ctx.state.todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ),
  },
}))

// ─── View ───
function TodoApp() {
  const { todos } = useComputed(s => s)
  return (
    <ul>
      {todos.map(t => (
        <li key={t.id} onClick={() => dispatch(TOGGLE(t.id))}>{t.text}</li>
      ))}
    </ul>
  )
}
```

## 4. 비교 — Before vs After

| 항목 | Before (현재) | After (Group v2) |
|---|---|---|
| 오버로드 | defineCommand 12개, inject 5개 | **0개** |
| API 개수 | defineCommand, defineEffect, defineContext, inject, createKernel, resetKernel | **Group 인터페이스 1개** |
| Effect 스코핑 | 글로벌 only | 버블링 (위젯 오버라이드) |
| inject 방식 | 인터셉터 (TS 추론 실패) | group config (TS 추론 정상) |
| 학습 비용 | scope, inject, middleware, interceptor, TypedInterceptor... | **Group** 하나 |

## 5. 결론

- **Group이 유일한 추상화** — kernel도 Group("GLOBAL")
- **ContextToken wrapper object**로 TS 추론 문제 해결
- **Effect 버블링**으로 멀티 위젯/앱 지원
- **오버로드 0개**, **inject는 group config**, **핸들러는 순수**
- re-frame 원칙 유지 + TypeScript 추론 + LLM 친화 = 모두 달성
