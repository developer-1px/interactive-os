---
last-reviewed: 2026-02-12
---

# Server State 혁명: Redux의 패배, TanStack Query의 승리, 그리고 re-frame의 길

> 비동기 API 호출 영역에서 Redux가 TanStack Query에 패배한 역사와, 처음부터 "Effect as Data"를 설계 원칙으로 삼았던 re-frame이 그 이후 어떤 길을 걸었는지를 추적한다.

## 왜 이 주제인가

우리 interactive-os 커널은 re-frame의 Six Dominoes와 "Effect as Data" 철학을 참조 아키텍처로 삼고 있다 ([04-re-frame-guide.md](file:///Users/user/Desktop/interactive-os/docs/3-resource/04-re-frame-guide.md)). JavaScript 생태계에서 "Server State vs Client State" 분리가 대세가 된 지금, re-frame은 이 문제를 어떻게 바라보는지, 그리고 우리 커널 설계에 어떤 시사점을 주는지 이해할 필요가 있다.

## Background / Context

### 타임라인: 상태 관리의 세 번째 물결

```
2014  Flux (Facebook) — "단방향 데이터 흐름"
2015  Redux (Dan Abramov) — "예측 가능한 상태 컨테이너"
      re-frame (Mike Thompson) — "Effect as Data" + Six Dominoes
2016  MobX, Redux-Saga, Redux-Thunk — 비동기 보일러플레이트 전쟁
2019  React Query v1 (Tanner Linsley) — "Server State ≠ Client State"
      Redux Toolkit (RTK) — Redux의 반격
2020  SWR (Vercel) — stale-while-revalidate 패러다임
2021  React Query → TanStack Query 리브랜딩 시작
2022  TanStack Query v4 — 프레임워크 무관 코어 (React/Vue/Svelte/Solid)
2023  TanStack Query v5 — API 간소화, RSC 실험적 지원
      re-frame 1.4.x — Flows 도입 (alpha → stable)
2024  RTK Query 안정화 — Redux 진영의 Server State 대응 완성
      re-frame 1.4.4 — Flows 인터셉터 통합 개선
```

### 핵심 발견: "Server State"라는 개념의 탄생

Redux가 "패배"한 것은 Redux 자체의 결함이 아니라, **상태의 본질에 대한 인식 전환** 때문이었다.

| 구분 | Client State | Server State |
|------|-------------|--------------|
| 원천 | 클라이언트가 생성 | 서버가 소유 |
| 수명 | 세션에 종속 | 영속적 |
| 동기화 | 불필요 | 필수 (stale 가능성) |
| 예시 | 모달 open/close, 폼 입력 | 사용자 목록, 게시물 |

Redux는 이 둘을 하나의 스토어에서 관리했다. `FETCH_ITEMS_START → FETCH_ITEMS_SUCCESS → FETCH_ITEMS_FAILURE` 같은 3-action 패턴이 모든 API 호출마다 반복되었다. TanStack Query는 이 문제를 **"서버 상태는 캐시다"**라는 관점으로 해결했다.

## Core Concept

### 1. TanStack Query가 이긴 이유

TanStack Query의 핵심 통찰은 간단했다:

> **"서버 데이터를 '상태'로 관리하지 말고 '캐시'로 관리하라."**

```typescript
// Redux 시절: 3-action 보일러플레이트
dispatch({ type: 'FETCH_USERS_START' });
try {
  const users = await api.getUsers();
  dispatch({ type: 'FETCH_USERS_SUCCESS', payload: users });
} catch (error) {
  dispatch({ type: 'FETCH_USERS_FAILURE', payload: error });
}

// TanStack Query: 선언적
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.getUsers(),
});
```

TanStack Query가 자동으로 해결하는 것들:
- **캐싱** — 동일 키의 중복 요청 방지
- **Stale-while-revalidate** — 오래된 데이터를 보여주면서 백그라운드 갱신
- **자동 재시도** — 네트워크 오류 시 지수 백오프
- **참조 카운팅** — 사용하지 않는 쿼리 자동 가비지 컬렉션
- **Optimistic Updates** — 낙관적 UI 업데이트와 롤백

재미있는 사실: Tanner Linsley는 처음에 React Query 내부를 **Redux로 구동**했다가, 오픈소스 공개 전에 Redux를 제거했다.

### 2. re-frame은 이 문제를 어떻게 봤는가

re-frame은 "Server State vs Client State" 분리를 **하지 않았다.** 대신 처음부터 다른 설계 원칙으로 이 문제를 우회했다:

#### "Effect as Data" — 처음부터 사이드 이펙트가 데이터였다

```clojure
;; re-frame 이벤트 핸들러 — 순수 함수
(reg-event-fx
  :fetch-users
  (fn [{:keys [db]} _]
    {:db   (assoc db :loading? true)     ;; 상태 변경 (데이터)
     :http {:method :get                  ;; 사이드 이펙트 (데이터)
            :url    "/api/users"
            :on-success [:users-loaded]
            :on-failure [:users-failed]}}))
```

위 Clojure가 낯설다면, TypeScript로 같은 구조를 표현하면 이렇다:

```typescript
// 위 Clojure를 TypeScript로 표현하면:
const FETCH_USERS = defineCommand("FETCH_USERS", (ctx) => ({
  // 핸들러는 순수 함수 — 실행하지 않고 "선언"만 한다
  state: { ...ctx.state, loading: true },   // 상태 변경 (데이터)
  [HTTP]: {                                  // 사이드 이펙트 (데이터)
    method: "GET",
    url: "/api/users",
    onSuccess: USERS_LOADED,
    onFailure: USERS_FAILED,
  },
}));
// HTTP 요청은 이펙트 실행기가 나중에 해석하여 수행한다.
```

핸들러는 HTTP 요청을 **실행하지 않는다.** 대신 이펙트를 **데이터로 반환**한다. 이펙트 실행기가 이것을 해석하여 실제 요청을 수행한다. 이것이 "Doing vs Causing"이다.

#### app-db — 모든 상태는 하나의 장소에

re-frame의 `app-db`는 서버 데이터든 UI 상태든 모두 하나의 불변 맵에 저장한다. 이것은 Redux의 접근과 같지만, re-frame은 **Subscription Graph**로 파생 데이터를 효율적으로 관리한다:

```clojure
;; Layer 2: app-db에서 원시 데이터 추출
(reg-sub :users (fn [db] (:users db)))

;; Layer 3: 파생 데이터 (자동 캐싱 + 의존성 추적)  
(reg-sub :active-users
  :<- [:users]
  (fn [users] (filter :active? users)))
```

```typescript
// TypeScript 등가:

// Layer 2: 전체 상태에서 원시 데이터 추출 (selector)
const selectUsers = (state: AppState) => state.users;

// Layer 3: 파생 데이터 (의존성 추적 + 자동 메모이제이션)
// re-frame의 :<- 는 "이 subscription이 다른 subscription에 의존한다"는 선언이다.
const selectActiveUsers = createSelector(
  [selectUsers],  // ← 의존하는 selector (re-frame의 :<- 에 해당)
  (users) => users.filter(u => u.active)
);
```

### 3. re-frame의 대응: Flows (2023~)

re-frame은 TanStack Query처럼 "서버 상태 전용 레이어"를 만드는 대신, **다른 방향으로 진화**했다. 2023년 alpha로 도입된 **Flows**가 그것이다.

#### Flows란?

Flows는 기존 Subscription보다 더 예측 가능하고 합성 가능한 파생 데이터 메커니즘이다:

```clojure
(reg-flow
  {:id     :visible-todos
   :inputs {:todos [:todos]
            :filter [:visibility-filter]}
   :output (fn [{:keys [todos filter]}]
             (case filter
               :all    todos
               :active (remove :done todos)
               :done   (clojure.core/filter :done todos)))
   :path   [:derived :visible-todos]})  ;; app-db에 직접 저장
```

```typescript
// TypeScript 등가:
// Flow는 "이벤트 처리 시 자동 실행되는 파생 데이터"다.
// Subscription과 달리 결과를 state 안에 직접 저장한다.

registerFlow({
  id: "visibleTodos",
  inputs: {
    todos: (state) => state.todos,                  // state에서 입력 추출
    filter: (state) => state.visibilityFilter,
  },
  output: ({ todos, filter }) => {                   // 순수 함수로 파생 계산
    switch (filter) {
      case "all":    return todos;
      case "active": return todos.filter(t => !t.done);
      case "done":   return todos.filter(t => t.done);
    }
  },
  path: ["derived", "visibleTodos"],  // 결과를 state.derived.visibleTodos에 저장
});
```

기존 Subscription과의 핵심 차이:

| 특성 | Subscription | Flow |
|-----|-------------|------|
| 저장 위치 | 캐시 (외부) | `app-db` 안 |
| 실행 시점 | 뷰가 구독할 때 | 이벤트 처리 시 (인터셉터) |
| 디버깅 | 별도 추적 필요 | app-db 하나만 보면 됨 |
| 합성 | 체이닝 가능 | 인터셉터 모델과 통합 |

Flows의 설계 철학은 명확하다: **"모든 상태를 app-db 안에 넣고, 모든 변화를 이벤트 루프 안에서 추적하라."** TanStack Query가 서버 상태를 별도 캐시로 분리한 것과 정반대 방향이다.

### 4. re-frame의 현재 위치 (2024~2025)

re-frame은 2015년 출시 이후 **"조용한 승리자"**의 위치에 있다:

- **안정성**: 4만 줄 이상의 ClojureScript 코드베이스를 운영하는 기업들이 여전히 사용
- **v1.4.4 (2024.06)**: Flows의 인터셉터 통합 개선 — 사용자 정의 인터셉터가 Flow 처리 후의 `app-db`에 접근 가능
- **"여러 세대의 JavaScript churn을 견뎌냈다"** — re-frame 공식 문서의 자부심
- **ClojureScript 생태계**: Reagent/re-frame이 여전히 건재하나, Electric Clojure (풀스택 리액티브), ClojureDart (Flutter) 같은 새로운 시도도 등장

하지만 솔직한 현실도 있다:
- ClojureScript/re-frame은 **주류가 되지는 못했다**
- React/Next.js 생태계 대비 커뮤니티와 서드파티 라이브러리 규모가 작다
- 일부 개발자는 Vue/SvelteKit 같은 "배터리 포함" 프레임워크로 이동

## Best Practice + Anti-Pattern

### ✅ re-frame에서 배울 것 (우리 커널에 적용)

1. **Effect as Data는 영원하다** — 비동기 처리를 데이터로 선언하는 패턴은 TanStack Query에서도 동일하다. `useQuery`의 선언적 인터페이스는 사실 re-frame의 `:http-xhrio` 이펙트와 같은 철학이다.

2. **Coeffect로 의존성을 명시하라** — 이벤트 핸들러가 필요한 외부 데이터(시간, 로컬스토리지 등)를 인터셉터로 주입하면, 핸들러의 순수성을 유지할 수 있다.

3. **단일 상태 원천은 디버깅을 단순화한다** — app-db 하나만 보면 전체 앱 상태를 파악할 수 있다는 것은 강력한 장점이다.

### ❌ 피해야 할 것

1. **Server State를 Client State와 동일하게 취급하지 말라** — Redux의 가장 큰 실수. 캐싱, 무효화, 재시도 로직을 직접 작성하면 유지보수 지옥이 된다.

2. **"하나의 도구로 모든 것을 해결"하려 하지 말라** — 지금은 "Client State (Zustand/Redux) + Server State (TanStack Query)" 조합이 React 생태계의 표준이다.

3. **re-frame의 설계를 맹목적으로 복제하지 말라** — re-frame의 app-db 단일 상태 모델은 ClojureScript의 불변 데이터 구조와 Subscription Graph가 있기에 작동한다. JavaScript에서는 다른 도구가 필요하다.

## 흥미로운 이야기들

### "결국 모두 같은 곳을 향한다"

놀라운 수렴이 일어나고 있다:

| 개념 | re-frame (2015) | TanStack Query (2019) | 우리 커널 |
|------|----------------|----------------------|-----------|
| 이펙트 선언 | `:http` effect map | `queryFn` 선언 | `OSResult.effects` |
| 상태 + 이펙트 분리 | 이벤트 핸들러 = 순수 함수 | Hook 내부에서 분리 | `commandHandler` = 순수 함수 |
| 파생 데이터 | Subscription Graph | `select` 옵션 | Selector (계획) |
| 코이펙트 | `inject-cofx` | Context/Provider | `OSContext` |

re-frame이 2015년에 풀었던 문제를, JavaScript 생태계는 2019년에야 TanStack Query로 풀기 시작했다. 그리고 우리는 2026년에 그 양쪽을 모두 참조하여 커널을 설계하고 있다.

### Tanner Linsley의 고백

TanStack Query의 창시자 Tanner Linsley는 인터뷰에서 "처음에 내부적으로 Redux를 사용해서 React Query를 만들었다가, 오픈소스 공개 전에 Redux를 제거했다"고 밝혔다. Redux가 "패배"한 것이 아니라, Redux가 해결하려던 문제의 범위가 재정의된 것이다.

### re-frame의 자부심

re-frame 공식 문서에는 이런 문구가 있다:

> *"re-frame은 여러 세대의 JavaScript churn을 견뎌냈다."*

Flux → Redux → MobX → Context API → Recoil → Zustand → Jotai → TanStack Query... JavaScript 생태계의 끊임없는 변화 속에서, re-frame은 2015년의 설계를 거의 바꾸지 않고도 여전히 작동한다. 이것은 좋은 추상화의 힘을 보여준다.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| re-frame Flows | 우리 커널의 파생 상태 설계에 직접 참고 | [re-frame Flows 공식 문서](https://day8.github.io/re-frame/Flows/) | ⭐⭐⭐ | 1h |
| TanStack Query 내부 구조 | 캐시 무효화, GC 전략 이해 | [TanStack Query v5 공식 가이드](https://tanstack.com/query/latest) | ⭐⭐ | 2h |
| "A Framework for Client State" | Client/Server State 분리의 원론적 논의 | [Kent C. Dodds 블로그](https://kentcdodds.com/) | ⭐⭐ | 30m |
| Electric Clojure | re-frame 이후 ClojureScript 생태계의 새로운 방향 | [Electric Clojure GitHub](https://github.com/hyperfiddle/electric) | ⭐⭐⭐⭐ | 3h |
| RTK Query vs TanStack Query | Redux 진영의 Server State 대응 비교 | [Redux Toolkit 공식 문서](https://redux-toolkit.js.org/rtk-query/overview) | ⭐⭐ | 1h |
