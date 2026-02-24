# /divide Report — T19-4: Mouse Edit Continuation

## Iteration Log

| # | Node | Before | After | Cynefin Cycle | Action |
|---|------|--------|-------|---------------|--------|
| 1 | T19-4: editing 중 클릭 동작 | Complex | → 2 children | PSR | MECE split by **event phase** (mousedown vs click) |
| 2 | WP1: editing 중 클릭 시 OS_ACTIVATE 발행 | Complicated | Clear | SAR | `resolveClick`에 `wasEditing` 입력 추가. `headless.ts:230` 패턴으로 preMousedown editingItemId 읽기 |
| 3 | WP2: onAction(drillDown) item vs non-item | Complicated | Clear | SAR | item level → `OS_FIELD_START_EDIT` (A→B 원자전환). non-item → `OS_FOCUS(child)` + blur→commit |
| 4 | 전체 검증 | Clear | Clear (verified) | Verify | `OS_FOCUS`는 editingItemId 미변경. 브라우저 blur event가 commit 트리거. headless는 별도 처리 필요 |

## Issue Tree (Final)

```
T19-4: Mouse Edit Continuation
├── WP1: resolveClick에 wasEditing 조건 추가              [Clear]
│   ├── ClickInput에 wasEditing: boolean 추가
│   ├── resolveClick: wasEditing && clickedItemId ≠ focusedItemId → OS_ACTIVATE
│   └── simulateClick: preMousedown editingItemId 읽어 전달
│
└── WP2: onAction(drillDown) 결과에 의한 상태 전이          [Clear]
    ├── item 클릭 → drillDown → OS_FIELD_START_EDIT → 원자전환 A→B   [기존 동작]
    └── non-item 클릭 → drillDown → OS_FOCUS(child)                  [기존 동작]
        └── editingItemId 정리: 브라우저 blur event → OS_FIELD_COMMIT
```

| Leaf Node (Work Package) | Hypothesis Statement | Evidence (code location) |
|--------------------------|---------------------|------------------------|
| WP1-a: `ClickInput` 확장 | `wasEditing: boolean` 필드 추가 | `resolveClick.ts:18-26` |
| WP1-b: `resolveClick` 분기 추가 | `wasEditing && new item → OS_ACTIVATE` (Line 51 앞에 삽입) | `resolveClick.ts:51` |
| WP1-c: `simulateClick` 전달 | `preMousedownEditingItemId` 읽어 `wasEditing`으로 전달 | `headless.ts:230,253` |
| WP1-d: `MouseListener` 동기화 | 브라우저 리스너에서도 동일 로직 | `MouseListener.ts` (확인 필요) |
| WP2: 기존 동작 유지 검증 | drillDown이 item→edit, non-item→focus 올바르게 분기 | `hierarchicalNavigation.ts:96-98` |

## Residual Uncertainty

- `MouseListener` (브라우저 환경)에서 editing 상태를 `resolveClick`에 전달하는 경로 — headless는 `simulateClick`에서 직접 읽지만, 브라우저 리스너는 DOM event에서 kernel state를 읽어야 함. 동일 패턴으로 가능하나 코드 확인 필요.
