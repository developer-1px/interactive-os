# /plan — TestPage Playwright Isomorphism

> Discussion Clear: TestPage locator는 `#id` CSS selector 문법을 채택하고, ZIFT 컴포넌트는 DOM `id`를 렌더링하여 headless/Playwright 양쪽에서 같은 테스트 코드가 동작한다.

## 변환 명세표

### WP-DATA-ATTR: `data-item-id` 제거 + `data-focus-item` -> `data-item` (20건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 1 | `headless.types.ts:39-40` | `"data-focus-item"?: true; "data-item-id"?: string` | `"data-item"?: true` | Clear | -- | tsc 0 |
| 2 | `compute.ts:84-85` | `"data-focus-item": true, "data-item-id": itemId` | `"data-item": true` | Clear | ->1 | tests |
| 3 | `itemQueries.ts` 6곳 | `querySelector('[data-item-id="${id}"]')`, `getAttribute("data-item-id")` | `querySelector('#'+CSS.escape(id))`, `el.id` | Clear | ->2 | tests |
| 4 | `3-inject/index.ts` 4곳 | `querySelectorAll("[data-item-id]")`, `getAttribute("data-item-id")` | `querySelectorAll("[data-item]")`, `el.id` | Clear | ->2 | tests |
| 5 | `senseMouse.ts:242,249` | `querySelectorAll("[data-item-id]")`, fallback | `querySelectorAll("[data-item]")`, `el.id` | Clear | ->2 | tests |
| 6 | `senseKeyboard.ts:27` | `closest("[data-item-id]")` | `closest("[data-item]")` | Clear | ->2 | tests |
| 7 | `domQuery.ts:22` | `closest("[data-item-id]")` | `closest("[data-item]")` | Clear | ->2 | tests |
| 8 | `typeaheadFallbackMiddleware.ts:29` | `querySelectorAll("[data-item-id]")` | `querySelectorAll("[data-item]")` | Clear | ->2 | tests |
| 9 | `fieldKeyOwnership.ts:150` | `getAttribute("data-item-id")` | `el.id` | Clear | ->2 | tests |
| 10 | `zoneRegistry.ts:250-267` 4곳 | `querySelectorAll("[data-item-id]")`, `getAttribute(...)` | `querySelectorAll("[data-item]")`, `el.id` | Clear | ->2 | tests |
| 11 | `PointerListener.tsx:71,355,378` | `getAttribute("data-item-id")` | `el.id` | Clear | ->2 | tests |
| 12 | `createBrowserPage.ts:93` | `querySelector('[data-item-id="${id}"]')` | `querySelector('#'+CSS.escape(id))` | Clear | ->2 | tests |
| 13 | `src/index.css:11,19,25,41-42` | `[data-item-id]`, `[data-focus-item]` | `[data-item]` | Clear | ->2 | visual |
| 14 | `InspectedElementStore.ts:190,194` | `closest("[data-item-id]")`, `getAttribute(...)` | `closest("[data-item]")`, `el.id` | Clear | ->2 | -- |
| 15 | `QuickPick.tsx:225,227` | `querySelector("[data-item-id]")`, `getAttribute(...)` | `querySelector("[data-item]")`, `el.id` | Clear | ->2 | -- |
| 16 | `docs-viewer/register.ts:136` | `querySelector("[data-item-id]")` | `querySelector("[data-item]")` | Clear | ->2 | -- |
| 17 | `testbot-docs.ts` 12곳 | `querySelector/All("[data-item-id]")`, `getAttribute(...)` | `querySelector/All("[data-item]")`, `el.id` | Clear | ->2 | -- |
| 18 | e2e tests ~15곳 | `locator("[data-item-id]")` | `locator("[data-item]")` | Clear | ->2 | e2e pass |
| 19 | unit tests ~15곳 | `setAttribute("data-item-id", id)` | `el.id = id; el.setAttribute("data-item", "")` | Clear | ->2 | vitest pass |
| 20 | docs ~5곳 | `data-item-id` 언급 | `id` + `data-item` | Clear | ->2 | -- |

### WP-LOCATOR: `#id` 파싱 + assertions + inputValue (7건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 21 | `createOsPage.ts` OsLocator | `locator(elementId: string)` | `locator(selector: string)` -- `#` strip | Clear | -- | +1 test |
| 22 | `page.ts:352` locator impl | bare ID | `#` prefix strip + bare ID 호환 | Clear | ->21 | +1 test |
| 23 | `createHeadlessPage.ts` wrapper | bare ID | `#` prefix strip | Clear | ->21 | +1 test |
| 24 | OsLocator assertions | `toBeFocused()` only | + toBeSelected/Expanded/Checked/Pressed/Disabled/Current | Clear | -- | +6 tests |
| 25 | `createHeadlessPage.ts` async | 2 assertions | + 6 async assertions | Clear | ->24 | +6 tests |
| 26 | `types.ts` LocatorAssertions | 2 methods | + 6 methods | Clear | ->24 | tsc 0 |
| 27 | OsLocator `inputValue()` | 없음 | `inputValue(): string` via FieldRegistry | Clear | -- | +1 test |

### WP-FIELD-EDITING: isEditing headless (3건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 28 | `headless.types.ts` ItemAttrs | editing 없음 | `"data-editing"?: true` | Clear | -- | tsc 0 |
| 29 | `compute.ts` computeItem | editing 미투영 | `editingItemId === itemId` 시 `"data-editing": true` | Clear | ->28 | +1 test |
| 30 | OsLocator assertion | 없음 | `toBeEditing(): boolean` | Clear | ->29 | +1 test |

## Summary

- 총 30행. 전행 Clear.
- WP-DATA-ATTR: 20행 (기계적 치환, 고위험 없음)
- WP-LOCATOR: 7행 (기능 추가)
- WP-FIELD-EDITING: 3행 (기능 추가)
- 예상 신규 테스트: +16건
- 기존 테스트: regression 0 목표

## 라우팅

승인 후 -> `/go` (headless-simulator) -- BOARD에 WP 3건을 T20-T22로 추가 후 실행
