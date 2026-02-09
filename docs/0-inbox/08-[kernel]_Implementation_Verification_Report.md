# Kernel 구현 검증 보고서

> 날짜: 2026-02-09
> 태그: kernel, verification, audit
> 상태: Final
> 대상: packages/kernel/src/ (716 LOC, 0 dependencies)
> 검증 기준: 01-[re-frame] 제안서, 07-[interface] 인터페이스 스펙

---

## 0. 요약

커널 엔진의 핵심 파이프라인(dispatch → handler → effect → middleware)은 **01 제안서에 충실하게 구현**되었다.
테스트 44개 전부 통과, 라이브 데모 페이지(KernelLabPage) 동작 확인.

**미구현 3건, 시그니처 불일치 2건** 발견. 아래 상세 기술.

---

## 1. 파일 구조

| 파일 | LOC | 역할 |
|---|---|---|
| `dispatch.ts` | 217 | 큐 기반 dispatch, 트랜잭션 로그, time travel |
| `registry.ts` | 142 | defineHandler / defineCommand / defineEffect 레지스트리 |
| `middleware.ts` | 119 | use(), onion 미들웨어 체인 (re-frame `{ id, before, after }`) |
| `context.ts` | 70 | defineContext / inject (lazy, per-command) |
| `createStore.ts` | 40 | 자체 반응형 스토어 (0 deps, Zustand 아님) |
| `react/useComputed.ts` | 31 | useSyncExternalStore 기반 구독 |
| `react/useDispatch.ts` | 15 | 안정적 dispatch 참조 |
| `index.ts` | 90 | initKernel / resetKernel + 전체 export |

**총 716 LOC.** 01 제안서 예측 ~500 LOC 대비 약간 초과 (트랜잭션 로그 + time travel 포함).

---

## 2. 테스트 결과

| Suite | 파일 | Tests | 결과 |
|---|---|---|---|
| Step 1: Dispatch Loop | `__tests__/step1.ts` | 20 | **ALL PASS** |
| Step 2: Middleware | `__tests__/step2.ts` | 10 | **ALL PASS** |
| Step 3: Context & Inject | `__tests__/step3.ts` | 14 | **ALL PASS** |
| **합계** | | **44** | **44 PASS / 0 FAIL** |

검증 항목:
- defineHandler + dispatch (상태 변환)
- defineCommand + defineEffect (이펙트 실행)
- 트랜잭션 로그 기록 및 time travel
- re-entrance 안전성 (dispatch 안에서 dispatch)
- 미등록 커맨드 경고 (크래시 없음)
- before/after 미들웨어 체인 (onion 패턴)
- 커맨드 변환 (before에서 type 교체)
- 이펙트 수정 (after에서 effect 가공)
- 미들웨어 실행 순서 (A:before → B:before → C:before → handler → C:after → B:after → A:after)
- 미들웨어 중복 제거 (id 기반)
- defineContext + inject (lazy 평가)
- 복수 컨텍스트 주입
- per-command only (글로벌 오염 없음)
- 누락 컨텍스트 경고
- resetKernel 전체 초기화
- 트랜잭션 상한 (200)

---

## 3. 01 제안서 대비 구현 현황

### 3.1 구현 완료 (9/12)

| # | API | 01 제안 시그니처 | 실제 구현 | 일치 |
|---|---|---|---|---|
| 1 | `dispatch(cmd)` | `dispatch({ type, payload? }): void` | 동일 | ✅ |
| 2 | `defineHandler(id, fn)` | `(state, payload) → state` | 동일 | ✅ |
| 3 | `defineCommand(id, fn)` | `(ctx, payload) → EffectMap` | 동일 | ✅ |
| 4 | `defineEffect(id, fn)` | `(value) → void` | 동일 | ✅ |
| 5 | `defineContext(id, fn)` | `() → unknown` | 동일 | ✅ |
| 6 | `inject(id)` | `→ Middleware` (per-command) | 동일 | ✅ |
| 7 | `use(middleware)` | `{ id, before?, after? }` | 동일 (D4 확정) | ✅ |
| 8 | `useComputed` | 이름 기반 쿼리 | 셀렉터 함수 | ⚠️ |
| 9 | `useDispatch()` | 안정 참조 | 동일 | ✅ |

### 3.2 미구현 (3/12)

| # | API | 설명 | 영향도 |
|---|---|---|---|
| 10 | `defineComputed(id, fn)` | 이름 기반 파생 상태 + 캐싱 + 계층 구독 | **높음** |
| 11 | `getState()` / `resetState()` | 스토어 직접 접근 | 중간 |
| 12 | Scope / Bubbling | `defineScope`, `buildBubblePath` 등 | **높음** (OS Layer 전제) |

---

## 4. 시그니처 불일치 상세

### 4.1 `useComputed` — 이름 기반 vs 셀렉터 (ISSUE-1)

```typescript
// ── 01 제안 + 07 스펙 ──
defineComputed("is-focused", (state, [_, zoneId, itemId]) =>
  state.focus.zones[zoneId]?.focusedItemId === itemId
);
const isFocused = useComputed(["is-focused", zoneId, itemId]);

// ── 실제 구현 ──
const isFocused = useComputed((state) =>
  state.focus.zones[zoneId]?.focusedItemId === itemId
);
```

**차이:**
- 제안: `defineComputed`로 등록 → 이름으로 쿼리 → 프레임워크가 캐싱/재계산 관리
- 실제: 컴포넌트가 직접 셀렉터 전달 → 매 상태 변경마다 셀렉터 재실행 → 캐싱 없음

**영향:** 컴포넌트 수가 많아지면 동일 파생 상태를 N번 계산. 계층적 구독 불가.

**결정 필요:** 이름 기반으로 확장할 것인지, 현재 셀렉터 방식을 확정으로 채택할 것인지.

### 4.2 `defineCommand` 인터셉터 위치 (ISSUE-2)

```typescript
// ── 01 제안 + 07 스펙 ──
defineCommand("NAVIGATE", [inject("dom-items")], handler);
//                         ^^^^^^^^^^^^^^^^^^^^^^^^  2번째 인자

// ── 실제 구현 ──
defineCommand("NAVIGATE", handler, [inject("dom-items")]);
//                                 ^^^^^^^^^^^^^^^^^^^^^^^^  3번째 인자
```

**영향:** API 사용 시 혼동. 문서와 코드 중 하나를 통일해야 함.

---

## 5. 설계 품질 평가

### 5.1 잘 된 것

1. **0 dependencies** — 자체 스토어(`createStore`)로 Zustand 의존 제거. 01 제안의 "~500 LOC 독립 추출" 목표 달성.
2. **re-entrance safe queue** — dispatch 안에서 dispatch해도 안전. 큐 기반 순서 보장.
3. **re-frame 미들웨어 패턴** — D4 결정 그대로 `{ id, before, after }`. 기존 Redux 스타일 완전 탈피.
4. **트랜잭션 로그 + time travel** — 01 제안에 없었으나 추가 구현. DevTools 연동 기반 마련.
5. **per-command interceptor** — `inject()`가 글로벌이 아닌 커맨드별 등록. 불필요한 컨텍스트 수집 방지.
6. **KernelLabPage** — 라이브 데모로 handler/command/effect/transaction 전체 파이프라인 시각 확인 가능.

### 5.2 개선 필요

1. **`computeChanges` 미완성** — `dispatch.ts:187` — 현재 `{ changed: true }` 하드코딩. Immer patches 또는 deep diff로 교체 필요.
2. **타입 안전성 부족** — `Command.payload`가 `unknown`. OS Layer에서 `OSCommandUnion`으로 래핑하지 않으면 타입 가드 없음.
3. **Store 타입 캐스팅** — `activeStore`가 `Store<unknown>`으로 캐스팅되어 내부적으로 타입 정보 손실.

---

## 6. 01 제안서 Six Dominoes 달성도

| Domino | 설명 | 달성 | 비고 |
|---|---|---|---|
| 1. dispatch | 단일 큐 진입점 | **10/10** | 완벽 |
| 2. handler | 순수 핸들러 (defineHandler + defineCommand) | **9/10** | 인터셉터 위치만 다름 |
| 3. effect | 플러그인 이펙트 (defineEffect) | **10/10** | 완벽 |
| 4. subscription | 파생 상태 구독 | **4/10** | defineComputed 미구현, 셀렉터만 |
| 5. view | React 바인딩 | **7/10** | useComputed 시그니처 불일치 |
| 6. DOM | 브라우저 렌더링 | **N/A** | 커널 범위 밖 |

**종합 점수: 핵심 엔진 40/50 (80%)**

---

## 7. 07 인터페이스 스펙 대비

### 7.1 Section 1 (Kernel Layer) 항목별

| Section | 인터페이스 | 구현 | 비고 |
|---|---|---|---|
| 1.1 Command | `{ type, payload? }` | ✅ | `registry.ts` |
| 1.2 dispatch | 큐 기반 | ✅ | `dispatch.ts` |
| 1.3 Handler<P> | `(ctx, payload) → EffectMap` | ✅ | `registry.ts` |
| 1.4 CommandDef | `{ id, run, log? }` | ❌ | 별도 타입 없음. 레지스트리에 직접 등록 |
| 1.5 EffectMap | `{ state, focus, scroll, ... }` | ⚠️ | `state`/`dispatch`만 내장. 나머지는 defineEffect 필요 |
| 1.6 Context | `{ state, [injected] }` | ✅ | `registry.ts` |
| 1.7 defineHandler | `(state, payload) → state` | ✅ | sugar로 구현 |
| 1.8 defineCommand | overload 3개 | ⚠️ | overload 1개만 (interceptors 3번째) |
| 1.9 defineEffect | `(value) → void` | ✅ | |
| 1.10 defineContext / inject | lazy + per-command | ✅ | |
| 1.11 Scope | defineScope, buildBubblePath | ❌ | 미구현 |
| 1.12 Middleware | `{ id, before?, after? }` | ✅ | D4 정확 반영 |
| 1.13 defineComputed / useComputed | 이름 기반 쿼리 | ❌/⚠️ | defineComputed 없음, useComputed 셀렉터 |
| 1.14 KeybindingDef | defineKeybinding, resolveKeybinding | ❌ | 커널에 없음 (OS Layer?) |
| 1.15 Store Access | getState, resetState, useDispatch | ⚠️ | useDispatch만 구현 |

### 7.2 요약

07 스펙 Section 1 기준 15개 항목 중:
- **완전 일치: 8개** (1.1, 1.2, 1.3, 1.6, 1.7, 1.9, 1.10, 1.12)
- **부분 일치: 4개** (1.5, 1.8, 1.13, 1.15)
- **미구현: 3개** (1.4, 1.11, 1.14)

---

## 8. TODO 액션 아이템

### P0 — 결정 필요 (구현 전에 방향 확정)

- [ ] **ISSUE-1: useComputed 시그니처 확정**
  - 옵션 A: 현재 셀렉터 방식 유지 → 07 스펙 수정, defineComputed 삭제
  - 옵션 B: defineComputed 구현 → useComputed를 이름 기반으로 전환
  - 옵션 C: 두 시그니처 공존 — `useComputed(selector)` + `useComputed([name, ...args])`

- [ ] **ISSUE-2: defineCommand 인터셉터 위치 확정**
  - 옵션 A: 코드를 제안서에 맞춤 → `defineCommand(id, interceptors, handler)`
  - 옵션 B: 제안서를 코드에 맞춤 → `defineCommand(id, handler, interceptors?)`

### P1 — 커널 보완

- [ ] `computeChanges` 구현 (deep diff 또는 Immer patches)
- [ ] `getState()` / `resetState()` 추가 (defineContext에서 스토어 접근 필요)
- [ ] Transaction 타입을 07 스펙 구조로 정렬 (`TransactionInput`, `StateDiff[]`)
- [ ] Command 타입 안전성 — 제네릭 또는 discriminated union 지원

### P2 — OS 연결

- [ ] Scope / Bubbling 구현 (`defineScope`, `buildBubblePath`)
- [ ] KeybindingDef를 커널 또는 OS Layer에 배치 결정
- [ ] OS 커맨드(NAVIGATE, SELECT 등)를 `defineCommand`로 마이그레이션
- [ ] `defineEffect("focus")`, `defineEffect("scroll")` OS 이펙트 등록
- [ ] 기존 `buildContext` → `defineContext` 전환
- [ ] 기존 Redux 미들웨어 → re-frame `{ id, before, after }` 전환

### P3 — 문서 동기화

- [ ] 01 제안서: 실제 구현 반영 (시그니처 차이, 자체 스토어 등)
- [ ] 03 문서: `Event` → `Command` (D1 반영)
- [ ] 05 문서: `Interceptor` → `Middleware` (D4 반영)
- [ ] 07 스펙: Section 1을 실제 커널 코드에 맞춰 갱신

---

## 9. 결론

커널의 **핵심 아키텍처(dispatch → handler → effect → middleware)는 01 제안서의 설계를 충실하게 구현**했다.
re-frame의 Six Dominoes 중 1~3 (dispatch, handler, effect)은 프로덕션 수준이며, 미들웨어(D4)도 정확히 re-frame 패턴을 따른다.

**다음 단계의 핵심은 두 가지 결정:**
1. Subscription 전략 (defineComputed vs 셀렉터)
2. defineCommand 인터셉터 위치

이 두 결정이 나면 나머지 P1~P3 작업은 기계적으로 진행 가능하다.
