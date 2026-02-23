# headless-items

## 🔴 Now
- [x] T1: commands revert — navigate/select/selectAll/tab → `ctx.inject(DOM_ITEMS)` only ✅
- [x] T2: DOM_ITEMS provider (browser) — DOM 우선, getItems fallback ✅
- [x] T3: DOM_ITEMS provider (page mock) — getItems 우선, mockItems fallback ✅
- [x] T4: goto() — items 옵션 폐기, focusedItemId만 유지 ✅
  - [x] Step A: defineApp.page.ts — items 옵션 + mockItems 제거
  - [x] Step B: test-page.test.ts 마이그레이션 (items 제거)
  - [x] Step B: dialog-focus-trap.test.ts — dialog zone getItems 등록
  - [x] Step B: sidebar getItems 누락 수정 (app.ts)
  - [x] 909/909 tests GREEN
- [ ] T5: Builder canvas test — createPage(BuilderApp, CanvasView) 검증
- [x] T6: 전체 테스트 GREEN ✅

## 💡 Ideas
- [ ] Builder getItems tree-aware 보강 (pure headless unit test용)
- [ ] itemFilter DOM 의존 제거 (getItemAttribute → state-derived)
- [ ] accessor-first-cleanup 프로젝트 아카이브 (superseded)
