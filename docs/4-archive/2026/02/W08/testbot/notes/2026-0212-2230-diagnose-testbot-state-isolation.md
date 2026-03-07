# 🔍 삽질 일지: TestBot 상태 격리 실패 — kernel.setState는 왜 앱을 죽이는가

> 날짜: 2026-02-12
> 실행 명령: `window.__TESTBOT__.runAll()` (브라우저 내)
> 결과: 9개 실패 / 3개 통과 (원래), goto 수정 후 전체 크래시

## 증상

### 원래 상태 (goto = no-op)
- **PASS 3**: Create todo, Click focus, Space toggle
- **FAIL 9**: 나머지 — 상태 누적으로 인한 불일치 + selector 파싱 오류 + API 변환 오류

### kernel.setState 적용 후
- `window.__TESTBOT__.runAll()` 실행 시 **브라우저 커넥션 리셋** (타임아웃)
- 앱 영역 **완전 백화현상** (white screen)
- TestBot 패널만 살아있고 본문은 빈 `<div>`

## 즉시 수정한 것들

- `selectors.ts`: `#${el.id}` → `[id="${el.id}"]` (숫자 ID가 CSS에서 invalid)
- `shim.ts`: `isLocator` 가드에 `typeof v === "object"` 추가 (`expect(0)`에서 `'in' operator on primitive` 방지)
- `shim.ts`: `goto()` → kernel.setState 시도 → **실패 확인 후 no-op으로 복원**

## 삽질 과정

### 1단계: 원래 실패 9건 분류

처음엔 단순 셀렉터 문제인 줄 알았다. 실패를 정리하니 3개 패턴이 보였다:

| 패턴 | 건수 | 에러 |
|------|------|------|
| A: CSS selector invalid | 3 | `#1 > div:nth-of-type(3)` — `querySelector` throws |
| B: 상태 누적 | 5 | 이전 테스트 데이터가 남아서 카운트/텍스트 불일치 |
| C: primitive에 `in` 연산자 | 1 | `expect(workIdx)`에서 `"selector" in 0` |

A와 C는 명확한 정답이 있어서 바로 수정했다. **문제는 B.**

### 2단계: 상태 리셋 시도 #1 — `kernel.reset(initialAppState)`

"Playwright는 매 테스트마다 새 페이지니까, 커널 상태만 리셋하면 되겠지?"

```typescript
const { kernel, initialAppState } = await import("@os/kernel");
kernel.reset(initialAppState);
```

**결과: 백화현상.** 왜?

`kernel.reset()`은 `setState` + `clearTransactions()`를 실행한다. 문제는 `initialAppState`:

```typescript
export const initialAppState: AppState = {
  os: initialOSState,
  apps: {},  // ← 빈 객체!
};
```

`apps: {}`로 리셋하면 `apps.todo`가 `undefined`가 된다. 그런데 `registerAppSlice`는 **모듈 로드 시 딱 한 번만** `apps.todo`에 초기값을 쓴다:

```typescript
// registerAppSlice 내부 (73행)
kernel.setState((prev) => ({
  ...prev,
  apps: { ...prev.apps, [appId]: startState },
}));
```

이건 `import "@apps/todo/app"` 시점에 실행되고, **다시 실행되지 않는다.** React 컴포넌트가 리마운트해도 이 코드는 다시 안 탄다.

결과: `useComputed(s => s.items)` 같은 훅에서 `undefined.items` → 크래시 → React tree 언마운트 → 백화.

### 3단계: 상태 리셋 시도 #2 — `location.reload()`

"진짜 페이지를 리로드하면?"

```typescript
location.reload();
// Wait for re-mount...
```

이건 생각해보니 원리적으로 불가능하다. `location.reload()`는 **현재 JavaScript 실행 컨텍스트 자체를 파괴**한다. TestBot의 `runAll()`이 await하고 있는 Promise는 영원히 resolve되지 않는다. TestBot 자체의 상태(어떤 스위트를 실행 중인지, 결과 기록 등)도 모두 사라진다.

### 4단계: 상태 리셋 시도 #3 — `kernel.setState(() => initialAppState)`

"`reset()` 대신 `setState()`만 쓰면 트랜잭션은 보존되니까 좀 나을까?"

아니다. 핵심 문제는 `clearTransactions`가 아니라 **`apps: {}`이 앱 슬라이스를 날려버리는 것**이다. `setState`든 `reset`이든 `apps: {}`로 돌리면 똑같이 죽는다.

### 5단계: 근본 문제 인식

코드를 따라가다 보니 구조적 문제가 보였다:

```
initialAppState.apps = {}
     ↓ (registerAppSlice에서 한 번 쓰기)
kernel.state.apps.todo = INITIAL_STATE
     ↓ (테스트 간 goto에서 reset)
kernel.state.apps = {}  ← apps.todo 소실!
     ↓
Todo 컴포넌트: useComputed(s => s.data.todos) 
     ↓
undefined.data → 💥 TypeError → React unmount → 백화
```

**`registerAppSlice`의 초기화가 1회성**이라는 것이 근본 원인.

## 원인 추정

### Pattern A (selector): 확신도 높음 ✅
`getUniqueSelector`가 `#1`을 생성 → CSS 스펙상 숫자-only ID는 `#` 셀렉터로 invalid. `[id="1"]`로 변경하면 해결. **이미 수정 완료.**

### Pattern B (상태 격리): 확신도 높음 ✅
Playwright는 `test.beforeEach`에서 `page.goto("/")`로 완전 새 페이지를 생성하여 자연 격리. TestBot은 같은 JavaScript 컨텍스트에서 순차 실행하므로 상태가 누적된다.

단순 리셋(`initialAppState` 복원)은 **앱 슬라이스 등록이 1회성**이므로 앱을 죽인다. 이건 shim 레벨에서 해결할 문제가 아니라, **아키텍처 레벨의 설계 결정**이 필요하다.

### Pattern C (isLocator): 확신도 높음 ✅
`expect(0)` → `isLocator(0)` → `"selector" in 0` → TypeError. `typeof v === "object"` 가드 추가로 해결. **이미 수정 완료.**

## 다음 액션 제안

### Pattern A, C: 완료
수정 완료. Playwright E2E에도 영향 없음 (tsc 통과).

### Pattern B: 3가지 접근법 (설계 결정 필요)

#### 방법 1: `appSlice.resetState()` 메서드 추가 (추천)
`registerAppSlice`의 반환값에 `resetState()` 메서드를 추가. 슬라이스의 `initialState`를 기억해두고, 호출 시 해당 앱만 초기화.

```typescript
// AppSliceHandle에 추가
resetState() {
  kernel.setState((prev) => ({
    ...prev,
    apps: { ...prev.apps, [appId]: initialState },
  }));
}
```

`goto()`에서:
```typescript
const { todoSlice } = await import("@apps/todo/app");
todoSlice.resetState();
```

**장점**: 앱 단위 격리, 다른 앱/OS 상태 보존
**단점**: 어떤 앱을 리셋할지 shim이 알아야 함 (하드코딩 또는 레지스트리 필요)

#### 방법 2: 글로벌 `resetAllSlices()` 레지스트리
모든 `registerAppSlice` 호출을 추적하는 레지스트리 + `resetAllSlices()` 함수. `goto()`에서 호출.

**장점**: 앱을 몰라도 됨
**단점**: `appSlice.ts` 확장 필요

#### 방법 3: 테스트 실행 전략 변경 — 단일 테스트 실행
상태 격리가 불가능한 현 구조에서, TestBot을 "한 번에 하나의 스위트만 실행"하는 모드로 변경. 매 스위트마다 실제 `location.reload()`를 하되, 스위트 목록은 URL 파라미터로 전달.

**장점**: 완전한 격리
**단점**: 느림, 구현 복잡
