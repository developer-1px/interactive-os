# Code Review — Registry Monitor PoC

**대상 파일:**
1. `packages/kernel/src/createKernel.ts` (L657-687)
2. `src/routes/playground/poc-registry-monitor.tsx` (전체)

**일시:** 2026-02-15 08:58

---

## 🔴 철학 위반 (즉시 수정 필요)

### R1. `useState`로 UI 상태 관리 — 원칙 위반
- **파일:** `poc-registry-monitor.tsx` L259
- **코드:** `const [expanded, setExpanded] = useState(depth < 2);`
- **위반 원칙:** Goal 7 — *"앱은 의도를 선언하고, OS가 실행을 보장한다. useState, useEffect, onClick이 0줄인 세계."*
- **분석:** 인스펙터/playground는 OS 위에서 돌아가는 "앱"이다. expand/collapse는 OS가 관리하는 상태여야 한다.
- **판정:** PoC이므로 허용하되, 채택 시 커널 상태로 전환 필요.
- **심각도:** 🟡 (PoC 맥락에서는 의도적 타협)

### R2. `onClick` 직접 사용 — 선언적 원칙 위반
- **파일:** `poc-registry-monitor.tsx` L274
- **코드:** `onClick={() => setExpanded(!expanded)}`
- **위반 원칙:** Goal 7 — *"onClick이 0줄인 세계"*, Project 2 — *"번역기는 번역만 한다"*
- **분석:** 클릭 → 상태 변경을 직접 연결. 커맨드 파이프라인을 거치지 않는다.
- **판정:** PoC이므로 허용하되, 채택 시 `OS.Trigger` + 커맨드로 전환 필요.
- **심각도:** 🟡 (PoC 맥락에서는 의도적 타협)

### R3. `kernel.getLastTransaction()` → 렌더링 중 호출, 구독 없음
- **파일:** `poc-registry-monitor.tsx` L46-47
- **코드:** `const lastTx = kernel.getLastTransaction();` / `const transactions = kernel.getTransactions();`
- **위반 원칙:** Goal 5 — *"100% 관찰 가능"*, Working 6 — *"가장 빠른 피드백부터"*
- **분석:** 이 값들은 일반 함수 호출이라 React 리렌더를 트리거하지 않는다. 커맨드를 실행해도 화면이 갱신되지 않는다. `kernel.useComputed()`를 사용해야 실시간 반영된다.
- **수정 제안:**
  ```tsx
  // ❌ 현재 — 정적 스냅샷, 리렌더 안 됨
  const lastTx = kernel.getLastTransaction();
  
  // ✅ 수정 — 구독 기반, 실시간 반영
  // (단, 트랜잭션은 커널 state가 아니므로 별도 방안 필요)
  ```
- **심각도:** 🔴 (기능 결함 — 실시간 업데이트 안 됨)

### R4. `useMemo(() => kernel.getRegistry(), [])` — 정적 스냅샷
- **파일:** `poc-registry-monitor.tsx` L45
- **코드:** `const registry = useMemo(() => kernel.getRegistry(), []);`
- **분석:** 빈 deps `[]`이므로 마운트 시 한 번만 호출. 런타임에 새 커맨드가 등록되어도(HMR 등) 반영되지 않음.
- **판정:** PoC에서는 초기 상태 확인이 목적이므로 기능적으로는 OK. 채택 시 `kernel.subscribe()` 또는 렌더 시점마다 호출로 전환.
- **심각도:** 🟡

---

## 🟡 네이밍/구조 (리팩토링 권장)

### N1. `useCallback` import 미사용
- **파일:** `poc-registry-monitor.tsx` L13
- **코드:** `import { useCallback, useMemo, useState } from "react";`
- **문제:** `useCallback`이 import되었으나 사용되지 않음.

### N2. `evaluateGuard` prop 타입이 커널과 결합
- **파일:** `poc-registry-monitor.tsx` L145
- **코드:** `evaluateGuard={kernel.evaluateWhenGuard.bind(kernel)}`
- **문제:** `.bind(kernel)` — 커널은 클로저 기반이라 `this` 바인딩이 불필요. 일반 함수이므로 `bind` 없이 전달 가능.
- **수정:** `evaluateGuard={kernel.evaluateWhenGuard}`

### N3. `style={{ marginLeft: depth * 16 }}` — 인라인 스타일
- **파일:** `poc-registry-monitor.tsx` L270
- **문제:** Tailwind 기반 프로젝트에서 인라인 스타일 사용. 동적 depth이므로 Tailwind로 표현하기 어렵긴 하나, 채택 시 CSS variable이나 `paddingLeft` 클래스로 대체 검토.

---

## 🔵 개선 제안

### I1. `getRegistry()` 반환 타입을 export하면 consumer 편의성 향상
- **파일:** `packages/kernel/src/createKernel.ts`
- **제안:** `RegistrySnapshot` 타입을 명시적으로 정의하고 export.
  ```ts
  export interface RegistrySnapshot {
    commands: Map<string, string[]>;
    whenGuards: Map<string, string[]>;
    scopeTree: Map<string, string>;
    middleware: Map<string, string[]>;
    effects: Map<string, string[]>;
  }
  ```
- **이유:** 100% 타입 원칙. 추론에 의존하면 에이전트가 타입을 모른다.

### I2. `evaluateWhenGuard`의 3-state 반환 → 타입 명확화
- **파일:** `packages/kernel/src/createKernel.ts` L680
- **현재:** `boolean | null` — null이 "guard 없음"
- **제안:** 의미를 명확하게 하려면 discriminated union 또는 주석이 충분.
  현재 JSDoc이 있으므로 OK, 하지만 채택 시 `WhenGuardResult` 타입 정의 검토.

### I3. Scope Tree 빌드 로직 — 커널 안으로 이동 고려
- **파일:** `poc-registry-monitor.tsx` L50-93
- **분석:** flat `parentMap`을 트리로 변환하는 로직이 UI 컴포넌트에 있음. 이 로직은 도메인 지식(scope 계층)에 속하므로 커널의 inspector API에 `getScopeTree(): ScopeNode[]` 형태로 제공하면 consumer가 단순해짐.
- **판정:** PoC에서는 OK. 채택 시 커널로 이동.

---

## 종합 판정

| 분류 | 건수 | 요약 |
|------|------|------|
| 🔴 철학 위반 | 1건 (R3) | 실시간 구독 없음 — 기능 결함 |
| 🟡 의도적 타협 | 3건 (R1, R2, R4) | PoC 맥락에서 허용, 채택 시 전환 필요 |
| 🟡 네이밍/구조 | 3건 (N1-N3) | 미사용 import, 불필요 bind, 인라인 스타일 |
| 🔵 개선 제안 | 3건 (I1-I3) | 타입 export, Scope Tree 커널 이동 |

### 결론

**커널 API (`getRegistry`, `evaluateWhenGuard`)는 설계 원칙에 부합한다.**
- 읽기 전용, 부작용 없음, 기존 Inspector 패턴과 일관됨.

**PoC UI 코드는 의도적 타협이 4건 있지만, PoC 목적(검증)에는 적합하다.**
- 채택 시 R1/R2를 커널 상태 + OS.Trigger 패턴으로 전환해야 함.
- R3(실시간 구독 부재)은 기능 결함이므로 채택 전에 반드시 해결해야 함.
