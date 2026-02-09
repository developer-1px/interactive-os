# Kernel Type-Safety 평가 및 개선 제안 (v2 — 100% Type-Strict)

> 날짜: 2026-02-09
> 태그: kernel, typescript, type-safety, dx
> 상태: Analysis Complete
> 선행: 13-[kernel]\_Scope\_Final\_Design.md
> 원칙: **100% Type-Strict. 암묵적인 것은 없다. Raw string은 컴파일 에러.**

---

## 0. 절대 원칙

> **LLM 시대에 암묵적이라는 건 절대 없어야 한다.**

- ❌ raw string ID — `dispatch({ type: "increment" })`
- ❌ `unknown` payload — `(ctx, payload: unknown)`
- ❌ `as` 캐스팅 — `payload as number`
- ❌ index signature — `[key: string]: unknown`
- ❌ optional escape hatch — "raw string도 허용"

- ✅ Token 참조 — `dispatch(INCREMENT)`
- ✅ 타입 추론 payload — `dispatch(SET_COUNT, 42)`
- ✅ 컴파일 에러 — 오타, 타입 불일치, 미등록 ID → 빌드 실패
- ✅ IDE 자동완성 — Token을 import하면 끝

---

## 1. 현재 상태: 전수 조사

### 1.1 String ID가 사용되는 모든 지점

| API | 사용 형태 | 문제 |
|-----|----------|------|
| `defineCommand(id, handler)` | `id: string` | 등록과 사용이 분리됨 |
| `defineEffect(id, handler)` | `id: string` | EffectMap key와 연결 없음 |
| `defineContext(id, provider)` | `id: string` | inject와 연결 없음 |
| `inject(...ids)` | `ids: string[]` | defineContext와 연결 없음 |
| `dispatch({ type, payload })` | `type: string` | defineCommand와 연결 없음 |
| `use({ id, ... })` | `id: string` | dedup용이지만 여전히 raw string |
| EffectMap return | `{ notify: "hello" }` | 등록된 effect인지 검증 없음 |
| Context access | `ctx["dom-items"]` | inject된 건지 검증 없음 |
| Command.type in Transaction | `command.type: string` | 기록도 untyped |

총 **9개 지점**에서 raw string이 사용된다. 어떤 것도 타입 시스템이 검증하지 않는다.

### 1.2 `unknown`이 사용되는 모든 지점

| 위치 | 타입 | 문제 |
|------|------|------|
| `Command.payload` | `unknown` | 핸들러에서 `as` 캐스팅 필수 |
| `CommandHandler` 2nd param | `payload: unknown` | 핸들러 시그니처에 payload 타입 없음 |
| `EffectHandler` param | `value: unknown` | effect가 받는 값의 타입 불명 |
| `EffectMap.state` | `unknown` | state 타입과 연결 없음 |
| `EffectMap[key]` | `unknown` | effect 값 타입 불명 |
| `Context[key]` | `unknown` | inject 결과 타입 불명 |
| `MiddlewareContext.state` | `unknown` | 상태 타입 없음 |
| `ContextProvider` return | `unknown` | 제공하는 값의 타입 불명 |
| `StateDiff.from/to` | `unknown` | diff 값 타입 불명 |
| `Transaction.stateBefore/After` | `unknown` | state 타입 불명 |

총 **10개 지점**에서 `unknown`이 사용된다.

### 1.3 Index Signature (open type)

```typescript
// registry.ts
export type EffectMap = {
  state?: unknown;
  dispatch?: Command | Command[];
  [key: string]: unknown;           // ← 어떤 key든 허용. 오타도 통과.
};

// registry.ts
export type Context<S = unknown> = {
  state: S;
  [key: string]: unknown;           // ← inject 안 된 key도 접근 가능. 런타임 undefined.
};
```

이 2개의 index signature가 타입 시스템의 가장 큰 구멍이다.

---

## 2. 목표: 100% Type-Strict API

### 2.1 defineCommand → CommandToken 반환

```typescript
const INCREMENT = defineCommand("increment", (ctx: Context<AppState>) => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));
// typeof INCREMENT = CommandToken<"increment", void>

const SET_COUNT = defineCommand("set-count", (ctx: Context<AppState>, payload: number) => ({
  state: { ...ctx.state, count: payload },
}));
// typeof SET_COUNT = CommandToken<"set-count", number>
```

### 2.2 dispatch → Token만 허용

```typescript
// ✅ 컴파일 성공
dispatch(INCREMENT);
dispatch(SET_COUNT, 42);

// ❌ 컴파일 에러 — raw string 금지
dispatch({ type: "increment" });        // Error: Argument is not CommandToken
dispatch({ type: "incrment" });         // Error: same

// ❌ 컴파일 에러 — payload 타입 불일치
dispatch(SET_COUNT);                    // Error: Expected 2 arguments
dispatch(SET_COUNT, "wrong");           // Error: string is not number

// ❌ 컴파일 에러 — payload가 없는 커맨드에 payload 전달
dispatch(INCREMENT, 42);                // Error: Expected 1 argument
```

### 2.3 defineEffect → EffectToken 반환

```typescript
const NOTIFY = defineEffect("notify", (message: string) => {
  toast(message);
});
// typeof NOTIFY = EffectToken<"notify", string>

const TRACK = defineEffect("track", (event: AnalyticsEvent) => {
  analytics.send(event);
});
// typeof TRACK = EffectToken<"track", AnalyticsEvent>
```

### 2.4 EffectMap → index signature 제거, Token key만 허용

```typescript
// Before (현재)
type EffectMap = {
  state?: unknown;
  dispatch?: Command | Command[];
  [key: string]: unknown;             // 구멍
};

// After (제안)
// EffectMap은 이제 제네릭 — 사용하는 effect를 선언한다
defineCommand("shout", (ctx) => ({
  state: nextState,
  [NOTIFY]: "hello",                   // ✅ key = EffectToken, value 타입 = string ✅
}));

// ❌ 컴파일 에러
defineCommand("shout", (ctx) => ({
  state: nextState,
  [NOTIFY]: 42,                        // Error: number is not string
  ntoify: "hello",                     // Error: 'ntoify' is not a valid key
}));
```

구현: EffectMap을 **computed property key** 기반으로 구성.

```typescript
// effect를 key로 쓰면 자동으로 value 타입이 강제됨
type EffectResult = {
  state?: S;
  dispatch?: CommandRef | CommandRef[];
  // effect token을 computed key로 추가
};
```

### 2.5 defineContext → ContextToken 반환

```typescript
const DOM_ITEMS = defineContext("dom-items", (): DOMItem[] => queryDOMItems());
// typeof DOM_ITEMS = ContextToken<"dom-items", DOMItem[]>

const USER_INFO = defineContext("user", (): User => getCurrentUser());
// typeof USER_INFO = ContextToken<"user", User>
```

### 2.6 inject → ContextToken만 허용, Context 타입에 반영

```typescript
defineCommand("navigate", (ctx) => {
  const items = ctx[DOM_ITEMS];    // 타입: DOMItem[] — 자동 추론, 캐스팅 불필요
  const user = ctx[USER_INFO];     // 타입: User

  // ❌ 컴파일 에러 — inject 안 된 context 접근 불가
  const x = ctx["nonexistent"];    // Error: index signature 없음
}, [inject(DOM_ITEMS, USER_INFO)]);

// ❌ 컴파일 에러 — raw string 금지
inject("dom-items");               // Error: string is not ContextToken
```

### 2.7 defineScope → ScopeToken 반환

```typescript
const CARD_LIST = defineScope("card-list");
// typeof CARD_LIST = ScopeToken<"card-list">

const KANBAN = defineScope("kanban-board");

// dispatch에서
dispatch(ACTIVATE, undefined, { scope: [CARD_LIST, KANBAN, GLOBAL] });

// ❌ 컴파일 에러
dispatch(ACTIVATE, undefined, { scope: ["card-list"] });  // Error: string is not ScopeToken
```

---

## 3. Token 타입 설계

### 3.1 Branded Types

```typescript
// 모든 토큰의 공통 구조: runtime은 plain object, compile-time에 phantom type 부착

declare const __commandBrand: unique symbol;
declare const __effectBrand: unique symbol;
declare const __scopeBrand: unique symbol;
declare const __contextBrand: unique symbol;

export type CommandToken<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly [__commandBrand]: Payload;  // phantom — runtime에 없음
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

### 3.2 unique symbol을 쓰는 이유

- **구조적 타이핑 차단**: `{ type: "increment" }`가 `CommandToken`으로 캐스팅되는 걸 방지
- plain `{ type: string }`은 `CommandToken`이 아니다 — unique symbol이 없으므로
- **반드시 `defineCommand()`를 거쳐야만 Token이 생성된다**

```typescript
// ❌ 직접 생성 불가
const fake: CommandToken<"increment"> = { type: "increment" };
// Error: Property '[__commandBrand]' is missing

// ✅ defineCommand만이 Token을 생성
const INCREMENT = defineCommand("increment", handler);
// 내부에서: return { type: id } as CommandToken<Type, Payload>;
```

### 3.3 dispatch 시그니처 (최종)

```typescript
// Payload가 void인 커맨드
export function dispatch<T extends string>(
  cmd: CommandToken<T, void>,
): void;

// Payload가 있는 커맨드
export function dispatch<T extends string, P>(
  cmd: CommandToken<T, P>,
  payload: P,
): void;

// Scope 포함 (Payload void)
export function dispatch<T extends string>(
  cmd: CommandToken<T, void>,
  options: { scope: ScopeToken[] },
): void;

// Scope 포함 (Payload 있음)
export function dispatch<T extends string, P>(
  cmd: CommandToken<T, P>,
  payload: P,
  options: { scope: ScopeToken[] },
): void;
```

### 3.4 EffectMap 타입 (최종)

```typescript
// EffectMap은 더 이상 index signature를 갖지 않는다.
// effect를 사용하려면 computed property key로 EffectToken을 써야 한다.

type BaseEffectMap<S> = {
  state?: S;
  dispatch?: CommandRef | CommandRef[];
};

// 핸들러 반환 시:
defineCommand("shout", (ctx): BaseEffectMap<AppState> & { [NOTIFY]?: string } => ({
  state: { ...ctx.state, count: 42 },
  [NOTIFY]: "hello",
}));
```

이 부분의 DX를 더 깔끔하게 만드는 방법은 구현 단계에서 검증.

---

## 4. Context 타입 주입 설계

### 4.1 문제: ctx의 타입에 inject 결과를 반영하는 방법

```typescript
// 목표: ctx[DOM_ITEMS]의 타입이 DOMItem[]로 추론되어야 한다
defineCommand("navigate", (ctx) => {
  ctx[DOM_ITEMS]; // DOMItem[] — 자동 추론
}, [inject(DOM_ITEMS)]);
```

### 4.2 접근: 제네릭 체인

```typescript
function defineCommand<S, Tokens extends ContextToken[]>(
  id: string,
  handler: (ctx: Context<S> & InjectResult<Tokens>, payload: P) => EffectMap<S>,
  interceptors: [...Tokens],
): CommandToken<Type, P>;

// InjectResult는 ContextToken 배열을 Context 필드로 변환
type InjectResult<T extends ContextToken[]> = {
  [K in T[number] as K["id"]]: K extends ContextToken<any, infer V> ? V : never;
};
```

이렇게 하면:
```typescript
// inject(DOM_ITEMS, USER_INFO) 를 넘기면
// ctx = { state: S } & { "dom-items": DOMItem[], "user": User }
// ctx[DOM_ITEMS] → DOMItem[]
// ctx["random"] → Error
```

---

## 5. 마이그레이션 전략

### 하위 호환 없음. 전면 교체.

| Phase | 내용 | 범위 |
|-------|------|------|
| Phase 1 | Token 타입 정의 + `define*` 반환값 추가 | `registry.ts`, `context.ts` |
| Phase 2 | `dispatch` 시그니처를 Token-only로 변경 | `dispatch.ts` |
| Phase 3 | `EffectMap` index signature 제거 | `registry.ts` |
| Phase 4 | `Context` index signature 제거 | `registry.ts` |
| Phase 5 | 모든 테스트 + KernelLab 마이그레이션 | `__tests__/*`, `KernelLabPage.tsx` |

> **Phase 1~4를 한 번에 실행**한다. 중간 상태(일부만 strict)를 만들지 않는다.
> Phase 5(사용처 마이그레이션)와 동시에 진행하여 전체 컴파일 통과를 보장한다.

---

## 6. 검증 기준

| 기준 | 현재 | 목표 |
|------|------|------|
| `dispatch({ type: "typo" })` 컴파일 | ✅ 통과 | ❌ 에러 |
| `dispatch(SET_COUNT, "wrong")` 컴파일 | ✅ 통과 | ❌ 에러 |
| `{ ntoify: "hello" }` EffectMap 컴파일 | ✅ 통과 | ❌ 에러 |
| `ctx["nonexistent"]` 접근 컴파일 | ✅ 통과 | ❌ 에러 |
| `inject("raw-string")` 컴파일 | ✅ 통과 | ❌ 에러 |
| `as` 캐스팅 사용 횟수 | 10+ 곳 | **0** |
| Token import 후 IDE 자동완성 | ❌ 불가 | ✅ 완전 지원 |

---

## 7. 결론

현재 커널은 **타입 안전성 2/10**. 모든 경계가 `string` + `unknown`으로 열려 있다.

Token 패턴 + index signature 전면 제거로 **10/10**을 목표:

```
Before:  defineCommand("increment", handler)  →  dispatch({ type: "incrment" })  ✅ 컴파일 통과
After:   const INCREMENT = defineCommand(...)  →  dispatch(INCREMENT)             ✅ 타입 안전
         dispatch({ type: "incrment" })                                           ❌ 컴파일 에러
```

**LLM이 코드를 생성할 때, 타입 에러가 즉시 나야 실수를 잡을 수 있다.
컴파일러가 모든 실수를 잡는 시스템이 LLM 시대의 올바른 설계다.**
