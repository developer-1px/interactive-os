# collection-crud-showcase

## Context

Claim: 정규화된 데이터에 createCollectionZone 선언만으로 CRUD+clipboard+history가 자동 작동한다

Before → After: APG 데이터 패턴(Listbox, Grid, Tree, Treegrid)이 정적 읽기전용 → 동적 CRUD+clipboard+undo/redo 완비

Risks: Grid cell editing + row CRUD 통합이 처음. Treegrid는 Grid+Tree 합성이므로 두 WP 선행 필요

## Now

## Next
- [ ] T5: Todo refactor — collectionBindings() spread, 수동 배선 제거

## Done
- [x] T1: Listbox Collection — tsc 0 | +10 tests | ALL GREEN ✅
- [x] T2: Grid Collection — tsc 0 | +8 tests | ALL GREEN ✅
- [x] T3: Tree Collection — tsc 0 | +7 tests | ALL GREEN ✅
- [x] T4: Treegrid Collection — tsc 0 | +8 tests | ALL GREEN ✅

## Unresolved

## Ideas
- drag reorder showcase (OS_DRAG 커맨드 미사용 상태)
- Feed pattern에 load-more/remove collection 적용
