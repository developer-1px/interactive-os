# 🔴 Red Team Audit: `popAndRestoreFocus()`

**대상**: [focusData.ts L279-308](file:///Users/user/Desktop/interactive-os/src/os/features/focus/lib/focusData.ts#L279-L308)

---

## 1. Magic Number setTimeout(50ms) — 가장 위험한 가정

```ts
setTimeout(() => { ... }, 50);
```

**공격**: 50ms는 어떤 보장도 없다.
- React 18 concurrent mode에서 unmount는 50ms 안에 완료되지 않을 수 있음
- 느린 기기(모바일)에서는 React commit phase가 밀림
- **반대로 빠른 기기**에서는 50ms가 너무 길어서 RECOVER가 이미 다른 zone을 activate한 후 또 덮어쓰는 race condition

**증거**: 지금 E2E 테스트가 실패하는 핵심 원인이 바로 이것. setTimeout은 브라우저 task queue에 들어가고, 그 사이 MutationObserver(microtask)가 먼저 실행되어 RECOVER가 먼저 발동됨.

```
Timeline:
  t=0    popAndRestoreFocus() 호출, setTimeout 등록
  t=1    React unmount (modal DOM 제거)
  t=2    MutationObserver 콜백 → RECOVER dispatch
  t=50   setTimeout 콜백 → FOCUS dispatch
         → 하지만 RECOVER가 이미 activeZoneId를 건드림
```

**판정**: 🔴 **Critical**. 시간 기반 동기화는 본질적으로 불안정.

---

## 2. 동적 import의 이중 비동기 — 50ms + Promise

```ts
setTimeout(() => {
  Promise.all([
    import("@/os-new/3-commands/focus"),
    import("@/os-new/kernel"),
  ]).then(([{ FOCUS }, { kernel }]) => {
    kernel.dispatch(...);
  });
}, 50);
```

**공격**: 실제 dispatch 시점은 `50ms + import 해결 시간`이다.
- 첫 호출 시 모듈이 아직 로딩 안 됐으면 네트워크 지연까지 추가
- Vite dev server는 빠르지만, production build에서 chunk splitting되면 100ms+ 가능
- **return true는 거짓말이다** — dispatch 성공을 보장하지 않으면서 true 반환

```ts
return true;  // ← 디스패치는 아직 시작도 안 함
```

**판정**: 🔴 **Critical**. 호출자에게 잘못된 성공 신호.

---

## 3. Kernel → FocusData 동기화 체인의 단일 실패점

FOCUS dispatch 후 `aria-current` 설정까지의 경로:

```
kernel.dispatch(FOCUS)
  → kernel state 변경 (activeZoneId = "fs-base")
  → kernel.subscribe() 콜백 실행
  → FocusData.setActiveZone("fs-base")
  → FocusItem 리렌더 (useSyncExternalStore)
  → aria-current = visualFocused
```

**공격**: [FocusGroup.tsx L263-298](file:///Users/user/Desktop/interactive-os/src/os-new/primitives/FocusGroup.tsx#L263-L298)의 `kernel.subscribe()` 콜백은 **각 FocusGroup 인스턴스마다** 등록된다. 모달 FocusGroup이 unmount되면 해당 subscriber cleanup이 실행됨. 하지만 **base FocusGroup의 subscriber는 살아있어야 함**.

문제: subscriber 콜백의 line 266-267:
```ts
const zone = kState.os.focus.zones[groupId];
if (!zone) return;  // ☠️ 이 early return이 activeZoneId sync를 막을 수 있음
```

만약 base zone의 `zones[groupId]`가 kernel state에 등록되지 않은 상태라면 (FocusGroup mount 시 `ensureZone`이 호출되지만 kernel state에 반드시 존재한다는 보장이 없음), **line 294-296의 activeZoneId sync도 실행 안 됨**.

**판정**: 🟡 **High**. 방어적 early return이 핵심 sync 로직까지 차단.

---

## 4. FocusData.setActiveZone의 Guard

```ts
setActiveZone(zoneId: string | null): void {
  if (activeZoneId !== zoneId) {
    if (!activeZoneGuard.check()) return;  // FrequencyGuard: 50/frame
    ...
  }
}
```

**공격**: 모달 open → close 사이클에서 `setActiveZone`이 여러 번 호출됨:
1. 모달 open → setActiveZone("fs-modal1")
2. 모달 close → RECOVER 등으로 인한 잡음
3. FOCUS restore → setActiveZone("fs-base")

단일 프레임에서 50회를 초과할 가능성은 낮지만, **guard가 차단하면 에러 없이 silent fail**한다.

**판정**: 🟢 **Low** (단, 중첩 모달 3+ 레벨에서는 위험 상승)

---

## 5. `entry.itemId` 신뢰성 — Stale Capture

```ts
pushFocusStack(): void {
  const currentItemId = currentData?.store.getState().focusedItemId ?? null;
  // ...
  focusStack.push({ zoneId, itemId: currentItemId });
}
```

**공격**: push 시점에 캡처된 `itemId`가 restore 시점에 DOM에 존재하지 않을 수 있음.
- 리스트가 dynamic이면 항목 삭제/재정렬 가능
- 모달이 열려있는 동안 base zone의 데이터가 변경될 수 있음

현재 코드에서 `entry.itemId`가 있으면 DOM 존재 여부 확인 없이 그대로 dispatch:
```ts
const targetItemId = entry.itemId
  ? entry.itemId                    // ← DOM 검증 없음!
  : (() => { /* fallback */ })();
```

**판정**: 🟡 **Medium**. 동적 콘텐츠에서 ghost element 포커스 시도.

---

## 6. 반환값 `true`의 의미 부정확

```ts
popAndRestoreFocus(): boolean {
  const entry = this.popFocusStack();
  if (!entry || !entry.zoneId) return false;
  setTimeout(() => { ... }, 50);
  return true;  // "복원 성공"이 아니라 "시도 예약됨"
```

**공격**: 호출자가 `true`를 받고 다음 로직을 진행하지만, 실제 포커스 복원은 50ms+ 이후. 호출자가 포커스 복원 완료에 의존하는 로직을 짜면 깨짐.

**판정**: 🟡 **Medium**. API 계약 위반.

---

## 총평

| # | 취약점 | 심각도 | 현재 영향 |
|---|--------|--------|-----------|
| 1 | Magic setTimeout(50ms) race condition | 🔴 Critical | **E2E 실패 원인** |
| 2 | 이중 비동기 (setTimeout + dynamic import) | 🔴 Critical | 복원 시점 예측 불가 |
| 3 | Early return이 activeZoneId sync 차단 | 🟡 High | E2E 실패 기여 의심 |
| 4 | FrequencyGuard silent fail | 🟢 Low | 현재 미발현 |
| 5 | Stale itemId (DOM 미검증) | 🟡 Medium | 동적 리스트에서 발현 |
| 6 | 반환값 계약 불명확 | 🟡 Medium | 호출자 혼동 |

### 근본 해결 방향

**setTimeout을 없애야 한다.** 시간 기반 동기화는 틀린 추상화. 대안:

1. **이벤트 기반**: 모달 FocusGroup unmount 시 자동으로 focus stack pop + restore를 kernel command로 처리 (cleanup effect에서)
2. **동기 dispatch**: `popAndRestoreFocus`에서 kernel을 직접 import하고 (dynamic import 없이), `FocusData.setActiveZone`을 동기적으로 호출
3. **React 스케줄링 활용**: `flushSync` 또는 `queueMicrotask`로 unmount 보장 후 동기 실행
