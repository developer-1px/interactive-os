# Blueprint: Inspector Transaction Subscription

## 1. Goal

**UDE**: state 변화가 없는 커맨드(경계 clamp, 중복 선택 등)가 inspector에 즉시 표시되지 않음.
다음 state 변화가 올 때야 비로소 보임. "보이지 않는 것은 고칠 수 없다."

**Done Criteria**: 모든 dispatch(state 변화 유무 무관)가 즉시 inspector UI에 반영됨.

## 2. Why

- **rules.md #5**: "100% 관찰 가능. 시스템의 모든 행동이 기록되어야 신뢰할 수 있다."
- **근본 원인**: `recordTransaction`은 항상 호출되지만, UI 갱신 트리거인
  `subscribe/notify`는 `setState` 호출에만 반응. transaction 기록에 대한 알림 채널 부재.
- **책임 분석**: "기록했으면 기록됐다고 알리는 것까지가 기록 주체의 책임."
  inspector port 레이어에 알림 채널을 추가하는 것이 SRP에 부합.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| rAF polling으로 해결 가능 | ❌ event-driven이 아닌 hack | inspector port subscription |
| InspectorAdapter에서 dispatch를 wrap | ❌ 책임 침범 | inspector port subscription |
| kernel의 notify()를 항상 호출 | ❌ 모든 useSyncExternalStore 소비자가 불필요 리렌더 | 별도 채널 분리 |
| inspector port 확장 = kernel 수정 | ❌ inspector는 관찰 인터페이스, 내부 로직 아님 | 허용 범위 |

## 4. Ideal

1. `recordTransaction` 호출 시 → inspector의 transaction listeners에 즉시 notify
2. `InspectorAdapter`는 이 subscription을 사용해 리렌더
3. `KernelPanel`도 동일 메커니즘으로 리렌더
4. 기존 `os.subscribe`(state 변화용)은 건드리지 않음 — 별도 채널

## 5. Inputs

| 파일 | 역할 |
|------|------|
| `packages/kernel/src/core/inspectorPort.ts` | Inspector port interface 정의 |
| `packages/kernel/src/createInspector.ts` | Inspector 구현 (port 소비) |
| `packages/kernel/src/createKernel.ts` L236-262 | `recordTransaction` — 기록 주체 |
| `packages/kernel/src/createKernel.ts` L880-886 | introspectionPort → createInspector |
| `src/inspector/panels/InspectorAdapter.tsx` | 소비자 — `useSyncExternalStore` |
| `src/inspector/panels/KernelPanel.tsx` | 소비자 — `kernel.useComputed` |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | transaction 기록 시 listener notify | recordTransaction은 push만 | onTransaction callback 호출 추가 | High | — |
| G2 | inspector에 subscribe/unsubscribe API | getTransactions만 존재 | subscribeTransactions 메서드 추가 | High | — |
| G3 | InspectorAdapter가 transaction subscription 사용 | useSyncExternalStore(os.subscribe) | subscribeTransactions 사용으로 전환 | High | G2 |
| G4 | KernelPanel도 동일 | kernel.useComputed | 동일 패턴 전환 | Med | G2 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| 1 | inspectorPort.ts: `subscribeTransactions` 인터페이스 추가 | Clear | — | KernelIntrospectionPort + KernelInspector에 subscribe 메서드 추가 |
| 2 | createKernel.ts: `recordTransaction` 후 transaction listeners notify | Clear | 1 | listeners Set + notify 패턴 (기존 subscribe와 동일 패턴) |
| 3 | createInspector.ts: port.subscribeTransactions passthrough | Clear | 1 | 단순 위임 |
| 4 | InspectorAdapter.tsx: `os.inspector.subscribeTransactions` 사용 | Clear | 3 | useSyncExternalStore의 subscribe를 교체 |
| 5 | KernelPanel.tsx: 동일 | Clear | 3 | useComputed 제거, subscribeTransactions 사용 |
| 6 | 전체 테스트 GREEN 확인 | Clear | 4,5 | vitest run |
