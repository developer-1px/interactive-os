# Kernel Items — BOARD

## 🔴 Now

(empty — all tasks complete)

## ✅ Done

- [x] Discussion 완료 — `discussions/2026-0222-2031-focus-recovery-composition.md`
- [x] Scaffold (README + BOARD + PRD)
- [x] **T1: Zone item accessor 등록** ✅
  - ZoneEntry에 `getItems?: () => string[]` 추가
  - FocusGroup → Zone → defineApp.bind → createCollectionZone 전체 체인 관통
  - collectionBindings()에서 `ops.getItems(appState)` 자동 전달
- [x] **T3: applyFocusPop lazy resolve** ✅
  - `resolveItemFallback(targetId, items, hint)` 유틸
  - FocusStackEntry에 `index` 필드 (push 저장, pop 사용)
  - stale focusedItemId → 이웃(idx→clamp→null) 자동 이동
- [x] **T4: confirmDeleteTodo 간소화** ✅
  - 수동 neighbor 계산 8행 + OS_FOCUS dispatch + import 제거
- [x] **E1: remove/cut 수동 포커스 복구 통합** ✅
  - `computeDeleteFocus` 공유 헬퍼 — resolveItemFallback 활용
  - remove: 30행 → 3행, cut: 40행 → 3행
- [x] **E2: OS_NAVIGATE getItems 전환** ✅
  - `ctx.inject(DOM_ITEMS)` → `ZoneRegistry.getItems()` 우선, DOM 폴백
- [x] **E3: DOM_EXPANDABLE_ITEMS accessor** ✅
  - ZoneEntry에 `getExpandableItems?: () => Set<string>` 추가
  - DOM_EXPANDABLE_ITEMS context에서 accessor 우선 사용
- [x] **E4: DOM_TREE_LEVELS accessor** ✅
  - ZoneEntry에 `getTreeLevels?: () => Map<string, number>` 추가
  - DOM_TREE_LEVELS context에서 accessor 우선 사용
- [x] **E5: DOM_ZONE_ORDER 전환** ✅
  - ZoneRegistry에 `orderedKeys()` 등록 순서 추적
  - DOM_ZONE_ORDER에서 registry 우선, DOM 폴백
- [x] **E6: headless mock 정리** ✅
  - createOsPage 모든 context: accessor-first, mock-fallback
  - defineApp.page에서 getItems/getExpandableItems/getTreeLevels 전달

## 📊 최종 결과

| 지표 | Before | After |
|------|--------|-------|
| querySelectorAll 필수 경로 | 5개 context | 1개 (DOM_RECTS — 기하 정보) |
| 수동 포커스 복구 행수 | 68행 (3곳) | 0행 |
| 테스트 | 793/796 GREEN | 793/796 GREEN (3 pre-existing) |
| 앱 테스트 | 155/155 GREEN | 155/155 GREEN |

## 💡 Ideas

- DOM_RECTS accessor (spatial nav에만 필요, 현재 DOM 읽기가 정당)
- DOM_ITEMS context 완전 제거 (모든 zone에 getItems 등록 완료 시)
- computeDeleteFocus를 OS 미들웨어로 승격 (앱 코드에서 OS_FOCUS 0개 목표)

## 📎 References

- Discussion: `discussions/2026-0222-2031-focus-recovery-composition.md`
- Blueprint: `docs/1-project/kernel-items/blueprint-dom-context-elimination.md`
- Flutter FocusScopeNode: https://api.flutter.dev/flutter/widgets/FocusScopeNode-class.html
- W3C APG Dialog Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
