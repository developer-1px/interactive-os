# [kernel] 자기문서화 파일 구조 제안

## 핵심 원칙

> **파일명 = 공개 API**. 폴더를 열면 "이 패키지가 뭘 할 수 있는지" 즉시 파악 가능.
> **`core/`는 구현**. 외부에서 절대 직접 import하지 않음.

---

## 제안 구조

```
packages/kernel/src/
│
│  ── 공개 Interface (파일명 = API) ──
│
├── index.ts              barrel export
├── createKernel.ts       createKernel(), state()
├── defineContext.ts       defineContext()
├── dispatch.ts            dispatch()
├── inspect.ts             getTransactions(), travelTo(), clearTransactions()
├── store.ts               initKernel(), getState(), resetState()
├── types.ts               Command, EffectToken, ContextToken, ...
│
│  ── React Bindings ──
│
├── react/
│   ├── useComputed.ts
│   └── useDispatch.ts
│
│  ── 내부 구현 (외부 import 금지) ──
│
├── core/
│   ├── createStore.ts     미니멀 반응형 스토어
│   ├── group.ts           createGroup factory (defineCommand, defineEffect, group, use, reset)
│   ├── processCommand.ts  dispatch pipeline (큐잉, 미들웨어 체이닝, 핸들러 실행)
│   ├── executeEffects.ts  이펙트 실행 + 스코프 버블링
│   ├── middleware.ts      미들웨어 등록 + 적용
│   ├── registry.ts        Map 저장소 (scopedCommands, scopedEffects, scopedMiddleware)
│   ├── transaction.ts     트랜잭션 로깅 + computeChanges (state diff)
│   └── binding.ts         커널 ↔ 스토어 바인딩 (bindStore, getActiveStore, unbindStore)
│
│  ── Tests ──
│
└── __tests__/
    ├── step1.ts ... step4.ts
    └── type-proof.ts
```

---

## 자기문서화 효과

폴더를 열었을 때 보이는 것:

```
createKernel.ts
defineContext.ts
dispatch.ts
inspect.ts
store.ts
types.ts
```

→ **"커널을 만들고, 컨텍스트를 정의하고, 디스패치하고, 상태를 검사하고, 스토어를 관리한다."**

코드를 한 줄도 읽지 않아도 API 전체를 파악할 수 있음.

---

## 파일별 내용 매핑

### 공개 파일 (Top-Level)

| 파일 | exports | 현재 위치 |
|------|---------|----------|
| `createKernel.ts` | `createKernel`, `state`, `defineScope` | registry.ts |
| `defineContext.ts` | `defineContext` | context.ts (유지) |
| `dispatch.ts` | `dispatch` | registry.ts 내부 |
| `inspect.ts` | `getTransactions`, `getLastTransaction`, `travelTo`, `clearTransactions` | transaction.ts |
| `store.ts` | `initKernel`, `getState`, `resetState`, `resetKernel` | index.ts + store.ts |
| `types.ts` | `Command`, `CommandFactory`, `EffectToken`, `ScopeToken`, `ContextToken`, `TypedContext`, `InjectResult`, ... | tokens.ts |

### core/ 파일 (내부)

| 파일 | 책임 | 현재 위치 |
|------|------|----------|
| `core/group.ts` | `createGroup` factory (defineCommand, defineEffect를 생성하는 클로저) | registry.ts L112-243 |
| `core/processCommand.ts` | 커맨드 큐잉 + 버블링 + 핸들러 실행 | registry.ts L275-398 |
| `core/executeEffects.ts` | 이펙트 맵 실행 (state, dispatch, custom effects) | registry.ts L400-442 |
| `core/middleware.ts` | 미들웨어 등록/해제/onion 체이닝 | registry.ts L249-265 |
| `core/registry.ts` | `Map` 저장소 + 조회 함수 (getScopedCommand 등) | registry.ts L56-67, L446-464 |
| `core/transaction.ts` | 트랜잭션 로깅 + `computeChanges` | transaction.ts |
| `core/binding.ts` | `bindStore`, `getActiveStore`, `unbindStore` | store.ts |
| `core/createStore.ts` | 미니멀 스토어 (getState/setState/subscribe) | createStore.ts |

---

## 의존성 규칙

```
┌─────────────────────────────────┐
│        Public (top-level)       │
│   createKernel → core/group    │
│   dispatch     → core/process  │
│   inspect      → core/txn      │
│   store        → core/binding  │
└──────────────┬──────────────────┘
               │ imports
               ▼
┌─────────────────────────────────┐
│          core/ (internal)       │
│   group → registry, middleware  │
│   process → registry, effects  │
│   binding → createStore        │
└─────────────────────────────────┘
```

> **규칙**: `core/` 파일은 서로 import 가능. 외부에서 `core/`를 직접 import **불가**.
> **강제**: `index.ts`만 public 파일을 re-export. Lint 규칙으로 `core/` 직접 import 차단 가능.

---

## 호환 Shim 처리

현재 `dispatch.ts`(re-export)와 `middleware.ts`(re-export)는 **삭제**.
`dispatch.ts`는 실제 구현 파일로 대체되므로 자연스럽게 해결됨.

---

## index.ts 최종 형태

```typescript
// ── Public API ──
export { createKernel, defineScope, state } from "./createKernel.ts";
export { defineContext } from "./defineContext.ts";
export { dispatch } from "./dispatch.ts";
export { getTransactions, getLastTransaction, travelTo, clearTransactions } from "./inspect.ts";
export { initKernel, getState, resetState, resetKernel } from "./store.ts";

// ── Types ──
export type { Command, CommandFactory, ContextToken, EffectToken, ... } from "./types.ts";
export { GLOBAL } from "./types.ts";

// ── React ──
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";
```

→ `index.ts`를 읽으면 **전체 public API가 카테고리별로 정리**됨.
