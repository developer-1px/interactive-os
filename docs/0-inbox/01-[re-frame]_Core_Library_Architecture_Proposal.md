# re-frame 원칙 기반 코어 라이브러리 아키텍처 제안서

> 날짜: 2026-02-09
> 태그: re-frame, core-library, architecture
> 상태: Draft

---

## 1. 동기 (Motivation)

현재 interactive-os의 코어는 **이미 re-frame의 핵심 원칙 대부분을 달성**하고 있다.
Effect as Data, 순수 커맨드 함수, 미들웨어 파이프라인, 트랜잭션 로그까지.

하지만 "같은 원칙을 따르는 코드"와 "라이브러리"는 다르다.
현재 코드는 **interactive-os에 하드와이어링된 구현**이지, 다른 프로젝트에서 가져다 쓸 수 있는 라이브러리가 아니다.

이 제안서는 re-frame의 아키텍처를 참조하여 **코어를 추출 가능한 라이브러리 형태로 재설계**하는 방안을 다룬다.

### re-frame에서 가져올 것

| re-frame 원칙 | 현재 달성도 | 제안 |
|---|---|---|
| `app-db` (단일 상태) | ⚠️ 파편화 (focusData + Zone별 스토어 + CommandEngine) | 단일 상태 트리 |
| `reg-event-fx` (이벤트 핸들러 등록) | ⚠️ 하드코딩된 커맨드 맵 | 선언적 레지스트리 |
| `reg-fx` (이펙트 핸들러 등록) | ❌ `executeDOMEffect` 하드코딩 | 플러그인 이펙트 시스템 |
| `inject-cofx` (코이펙트 주입) | ⚠️ `buildContext` 과잉 수집 | lazy cofx 주입 |
| Interceptors (인터셉터 체인) | ✅ 미들웨어 존재 | 인터셉터 데이터로 전환 |
| Subscriptions (구독 그래프) | ❌ ad-hoc selector | 계층적 구독 시스템 |
| `dispatch` (단일 진입점) | ⚠️ 3개 경로 (KeyboardSensor, FocusSensor, 프로그래밍) | 단일 dispatch 큐 |

---

## 2. 핵심 설계 원칙

### 2.1 Six Dominoes — 우리 버전

re-frame의 Six Dominoes를 React + Zustand 환경에 맞게 재해석한다.

```
Domino 1: dispatch(event)           ← 단일 진입점
Domino 2: event-fx handler          ← 순수함수, cofx → fx 맵
Domino 3: fx executor               ← 등록된 이펙트 핸들러 실행
Domino 4: subscription              ← 파생 상태 쿼리
Domino 5: view                      ← React 컴포넌트
Domino 6: DOM                       ← 브라우저 렌더링
```

### 2.2 핵심 규칙

1. **`db`는 하나** — 모든 상태는 하나의 Zustand 스토어에 있다.
2. **이벤트 핸들러는 순수** — `(cofx, payload) → fx-map`. 부수효과 없음.
3. **이펙트는 데이터** — `{ db: nextState, focus: targetId, scroll: targetId }`. 실행은 프레임워크가.
4. **코이펙트는 선언적 주입** — 핸들러가 필요한 것만 명시. 프레임워크가 수집.
5. **구독은 계층적** — Layer 2 구독은 Layer 3 구독을 조합. 불필요한 재계산 없음.

---

## 3. 아키텍처 상세

### 3.1 Domino 1: `dispatch` — 단일 이벤트 큐

현재 문제: KeyboardSensor와 FocusSensor가 독립적으로 dispatch. 경합 조건 가능.

```typescript
// ── 제안: 단일 dispatch 함수 ──

function dispatch(event: OSEvent): void {
  eventQueue.push(event);
  processQueue();
}

function processQueue(): void {
  if (processing) return;  // re-entrance guard built-in
  processing = true;

  while (eventQueue.length > 0) {
    const event = eventQueue.shift()!;
    processEvent(event);
  }

  processing = false;
}
```

**변경점:**
- `CommandEngineStore.dispatch`, `runOS`, `FocusData.setActiveZone` → 모두 `dispatch(event)` 하나로
- 센서는 `dispatch({ type: "NAVIGATE", payload: { direction: "up" } })` 만 호출
- 큐 기반 → 순서 보장, re-entrance 문제 근본 해결

### 3.2 Domino 2: `reg-event-fx` — 이벤트 핸들러 레지스트리

현재 문제: OS 커맨드 맵이 하드코딩. 앱 커맨드와 OS 커맨드가 다른 실행 경로.

```typescript
// ── 제안: 선언적 핸들러 등록 ──

// 핸들러 등록
regEventFx("NAVIGATE", (cofx, payload) => {
  const { db, dom } = cofx;
  const zone = db.zones.get(db.activeZoneId);
  const nextId = resolveNavigation(zone, dom, payload.direction);

  return {
    db: updateZone(db, db.activeZoneId, { focusedItemId: nextId }),
    focus: nextId,
    scroll: nextId,
  };
});

regEventFx("ACTIVATE", (cofx, payload) => {
  const { db } = cofx;
  const targetId = payload.targetId ?? db.zones.get(db.activeZoneId)?.focusedItemId;

  return {
    dispatch: { type: "app/onAction", payload: { id: targetId } },
  };
});

// 앱 커맨드도 같은 방식
regEventFx("todo/toggle-done", (cofx, payload) => {
  const { db } = cofx;
  return {
    db: toggleTodoDone(db, payload.id),
  };
});
```

**핵심:**
- OS 커맨드와 앱 커맨드가 **같은 레지스트리, 같은 형태**
- 반환값은 **fx-map** (이펙트 맵). `{ db, focus, scroll, dispatch, ... }`
- 핸들러는 `cofx` (읽기 전용 컨텍스트)만 받음. 스토어 직접 접근 불가.

### 3.3 Domino 3: `reg-fx` — 플러그인 이펙트 시스템

현재 문제: `executeDOMEffect`가 switch문으로 모든 이펙트를 하드코딩.

```typescript
// ── 제안: 이펙트 핸들러를 플러그인으로 등록 ──

// 내장 이펙트
regFx("db", (newDb) => {
  store.setState({ db: newDb });
});

regFx("focus", (targetId) => {
  const el = document.getElementById(targetId);
  el?.focus({ preventScroll: true });
});

regFx("scroll", (targetId) => {
  const el = document.getElementById(targetId);
  el?.scrollIntoView({ block: "nearest", inline: "nearest" });
});

regFx("dispatch", (event) => {
  dispatch(event);  // 재귀 dispatch (큐에 추가)
});

// 사용자 정의 이펙트 (확장 가능!)
regFx("toast", (message) => {
  showToast(message);
});

regFx("clipboard", (text) => {
  navigator.clipboard.writeText(text);
});

regFx("http", async ({ url, method, onSuccess, onFailure }) => {
  try {
    const res = await fetch(url, { method });
    const data = await res.json();
    dispatch({ type: onSuccess, payload: data });
  } catch (err) {
    dispatch({ type: onFailure, payload: err });
  }
});
```

**이점:**
- `executeDOMEffect`의 switch문 제거
- 앱이 자체 이펙트 등록 가능 (toast, http, analytics 등)
- 각 이펙트 핸들러를 독립적으로 테스트/모킹 가능
- 트랜잭션 로그에 fx-map만 기록하면 완벽한 리플레이

### 3.4 `inject-cofx` — 선언적 코이펙트 주입

현재 문제: `buildContext()`가 매 커맨드마다 DOM rect, focus path, items 등 전부 수집. 대부분 사용 안 됨.

```typescript
// ── 제안: 필요한 cofx만 선언 ──

// 기본 cofx는 항상 주입
// - db: 현재 상태 (비용 0, 메모리 참조)

// DOM 관련은 필요할 때만
regCofx("dom-items", () => {
  const zoneId = store.getState().db.activeZoneId;
  const el = document.getElementById(zoneId);
  return el ? Array.from(el.querySelectorAll("[data-focus-item]")).map(e => e.id) : [];
});

regCofx("dom-rects", () => {
  const items = getCofx("dom-items");
  return new Map(items.map(id => [id, document.getElementById(id)!.getBoundingClientRect()]));
});

regCofx("zone-config", () => {
  const zoneId = store.getState().db.activeZoneId;
  return zoneRegistry.get(zoneId)?.config;
});

// 핸들러에서 선언적으로 요청
regEventFx(
  "NAVIGATE",
  [injectCofx("dom-items"), injectCofx("dom-rects"), injectCofx("zone-config")],
  (cofx, payload) => {
    // cofx.db는 항상 있음
    // cofx["dom-items"], cofx["dom-rects"], cofx["zone-config"]는 주입됨
    // 불필요한 DOM 쿼리 없음
  }
);

// ACTIVATE는 DOM 쿼리 불필요
regEventFx("ACTIVATE", (cofx, payload) => {
  // cofx.db만 사용
  return { dispatch: { type: "app/onAction", payload: { id: cofx.db.focusedItemId } } };
});
```

**이점:**
- `buildContext()`의 30+필드 과잉 수집 → 핸들러가 필요한 것만 선언
- DOM 쿼리 비용이 실제 필요한 커맨드에서만 발생
- 테스트 시 cofx를 직접 주입 → DOM 없이 순수 테스트

### 3.5 인터셉터 체인 — 미들웨어의 데이터화

현재: Redux 스타일 미들웨어 `(next) => (state, action) => ...` — 함수 조합.
re-frame: 인터셉터는 **데이터** `{ id, before, after }` — 순서 지정, 검사, 제거 가능.

```typescript
// ── 제안: 인터셉터를 데이터로 ──

const transactionInterceptor: Interceptor = {
  id: "transaction",
  before: (context) => {
    // 스냅샷 캡처
    return assocIn(context, ["coeffects", "snapshot-before"], takeSnapshot());
  },
  after: (context) => {
    // 트랜잭션 기록
    const before = getIn(context, ["coeffects", "snapshot-before"]);
    const after = takeSnapshot();
    TransactionLog.add({
      event: context.event,
      diff: computeDiff(before, after),
    });
    return context;
  },
};

const loggingInterceptor: Interceptor = {
  id: "logging",
  before: (context) => {
    console.group(`[OS] ${context.event.type}`);
    return context;
  },
  after: (context) => {
    console.groupEnd();
    return context;
  },
};

// 글로벌 인터셉터 (모든 이벤트에 적용)
regGlobalInterceptor(transactionInterceptor);

// 개발 환경에서만
if (import.meta.env.DEV) {
  regGlobalInterceptor(loggingInterceptor);
}

// 특정 이벤트에 추가 인터셉터
regEventFx(
  "NAVIGATE",
  [injectCofx("dom-items"), stickyCoordInterceptor],
  handler
);
```

**이점:**
- 인터셉터를 런타임에 추가/제거 가능
- DevTools에서 인터셉터 체인 시각화 가능
- `before`/`after` 구조로 트랜잭션 경계 자연스럽게 형성

### 3.6 Domino 4: Subscriptions — 계층적 구독 시스템

현재 문제: 컴포넌트가 ad-hoc으로 `store.getState().focusedItemId === id` 비교. 캐싱 없음.

```typescript
// ── 제안: Layer 2/3 구독 ──

// Layer 2: db에서 직접 추출 (단순)
regSub("active-zone-id", (db) => db.activeZoneId);

regSub("zone-state", (db, [_, zoneId]) => db.zones.get(zoneId));

regSub("focused-item", (db, [_, zoneId]) => db.zones.get(zoneId)?.focusedItemId);

// Layer 3: 다른 구독을 조합 (파생)
regSub(
  "is-focused",
  // 입력 구독
  (args) => [subscribe(["focused-item", args[1]])],
  // 계산
  ([focusedItemId], [_, _zoneId, itemId]) => focusedItemId === itemId
);

regSub(
  "is-selected",
  (args) => [subscribe(["zone-state", args[1]])],
  ([zone], [_, _zoneId, itemId]) => zone?.selection.includes(itemId) ?? false
);

// 컴포넌트에서 사용
function FocusItem({ id }: { id: string }) {
  const { groupId } = useFocusGroupContext();
  const isFocused = useSubscription(["is-focused", groupId, id]);
  const isSelected = useSubscription(["is-selected", groupId, id]);
  // ...
}
```

**이점:**
- 같은 구독을 여러 컴포넌트가 공유 → 한 번만 계산
- Layer 3은 Layer 2가 바뀔 때만 재계산 → 불필요한 리렌더 방지
- 구독 그래프를 DevTools에서 시각화 가능

---

## 4. 단일 상태 트리 (`app-db`)

현재 3곳에 분산된 상태를 하나로:

```
현재:
├── FocusData (전역 변수) → activeZoneId, focusStack
├── FocusGroupStore × N (Zone별 Zustand) → focusedItemId, selection, expansion, spatial
└── CommandEngineStore (앱 라우터) → activeAppId, registries

제안:
└── db (단일 Zustand 스토어)
    ├── focus
    │   ├── activeZoneId: string | null
    │   ├── focusStack: FocusStackEntry[]
    │   └── zones: Record<string, ZoneState>
    │       ├── focusedItemId
    │       ├── selection[]
    │       ├── selectionAnchor
    │       ├── expandedItems[]
    │       ├── stickyX, stickyY
    │       └── recoveryTargetId
    ├── app
    │   ├── activeAppId: string | null
    │   └── [appId]: AppState  // 앱별 상태
    └── input
        └── source: "mouse" | "keyboard" | "programmatic"
```

```typescript
interface DB {
  focus: {
    activeZoneId: string | null;
    focusStack: FocusStackEntry[];
    zones: Record<string, ZoneState>;
  };
  app: {
    activeAppId: string | null;
    [appId: string]: unknown;
  };
  input: {
    source: InputSource;
  };
}
```

**Zone 상태 생명주기:**
- FocusGroup 마운트 → `dispatch({ type: "ZONE_MOUNT", payload: { zoneId, config } })`
- FocusGroup 언마운트 → `dispatch({ type: "ZONE_UNMOUNT", payload: { zoneId } })`
- 50ms grace period는 이벤트 핸들러 레벨에서 처리 (debounce)

---

## 5. 전체 실행 흐름 (Before → After)

### Before (현재)

```
KeyboardEvent
  → KeyboardSensor.onKeyDown()
  → classifyKeyboard() → "COMMAND"
  → routeCommand()
    → resolveKeybinding()
    → CommandEngineStore.dispatch(cmd)
      → activeApp.dispatch(cmd)
        → createCommandStore.dispatch()
          → useCommandEventBus.emit()  ← 불필요한 간접층
          → registry.get(cmd.type)
          → cmd.run(state, payload)    ← 앱 커맨드 or...
            → useCommandEventBus를 통해 FocusIntent가 받음  ← 간접층
              → runOS(OSCommand, payload)
                → buildContext()  ← 과잉 수집
                → OSCommand.run(ctx, payload)  ← 순수
                → ctx.store.setState()  ← Zone 스토어 직접 조작
                → executeDOMEffect()  ← switch문 하드코딩
```

### After (제안)

```
KeyboardEvent
  → KeyboardSensor.onKeyDown()
  → classifyKeyboard() → "COMMAND"
  → resolveKeybinding()
  → dispatch({ type: "NAVIGATE", payload: { direction: "up" } })  ← 단일 진입점
    │
    ├─ [Interceptor: before] transaction snapshot
    ├─ [Interceptor: before] inject cofx (dom-items, zone-config)
    │
    ├─ handler(cofx, payload) → fx-map  ← 순수함수
    │   { db: nextDb, focus: "item-3", scroll: "item-3" }
    │
    ├─ [Interceptor: after] transaction record
    │
    ├─ [FX: db]     → store.setState(nextDb)
    ├─ [FX: focus]  → el.focus()
    └─ [FX: scroll] → el.scrollIntoView()
```

**단계 수: 10+ → 6. 간접층: 3 → 0.**

---

## 6. 코어 라이브러리 API 표면

라이브러리로 추출될 퍼블릭 API:

```typescript
// ── 이벤트 ──
dispatch(event: { type: string; payload?: unknown }): void

// ── 핸들러 등록 ──
regEventDb(id: string, handler: (db, payload) => db): void
regEventFx(id: string, handler: (cofx, payload) => FxMap): void
regEventFx(id: string, interceptors: Interceptor[], handler): void

// ── 이펙트 등록 ──
regFx(id: string, handler: (value: unknown) => void): void

// ── 코이펙트 등록 ──
regCofx(id: string, handler: (cofx: Cofx) => unknown): void
injectCofx(id: string): Interceptor

// ── 인터셉터 ──
regGlobalInterceptor(interceptor: Interceptor): void

// ── 구독 ──
regSub(id: string, extractor: (db, args) => unknown): void
regSub(id: string, inputFn: (args) => Sub[], computeFn: (inputs, args) => unknown): void

// ── React 바인딩 ──
useSubscription(query: [string, ...unknown[]]): unknown
useDispatch(): (event: OSEvent) => void

// ── 스토어 ──
getDb(): DB
resetDb(db: DB): void
```

**크기 추정: ~500 LOC** (이펙트 핸들러, 구독 엔진, 인터셉터 체인, 큐)

---

## 7. 마이그레이션 전략

### Phase A: 코어 프레임워크 구현 (신규)

1. `dispatch` + 이벤트 큐 (re-entrance safe)
2. `regEventFx` + 핸들러 레지스트리
3. `regFx` + 이펙트 실행기
4. `regCofx` + 코이펙트 주입
5. 인터셉터 체인

### Phase B: 기존 커맨드 마이그레이션

1. OS 커맨드 (`NAVIGATE`, `SELECT`, `ACTIVATE` 등)를 `regEventFx`로 등록
2. `executeDOMEffect` → `regFx("focus")`, `regFx("scroll")` 등으로 분리
3. `buildContext` → `regCofx("dom-items")` 등으로 분리

### Phase C: 상태 통합

1. FocusData + Zone 스토어 → 단일 `db`
2. CommandEngineStore → `db.app` 통합
3. WeakMap (zone config, bound commands) → `db.focus.zones` + zone registry

### Phase D: 구독 시스템

1. 기존 ad-hoc selector → `regSub` + `useSubscription`
2. FocusItem 리렌더 최적화 검증

---

## 8. 하지 않을 것

re-frame의 모든 것을 가져오지 않는다. 우리에게 필요 없는 것:

| re-frame 기능 | 판단 | 이유 |
|---|---|---|
| ClojureScript immutable data | ❌ 불필요 | Immer + TypeScript로 충분 |
| `dispatch-sync` | ❌ 불필요 | 동기 dispatch가 기본 (DOM 이벤트는 동기) |
| Flows (선언적 파생 상태) | ⏳ 나중에 | 현재 파생 상태가 복잡하지 않음 |
| `reg-event-ctx` | ❌ 불필요 | `reg-event-fx`로 충분 |
| Global error handler | ⏳ 나중에 | 현재 에러 경계로 처리 중 |

---

## 9. 기대 효과

| 지표 | 현재 | 제안 후 |
|---|---|---|
| 상태 저장소 | 3+ (focusData, ZoneStore×N, CommandEngine) | 1 (db) |
| dispatch → result 단계 | 10+ (sensor→classify→route→engine→bus→intent→runOS→build→run→effect) | 6 (sensor→classify→resolve→dispatch→handler→fx) |
| 이벤트 핸들러 등록 | 하드코딩 맵 | `regEventFx` 선언적 |
| 이펙트 실행 | switch문 4 case | 플러그인 `regFx` (무제한 확장) |
| 컨텍스트 수집 | 매번 30+필드 전부 | 핸들러가 필요한 것만 선언 |
| 테스트 | DOM 필요 (buildContext) | cofx 주입으로 순수 단위 테스트 |
| 구독 최적화 | ad-hoc selector | 계층적 캐시 구독 |
| 코어 라이브러리 크기 | interactive-os에 결합 | ~500 LOC 독립 추출 가능 |

---

## 10. 열린 질문

1. **Zone별 스토어 → 단일 `db`에서 리렌더 성능은?**
   → Zone A 변경 시 Zone B 컴포넌트가 리렌더되지 않는가?
   → 구독 시스템의 selector 정밀도에 달려 있음. 검증 필요.

2. **WeakMap 기반 zone registry를 `db`로 옮기면 GC는?**
   → Zone 언마운트 시 명시적 cleanup 이벤트 필요.
   → WeakMap의 자동 GC 이점을 잃는 대신 디버깅 가능성 확보.

3. **앱 상태도 `db`에 넣을 것인가?**
   → re-frame은 yes (app-db 하나).
   → 하지만 앱별 상태 격리가 필요한 경우 (멀티 앱 환경) 별도 검토.
   → 안: `db.app.[appId]` 네임스페이스로 격리하되 같은 스토어.

4. **비동기 이펙트 (http, timer) 처리는?**
   → `regFx("http", ...)` 안에서 `dispatch`로 결과 이벤트 발행.
   → re-frame 동일 패턴. 별도 saga/thunk 불필요.

5. **기존 미들웨어 (history, navigation, persistence)는?**
   → 인터셉터로 전환. `before`/`after` 페어로 자연스럽게 매핑.
   → historyMiddleware → `historyInterceptor { before: snapshot, after: push }`
   → navigationMiddleware → `regFx("focus")` + `regFx("scroll")`로 대체.

---

## 11. 결론

re-frame이 증명한 것: **작은 프레임워크 + 올바른 추상화 = 거대한 앱도 감당 가능.**

우리 코어는 이미 re-frame의 핵심 철학(순수 핸들러, Effect as Data, 트랜잭션 로그)을 따르고 있다.
부족한 것은 **그것을 프레임워크 레벨의 프리미티브로 격상**하는 것이다.

- `dispatch` → 단일 큐 (re-entrance safe)
- `regEventFx` → 선언적 핸들러 (OS/앱 구분 없음)
- `regFx` → 플러그인 이펙트 (확장 가능)
- `regCofx` → 선언적 컨텍스트 (lazy, 테스트 가능)
- `regSub` → 계층적 구독 (캐시, 리렌더 최적화)

이 5개가 코어 라이브러리의 전부다. **~500 LOC. 0 dependencies.**
나머지(NAVIGATE, SELECT, FocusGroup, FocusItem)는 이 프리미티브 위에 선언적으로 작성된다.
