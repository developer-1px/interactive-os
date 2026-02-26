# Kernel Code Review Report

> **Date**: 2026-02-16T21:00 KST  
> **Scope**: `packages/kernel/src/` (6 files, ~1,060 lines)  
> **Status**: `@frozen 2026-02-11` — 코어 런타임 잠금 상태  
> **Reviewer**: AI Agent (보고서 모드)

---

## 요약

커널 코드베이스는 전체적으로 **높은 품질**을 유지하고 있습니다. `@frozen` 선언에 걸맞게 핵심 아키텍처(dispatch, store, group/scope, transaction)가 안정적이며, Port/Adapter 패턴으로 Inspector를 분리한 설계가 깔끔합니다, 브랜드 타입 시스템도 일관되게 적용되어 있습니다.

| 심각도 | 건수 | 설명 |
|--------|------|------|
| 🔴 철학 위반 | 2 | TS 에러 1건, `console` 직접 사용 |
| 🟡 네이밍/구조 | 2 | 미사용 export 타입, 파일명 컨벤션 |
| 🔵 개선 제안 | 4 | 성능 패턴, 테스트 부재, Inspector `type` 미사용 |
| 🟣 Praise | 3 | 아키텍처 우수 사항 |

---

## 🔴 철학 위반 (Blocker)

### R-01. `KernelInspector<T>` — unused type parameter `T` → TS6133 에러

- **파일**: `core/inspectorPort.ts:57`
- **의도**: `[Blocker]`
- **증거**: `npx tsc --noEmit` 출력:  
  ```
  packages/kernel/src/core/inspectorPort.ts(57,33): error TS6133: 'T' is declared but its value is never read.
  ```
- **원인**: `KernelInspector<T>` 인터페이스가 `T`를 선언하지만 멤버에서 한 번도 사용하지 않습니다. `KernelIntrospectionPort<T>`는 `getState(): T`에서 사용하고, `KernelInspectorInternal<T>`은 `extends KernelInspector<T>`로 전파하지만 중간 인터페이스에서 `T`가 소비되지 않습니다.
- **수정안**: Inspector에 `getState(): T`를 추가하거나, `T`를 제거하고 `KernelInspectorInternal`에서만 필요하면 독립적으로 정의합니다.

### R-02. 로깅 원칙 위반 — `console.warn` / `console.error` 직접 사용

- **파일**: `createKernel.ts:116, 163, 392, 395`
- **의도**: `[Blocker]`
- **원칙 위반**: `.agent/rules.md` 체크리스트 "로깅 원칙: `console.log` 대신 `logger` 사용"
- **현황**: 커널에서 4곳이 `console.warn` / `console.error`를 직접 호출합니다.
  ```
  L116: console.warn(`[kernel] No context provider registered for "${id}"`);
  L163: console.warn(`[kernel] Transaction ${transactionId} not found`);
  L392: console.error(`[kernel] Effect "${key}" threw:`, err);
  L395: console.warn(`[kernel] Unknown effect "${key}" in EffectMap`);
  ```
- **참고**: 커널은 프레임워크 독립 패키지이므로, `logger`를 외부 주입할지, 내부 경량 어댑터를 만들지 결정이 필요합니다. `@frozen` 상태이므로 minor change로 처리 가능합니다.

---

## 🟡 네이밍/구조 (Suggest)

### R-03. 미사용 export 타입 — `TypedEffectMap`, `EffectFields`

- **파일**: `core/tokens.ts:90-103`
- **의도**: `[Suggest]`
- **증거**: 전체 프로젝트에서 `import TypedEffectMap`과 `import EffectFields`를 사용하는 곳이 **0건**입니다. `index.ts`에서도 re-export하지 않습니다.
- **원칙**: "모든 코드는 부채다. 존재하는 코드는 정당화되어야 한다."
- **수정안**: 현재 소비자가 없으면 제거하거나, public API로 노출할 의도라면 `index.ts`에서 re-export.

### R-04. 파일명 번호 prefix 컨벤션 미적용

- **파일**: `packages/kernel/src/` 전체
- **의도**: `[Nitpick]`
- **현황**: OS 레이어(`src/os/3-commands/`, `src/os/6-components/` 등)는 번호 prefix를 사용하지만, 커널 패키지는 `createKernel.ts`, `createInspector.ts`로 번호가 없습니다.
- **판단**: 커널은 독립 패키지(3파일 + core/ 3파일)로 규모가 작아 번호 prefix의 실익이 낮습니다. 현재 구조가 적절합니다. **수정 불필요**.

---

## 🔵 개선 제안 (Suggest)

### R-05. 성능 패턴 — `useComputed` 소비자 중 객체 반환 패턴 다수 (커널 외부)

- **의도**: `[Suggest]`
- **원칙**: "useComputed selector는 원시값을 반환한다"
- **커널 내부**: `useComputed` 구현 자체는 올바릅니다 (`useSyncExternalStore` + `selectorRef`).
- **커널 외부 위반 사례** (커널 리뷰 범위 밖이지만 기록):
  ```
  // 🔴 전체 state 객체 반환 → 모든 변경에 리렌더
  ListView.tsx:14       TodoApp.useComputed((s) => s)
  Sidebar.tsx:42        TodoApp.useComputed((s) => s)
  TodoToolbar.tsx:24    TodoApp.useComputed((s) => s)
  KernelPanel.tsx:35    kernel.useComputed((s: any) => s)
  KernelPanel.tsx:57    kernel.useComputed((s: any) => s)
  KernelLabPage.tsx:348 kernel.useComputed((s) => s)
  
  // 🟡 객체 반환 (필요한 필드만 추출하면 개선 가능)
  TodoPanel.tsx:10      TodoApp.useComputed((s) => s?.ui)
  CTABlock.tsx:12       BuilderApp.useComputed((s) => s.data.fields)
  ```
- **권고**: `/perf` 호출로 별도 분석. 특히 Todo의 `ListView`는 리스트 아이템이 반복 렌더되므로 영향도가 높습니다.

### R-06. `InternalCommandHandler` / `InternalEffectHandler` — `any` 사용

- **파일**: `core/tokens.ts:130, 133`
- **의도**: `[Suggest]`
- **현황**:
  ```ts
  export type InternalCommandHandler = (ctx: any) => (payload?: any) => any;
  export type InternalEffectHandler = (value: any) => void;
  ```
- **판단**: Internal 타입은 런타임 Multi-type 핸들러 저장소용이므로, `any`는 의도적 교차 타입 소거입니다. public API 경계(`defineCommand`, `defineEffect`)에서 타입 안전성이 보장되므로 현재 구조는 합리적입니다. **수정 불필요**.

### R-07. 테스트 디렉토리 비어 있음

- **파일**: `packages/kernel/tests/` (empty)
- **의도**: `[Suggest]`
- **원칙**: "테스트가 먼저다", "증명 없는 통과는 통과가 아니다"
- **현황**: 커널 유닛 테스트가 0건입니다. E2E(`KernelLabPage`)와 외부 앱 테스트로 간접 검증되고 있으나, 코어 로직(bubble path, when guard, state lens, middleware 순서, effect dispatch)의 단위 테스트가 없습니다.
- **위험**: `@frozen`이므로 당장 깨질 리스크는 낮지만, 향후 해동(unfreeze) 시 안전망이 없습니다.
- **권고**: 핵심 시나리오(`dispatch` + `when guard` + `state lens`)에 대한 최소 단위 테스트 추가.

### R-08. `KernelPanel` — `type AnyKernel = any` 우회

- **파일**: `src/inspector/panels/KernelPanel.tsx:10`
- **의도**: `[Suggest]`
- **현황**: Inspector에서 커널 타입을 `any`로 우회하고 있습니다. 커널의 public API 타입을 추출하여 타입 안전성을 확보할 수 있습니다.
  ```ts
  type AnyKernel = any;  // 🔴
  ```
- **참고**: 커널 리뷰 범위 밖이지만, 커널 타입 설계의 소비자 품질에 영향을 주므로 기록합니다.

---

## 🟣 Praise

### P-01. Closure-based 인스턴스 패턴 — 우수

`createKernel`이 모든 상태를 클로저에 격리하여 전역 오염 제로, HMR 안전을 보장합니다. Zustand 스타일의 검증된 패턴을 커널에 적용한 것은 탁월한 설계입니다.

### P-02. Port/Adapter로 Inspector 분리 — 우수

`KernelIntrospectionPort` → `createInspector` 구조가 ISP(Interface Segregation Principle)를 정확히 따릅니다. Inspector가 커널 내부 Map/Set에 직접 접근하지 않아, 커널 내부 구조 변경이 Inspector에 전파되지 않습니다.

### P-03. 브랜드 타입 시스템 — 일관적

`EffectToken`, `ScopeToken`, `Command` 모두 `unique symbol` 기반 phantom branding을 사용하여, raw string 실수를 컴파일 타임에 차단합니다. `ContextToken`은 wrapper 객체 방식으로 구분되어 있으며, 전체적으로 일관됩니다.

---

## 수렴 루프 결과

| 회차 | 발견 |
|------|------|
| 1회 | 8건 (R-01 ~ R-08) |
| 2회 | 0건 (새 발견 없음) |

✅ **수렴 완료** — 2회차, 총 8건 보고.

---

## 액션 아이템

| 우선순위 | ID | 액션 | 비고 |
|----------|----|------|------|
| **P0** | R-01 | `KernelInspector<T>`의 `T` 미사용 수정 → TS 에러 해소 | `@frozen` minor fix |
| **P1** | R-02 | `console.warn/error` → logger 어댑터 도입 결정 | 설계 결정 필요 |
| **P1** | R-03 | `TypedEffectMap`, `EffectFields` 존속 검토 | 미사용 시 제거 |
| **P2** | R-05 | `useComputed` 소비자 성능 감사 → `/perf` | 커널 외부 |
| **P2** | R-07 | 커널 유닛 테스트 추가 | 해동 대비 |
| **P3** | R-08 | `KernelPanel` 타입 안전성 개선 | 커널 외부 |
