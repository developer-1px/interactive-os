# API 레퍼런스

> Kernel 패키지의 전체 공개 API

---

## createKernel

독립적인 커널 인스턴스를 생성한다.

```typescript
function createKernel<S>(initialState: S): Kernel<S>
```

### 매개변수

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `initialState` | `S` | 초기 상태 트리 |

### 반환값

루트 Group API, Store API, React 훅, Inspector API를 결합한 커널 인스턴스를 반환한다.

```typescript
type Kernel<S> = {
  // Group API (루트 스코프 = GLOBAL)
  defineCommand: DefineCommand<S>;
  defineEffect: DefineEffect;
  defineContext: DefineContext;
  group: GroupFactory<S>;
  dispatch: Dispatch;
  use: (middleware: Middleware) => void;
  register: (factory: CommandFactory) => CommandFactory;
  reset: (newState: S) => void;

  // Store
  getState: () => S;
  setState: (updater: (prev: S) => S) => void;
  subscribe: (listener: () => void) => () => void;

  // Query
  defineQuery: DefineQuery<S>;
  resolveQuery: <T>(id: string) => T;

  // Inspector (Port/Adapter 패턴)
  inspector: KernelInspector;

  // Preview (테스트/인스펙션 전용)
  enterPreview: (state: S) => void;
  exitPreview: () => void;
  isPreviewing: () => boolean;

  // Fallback
  resolveFallback: (event: Event) => boolean;
}
```

Kernel 인스턴스 자체가 GLOBAL 스코프의 Group이다. 별도의 "커널 API"와 "그룹 API"를 구분하지 않고 동일한 인터페이스를 사용함으로써 API 표면과 학습 비용을 최소화한다. Inspector는 Port/Adapter 패턴으로 분리하여 개발 도구와 커널 내부 사이에 읽기 전용 인터페이스만 노출한다.

> [!NOTE]
> `useComputed`와 `useQuery` 훅은 `createKernel()` 반환에 포함되지 않는다. 이 훅들은 `createReactBindings(kernel)`을 통해 별도로 생성된다. OS 레이어의 `appState.ts`가 이를 통합하여 `kernel.useComputed`, `kernel.useQuery` 형태로 재노출한다.

### 예시

```typescript
const kernel = createKernel<{ count: number }>({ count: 0 });
```

---

## defineScope

스코프 네임스페이싱을 위한 브랜드 문자열 식별자 `ScopeToken`을 생성한다.

```typescript
function defineScope<Id extends string>(id: Id): ScopeToken<Id>
```

### 예시

```typescript
const TODO_LIST = defineScope("TODO_LIST");
const SIDEBAR = defineScope("SIDEBAR");
```

---

## Group API

모든 커널 인스턴스는 GLOBAL에 루팅된 Group이다. `group()`을 통해 자식 그룹을 생성할 수 있다.

### group.defineCommand

커맨드 핸들러를 등록하고 CommandFactory를 반환한다.

```typescript
// 페이로드 없음
defineCommand<T>(type: T, handler: Handler, options?: { when?: Guard }): CommandFactory<T, void>

// 페이로드 있음
defineCommand<T, P>(type: T, handler: HandlerWithPayload<P>, options?: { when?: Guard }): CommandFactory<T, P>

// 커맨드별 주입 (페이로드 없음)
defineCommand<T>(type: T, tokens: ContextToken[], handler: Handler, options?: { when?: Guard }): CommandFactory<T, void>

// 커맨드별 주입 (페이로드 있음)
defineCommand<T, P>(type: T, tokens: ContextToken[], handler: HandlerWithPayload<P>, options?: { when?: Guard }): CommandFactory<T, P>
```

**핸들러 입력:**

| 필드 | 타입 | 설명 |
|---|---|---|
| `ctx.state` | `S` | 현재 상태 (상태 렌즈 적용 시 스코프 슬라이스) |
| `ctx.{token.__id}` | varies | 주입된 컨텍스트 값 |
| `ctx.inject(token)` | varies | 대안적 주입 접근 방식 |

**핸들러 반환:**

| 필드 | 타입 | 설명 |
|---|---|---|
| `state` | `S` | 새 상태 트리 (상태 렌즈 적용 시 스코프 슬라이스) |
| `dispatch` | `BaseCommand \| BaseCommand[]` | 재디스패치할 커맨드 |
| `[EffectToken]` | varies | 커스텀 이펙트 값 |

부모 스코프로 버블링하려면 `undefined`를 반환한다.

**CommandFactory 메타데이터:**

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `commandType` | `string` | 커맨드 타입 문자열 |
| `id` | `string` | `commandType`과 동일한 호환 별칭 |
| `handler` | `InternalCommandHandler` | 핸들러 함수 참조 |
| `tokens` | `ContextToken[]` | 커맨드별 주입 토큰 |

CommandFactory에 handler와 tokens 메타데이터를 포함시킨 이유는 `register()` 메서드를 통해 하나의 커널에서 정의한 커맨드를 다른 커널(테스트 커널 등)에 등록할 수 있도록 하기 위해서다. 메타데이터로 핸들러와 토큰을 운반하므로 프로덕션과 테스트 환경이 동일한 핸들러 로직을 공유한다.

### group.defineEffect

이펙트 핸들러를 등록하고 EffectToken을 반환한다.

```typescript
defineEffect<T extends string, V>(type: T, handler: (value: V) => void): EffectToken<T, V>
```

### group.defineContext

컨텍스트 프로바이더를 등록하고 ContextToken을 반환한다.

```typescript
defineContext<Id extends string, V>(id: Id, provider: () => V): ContextToken<Id, V>
```

### group.group

선택적 스코프, 컨텍스트 주입, 상태 렌즈를 갖는 자식 그룹을 생성한다.

```typescript
group(config: {
  scope?: ScopeToken;
  inject?: ContextToken[];
  stateSlice?: {
    get: (full: S) => unknown;
    set: (full: S, slice: unknown) => S;
  };
}): Group
```

| 설정 | 설명 |
|---|---|
| `scope` | 그룹의 스코프 토큰. 부모 트리에 자동 등록된다 |
| `inject` | 그룹 내 모든 핸들러에 주입할 컨텍스트 토큰 |
| `stateSlice` | 스코프 격리를 위한 상태 렌즈. 핸들러가 슬라이스만 참조한다 |

자식 스코프에 `stateSlice`를 지정하지 않고 부모가 렌즈를 보유하면, 자식은 부모의 렌즈를 자동 상속한다. 같은 도메인 내의 하위 스코프들이 동일한 상태 슬라이스를 자연스럽게 공유할 수 있다.

### group.dispatch

파이프라인을 통해 커맨드를 디스패치한다.

```typescript
dispatch(cmd: BaseCommand, options?: {
  scope?: ScopeToken[];
  meta?: Record<string, unknown>;
}): void
```

| 매개변수 | 설명 |
|---|---|
| `cmd` | CommandFactory로 생성한 커맨드 객체 |
| `options.scope` | 명시적 스코프 체인 오버라이드 |
| `options.meta` | 트랜잭션에 기록되는 메타데이터. 핸들러에는 전달되지 않는다 |

### group.use

그룹의 스코프에 미들웨어를 등록한다.

```typescript
use(middleware: Middleware): void
```

### group.register

외부 CommandFactory의 핸들러를 현재 커널에 등록한다. factory의 `.handler`, `.tokens`, `.commandType`을 참조한다.

```typescript
register(factory: CommandFactory): CommandFactory
```

테스트 커널이 프로덕션 핸들러를 중복 없이 사용할 수 있도록 한다. `defineCommand`로 생성한 factory에 핸들러 함수가 메타데이터로 첨부되어 있으므로, 다른 커널에서 `register(factory)`를 호출하면 동일한 핸들러가 등록된다.

### group.reset

상태를 초기화하고 트랜잭션 로그를 제거한다. 레지스트리는 유지된다.

```typescript
reset(newState: S): void
```

---

## Store API

### getState

현재 상태 트리를 반환한다.

```typescript
getState(): S
```

### setState

상태를 직접 업데이트한다. 디스패치 파이프라인을 우회한다.

```typescript
setState(updater: (prev: S) => S): void
```

> [!WARNING]
> `setState`는 디스패치 파이프라인을 우회한다. 트랜잭션이 기록되지 않고, 이펙트가 실행되지 않으며, 미들웨어가 동작하지 않는다. 초기화, 테스트 등 탈출구 용도로만 사용해야 한다.

### subscribe

상태 변경 리스너를 등록한다. 구독 해제 함수를 반환한다.

```typescript
subscribe(listener: () => void): () => void
```

---

## React API

> [!NOTE]
> 아래 훅들은 `createReactBindings(kernel)`이 반환한다. `createKernel()` 반환 객체에는 포함되지 않는다.

### useComputed

상태 트리에서 파생된 값을 구독한다. `useSyncExternalStore` 기반이다. 선택된 값에 대해 shallow equality 비교를 수행하여, 동등한 결과에 대한 불필요한 리렌더링을 방지한다.

```typescript
useComputed<T>(selector: (state: S) => T): T
```

```tsx
function TodoCount() {
  const count = kernel.useComputed((s) => s.todos.length);
  return <span>{count}</span>;
}
```

### useQuery

`defineQuery()`로 등록된 Query를 구독한다. `useSyncExternalStore` 기반이며, Query 캐시의 무효화와 연동한다. shallow equality 비교로 불필요한 리렌더링을 방지한다.

```typescript
useQuery<T>(token: QueryToken<string, T>): T
```

```tsx
const VISIBLE_ITEMS = kernel.defineQuery("VISIBLE_ITEMS", (s) => s.items.filter(...));

function ItemList() {
  const items = kernel.useQuery(VISIBLE_ITEMS);
  return <ul>{items.map(...)}</ul>;
}
```

---

## Preview API

Preview Layer는 비파괴적 상태 오버라이드를 제공한다. 주로 테스트 인프라(`createOsPage`, `page.ts`)에서 사용되며, 프로덕션 상태를 보존하면서 독립된 상태 공간에서 디스패치를 실행할 수 있다.

### enterPreview

프리뷰 모드에 진입한다. 이후 `getState()`는 프리뷰 상태를 반환하고, `setState()`는 프리뷰 상태에 기록한다. 실제 상태는 보존된다. 프리뷰 모드는 별도의 트랜잭션 로그를 유지한다.

```typescript
enterPreview(state: S): void
```

### exitPreview

프리뷰 모드를 종료한다. `getState()`가 실제 상태를 다시 반환한다. 프리뷰 트랜잭션 로그는 폐기된다.

```typescript
exitPreview(): void
```

### isPreviewing

현재 프리뷰 모드인지 확인한다.

```typescript
isPreviewing(): boolean
```

---

## Inspector API

커널 인스턴스의 `inspector` 프로퍼티를 통해 접근한다. Interface Segregation Principle에 따라 Inspector는 커널 내부에 대한 읽기 전용 인터페이스로, 커맨드 등록이나 이펙트 등록 등 쓰기 작업과 완전히 분리되어 있다.

### inspector.getRegistry

등록된 커맨드, 이펙트, 미들웨어, 스코프 트리의 읽기 전용 스냅샷을 반환한다. dirty flag 패턴으로 캐싱한다.

```typescript
inspector.getRegistry(): RegistrySnapshot
```

```typescript
interface RegistrySnapshot {
  commands: ReadonlyMap<ScopeToken, readonly string[]>;
  whenGuards: ReadonlyMap<ScopeToken, readonly string[]>;
  scopeTree: ReadonlyMap<ScopeToken, ScopeToken>;
  middleware: ReadonlyMap<ScopeToken, readonly string[]>;
  effects: ReadonlyMap<ScopeToken, readonly string[]>;
}
```

### inspector.evaluateWhenGuard

특정 스코프와 타입에 대한 when guard를 현재 상태를 기준으로 평가한다. guard가 등록되지 않은 경우 `null`을 반환한다.

```typescript
inspector.evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null
```

### inspector.getAllScopes

등록된 모든 스코프 토큰을 반환한다.

```typescript
inspector.getAllScopes(): readonly ScopeToken[]
```

### inspector.getScopeParent

지정된 스코프의 부모 스코프를 반환한다. 루트 레벨 스코프의 경우 `null`을 반환한다.

```typescript
inspector.getScopeParent(scope: ScopeToken): ScopeToken | null
```

### inspector.getScopePath

스코프에서 GLOBAL까지의 전체 버블 경로를 반환한다.

```typescript
inspector.getScopePath(scope: ScopeToken): readonly ScopeToken[]
// 예: [TODO_LIST, SIDEBAR, APP, GLOBAL]
```

### inspector.getTransactions

전체 트랜잭션 로그를 반환한다. 최대 200개이며, FIFO 방식으로 관리된다.

```typescript
inspector.getTransactions(): readonly Transaction[]
```

### inspector.getLastTransaction

가장 최근 트랜잭션을 반환한다. 트랜잭션이 없으면 `null`을 반환한다.

```typescript
inspector.getLastTransaction(): Transaction | null
```

### inspector.travelTo

특정 트랜잭션 시점의 상태 스냅샷으로 복원한다.

```typescript
inspector.travelTo(transactionId: number): void
```

### inspector.clearTransactions

트랜잭션 로그를 비우고 ID 카운터를 초기화한다.

```typescript
inspector.clearTransactions(): void
```

---

## Query API

### defineQuery

상태에서 파생된 값을 캐싱하는 Query 프로바이더를 등록하고 QueryToken을 반환한다.

```typescript
defineQuery<Id extends string, T>(
  id: Id,
  provider: (state: S) => T,
  options?: { invalidateOn?: string[] },
): QueryToken<Id, T>
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `id` | `string` | Query 식별자 |
| `provider` | `(state: S) => T` | 상태에서 값을 도출하는 함수 |
| `options.invalidateOn` | `string[]` | 캐시를 무효화할 커맨드 타입 목록. 생략 시 모든 상태 변경에 재계산 |

`defineQuery()`는 동일한 ID로 Context 프로바이더도 자동 등록한다. 이를 통해 `group({ inject: [queryToken] })`으로 커맨드 핸들러에서 Query 결과에 접근할 수 있다.

### resolveQuery

등록된 Query를 해석하여 캐시된 값을 반환한다.

```typescript
resolveQuery<T>(id: string): T
```

캐시 히트 조건:
- 상태 참조가 이전과 동일하고, 무효화되지 않은 경우
- `invalidateOn`이 설정되어 있고, 해당 커맨드가 디스패치되지 않은 경우

---

## React Query API

### useQuery

Query를 React 컴포넌트에서 구독한다. `useSyncExternalStore` 기반이며, shallow 비교로 불필요한 리렌더링을 방지한다.

```typescript
useQuery<T>(token: QueryToken<string, T>): T
```

```tsx
const ITEM_COUNT = kernel.defineQuery("ITEM_COUNT", (s) => s.items.length);

function Counter() {
  const count = kernel.useQuery(ITEM_COUNT);
  return <span>{count}</span>;
}
```

---

## Fallback API

### resolveFallback

처리되지 않은 네이티브 이벤트를 위한 사이드 채널이다. GLOBAL 미들웨어의 `fallback` 훅을 순회한다.

```typescript
resolveFallback(event: Event): boolean
```

미들웨어가 Command를 생성하여 디스패치하면 `true`를 반환한다. OS 레이어 리스너가 1차 탐색에 실패했을 때 사용한다.

---

## 상수

### GLOBAL

내장 루트 스코프. 모든 버블 경로의 마지막 요소다.

```typescript
const GLOBAL: ScopeToken<"GLOBAL">
```

---

## 다음

→ [디스패치 파이프라인](./04-dispatch-pipeline.md) — 커맨드 처리의 상세 흐름
