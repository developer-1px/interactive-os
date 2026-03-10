# Task Map — page-contract-split: Design-First Rewrite

> 원칙: "Playwright subset에 없으면 삭제". 마이그레이션 금지, 삭제→재작성.

## Task Map

| # | Task | Before | After | 크기 | 의존 | 검증 | 상태 |
|---|------|--------|-------|------|------|------|------|
| 1 | `page.ts` — Page 인터페이스에 `content()` 추가 | `html()` 메서드만 존재 (비표준) | `locator` + `content()` in Page interface (`types.ts`). headless에서 `renderToString` 반환 | S | — | tsc 0 | ⬜ |
| 2 | `page.ts` — `setupZone` 함수 + goto의 setupZone 참조 제거 | `setupZone()` 296-393행 + goto 에러 메시지에 `setupZone` 참조 | `setupZone` 함수 삭제. goto 에러 메시지에서 참조 제거 | S | — | tsc 0 | ⬜ |
| 3 | `page.ts` — God Object 반환에서 non-Playwright 메서드 제거 | 657-874행: `attrs`, `focusedItemId`, `selection`, `activeZoneId`, `state`, `kernel`, `dispatch`, `reset`, `query`, `html`, `getDOMElement` in return object | return object에서 Playwright subset만 유지: `goto`, `click`, `keyboard`, `locator`, `content` (cleanup 유지) | M | →T1, →T2 | tsc 0 | ⬜ |
| 4 | `page.ts` — `createHeadlessPage` 삭제 + `AppPageInternal` 타입 re-export 삭제 | L926-936 deprecated `createHeadlessPage`, L878 `AppPageInternal` re-export | 함수 삭제, re-export 삭제 | S | →T3 | tsc 0 | ⬜ |
| 5 | `index.ts` — `createHeadlessPage` export 제거 | L29 `export { createHeadlessPage, createPage }` | `export { createPage }` only | S | →T4 | tsc 0 | ⬜ |
| 6 | `runScenarios.ts` — `createHeadlessPage` → `createPage` 전환 | L23,48 `createHeadlessPage` import + 사용 | `createPage` 사용, `{ page, cleanup }` 디스트럭처 | S | →T5 | tsc 0 + vitest PASS (runScenarios 사용 테스트) | ⬜ |
| 7 | `contracts.ts` — 삭제 후 재작성 (3경계) | `Factory = () => AppPageInternal`, `t.focusedItemId()`, `t.attrs()`, `t.selection()`, `t.activeZoneId()`, `t.dispatch()` | `Factory = () => { page: Page; cleanup: () => void }`, `readFocusedItemId(os)`, `computeAttrs(os, id)`, `readSelection(os, zId)` 직접 사용 | M | →T5 | tsc 0 | ⬜ |
| 8 | APG 테스트 삭제→재작성: contracts 의존 9개 | combobox, dialog, listbox, menu, toolbar, tree, treegrid, carousel, feed — `createHeadlessPage` + `setupZone` + contracts Factory | `createPage` + `page.goto()` + 새 contracts Factory. 시나리오(WHAT)만 보존 | M | →T7 | tsc 0 + vitest PASS | ⬜ |
| 9 | APG 테스트 삭제→재작성: setupZone 의존 4개 | disallow-empty-initial, dropdown-menu, menu-button, navtree — `setupZone` 직접 사용 | defineApp test fixture + `createPage` + `page.goto()` | M | →T5 | tsc 0 + vitest PASS | ⬜ |
| 10 | Todo 테스트 삭제→재작성: 3파일 | todo.test, todo-bug-hunt, todo-trigger-click — `dispatch`(74) + `state`(115) + `page.html()` | `TodoApp.dispatch()` + `os.getState().apps.todo` + `page.content()` | M | →T1,→T5 | tsc 0 + vitest PASS | ⬜ |
| 11 | docs-viewer 테스트 전환: 2파일 | docs-viewer-headless, docs-search-overlay — `createHeadlessPage` + `page.html()` | `createPage` + `page.content()` | S | →T1,→T5 | tsc 0 + vitest PASS | ⬜ |

## MECE 점검

1. **CE**: T1-T6 = 인프라 정리, T7 = contracts 재작성, T8-T11 = 테스트 재작성 → 종료 조건 3개 모두 0 달성 ✅
2. **ME**: T8과 T9는 분리 (contracts 의존 vs setupZone만 의존) ✅
3. **No-op**: 없음 ✅
4. **L 없음**: 전부 S 또는 M ✅
