# OS 레벨 포커스 유실 감지: DOM 기반 Safety Net 전략

## 1. 개요

이전 4세대의 OS 복구가 모두 실패한 이유는 **React lifecycle에 의존**했기 때문이다. 하지만 OS는 React 없이도 포커스 유실을 감지할 수 있다:

```
OS가 이미 알고 있는 것:
✅ Store의 focusedItemId (현재 포커스 대상)
✅ Store의 activeZoneId (현재 활성 Zone)
✅ document.activeElement (실제 브라우저 포커스)
✅ DOM.getGroupItems(zoneId) (Zone 내 현재 존재하는 아이템들)
```

---

## 2. 분석: 왜 이번엔 다른가?

### 이전 실패 vs. 새 접근

| | 이전 4세대 | 새 접근 (DOM 감지) |
|---|---|---|
| **의존** | React lifecycle (useEffect, ref) | `document.activeElement` |
| **트리거** | 컴포넌트 unmount / ref null | **렌더 완료 후** DOM 검사 |
| **오발동** | React 리렌더 시 false positive | ❌ 없음 |
| **Cross-zone** | 조건부 렌더링 해제 시 오발동 | `activeZoneId`로 scope 제한 |

### 핵심 차이: "예측"이 아니라 "관찰"

```
이전: "아이템이 곧 사라질 예정이니 미리 복구하자" → 예측적 실패
새로: "아이템이 이미 사라졌고, 브라우저 포커스가 body로 떨어졌다" → 사실 기반
```

---

## 3. 현재 코드 분석

### FocusSync가 이미 감지하고 있다 (하지만 아무것도 안 함)

```typescript
// FocusSync.tsx (현재 코드, line 81-96)
useEffect(() => {
    if (!focusedItemId) return;
    if (focusedItemId === lastFocusedRef.current) return;

    const targetEl = DOM.getItem(focusedItemId);
    const currentActive = document.activeElement;  // ← 이미 체크하고 있다!

    // Stale focus detection: if element doesn't exist
    if (!targetEl) {
        // ⚠️ 여기서 "Skip projection"만 하고 Recovery는 안 한다!
        lastFocusedRef.current = focusedItemId;
        return;  // ← 그냥 포기
    }
    // ...
}, [focusedItemId, zoneId]);
```

**`targetEl`이 null인 것** = focusedItemId에 해당하는 DOM 요소가 사라졌다는 뜻.
**이 시점에 Recovery를 수행하면 된다.**

---

## 4. Recovery 전략: 3가지 시그널

OS가 "포커스 유실"을 확정할 수 있는 조건:

```typescript
const isLost =
    focusedItemId !== null &&                           // Store에 포커스가 있는데
    DOM.getItem(focusedItemId) === null &&               // DOM에서 사라졌고
    (document.activeElement === document.body ||          // 브라우저 포커스가 body에 있다
     !DOM.getGroup(zoneId)?.contains(document.activeElement)); // 또는 Zone 밖에 있다
```

3가지 시그널이 **동시에 참일 때만** Recovery 수행 → false positive 완전 차단.

### 왜 `document.activeElement` 체크가 중요한가?

| 시나리오 | focusedItemId | DOM.getItem | activeElement | 판정 |
|---------|:---:|:---:|:---:|:---:|
| 정상 포커스 | `"123"` | ✅ 존재 | `#123` | 정상 |
| 삭제 → body 추락 | `"123"` | ❌ null | `<body>` | **유실! → 복구** |
| Zone 전환 (정상) | `"123"` | ❌ null | `#456` (새 Zone) | **정상 전환** (복구 안 함) |
| React 리렌더 | `"123"` | ✅ 존재 | `#123` | 정상 |
| 앱이 이미 복구함 | `"456"` | ✅ 존재 | `#456` | 정상 |

> [!IMPORTANT]
> **Zone 전환**: `activeElement`가 다른 Zone의 아이템이면, 이것은 정상적인 Zone 전환이지 유실이 아니다. 이전 3세대가 실패한 부분이 여기다 — `document.activeElement`를 체크하지 않고 `removeItem`만 들었기 때문에 Zone 전환과 삭제를 구분 못했다.

---

## 5. 구현 제안

### FocusSync에 Recovery 추가 (최소 변경)

```typescript
// FocusSync.tsx - ActiveZoneProjector
useEffect(() => {
    if (!focusedItemId) return;
    if (focusedItemId === lastFocusedRef.current) return;

    const targetEl = DOM.getItem(focusedItemId);

    if (!targetEl) {
        // === NEW: OS-Level Recovery ===
        const activeEl = document.activeElement;
        const groupEl = DOM.getGroup(zoneId);
        
        // 포커스가 body로 떨어졌거나 Zone 밖에 있는 경우만 복구
        if (activeEl === document.body || 
            (groupEl && !groupEl.contains(activeEl))) {
            
            const items = DOM.getGroupItems(zoneId);
            if (items.length > 0) {
                // resolveRecovery 사용: 가장 가까운 아이템으로 복구
                const recovery = resolveRecovery(
                    focusedItemId, focusedItemId, 
                    items,   // 현재 DOM에 있는 아이템들 (삭제된 건 이미 없음)
                    'nearest'
                );
                
                // Recovery가 실패해도 items의 첫 번째 아이템으로 fallback
                const recoveryId = recovery.targetId ?? items[0];
                store.setState({ focusedItemId: recoveryId });
                // 다음 렌더에서 FocusSync가 자동으로 focus() 호출
            }
        }
        
        lastFocusedRef.current = focusedItemId;
        return;
    }
    // ... 기존 코드 ...
}, [focusedItemId, zoneId]);
```

### 타이밍 이슈

```
[앱의 DeleteTodo] → state 업데이트 → React 렌더
    ↓
[아이템 DOM에서 제거] → document.activeElement = body
    ↓
[효과 1] navigationMiddleware → FOCUS_ID effect → store 업데이트
    ↓
[효과 2] FocusSync useEffect → focusedItemId 변경 감지
    ↓
    ├─ 앱이 복구한 경우: focusedItemId가 이미 새 대상 → DOM에 존재 → 정상 projection
    └─ 앱이 복구 안 한 경우: focusedItemId가 삭제된 아이템 → DOM에 없음 → Recovery!
```

> [!WARNING]
> **타이밍 주의**: `resolveRecovery`에 넘기는 `items`는 삭제된 아이템이 빠진 **현재 DOM** 기준이다. 삭제된 아이템의 원래 인덱스를 모르므로, `removedId`와 현재 items 목록 사이의 관계만으로 "가장 가까운" 아이템을 추정해야 한다. 이 부분은 `resolveRecovery` 함수 수정이 필요할 수 있다.

---

## 6. 결론

### OS가 감지할 수 있는가? → **예, 확실히 가능하다.**

3가지 시그널의 교차 검증으로 false positive 없이 포커스 유실을 감지할 수 있다:

1. `focusedItemId`가 Store에 존재 (OS가 포커스를 추적 중)
2. `DOM.getItem(focusedItemId)`가 null (해당 요소가 DOM에서 사라짐)
3. `document.activeElement`가 body 또는 Zone 밖 (브라우저도 포커스를 잃음)

### 이전 실패와의 본질적 차이

| 관점 | 이전 | 새 접근 |
|------|------|--------|
| 철학 | **예측** ("곧 사라질 것이다") | **관찰** ("이미 사라졌다") |
| 소스 | React lifecycle | DOM API |
| 시점 | unmount 중 (불안정) | 렌더 완료 후 (안정) |
| 범위 | 개별 아이템 | Zone 전체 |

---
*OS-Level Focus Loss Detection Analysis (2026-02-07)*
