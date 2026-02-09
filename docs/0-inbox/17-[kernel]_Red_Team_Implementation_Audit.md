# Kernel 구현 레드팀 감사 보고서

> 날짜: 2026-02-09
> 태그: kernel, audit, red-team, implementation
> 상태: Analysis Complete (v3 — Group API 반영, C1/H2/H4 해결)
> 범위: `packages/kernel/src/` 전체 (11개 소스 파일 + 4개 테스트 + KernelLabPage + KernelLabBot)
> 기준: 14-[kernel]\_Type\_Safety\_Evaluation\_and\_Improvement.md, 13-[kernel]\_Scope\_Final\_Design.md, 2-area/06-kernel/00-overview.md

---

## 0. 요약

현재 Kernel 구현은 **문서 14(Token 타입 시스템)와 문서 13(Scope 설계)의 설계를 상당 부분 반영**하였다. Token 패턴, Scoped Registry, Bubbling Dispatch가 구현되어 있다. 그러나 면밀히 조사한 결과 **타입 안전성의 핵심 허점, 문서 괴리, 안정성 이슈**가 발견되었다.

| 심각도 | 발견 수 | 해결 |
|--------|--------|------|
| CRITICAL — 설계 목표 미달성 | 1 | **1 해결** (C1) |
| HIGH — 문서 괴리 / 타입 위반 | 4 | **3 해결** (H1, H2, H4) |
| MEDIUM — 코드 품질 / 안정성 | 5 | — |
| LOW — 정리 / 일관성 | 5 | — |
| 의도적 설계 (이슈 아님) | 3 | — |

---

## 1. CRITICAL — 설계 목표 미달성

### C1. Context Token 타입 추론이 실제로 동작하지 않는다 — ✅ RESOLVED

> **해결:** Unified Group API (doc 19) 적용으로 해결됨.
> - ContextToken을 branded string에서 **wrapper object** `{ __id: Id; __phantom?: Value }`로 변경
> - `inject()` 인터셉터 제거 → **group config** `inject: [...]`로 대체
> - `createGroup<S, E, Tokens>`의 Tokens 제네릭이 `TypedContext<S, InjectResult<Tokens>>`를 통해 handler ctx에 자동 전파
> - `InjectResult` mapped type이 wrapper object의 `K["__id"]`를 통해 정상 추론

**이전 문제:**

`defineCommand`의 오버로드 시그니처에서 handler의 ctx 타입은 `TypedContext<S>`로 고정되었다. `inject(DOM_ITEMS)`로 전달한 interceptor의 토큰 타입이 ctx의 제네릭에 전파되지 않았다. branded string의 TS mapped type 추론 실패가 근본 원인이었다.

**현재 구현:**
```typescript
// Group config에서 inject 선언 → ctx에 자동 타입 추론
const { defineCommand } = kernel.group({ inject: [NOW, AUTH] });
defineCommand("USE_TIME", (ctx) => {
  ctx.NOW;    // number — 자동 추론 ✅
  ctx.AUTH;   // AuthInfo — 자동 추론 ✅
  ctx.state;  // S — 자동 추론 ✅
});
```

---

## 2. HIGH — 문서 괴리 / 타입 위반

### H1. 설계 문서(14, 16)가 CommandFactory 패턴을 반영하지 않는다 — ✅ RESOLVED

> **해결:** 문서 16이 CommandFactory 패턴 + Group API로 전면 업데이트됨.

**CommandFactory가 올바른 이유:** `dispatch(TOKEN, payload)` 형태는 payload 유무에 따라 오버로딩이 필요하다. **LLM이 오버로드 시그니처에서 환각을 일으킬 위험**이 있으며, 이를 원천 차단하기 위해 "Factory가 Command를 생성하고, dispatch는 Command만 받는다"는 단일 시그니처 패턴을 채택했다.

### H2. dispatch 함수의 _scope 밀수 패턴 — ✅ RESOLVED

> **해결:** `scope`가 Command 타입의 **정식 필드**가 되었다 (`tokens.ts`).
> CommandFactory가 Group의 scope를 자동으로 Command에 부여한다.
> `_scope` 밀수 패턴 제거, `as unknown` 이중 캐스팅 제거.

**이전 문제:**

`_scope`는 `Command` 타입에 존재하지 않는 필드였다. `as Command` 캐스팅으로 밀수한 뒤, 소비처에서 `as unknown as { _scope? }` 이중 캐스팅으로 추출했다.

**현재 구현:**
```typescript
// tokens.ts — scope가 정식 필드
type Command<Type, Payload> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly scope?: ScopeToken[];   // ✅ 정식 필드
  readonly [__commandBrand]: true;
};

// registry.ts — CommandFactory가 자동으로 scope 부여
const factory = (payload?) => ({
  type, payload,
  scope: scope !== "GLOBAL" ? [scope as ScopeToken] : undefined,
});

// dispatch — cmd.scope 직접 사용 (밀수 없음)
processCommand(next, next.scope);
```

### H3. Store가 untyped singleton — 타입 정보 전파 단절

```typescript
// store.ts:12
let activeStore: Store<unknown> | null = null;

// store.ts:32-36
export function getState<S = unknown>(): S {
  return activeStore.getState() as S;  // unchecked cast
}
```

`initKernel<TestState>(...)` 호출 시 `TestState` 타입 정보는 `bindStore`에서 `Store<unknown>`으로 소멸된다. 이후 `getState<TestState>()`는 사용자가 올바른 타입을 수동 지정해야 한다 — 틀려도 컴파일러가 잡지 못한다.

`useComputed`도 동일: `selector: (state: unknown) => T` — state 타입 추론 없음.

### H4. executeEffects에 에러 핸들링이 없다 — ✅ RESOLVED

> **해결:** 커스텀 effect 실행에 **try-catch** 추가.
> 개별 effect 실패가 나머지 effect 실행을 차단하지 않는다.
> dispatch의 `processing = false`는 `try-finally` 블록에서 보장된다.

**이전 문제:**

커스텀 effect handler가 throw하면 나머지 이펙트 미실행, 트랜잭션 기록 유실, dispatch 데드락 위험이 있었다.

**현재 구현:**
```typescript
// registry.ts — executeEffects
if (effectHandler) {
  try {
    effectHandler(value);
  } catch (err) {
    console.error(`[kernel] Effect "${key}" threw:`, err);
  }
}

// dispatch — try-finally로 processing 보장
processing = true;
try {
  while (queue.length > 0) {
    const next = queue.shift()!;
    processCommand(next, next.scope);
  }
} finally {
  processing = false;
}
```

---

## 3. MEDIUM — 코드 품질 / 안정성

### M1. KernelLabPage의 커맨드 이중 등록

`KernelLabPage.tsx`에서 모든 커맨드가 **두 번 정의**된다:

1. 모듈 레벨 (`lines 53-118`): `const INCREMENT = kernel.defineCommand("increment", ...)`
2. `setupKernel()` 내부 (`lines 131-192`): `kernel.defineCommand("increment", ...)` (반환값 무시)

`resetKernel()`이 레지스트리를 비우기 때문에 `setupKernel()`에서 재등록이 필요하다. 하지만:
- 7개 커맨드 × 2 = 14개 정의 — 코드 중복 100%
- 모듈 레벨의 CommandFactory(`INCREMENT` 등)는 `setupKernel()` 후에도 유효 — 같은 type string을 가리키므로
- `defineEffect("notify", ...)` 역시 `setupKernel()`에서 재등록 (`line 189`)

### M2. KernelLabBot 테스트가 현재 구현과 불일치

```typescript
// KernelLabBot.tsx:225-243 — "Shows handler vs command type"
const handlerBadge = await t.getByText("handler");
const commandBadge = await t.getByText("command");
```

현재 Transaction 타입은 `handlerScope: string` (e.g., `"GLOBAL"`)이다. `"handler"` / `"command"` 배지는 구 Transaction 타입의 `handlerType: "handler" | "command" | "unknown"` 기반이었다. 이 테스트는 **실패하거나 잘못된 요소를 매칭**한다.

### M3. EffectMap — 타입 수준에서는 strict, 런타임은 open

타입 수준: `TypedEffectMap<S, E>` (`tokens.ts:79`)는 `state`, `dispatch`, + EffectFields만 허용 → index signature 없음 ✅
런타임 수준: `executeEffects` (`registry.ts:398`)는 `Object.entries(effectMap)`로 모든 key를 순회

**평가:** `defineCommand` 오버로드가 handler 반환값을 `TypedEffectMap`으로 강제하므로, 올바르게 타이핑된 코드에서는 typo가 런타임에 도달할 경로가 없다. 내부 `as unknown as InternalCommandHandler` 캐스팅은 구현 편의이지 외부 API를 통한 우회가 아니다. 타입 검증이 컴파일 타임에 작동하는 한 MEDIUM으로 충분하다.

### M4. Middleware before에서 command.type을 바꾸면 handler lookup이 변경된다

```typescript
// registry.ts:340
const resolvedType = mwCtx.command.type;
const handler = scopeMap?.get(resolvedType);
```

before middleware가 `command.type`을 변경하면 다른 handler가 실행된다 (step2 테스트에서 이를 활용). 이것은 강력하지만:
- type이 바뀌면 해당 command의 interceptors도 바뀜 — 의도되지 않은 inject 전환 가능
- Transaction에 기록되는 command는 변환된 버전 — 원본 추적 불가

### M5. Command.payload가 void일 때 undefined로 전달된다

```typescript
// tokens.ts:46-48
type CommandFactory<Type, Payload = void> = {
  (...args: Payload extends void ? [] : [payload: Payload]): Command<Type, Payload>;
};

// registry.ts:170-174
const factory = (payload?: unknown) =>
  ({ type, payload: payload as P }) as unknown as Command<string, P>;
```

`INCREMENT()` 호출 시 payload가 `undefined`가 된다. `Command<"INCREMENT", void>`이지만 런타임에서 `{ type: "INCREMENT", payload: undefined }`가 생성된다. handler가 `payload` 인자를 받으면 `undefined`가 전달된다.

---

## 4. LOW — 정리 / 일관성

### L1. dispatch.ts, middleware.ts는 re-export 전용 shim

```typescript
// dispatch.ts — 전체 내용
export { dispatch } from "./registry.ts";

// middleware.ts — 전체 내용
export type { Middleware, MiddlewareContext } from "./registry.ts";
export { registerMiddleware as use, clearAllRegistries as clearMiddlewares } from "./registry.ts";
```

프로젝트가 pre-1.0이다. 하위 호환성이 필요 없다. 이 파일들은 삭제하거나 index.ts의 re-export로 대체해야 한다.

특히 `middleware.ts`가 `registerMiddleware`를 `use`로 rename export하지만, 실제 `use`는 `kernel.use()`로 사용해야 한다 — 혼란.

### L2. GLOBAL 상수의 이중 캐스팅

```typescript
// tokens.ts:56
export const GLOBAL: ScopeToken<"GLOBAL"> = "GLOBAL" as ScopeToken<"GLOBAL">;

// registry.ts에서 사용할 때마다:
let scope: string = GLOBAL as string;
const scope = (middleware.scope as string) ?? (GLOBAL as string);
```

`GLOBAL`이 branded string인데, 사용할 때마다 `as string`으로 언브랜딩한다. 내부 코드에서 branded type의 이점이 없다.

### L3. createKernel의 싱글턴 성격이 JSDoc에 명시되지 않았다

`createKernel()`은 문서 13에서 정의된 대로 **OS 수준 싱글턴의 타입 바인딩 팩토리**이다. 인스턴스를 생성하는 것이 아니라 제네릭 `E`(effects)를 캡처하여 `defineCommand`의 반환 타입에 반영한다. 이것은 의도된 설계이나, 이 사실이 JSDoc에 드러나지 않아 "인스턴스를 여러 개 만들 수 있나?"라는 오해를 유발할 수 있다.

### L4. defineEffect의 overwrite 경고가 warn 레벨이다

```typescript
// registry.ts:70-71
if (effects.has(type)) {
  console.warn(`[kernel] effect "${type}" is being overwritten`);
}
```

`KernelLabPage.tsx`의 `setupKernel()`이 매번 `defineEffect("NOTIFY", ...)`를 재등록한다. 이때 이 경고가 콘솔에 출력된다. 개발 중에 노이즈가 된다.

### L5. step3.ts 테스트의 "missing context" 테스트가 정확하지 않다

```typescript
// step3.ts:135
const NONEXISTENT = defineContext("NONEXISTENT", () => undefined as never);
```

`defineContext`를 호출했으므로 provider가 **등록되어 있다**. `inject(NONEXISTENT)`는 provider를 호출하고 `undefined`를 반환한다. 이것은 "missing context"가 아니라 "provider가 undefined를 반환하는 context"이다.

진정한 "missing context" 테스트는 `defineContext` 없이 `inject`만 호출하는 경우여야 한다.

---

## 5. 의도적 설계 (이슈 아님)

### D1. createKernel이 싱글턴이다

보고서 초안에서 HIGH로 분류했으나, 문서 13에서 Kernel은 OS 수준 싱글턴으로 설계되었다. `createKernel`의 역할은 타입 바인딩 팩토리이며, 이것은 의도된 설계이다. → L3으로 이동 (JSDoc 명시 필요).

### D2. createKernel의 effects가 런타임에서 무의미하다

`config.effects`의 유일한 목적은 제네릭 `E`를 추론하는 것이다. 이것은 phantom type 패턴의 본질이다. `defineEffect` 없이 FAKE를 넣으면 런타임 경고가 출력되지만, 이것은 사용자 오류이지 아키텍처 결함이 아니다.

### D3. useDispatch에서 scope 파라미터 생략

React 컴포넌트에서 scope를 직접 지정하는 것은 **OS 계층의 책임**이다. OS의 Sensor가 `buildBubblePath()`를 계산하여 dispatch에 scope를 전달한다. 컴포넌트 레벨의 `useDispatch`에서 scope를 노출하지 않는 것은 레이어 경계 원칙에 부합한다.

---

## 6. 성능 관련 — 현재 스케일에서 미대응

보고서 초안에서 M3(트랜잭션 splice 비효율), M4(depth limit 하드코딩), M5(동기적 리스너 통지)를 지적했으나, **현재 스케일(200 cap, 10 depth, 단일 앱)**에서는 실질적 병목이 아니다. 프로파일링으로 병목이 측정된 후 대응해도 충분하다. 기록만 남기고 우선순위에서 제외한다.

---

## 7. 설계 문서 ↔ 구현 괴리 요약

| 설계 문서 약속 | 실제 구현 | 상태 | 조치 |
|---|---|---|---|
| `dispatch(TOKEN)` | `dispatch(TOKEN())` | ✅ 문서 수정됨 | **해결** (H1) |
| `dispatch(TOKEN, payload)` | `dispatch(TOKEN(payload))` | ✅ 문서 수정됨 | **해결** (H1) |
| `ctx.DOM_ITEMS` 자동 추론 | Group inject → `TypedContext<S, InjectResult<Tokens>>` | ✅ 해결 | **해결** (C1) |
| EffectMap index signature 제거 | 타입 수준 제거 ✅, 런타임 open | ⚠️ 수용 가능 | 모니터링 (M3) |
| Context index signature 제거 | Group inject + wrapper ContextToken으로 해결 | ✅ 해결 | **해결** (C1) |
| `CommandFactory<Type, Payload>` | Group.defineCommand() → CommandFactory | ✅ | — |
| `removeScopedCommand` | 미구현 | 📐 Phase 2 | 예정 |
| `removeScopedMiddleware` | 미구현 | 📐 Phase 2 | 예정 |
| Store 타입 전파 | `Store<unknown>` 싱글턴 | ❌ 타입 소멸 | 검토 (H3) |
| `cmd.scope` 필드 | Command.scope 정식 필드 + Group 자동 부여 | ✅ 해결 | **해결** (H2) |
| Effect 에러 핸들링 | try-catch + try-finally | ✅ 해결 | **해결** (H4) |

---

## 8. 타입 안전성 점수 (문서 14 기준)

| 기준 | 목표 | 현재 |
|------|------|------|
| `dispatch({ type: "typo" })` 컴파일 | ❌ 에러 | ⚠️ `as any` 쓰면 통과 |
| `dispatch(SET_COUNT("wrong"))` 컴파일 | ❌ 에러 | ✅ CommandFactory가 잡음 |
| `{ ntoify: "hello" }` EffectMap 컴파일 | ❌ 에러 | ✅ TypedEffectMap이 잡음 |
| `ctx.NONEXISTENT` 접근 컴파일 | ❌ 에러 | ✅ Group inject로 TypedContext 전파 |
| `inject("raw-string")` 컴파일 | ❌ 에러 | ✅ inject 제거, group config + ContextToken |
| `as` 캐스팅 사용 횟수 (외부 API) | **0** | ✅ **0** (내부 구현만 사용) |
| Token import 후 IDE 자동완성 | ✅ 완전 | ✅ CommandFactory OK, Context OK (Group inject) |

**종합 타입 안전성: 8/10** (v2: 6/10 → v3: 8/10, Group API로 C1 해결)

---

## 9. 우선 수정 권고

### ~~즉시 (CRITICAL)~~ — 해결됨

1. ~~**C1 해결:**~~ ✅ ContextToken wrapper object + Group inject로 해결.

### ~~단기 (HIGH)~~ — 대부분 해결됨

2. ~~**H1 해결:**~~ ✅ 문서 16이 Group API + CommandFactory 패턴으로 전면 업데이트됨.
3. ~~**H2 해결:**~~ ✅ Command.scope 정식 필드 + Group 자동 부여.
4. **H3 미해결:** Store 바인딩 시 State 타입을 보존하는 방안 검토 (제네릭 모듈 변수 또는 createKernel에 State 타입 바인딩).
5. ~~**H4 해결:**~~ ✅ executeEffects에 try-catch + dispatch에 try-finally.

### 중기 (MEDIUM)

6. **M1 해결:** KernelLabPage의 이중 등록 패턴 해소.
7. **M2 해결:** KernelLabBot의 `handler`/`command` 배지 테스트를 `handlerScope` 기반으로 수정.

---

## 10. 결론

**Unified Group API (doc 19) 적용으로 CRITICAL(C1)과 HIGH 3건(H1, H2, H4)이 해결되었다.**

```
v2:  ctx: { state: TestState; NOW?: unknown }  →  ctx["NOW"]     // unknown, 수동 타입
v3:  ctx: TypedContext<S, { NOW: number }>      →  ctx.NOW        // number, 자동 추론 ✅
해결: ContextToken wrapper object + Group inject → createGroup<S, E, Tokens> 제네릭 체인
```

**남은 주요 이슈:**
- **H3 (Store 타입 전파):** `Store<unknown>` 싱글턴 — State 타입 소멸. 유일한 남은 HIGH.
- **M1-M5:** KernelLabPage 이중 등록, KernelLabBot 불일치, EffectMap 런타임 open 등.
- **L1-L5:** shim 파일 정리, GLOBAL 이중 캐스팅 등.

CommandFactory 패턴 + Group API + SCREAMING_CASE 네이밍으로 코드와 문서의 일관성이 크게 향상되었다.
타입 안전성 점수: **2/10 → 6/10 → 8/10**.
