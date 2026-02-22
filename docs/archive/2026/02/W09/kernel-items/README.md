# RFC: Kernel Items — Zone Item Registry in Kernel State

- Start Date: 2026-02-22
- Project: kernel-items
- Scale: Heavy

## Summary

`DOM_ITEMS` context provider를 DOM `querySelectorAll` 기반에서 kernel state 기반으로 전환한다. Zone이 자기 자식 아이템 목록을 kernel state에서 알게 되어, stale focus 자동 감지/복구, headless 완성, 앱의 수동 포커스 오케스트레이션 제거가 가능해진다.

## Motivation

### 현재 문제

1. **포커스 복구가 합성에서 깨진다.** `collection.remove`에서는 포커스 복구가 자동이지만, 다이얼로그를 거치면 `confirmDeleteTodo`가 4개 OS 커맨드를 수동 오케스트레이션해야 한다.

2. **Zone이 자식을 모른다.** `applyFocusPop`이 저장된 `itemId`가 여전히 존재하는지 확인할 수 없다. Flutter FocusScopeNode가 동작하는 이유 — 자식 목록을 알기 때문.

3. **DOM_ITEMS가 레거시.** 프로덕션에서 `querySelectorAll("[data-item-id]")`로 DOM을 읽고, headless 테스트에서는 `mockItems`로 우회. headless 원칙에 위반.

4. **stale focus가 범용 문제.** overlay pop뿐 아니라 필터 변경, 서버 갱신, undo 등 모든 상황에서 focusedItemId가 stale해질 수 있다. 시나리오별 복구 코드는 엔트로피 증가.

### 근거 원칙

| 원칙 | 적용 |
|------|------|
| Rules #7 Hollywood Principle | 앱은 의도 선언, OS가 실행 보장 |
| Rules #11 복제본 금지 | kernel state가 single source — DOM은 projection |
| Rules #15 Lazy Resolution | 참조를 읽을 때(pop 시점) 현재 상태에서 해석 |
| Rules #1 Occam's Razor | 하나의 전환으로 4개 문제 해결 |
| Flutter FocusScopeNode | 업계 확립 선례 |
| W3C APG Dialog | trigger 소멸 시 "logical" 복구 — 플랫폼 책임 |

## Guide-level Explanation

### Before (현재)

```
앱 상태 변경 → React 렌더 → DOM 업데이트 → DOM_ITEMS가 querySelectorAll
                                              ↓
                                        OS_NAVIGATE가 inject로 읽음
```

OS는 DOM이 렌더될 때까지 아이템 목록을 모른다. headless에서는 mock으로 우회.

### After (목표)

```
앱이 Zone.bind + items 등록 → kernel state에 아이템 목록 저장
                                 ↓
                           OS_NAVIGATE, applyFocusPop 등이 state에서 읽음
                                 ↓
                           DOM은 DOMRect(기하)만 제공
```

OS는 항상 아이템 목록을 알고 있다. DOM 없이 동작. headless가 완성.

### 사용자 경험 변화

**앱 개발자**:
```typescript
// Before: confirmDeleteTodo — 4-command 오케스트레이션
dispatch: [
  OS_OVERLAY_CLOSE({ id: "dialog" }),
  OS_FOCUS({ zoneId: "list", itemId: neighbor }),
  OS_SELECTION_CLEAR({ zoneId: "list" }),
  OS_TOAST_SHOW({ ... }),
]

// After: 선언만
dispatch: [
  OS_OVERLAY_CLOSE({ id: "dialog" }),  // OS가 stale focus 자동 resolve
  OS_TOAST_SHOW({ ... }),
]
```

**테스트 작성자**:
```typescript
// Before: mock 필요
t.setItems(["a", "b", "c"]);  // 수동 mock 주입

// After: 앱이 등록한 items를 그대로 사용 (or createPage가 자동 동기화)
```

## Detailed Design

→ `prd.md` 참조

## Drawbacks

1. **대규모 전환.** `DOM_ITEMS`를 사용하는 모든 코드 수정 필요.
2. **아이템 등록/해제 타이밍.** React 렌더 사이클과 kernel state 갱신의 동기화 설계 필요.
3. **DOMRect는 여전히 DOM 의존.** geometry 정보는 DOM에서 올 수밖에 없음 — 이건 별개 문제.

## Alternatives

| 대안 | 기각 이유 |
|------|----------|
| applyFocusPop에 DOM 쿼리 추가 | headless 위반 |
| FocusGroup 렌더 시 DOM children 관찰 | headless 위반 (Phase 1 회귀) |
| 시나리오별 수동 복구 유지 | 엔트로피 증가, 확장 불가 |
| Zone에 resolveFocus 계약 추가 | 새 API 표면 추가 — items를 state에 올리면 불필요 |

## Unresolved Questions

1. 아이템 등록의 타이밍과 메커니즘 — component mount 시점 vs app state 파생?
2. `DOM_RECTS`도 kernel state로 올릴 수 있는가? (아마 아님 — geometry는 DOM 고유)
3. 기존 `createOsPage.setItems()` mock 패턴을 어떻게 전환하는가?
4. `DOM_EXPANDABLE_ITEMS`, `DOM_TREE_LEVELS` 등 다른 DOM context도 함께 전환?
