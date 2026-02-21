# PRD — defineQuery

> 한 줄 요약: 커널에 `defineQuery` primitive를 추가하여, 외부 세계(DOM, HTTP 등)의 데이터를 React 컴포넌트에서 선언적으로 구독하는 메커니즘을 제공한다.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 defineQuery — 동기 쿼리 등록

**Story**: OS 개발자로서, 외부 데이터 소스(DOM rect, scroll position 등)를 한 번 정의하면 컴포넌트에서 선언적으로 구독할 수 있기를 원한다. 그래야 앱이 DOM API를 직접 호출하지 않아도 되기 때문이다.

**Use Case — 주 흐름:**
1. OS 개발자가 `kernel.defineQuery(id, provider, options?)` 로 쿼리를 등록한다.
2. provider 함수는 `(state: S) => T`  형태로, 현재 커널 상태를 받아 외부 세계를 읽고 값을 반환한다.
3. 등록 시 `QueryToken<Id, T>`이 반환된다.
4. `QueryToken`은 `useQuery`에서 구독용으로 사용된다.

**Use Case — 대안 흐름:**
- 1a. 같은 id로 재등록 시 → 기존 provider를 덮어쓴다 (HMR 안전).

**Scenarios (Given/When/Then):**

Scenario: 동기 쿼리 등록
  Given 커널 인스턴스가 존재한다
  When `kernel.defineQuery("focused-rect", (state) => { ... })`를 호출한다
  Then `QueryToken<"focused-rect", DOMRect | null>`이 반환된다
    And 내부 queryProviders 레지스트리에 등록된다

Scenario: 동일 ID 재등록 (HMR)
  Given "focused-rect" 쿼리가 이미 등록되어 있다
  When 같은 ID로 `defineQuery`를 호출한다
  Then 기존 provider가 새 provider로 교체된다
    And 기존 구독자는 다음 무효화 시 새 provider를 사용한다

### 1.2 useQuery — 동기 쿼리 구독 (React Hook)

**Story**: 앱 개발자로서, `useQuery(token)`으로 외부 데이터를 구독하면 커널 상태 변경 시 자동으로 최신 값을 받고 싶다. 그래야 `document.getElementById` + `getBoundingClientRect` 같은 코드를 쓰지 않아도 되기 때문이다.

**Use Case — 주 흐름:**
1. 컴포넌트에서 `kernel.useQuery(FOCUSED_RECT)` 를 호출한다.
2. 커널 상태가 변경되면 provider가 재실행된다.
3. 반환값이 이전과 shallow-equal이면 리렌더하지 않는다.
4. 반환값이 다르면 컴포넌트가 리렌더되고 새 값을 받는다.

**Use Case — 대안 흐름:**
- 2a. 커널 상태가 변경되지 않았다면 → provider를 재실행하지 않고 캐시된 값을 반환한다.

**Scenarios (Given/When/Then):**

Scenario: 커널 상태 변경 시 쿼리 재실행
  Given `FOCUSED_RECT` 쿼리가 등록되어 있다
    And 컴포넌트가 `useQuery(FOCUSED_RECT)`를 호출하고 있다
    And 현재 포커스된 아이템이 "item-1"이다
  When 커맨드 실행으로 포커스가 "item-2"로 변경된다
  Then provider가 재실행되어 "item-2"의 rect를 반환한다
    And 컴포넌트가 새 rect로 리렌더된다

Scenario: 상태 미변경 시 캐시 반환
  Given 컴포넌트가 `useQuery(FOCUSED_RECT)`를 호출하고 있다
  When 무관한 앱 상태(todo 목록 등)가 변경된다
  Then provider가 재실행되지만 결과가 shallow-equal이면 리렌더하지 않는다

Scenario: provider 반환값 안정화
  Given provider가 `{ top: 100, left: 200 }` 같은 객체를 반환한다
  When 커널 상태가 변경되어 provider가 재실행된다
    And 새 반환값이 `{ top: 100, left: 200 }`으로 동일하다
  Then shallow 비교에 의해 이전 참조를 유지한다
    And 리렌더가 발생하지 않는다

### 1.3 useQuery — 비동기 쿼리 구독

**Story**: 앱 개발자로서, HTTP API 같은 비동기 데이터 소스도 같은 `useQuery` 패턴으로 구독하고 싶다. 그래야 useState + useEffect + fetch 보일러플레이트를 쓰지 않아도 되기 때문이다.

**Use Case — 주 흐름:**
1. OS 개발자가 `kernel.defineQuery(id, asyncProvider)` 로 비동기 쿼리를 등록한다.
2. asyncProvider는 `(state: S) => Promise<T>` 형태다.
3. 컴포넌트에서 `useQuery(token)`을 호출하면 `{ data: T | undefined, loading: boolean, error: Error | null }`을 반환한다.
4. Promise가 resolve되면 data가 업데이트되고 loading이 false가 된다.

**Use Case — 대안 흐름:**
- 4a. Promise가 reject되면 → error가 설정되고 loading이 false가 된다.
- 2a. 커널 상태 변경으로 무효화 시 → 이전 Promise가 in-flight이면 결과를 무시하고 새 Promise를 실행한다 (stale-while-revalidate 가능).

**Scenarios (Given/When/Then):**

Scenario: 비동기 쿼리 로딩 상태
  Given 비동기 쿼리 `USER_PROFILE`이 등록되어 있다
  When 컴포넌트가 `useQuery(USER_PROFILE)`을 최초 호출한다
  Then `{ data: undefined, loading: true, error: null }`을 반환한다
    And provider의 Promise가 실행된다

Scenario: 비동기 쿼리 성공
  Given USER_PROFILE 쿼리의 Promise가 in-flight이다
  When Promise가 `{ name: "Alice" }`로 resolve된다
  Then `{ data: { name: "Alice" }, loading: false, error: null }`로 업데이트된다
    And 컴포넌트가 리렌더된다

Scenario: 비동기 쿼리 실패
  Given USER_PROFILE 쿼리의 Promise가 in-flight이다
  When Promise가 Error("Network error")로 reject된다
  Then `{ data: undefined, loading: false, error: Error("Network error") }`로 업데이트된다

Scenario: 상태 변경으로 비동기 쿼리 재실행
  Given USER_PROFILE 쿼리가 데이터를 성공적으로 반환한 상태이다
  When 커맨드 실행으로 userId가 변경된다
  Then 이전 데이터를 유지하면서 loading이 true가 된다
    And 새 userId로 provider가 재실행된다

### 1.4 invalidateOn — 선택적 무효화

**Story**: OS 개발자로서, 쿼리가 모든 상태 변경에 반응하지 않고 특정 커맨드 실행 후에만 재실행되기를 원한다. 그래야 불필요한 DOM 읽기와 리렌더를 방지할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. `defineQuery`의 options에 `invalidateOn: ["OS_FOCUS", "OS_NAVIGATE"]`를 지정한다.
2. 해당 커맨드가 실행된 후에만 provider가 재실행된다.
3. 다른 커맨드 실행 시에는 캐시된 값을 유지한다.

**Use Case — 대안 흐름:**
- 1a. `invalidateOn`을 지정하지 않으면 → 모든 상태 변경 시 재실행 (기본값, useComputed와 동일).

**Scenarios (Given/When/Then):**

Scenario: 지정된 커맨드만 무효화
  Given FOCUSED_RECT 쿼리가 `invalidateOn: ["OS_FOCUS"]`로 등록되어 있다
  When `OS_NAVIGATE` 커맨드가 실행된다
  Then provider가 재실행되지 않는다
    And 이전 캐시된 rect를 유지한다

Scenario: 무효화 커맨드 실행 시 재실행
  Given FOCUSED_RECT 쿼리가 `invalidateOn: ["OS_FOCUS"]`로 등록되어 있다
  When `OS_FOCUS` 커맨드가 실행된다
  Then provider가 재실행되어 새 rect를 반환한다

Scenario: invalidateOn 미지정 시 전체 반응
  Given ITEM_COUNT 쿼리가 `invalidateOn` 없이 등록되어 있다
  When 아무 커맨드가 실행되어 상태가 변경된다
  Then provider가 재실행된다

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| Idle | 쿼리 등록됨, 구독자 없음 | defineQuery 호출 | useQuery 호출 |
| Active-Fresh | 구독 중, 캐시 유효 | provider 실행 완료 | invalidateOn 커맨드 실행 또는 상태 변경 |
| Active-Stale | 구독 중, 캐시 무효, 재실행 대기 | invalidation 발생 | provider 재실행 완료 |
| Loading (async only) | 비동기 provider Promise in-flight | async provider 실행 | Promise resolve/reject |
| Error (async only) | 비동기 provider 실패 | Promise reject | 다음 invalidation으로 재시도 |

## 3. 비기능 요구사항 (Non-Functional Requirements)

- **성능**: `useQuery`는 `useComputed`와 동일한 성능 특성을 가져야 한다. shallow 비교로 불필요한 리렌더를 방지한다.
- **메모리**: 구독자가 0이 되면 (컴포넌트 언마운트) 캐시를 정리해야 한다.
- **테스트 가능**: 테스트 환경에서 provider를 mock으로 교체할 수 있어야 한다.
- **HMR 안전**: defineQuery 재등록이 기존 구독을 깨트리지 않아야 한다.

## 4. 범위 밖 (Out of Scope)

- 서버 사이드 렌더링(SSR) 지원
- 쿼리 간 의존성(dependent queries) — 필요 시 추후 추가
- 캐시 TTL / 만료 정책 — 필요 시 추후 추가
- Optimistic updates — 커맨드 시스템이 이미 담당
- Devtools / Inspector 연동 — T2 이후 별도 태스크로

## 5. Glossary

| 도메인 개념 | 코드 이름 | 근거 |
|------------|----------|------|
| 쿼리 등록 API | `defineQuery` | 기존: `defineCommand`, `defineEffect`, `defineContext` |
| 쿼리 토큰 타입 | `QueryToken<Id, T>` | 기존: `ContextToken<Id, V>`, `EffectToken<T, V>` |
| React 구독 훅 | `useQuery` | 기존: `useComputed`. React Query와 동일 (학습비용 0) |
| Provider (동기) | `(state: S) => T` | state를 받아 외부 세계를 읽는 순수하지 않은 함수 |
| Provider (비동기) | `(state: S) => Promise<T>` | 동기 provider와 시그니처 일관 |
| 비동기 반환 타입 | `QueryResult<T>` | `{ data, loading, error }` 3-tuple |
| 무효화 옵션 | `invalidateOn` | 커맨드 타입 배열. 미지정 시 전체 반응 |
| OS 편의 훅 | `useFocusedRect` 등 | 기존: `useFocusedItem`, `useSelection` |
