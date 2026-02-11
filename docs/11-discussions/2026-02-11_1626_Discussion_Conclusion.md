# Kernel State Scoping — 논증 결론

> 커널의 scope + bubbling 원칙에서 state isolation이 누락된 문제에 대한 논증

## Why

커널에 `apps` slice를 추가하면서 multi-scope state가 생겼지만,
`ctx.state`가 여전히 전체 커널 state를 노출하고 있다.
이는 커널의 핵심 원칙(scope + bubbling)에서 **state만 scope 경계가 없는 상태**다.

## Intent

State scoping이 커널 원칙의 자명한 귀결인지 검증하고,
구현 방향(A+C)이 유일한 해인지 확인한다.

## Warrants (누적 논거)

| # | Warrant | 유형 |
|---|---|---|
| W1 | Scope는 state visibility까지 격리해야 한다 | 원칙 |
| W2 | 앱 → OS 쓰기는 dispatch effect + bubbling으로 해결된다 (syscall 패턴) | 메커니즘 |
| W3 | A(scoped view) + C(context injection) = 자명한 유일 해 | 결론 |
| W4 | 격리 원칙 + 버블링 원칙 + 커맨드 유일성에서 연역 도출됨 | 증명 |
| W5 | **Resolution(handler lookup) = scope + bubbling / Ownership(data) = scope only** | 핵심 구분 |
| W6 | State = ownership → scoping만 필요, bubbling 불필요 | 귀결 |
| W7 | 누락 원인: 단일 scope(GLOBAL only) 시절에는 문제가 발현되지 않음 | 원인 |

## 핵심 구분: Resolution vs Ownership

```
┌─────────────────────────────────────────────────┐
│            커널 범용 원칙                          │
├─────────────────────┬───────────────────────────┤
│  Resolution (탐색)   │  Ownership (소유)          │
│  scope + bubbling   │  scope only               │
├─────────────────────┼───────────────────────────┤
│  Command handler    │  State                    │
│  Effect handler     │                           │
│  Context provider   │                           │
│  Middleware         │                           │
└─────────────────────┴───────────────────────────┘
```

- **Resolution**: "누가 처리하나?" — 현재 scope에 없으면 부모로 버블링
- **Ownership**: "이 데이터는 누구 것인가?" — 항상 확정적, 버블링 불필요

## 구현 방향

### A: Scoped State View

```typescript
// processCommand에서 scope에 따라 ctx.state 필터링
const ctx = {
  state: scope === GLOBAL
    ? fullState             // OS 커맨드: 전체 state
    : fullState.apps[scope] // 앱 커맨드: 자기 slice만
};

// executeEffects에서 scope에 따라 state 반영
if (key === "state") {
  if (handlerScope === GLOBAL) {
    setState(() => value);              // 전체 교체
  } else {
    setState(prev => ({
      ...prev,
      apps: { ...prev.apps, [handlerScope]: value }  // slice만 교체
    }));
  }
}
```

### C: Context Injection (읽기 전용 OS 정보)

```typescript
const FocusInfo = kernel.defineContext("focus-info", () => ({
  activeZoneId: kernel.getState().os.focus.activeZoneId,
  focusedItemId: /* ... */,
}));

// 앱 커맨드에서: ctx.inject(FocusInfo) — 명시적 의존성 선언
```

### Dispatch Bubbling (쓰기)

```typescript
// 앱 커맨드가 OS에 요청할 때:
return {
  state: newAppState,                    // 자기 scope에 쓰기
  dispatch: FOCUS_MOVE({ id: newId }),   // OS scope로 버블링
};
```

## 한 줄 요약

> **커널의 모든 메커니즘은 scoped이고, handler lookup은 bubbling하지만, data ownership은 bubbling하지 않는다. State scoping은 이 원칙의 미완성 부분이었으며, A+C는 이를 완성하는 유일한 연역적 귀결이다.**
