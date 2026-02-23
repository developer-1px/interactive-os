# BOARD — normalized-collection

## Now
(empty — all tasks complete)

## Next
(empty)

## Done
- [x] T1: NormalizedCollection 타입 + helper 함수 — 13 tests GREEN ✅
- [x] T2: fromNormalized 어댑터 (fromEntities와 별도) — 6 tests GREEN ✅
- [x] T3: Tree-aware ItemOps (재귀 삭제, 형제 swap, parent-aware insert) — fromNormalized에 포함 ✅
- [x] T4: View Transform 모듈 (toFlatList, toVisibleTree, toGrouped) — 12 tests GREEN ✅
- [x] T5: normalizeDocTree() — DocItem[] → NormalizedCollection<DocEntity> boundary fn ✅
- [x] T6: Todo 호환성 확인 — fromEntities + string[] order 변경 zero, 92 tests GREEN ✅

> ⚠️ Pre-existing regression: `tree.apg.ui.test.tsx` 3 tests — TreePattern.tsx 이전 세션 리팩토링 원인. normalized-collection 무관.

## Next
(empty — all tasks in Now or Done)

## Done
- [x] T1: NormalizedCollection 타입 + helper 함수 — 13 tests GREEN ✅
- [x] T2: fromNormalized 어댑터 (fromEntities와 별도) — 6 tests GREEN ✅
- [x] T3: Tree-aware ItemOps (재귀 삭제, 형제 swap, parent-aware insert) — fromNormalized에 포함 ✅

## Ideas
- 역인덱스 `childToParent: Record<string, string>` — O(1) parent lookup
- Builder blocks 마이그레이션
- Kanban app PoC (같은 collection을 Board/List 두 가지 view로)
