# 패턴 & 레시피

> 모범 사례와 일반적인 패턴

---

## 앱 등록

런타임에 앱을 동적으로 등록하고 자체 스코프된 상태를 부여한다.

```typescript
import { createKernel, defineScope } from "@kernel";

// ── Kernel ──
interface AppState {
  os: OSState;
  apps: Record<string, unknown>;
}

const kernel = createKernel<AppState>({
  os: initialOSState,
  apps: {},
});

// ── App Registration ──
interface TodoState {
  todos: { id: string; text: string; done: boolean }[];
}

const TODO_SCOPE = defineScope("TODO");

// 1. 초기 상태 주입
kernel.setState((prev) => ({
  ...prev,
  apps: { ...prev.apps, todo: { todos: [] } },
}));

// 2. 상태 렌즈를 가진 스코프 그룹 생성
const todoGroup = kernel.group({
  scope: TODO_SCOPE,
  stateSlice: {
    get: (full) => full.apps.todo as TodoState,
    set: (full, slice) => ({
      ...full,
      apps: { ...full.apps, todo: slice },
    }),
  },
});

// 3. 커맨드 정의 — 핸들러는 TodoState만 참조한다
const ADD_TODO = todoGroup.defineCommand(
  "ADD_TODO",
  (ctx) => (text: string) => ({
    state: {
      ...ctx.state,
      todos: [
        ...ctx.state.todos,
        { id: `todo-${Date.now()}`, text, done: false },
      ],
    },
  }),
);
```

이 패턴을 통해 앱은 커널의 전체 상태 트리를 알 필요 없다. `stateSlice`로 자신의 영역만 참조하며, 다른 앱에 영향을 주지 않는다. 앱의 추가와 제거가 커널 변경 없이 이루어진다.

---

## 커맨드 + 이펙트 조합

가장 일반적인 패턴으로, 상태 업데이트와 부수 효과를 함께 선언한다.

```typescript
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", (id: string) => {
  document.querySelector(`[data-item-id="${id}"]`)?.focus();
});

const SCROLL_TO = kernel.defineEffect("SCROLL_TO", (id: string) => {
  document.querySelector(`[data-item-id="${id}"]`)?.scrollIntoView({
    block: "nearest",
  });
});

const NAVIGATE = kernel.defineCommand(
  "NAVIGATE",
  (ctx) => (direction: "up" | "down") => {
    const targetId = resolveNext(ctx.state, direction);
    return {
      state: { ...ctx.state, focusedId: targetId },
      [FOCUS_ID]: targetId,
      [SCROLL_TO]: targetId,
    };
  },
);
```

---

## 커맨드 체이닝

하나의 핸들러에서 여러 커맨드를 디스패치한다.

```typescript
const RESET_AND_RELOAD = kernel.defineCommand(
  "RESET_AND_RELOAD",
  (ctx) => () => ({
    state: { ...ctx.state, count: 0 },
    dispatch: [FETCH_DATA(), NOTIFY_USER("Reset complete")],
  }),
);
```

`dispatch`로 전달된 커맨드는 현재 커맨드 처리가 완료된 후 큐에서 순차적으로 처리된다.

---

## 조건부 처리

`undefined`를 반환하여 커맨드를 상위 스코프로 통과시킨다.

```typescript
const ACTIVATE = scopedGroup.defineCommand(
  "ACTIVATE",
  (ctx) => () => {
    // zone이 활성 상태일 때만 처리
    if (!ctx.state.isActive) return undefined; // 버블링

    return {
      state: { ...ctx.state, activated: true },
    };
  },
);
```

또는 `when` 옵션으로 guard를 선언적으로 분리할 수 있다.

```typescript
const ACTIVATE = scopedGroup.defineCommand(
  "ACTIVATE",
  (ctx) => () => ({
    state: { ...ctx.state, activated: true },
  }),
  { when: (state) => state.isActive },
);
```

핸들러 내부의 `if` 문은 간단하나 Inspector에서는 보이지 않는다. `when` 옵션은 guard를 외부화하여 `inspector.evaluateWhenGuard()`로 시각화할 수 있게 한다. 복잡한 조건에는 선언적 `when`을 권장한다.

---

## 스코프 오버라이드 체인

OS 수준 기능에서 스코프가 런타임 컨텍스트에 의존하는 경우, 다중 스코프 커맨드를 사용한다.

```typescript
// OS 레이어가 포커스 상태에서 동적 스코프 체인을 계산
function handleKeyDown(key: string) {
  const focusedZoneId = kernel.getState().os.focus.activeZoneId;
  const scopeChain = kernel.inspector.getScopePath(focusedZoneId);

  kernel.dispatch(ACTION(), { scope: scopeChain });
  // 포커스된 zone → 부모 → ... → GLOBAL 순으로 탐색한다
}
```

---

## 파생 상태 (React)

효율적인 파생 상태를 위해 `useComputed`를 사용한다.

```typescript
// 세분화된 구독
function TodoCount() {
  const total = kernel.useComputed((s) =>
    (s.apps.todo as TodoState).todos.length,
  );
  const done = kernel.useComputed((s) =>
    (s.apps.todo as TodoState).todos.filter((t) => t.done).length,
  );
  return <span>{done} / {total}</span>;
}

// Boolean 파생 상태
function useFocused(itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.focusedItemId === itemId,
  );
}
```

---

## 테스트

커널 인스턴스는 독립적이므로 격리된 테스트에 적합하다.

```typescript
function createTestKernel() {
  const kernel = createKernel<TestState>({ count: 0 });

  const INCREMENT = kernel.defineCommand(
    "INCREMENT",
    (ctx) => () => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }),
  );

  return { kernel, INCREMENT };
}

// 각 테스트가 새 인스턴스를 받는다
test("increment", () => {
  const { kernel, INCREMENT } = createTestKernel();
  kernel.dispatch(INCREMENT());
  expect(kernel.getState().count).toBe(1);
});

test("independent state", () => {
  const { kernel } = createTestKernel();
  expect(kernel.getState().count).toBe(0); // 다른 테스트에 영향받지 않는다
});
```

### register를 활용한 핸들러 공유

프로덕션 핸들러를 테스트 커널에서 재사용한다.

```typescript
// 프로덕션 코드
const INCREMENT = kernel.defineCommand("INCREMENT", handler);

// 테스트 코드 — 핸들러 로직 중복 없이 재사용
function createTestKernel() {
  const testKernel = createKernel<TestState>({ count: 0 });
  testKernel.register(INCREMENT);  // 프로덕션 핸들러 등록
  return testKernel;
}
```

테스트에서 핸들러 로직을 복사하면 프로덕션과 테스트가 diverge할 수 있다. `register`는 동일한 핸들러 함수를 사용하므로 프로덕션과 테스트가 항상 동기화된다.

### 트랜잭션 기반 어설션

```typescript
test("effects are recorded", () => {
  const { kernel, NAVIGATE } = createTestKernel();
  kernel.dispatch(NAVIGATE({ direction: "down" }));

  const tx = kernel.inspector.getLastTransaction()!;
  expect(tx.command.type).toBe("NAVIGATE");
  expect(tx.handlerScope).toBe("GLOBAL");
  expect(tx.changes).toContainEqual({
    path: "focusedId",
    from: null,
    to: "item-1",
  });
});
```

---

## 안티패턴

### 핸들러 내 부수 효과

```typescript
// ❌ 직접 DOM 조작
kernel.defineCommand("BAD", (ctx) => () => {
  document.getElementById("x")?.focus(); // 부수 효과
  return { state: ctx.state };
});

// ✅ 이펙트 선언
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: ctx.state,
  [FOCUS_ID]: "x", // 엔진이 처리한다
}));
```

핸들러 내 부수 효과는 트랜잭션 로그에 기록되지 않으며, 테스트에서 모킹이 어렵고, 타임 트래블 시 재실행된다.

### 원시 문자열 디스패치

```typescript
// ❌ 컴파일 오류
dispatch({ type: "INCREMENT" });
dispatch("INCREMENT");
dispatch("SET_COUNT", 42);

// ✅ CommandFactory만 사용
dispatch(INCREMENT());
dispatch(SET_COUNT(42));
```

### 상태 변이

```typescript
// ❌ 변이 금지
kernel.defineCommand("BAD", (ctx) => () => {
  ctx.state.count = 99; // 변이
  return { state: ctx.state };
});

// ✅ 스프레드 또는 immer의 produce() 사용
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: { ...ctx.state, count: 99 },
}));
```

### 핸들러 내 setState

```typescript
// ❌ 핸들러 내에서 kernel.setState 호출 금지
kernel.defineCommand("BAD", (ctx) => () => {
  kernel.setState(() => ({ count: 99 })); // 파이프라인 우회
  return {};
});

// ✅ 이펙트 맵에서 state를 반환
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: { ...ctx.state, count: 99 },
}));
```

---

## 다음

→ [용어집](./09-glossary.md) — 용어와 설계 결정
