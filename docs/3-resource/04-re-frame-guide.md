# re-frame 입문 가이드

> **re-frame** — ClojureScript를 위한 반응형 웹 프레임워크.
> Redux, Elm, Cycle.js의 좋은 부분만 취하고, 나쁜 부분을 제거한 설계.
> 2014년 설계, Elm Architecture보다 약간 앞섬.

---

## 1. Why re-frame?

### 문제 인식

| 프레임워크 | 장점 | 치명적 단점 |
|---|---|---|
| **Redux** | 예측 가능한 상태 | 보일러플레이트 지옥, effect는 미들웨어로 밀려남 |
| **Elm** | (Model, Cmd) 반환, 순수성 | 언어 강제, JS 생태계 분리 |
| **Cycle.js / RxJS** | 이론적 완벽성, 합성 가능 | 디버깅 불가, 암시적 상태, 스택 트레이스 무의미 |

### re-frame의 답

- **Effect as Data** — 이펙트를 "실행"하지 않고 "데이터로 선언"한다
- **Coeffect** — 입력도 데이터로 주입받는다 (LocalStore, 시간, 랜덤 등)
- **순수 이벤트 핸들러** — 모든 핸들러는 `(coeffects, event) → effects map` 순수함수
- **Interceptor** — 미들웨어를 데이터 파이프라인으로 교체
- **단일 app-db** — 하나의 atom에 전체 상태, 하지만 Subscription으로 효율적 접근

### 왜 우리에게 중요한가?

우리의 interactive-os 아키텍처는 re-frame과 거의 동일한 구조를 TypeScript + React + Zustand 위에서 구현한 것이다:

| re-frame | 우리 시스템 |
|---|---|
| `app-db` (단일 atom) | Zustand store |
| `reg-event-fx` (이벤트 핸들러) | `OSCommand.run()` |
| `effects map` 반환 | `OSResult { state, domEffects }` |
| `reg-fx` (이펙트 핸들러) | `executeDOMEffect()` |
| `coeffects` | `OSContext` (DOM 쿼리, 스토어 상태 등) |
| `interceptors` | middleware pipeline in `createCommandStore` |
| `subscriptions` | Zustand selectors / `useSyncExternalStore` |
| Event replay | **Transaction log** |

---

## 2. Background

### 역사적 맥락

- **2014년 말** 설계, 2015년 초 릴리스
- Clojure 생태계의 [Pedestal App](https://github.com/pedestal/pedestal-app), [Hoplon](http://hoplon.io/), [Om](https://github.com/swannodette/om) (David Nolen)에서 영감
- Elm의 초기 `foldp` 아이디어를 채택하되, 공식 Elm Architecture보다 약간 앞섬
- **Reagent** (ClojureScript의 React 래퍼) 위에 구축

### 핵심 철학: Data > Functions > Macros

Clojure의 근본 원칙. re-frame은 이것을 극단까지 밀어붙인다:

- **이벤트는 데이터** — `[:button-clicked 42]` (벡터)
- **이펙트는 데이터** — `{:db new-state, :http {:url "/api" ...}}` (맵)
- **코이펙트는 데이터** — `{:db current-state, :now (js/Date.)}` (맵)
- **인터셉터는 데이터** — 체인으로 구성, 순서 명시적

RxJS/Cycle.js가 "모든 것은 스트림"이라면, re-frame은 **"모든 것은 데이터"**이다.
이것이 디버깅 가능성에서 결정적 차이를 만든다.

---

## 3. Core Concepts

### 3.1 Six Dominoes — 데이터 루프

re-frame의 한 사이클은 6개의 도미노가 순차적으로 넘어지는 것:

```
[1] Event Dispatch     — 사용자가 버튼 클릭, 서버 응답 도착
         ↓
[2] Event Handling     — 순수함수가 "무엇을 해야 하는지" 데이터로 계산
         ↓
[3] Effect Handling    — 데이터를 실제 부수효과로 실행
         ↓
[4] Query (Subscription) — app-db에서 필요한 데이터 추출
         ↓
[5] View              — 데이터로부터 가상 DOM 계산
         ↓
[6] DOM               — 실제 DOM 반영
```

**Domino 1-2-3** = 원인 (cause) → 세상을 바꿈
**Domino 4-5-6** = 결과 (effect) → `v = f(s)` 공식

### 3.2 Effect as Data — "실행하지 않고 선언한다"

**나쁜 예 (Redux thunk 스타일):**
```clojure
;; 핸들러가 직접 HTTP 호출 — 순수하지 않음!
(reg-event-db :load-data
  (fn [db _]
    (GET "/api/data"                    ;; <-- 부수효과 직접 실행
      {:handler #(dispatch [:data-loaded %])})
    db))
```

**좋은 예 (re-frame 스타일):**
```clojure
;; 핸들러는 "해야 할 일"을 데이터로 반환
(reg-event-fx :load-data
  (fn [{:keys [db]} _]
    {:db   (assoc db :loading? true)     ;; 상태 변경 (데이터)
     :http {:method :get                  ;; HTTP 요청 (데이터)
            :url    "/api/data"
            :on-success [:data-loaded]}}))
```

핸들러는 `{:db ..., :http ...}` **맵(데이터)**을 반환할 뿐이다.
실제 HTTP 호출은 re-frame의 effect handler가 처리한다.

**우리 시스템의 동등물:**
```typescript
// OSCommand.run() — 순수함수
run(ctx, payload) → {
  state: { focusedItemId: "item-3" },     // :db 에 해당
  domEffects: [{ type: "FOCUS", ... }],   // :http 에 해당
}
// 실제 DOM 조작은 executeDOMEffect()가 처리
```

### 3.3 Coeffects — "입력도 주입받는다"

**Effect** = 핸들러가 세상에 미치는 영향 (출력)
**Coeffect** = 핸들러가 세상에서 필요로 하는 정보 (입력)

```clojure
;; 나쁜 예: LocalStore를 직접 읽음 — 순수하지 않음!
(reg-event-db :load-defaults
  (fn [db _]
    (let [val (.getItem js/localStorage "key")]   ;; <-- 불순!
      (assoc db :defaults val))))

;; 좋은 예: Coeffect로 주입받음
(reg-event-fx :load-defaults
  [(inject-cofx :local-store "key")]              ;; <-- 인터셉터로 주입
  (fn [{:keys [db local-store]} _]                ;; <-- 인자로 받음
    {:db (assoc db :defaults local-store)}))
```

**우리 시스템의 동등물:**
```typescript
// OSContext = coeffects
interface OSContext {
  zoneId: string;
  focusedItemId: string | null;   // app-db에서 읽은 것
  dom: { items, rects, ... };     // DOM에서 읽은 것 (coeffect!)
  config: FocusGroupConfig;       // 설정 (coeffect!)
}
// 핸들러는 ctx만 받고, DOM을 직접 읽지 않음
command.run(ctx, payload)  // 순수함수!
```

### 3.4 Interceptors — 데이터 파이프라인

Redux의 middleware는 고차함수(HOF) 체인 — 디버깅 지옥.
re-frame의 interceptor는 **데이터 구조**:

```clojure
;; interceptor = {:before fn, :after fn} 의 체인  
(reg-event-fx :my-event
  [debug                              ;; 로깅 인터셉터 (데이터)
   (inject-cofx :local-store "key")   ;; coeffect 주입 (데이터)
   trim-v]                            ;; 이벤트 벡터 정리 (데이터)
  (fn [cofx event]
    {:db ...}))
```

각 인터셉터는 `context` 맵을 받아 `context` 맵을 반환 — 순수한 데이터 변환.

### 3.5 Subscriptions — 반응형 쿼리

app-db에서 뷰로 데이터를 전달하는 계층:

```clojure
;; Layer 2 subscription (파생)
(reg-sub :visible-todos
  :<- [:todos]        ;; <-- 입력 subscription
  :<- [:filter]
  (fn [[todos filter] _]
    (filter-todos todos filter)))
```

de-duplicated Signal Graph — 입력이 바뀌지 않으면 재계산하지 않음.
우리의 `useSyncExternalStore` + Zustand selector와 동일한 역할.

---

## 4. re-frame vs 우리 시스템: 상세 매핑

### 전체 데이터 흐름 비교

**re-frame:**
```
User Action
  → dispatch [:event-id payload]           ;; Domino 1
  → event handler (cofx, event) → fx-map   ;; Domino 2
  → effect handlers execute fx-map          ;; Domino 3
  → app-db updated
  → subscriptions recompute                 ;; Domino 4
  → views re-render                         ;; Domino 5-6
```

**우리 시스템:**
```
User Input (keyboard/mouse)
  → setCurrentInput(event)
  → dispatch({ type, payload })
  → consumeInputInfo()                      ;; Transaction 시작
  → buildCurrentSnapshot()                  ;; before snapshot
  → event bus → OSCommand.run(ctx, payload) ;; 순수함수 실행
  → executeDOMEffect()                      ;; effect 실행 + 수집
  → buildCurrentSnapshot()                  ;; after snapshot
  → computeDiff(before, after)
  → TransactionLog.add(transaction)         ;; 기록
```

### Doing vs Causing — re-frame의 핵심 구분

> "순수한 핸들러는 이펙트를 **doing** 하지 않고 **causing** 한다."

핸들러는 `{:db new-state}` 데이터를 반환할 뿐, 실제로 `reset!`하는 건 re-frame 런타임이다.
우리 시스템에서는 `OSCommand.run()`이 `{ state, domEffects }`를 반환할 뿐, 실제 `setState()`와 `el.focus()`는 `runOS()`가 실행한다.

---

## 5. 배울 점과 우리에게 없는 것

### 이미 우리가 가진 것 ✅

- Effect as Data (OSResult)
- Coeffect 주입 (OSContext = DI)
- 순수 핸들러 (OSCommand.run)
- 트랜잭션 로그 (Transaction[])
- 시간여행 가능한 구조 (snapshot + diff)

### 우리가 아직 없는 것 (참고할 만한 re-frame 기능)

| re-frame 기능 | 설명 | 도입 검토 |
|---|---|---|
| **reg-fx** (커스텀 이펙트 등록) | 이펙트 핸들러를 플러그인처럼 등록 | 현재 `executeDOMEffect`가 하드코딩. 등록 방식으로 확장 가능 |
| **inject-cofx** (코이펙트 주입) | 인터셉터로 외부 데이터 주입 | `buildContext`가 이 역할. 더 선언적으로 만들 수 있음 |
| **Subscription Graph** | 계층적 구독, 자동 de-dup | Zustand selector가 부분적으로 커버. Layer 2/3 subscription 미구현 |
| **Flows** (re-frame 최신) | 선언적 파생 상태 | Zustand derive 패턴으로 도입 가능 |

---

## 6. 핵심 Links

### 공식 문서 (필독)

| 문서 | 설명 | URL |
|---|---|---|
| **re-frame README** | 전체 개요, Why | https://day8.github.io/re-frame/re-frame/ |
| **A Data Loop** | Six Dominoes 핵심 개념 | https://day8.github.io/re-frame/a-loop/ |
| **Effectful Handlers** | Doing vs Causing, 순수성의 핵심 | https://day8.github.io/re-frame/EffectfulHandlers/ |
| **Effects** | Effect as Data, reg-fx | https://day8.github.io/re-frame/Effects/ |
| **Coeffects** | Coeffect injection | https://day8.github.io/re-frame/Coeffects/ |
| **Interceptors** | 데이터 파이프라인 | https://day8.github.io/re-frame/Interceptors/ |
| **Flows** | 선언적 파생 상태 (최신) | https://day8.github.io/re-frame/Flows/ |

### 관련 강연 & 글

| 제목 | 저자 | 왜 볼까 |
|---|---|---|
| [Boundaries](https://www.destroyallsoftware.com/talks/boundaries) | Gary Bernhardt | Functional Core / Imperative Shell — 우리 구조의 이론적 기반 |
| [Simplicity Matters](https://www.youtube.com/watch?v=rI8tNMsozo0) | Rich Hickey | Simple vs Easy — re-frame 철학의 근간. Clojure 창시자 |
| [Are We There Yet?](https://www.youtube.com/watch?v=ScEPu1cs4l0) | Rich Hickey | 상태, 시간, 값에 대한 근본적 사고 |
| [Why Coeffects Matter](http://tomasp.net/blog/2014/why-coeffects-matter/) | Tomas Petricek | Coeffect의 학술적 배경 |
| [What is Functional Programming?](http://blog.jenkster.com/2015/12/what-is-functional-programming.html) | Kris Jenkins | Side-cause vs Side-effect 구분 |

### GitHub

| 프로젝트 | 설명 |
|---|---|
| [day8/re-frame](https://github.com/day8/re-frame) | re-frame 소스 |
| [day8/re-frame-10x](https://github.com/day8/re-frame-10x) | re-frame DevTools — 우리 Inspector의 참고 모델 |
| [re-frame TodoMVC](https://github.com/day8/re-frame/tree/master/examples/todomvc) | 실제 사용 예시 |

---

## 7. 한 문장 요약

> **re-frame = "이벤트가 데이터이고, 이펙트도 데이터이며, 코이펙트도 데이터다. 핸들러는 데이터를 받아 데이터를 반환하는 순수함수일 뿐이다. 나머지는 프레임워크의 책임이다."**

이것이 우리 시스템의 정신적 선조(spiritual ancestor)이다.
