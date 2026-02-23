# headless-items

## 🔴 Now
- [ ] T1: commands revert — navigate/select/selectAll/tab → `ctx.inject(DOM_ITEMS)` only
- [ ] T2: DOM_ITEMS provider (browser) — DOM 우선, getItems fallback
- [ ] T3: DOM_ITEMS provider (page mock) — renderToString 우선, getItems fallback
- [ ] T4: goto() — items 옵션 폐기, focusedItemId만 유지
- [ ] T5: Builder canvas test — createPage(BuilderApp, CanvasView) 검증
- [ ] T6: 전체 테스트 GREEN

## ✅ Done

## 💡 Ideas
- [ ] Builder getItems tree-aware 보강 (pure headless unit test용)
- [ ] itemFilter DOM 의존 제거 (getItemAttribute → state-derived)
- [ ] accessor-first-cleanup 프로젝트 아카이브 (superseded)
