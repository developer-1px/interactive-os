# 시작하기

> 첫 커널 인스턴스를 생성하고 커맨드를 디스패치하는 과정을 안내한다.

---

## 설치

```typescript
import { createKernel, defineScope, GLOBAL } from "@kernel";
```

Kernel은 interactive-os 모노레포 내에서 `@kernel` 패키지 별칭으로 사용할 수 있다.

---

## 빠른 시작

### 1. 커널 생성

```typescript
import { createKernel } from "@kernel";

// 상태 형태 정의
interface AppState {
  count: number;
}

// 초기 상태로 커널 인스턴스 생성
const kernel = createKernel<AppState>({ count: 0 });
```

`createKernel()` 호출은 완전히 독립적인 인스턴스를 생성한다. 싱글턴이나 공유 전역 상태는 존재하지 않는다.

싱글턴 기반 상태 관리는 테스트 간 상태 오염, HMR 시 stale 참조, 독립 인스턴스 불가 등의 문제를 수반한다. Zustand 스타일의 클로저 기반 팩토리를 채택하여 이러한 문제를 원천 차단하였다.

### 2. 이펙트 정의

이펙트는 핸들러가 선언하는 부수 효과다. 이를 참조하는 커맨드보다 먼저 정의해야 한다.

```typescript
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
  console.log(`📢 ${msg}`);
});
```

### 3. 커맨드 정의

커맨드 핸들러는 컨텍스트(현재 상태와 주입된 값)를 받아 이펙트 맵을 반환하는 순수 함수다.

```typescript
const INCREMENT = kernel.defineCommand(
  "INCREMENT",
  (ctx) => () => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
    [NOTIFY]: `count is now ${ctx.state.count + 1}`,
  }),
);
```

핸들러 시그니처는 커링(curried) 형태를 따른다: `(ctx) => (payload?) => EffectMap`.

커링을 채택한 이유는 핸들러의 두 관심사를 분리하기 위해서다. 첫 번째 인자 `ctx`는 커널이 디스패치 시점에 주입하는 환경이고, 두 번째 인자 `payload`는 호출자가 전달하는 데이터다. 이 분리를 통해 타입 추론이 ctx → payload 순으로 자연스럽게 흐른다.

### 4. 디스패치

```typescript
kernel.dispatch(INCREMENT());

console.log(kernel.getState()); // { count: 1 }
// Console output: 📢 count is now 1
```

---

## 처리 흐름

```
dispatch(Command)
  → 스코프 체인에서 핸들러 탐색
  → when guard 평가 (등록된 경우)
  → handler(ctx)(payload) 실행
  → { state, ...effects } 반환
  → 상태 업데이트
  → 이펙트 실행
  → 트랜잭션 기록
```

---

## 페이로드

커맨드는 타입이 지정된 페이로드를 전달할 수 있다.

```typescript
const SET_COUNT = kernel.defineCommand(
  "SET_COUNT",
  (ctx) => (value: number) => ({
    state: { ...ctx.state, count: value },
  }),
);

kernel.dispatch(SET_COUNT(42));
// kernel.getState().count === 42

SET_COUNT("wrong"); // ❌ 컴파일 오류 — string ≠ number
```

페이로드 타입은 `defineCommand` 시그니처에서 자동 추론된다. `SET_COUNT()`를 호출할 때 `number`가 요구되며, 잘못된 타입은 컴파일 오류로 이어진다. LLM이 코드를 생성하는 경우에도 동일한 타입 검사가 적용된다.

---

## React 통합

```tsx
function Counter() {
  const count = kernel.useComputed((s) => s.count);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => kernel.dispatch(INCREMENT())}>
        Increment
      </button>
    </div>
  );
}
```

`useComputed`는 `useSyncExternalStore` 위에 구현되어 있으며, 커널 상태를 구독하고 선택된 값이 변경될 때만 리렌더링한다.

---

## 전체 예제

```typescript
import { createKernel } from "@kernel";

// ── State ──
interface TodoState {
  todos: { id: string; text: string; done: boolean }[];
}

const kernel = createKernel<TodoState>({
  todos: [],
});

// ── Effects ──
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", (id: string) => {
  document.getElementById(id)?.focus();
});

// ── Commands ──
const ADD_TODO = kernel.defineCommand(
  "ADD_TODO",
  (ctx) => (text: string) => {
    const id = `todo-${Date.now()}`;
    return {
      state: {
        ...ctx.state,
        todos: [...ctx.state.todos, { id, text, done: false }],
      },
      [FOCUS_ID]: id,
    };
  },
);

const TOGGLE = kernel.defineCommand(
  "TOGGLE",
  (ctx) => (id: string) => ({
    state: {
      ...ctx.state,
      todos: ctx.state.todos.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    },
  }),
);

// ── Usage ──
kernel.dispatch(ADD_TODO("Buy milk"));
kernel.dispatch(TOGGLE(kernel.getState().todos[0].id));
```

---

## 다음

→ [핵심 개념](./02-core-concepts.md) — Command, Effect, Context, Scope의 상세 설명
