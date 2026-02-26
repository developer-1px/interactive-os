# BOARD — normalized-collection

## Now
(없음 — 모든 태스크 완료)

## Done
- [x] T1: NormalizedCollection 타입 + helper 함수 — 13 tests GREEN ✅
- [x] T2: fromNormalized 어댑터 (fromEntities와 별도) — 6 tests GREEN ✅
- [x] T3: Tree-aware ItemOps (재귀 삭제, 형제 swap, parent-aware insert) — fromNormalized에 포함 ✅
- [x] T4: View Transform 모듈 (toFlatList, toVisibleTree, toGrouped) — 12 tests GREEN ✅
- [x] T5: normalizeDocTree() — DocItem[] → NormalizedCollection<DocEntity> boundary fn ✅
- [x] T6: Todo 호환성 확인 — fromEntities + string[] order 변경 zero, 92 tests GREEN ✅
- [x] T7: tree-ops/tree-paste fixture 수정 — 전용 TREE_TEST_BLOCKS fixture 생성. 21 FAIL → 0 FAIL. tsc 0 | 109 tests GREEN ✅

## Unresolved
- tree.apg.ui.test.tsx 3 tests — TreePattern.tsx 이전 세션 리팩토링 원인. normalized-collection 무관.

## Ideas
- 역인덱스 `childToParent: Record<string, string>` — O(1) parent lookup
- Builder blocks 마이그레이션
- Kanban app PoC (같은 collection을 Board/List 두 가지 view로)
