# Kernel State Scoping — 대화록

> 2026-02-11 16:18~16:26 — Resolution vs Ownership 발견까지의 논의

---

**🧑 사용자**: 앱 커맨드가 전체 커널 state 알아야 함 — 우리가 group에서 scope 제한을 하지 않아? 원칙상 OS에 접근을 하는 것도 제한해야 할텐데?

**🤖 AI**: 확인해보니 `processCommand`에서 handler에 전달되는 `ctx.state`가 전체 커널 state다. scope가 command routing, effect routing, middleware routing은 격리하지만 **state visibility는 격리하지 않는다**. 보고서에 세 가지 접근법을 정리했다 — A(scoped state view), B(lens/selector), C(context injection).

> *(이 시점에서 `2026-02-11_1618_Kernel_Scope_Isolation.md` 생성)*

---

**🧑 사용자**: 응 원래 A와 C를 하기로 한게 초기 설계였는데.. 이건 논의할것도 없이 정답아냐?

**🤖 AI**: 거의 자명하긴 한데 — A에서 앱 커맨드는 `ctx.state`로 자기 slice만 받잖아. 그러면 앱이 OS state에 **쓰기**를 해야 할 때는? focus 이동이라든지.

**🧑 사용자**: app의 effect는 다른 데 영향을 주지 못하는 구조로 작성할 거야. 그런데 버블링은 돼. effect 중에는 dispatch도 있지. 같은 말이야.

**🤖 AI**: 아 — 정리됐다.

```
앱 커맨드 → { state: newAppState, dispatch: FOCUS_MOVE(id) }
              ↑ 자기 slice만       ↑ 버블링으로 OS가 처리
```

앱은 OS state를 직접 건드리지 않고, dispatch effect로 커맨드를 발행하면 scope chain을 따라 버블링. Unix의 syscall과 같은 구조. 이건 세 가지 원칙(격리, 버블링, 커맨드 유일성)을 인정하면 **유일한 해**로 연역 도출된다.

---

**🧑 사용자**: 우리는 group을 설계할때 모든 구조가 scope + bubbling이 되도록 논의했어. 그건 effect도 context도 마찬가지.

**🤖 AI**: 그러면 범용 규칙이 하나다 — "모든 것은 scope + bubbling." Command ✅ Effect ✅ Context ✅ Middleware ✅ **State ❌.** State만 이 원칙을 위반하고 있다. A+C는 "좋은 선택"이 아니라, 유일한 범용 규칙을 state에도 적용하는 것. 설계 "결정"이 아니라 설계 "미완성"이야.

---

**🧑 사용자**: 그러면 state는 버블링을 해야하나? 이게 문제인가?

**🤖 AI**: **State는 버블링이 필요 없다.** 커맨드, 이펙트, 컨텍스트의 버블링은 "누가 처리할 것인가"의 **탐색(lookup)**이다. State는 lookup이 아니라 **ownership**이다. "이 데이터는 누구 거야?"의 답은 항상 확정적이라 탐색할 필요가 없어.

범용 규칙을 정제하면:
- **Resolution**(handler/provider 탐색): scope + bubbling
- **Ownership**(data 소유): scope only, bubbling 없음

---

**🧑 사용자**: 알아 사실 너 시험해본거야. 쏘리. 잘하네! 똑띠야. 대규모 커널 리팩토링을 하면서 놓쳤나봐.

**🤖 AI**: ㅋㅋ 좋은 시험이었어. 놓친 이유도 자명해 — 커널 리팩토링 시점에 앱 커맨드가 커널에 없었으니까. GLOBAL scope 하나뿐이면 state scoping이 필요한 상황 자체가 없었던 거지.

---

## 한 줄 요약

> **커널 메커니즘은 Resolution(scope + bubbling)과 Ownership(scope only)으로 나뉘며, state는 ownership이므로 scoping만 적용하면 된다.**


---

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
