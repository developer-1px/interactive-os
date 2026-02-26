# headless-item-discovery

## Context

Claim: 아이템 발견을 Push 100%로 전환. 2-contexts의 querySelectorAll 전부 제거. DOM 스캔은 제거하지 않고 올바른 레이어(6-components/FocusGroup)로 이동.

Before → After:
- Before: `2-contexts/index.ts`가 `element.querySelectorAll("[data-item-id]")`로 아이템 목록을 DOM에서 Pull.
- After: `2-contexts` DOM 0%. FocusGroup.useLayoutEffect가 DOM-scanning getItems를 ZoneRegistry에 자동 등록. createOsPage.goto()도 자동 등록. 수동 getItems 주입 불필요.

Risks:
- 2D 그리드 네비게이션의 Rect 시뮬레이션 정밀도

## Now

## Done
- [x] T10: regression 수정 — virtualFocus.test.ts getItems 추가 — regression 0 | +8 tests 개선 (21→13 failures) ✅
- [x] T9: createOsPage.goto() — getItems를 ZoneRegistry에 자동 등록 — tsc 0 ✅
- [x] T8: FocusGroup — useLayoutEffect에서 DOM-scanning getItems를 ZoneRegistry에 자동 등록 — tsc 0 ✅
- [x] T5: DOM_TREE_LEVELS — DOM fallback 제거 — tsc 0 ✅
- [x] T4: DOM_EXPANDABLE_ITEMS — DOM fallback 제거 — tsc 0 ✅
- [x] T3: getZoneItems — DOM querySelectorAll → getItems() — tsc 0 | +6 tests (T1-T3) | regression 0 ✅
- [x] T2: DOM_ZONE_ORDER — DOM fallback + safety net 삭제. getItems() only — tsc 0 ✅
- [x] T1: DOM_ITEMS — DOM querySelectorAll 제거. getItems() sole source — tsc 0 ✅

## Unresolved

## Ideas
- T6: DOM_RECTS — getRects() accessor 추가 (후속 프로젝트)
- T7: typeahead labels — getLabels() accessor (후속 프로젝트)
- `useLayoutEffect` 사용을 6-components 레이어에서 ESLint rule로 제한
