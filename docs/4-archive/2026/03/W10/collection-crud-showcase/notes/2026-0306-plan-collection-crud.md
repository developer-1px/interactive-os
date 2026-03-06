# /plan — Collection CRUD+Clipboard+History Showcase

> 작성일: 2026-03-06
> Goal: 정규화된 데이터에 createCollectionZone 선언만으로 CRUD+clipboard+history가 자동 작동함을 4개 데이터 패턴(Listbox, Grid, Tree, Treegrid)으로 증명

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `ListboxPattern.tsx` | 정적 배열, Zone+Item 직접, CRUD 없음 | defineApp + createCollectionZone + collectionBindings + history(). add/delete/move/copy/cut/paste/undo/redo | Clear | — | headless test 9 scenarios green | 별도 zone ID로 기존 테스트 격리 |
| 2 | `GridPattern.tsx` | 정적 5x5, Zone+Item 직접, CRUD 없음 | defineApp + createCollectionZone + row CRUD + cell F2 edit + history() | Clear | — | headless test: row add/delete, cell edit, undo green | row=item, cell=Field 매핑 |
| 3 | `TreePattern.tsx` | 정적 fileTree, 읽기 전용 | defineApp + createCollectionZone(tree) + nested CRUD + clipboard + history() | Clear | — | headless test: nested delete, cross-level paste, undo green | treeUtils 구현 완료 |
| 4 | `TreegridPattern.tsx` | 정적 EMAILS, expand/collapse만 | defineApp + createCollectionZone(tree) + row CRUD + cell edit + history() | Clear | #2, #3 | headless test: row CRUD + tree expand + cell edit + undo green | #2+#3 합성 |
| 5 | `todo/app.ts` | createCollectionZone 사용 + 수동 배선 혼재 | collectionBindings() spread, 수동 배선 제거 | Clear | #1 | 기존 todo test 전체 green (regression 0) | ~40개 테스트 regression |

## 실행 순서

```
WP1 → (WP2 ∥ WP3) → WP4 → WP5
```

## 라우팅

승인 후 → /project (새 프로젝트: os-core/collection-crud-showcase)
