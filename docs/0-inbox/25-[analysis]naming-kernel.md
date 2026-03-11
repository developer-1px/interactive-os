# Kernel 네이밍 구성 분석

> 작성일: 2026-03-10
> 범위: `packages/kernel/src/` (8 files)
> 워크플로우: `/naming`

---

## 1. Key Pool 표

### 1.1 Prefix

| Key | Meaning | Appears In |
|-----|---------|------------|
| `Kernel` | 커널 도메인 네임스페이스 | `KernelIntrospectionPort`, `KernelInspector`, `KernelInspectorInternal` |
| `Internal` | 커널 내부 전용 (외부 노출 금지) | `InternalCommandHandler`, `InternalEffectHandler`, `KernelInspectorInternal` |
| `Base` | 제네릭 기본형 (타입 파라미터 미지정) | `BaseCommand` |

### 1.2 Verb

| Key | Meaning | 순수 | Appears In |
|-----|---------|------|------------|
| `create` | 새 인스턴스 반환 (팩토리) | ✅ | `createKernel`, `createInspector`, `createReactBindings`, `createGroup` (내부) |
| `define` | 선언 등록 + 핸들 반환 | ✅ | `defineScope`, `defineCommand`, `defineEffect`, `defineContext`, `defineQuery` |
| `compute` | 상태→속성 계산 | ✅ | `computeChanges` |
| `resolve` | 입력 분석→결정 | ✅ | `resolveContext`, `resolveQuery`, `resolveFallback` |
| `build` | 여러 조각 조립 | ✅ | `buildBubblePath`, `buildRegistrySnapshot` (내부) |
| `get` | 레지스트리/컬렉션 조회 | ✅ | `getState`, `getRegistry`, `getCommandTypes`, `getMiddlewareIds`, `getEffectTypes`, `getWhenGuardTypes`, `getAllScopes`, `getScopeParent`, `getScopePath`, `getTransactions`, `getLastTransaction` |
| `set` | 값 직접 설정 | ❌ | `setState` |
| `dispatch` | 커맨드 전달 | ❌ | `dispatch` |
| `subscribe` | 리스너 등록 | ❌ | `subscribe` |
| `register` | 런타임 레지스트리 추가 | ❌ | `register`, `registerMiddleware` (내부) |
| `process` | 커맨드 파이프라인 실행 | ❌ | `processCommand` (내부) |
| `execute` | 부수효과 실행 | ❌ | `executeEffects` (내부) |
| `record` | 트랜잭션 기록 | ❌ | `recordTransaction` (내부) |
| `notify` | 구독자 알림 | ❌ | `notifyListeners` (내부) |
| `invalidate` | 캐시 무효화 | ❌ | `invalidateRegistry`, `invalidateQueries` (내부) |
| `travel` | 시간 여행 (디버깅) | ❌ | `travelTo` |
| `clear` | 목록 초기화 | ❌ | `clearTransactions` |
| `evaluate` | 가드 조건 평가 | ✅ | `evaluateWhenGuard` |
| `enter` / `exit` | 모드 전환 쌍 | ❌ | `enterPreview`, `exitPreview` |
| `is` | boolean 질의 | ✅ | `isPreviewing` |
| `use` | 미들웨어 설치 (Express 패턴) | ❌ | `use` (= `registerMiddleware`) |
| `reset` | 상태 초기화 | ❌ | `reset` |

### 1.3 Noun (도메인 명사)

| Key | Meaning | Appears In |
|-----|---------|------------|
| `Kernel` | 상태 관리 엔진 | `createKernel`, `KernelInspector`, `KernelIntrospectionPort` |
| `Command` | 상태 변경 메시지 | `Command`, `BaseCommand`, `CommandFactory`, `defineCommand`, `getCommandTypes`, `processCommand` |
| `Effect` | 부수효과 | `EffectToken`, `defineEffect`, `executeEffects`, `getEffectTypes` |
| `Context` | 커맨드 실행 시 주입 데이터 | `ContextToken`, `defineContext`, `resolveContext`, `MiddlewareContext`, `TypedContext`, `InjectableContext` |
| `Query` | 캐시 기반 상태 파생 (4th primitive) | `QueryToken`, `defineQuery`, `resolveQuery`, `useQuery` |
| `Scope` | 소유권 경계 | `ScopeToken`, `defineScope`, `getAllScopes`, `getScopeParent`, `getScopePath`, `handlerScope` |
| `Middleware` | dispatch 전후 가로채기 | `Middleware`, `MiddlewareContext`, `registerMiddleware`, `getMiddlewareIds` |
| `Transaction` | 커맨드 실행 기록 | `Transaction`, `getTransactions`, `getLastTransaction`, `clearTransactions`, `recordTransaction` |
| `Inspector` | 디버깅/인트로스펙션 도구 | `createInspector`, `KernelInspector`, `KernelInspectorInternal` |
| `Registry` | 등록된 항목 저장소 | `RegistrySnapshot`, `getRegistry`, `invalidateRegistry` |
| `State` | 시간에 따라 변하는 구조체 | `getState`, `setState`, `StateDiff`, `stateSlice` |
| `Listener` | 상태 변경 구독자 | `Listener`, `notifyListeners` |
| `Preview` | 비파괴 상태 오버라이드 | `enterPreview`, `exitPreview`, `isPreviewing`, `previewState` |
| `Group` | 스코프 격리 단위 | `createGroup`, `group` |
| `Fallback` | 리스너 미처리→미들웨어 위임 | `resolveFallback`, `fallback` (Middleware 필드) |
| `Guard` | 조건부 실행 필터 | `WhenGuardOption`, `whenGuard`, `evaluateWhenGuard`, `getWhenGuardTypes` |

### 1.4 Suffix (타입 접미사)

| Key | Meaning | Appears In |
|-----|---------|------------|
| `Token` | 브랜드/래퍼 토큰 (DI 식별자) | `EffectToken`, `ScopeToken`, `ContextToken`, `QueryToken` |
| `Factory` | 커맨드 생성 함수 | `CommandFactory` |
| `Context` | 실행 환경/의존성 묶음 | `MiddlewareContext`, `TypedContext`, `InjectableContext` |
| `Port` | 인터페이스 분리 경계 (ISP) | `KernelIntrospectionPort` |
| `Snapshot` | 불변 캐시 스냅샷 | `RegistrySnapshot` |
| `Diff` | 변경 전후 차이 | `StateDiff` |
| `Result` | 함수 반환 결과 | `InjectResult` |
| `Handler` | 내부 핸들러 함수 타입 | `InternalCommandHandler`, `InternalEffectHandler` |
| `Option` | 선택적 설정 | `WhenGuardOption` |
| `Binding(s)` | React 연결 설정 | `ReactBindingKernel`, `createReactBindings` |

### 1.5 React Hook

| Key | Meaning | Appears In |
|-----|---------|------------|
| `useComputed` | selector 기반 상태 구독 | `createReactBindings` → `useComputed` |
| `useQuery` | QueryToken 기반 구독 | `createReactBindings` → `useQuery` |

### 1.6 Constant

| Key | Meaning | Appears In |
|-----|---------|------------|
| `GLOBAL` | 루트 스코프 상수 | `GLOBAL` (`ScopeToken<"GLOBAL">`) |
| `MAX_TRANSACTIONS` | 트랜잭션 로그 상한 | `MAX_TRANSACTIONS` (내부) |

---

## 2. 이상 패턴 리포트

### 2.1 동의어 충돌

| 의미 | 공존 Key | 판정 |
|------|---------|------|
| "레지스트리에 추가" | `register` vs `use` | **의도적 구분** — `register`는 CommandFactory 재등록, `use`는 Express 관용어로 Middleware 설치. 혼란 없음 |
| "실행하다" | `process` vs `execute` | **의도적 구분** — `process`는 커맨드 파이프라인 전체, `execute`는 EffectMap 실행. 범위가 다름 |
| "생성하다" | `create` vs `define` | **naming.md 규칙 준수** — `create`=인스턴스 팩토리, `define`=선언+등록. 잘 지켜짐 |
| "조회하다" | `get` vs `resolve` | **naming.md 규칙 준수** — `get`=레지스트리 조회, `resolve`=분석→결정. 단, 아래 `resolveContext`/`resolveQuery` 참조 |

### 2.2 의미 과적 (Overloading)

| Key | 의미 1 | 의미 2 | 심각도 |
|-----|--------|--------|--------|
| `resolve` | 입력→결정 (`resolveFallback`) | 레지스트리→값 (`resolveContext`, `resolveQuery`) | **경미** |

> **분석**: `resolveContext`와 `resolveQuery`는 "provider 함수를 실행하여 값을 얻는다"는 의미. naming.md 기준으로는 이것이 단순 조회(`get`)에 가까운지, 분석→결정(`resolve`)에 가까운지 경계가 모호하다.
>
> - `resolveContext`: provider 함수를 호출하여 **lazy하게** 값을 도출 → 단순 Map.get이 아니므로 `resolve`가 적합
> - `resolveQuery`: 캐시 판단 + provider 재실행 여부 결정 → 판단 로직 포함이므로 `resolve`가 적합
> - `resolveFallback`: 미들웨어 체인을 순회하며 커맨드 결정 → 전형적 `resolve`
>
> **결론**: 3개 모두 "판단을 수반하는 도출"이므로 `resolve`가 정당하다. 과적이 아니라 일관된 사용.

### 2.3 고아 Key (1회만 등장)

| Key | 등장처 | 판정 |
|-----|--------|------|
| `Prettify` | `tokens.ts` 내부 헬퍼 | **정당** — TS 유틸 타입. 도메인 개념 아님 |
| `shallow` | `shallow.ts` export | **정당** — Zustand/React 관용어. 유틸리티 함수 |
| `travel` | `travelTo` | **정당** — time-travel 디버깅 관용어 |
| `Preview` | `enterPreview`, `exitPreview`, `isPreviewing` | **3회 등장** — 고아 아님. 일관된 모드 전환 패턴 |
| `Fallback` | `resolveFallback`, `fallback` (MW 필드) | **2회 등장** — 고아 아님 |
| `evaluate` | `evaluateWhenGuard` | **고아 후보** — naming.md Dictionary에 없는 동사 |

> **`evaluate` 분석**: `evaluateWhenGuard`는 "가드 조건을 현재 상태에 대해 평가한다"는 의미.
> - `compute`와 비교: `compute`는 "상태→속성 도출". Guard 평가는 속성 도출이 아니라 boolean 판단
> - `resolve`와 비교: `resolve`는 "외부 입력→결정". Guard는 외부 입력이 아니라 내부 상태 기반
> - `is`와 비교: `isWhenGuardPassed`? — 하지만 null 반환(가드 없음)도 표현해야 해서 boolean 동사 부적합
> - **결론**: `evaluate`는 "조건식을 상태에 대해 실행하여 결과를 반환"하는 고유한 의미. naming.md Dictionary에 **추가 후보**.

### 2.4 패턴 일관성 검증

| 패턴 | 기대 | 실제 | 판정 |
|------|------|------|------|
| `defineX` → `XToken` 반환 | define + Token 쌍 | `defineCommand`→`CommandFactory`, `defineEffect`→`EffectToken`, `defineContext`→`ContextToken`, `defineQuery`→`QueryToken` | **예외 1개** — `defineCommand`만 `Factory` 반환. 나머지는 모두 `Token`. 의도적 — Command는 호출 가능해야 하므로 Factory가 맞음 |
| `getXxx` → 복수형 | 목록 조회 | `getCommandTypes`, `getEffectTypes`, `getAllScopes`, `getTransactions`, `getMiddlewareIds` | **일관적** — 복수 반환은 복수형 이름 |
| `getXxx` → 단수형 | 단일 조회 | `getState`, `getRegistry`, `getLastTransaction`, `getScopeParent`, `getScopePath` | **일관적** |
| `enterX` / `exitX` 쌍 | 모드 전환 | `enterPreview` / `exitPreview` | **일관적** |

### 2.5 naming.md 규칙 위반

| 규칙 | 위반 | 판정 |
|------|------|------|
| 동사 Dictionary에 `evaluate` 없음 | `evaluateWhenGuard` | **Dictionary 추가 후보** — §2.3 참조 |
| ~~`read` vs `get` 구분~~ | ~~`getState` 위반~~ | **해소** — `read` 동사 폐기. `get`으로 통일. naming.md 반영 완료 |

---

## 3. 구조 요약

### 3.1 Kernel 4 Primitives

| Primitive | define | Token | resolve/get |
|-----------|--------|-------|-------------|
| **Command** | `defineCommand` | `CommandFactory` | `processCommand` (내부) |
| **Effect** | `defineEffect` | `EffectToken` | `executeEffects` (내부) |
| **Context** | `defineContext` | `ContextToken` | `resolveContext` (내부) |
| **Query** | `defineQuery` | `QueryToken` | `resolveQuery` |

> 4개 primitive 모두 `define` + 고유 Token/Factory 패턴을 따른다. 매우 일관적.

### 3.2 Group API (createKernel 반환값)

| Method | Verb 분류 | 설명 |
|--------|-----------|------|
| `defineCommand` | define | 커맨드 선언+등록 |
| `defineEffect` | define | 이펙트 선언+등록 |
| `defineContext` | define | 컨텍스트 선언+등록 |
| `defineQuery` | define | 쿼리 선언+등록 |
| `group` | — (명사) | 스코프 격리 서브그룹 |
| `dispatch` | dispatch | 커맨드 전달 |
| `use` | register (alias) | 미들웨어 설치 |
| `register` | register | CommandFactory 재등록 |
| `reset` | — | 상태 초기화 |
| `getState` | get | 현재 상태 조회 |
| `setState` | set | 상태 직접 설정 |
| `subscribe` | — | 리스너 등록 |
| `enterPreview` / `exitPreview` | enter/exit | 프리뷰 모드 |
| `isPreviewing` | is | 프리뷰 중인지 |
| `resolveQuery` | resolve | 쿼리 값 도출 |
| `resolveFallback` | resolve | 미들웨어 폴백 |
| `inspector` | — (객체) | 인트로스펙션 API |

### 3.3 파일별 책임

| File | 책임 | 식별자 수 |
|------|------|-----------|
| `core/tokens.ts` | 타입 정의 (Token, Command, Middleware) | 14 types + 1 const |
| `core/transaction.ts` | 트랜잭션 타입 + 순수 diff 함수 | 2 types + 1 fn |
| `core/inspectorPort.ts` | Inspector 인터페이스 (ISP) | 4 interfaces |
| `core/shallow.ts` | 얕은 비교 유틸 | 1 fn |
| `createKernel.ts` | 커널 팩토리 (핵심) | 2 exports + ~20 내부 fn |
| `createInspector.ts` | Inspector 구현체 | 1 fn |
| `createReactBindings.ts` | React 바인딩 (hooks) | 1 fn + 1 interface |
| `index.ts` | Public API 재수출 | re-exports only |

---

## 4. 종합 평가

**Kernel 네이밍은 매우 일관적이다.** 주요 발견:

1. **동사 규칙 준수율 높음** — `create`/`define`/`resolve`/`compute`/`get`/`set`이 naming.md 규칙에 정확히 부합
2. **4 Primitives 패턴 완벽** — Command/Effect/Context/Query 모두 `define` + Token/Factory 쌍
3. **동의어 충돌 0건** — `register` vs `use`, `process` vs `execute` 모두 의도적 구분
4. **Dictionary 추가 후보 1건** — `evaluate` (조건식 평가, naming.md에 미등재)
5. **getState 예외는 정당** — Zustand 관용어, 헤드리스 맥락의 `read`와 레이어가 다름
6. **고아 Key 위험 0건** — 모든 고아 후보가 관용어이거나 유틸리티

### 권장 액션

- [ ] `evaluate` 동사를 `.agent/knowledge/naming.md` §1.6 또는 신규 섹션에 추가 검토
