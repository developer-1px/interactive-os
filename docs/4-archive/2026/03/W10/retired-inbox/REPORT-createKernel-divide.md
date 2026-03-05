## /divide Report — `createKernel.ts` 모듈 분해 및 React 의존성 제거

### Problem Frame

| | 내용 |
|---|------|
| **Objective** | `createKernel.ts` 파일(900+ lines)에 공존하는 여러 관심사(상태 관리, React Hooks, 미들웨어 큐, 디스패처, 레지스트리)를 HMR 친화적인 작은 팩토리 구조로 분해하고, React 의존성(`useComputed`, `useQuery`)을 `os-react` 패키지로 이동한다. |
| **Constraints** | 1. **No React in Kernel**: `packages/kernel/`에서는 React(`useSyncExternalStore`, `useRef`, `useCallback` 등)를 import해서는 안 된다. 커널은 Framework Agnostic 해야 한다.<br>2. **HMR Support Maintained**: 상태와 팩토리가 싱글톤 객체에 종속되는 것이 아니라 현재처럼 호출 환경에 묶이는(Closure) 형태여야 한다.<br>3. **Existing API Integrity**: 최종 외부 인터페이스(`createKernel`의 Return Type)는 React hook 제외 전후가 거의 동일해야 한다 (단, React hook은 `os-react`에서 제공).<br>4. **Test Pass**: 모든 분해 과정을 거친 후에도 기존의 모든 스펙 테스트(`npm run test`)가 통과해야 한다. |
| **Variables** | 1. React 훅을 구체적으로 `os-react` 내 어느 파일에 위치시키고 어떤 인터페이스로 익스포트할 것인가.<br>2. 커널 내부 상태(Store, Transactions, Queue, Providers)를 몇 개의 팩토리(`createStore`, `createDispatcher`, `createRegistry` 등)로 분리할 것인가.<br>3. 이 작은 팩토리들을 담을 디렉토리 구조(예: `packages/kernel/src/core/`)는 어떻게 할 것인가. |

### Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | `createKernel.ts` 리팩토링 및 React 분리 | ❌ | `packages/kernel/src/createKernel.ts` 내 React import 확인 | → React 분리, 모듈 분할 |
| 1 | 커널 컴파일 환경에서 React 의존성 제거 | ❌ | `createKernel.ts` L17 `import ... from "react"` 존재 | → Hooks 추출, 패키지 간 의존성 변경 |
| 2 | `useComputed`, `useQuery` 로직을 별도 파일로 분리 | ❌ | `createKernel.ts` 내부에 함수 그대로 존재 | 🔨 Work Package 1 (`packages/os-react/src/createKernelHooks.ts` 생성) |
| 2 | `os-react` 패키지 구성(package.json 등) 확인 및 의존성 업데이트 | ✅ | `packages/os-react/` 폴더 존재 및 기존 React 연동 확인 | — |
| 1 | `createKernel` 내부 구조를 작은 팩토리 합성으로 재편 | ❌ | `createKernel.ts`가 947줄 단일 클로저 | → 역할별 내부 팩토리 도출 |
| 2 | Store 팩토리 분리 (`createStore.ts`) | ❌ | `createKernel` 내부에 `state`, `previewState`, `listeners` 선언 존재 | 🔨 Work Package 2 (상태 관리를 독립 클로저 팩토리로 분할) |
| 2 | Registry / Context 팩토리 분리 | ❌ | `scopedCommands`, `scopedEffects`, `queryProviders` 등이 함수 내에 하드코딩됨 | 🔨 Work Package 3 (명령/이펙트/문맥 보관소 팩토리 생성) |
| 2 | Dispatcher / Bubble 로직 분리 | ❌ | `processCommand`, `executeEffects`, 큐 처리 로직이 팩토리 본문에 포함됨 | 🔨 Work Package 4 (커맨드 실행기 및 미들웨어 처리 로직 분리) |
| 2 | `createKernel.ts`를 이 팩토리들의 Facade로 변경 | ❌ | 단일 거대 함수 | 🔨 Work Package 5 (작은 팩토리들을 조립하여 기존과 동일한 Kernel API 반환) |

### Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence |
|----|---------|-------------------|----------|
| WP 1 | `useComputed`, `useQuery`를 `os-react` 하위 유틸리티(예: `createHooks`)로 이동 | Constraint(No React in Kernel) 만족. 애플리케이션 코드가 React Reactivity를 유지하면서 Kernel을 쓰기 위해. | `packages/kernel/src/createKernel.ts:763-851` |
| WP 2 | `Store` 팩토리 분리 (`createStore`) | 거대 클로저를 책임 단위로 나누기 위함. 커널 상태(State + Preview)와 구독(Pub/Sub) 기능만 갖는 순수 모듈. | `packages/kernel/src/createKernel.ts:69-98` |
| WP 3 | `Registry` 팩토리 분리 (`createRegistry`) | 커맨드, 이펙트, 스코프 맵, 프로바이더 등 메타데이터 저장을 한 곳에서 관리. | `packages/kernel/src/createKernel.ts:100-227` |
| WP 4 | `Dispatcher` / `Queue` 엔진 분리 | 부수효과 실행(Effects, Middleware) 및 트랜잭션 기록 처리를 분리. | `packages/kernel/src/createKernel.ts:229-568` |
| WP 5 | `createKernel` Facade 조립 | 애플리케이션 입장에서는 여전히 하나의 API 컨텍스트를 제공받도록 하여 호환성 유지. | 전체 구조 |

### Residual Uncertainty

- **WP4 (Dispatcher)의 의존성 주입 방식**: Dispatcher는 Store를 수정하고 Registry에서 커맨드를 찾아야 하므로 `createDispatcher(store, registry)` 형태로 팩토리가 서로 값을 참조해야 합니다. 이 순환 참조(또는 단방향 주입 구조)를 어떻게 깔끔하게 구성할지가 구현 시점의 난제입니다.
- **`os-react` 인터페이스 변동**: 애플리케이션 코드(예: Todo 앱)들이 기존에는 `kernel.useComputed`를 호출했을 가능성이 높습니다. WP 1 이후 일괄적으로 `os-react`의 훅을 쓰도록 호출부를 수정해야 할 수 있습니다 (이는 `grep` 후속 작업 필요).
