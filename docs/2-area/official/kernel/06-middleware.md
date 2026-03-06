# 미들웨어

> before/after 훅을 통한 횡단 관심사 처리

---

## 개요

미들웨어는 특정 스코프 내 모든 커맨드의 전후에 실행되는 로직을 추가한다. re-frame의 인터셉터 모델에서 영감을 받았다.

```typescript
type Middleware = {
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
  fallback?: (event: Event) => BaseCommand | null;
};
```

Redux 스타일의 `(next) => (state, action) => ...` 체이닝 대신 `{ before, after }` 구조를 채택하였다. 이 구조에서는 실행 순서를 엔진이 관리하므로 각 미들웨어가 독립적이며, 순서 변경이 자유롭다.

---

## 등록

```typescript
kernel.use({
  id: "LOGGER",
  before: (ctx) => {
    console.group(`[dispatch] ${ctx.command.type}`);
    return ctx;
  },
  after: (ctx) => {
    console.groupEnd();
    return ctx;
  },
});
```

- `kernel.use()` — GLOBAL 스코프에 등록
- `scopedGroup.use()` — 해당 그룹의 스코프에 등록
- 미들웨어 객체에서 `scope`를 생략하면 GLOBAL이 기본값이 된다

---

## 실행 모델

### 양파 패턴

미들웨어는 양파 패턴으로 실행된다. `before` 훅은 등록 순서대로, `after` 훅은 역순으로 실행된다.

```
A:before → B:before → C:before → [handler] → C:after → B:after → A:after
```

### 스코프별 파이프라인

버블 경로의 각 스코프에서 다음 순서로 처리된다.

```
1. 스코프 before 미들웨어 (A → B → C)
2. when guard 평가
3. 커맨드별 inject 인터셉터 (before)
4. 핸들러 실행
5. 커맨드별 inject 인터셉터 (after, 역순)
6. 스코프 after 미들웨어 (C → B → A)
```

---

## MiddlewareContext

컨텍스트 객체는 모든 미들웨어 훅을 통해 흐르며 변환될 수 있다.

```typescript
type MiddlewareContext = {
  command: Command;              // 처리 중인 커맨드
  state: unknown;                // 현재 상태 스냅샷
  handlerScope: string;          // 현재 스코프
  effects: Record<string, unknown> | null;  // 핸들러 결과 (before에서는 null)
  injected: Record<string, unknown>;        // 주입된 컨텍스트 값
};
```

---

## 패턴

### 로깅

```typescript
kernel.use({
  id: "LOGGER",
  before: (ctx) => {
    console.group(`[kernel] ${ctx.command.type}`);
    console.log("state:", ctx.state);
    return ctx;
  },
  after: (ctx) => {
    console.log("effects:", ctx.effects);
    console.groupEnd();
    return ctx;
  },
});
```

### 커맨드 별칭

`before` 훅에서 커맨드 타입을 변환한다.

```typescript
kernel.use({
  id: "ALIAS",
  before: (ctx) => {
    if (ctx.command.type === "LEGACY_ACTION") {
      return { ...ctx, command: { ...ctx.command, type: "NEW_ACTION" } };
    }
    return ctx;
  },
});
```

### 이펙트 변환

`after` 훅에서 이펙트 값을 수정한다.

```typescript
kernel.use({
  id: "UPPERCASE_NOTIFY",
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

### 컨텍스트 주입

핸들러 컨텍스트에 추가 데이터를 주입한다.

```typescript
kernel.use({
  id: "TIMESTAMP",
  before: (ctx) => ({
    ...ctx,
    injected: { ...ctx.injected, __timestamp: Date.now() },
  }),
});
```

### 폴백 핸들러

리스너가 매칭하지 못한 네이티브 Event를 처리한다.

```typescript
kernel.use({
  id: "KEYBOARD_FALLBACK",
  fallback: (event: Event) => {
    if (event instanceof KeyboardEvent && event.key === "F5") {
      return REFRESH();  // Command를 반환
    }
    return null;  // 다음 미들웨어로 전달
  },
});
```

폴백은 `kernel.resolveFallback(event)`를 통해 호출되며, 일반 디스패치와는 별도의 경로로 처리된다.

---

## 중복 제거

같은 스코프에서 같은 `id`를 가진 미들웨어를 등록하면 기존 미들웨어가 교체된다. 중복 등록은 발생하지 않는다.

```typescript
kernel.use({ id: "logger", before: v1Handler });
kernel.use({ id: "logger", before: v2Handler });
// v2Handler만 실행된다
```

id 기반 중복 제거를 통해 HMR 환경에서 모듈 재실행 시 `kernel.use()`가 다시 호출되더라도 미들웨어가 중복으로 누적되지 않는다.

---

## 스코프 미들웨어

미들웨어를 특정 스코프에 한정하여 등록할 수 있다.

```typescript
const todoGroup = kernel.group({ scope: TODO_LIST });

todoGroup.use({
  id: "TODO_VALIDATOR",
  before: (ctx) => {
    // TODO_LIST 스코프의 커맨드에서만 실행된다
    console.log(`[todo] Processing: ${ctx.command.type}`);
    return ctx;
  },
});
```

스코프 미들웨어는 파이프라인이 해당 스코프를 평가할 때만 실행된다. 커맨드가 그 스코프에 도달하지 않으면(버블 경로에서 더 일찍 처리된 경우) 미들웨어가 실행되지 않는다.

---

## 다음

→ [상태 관리](./07-state-management.md) — State, Store, 상태 렌즈
