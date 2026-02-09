# [kernel] Unified Group API — 방식, 한계, 사용법, 개선점

## 1. 개요 (Overview)

Kernel v2는 기존 `defineCommand`의 12개 오버로드 + `inject()` 5개 오버로드를 **단일 Group 인터페이스**로 통합했다.
핵심 변경: ContextToken을 branded string에서 wrapper object로 교체하여 TypeScript 타입 추론 문제를 해결.

**변경 규모**: 14 files, +1184 -752 lines, 커밋: `01ff21f`

---

## 2. 방식 (Approach)

### 2.1 Group 인터페이스

```typescript
const kernel = createKernel({ state: state<AppState>(), effects: {} });

// kernel은 GLOBAL scope의 Group
kernel.defineCommand(...)   // 커맨드 등록
kernel.defineEffect(...)    // 이펙트 등록 (스코프됨)
kernel.defineContext(...)   // 컨텍스트 등록
kernel.group({ scope?, inject? })  // 자식 Group 생성
kernel.dispatch(cmd)        // 디스패치
kernel.use(middleware)      // 미들웨어 등록
kernel.reset(initialState)  // 상태 리셋
```

### 2.2 ContextToken 인코딩

```typescript
// Before: branded string (TS 추론 실패)
type ContextToken<Id, Value> = Id & { readonly [__contextBrand]: Value };

// After: wrapper object (추론 성공)
type ContextToken<Id, Value> = { readonly __id: Id; readonly __phantom?: Value };
```

`InjectResult`가 `K["__id"]`로 키를 직접 접근 — 조건부 타입 추출 불필요.

### 2.3 Group Inject (re-frame coeffect 패턴)

```typescript
const NOW = defineContext("NOW", () => Date.now());
const g = kernel.group({ inject: [NOW] });

// ctx.NOW는 자동으로 number 타입
const CMD = g.defineCommand("CMD", (ctx) => ({
  state: { result: ctx.NOW },
}));
```

- `inject`는 per-command 인터셉터로 자동 등록
- Handler 앞에서 `resolveContext(id)` 호출하여 값 주입
- 그룹에 속하지 않은 커맨드는 inject 실행 안 됨

### 2.4 Scoped Effects (버블링)

```typescript
// 전역 이펙트
kernel.defineEffect("TOAST", (msg) => systemToast(msg));

// 위젯 스코프 오버라이드
const widget = kernel.group({ scope: TODO });
widget.defineEffect("TOAST", (msg) => widgetPopup(msg));
```

이펙트 실행 시 `scopePath → GLOBAL` 순서로 핸들러를 탐색.

---

## 3. 한계 (Limitations)

### L1. Payload 핸들러의 ctx 추론 실패

```typescript
// ✅ No-payload: ctx 자동 추론
kernel.defineCommand("INC", (ctx) => ({ ... }));

// ❌ With-payload: ctx가 any — 명시적 타입 필요
kernel.defineCommand("SET", (ctx: { readonly state: S }, payload: number) => ({ ... }));
```

**원인**: TypeScript의 2-arg 오버로드 추론 한계. `Ctx`가 closure 제네릭에 의존하면
TS가 `(ctx, payload)` 시그니처에서 `ctx`를 contextual하게 바인딩하지 못함.

**영향**: payload가 있는 커맨드마다 `ctx` 타입을 수동으로 적어야 함. 전체 커맨드의 약 20-30%에 해당.

### L2. effects 제네릭 E의 비활용

현재 `createKernel({ effects: {} })`로 빈 객체를 넘기고 `kernel.defineEffect`로 이펙트를 등록한다.
이때 **E = `{}`** 이므로 `TypedEffectMap`에 이펙트 타입이 반영되지 않는다.
핸들러 반환값에서 `{ [NOTIFY]: "msg" }` 같은 이펙트 키는 타입 체크 받지 않음.

### L3. ContextToken이 더 이상 string이 아님

Runtime에서 `ContextToken`은 `{ __id: "NOW" }` 객체. 기존에 string으로 사용하던 코드는 모두 `.__id`로 접근해야 함.
현재는 내부적으로 `resolveContext`만 접근하므로 문제 없지만, 외부에서 토큰을 Map 키로 사용하려면 주의 필요.

---

## 4. 사용법 (Usage)

### 기본: 커맨드 + 이펙트

```typescript
import { createKernel, state, defineContext, initKernel, dispatch } from "@kernel";

// 1. 커널 생성
const kernel = createKernel({ state: state<AppState>(), effects: {} });
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => toast(msg));

// 2. 스토어 초기화
initKernel<AppState>({ count: 0, items: [] });

// 3. 커맨드 정의
const INC = kernel.defineCommand("INC", (ctx) => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  [NOTIFY]: `count = ${ctx.state.count + 1}`,
}));

// 4. 디스패치
dispatch(INC());
```

### 컨텍스트 주입

```typescript
const NOW = defineContext("NOW", () => Date.now());
const USER = defineContext("USER", () => getCurrentUser());

// inject가 필요한 커맨드만 그룹으로
const g = kernel.group({ inject: [NOW, USER] });

const LOG_ACTION = g.defineCommand("LOG_ACTION", (ctx) => ({
  state: {
    ...ctx.state,
    log: [...ctx.state.log, {
      time: ctx.NOW,     // number
      user: ctx.USER,    // User
    }],
  },
}));
```

### 스코프 + 오버라이드

```typescript
import { defineScope } from "@kernel";

const DIALOG = defineScope("DIALOG");
const dialog = kernel.group({ scope: DIALOG });

// 이 스코프에서 NOTIFY를 다르게 처리
dialog.defineEffect("NOTIFY", (msg) => dialogAlert(msg));

// 이 스코프의 커맨드는 DIALOG 스코프에서 실행
const CLOSE = dialog.defineCommand("CLOSE", (ctx) => ({
  state: { ...ctx.state, open: false },
}));
```

---

## 5. 개선점 (Future Improvements)

### I1. Payload 핸들러 ctx 자동 추론

`InferPayload<H>` 접근은 TS의 deferred conditional type 때문에 실패했다.
대안:

- **TS 5.x의 `NoInfer<T>`** 유틸리티가 안정화되면 payload 위치에 적용하여 ctx 추론 우선
- **Handler를 제네릭 함수가 아닌 concrete 타입으로** — Group이 자체적으로 `Handler<S, P>` 타입을 제공
- **config object 패턴**: `defineCommand({ type, payload: p<number>(), handler })` — PayloadMarker로 분리

### I2. Effects 타입 안전성 복구

`createKernel`의 `effects` 파라미터에 실제 토큰을 넘기면 `E` 제네릭이 활성화된다.
하지만 현재 `defineEffect`가 Group 메서드이므로 "닭과 달걀" 문제가 있다.

가능한 해결:
```typescript
// 1단계: 이펙트 먼저 선언 (standalone)
const NOTIFY = defineEffect("NOTIFY", (msg: string) => toast(msg));

// 2단계: 커널에 이펙트 등록 (타입 바인딩)
const kernel = createKernel({ state: state<S>(), effects: { NOTIFY } });
```
→ `defineEffect`를 다시 standalone으로 되돌리되, Group에서도 오버라이드 가능하게.

### I3. Group 스코프 트리 자동 구성

현재 `group({ scope })` 호출 시 스코프 트리가 자동으로 구성되지 않는다.
`dispatch(cmd, { scope: [CHILD, PARENT, GLOBAL] })` 형태로 수동 bubblePath를 넘겨야 한다.

개선: Group이 `parent` 참조를 가지고 자동 bubblePath 생성.

### I4. defineContext를 Group 메서드로 옮기기

현재 `defineContext`는 standalone 함수. Group 메서드로 이동하면:
- 스코프별 컨텍스트 오버라이드 가능
- 컨텍스트 해제(clear)가 스코프 단위로 가능
- 테스트에서 mock 주입이 더 깔끔해짐
