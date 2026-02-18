# Kernel 스토어 싱글톤 버그 보고서

> 날짜: 2026-02-09
> 태그: kernel, bug, React, useSyncExternalStore
> 상태: Resolved
> 영향 범위: KernelLabPage (및 커널 스토어를 사용하는 모든 React 컴포넌트)

---

## 1. 증상

`/kernel-lab` 페이지에서 버튼을 클릭해도 State 패널이 갱신되지 않음. dispatch는 실행되지만 React UI에 반영 안 됨.

---

## 2. 원인

### 스토어 인스턴스 교체로 인한 구독 단절

`KernelLabPage.tsx`에서 `setupKernel()`이 두 번 호출된다:

```
1. 모듈 레벨 (line 323):  setupKernel() → initKernel() → Store A 생성
2. useEffect (line 332):   setupKernel() → resetKernel() → initKernel() → Store B 생성
```

**실행 순서:**

```
[모듈 평가]  setupKernel() → initKernel() → Store A 생성, activeStore = Store A
     ↓
[React 마운트] useComputed() → useSyncExternalStore(Store A.subscribe, ...) → Store A에 구독
     ↓
[useEffect]  setupKernel()
              → resetKernel()  → (레지스트리 초기화)
              → initKernel()   → Store B 생성, activeStore = Store B
     ↓
[버튼 클릭]  dispatch() → activeStore(= Store B)에 쓰기
              → Store A의 subscriber는 알림 못 받음
              → React 리렌더 없음
```

**핵심:** `useSyncExternalStore`는 특정 스토어 인스턴스의 `subscribe` 함수에 바인딩된다. 스토어가 교체되면 기존 구독은 옛 인스턴스에 묶여 있어 새 스토어의 변경을 감지할 수 없다.

---

## 3. 수정

### 3.1 `initKernel` — 스토어 싱글톤 보장

```typescript
// Before: 항상 새 스토어 생성
export function initKernel<S>(initialState: S): Store<S> {
  const store = createStore(initialState);
  bindStore(store);
  return store;
}

// After: 기존 스토어가 있으면 상태만 리셋
export function initKernel<S>(initialState: S): Store<S> {
  const existing = getActiveStore();
  if (existing) {
    resetState(initialState);
    return existing as Store<S>;
  }
  const store = createStore(initialState);
  bindStore(store);
  return store;
}
```

### 3.2 `resetKernel` — 스토어 바인딩 보존

```typescript
// Before: unbindStore() 포함 → 스토어 참조 파괴
export function resetKernel(): void {
  clearAllRegistries();
  clearMiddlewares();
  clearContextProviders();
  clearTransactions();
  unbindStore();  // ← React 구독 끊김
}

// After: 레지스트리만 초기화, 스토어는 보존
export function resetKernel(): void {
  clearAllRegistries();
  clearMiddlewares();
  clearContextProviders();
  clearTransactions();
  // 스토어 바인딩 보존 → React 구독 유지
}
```

전체 teardown이 필요한 경우 `unbindStore()`를 별도로 호출한다.

---

## 4. 검증

```typescript
const store1 = initKernel({ count: 0 });
// subscriber 등록 (React의 useSyncExternalStore 시뮬레이션)
store1.subscribe(() => console.log('notified'));

resetKernel();
const store2 = initKernel({ count: 0 });

store1 === store2  // true — 동일 인스턴스
dispatch({ type: "increment" });
// → "notified" 출력됨 — 구독 정상 동작
```

테스트: 70/70 ALL PASS (step1~step4). 빌드: `tsc --noEmit` + `vite build` 성공.

---

## 5. 교훈

### 규칙: 외부 스토어는 싱글톤이어야 한다

`useSyncExternalStore`는 **안정적인 `subscribe` 참조**를 전제한다. React 문서에서도 subscribe 함수가 매 렌더마다 바뀌면 불필요한 재구독이 발생한다고 경고한다. 스토어 인스턴스 자체가 교체되면 재구독조차 불가능하다.

```
❌ initKernel() 여러 번 호출 → 매번 새 스토어
✅ initKernel() 여러 번 호출 → 기존 스토어 재사용, 상태만 리셋
```

### API 설계 원칙

| 함수 | 역할 | 스토어 영향 |
|---|---|---|
| `initKernel(state)` | 최초 생성 또는 상태 리셋 | 보존 (싱글톤) |
| `resetKernel()` | 레지스트리/미들웨어/컨텍스트 초기화 | 보존 |
| `resetState(state)` | 상태만 교체 | 보존 |
| `unbindStore()` | 완전 해제 (테스트 전용) | **파괴** |

---

## 6. 변경 파일

| 파일 | 변경 |
|---|---|
| `packages/kernel/src/index.ts` | `initKernel` 싱글톤 로직, `resetKernel`에서 `unbindStore` 제거 |
| `packages/kernel/src/dispatch.ts` | `getState()`, `resetState()`, `unbindStore()`, `StateDiff`, `computeChanges` 추가 |
| `packages/kernel/src/__tests__/step3.ts` | `resetKernel` 동작 변경에 맞춰 테스트 수정 |
| `packages/kernel/src/__tests__/step4.ts` | `computeChanges`, `getState`, `resetState`, `unbindStore` 테스트 신규 |
