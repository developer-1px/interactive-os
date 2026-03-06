# Kernel

> 인터랙티브 애플리케이션을 위한 범용 커맨드 처리 엔진

---

## 개요

Kernel은 프레임워크에 의존하지 않는 커맨드 처리 엔진이다. 스코프 기반 파이프라인을 통해 커맨드를 처리하고, 애플리케이션 상태를 관리하며, 부수 효과(effect)를 실행한다. 전 과정에 걸쳐 타입 안전성이 보장된다.

```
Command → Handler → Effects → State Update
```

Kernel은 키보드, 마우스, 포커스, ARIA 등 특정 도메인을 일절 알지 못한다. Kernel이 다루는 개념은 Command, Effect, Context, Scope, Middleware, State뿐이다.

도메인 무관(domain-agnostic) 설계를 채택한 이유는 관심사의 분리에 있다. 입력 장치는 OS 레이어가, 비즈니스 로직은 App 레이어가 각각 담당한다. Kernel은 "커맨드를 수신하고 → 핸들러를 실행하고 → 이펙트를 처리한다"는 보편 파이프라인만 제공한다. 이를 통해 커널 코드를 변경하지 않고도 새로운 입력 장치나 도메인을 추가할 수 있다.

---

## 주요 특성

| 특성 | 설명 |
|---|---|
| 커맨드 파이프라인 | 스코프 기반 디스패치와 자동 버블 경로 확장 |
| 이펙트 선언 모델 | 핸들러가 이펙트를 선언하면 엔진이 실행한다 |
| 타입 안전 토큰 | Branded 타입으로 원시 문자열 오류를 컴파일 타임에 차단한다 |
| 클로저 기반 인스턴스 | 싱글턴과 `globalThis` 없이 각 커널이 독립적으로 동작한다 |
| 미들웨어 | before/after 훅의 양파 모델(onion model) 실행 |
| 상태 렌즈 | 스코프별 상태 격리를 통해 핸들러가 자신의 슬라이스만 참조한다 |
| 컨텍스트 주입 | `group({ inject })`를 통한 선언적 외부 데이터 주입 |
| When Guard | 조건부 커맨드 실행 — guard 실패 시 상위 스코프로 버블링 |
| 타임 트래블 | 트랜잭션 로그와 상태 스냅샷을 활용한 `travelTo()` |
| React 통합 | `useSyncExternalStore` 기반의 `useComputed()` 훅 |
| HMR 안전 | 재등록 시 기존 핸들러를 자동 교체하여 stale 핸들러가 남지 않는다 |

---

## 아키텍처

Kernel은 3계층 아키텍처의 최하위에 위치한다. 상위 계층에 대해 어떤 지식도 갖지 않는 보편 기반이다.

```
┌──────────────────────────────────────────────┐
│  Layer 3: App                                │
│  TodoState, KanbanState, 도메인 커맨드         │
│  도메인 로직. OS를 알지 못한다.                 │
├──────────────────────────────────────────────┤
│  Layer 2: OS                                 │
│  Focus, Zone, Navigation, ARIA, Keybindings  │
│  Kernel 위에 구축된 시스템 서비스              │
├──────────────────────────────────────────────┤
│  Layer 1: Kernel                             │
│  dispatch, defineCommand, defineEffect       │
│  범용 커맨드 엔진                              │
└──────────────────────────────────────────────┘
```

### 의존성 규칙

| 방향 | 허용 여부 |
|---|---|
| Kernel → OS | ❌ Kernel은 OS를 참조하지 않는다 |
| Kernel → App | ❌ Kernel은 App을 참조하지 않는다 |
| OS → Kernel | ✅ OS는 Kernel API를 사용한다 |
| App → Kernel | ✅ App은 `defineCommand`를 직접 호출할 수 있다 |
| App → OS | ✅ App은 OS 프리미티브를 사용한다 |
| OS → App | ❌ OS는 App을 참조하지 않는다 |

### 입력 비의존성

Kernel은 커맨드의 출처를 알지 못한다. 센서(keyboard, mouse, clipboard)는 OS 레이어에 속하며, 각 센서는 입력을 Command로 변환한 뒤 `dispatch()`를 호출한다.

```
KeyboardSensor → "Enter" → dispatch(ACTIVATE())
MouseSensor    → click   → dispatch(ACTIVATE())
ClipboardSensor → paste  → dispatch(PASTE())
TestBot        → direct  → dispatch(ACTIVATE())
```

이 설계를 통해 커널은 실제 입력 장치 없이도 테스트할 수 있다. TestBot이 동일한 `dispatch(ACTIVATE())`를 호출하면 동일한 결과가 보장된다.

---

## 소스 구조

```
packages/kernel/src/
├── index.ts              공개 API 내보내기
├── createKernel.ts       커널 팩토리 — 엔진 전체 (~740 lines)
├── createInspector.ts    Inspector 구현 (Port/Adapter 패턴)
└── core/
    ├── tokens.ts         타입 정의 (Command, EffectToken, ScopeToken 등)
    ├── inspectorPort.ts  Inspector 포트 인터페이스 (ISP 준수)
    └── transaction.ts    StateDiff 계산 (순수 함수)
```

파일 구조에 대한 설계 근거는 다음과 같다.

- **`createKernel.ts` 단일 파일**: 커널의 모든 상태가 하나의 클로저 안에 존재해야 하므로, 파일을 분할하면 클로저 간 상태 공유가 필요해져 복잡도가 증가한다.
- **`createInspector.ts` 분리**: Interface Segregation Principle에 따라 Inspector는 커널 내부에 대한 읽기 전용 좁은 창(narrow window)만 필요하다. 좁은 포트 인터페이스(`inspectorPort.ts`)를 통해 접근하며, 커널 내부 Map에 직접 접근하지 않는다.
- **`core/` 디렉토리**: 상태를 갖지 않는 파일만 포함한다. `tokens.ts`는 컴파일 타임 전용 브랜드 심볼이며, `transaction.ts`의 `computeChanges()`는 순수 함수다.

---

## 설계 철학

1. **이펙트 선언 모델** — 핸들러는 순수 함수다. 발생할 이펙트를 선언하면 엔진이 이를 실행한다. [re-frame](https://day8.github.io/re-frame/)의 effects-as-data 개념에서 영감을 받았다.

2. **명시적 토큰** — 모든 ID는 `define*()`을 통해 생성되는 타입 안전 토큰이다. 원시 문자열을 사용하면 컴파일 오류가 발생한다. LLM 기반 개발에서 특히 중요한 안전장치다.

3. **CommandFactory 패턴** — dispatch 오버로딩을 두지 않았다. `dispatch(INCREMENT())`가 유일한 호출 형태이며, 팩토리가 Command를 생성하고 dispatch가 이를 수신한다. `dispatch("INCREMENT")`와 같은 문자열 기반 형태는 LLM 환각(hallucination)을 유발하기 쉬우므로 설계 단계에서 제거하였다.

4. **클로저 기반 격리** — `createKernel()` 호출마다 자체 상태, 레지스트리, 트랜잭션 로그를 가진 독립 인스턴스를 생성한다. `globalThis`를 사용하지 않으며, HMR 환경에서 안전하다.

5. **스코프 버블링** — 커맨드는 구체→일반 방향(widget → app → GLOBAL)으로 스코프 체인을 순회한다. DOM 이벤트 버블링과 유사한 모델이며, 핸들러는 커맨드를 처리하거나 상위로 통과시킬 수 있다.

6. **When Guard** — 커맨드 핸들러에 `{ when: (state) => boolean }` 조건을 부여할 수 있다. guard가 실패하면 해당 스코프를 건너뛰고 상위로 버블링된다. 이를 통해 선행 조건을 핸들러 로직과 분리하고, Inspector에서 guard 상태를 시각화할 수 있다.

---

## 다음 단계

| 가이드 | 설명 |
|---|---|
| [시작하기](./01-getting-started.md) | 설치와 첫 커널 인스턴스 |
| [핵심 개념](./02-core-concepts.md) | Command, Effect, Context, Scope |
| [API 레퍼런스](./03-api-reference.md) | 전체 API 문서 |
| [디스패치 파이프라인](./04-dispatch-pipeline.md) | 커맨드 처리의 상세 흐름 |
| [타입 시스템](./05-type-system.md) | 토큰과 타입 안전성 |
| [미들웨어](./06-middleware.md) | Before/After 훅 |
| [상태 관리](./07-state-management.md) | State, Store, State Lens |
| [패턴 & 레시피](./08-patterns.md) | 모범 사례 |
| [용어집](./09-glossary.md) | 용어와 설계 결정 |
