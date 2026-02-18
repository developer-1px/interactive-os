# Kernel Inspector API

> Area: 10-kernel
> Source: packages/kernel/src/createInspector.ts, packages/kernel/src/createKernel.ts
> Last synced: 2026-02-18

## 개요

커널은 Inspector API를 통해 내부 상태를 외부에서 읽을 수 있는 포트를 제공한다.
커널 핵심 로직은 변경하지 않고, 읽기 전용 API만 노출한다.

## 설계 결정 (ADR)

### 왜 Inspector API인가

v5 커널의 `scopedCommands`는 클로저 안에 감싸져 있다.
외부에서 "어떤 커맨드가 어떤 스코프에 등록되어 있는가"를 알 방법이 없었다.

이전 접근 (GroupRegistry — 별도 정적 Map 우회):
- defineCommand()가 GroupRegistry.register()를 호출하지 않아 데이터 불일치
- 실제 커널과 모니터가 서로 다른 것을 보는 문제

채택된 접근: **커널에 Inspector API 추가**
- 커널이 유일한 Single Source of Truth
- 기존 `getTransactions()` 패턴과 동일한 읽기 전용 API

### KernelIntrospectionPort

```ts
interface KernelIntrospectionPort {
  getRegistry(): {
    commands: Map<string, string[]>;    // scope → commandType[]
    whenGuards: Map<string, string[]>;  // scope → commandType[] (with guards)
    scopeTree: Map<string, string>;     // child → parent
    middleware: Map<string, string[]>;   // scope → middleware id[]
    effects: Map<string, string[]>;     // scope → effect id[]
  };
  evaluateWhenGuard(scope: string, type: string): boolean | null;
}
```

## 커널 Public API

| 메서드 | 역할 |
|--------|------|
| `getState()` | 현재 상태 |
| `setState(updater)` | 상태 직접 변경 |
| `subscribe(listener)` | 상태 변경 구독 |
| `dispatch(cmd, options?)` | 커맨드 디스패치 |
| `defineContext(id, provider)` | 컨텍스트 정의 |
| `registerMiddleware(mw)` | 미들웨어 등록 |
| `resolveFallback(event)` | 키보드 이벤트 → 커맨드 폴백 |
| `createGroup(scope, tokens)` | 스코프 그룹 생성 |
| `getTransactions()` | 트랜잭션 로그 조회 |
| `getLastTransaction()` | 마지막 트랜잭션 |
| `travelTo(id)` | 타임 트래블 |

## Inspector (createInspector.ts)

`createInspector()`는 커널 내부 클로저를 순회하여 Inspector 데이터를 수집한다.
커널 반환 객체의 `.inspector` 프로퍼티로 접근 가능.

## 관련 파일

| 파일 | 역할 |
|------|------|
| `packages/kernel/src/createKernel.ts` | 커널 메인 (723줄) |
| `packages/kernel/src/createInspector.ts` | Inspector 구현 |
| `packages/kernel/src/core/tokens.ts` | 커널 토큰/타입 |
| `packages/kernel/src/core/transaction.ts` | 트랜잭션 모델 |
| `packages/kernel/src/core/inspectorPort.ts` | Inspector 인터페이스 |
