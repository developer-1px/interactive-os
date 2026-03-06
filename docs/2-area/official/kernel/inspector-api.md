# Kernel Inspector API

> Area: kernel
> Source: packages/kernel/src/createInspector.ts, packages/kernel/src/core/inspectorPort.ts
> Last synced: 2026-03-06

## 개요

커널은 Inspector API를 통해 내부 상태를 외부에서 읽을 수 있는 포트를 제공한다.
커널 핵심 로직은 변경하지 않고, 읽기 전용 API만 노출한다.

## 설계 결정 (ADR)

### 왜 Inspector API인가

커널의 `scopedCommands`는 클로저 안에 감싸져 있다.
외부에서 "어떤 커맨드가 어떤 스코프에 등록되어 있는가"를 알 방법이 없었다.

이전 접근 (GroupRegistry — 별도 정적 Map 우회):
- defineCommand()가 GroupRegistry.register()를 호출하지 않아 데이터 불일치
- 실제 커널과 모니터가 서로 다른 것을 보는 문제

채택된 접근: **커널에 Inspector API 추가**
- 커널이 유일한 Single Source of Truth
- 기존 `getTransactions()` 패턴과 동일한 읽기 전용 API

### Port/Adapter 패턴

Inspector는 커널 내부의 원시 Map이나 핸들러 참조에 직접 접근하지 않는다. Interface Segregation Principle에 따라 두 계층으로 분리된다.

**KernelIntrospectionPort** (좁은 포트, 커널 내부에서만 생성):

```ts
interface KernelIntrospectionPort<T = unknown> {
  getState(): T;

  // 개별 메서드로 스코프별 정보를 반환한다
  getCommandTypes(scope: ScopeToken): readonly string[];
  getWhenGuardTypes(scope: ScopeToken): readonly string[];
  getMiddlewareIds(scope: ScopeToken): readonly string[];
  getEffectTypes(scope: ScopeToken): readonly string[];
  getAllScopes(): readonly ScopeToken[];

  // 스코프 트리
  getScopeParent(scope: ScopeToken): ScopeToken | null;
  getScopePath(scope: ScopeToken): readonly ScopeToken[];

  // When guard 평가 (커널 클로저에 위임)
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;

  // 트랜잭션
  getTransactions(): readonly Transaction[];
  getLastTransaction(): Transaction | null;
  clearTransactions(): void;
  travelTo(index: number): void;
}
```

**KernelInspector** (공개 API, `kernel.inspector`로 접근):

```ts
interface KernelInspector {
  getRegistry(): RegistrySnapshot;
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;
  getAllScopes(): readonly ScopeToken[];
  getScopeParent(scope: ScopeToken): ScopeToken | null;
  getScopePath(scope: ScopeToken): readonly ScopeToken[];
  getTransactions(): readonly Transaction[];
  getLastTransaction(): Transaction | null;
  clearTransactions(): void;
  travelTo(index: number): void;
}
```

### RegistrySnapshot

`getRegistry()`는 dirty flag 패턴으로 캐싱된 스냅샷을 반환한다.

```ts
interface RegistrySnapshot {
  readonly commands: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly whenGuards: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly scopeTree: ReadonlyMap<ScopeToken, ScopeToken>;
  readonly middleware: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly effects: ReadonlyMap<ScopeToken, readonly string[]>;
}
```

등록 변경(`defineCommand`, `defineEffect`, `group.use`, `group`) 시 `invalidateRegistry()`가 호출되어 다음 `getRegistry()` 호출에서 스냅샷이 재구성된다.

## 커널 Public API

| 메서드 | 역할 |
|--------|------|
| `getState()` | 현재 상태 |
| `setState(updater)` | 상태 직접 변경 |
| `subscribe(listener)` | 상태 변경 구독 |
| `dispatch(cmd, options?)` | 커맨드 디스패치 |
| `defineCommand(type, handler)` | 커맨드 정의 |
| `defineEffect(type, handler)` | 이펙트 정의 |
| `defineContext(id, provider)` | 컨텍스트 정의 |
| `defineQuery(id, provider, options?)` | 쿼리 정의 |
| `resolveQuery(id)` | 쿼리 해석 |
| `group(config)` | 스코프 그룹 생성 |
| `use(middleware)` | 미들웨어 등록 |
| `register(factory)` | 외부 CommandFactory 등록 |
| `reset(newState)` | 상태 + 트랜잭션 초기화 |
| `resolveFallback(event)` | 키보드 이벤트 → 커맨드 폴백 |
| `inspector` | Inspector API (읽기 전용) |

## Inspector (createInspector.ts)

`createInspector(port)`는 `KernelIntrospectionPort`를 받아 `KernelInspector`를 구현한다.
Port의 개별 메서드를 조합하여 `RegistrySnapshot`을 구성하고, dirty flag로 캐싱한다.

커널 반환 객체의 `.inspector` 프로퍼티로 접근 가능.

## 관련 파일

| 파일 | 역할 |
|------|------|
| `packages/kernel/src/createKernel.ts` | 커널 메인 (~850줄) |
| `packages/kernel/src/createInspector.ts` | Inspector 구현 |
| `packages/kernel/src/createReactBindings.ts` | React 훅 (useComputed, useQuery) |
| `packages/kernel/src/core/tokens.ts` | 커널 토큰/타입 |
| `packages/kernel/src/core/transaction.ts` | 트랜잭션 모델 |
| `packages/kernel/src/core/inspectorPort.ts` | Inspector 인터페이스 |
| `packages/kernel/src/core/shallow.ts` | Shallow equality (useComputed용) |
