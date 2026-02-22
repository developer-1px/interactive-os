# Blueprint: Focus Recovery as Derived Effect

## 1. Goal

**포커스 복구가 오버레이 합성(overlay composition)에서 깨지지 않아야 한다.**

UDE (Undesirable Effects):
- 단순 삭제(`collection.remove`)에서 포커스 복구 ✅ → 다이얼로그를 추가하면 ❌
- `confirmDeleteTodo`가 4개 OS 커맨드를 명시적으로 오케스트레이션해야 한다
- 중간 단계가 추가되면(중첩 다이얼로그, API 호출 등) 오케스트레이션 복잡도 폭발
- 앱이 OS 내부 메커니즘(overlay stack, focus recovery) 순서를 알아야 한다

**Done Criteria**: 앱이 `OS_OVERLAY_CLOSE` 한 줄이면, OS가 포커스를 올바른 위치로 복구한다 — 중간에 아이템이 삭제/이동되었더라도.

## 2. Why

| 원칙 | 위반 |
|------|------|
| Rules #7: Hollywood Principle | 앱이 OS에게 포커스 순서를 지시하고 있다 |
| Rules #1: 엔트로피 감소 | 앱마다 오케스트레이션 코드가 중복/발산 |
| Rules #15: Lazy Resolution | 스택이 저장된 ID를 즉시 해석(write-time)하고 있다 |
| W7 (Discussion 발견) | 포커스 복구는 명시적 커맨드가 아니라 파생 효과여야 한다 |

**근본 원인**: `applyFocusPop`이 저장된 `entry.itemId`를 **무조건 복원**한다. 해당 아이템이 삭제되었는지 확인하지 않는다.

```typescript
// focusStackOps.ts — 현재 구현
if (entry.itemId) {
    zone.focusedItemId = entry.itemId;  // ← "c"가 삭제됐어도 "c"로 복원
    zone.lastFocusedId = entry.itemId;
}
```

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|---|---|---|
| 포커스 스택 pop이 저장된 ID로 복원해야 한다 | ❌ 삭제된 아이템이면 무효 | pop 시점에 resolve |
| 앱이 삭제 후 포커스 대상을 알고 있다 | ⚠️ 알긴 하지만 앱의 책임이 아님 | OS가 zone 정보로 판단 |
| 오버레이 닫기와 포커스 복구는 별개 커맨드다 | ❌ 실제로는 하나의 의도 | CLOSE가 복구를 내포 |
| resolve하려면 OS가 앱의 아이템 목록을 알아야 한다 | ⚠️ 필요하지만, 방법이 여러 가지 | 아래 해법 참조 |

## 4. Ideal

```
사용자: 아이템 "c"에 포커스 → Delete
앱: requestDeleteTodo → OS_OVERLAY_OPEN("dialog")
  → OS가 포커스 스택 push { zoneId: "list", itemId: "c" }
사용자: Confirm 클릭
앱: confirmDeleteTodo →
  return {
    state: produce(draft => { removeFromDraft(draft, "c") }),
    dispatch: [
      OS_OVERLAY_CLOSE({ id: "dialog" }),   // 이것만
      OS_TOAST_SHOW({ ... }),               // 이것만
    ]
  }
  → OS_OVERLAY_CLOSE 실행:
    → 스택 pop: { zoneId: "list", itemId: "c" }
    → resolve("c", list zone) → "c" 없음 → 이웃 "d"로 포커스
    → 자동 완료 ✅
```

**부정적 분기 (Negative Branch)**:
- 중첩 오버레이 3단계 후 삭제 → 각 스택 pop이 독립적으로 resolve → 문제 없음
- 삭제 + 이동이 동시에 → resolve는 "현재 존재하는 아이템" 기준이므로 문제 없음
- 아이템이 0개가 됨 → resolve 결과 null → zone 자체에 포커스 (기존 동작과 동일)

## 5. Inputs

- `src/os/3-commands/focus/focusStackOps.ts` — 현재 push/pop 로직 (62줄)
- `src/os/3-commands/overlay/overlay.ts` — OS_OVERLAY_CLOSE (78줄)
- `src/os/collection/createCollectionZone.ts` — 기존 focus recovery 로직 (remove 내부)
- `src/os/2-contexts/zoneRegistry` — Zone item 정보
- `src/os/state/OSState` — focusStack 구조
- `src/os/3-commands/tests/unit/overlay.test.ts` — 기존 overlay 테스트
- Rules #15 (Lazy Resolution), Rules #7 (Hollywood Principle)
- KI: `focus-single-path` 프로젝트 — 포커스 이중 경로 통합

## 6. Gap

| # | Need | Have | Gap | Impact |
|---|---|---|---|---|
| G1 | pop 시점에 아이템 존재 확인 | `applyFocusPop`이 무조건 복원 | pop 시 validation 없음 | **HIGH** |
| G2 | 삭제된 아이템의 이웃 찾기 | `createCollectionZone.remove`에만 존재 (앱 레벨) | OS 레벨에서 이웃 resolve 방법 없음 | **HIGH** |
| G3 | resolve 로직이 zone 구조(list/grid/tree)를 이해 | zone role은 ZoneRegistry에 있음 | role → resolve 전략 매핑 없음 | **MED** |
| G4 | 앱의 `confirmDeleteTodo` 간소화 | 4-command 오케스트레이션 | 해법 적용 후 리팩토링 필요 | **LOW** |

## 7. 해법 공간 (선택 없이 나열)

---

### 해법 A: `applyFocusPop`에 Lazy Resolve 추가

**핵심**: pop 시점에 저장된 `itemId`가 존재하는지 확인하고, 없으면 이웃을 찾는다.

```
pop({ zoneId: "list", itemId: "c" })
  → DOM에 "c"가 있나? → 있으면 "c"로 복원
  → 없으면 → zone의 아이템 목록에서 이웃 찾기
```

**이웃을 아는 방법**: OS가 zone의 현재 DOM 아이템 목록을 kernel state에서 읽는다 (ZoneRegistry의 `items` 또는 focus state의 `orderedItems`).

| 장점 | 단점 |
|------|------|
| 변경 범위 최소 (`focusStackOps.ts` 한 파일) | OS가 "이웃" 개념을 하드코딩해야 함 |
| 기존 overlay 테스트에 케이스 추가만 | zone 구조(list/grid/tree)에 따른 이웃 정의 차이 |
| `confirmDeleteTodo` 즉시 간소화 가능 | DOM이 아직 업데이트 안 됐으면? (타이밍) |

**G2 해결 방식**: `focusedItemId` → zone items 배열에서 인덱스 찾기 → 다음/이전.

---

### 해법 B: Zone에 `resolveFocus` 계약 추가

**핵심**: Zone이 "포커스 복구 전략"을 선언한다.

```typescript
zone.bind({
  role: "listbox",
  resolveFocus: (targetId, items) => {
    const idx = items.findIndex(i => i.id === targetId);
    if (idx !== -1) return targetId;
    return items[idx] ?? items[idx - 1] ?? null; // neighbor
  },
});
```

**pop 시**: OS가 zone의 `resolveFocus`를 호출하여 실제 타겟을 결정.

| 장점 | 단점 |
|------|------|
| zone 구조별 커스텀 로직 가능 (list vs grid vs tree) | 새 API 표면 추가 (CollectionBindings에 하나 더) |
| 관심사 분리: OS는 "언제", Zone은 "어디로" | 대부분의 zone은 같은 로직 (다음/이전) — 과잉 설계? |
| 앱이 특수한 복구 전략 정의 가능 | Zone.bind에 이미 많은 prop — 하나 더 추가하면 복잡 |

**G3 해결 방식**: Zone이 명시적으로 해결 전략을 제공하므로, OS는 구조를 몰라도 됨.

---

### 해법 C: Focus를 Computed State (Derived Store)로 전환

**핵심**: `focusedItemId`를 직접 저장하는 대신, `desiredFocusId` + `resolve` 함수로 파생.

```
stored: desiredFocusId = "c"
computed: actualFocusId = resolve("c", currentZoneItems)
  → "c" 존재 → "c"
  → "c" 부재 → neighbor of "c"
```

**모든 포커스 읽기가 resolve를 통과.** 오버레이 pop뿐 아니라, 삭제, 이동, 필터 변경 등 모든 상황에서 자동으로 유효한 포커스를 보장.

| 장점 | 단점 |
|------|------|
| 가장 범용적 — 어떤 합성에서든 동작 | 가장 큰 변경 — 모든 focus 읽기 경로 수정 |
| 포커스가 "선언적"이 됨 — 원칙에 완벽 부합 | 성능: 매 렌더마다 resolve 실행? |
| 새로운 합성 시나리오가 추가돼도 자동 대응 | `focus-single-path` 프로젝트와 중복/충돌 가능 |
| Undo/Redo에서도 자동으로 유효한 포커스 보장 | 현재 `focusedItemId`를 직접 읽는 곳이 많음 |

**G1+G2+G3 동시 해결**: resolve 함수 하나가 모든 gap을 커버.

---

### 해법 D: Effect Bag (선언적 커맨드 반환)

**핵심**: 커맨드가 `dispatch: [...]` 배열 대신 구조화된 effect bag을 반환.

```typescript
return {
  state: produce(...),
  effects: {
    overlay: { close: "dialog" },
    toast: { message: "deleted", undo: undoCommand() },
    // focus: 명시 안 함 → OS가 파생
  },
};
```

OS가 effect bag을 읽고 올바른 순서로 실행. 포커스는 다른 effects의 결과로 자동 파생.

| 장점 | 단점 |
|------|------|
| 앱의 선언적 의도 표현이 가장 깔끔 | 커맨드 반환 타입 대규모 리팩토링 |
| 순서 문제 완전 제거 (OS가 topology sort) | 기존 모든 커맨드의 `dispatch` 패턴 변경 |
| 새로운 effect 타입 추가가 용이 | 현재 아키텍처와 편차가 큼 — 별도 프로젝트급 |

**G1 해결 방식**: overlay close effect → focus pop → auto-resolve → 포커스 결정.

---

### 해법 E: 최소 개입 — `applyFocusPop`에 fallback만 추가

**핵심**: pop 후 복원된 `itemId`가 유효하지 않으면, zone의 `lastFocusedId`나 첫 번째 아이템으로 fallback.

```typescript
// focusStackOps.ts 수정
if (entry.itemId) {
    // 현재 zone에 해당 아이템이 실제로 있는지 확인
    const zoneItems = draft.os.focus.zones[entry.zoneId]?.orderedItemIds ?? [];
    if (zoneItems.includes(entry.itemId)) {
        zone.focusedItemId = entry.itemId;
    } else {
        // Fallback: 저장된 위치 근처의 아이템
        zone.focusedItemId = zoneItems[0] ?? null;
    }
}
```

| 장점 | 단점 |
|------|------|
| 변경 3줄 미만 — 가장 작은 변경 | "이웃"이 아니라 "첫 번째"로 가는 건 UX 열화 |
| 즉시 적용 가능, 위험 최소 | 근본 해결이 아님 — 다음 합성 시나리오에서 또 부족 |
| 기존 테스트 영향 없음 | G2(이웃 찾기)를 해결하지 않음 |

---

### 축 정리: 해법들의 직교 차원

| 차원 | 선택지 |
|------|--------|
| **무엇을 저장하나** | 구체 ID (현재, A, B, E) vs 의도/desired (C) |
| **언제 해석하나** | pop 시점 (A, B, E) vs 항상/읽을 때 (C) |
| **이웃을 누가 아나** | OS 하드코딩 (A, E) vs Zone 계약 (B) vs 범용 resolve (C) |
| **앱이 어떻게 표현하나** | dispatch 배열 (현재, A, B, C, E) vs effect bag (D) |

이 4개 축에서 각각 하나씩 선택하면 실제 구현이 결정됩니다.

---

*이 문서는 해법 공간의 탐색이며, 선택을 포함하지 않습니다.*
