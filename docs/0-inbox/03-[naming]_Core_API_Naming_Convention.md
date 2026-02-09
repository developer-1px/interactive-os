# 코어 API 네이밍 컨벤션 — FE 친화적 re-frame

> 날짜: 2026-02-09
> 태그: naming, API, re-frame, convention
> 상태: Draft

---

## 1. 원칙

re-frame의 **개념은 계승**하되, Clojure 관용구(`reg-event-fx`, `cofx`, `inject-cofx`)를 버리고
React/FE 생태계에서 **이미 검증된 네이밍 패턴**을 사용한다.

참조한 FE 관용구:

| 출처 | 패턴 | 예시 |
|---|---|---|
| Redux Toolkit | `create*` | `createSlice`, `createAction`, `createSelector` |
| Pinia / Vue | `define*` | `defineStore`, `defineComponent` |
| React | `use*` | `useQuery`, `useSelector`, `useMutation` |
| Zustand | 동사 직접 | `create`, `set`, `get`, `subscribe` |
| XState | 평이한 영어 | `send`, `assign`, `invoke` |
| TanStack Query | 역할 명사 | `query`, `mutation`, `queryClient` |

**선택 기준:**

1. **FE 개발자가 import 자동완성에서 보고 바로 역할을 아는 이름**
2. `define*` — 등록/선언 계열 (한 번 부르고 끝)
3. `use*` — React 훅 (컴포넌트 안에서)
4. 나머지는 평이한 영어 동사/명사

---

## 2. 핵심 매핑 테이블

### 2.1 프레임워크 프리미티브

| re-frame | 제안 이름 | 역할 | 시그니처 |
|---|---|---|---|
| `dispatch` | **`dispatch`** | 이벤트 발행 (단일 진입점) | `dispatch(event: Event): void` |
| `reg-event-db` | **`defineHandler`** | 순수 상태 변환 핸들러 등록 | `defineHandler(id, (db, payload) => db)` |
| `reg-event-fx` | **`defineCommand`** | 이펙트 반환 핸들러 등록 | `defineCommand(id, (ctx, payload) => EffectMap)` |
| `reg-fx` | **`defineEffect`** | 이펙트 실행기 등록 | `defineEffect(id, (value) => void)` |
| `reg-cofx` | **`defineContext`** | 컨텍스트 제공자 등록 | `defineContext(id, () => value)` |
| `inject-cofx` | **`inject`** | 핸들러에 컨텍스트 주입 선언 | `inject(id): Interceptor` |
| `reg-sub` | **`defineComputed`** | 파생 상태 등록 | `defineComputed(id, (db, args) => value)` |
| `subscribe` | **`useComputed`** | React 훅: 파생 상태 구독 | `useComputed([id, ...args]): T` |
| interceptor | **`middleware`** | before/after 훅 | `{ id, before?, after? }` |
| `reg-global-interceptor` | **`use` (global)** | 글로벌 미들웨어 등록 | `use(middleware)` |

### 2.2 데이터 타입

| re-frame | 제안 이름 | 설명 |
|---|---|---|
| `app-db` | **`Store`** / **`db`** | 단일 상태 트리 |
| `coeffects` | **`Context`** / **`ctx`** | 핸들러가 읽는 읽기 전용 컨텍스트 |
| `effects map` | **`EffectMap`** | 핸들러가 반환하는 이펙트 선언 |
| `event` | **`Event`** | `{ type: string, payload?: unknown }` |
| `interceptor` | **`Middleware`** | `{ id, before?, after? }` |
| `subscription` | **`Computed`** | 파생 상태 정의 |

### 2.3 내장 이펙트 키

| re-frame | 제안 이름 | 설명 |
|---|---|---|
| `:db` | **`"db"`** | 상태 업데이트 (동일) |
| `:dispatch` | **`"dispatch"`** | 이벤트 재발행 (동일) |
| `:dispatch-later` | **`"defer"`** | 지연 이벤트 발행 |
| `:fx` | **`"batch"`** | 복수 이펙트 일괄 실행 |
| (커스텀) | **`"focus"`** | DOM 포커스 |
| (커스텀) | **`"scroll"`** | 스크롤 |
| (커스텀) | **`"clipboard"`** | 클립보드 |
| (커스텀) | **`"toast"`** | 토스트 알림 |

---

## 3. 코드 비교

### 3.1 핸들러 등록

```typescript
// ❌ re-frame (Clojure 관용구)
regEventFx("navigate", [injectCofx("dom-items")], (cofx, payload) => {
  return { db: nextDb, focus: "item-3" };
});

// ✅ 제안 (FE 관용구)
defineCommand("navigate", [inject("dom-items")], (ctx, payload) => {
  return { db: nextDb, focus: "item-3" };
});
```

### 3.2 상태만 변경하는 단순 핸들러

```typescript
// ❌ re-frame
regEventDb("set-active-zone", (db, zoneId) => {
  return { ...db, focus: { ...db.focus, activeZoneId: zoneId } };
});

// ✅ 제안
defineHandler("set-active-zone", (db, zoneId) => {
  return { ...db, focus: { ...db.focus, activeZoneId: zoneId } };
});
```

### 3.3 이펙트 등록

```typescript
// ❌ re-frame
regFx("focus", (targetId) => {
  document.getElementById(targetId)?.focus({ preventScroll: true });
});

// ✅ 제안
defineEffect("focus", (targetId) => {
  document.getElementById(targetId)?.focus({ preventScroll: true });
});
```

### 3.4 컨텍스트(코이펙트) 등록 및 주입

```typescript
// ❌ re-frame
regCofx("dom-items", (cofx) => {
  return { ...cofx, "dom-items": queryItems(cofx.db.focus.activeZoneId) };
});

regEventFx("navigate", [injectCofx("dom-items")], (cofx, payload) => { ... });

// ✅ 제안
defineContext("dom-items", () => {
  return queryItems(getDb().focus.activeZoneId);
});

defineCommand("navigate", [inject("dom-items")], (ctx, payload) => { ... });
```

### 3.5 파생 상태 등록 및 사용

```typescript
// ❌ re-frame
regSub("focused-item", (db, [_, zoneId]) => db.focus.zones[zoneId]?.focusedItemId);

// 컴포넌트에서
const focusedId = useSubscription(["focused-item", zoneId]);

// ✅ 제안
defineComputed("focused-item", (db, [_, zoneId]) => db.focus.zones[zoneId]?.focusedItemId);

// 컴포넌트에서
const focusedId = useComputed(["focused-item", zoneId]);
```

### 3.6 미들웨어

```typescript
// ❌ re-frame
const myInterceptor = {
  id: "transaction",
  before: (context) => { ... },
  after: (context) => { ... },
};

// ✅ 제안 (동일 구조, 이름만 변경)
const transaction: Middleware = {
  id: "transaction",
  before: (context) => { ... },
  after: (context) => { ... },
};

use(transaction);  // 글로벌 등록
```

---

## 4. 전체 API 한눈에

```typescript
// ── 프레임워크 셋업 ──
import { dispatch, defineHandler, defineCommand, defineEffect, defineContext, defineComputed, inject, use } from "@os/core";

// ── React 바인딩 ──
import { useComputed, useDispatch } from "@os/react";

// ── 스토어 접근 ──
import { getDb, resetDb } from "@os/core";
```

### 등록 (앱 초기화 시)

```typescript
// 상태만 바꾸는 핸들러
defineHandler("set-theme", (db, theme) => ({ ...db, theme }));

// 이펙트까지 반환하는 커맨드
defineCommand("navigate", [inject("dom-items"), inject("zone-config")], (ctx, payload) => ({
  db: moveFocus(ctx.db, payload.direction),
  focus: nextItemId,
  scroll: nextItemId,
}));

// 이펙트 실행기
defineEffect("focus", (id) => document.getElementById(id)?.focus());
defineEffect("scroll", (id) => document.getElementById(id)?.scrollIntoView({ block: "nearest" }));

// 컨텍스트 제공자
defineContext("dom-items", () => queryDOMItems(getDb().focus.activeZoneId));
defineContext("zone-config", () => getZoneConfig(getDb().focus.activeZoneId));

// 파생 쿼리
defineQuery("focused-item", (db, [_, zoneId]) => db.focus.zones[zoneId]?.focusedItemId);
defineQuery("is-focused", (db, [_, zoneId, itemId]) => db.focus.zones[zoneId]?.focusedItemId === itemId);

// 글로벌 미들웨어
use(transactionMiddleware);
use(loggingMiddleware);  // DEV only
```

### 실행 (런타임)

```typescript
// 센서에서
dispatch({ type: "navigate", payload: { direction: "down" } });

// 컴포넌트에서
function FocusItem({ id }: { id: string }) {
  const isFocused = useQuery(["is-focused", groupId, id]);
  const send = useDispatch();

  return <li data-focused={isFocused} onMouseDown={() => send({ type: "focus", payload: { id } })} />;
}
```

---

## 5. 네이밍 선택 근거

### `defineCommand` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `defineCommand` | ✅ | Pinia `defineStore` 패턴. "이펙트를 반환하는 핸들러"라는 뜻이 명확 |
| `createCommand` | ❌ | Redux Toolkit 패턴이지만 인스턴스를 만드는 느낌. 등록이 아님 |
| `registerCommand` | ❌ | 정확하지만 길다. `define`이 더 현대적 |
| `handleCommand` | ❌ | 핸들러 자체와 혼동 |
| `onCommand` | ❌ | 이벤트 리스너 느낌. 컴포넌트 prop 같음 |

### `defineHandler` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `defineHandler` | ✅ | `(db, payload) => db` — "상태 핸들러". Redux reducer와 동일 역할 |
| `defineReducer` | ❌ | 개념은 맞지만 Redux의 `switch/case` 패턴을 연상시킴 |
| `defineEvent` | ❌ | 이벤트 자체를 정의하는 건지 핸들러를 정의하는 건지 모호 |

### `defineEffect` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `defineEffect` | ✅ | Effect-TS, React `useEffect`와 같은 계열. "부수효과 실행기" 명확 |
| `registerEffect` | ❌ | 길다 |
| `createEffect` | ❌ | 인스턴스 생성 느낌 |
| `onEffect` | ❌ | 리스너 느낌 |

### `defineContext` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `defineContext` | ✅ | React `createContext`와 유사. "읽기 전용 데이터 제공" 역할 명확 |
| `defineProvider` | ❌ | React Provider 패턴과 혼동 (JSX 래퍼 느낌) |
| `defineCofx` | ❌ | Clojure 용어 |
| `defineInput` | ❌ | form input과 혼동 |

### `defineQuery` + `useQuery` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `defineQuery` + `useQuery` | ✅ | TanStack Query와 동일 패턴. FE 개발자 모두 익숙 |
| `defineSelector` + `useSelector` | ❌ | Redux 패턴이지만 "구독 + 캐시 + 계층" 의미가 약함 |
| `defineSub` + `useSubscription` | ❌ | re-frame 직역. FE에서 낯섦 |
| `defineComputed` + `useComputed` | ❌ | Vue 패턴. React 진영에서 어색 |

### `inject` vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `inject` | ✅ | Angular DI, Vue `inject`. 짧고 의미 명확 |
| `withContext` | ❌ | HOC 패턴 느낌 |
| `require` | ❌ | Node.js `require`와 충돌 |
| `need` | ❌ | 비표준 |

### `use` (글로벌 미들웨어) vs 대안

| 후보 | 채택 | 이유 |
|---|---|---|
| `use` | ✅ | Express `app.use()`, Pinia `app.use(pinia)`. 미들웨어 등록의 표준 |
| `addMiddleware` | ❌ | 길다 |
| `applyMiddleware` | ❌ | Redux `applyMiddleware`이지만 store 생성 시점 전용 |

### `dispatch` — 변경 없음

| 후보 | 채택 | 이유 |
|---|---|---|
| `dispatch` | ✅ | Redux, re-frame, XState, useReducer 모두 사용. **업계 표준** |
| `send` | ❌ | XState에서 사용하지만 "이벤트 전송"보다 "명령 발행" 뉘앙스가 더 맞음 |
| `emit` | ❌ | EventEmitter 패턴. 옵저버 패턴 연상 |

---

## 6. 요약 치트시트

```
┌─────────────────────────────────────────────────────┐
│  define*  →  등록 (앱 초기화 시 한 번)                 │
│                                                     │
│  defineHandler(id, fn)     상태만 바꾸는 순수 핸들러    │
│  defineCommand(id, fn)     이펙트를 선언하는 커맨드     │
│  defineEffect(id, fn)      이펙트 실행기               │
│  defineContext(id, fn)      읽기 컨텍스트 제공자        │
│  defineQuery(id, fn)        파생 상태 쿼리             │
├─────────────────────────────────────────────────────┤
│  런타임                                               │
│                                                     │
│  dispatch(event)           이벤트 발행                 │
│  inject(id)                커맨드에 컨텍스트 주입       │
│  use(middleware)            글로벌 미들웨어 등록         │
├─────────────────────────────────────────────────────┤
│  React 훅                                            │
│                                                     │
│  useQuery([id, ...args])   구독 (자동 캐시/최적화)     │
│  useDispatch()             dispatch 함수 획득          │
└─────────────────────────────────────────────────────┘
```
