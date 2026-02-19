# 타입 시스템

> 브랜드 토큰으로 컴파일 타임 안전성을 확보하는 구조

---

## 설계 원칙

모든 ID는 `define*()`을 통해 생성된 타입 안전 토큰이다. 원시 문자열을 사용하면 컴파일 오류가 발생한다.

이 원칙은 LLM 기반 개발에서 특히 중요하다. AI가 코드를 생성할 때 컴파일러가 모든 오타와 타입 불일치를 포착하므로, 문자열 불일치에 의한 런타임 오류를 방지할 수 있다.

---

## 토큰 타입

Kernel은 4가지 토큰 타입을 정의한다. 각 토큰은 서로 다른 TypeScript 기법을 사용하여 컴파일 타임 안전성을 확보한다.

### EffectToken — 브랜드 문자열

```typescript
declare const __effectBrand: unique symbol;

type EffectToken<Type extends string = string, Value = unknown> = Type & {
  readonly [__effectBrand]: Value;
};
```

런타임 값은 일반 문자열(예: `"FOCUS_ID"`)이다. 컴파일 타임에 Value 타입으로 브랜딩되어 구조적 하위 타입화(structural subtyping)를 방지한다.

```typescript
const FOCUS = kernel.defineEffect("FOCUS", (id: string) => { ... });
// typeof FOCUS = EffectToken<"FOCUS", string>

// EffectMap에서 computed key로 사용
return { [FOCUS]: "item-1" };  // ✅ string
return { [FOCUS]: 42 };        // ❌ number ≠ string
```

### ScopeToken — 브랜드 문자열

```typescript
declare const __scopeBrand: unique symbol;

type ScopeToken<Id extends string = string> = Id & {
  readonly [__scopeBrand]: true;
};
```

런타임 값은 일반 문자열(예: `"TODO_LIST"`)이다. 컴파일 타임에 일반 문자열과 구별된다.

```typescript
const TODO = defineScope("TODO");
// typeof TODO = ScopeToken<"TODO">

kernel.group({ scope: TODO });       // ✅
kernel.group({ scope: "TODO" });     // ❌ string ≠ ScopeToken
```

### ContextToken — 래퍼 객체

```typescript
type ContextToken<Id extends string = string, Value = unknown> = {
  readonly __id: Id;
  readonly __phantom?: Value; // 컴파일 타임 전용
};
```

런타임 값은 객체 `{ __id: "NOW" }`이다. phantom 프로퍼티를 통해 Value 타입을 운반한다.

> [!NOTE]
> ContextToken이 브랜드 문자열 대신 래퍼 객체를 사용하는 이유는 TypeScript의 mapped type이 브랜드 문자열에서 Value를 추론하지 못하기 때문이다. 객체 형태를 사용해야 `InjectResult<Tokens>`가 `[ContextToken<"NOW", number>, ContextToken<"USER", User>]`에서 `{ NOW: number, USER: User }`를 올바르게 도출할 수 있다.

### Command — 브랜드 객체

```typescript
declare const __commandBrand: unique symbol;

type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly scope?: ScopeToken[];
  readonly [__commandBrand]: true;
};
```

수동으로 생성할 수 없다. `defineCommand()`가 반환하는 CommandFactory만이 유효한 Command를 생성할 수 있다.

```typescript
dispatch(INCREMENT());                  // ✅ CommandFactory가 브랜드 Command를 생성
dispatch({ type: "INCREMENT" });        // ❌ 브랜드 심볼 누락
dispatch({ type: "INCREMENT" } as any); // ⚠️ 컴파일되지만 안전장치를 우회
```

### CommandFactory — 팩토리 함수

```typescript
type CommandFactory<Type extends string = string, Payload = void> = {
  (...args: /* conditional */): Command<Type, Payload>;
  readonly commandType: Type;
  readonly id: string;
  readonly handler: InternalCommandHandler;
  readonly tokens: ContextToken[];
};
```

CommandFactory에 `handler`와 `tokens`를 포함시킨 이유는 `register()` 패턴을 지원하기 위해서다. 프로덕션 커널에서 정의한 CommandFactory를 테스트 커널에 `kernel.register(factory)`로 전달하면, factory에서 handler와 tokens를 읽어 동일한 핸들러를 재등록할 수 있다. 프로덕션과 테스트 환경이 동일한 코드를 공유하게 된다.

페이로드 처리는 조건부로 동작한다.

```typescript
// void 페이로드 — 인자 불필요
const INC = kernel.defineCommand("INC", handler);
INC();     // ✅
INC(42);   // ❌ 컴파일 오류

// 타입 페이로드 — 인자 필수
const SET = kernel.defineCommand("SET", (ctx) => (v: number) => ...);
SET(42);       // ✅
SET();         // ❌ 컴파일 오류 — number 필요
SET("wrong");  // ❌ 컴파일 오류 — string ≠ number
```

---

## 타입 추론 체인

`createKernel`에서 핸들러의 `ctx`까지 전체 체인이 수동 주석 없이 추론된다.

### 상태 타입

```typescript
const kernel = createKernel<{ count: number; name: string }>({
  count: 0, name: "",
});

kernel.defineCommand("INC", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  //                      ^^^^^ number — createKernel<S>에서 추론됨
}));
```

### 페이로드 타입

```typescript
kernel.defineCommand("SET", (ctx) => (value: number) => ({
  state: { ...ctx.state, count: value },
  //                             ^^^^^ number — 핸들러 시그니처에서 추론됨
}));
```

### 주입 컨텍스트 타입

```typescript
const NOW = kernel.defineContext("NOW", (): number => Date.now());
const USER = kernel.defineContext("USER", () => ({ name: "Alice" }));

const g = kernel.group({ inject: [NOW, USER] });

g.defineCommand("CMD", (ctx) => () => {
  ctx.NOW;          // number    (ContextToken<"NOW", number>에서 추론)
  ctx.USER.name;    // string    (ContextToken<"USER", { name: string }>에서 추론)
  ctx.state.count;  // number    (createKernel<S>에서 추론)
});
```

추론 과정은 다음과 같다.

```
group({ inject: [NOW, USER] })
  → createGroup<S, E, [ContextToken<"NOW", number>, ContextToken<"USER", {name: string}>]>
  → TypedContext<S, InjectResult<Tokens>>
  → TypedContext<S, { NOW: number; USER: { name: string } }>
  → ctx = { state: S; NOW: number; USER: { name: string } }
```

### EffectToken 타입

```typescript
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {});

return {
  [NOTIFY]: "hello",  // ✅ string
  [NOTIFY]: 42,       // ❌ 컴파일 오류 — number ≠ string
};
```

---

## 헬퍼 타입

### InjectResult

ContextToken 튜플에서 주입된 컨텍스트 필드를 도출한다.

```typescript
type InjectResult<T extends ContextToken[]> = {
  [K in T[number] as K["__id"]]: K extends ContextToken<string, infer V> ? V : never;
};

// InjectResult<[ContextToken<"NOW", number>, ContextToken<"USER", User>]>
// = { NOW: number; USER: User }
```

### TypedContext

상태와 주입된 값을 결합한 핸들러 컨텍스트 타입이다.

```typescript
type TypedContext<S, Injected = Record<string, never>> = {
  readonly state: S;
} & Readonly<Injected>;
```

### BaseCommand

구체적인 타입을 알 수 없는 저장 및 디스패치에 사용되는 제네릭 커맨드 인터페이스다.

```typescript
interface BaseCommand {
  readonly type: string;
  readonly payload?: unknown;
  readonly scope?: ScopeToken[];
}
```

### MiddlewareContext

미들웨어 훅을 통해 전달되는 컨텍스트다.

```typescript
type MiddlewareContext = {
  command: Command;
  state: unknown;
  handlerScope: string;
  effects: Record<string, unknown> | null;
  injected: Record<string, unknown>;
};
```

---

## 안티패턴

```typescript
// ❌ 원시 문자열 디스패치 — 컴파일 오류
dispatch({ type: "INCREMENT", payload: undefined });

// ❌ dispatch 오버로딩 — 지원하지 않음
dispatch("INCREMENT");
dispatch("SET_COUNT", 42);

// ✅ CommandFactory 패턴 — 유일한 방법
dispatch(INCREMENT());
dispatch(SET_COUNT(42));
```

---

## 다음

→ [미들웨어](./06-middleware.md) — 미들웨어 시스템 상세 설명
