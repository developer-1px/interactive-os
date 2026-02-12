---
last-reviewed: 2026-02-12
---

# re-frame Flows 딥다이브: 파생 데이터의 재발명과 Server State의 re-frame 방식

> re-frame Flows의 내부 동작, 라이프사이클, 레이어링을 깊이 파고들고, TanStack Query 같은 "편리한 서버 상태 관리"를 re-frame이 어떤 도구와 패턴으로 제공하는지 추적한다.

## 왜 이 주제인가

이전 리소스 ([10-server-state-revolution.md](file:///Users/user/Desktop/interactive-os/docs/3-resource/10-server-state-revolution.md))에서 Flows의 존재를 소개했지만, 실제 API와 동작 방식은 다루지 못했다. 우리 커널의 파생 상태 설계(`useComputed`, Selector 계획)에 Flows의 구체적 메커니즘이 직접적 참고가 된다. 또한 "TanStack Query 같은 편리함을 re-frame은 어떻게 제공하는가?"라는 질문에 대한 체계적 답변이 필요하다.

## Background / Context

### Flows가 등장한 이유

re-frame에서 파생 데이터를 관리하는 기존 방법은 **Subscription**이었다:

```clojure
;; 기존 방식: Layer-3 Subscription
(reg-sub :room-area
  :<- [:room-width]
  :<- [:room-length]
  (fn [[w l]] (* w l)))
```

```typescript
// TypeScript 등가:
const selectRoomArea = createSelector(
  [selectRoomWidth, selectRoomLength],
  (w, l) => w * l
);
```

이것은 잘 작동하지만 두 가지 한계가 있었다:

1. **Reactive Context 제약** — Subscription은 React 컴포넌트(Reagent) 안에서만 구독 가능하다. 이벤트 핸들러에서 파생 값을 참조할 수 없다.
2. **상태의 분산** — 파생 값이 `app-db` 밖의 캐시에 존재한다. 디버깅 시 "이 값이 어디에 있지?" 문제가 생긴다.

Flows는 이 두 한계를 해결하기 위해 2023년에 도입되었다.

## Core Concept

### 1. Flow의 해부학

Flow는 4개의 필수 키와 3개의 선택 키로 구성된 **선언적 명세**다:

```clojure
(reg-flow
  {:id       :room-area              ;; 고유 식별자
   :inputs   {:w [:room :width]      ;; app-db 경로 → 로컬 이름 매핑
              :h [:room :length]}
   :output   (fn [{:keys [w h]}]     ;; 순수 함수: inputs → 파생 값
               (* w h))
   :path     [:room :area]           ;; 결과를 저장할 app-db 경로

   ;; --- 선택 키 (라이프사이클) ---
   :live-inputs {:tab [:current-tab]}
   :live?       (fn [{:keys [tab]}]  ;; 이 Flow가 "살아있는지" 판단
                  (= tab :room))
   :cleanup     (fn [db path]        ;; Flow가 죽을 때 실행
                  (assoc-in db path :unknown))})
```

```typescript
// TypeScript 등가:
registerFlow({
  id: "roomArea",
  inputs: {                                  // app-db 경로 → 로컬 이름
    w: (state) => state.room.width,
    h: (state) => state.room.length,
  },
  output: ({ w, h }) => w * h,               // 순수 함수: inputs → 파생 값
  path: ["room", "area"],                     // 결과 저장 위치

  // --- 선택 키 (라이프사이클) ---
  liveInputs: {
    tab: (state) => state.currentTab,
  },
  live: ({ tab }) => tab === "room",          // 이 Flow가 활성인지 판단
  cleanup: (state, path) => {                 // Flow 비활성화 시 실행
    return setIn(state, path, "unknown");
  },
});
```

### 2. 동작 메커니즘: 인터셉터로 구현

Flows는 **이벤트 처리 파이프라인의 인터셉터**로 동작한다. 매 이벤트 처리 후, re-frame이 자동으로 모든 등록된 Flow를 순회한다:

```
이벤트 발생
  → 이벤트 핸들러 실행 → 새 app-db 생성
  → [Flows 인터셉터 개입]
      1. 각 Flow의 :live? 평가 → 4가지 전이 중 하나
      2. "살아있는" Flow의 :inputs를 이전 app-db와 비교
      3. 변경된 것이 있으면 :output 함수 실행
      4. 결과를 app-db의 :path에 저장
  → 최종 app-db가 View에 전달
```

```typescript
// TypeScript로 표현한 Flow 인터셉터 의사코드:
function flowInterceptor(newDb: AppState, prevDb: AppState): AppState {
  let db = newDb;

  for (const flow of registeredFlows) {
    // 1. 라이프사이클 전이 판단
    const wasLive = flow.previouslyLive;
    const isLive = flow.live
      ? flow.live(resolveInputs(db, flow.liveInputs))
      : true;  // live? 없으면 항상 활성

    if (!wasLive && isLive) {
      // ARISING: 새로 살아남 → output 무조건 실행
      const inputs = resolveInputs(db, flow.inputs);
      db = setIn(db, flow.path, flow.output(inputs));
    } else if (wasLive && isLive) {
      // LIVING: 이미 살아있음 → inputs 변경 시에만 output 실행
      const prevInputs = resolveInputs(prevDb, flow.inputs);
      const currInputs = resolveInputs(db, flow.inputs);
      if (!shallowEqual(prevInputs, currInputs)) {
        db = setIn(db, flow.path, flow.output(currInputs));
      }
    } else if (wasLive && !isLive) {
      // DYING: 죽음 → cleanup 실행
      db = flow.cleanup(db, flow.path);
    }
    // DEAD: 계속 죽어있음 → 아무것도 안 함

    flow.previouslyLive = isLive;
  }

  return db;
}
```

> **핵심 통찰**: Flow의 `:output`은 이벤트 핸들러가 반환한 `:db` 이펙트를 **암묵적으로 변경**한다. 이벤트 핸들러가 모르는 사이에 `app-db`가 달라질 수 있다. 이것은 의도된 트레이드오프다: "이 값은 저 값들로부터 파생된다"를 선언하는 대가로 "어떤 이벤트가 이 변경을 일으켰는지" 추적이 어려워진다.

### 3. 라이프사이클: 4가지 상태 전이

Flow는 `live? → dead?` 판단에 따라 4가지 전이를 가진다:

| 이전 상태 | 현재 상태 | 전이 이름 | 동작 |
|-----------|-----------|----------|------|
| Dead | Live | **Arising** | `:output` 무조건 실행 |
| Live | Live | **Living** | `:inputs` 변경 시에만 `:output` 실행 |
| Live | Dead | **Dying** | `:cleanup` 실행 |
| Dead | Dead | **Dead** | 아무것도 안 함 |

```typescript
// TypeScript 등가:
type FlowTransition = "arising" | "living" | "dying" | "dead";

function getTransition(wasLive: boolean, isLive: boolean): FlowTransition {
  if (!wasLive && isLive)  return "arising";
  if (wasLive && isLive)   return "living";
  if (wasLive && !isLive)  return "dying";
  return "dead";
}
```

**실용적 예시**: 탭 UI에서 "주방" 탭에서만 면적을 계산:

```clojure
;; 주방 탭에서만 활성화되는 Flow
(reg-flow
  {:id          :kitchen-area
   :inputs      {:w [:kitchen :width] :h [:kitchen :length]}
   :output      (fn [{:keys [w h]}] (* w h))
   :path        [:kitchen :area]
   :live-inputs {:tab [:current-tab]}
   :live?       (fn [{:keys [tab]}] (= tab :kitchen))
   :cleanup     (fn [db path] (update-in db (butlast path) dissoc (last path)))})
```

```typescript
// TypeScript 등가:
registerFlow({
  id: "kitchenArea",
  inputs: {
    w: (s) => s.kitchen.width,
    h: (s) => s.kitchen.length,
  },
  output: ({ w, h }) => w * h,
  path: ["kitchen", "area"],
  liveInputs: { tab: (s) => s.currentTab },
  live: ({ tab }) => tab === "kitchen",
  cleanup: (state, path) => deleteIn(state, path),
  // → "주방" 탭을 떠나면 state.kitchen.area가 삭제된다
});
```

### 4. Flow 레이어링: Flow → Flow 의존성

Flow는 다른 Flow의 출력을 입력으로 사용할 수 있다. `flow<-` 함수로 의존성을 선언한다:

```clojure
;; Flow A: 주방 면적
(reg-flow {:id :kitchen-area ...})

;; Flow B: 거실 면적
(reg-flow {:id :living-room-area ...})

;; Flow C: 메인 룸 비율 (A와 B에 의존)
(reg-flow
  {:id     :main-room-ratio
   :inputs {:kitchen (flow<- :kitchen-area)        ;; 다른 Flow의 출력을 입력으로
            :living  (flow<- :living-room-area)}
   :output (fn [{:keys [kitchen living]}]
             (/ kitchen (+ kitchen living)))
   :path   [:ratios :main-rooms]})
```

```typescript
// TypeScript 등가:
// flowRef()가 Clojure의 flow<- 역할을 한다
registerFlow({
  id: "mainRoomRatio",
  inputs: {
    kitchen: flowRef("kitchenArea"),         // 다른 Flow의 출력을 입력으로
    living: flowRef("livingRoomArea"),
  },
  output: ({ kitchen, living }) =>
    kitchen / (kitchen + living),
  path: ["ratios", "mainRooms"],
});
```

re-frame은 내부적으로 **의존성 그래프**를 구성하여, `kitchenArea`를 항상 `mainRoomRatio`보다 먼저 실행한다. 이것은 TanStack Query의 `dependent queries` 패턴과 유사하다.

### 5. Flow 구독 (Subscribing to Flows)

Flow의 출력은 `app-db`에 저장되므로, 일반 Subscription으로 접근할 수 있다:

```clojure
;; 방법 1: 일반 Subscription (Flow의 :path를 구독)
(reg-sub :kitchen-area (fn [db] (get-in db [:kitchen :area])))

;; 방법 2: re-frame.alpha — Flow 이름으로 직접 구독 (캐시 우회)
@(subscribe {:flow-id :kitchen-area})
```

```typescript
// TypeScript 등가:
// 방법 1: 일반 selector
const selectKitchenArea = (state: AppState) => state.kitchen.area;
const area = useComputed(selectKitchenArea);

// 방법 2: Flow 이름으로 직접 참조 (가상 API)
const area = useFlow("kitchenArea");
```

---

## TanStack Query의 편리함을 re-frame은 어떻게 제공하는가?

TanStack Query의 핵심 편리함을 하나씩 대응시켜 보자.

### 1. 자동 Loading/Error 상태 관리

**TanStack Query:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
// isLoading, error 자동 관리
```

**re-frame: `reg-event-fx` + FSM 패턴**
```clojure
;; 요청 시작
(reg-event-fx :fetch-users
  (fn [{:keys [db]} _]
    {:db   (assoc db :users-status :loading)    ;; 상태를 직접 선언
     :http {:method :get
            :url    "/api/users"
            :on-success [:users-loaded]
            :on-failure [:users-failed]}}))

;; 성공
(reg-event-db :users-loaded
  (fn [db [_ users]]
    (-> db
        (assoc :users users)
        (assoc :users-status :success))))

;; 실패
(reg-event-db :users-failed
  (fn [db [_ error]]
    (-> db
        (assoc :users-error error)
        (assoc :users-status :error))))
```

```typescript
// TypeScript 등가 (우리 커널 스타일):
const FETCH_USERS = defineCommand("FETCH_USERS", (ctx) => ({
  state: { ...ctx.state, usersStatus: "loading" },
  [HTTP]: {
    method: "GET",
    url: "/api/users",
    onSuccess: USERS_LOADED,
    onFailure: USERS_FAILED,
  },
}));

const USERS_LOADED = defineCommand("USERS_LOADED", (ctx, users: User[]) => ({
  state: { ...ctx.state, users, usersStatus: "success" },
}));

const USERS_FAILED = defineCommand("USERS_FAILED", (ctx, error: Error) => ({
  state: { ...ctx.state, usersError: error, usersStatus: "error" },
}));
```

> **핵심 차이**: TanStack Query는 loading/error를 **자동으로** 관리한다. re-frame은 **명시적으로** 관리한다. 보일러플레이트는 더 많지만, 모든 상태 전이가 코드에 드러난다.

### 2. FSM 기반 HTTP: `re-frame-http-fx-alpha`

Day8 팀은 이 보일러플레이트 문제를 인식하고, **FSM(유한 상태 기계)으로 HTTP 요청을 모델링**하는 라이브러리를 만들었다:

```
                    ┌─────────┐
        ┌──────────▶│ Waiting │
        │           └────┬────┘
        │                │ 응답 도착
        │           ┌────▼────┐
        │     ┌────▶│ Problem │──────┐
        │     │     └────┬────┘      │
        │     │ 재시도    │ 포기      │ 성공
        │     │     ┌────▼────┐ ┌────▼────┐
        │     └─────│Retrying │ │ Failed  │
        │           └─────────┘ └─────────┘
        │                       ┌─────────┐
        └───────────────────────│Succeeded│
                                └─────────┘
```

이 라이브러리에는 두 가지 핵심 개념이 있다:

| 개념 | 설명 | TanStack Query 등가 |
|------|------|-------------------|
| **request-state** | FSM 내부 상태 (읽기 전용). 요청 ID, 현재 논리 상태, 추적 이력 포함 | 내부 QueryObserver 상태 |
| **path-state** | `app-db`에 저장되는 "물질화된 뷰". UI가 구독하는 상태 | `{ data, isLoading, error }` |

```clojure
;; FSM 논리 상태 핸들러 예시 (re-frame-http-fx-alpha)
(def my-request
  {:method   :get
   :url      "/api/users"
   :path     [:data :users]             ;; path-state 저장 위치

   ;; 각 FSM 상태에 대한 핸들러
   :on-success
   (fn [cofx request-state]
     {:db (assoc-in (:db cofx) [:data :users]
                    {:status :loaded
                     :data   (:response request-state)})})

   :on-failure
   (fn [cofx request-state]
     {:db (assoc-in (:db cofx) [:data :users]
                    {:status :error
                     :error  (:error request-state)
                     :retrying? true})})})
```

```typescript
// TypeScript 등가:
const usersFetch = defineHttpRequest({
  method: "GET",
  url: "/api/users",
  path: ["data", "users"],          // app-db에 path-state 저장

  onSuccess: (ctx, requestState) => ({
    state: setIn(ctx.state, ["data", "users"], {
      status: "loaded",
      data: requestState.response,
    }),
  }),

  onFailure: (ctx, requestState) => ({
    state: setIn(ctx.state, ["data", "users"], {
      status: "error",
      error: requestState.error,
      retrying: true,
    }),
  }),
});
```

### 3. 캐싱과 무효화

**TanStack Query:**
```typescript
// 자동 캐싱 + staleTime으로 무효화 제어
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,  // 5분간 신선
});
// 수동 무효화
queryClient.invalidateQueries({ queryKey: ["users"] });
```

**re-frame: `app-db`가 곧 캐시다**

re-frame에서는 "캐시"라는 별도 레이어가 없다. `app-db`에 저장된 서버 데이터 그 자체가 캐시다:

```clojure
;; 조건부 fetch — 이미 데이터가 있으면 요청하지 않음
(reg-event-fx :ensure-users
  (fn [{:keys [db]} _]
    (if (:users db)
      {}                                        ;; 이미 있음 → 아무것도 안 함
      {:db   (assoc db :users-status :loading)
       :http {:method :get
              :url    "/api/users"
              :on-success [:users-loaded]}})))

;; 강제 무효화 — 데이터를 삭제하고 다시 fetch
(reg-event-fx :invalidate-users
  (fn [{:keys [db]} _]
    {:db       (dissoc db :users)
     :dispatch [:fetch-users]}))
```

```typescript
// TypeScript 등가:
const ENSURE_USERS = defineCommand("ENSURE_USERS", (ctx) => {
  if (ctx.state.users) return {};               // 이미 있음 → skip
  return {
    state: { ...ctx.state, usersStatus: "loading" },
    [HTTP]: { method: "GET", url: "/api/users", onSuccess: USERS_LOADED },
  };
});

const INVALIDATE_USERS = defineCommand("INVALIDATE_USERS", (ctx) => ({
  state: { ...ctx.state, users: undefined },
  dispatch: FETCH_USERS(),                       // 다시 fetch
}));
```

### 4. 자동 재시도

**TanStack Query:**
```typescript
useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  retry: 3,                           // 3번 재시도
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

**re-frame: `re-frame-http-fx-alpha`의 FSM에 내장**

FSM의 `Problem → Retrying → Waiting` 전이가 자동 재시도를 구현한다. 또는 직접 구현할 수도 있다:

```clojure
;; 직접 구현한 재시도 패턴
(reg-event-fx :users-failed
  (fn [{:keys [db]} [_ error]]
    (let [attempts (get db :users-retry-count 0)]
      (if (< attempts 3)
        {:db             (-> db
                             (assoc :users-status :retrying)
                             (update :users-retry-count inc))
         :dispatch-later [{:ms (* 1000 (js/Math.pow 2 attempts))
                           :dispatch [:fetch-users]}]}
        {:db (assoc db :users-status :error
                       :users-error error)}))))
```

```typescript
// TypeScript 등가:
const USERS_FAILED = defineCommand("USERS_FAILED", (ctx, error: Error) => {
  const attempts = ctx.state.usersRetryCount ?? 0;
  if (attempts < 3) {
    return {
      state: {
        ...ctx.state,
        usersStatus: "retrying",
        usersRetryCount: attempts + 1,
      },
      [DELAY_DISPATCH]: {
        ms: 1000 * Math.pow(2, attempts),         // 지수 백오프
        command: FETCH_USERS(),
      },
    };
  }
  return {
    state: { ...ctx.state, usersStatus: "error", usersError: error },
  };
});
```

### 5. 종합 비교: 편리함의 스펙트럼

| 기능 | TanStack Query | re-frame (기본) | re-frame (라이브러리) |
|------|---------------|----------------|---------------------|
| Loading/Error 자동화 | ✅ 자동 | ❌ 수동 3-event | ⚠️ FSM lib으로 반자동 |
| 캐싱 | ✅ queryKey 기반 자동 | ⚠️ app-db에 수동 저장 | ⚠️ 동일 |
| Stale-while-revalidate | ✅ 내장 | ❌ 직접 구현 필요 | ❌ 직접 구현 필요 |
| 자동 재시도 | ✅ retry 옵션 | ❌ dispatch-later 수동 | ✅ FSM lib 내장 |
| 참조 카운팅/GC | ✅ 자동 | ❌ 없음 | ❌ 없음 |
| Optimistic Updates | ✅ onMutate 콜백 | ⚠️ 이벤트 핸들러에서 수동 | ⚠️ 동일 |
| Dependent Queries | ✅ enabled 옵션 | ✅ 이벤트 체이닝 | ✅ Flow 레이어링 |
| DevTools | ✅ TanStack Query DevTools | ✅ re-frame-10x | ✅ re-frame-10x |
| 타입 안전성 | ✅ TypeScript 네이티브 | ⚠️ ClojureScript spec | ⚠️ 동일 |

> **결론**: TanStack Query는 **"서버 상태 관리의 편의를 극대화"**한 도구다. re-frame은 **"범용 상태 관리의 순수성을 극대화"**한 도구다. re-frame은 서버 상태를 특별 취급하지 않지만, 그 범용적 추상화(Effect as Data, FSM, Flows)로 동일한 문제를 해결할 수 있는 **빌딩 블록**을 제공한다.

## Best Practice + Anti-Pattern

### ✅ 해야 할 것

1. **Flow는 "동기화 불변식"에 사용하라** — "A가 바뀌면 B도 반드시 바뀌어야 한다"는 관계를 선언할 때 Flow가 최적이다.
2. **`:live?`로 비용을 제어하라** — 비싼 계산은 필요한 화면에서만 활성화하라.
3. **서버 데이터 fetch는 FSM으로 모델링하라** — loading → success/failure → retry 흐름을 명시적으로 표현하면 엣지 케이스를 놓치지 않는다.
4. **Flow 레이어링으로 복잡한 파생을 분해하라** — 하나의 거대한 Subscription 대신, 작은 Flow들의 의존 그래프로 분해하면 각 단계를 독립적으로 테스트할 수 있다.

### ❌ 피해야 할 것

1. **Flow로 사이드 이펙트를 실행하지 말라** — Flow의 `:output`은 순수 함수여야 한다. HTTP 요청 같은 사이드 이펙트는 이벤트 핸들러에서 Effect로 선언하라.
2. **모든 파생 데이터에 Flow를 사용하지 말라** — 단순한 UI 전용 파생(포맷팅, 필터링)은 Subscription으로 충분하다. Flow는 "app-db에 저장되어야 하는 파생"에만 사용하라.
3. **`:cleanup` 없이 `:live?`를 사용하지 말라** — Flow가 죽을 때 `app-db`에 오래된 값이 남을 수 있다. 명시적 cleanup을 항상 선언하라.

## 흥미로운 이야기들

### "Dataflow 담론은 1970년대부터"

re-frame 공식 문서에서 밝히듯, Dataflow 프로그래밍은 1970년대에 등장했다. 함수형 프로그래밍만큼이나 오래된 패러다임이다. 요즘 유행하는 "반응형 프로그래밍"은 사실 Dataflow의 **부분집합**이다. re-frame의 태그라인 "derived data, flowing"은 이 역사에 대한 경의다.

### "Spooky Action at a Distance"

Flow 공식 문서는 양자역학 용어를 빌려 경고한다: Flow는 **"먼 곳에서의 유령 같은 작용"**을 도입한다. 어떤 이벤트 핸들러도 직접 `[:room :area]`를 변경하지 않지만, width나 length가 바뀌면 area가 자동으로 변한다. 이것은 편리함과 추적 가능성 사이의 **의도된 트레이드오프**다.

### re-frame의 "나는 TanStack Query가 아니다" 선언

re-frame은 의도적으로 서버 상태 전용 추상화를 만들지 않았다. 대신 이렇게 말한다:

> *"서버 데이터는 특별한 것이 아니다. 그것은 그냥 state다. 우리에게는 state를 다루는 하나의 방법이 있다: events, effects, subscriptions."*

이 철학적 차이가 TanStack Query와 re-frame의 근본적 분기점이다. TanStack Query는 "서버 상태는 특별하다, 전용 도구가 필요하다"고 주장하고, re-frame은 "아니다, 좋은 범용 추상화면 된다"고 주장한다.

### 우리 커널과의 관계

우리 커널은 현재 re-frame의 **범용 추상화 철학**을 따른다. `defineCommand`, `EffectMap`, `useComputed`가 re-frame의 `reg-event-fx`, effects map, `reg-sub`에 대응한다. Flows에 대응하는 것은 아직 없지만, 향후 "파생 상태를 state 안에 선언적으로 저장"하는 메커니즘이 필요해질 때 Flows가 직접적 참고가 될 것이다.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| re-frame Flows 공식 문서 | 본 문서의 1차 출처, 인터랙티브 예제 포함 | [Flows](https://day8.github.io/re-frame/Flows/) | ⭐⭐⭐ | 1h |
| re-frame Flows Advanced Topics | Reactive Context, 캐싱 문제, 성능 | [Advanced Topics](https://day8.github.io/re-frame/flows-advanced-topics/) | ⭐⭐⭐⭐ | 1h |
| re-frame-http-fx-alpha | FSM 기반 HTTP 라이브러리 소스 | [GitHub](https://github.com/day8/re-frame-http-fx-alpha) | ⭐⭐⭐⭐ | 2h |
| re-frame-async-flow-fx | 앱 초기화 시 비동기 작업 조율 | [GitHub](https://github.com/day8/re-frame-async-flow-fx) | ⭐⭐⭐ | 1h |
| Dataflow Programming 역사 | Flows의 이론적 배경 | Wikipedia: [Dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming) | ⭐⭐ | 30m |
