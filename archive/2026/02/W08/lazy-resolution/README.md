# lazy-resolution

- Feature Name: `lazy-resolution`
- Start Date: 2026-02-21

## Summary

OS의 Focus/Selection 복구 전략을 **Write-time Recovery**에서 **Read-time Lazy Resolution**으로 전환한다. 원본 ID를 절대 덮어쓰지 않고 보존하며, 읽을 때 현재 아이템 리스트에서 resolve하여 없으면 인접(next > prev) 아이템으로 해석한다.

## Motivation

### 현재 문제

Write-time recovery는 아이템 삭제/이동 시 즉시 `focusedItemId`를 교체한다 (`OS_FOCUS` + `OS_SELECTION_CLEAR`). 이로 인해 원본 ID가 **영구적으로 파괴**되어, undo/redo 시 포커스/셀렉션이 원래 자리로 돌아가지 못한다.

Inspector 증거 (2026-02-21):
```
1. focus = card-5, selection = [card-3, card-4, card-5]
2. Cut → OS_FOCUS(card-6) → 원본 ID 소멸
3. Undo → cards 3,4,5 부활
4. focus = card-6 그대로 ❌ (원본은 이미 잊혀짐)
```

### 현재 개체 수

- `recoveryTargetId` (상태 필드)
- `OS_RECOVER` (커맨드)
- 삭제 후 OS_FOCUS 호출 (앱/collection 로직)
- 삭제 후 OS_SELECTION_CLEAR 호출 (앱/collection 로직)

→ **4개의 독립적 복구 메커니즘**

### 제안의 핵심 가치

1. **개체 1개로 축소**: 해석 함수 하나 (`resolveId`)
2. **Zero-cost undo restoration**: 원본 ID 보존 → undo 시 자동 복귀
3. **앱 투명성**: OS가 투명하게 처리, 앱은 해석을 모른다

## Guide-Level Explanation

### Before (Write-time Recovery)
```
삭제 → recoveryTargetId 계산 → OS_RECOVER 실행 → focusedItemId 교체
Undo → 아이템 부활, 하지만 focus는 이미 교체됨 ❌
```

### After (Read-time Lazy Resolution)
```
삭제 → (아무것도 안 함, 원본 ID 보존)
Focus 읽기 → 있으면 반환, 없으면 인접(next > prev) 반환
Undo → 아이템 부활 → Focus 읽기 → 원본 ID 있음! → 자동 복귀 ✅
```

### 규칙

1. **Focus ID는 절대 외부에서 덮어쓰지 않는다** — OS_NAVIGATE, OS_FOCUS (사용자 의도)만 변경
2. **읽을 때 해석한다** — `resolveId(storedId, currentItems)` → 있으면 그대로, 없으면 next > prev
3. **앱은 해석된 값만 받는다** — 투명 프록시, 원본 vs 해석을 구분할 필요 없음

### 적용 범위

| 관심사 | 저장 | 읽을 때 해석 |
|--------|------|------------|
| Focus | `focusedItemId = "B"` | B 있으면 B, 없으면 next > prev |
| Selection | `selection = [A, B, C]` | 각각 존재 여부로 필터 |
| Undo/Redo | 스냅샷 복원 → focusedItemId 유지 | 동일 규칙으로 자동 해석 |

## Reference-Level Explanation

### `resolveId(storedId, items): string | null`

```typescript
function resolveId(storedId: string | null, items: string[]): string | null {
  if (!storedId) return items[0] ?? null;
  const idx = items.indexOf(storedId);
  if (idx !== -1) return storedId;          // 존재 → 그대로
  // 삭제됨 → 최근접 탐색 (원래 위치 기준은 불가, items 순서 기반)
  // Fallback: items의 첫 번째 아이템
  return items[0] ?? null;
}
```

> ⚠️ "인접(next > prev)"의 정확한 의미는 구현 시 정의 필요 — 삭제 전 인덱스를 기억할 것인지, 현재 리스트 기준인지.

### 제거 대상

- `ZoneState.recoveryTargetId` — 상태 필드 제거
- `OS_RECOVER` 커맨드 — 제거
- Collection의 삭제 후 `OS_FOCUS` / `OS_SELECTION_CLEAR` 호출 — 제거
- `focus/recover.ts` — 제거

### 변경 대상

- `os.useComputed` 또는 `useFocusedItem` — 반환 전 resolve 삽입
- `OS_NAVIGATE` — `recoveryTargetId` 계산 로직 제거

## Drawbacks

- "인접" 계산을 위해 삭제 전 위치(인덱스)를 기억해야 할 수 있음
- 매 읽기마다 resolve 비용 (items.indexOf) — 작지만 존재

## Unresolved Questions

- `resolveId`에서 "next > prev" 순서의 정확한 의미 — 삭제 전 인덱스를 `lastKnownIndex`로 저장?
- Selection의 lazy filter가 빈 배열을 반환하면 selectionAnchor는?

## Prior Art

- Git detached HEAD → rebase 후 nearest commit 해석
- DB soft delete + JOIN fallback
- React Suspense의 stale-while-revalidate 패턴
