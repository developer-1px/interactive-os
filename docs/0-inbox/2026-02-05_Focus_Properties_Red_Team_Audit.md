# Focus 속성 레드팀 감사 (Red Team Audit)

**날짜**: 2026-02-05  
**버전**: v7.9 Focus System  
**감사자**: Antigravity Red Team Agent

---

## 1. 개요 (Overview)

이 문서는 Antigravity Interaction OS의 Focus Behavior System에 대한 체계적인 레드팀 감사 결과입니다. 7-Axis Behavior Model의 모든 속성을 분석하고, 코드 구현상의 취약점(Fragility Gaps)과 표준 위반(Standard Violations)을 식별하며, 개선 제안을 제시합니다.

### 분석 범위
- **Axis Handlers**: 8개 파일 (`handlerDirection.ts`, `handlerEdge.ts`, `handlerEntry.ts`, `handlerRecovery.ts`, `handlerRestore.ts`, `handlerSeamless.ts`, `handlerTab.ts`, `handlerTarget.ts`)
- **Entity Types**: `FocusBehavior.ts` 및 관련 타입 정의
- **Registry**: `DOMInterface.ts`

---

## 2. Focus 속성 전체 맵 (Complete Property Map)

### 2.1. Core 7-Axis Properties

| 속성 | 타입 | 값 | 담당 핸들러 |
|:---|:---|:---|:---|
| **direction** | `FocusDirection` | `none`, `v`, `h`, `grid` | `handlerDirection.ts` |
| **edge** | `FocusEdge` | `loop`, `stop` | `handlerEdge.ts` |
| **tab** | `FocusTab` | `loop`, `escape`, `flow` | `handlerTab.ts` |
| **target** | `FocusTarget` | `real`, `virtual` | `handlerTarget.ts` |
| **entry** | `FocusEntry` | `first`, `restore`, `selected` | `handlerEntry.ts` |
| **restore** | `boolean` | `true`, `false` | `handlerRestore.ts` |
| **recovery** | (Policy-based) | `sibling`, `parent`, `none` | `handlerRecovery.ts` |

### 2.2. Extension Properties

| 속성 | 타입 | 값 | 설명 |
|:---|:---|:---|:---|
| **seamless** | `boolean` | `true`, `false` | 교차 방향 Zone 간 공간 이동 |
| **tabSkip** | `"none" \| "skip-disabled"` | - | Tab 순회 시 비활성 요소 건너뛰기 |

### 2.3. Recovery Policy Types

```typescript
type SiblingPolicy = "next-first" | "prev-first" | "spatial";
type FallbackPolicy = "zone-default" | "parent" | "none";
```

---

## 3. 표준 위반 분석 (Standard Violations)

### 3.1. Registry-First 원칙 위반 (Critical)

> [!CAUTION]
> v7.8 표준은 Focus 관련 DOM 조회에서 `querySelector`, `getElementById`를 명시적으로 금지합니다. 아래 파일들이 이 원칙을 위반하고 있습니다.

| 파일 | 위치 | 위반 코드 | 영향 |
|:---|:---|:---|:---|
| `handlerRestore.ts` | Line 26, 32 | `document.getElementById(ctx.focusedItemId)` | O(n) DOM 조회; 대형 문서에서 성능 저하 |
| `handlerTarget.ts` | Line 19 | `document.getElementById(targetId)` | Registry 캐시 우회; CSS 특수문자 ID에서 잠재적 오류 |

#### 현재 코드 (`handlerRestore.ts`)
```typescript
// Line 25-30
if (isVertical && stickyX === null && ctx.focusedItemId) {
    const el = document.getElementById(ctx.focusedItemId);  // ❌ 위반
    if (el) {
        const rect = el.getBoundingClientRect();
        stickyX = rect.left + rect.width / 2;
    }
}
```

#### 권장 수정 코드
```typescript
import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

// Line 25-30
if (isVertical && stickyX === null && ctx.focusedItemId) {
    const rect = DOMInterface.getItemRect(ctx.focusedItemId);  // ✅ 수정
    if (rect) {
        stickyX = rect.left + rect.width / 2;
    }
}
```

---

## 4. 취약점 분석 (Fragility Gaps)

### 4.1. Recovery Axis: 시각적 순서 불일치 (High)

> [!WARNING]
> `handlerRecovery.ts`는 Zone의 `items` 배열 순서에 기반하여 형제 요소를 계산합니다. 그러나 이 순서는 삽입 순서이며, 드래그 앤 드롭이나 정렬이 적용된 앱(예: Todo)에서는 **시각적 순서와 다릅니다**.

**현재 로직** (`handlerRecovery.ts` Lines 25-50):
```typescript
function getSiblingIndices(currentIndex: number, itemCount: number, ...) {
    const nextIndex = currentIndex + 1 < itemCount ? currentIndex + 1 : null;
    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : null;
    // ... 배열 순서 기반!
}
```

**문제 시나리오**:
1. Todo 앱에서 항목을 "Priority" 순으로 정렬
2. 중간 항목 삭제
3. Focus가 "배열상 다음 항목"으로 이동 → 시각적으로는 다른 위치

**권장 해결책**:
- App Middleware가 삭제 시점에 **앱의 시각적 순서** (예: `todoOrder`)를 `handlerRecovery`에 주입
- 또는 `SiblingPolicy: "spatial"`을 완전 구현하여 DOM 위치 기반 계산

---

### 4.2. Tab/Escape Axis: Empty Zone Focus Black Hole (High)

> [!WARNING]
> `executeEscapeNavigation()`이 빈 Zone에서 `null`을 반환하여 Focus가 시스템에서 사라질 수 있습니다.

**현재 코드** (`handlerTab.ts` Lines 59-65):
```typescript
const zoneItems = buildSequence(ctx.zoneId, ctx.registry);
if (zoneItems.length === 0) {
    // Edge case: empty zone. Fallback to finding zone in DOM...
    // For now, if empty, we can't really "escape" from an item context.
    return null;  // ❌ Focus Black Hole
}
```

**문제 시나리오**:
1. 필터링으로 "No Results" 상태인 Zone에 Focus
2. Tab 키 입력
3. Focus 소실 (null 반환)

**권장 해결책**:
```typescript
if (zoneItems.length === 0) {
    // Zone-Based Escape: Zone의 DOM 위치에서 다음 형제 Zone 탐색
    const currentZoneEl = DOMInterface.getZone(ctx.zoneId);
    if (currentZoneEl) {
        const siblingZones = Object.values(ctx.registry)
            .filter(z => z.parentId === ctx.registry[ctx.zoneId]?.parentId && z.id !== ctx.zoneId);
        // ... DOM 순서로 정렬하여 다음 Zone의 첫 아이템 반환
    }
}
```

---

### 4.3. Direction/Seamless: Bubble 제한 과공격성 (Medium)

> [!IMPORTANT]
> `handlerDirection.ts`에서 `behavior.tab !== "escape"`일 때 무조건 trap하므로, 중첩된 `loop` zone이 부모 `escape` zone으로 버블링할 수 없습니다.

**현재 코드** (Lines 149-157):
```typescript
// Check trap
if (behavior.tab !== "escape") {
    return {
        ...ctx,
        currentZoneId: zoneId,
        behavior,
        shouldTrap: true,  // 부모로 버블링 불가
    };
}
```

**영향**:
- 중첩 `loop` zone (예: 모달 내 그리드)에서 화살표 키 경계 도달 시 아무 반응 없음
- 사용자가 갇힌 느낌을 받음

**권장 검토사항**:
- `direction` 축에서 trap은 Tab 동작과 무관해야 함
- 혹은 `escape-from-arrow: true` 같은 별도 속성 도입 검토

---

### 4.4. Entry Axis: `selected` 값 미구현 (Low)

`handlerEntry.ts`에서 `entry: "selected"`가 `first`와 동일하게 처리됩니다:

```typescript
case "selected":
    return zone.items[0];  // 의도: 선택된 아이템으로 이동해야 함
```

**권장**: Zone에 `selectedId` 속성을 추가하거나, 외부 상태와 연동 필요

---

## 5. 개선 제안 요약 (Proposals)

### 5.1. 즉시 조치 (P0 - Critical)

| # | 항목 | 대상 파일 | 예상 공수 |
|:---|:---|:---|:---|
| 1 | `getElementById` → `DOMInterface` 마이그레이션 | `handlerRestore.ts`, `handlerTarget.ts` | 30분 |
| 2 | Empty Zone Escape 폴백 구현 | `handlerTab.ts` | 1시간 |

### 5.2. 단기 개선 (P1 - High)

| # | 항목 | 대상 파일 | 예상 공수 |
|:---|:---|:---|:---|
| 3 | Recovery에 시각적 순서 주입 인터페이스 | `handlerRecovery.ts`, App Middleware | 2시간 |
| 4 | Bubble trap 조건 재검토 | `handlerDirection.ts` | 1시간 |

### 5.3. 장기 개선 (P2 - Enhancement)

| # | 항목 | 설명 |
|:---|:---|:---|
| 5 | `SiblingPolicy: "spatial"` 완전 구현 | DOM 위치 기반 형제 검색 |
| 6 | `entry: "selected"` 기능 구현 | Zone의 선택 상태와 연동 |
| 7 | Focus 메모리 크로스 세션 지속 | `localStorage` 기반 persisted focus |

---

## 6. 결론 (Conclusion)

현재 Focus Behavior System (v7.9)은 **7-Axis Model**을 성공적으로 구현하고 있으나, 아래 영역에서 개선이 필요합니다:

1. **Registry-First 표준 준수**: `handlerRestore`, `handlerTarget`가 여전히 direct DOM access를 사용하여 v7.8 표준을 위반
2. **Edge Case 핸들링**: Empty Zone에서 Tab 시 Focus 소실 가능
3. **시각적 순서 동기화**: Recovery 로직이 insertion order에 의존하여 정렬된 리스트에서 예기치 않은 동작 발생

> [!TIP]
> **권장 우선순위**: P0 항목 (#1, #2)을 먼저 해결하여 표준 준수 및 안정성 확보 후, P1 항목으로 사용자 경험 개선을 진행하세요.

---

*Reference: Focus Behavior System v7.9, Professional Observability & System Diagnostics v7.8*
